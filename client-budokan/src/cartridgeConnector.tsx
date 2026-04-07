import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type {
  ControllerOptions,
  SessionPolicies,
  AuthOptions,
} from "@cartridge/controller";
import { shortString } from "starknet";
import { createLogger } from "@/utils/logger";

import manifestSlot from "../../contracts/manifest_slot.json";
import manifestSepolia from "../../contracts/manifest_sepolia.json";
import manifestMainnet from "../../contracts/manifest_mainnet.json";

const log = createLogger("cartridgeConnector");
const CONTROLLER_SESSION_VERSION = "4";

const {
  VITE_PUBLIC_DEPLOY_TYPE,
  VITE_PUBLIC_SLOT,
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_NAMESPACE,
} = import.meta.env;

function clearControllerStorage() {
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

  if (typeof indexedDB !== "undefined") {
    indexedDB.databases?.().then((dbs) => {
      for (const db of dbs) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          log.info("Deleted IndexedDB:", db.name);
        }
      }
    }).catch(() => {
      for (const name of ["@cartridge", "controller", "keyval-store"]) {
        try { indexedDB.deleteDatabase(name); } catch { /* noop */ }
      }
    });
  }
}

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

function migrateControllerSessions() {
  try {
    const storedVersion = localStorage.getItem("controllerSessionVersion");
    const storedDeployType = localStorage.getItem("controllerDeployType");
    const storedFingerprint = localStorage.getItem("controllerSessionFingerprint");
    const currentDeployType = VITE_PUBLIC_DEPLOY_TYPE || "mainnet";
    const currentFingerprint = connectorConfig.sessionFingerprint;

    const versionChanged = storedVersion !== CONTROLLER_SESSION_VERSION;
    const deployTypeChanged = storedDeployType !== currentDeployType;
    const fingerprintChanged = storedFingerprint !== currentFingerprint;

    if (!versionChanged && !deployTypeChanged && !fingerprintChanged) return;

    const reason = deployTypeChanged
      ? `deploy type changed: ${storedDeployType} → ${currentDeployType}`
      : versionChanged
        ? `version: ${storedVersion} → ${CONTROLLER_SESSION_VERSION}`
        : "connector configuration changed";

    log.info("Clearing Controller sessions", {
      reason,
    });

    clearControllerStorage();

    localStorage.setItem("controllerSessionVersion", CONTROLLER_SESSION_VERSION);
    localStorage.setItem("controllerDeployType", currentDeployType);
    localStorage.setItem("controllerSessionFingerprint", currentFingerprint);
  } catch (e) {
    log.warn("Session migration skipped", e);
  }
}

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

const CHAIN_IDS = {
  mainnet: "SN_MAIN",
  sepolia: "SN_SEPOLIA",
  slot: VITE_PUBLIC_SLOT
    ? `WP_${VITE_PUBLIC_SLOT.toUpperCase().replace(/-/g, "_")}`
    : "WP_ZKUBE",
} as const;

const RPC_URLS = {
  mainnet: "https://api.cartridge.gg/x/starknet/mainnet",
  sepolia: "https://api.cartridge.gg/x/starknet/sepolia",
};

const SLOTS = {
  mainnet: "zkube-ba-mainnet",
  sepolia: "zkube-djizus-sepolia",
  slot: VITE_PUBLIC_SLOT || "zkube",
};

const VRF_ADDRESS =
  "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F";

const EXCLUDED_SYSTEMS = ["renderer_systems"];
const INTERNAL_SYSTEMS = ["config_system", "grid_system"];

const ADDITIONAL_ENTRYPOINTS: Record<string, string[]> = {
  game_system: ["mint_game"],
  level_system: ["start_next_level"],
  config_system: ["purchase_zone_access", "unlock_zone_with_stars"],
};

const buildPoliciesFromManifest = (
  manifest: DojoManifest,
  _namespace: string,
  includeVrf = false
): SessionPolicies => {
  const contractsUnsorted: Array<{
    address: string;
    policy: {
      description: string;
      methods: Array<{ name: string; entrypoint: string }>;
    };
  }> = [];

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

  for (const contract of manifest.contracts) {
    const systemName = contract.tag.split("-").pop() || "";

    if (EXCLUDED_SYSTEMS.includes(systemName)) {
      continue;
    }

    const userEntrypoints = contract.systems.filter((entrypoint: string) => {
      if (["dojo_init", "upgrade"].includes(entrypoint)) {
        return false;
      }
      if (INTERNAL_SYSTEMS.includes(systemName)) {
        return false;
      }
      return true;
    });

    const additionalEntrypoints = ADDITIONAL_ENTRYPOINTS[systemName] || [];
    const allEntrypoints = [...userEntrypoints, ...additionalEntrypoints];

    if (allEntrypoints.length === 0) {
      continue;
    }

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

  contractsUnsorted.sort((a, b) => a.address.localeCompare(b.address));

  const contracts: SessionPolicies["contracts"] = {};
  for (const { address, policy } of contractsUnsorted) {
    contracts[address] = policy;
  }

  return { contracts };
};

const formatEntrypointName = (entrypoint: string): string => {
  return entrypoint
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatSystemName = (systemName: string): string => {
  return systemName
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

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
  sessionFingerprint: string;
};

const buildSessionFingerprint = (
  deployType: DeployType,
  manifest: DojoManifest,
  chainId: string,
  slot: string,
  chains: Array<{ rpcUrl: string }>,
  policies: SessionPolicies,
) => {
  const manifestSignature = manifest.contracts
    .map((contract) => ({
      address: contract.address,
      tag: contract.tag,
      systems: [...contract.systems].sort(),
    }))
    .sort((a, b) => a.tag.localeCompare(b.tag));

  return stableStringify({
    deployType,
    slot,
    chainId,
    namespace: VITE_PUBLIC_NAMESPACE,
    nodeUrl: VITE_PUBLIC_NODE_URL,
    chains,
    manifest: manifestSignature,
    policies,
  });
};

const getConfig = (): ConnectorConfig => {
  const deployType = (VITE_PUBLIC_DEPLOY_TYPE as DeployType) || "mainnet";
  const namespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";
  const manifest = getManifest(deployType);

  switch (deployType) {
    case "sepolia":
      {
        const chainId = CHAIN_IDS.sepolia;
        const slot = SLOTS.sepolia;
        const policies = buildPoliciesFromManifest(manifest, namespace, true);
        const chains = [{ rpcUrl: RPC_URLS.sepolia }, { rpcUrl: RPC_URLS.mainnet }];

        return {
          chainId,
          slot,
          policies,
          chains,
          sessionFingerprint: buildSessionFingerprint(deployType, manifest, chainId, slot, chains, policies),
        };
      }
    case "slot":
      {
        const chainId = CHAIN_IDS.slot;
        const slot = SLOTS.slot;
        const policies = buildPoliciesFromManifest(manifest, namespace, false);
        const chains = [
          ...(VITE_PUBLIC_NODE_URL ? [{ rpcUrl: VITE_PUBLIC_NODE_URL }] : []),
          { rpcUrl: RPC_URLS.sepolia },
          { rpcUrl: RPC_URLS.mainnet },
        ];

        return {
          chainId,
          slot,
          policies,
          chains,
          sessionFingerprint: buildSessionFingerprint(deployType, manifest, chainId, slot, chains, policies),
        };
      }
    case "mainnet":
    default:
      {
        const chainId = CHAIN_IDS.mainnet;
        const slot = SLOTS.mainnet;
        const policies = buildPoliciesFromManifest(manifest, namespace, true);
        const chains = [{ rpcUrl: RPC_URLS.mainnet }, { rpcUrl: RPC_URLS.sepolia }];

        return {
          chainId,
          slot,
          policies,
          chains,
          sessionFingerprint: buildSessionFingerprint(deployType, manifest, chainId, slot, chains, policies),
        };
      }
  }
};

const signupOptions: AuthOptions = ["google", "discord", "webauthn", "password"];

const createConnector = (config: ConnectorConfig): Connector => {
  const options: ControllerOptions = {
    chains: config.chains,
    defaultChainId: stringToFelt(config.chainId).toString(),
    namespace: VITE_PUBLIC_NAMESPACE,
    slot: config.slot,
    policies: config.policies,
    signupOptions,
  };

  return new ControllerConnector(options) as unknown as Connector;
};

const connectorConfig = getConfig();

if (typeof window !== "undefined") {
  migrateControllerSessions();
}

log.info("Configuration", {
  deployType: VITE_PUBLIC_DEPLOY_TYPE,
  chainId: connectorConfig.chainId,
  chainIdFelt: stringToFelt(connectorConfig.chainId).toString(),
  slot: connectorConfig.slot,
  namespace: VITE_PUBLIC_NAMESPACE,
  chains: connectorConfig.chains.map((c) => c.rpcUrl),
  hasPolicies: !!connectorConfig.policies,
  policyContracts: connectorConfig.policies
    ? Object.keys(connectorConfig.policies.contracts ?? {})
    : [],
  signupOptions,
});

export const cartridgeConnector: Connector | null =
  typeof window !== "undefined"
    ? createConnector(connectorConfig)
    : null;

export default cartridgeConnector;
