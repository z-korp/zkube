import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions, SessionPolicies } from "@cartridge/controller";
import { shortString } from "starknet";

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

// Contract addresses per network
// Each system has its own contract address!
const CONTRACT_ADDRESSES = {
  sepolia: {
    vrf: "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F",
    game_system: "0x3aeb60202020a2b6a7b0ba3bbafc7f667836c2c89e07aac2a894c2b9b449d8f",
    move_system: "0x1c58c509a7c347bfa20764926185286a1d18dbf4e5db9460c884e7bcaade7",
    bonus_system: "0x6cbaf06ecf06b6daeccfc49bade313223d2bed87e470bde60e21f68ccade21a",
    shop_system: "0x19ec8605f042620d5135a521866d3a8b20efd39ee24cc52753177ed6f9202ea",
    quest_system: "0x51b40b705f5ed82d309b000ca6b0c31bae530ae4e0864cc9ebe78a7bb3f9a0e",
  },
  mainnet: {
    vrf: "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F",
    // TODO: Update these with actual mainnet addresses from manifest_mainnet.json
    game_system: "0x79c30d00719faea99297075e22fd84260f39960e14239f2018ba5d1dc1ab907",
    move_system: "0x0", // Need to get from mainnet manifest
    bonus_system: "0x0",
    shop_system: "0x0",
    quest_system: "0x0",
  },
};

// Build session policies for a given network's contracts
const buildPolicies = (addresses: typeof CONTRACT_ADDRESSES.sepolia): SessionPolicies => ({
  contracts: {
    [addresses.vrf]: {
      description: "Cartridge VRF - Random number generation",
      methods: [
        {
          name: "Request Random",
          description: "Request a verifiable random number",
          entrypoint: "request_random",
        },
      ],
    },
    [addresses.game_system]: {
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
          name: "Surrender",
          description: "Forfeit the current game",
          entrypoint: "surrender",
        },
        {
          name: "Refresh Metadata",
          description: "Refresh the NFT metadata",
          entrypoint: "refresh_metadata",
        },
      ],
    },
    [addresses.move_system]: {
      description: "zKube Move System - Make moves in the game",
      methods: [
        {
          name: "Move",
          description: "Move blocks on the grid",
          entrypoint: "move",
        },
      ],
    },
    [addresses.bonus_system]: {
      description: "zKube Bonus System - Use special abilities",
      methods: [
        {
          name: "Apply Bonus",
          description: "Use a bonus ability (Hammer, Wave, Totem)",
          entrypoint: "apply_bonus",
        },
      ],
    },
    [addresses.shop_system]: {
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
    },
    [addresses.quest_system]: {
      description: "zKube Quest System - Daily quests and rewards",
      methods: [
        {
          name: "Claim Quest",
          description: "Claim rewards for completed quests",
          entrypoint: "claim",
        },
      ],
    },
  },
});

// Get configuration based on deploy type
const getConfig = () => {
  const deployType = VITE_PUBLIC_DEPLOY_TYPE as "mainnet" | "sepolia" | "slot";
  
  switch (deployType) {
    case "sepolia":
      return {
        chainId: CHAIN_IDS.sepolia,
        slot: SLOTS.sepolia,
        policies: buildPolicies(CONTRACT_ADDRESSES.sepolia),
        chains: [
          { rpcUrl: RPC_URLS.sepolia },
          { rpcUrl: RPC_URLS.mainnet },
        ],
      };
    case "slot":
      return {
        chainId: CHAIN_IDS.slot,
        slot: SLOTS.slot,
        policies: undefined, // No policies for slot (uses burner/session keys)
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
        policies: buildPolicies(CONTRACT_ADDRESSES.mainnet),
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
  // No preset - we use custom policies
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
