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

// Build session policies from manifest
const buildPoliciesFromManifest = (manifest: any, namespace: string, includeVrf: boolean = false): SessionPolicies => {
  const getAddress = (name: string): string | undefined => 
    getContractByName(manifest, namespace, name)?.address;

  const gameSystem = getAddress("game_system");
  const shopSystem = getAddress("shop_system");
  const questSystem = getAddress("quest_system");

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

  // Game System
  if (gameSystem) {
    contracts[gameSystem] = {
      description: "zKube Game System - Create and manage games",
      methods: [
        {
          name: "Mint Game",
          description: "Mint a new game NFT",
          entrypoint: "mint_game",
        },
        {
          name: "Create Game",
          description: "Start a new game with your NFT",
          entrypoint: "create",
        },
        {
          name: "Create Game with Cubes",
          description: "Start a game bringing cubes from your wallet",
          entrypoint: "create_with_cubes",
        },
        {
          name: "Surrender",
          description: "Forfeit the current game",
          entrypoint: "surrender",
        },
        {
          name: "Move",
          description: "Move blocks on the grid",
          entrypoint: "move",
        },
        {
          name: "Apply Bonus",
          description: "Use a bonus ability (Hammer, Wave, Totem)",
          entrypoint: "apply_bonus",
        },
        {
          name: "Refresh Metadata",
          description: "Refresh the NFT metadata",
          entrypoint: "refresh_metadata",
        },
      ],
    };
  }

  // Shop System
  if (shopSystem) {
    contracts[shopSystem] = {
      description: "zKube Shop System - Upgrades and purchases",
      methods: [
        {
          name: "Purchase Consumable",
          description: "Buy a consumable from the in-game shop",
          entrypoint: "purchase_consumable",
        },
        {
          name: "Upgrade Starting Bonus",
          description: "Upgrade your starting bonus count",
          entrypoint: "upgrade_starting_bonus",
        },
        {
          name: "Upgrade Bag Size",
          description: "Increase your bonus bag capacity",
          entrypoint: "upgrade_bag_size",
        },
        {
          name: "Upgrade Bridging Rank",
          description: "Increase max cubes you can bring to games",
          entrypoint: "upgrade_bridging_rank",
        },
        {
          name: "Unlock Bonus",
          description: "Unlock a new bonus type",
          entrypoint: "unlock_bonus",
        },
        {
          name: "Level Up Bonus",
          description: "Level up an existing bonus",
          entrypoint: "level_up_bonus",
        },
      ],
    };
  }

  // Quest System
  if (questSystem) {
    contracts[questSystem] = {
      description: "zKube Quest System - Daily quests and rewards",
      methods: [
        {
          name: "Claim Quest",
          description: "Claim rewards for completed quests",
          entrypoint: "claim",
        },
      ],
    };
  }

  return { contracts };
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
