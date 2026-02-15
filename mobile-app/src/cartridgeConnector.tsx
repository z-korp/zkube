import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions, SessionPolicies, AuthOptions } from "@cartridge/controller";
import { shortString } from "starknet";

// Platform detection for native app support
import { isNative, isNativeAndroid, DEEP_LINK_URL } from "./utils/capacitorUtils";
import SessionConnectorWrapper from "./dojo/connectorWrapper";
import { createLogger } from "@/utils/logger";

const log = createLogger("cartridgeConnector");

// Bump when Controller SDK session format changes (v1=0.10.x, v2=0.13.5+)
const CONTROLLER_SESSION_VERSION = "2";

function migrateControllerSessions() {
  try {
    const storedVersion = localStorage.getItem("controllerSessionVersion");
    if (storedVersion === CONTROLLER_SESSION_VERSION) return;

    const sessionStr = localStorage.getItem("session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (!session.guardianKeyGuid || !session.metadataHash || !session.sessionKeyGuid) {
          log.info("Clearing legacy Controller session (missing GUID fields)");
        }
      } catch {
        log.info("Clearing unparseable Controller session");
      }
    }

    localStorage.removeItem("sessionSigner");
    localStorage.removeItem("session");
    localStorage.removeItem("sessionPolicies");
    localStorage.removeItem("lastUsedConnector");

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("@cartridge/")) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem("controllerSessionVersion", CONTROLLER_SESSION_VERSION);
    log.info("Controller session migration complete", {
      from: storedVersion ?? "none",
      to: CONTROLLER_SESSION_VERSION,
    });
  } catch (e) {
    log.warn("Session migration skipped", e);
  }
}

if (typeof window !== "undefined") {
  migrateControllerSessions();
}

const { 
  VITE_PUBLIC_DEPLOY_TYPE, 
  VITE_PUBLIC_SLOT, 
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_NAMESPACE,
} = import.meta.env;

export const stringToFelt = (v: string) =>
  v ? shortString.encodeShortString(v) : "0x0";

type DeployType = "mainnet" | "sepolia" | "slot";

type DojoManifest = {
  contracts: Array<{
    address: string;
    tag: string;
    systems: string[];
  }>;
};

// Chain IDs
const CHAIN_IDS = {
  mainnet: "SN_MAIN",
  sepolia: "SN_SEPOLIA",
  slot: VITE_PUBLIC_SLOT 
    ? `WP_${VITE_PUBLIC_SLOT.toUpperCase().replace(/-/g, "_")}` 
    : "WP_ZKUBE",
} as const;

// RPC URLs
const RPC_URLS = {
  mainnet: "https://api.cartridge.gg/x/starknet/mainnet",
  sepolia: "https://api.cartridge.gg/x/starknet/sepolia",
};

// Slot names for Cartridge
const SLOTS = {
  mainnet: "zkube-ba-mainnet",
  sepolia: "zkube-djizus-sepolia",
  slot: VITE_PUBLIC_SLOT || "zkube",
};

// VRF Provider address (same for Sepolia and Mainnet, not available on Slot)
const VRF_ADDRESS = "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F";

// Systems to exclude from policies (internal systems not called by users)
const EXCLUDED_SYSTEMS = ["renderer_systems"];

// Systems that should only include 'upgrade' entrypoint (internal)
const INTERNAL_SYSTEMS = ["config_system", "grid_system", "level_system"];

// Additional entrypoints not in manifest.systems but needed for gameplay
// (e.g., from MinigameComponent interface)
const ADDITIONAL_ENTRYPOINTS: Record<string, string[]> = {
  "game_system": ["mint_game"],
};

// Build session policies from manifest - includes ALL contracts
// CRITICAL: Policies MUST be sorted alphabetically (both contract addresses AND methods)
const buildPoliciesFromManifest = (manifest: DojoManifest, namespace: string, includeVrf: boolean = false): SessionPolicies => {
  // Collect all contracts with their policies first (unsorted)
  const contractsUnsorted: Array<{ address: string; policy: { description: string; methods: Array<{ name: string; entrypoint: string }> } }> = [];

  // VRF Provider (only for Sepolia/Mainnet)
  if (includeVrf) {
    contractsUnsorted.push({
      address: VRF_ADDRESS,
      policy: {
        description: "Cartridge VRF - Random number generation",
        methods: [
          {
            name: "Request Random",
            entrypoint: "request_random",
          },
        ],
      },
    });
  }

  // Iterate through ALL contracts in the manifest
  for (const contract of manifest.contracts) {
    // Extract system name from tag (e.g., "zkube_budo_v1_2_0-game_system" -> "game_system")
    const systemName = contract.tag.split("-").pop() || "";
    
    // Skip excluded systems
    if (EXCLUDED_SYSTEMS.includes(systemName)) {
      continue;
    }

    // Filter out internal entrypoints
    const userEntrypoints = (contract.systems as string[]).filter((entrypoint: string) => {
      // Always exclude these internal entrypoints
      if (["dojo_init", "upgrade"].includes(entrypoint)) {
        return false;
      }
      // For internal systems, exclude all entrypoints
      if (INTERNAL_SYSTEMS.includes(systemName)) {
        return false;
      }
      return true;
    });

    // Add any additional entrypoints for this system (e.g., from MinigameComponent)
    const additionalEntrypoints = ADDITIONAL_ENTRYPOINTS[systemName] || [];
    const allEntrypoints = [...userEntrypoints, ...additionalEntrypoints];

    // Skip if no user-facing entrypoints
    if (allEntrypoints.length === 0) {
      continue;
    }

    // Build methods array for this contract - SORTED ALPHABETICALLY by entrypoint
    const methods = allEntrypoints
      .map((entrypoint: string) => ({
        name: formatEntrypointName(entrypoint),
        entrypoint,
      }))
      .sort((a, b) => a.entrypoint.localeCompare(b.entrypoint));

    contractsUnsorted.push({
      address: contract.address,
      policy: {
        description: `zKube ${formatSystemName(systemName)}`,
        methods,
      },
    });
  }

  // Sort contracts alphabetically by address
  contractsUnsorted.sort((a, b) => a.address.localeCompare(b.address));

  // Build final contracts object in sorted order
  const contracts: SessionPolicies["contracts"] = {};
  for (const { address, policy } of contractsUnsorted) {
    contracts[address] = policy;
  }

  return { contracts };
};

// Helper to format entrypoint names for display
const formatEntrypointName = (entrypoint: string): string => {
  return entrypoint
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper to format system names for display
const formatSystemName = (systemName: string): string => {
  return systemName
    .replace(/_/g, " ")
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Static manifest imports — loaded at module init so connector creation is synchronous
import manifestSlot from "../../contracts/manifest_slot.json";
import manifestSepolia from "../../contracts/manifest_sepolia.json";
import manifestMainnet from "../../contracts/manifest_mainnet.json";

const getManifest = (deployType: DeployType): DojoManifest => {
  switch (deployType) {
    case "sepolia":
      return manifestSepolia as DojoManifest;
    case "slot":
      return manifestSlot as DojoManifest;
    case "mainnet":
    default:
      return manifestMainnet as DojoManifest;
  }
};

type ConnectorConfig = {
  chainId: string;
  slot: string;
  policies: SessionPolicies;
  chains: Array<{ rpcUrl: string }>;
};

const getConfig = (): ConnectorConfig => {
  const deployType = (VITE_PUBLIC_DEPLOY_TYPE as DeployType) || "mainnet";
  const namespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";
  const manifest = getManifest(deployType);
  
  switch (deployType) {
    case "sepolia":
      return {
        chainId: CHAIN_IDS.sepolia,
        slot: SLOTS.sepolia,
        policies: buildPoliciesFromManifest(manifest, namespace, true),
        chains: [
          { rpcUrl: RPC_URLS.sepolia },
          { rpcUrl: RPC_URLS.mainnet },
        ],
      };
    case "slot":
      return {
        chainId: CHAIN_IDS.slot,
        slot: SLOTS.slot,
        // Slot uses manifest-based policies, no VRF (uses pseudo-random)
        policies: buildPoliciesFromManifest(manifest, namespace, false),
        chains: [
          ...(VITE_PUBLIC_NODE_URL ? [{ rpcUrl: VITE_PUBLIC_NODE_URL }] : []),
          { rpcUrl: RPC_URLS.sepolia },
          { rpcUrl: RPC_URLS.mainnet },
        ],
      };
    case "mainnet":
    default:
      return {
        chainId: CHAIN_IDS.mainnet,
        slot: SLOTS.mainnet,
        policies: buildPoliciesFromManifest(manifest, namespace, true),
        chains: [
          { rpcUrl: RPC_URLS.mainnet },
          { rpcUrl: RPC_URLS.sepolia },
        ],
      };
  }
};

// Platform-specific signup options
// Android WebView doesn't reliably support WebAuthn/Passkeys
const signupOptions: AuthOptions = isNativeAndroid
  ? ["google", "discord", "password"]
  : ["google", "discord", "webauthn", "password"];

/**
 * Create the appropriate connector based on platform:
 * - Web: ControllerConnector (iframe-based authentication)
 * - Native: SessionConnectorWrapper (browser-based OAuth with deep link callback)
 */
const createConnector = (config: ConnectorConfig): Connector => {
  const defaultChainId = stringToFelt(config.chainId).toString();

  if (isNative) {
    // Native app: Use SessionConnector with wrapper for OAuth flow
    log.info("Creating SessionConnectorWrapper for native app");
    
    return new SessionConnectorWrapper({
      policies: config.policies,
      rpc: config.chains[0].rpcUrl,
      chainId: BigInt(defaultChainId),
      redirectUrl: DEEP_LINK_URL,
      disconnectRedirectUrl: DEEP_LINK_URL,
      signupOptions,
    }) as unknown as Connector;
  } else {
    // Web: Use standard ControllerConnector
    log.info("Creating ControllerConnector for web");
    
    const options: ControllerOptions = {
      chains: config.chains,
      defaultChainId,
      namespace: VITE_PUBLIC_NAMESPACE,
      slot: config.slot,
      policies: config.policies,
      signupOptions,
    };

    return new ControllerConnector(options) as unknown as Connector;
  }
};

const connectorConfig = getConfig();

log.info("Configuration:", {
  deployType: VITE_PUBLIC_DEPLOY_TYPE,
  chainId: connectorConfig.chainId,
  chainIdFelt: stringToFelt(connectorConfig.chainId).toString(),
  slot: connectorConfig.slot,
  namespace: VITE_PUBLIC_NAMESPACE,
  chains: connectorConfig.chains.map((c) => c.rpcUrl),
  hasPolicies: !!connectorConfig.policies,
  policyContracts: connectorConfig.policies ? Object.keys(connectorConfig.policies.contracts) : [],
  isNative,
  isNativeAndroid,
  signupOptions,
});

// On slot, skip Controller entirely — use burner account via useAccountCustom
export const cartridgeConnector: Connector | null =
  typeof window !== "undefined" && VITE_PUBLIC_DEPLOY_TYPE !== "slot"
    ? createConnector(connectorConfig)
    : null;
