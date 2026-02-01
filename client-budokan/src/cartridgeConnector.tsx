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
  sepolia: "zkube-djizus",
  slot: VITE_PUBLIC_SLOT || "zkube",
};

// Game system addresses per network
const GAME_ADDRESSES = {
  mainnet: "0x79c30d00719faea99297075e22fd84260f39960e14239f2018ba5d1dc1ab907",
  sepolia: "0x3aeb60202020a2b6a7b0ba3bbafc7f667836c2c89e07aac2a894c2b9b449d8f",
};

// VRF provider address (same on mainnet and sepolia)
const VRF_ADDRESS = "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F";

// Build session policies for a given game address
const buildPolicies = (gameAddress: string): SessionPolicies => ({
  contracts: {
    [VRF_ADDRESS]: {
      description: "Provides verifiable random functions",
      methods: [
        {
          name: "Request Random",
          description: "Request a random number",
          entrypoint: "request_random",
        },
      ],
    },
    [gameAddress]: {
      description: "zKube Game System",
      methods: [
        {
          name: "Create Game",
          description: "Create a new zKube game",
          entrypoint: "create",
        },
        {
          name: "Surrender",
          description: "Forfeit the current game",
          entrypoint: "surrender",
        },
        {
          name: "Move",
          description: "Make a move in the current game",
          entrypoint: "move",
        },
        {
          name: "Apply Bonus",
          description: "Apply a special bonus",
          entrypoint: "apply_bonus",
        },
        {
          name: "Mint Game",
          description: "Mint a new game token",
          entrypoint: "mint_game",
        },
        {
          name: "Purchase Consumable",
          description: "Buy a consumable from the in-game shop",
          entrypoint: "purchase_consumable",
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
        policies: buildPolicies(GAME_ADDRESSES.sepolia),
        chains: [
          { rpcUrl: RPC_URLS.sepolia },
          { rpcUrl: RPC_URLS.mainnet },
        ],
      };
    case "slot":
      return {
        chainId: CHAIN_IDS.slot,
        slot: SLOTS.slot,
        policies: undefined, // No policies for slot (uses session keys)
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
        policies: buildPolicies(GAME_ADDRESSES.mainnet),
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
