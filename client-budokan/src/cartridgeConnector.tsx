import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions, SessionPolicies } from "@cartridge/controller";
import { getContractByName } from "@dojoengine/core";
import { shortString } from "starknet";

// Import manifests for each environment (same paths as config/manifest.ts)
import manifestSlot from "../../contracts/manifest_slot.json";
import manifestSepolia from "../../contracts/manifest_sepolia.json";
import manifestMainnet from "../../contracts/manifest_mainnet.json";

const { 
  VITE_PUBLIC_DEPLOY_TYPE, 
  VITE_PUBLIC_SLOT, 
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_NAMESPACE,
} = import.meta.env;

export const stringToFelt = (v: string) =>
  v ? shortString.encodeShortString(v) : "0x0";

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
const buildPoliciesFromManifest = (manifest: any, namespace: string, includeVrf: boolean = false): SessionPolicies => {
  const contracts: SessionPolicies["contracts"] = {};

  // VRF Provider (only for Sepolia/Mainnet)
  if (includeVrf) {
    contracts[VRF_ADDRESS] = {
      description: "Cartridge VRF - Random number generation",
      methods: [
        {
          name: "Request Random",
          description: "Request a verifiable random number",
          entrypoint: "request_random",
        },
      ],
    };
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

    // Build methods array for this contract
    const methods = allEntrypoints.map((entrypoint: string) => ({
      name: formatEntrypointName(entrypoint),
      entrypoint,
    }));

    contracts[contract.address] = {
      description: `zKube ${formatSystemName(systemName)}`,
      methods,
    };
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

// Get configuration based on deploy type
const getConfig = () => {
  const deployType = VITE_PUBLIC_DEPLOY_TYPE as "mainnet" | "sepolia" | "slot";
  const namespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";
  
  switch (deployType) {
    case "sepolia":
      return {
        chainId: CHAIN_IDS.sepolia,
        slot: SLOTS.sepolia,
        policies: buildPoliciesFromManifest(manifestSepolia, namespace, true),
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
        policies: buildPoliciesFromManifest(manifestSlot, namespace, false),
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
        policies: buildPoliciesFromManifest(manifestMainnet, namespace, true),
        chains: [
          { rpcUrl: RPC_URLS.mainnet },
          { rpcUrl: RPC_URLS.sepolia },
        ],
      };
  }
};

const config = getConfig();

const options: ControllerOptions = {
  chains: config.chains,
  defaultChainId: stringToFelt(config.chainId).toString(),
  namespace: VITE_PUBLIC_NAMESPACE,
  slot: config.slot,
  policies: config.policies,
};

// Debug logging
console.log("[cartridgeConnector] Configuration:", {
  deployType: VITE_PUBLIC_DEPLOY_TYPE,
  chainId: config.chainId,
  chainIdFelt: stringToFelt(config.chainId).toString(),
  slot: config.slot,
  namespace: VITE_PUBLIC_NAMESPACE,
  chains: config.chains.map(c => c.rpcUrl),
  hasPolicies: !!config.policies,
  policyContracts: config.policies ? Object.keys(config.policies.contracts) : [],
});

const cartridgeConnector = new ControllerConnector(options) as never as Connector;

export default cartridgeConnector;
