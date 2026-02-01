import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions, SessionPolicies } from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { shortString } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_SLOT, VITE_PUBLIC_NODE_URL } = import.meta.env;

export type Manifest = typeof manifest;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

const preset = "zkube";
const namespace = VITE_PUBLIC_NAMESPACE;

export const stringToFelt = (v: string) =>
  v ? shortString.encodeShortString(v) : "0x0";

const getChainId = (): string => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "sepolia":
      return "SN_SEPOLIA";
    case "mainnet":
      return "SN_MAIN";
    case "slot":
      // Generate chain ID from slot name (e.g., "zkube-djizus" -> "WP_ZKUBE_DJIZUS")
      return `WP_${(VITE_PUBLIC_SLOT || "zkube").toUpperCase().replace(/-/g, "_")}`;
    default:
      return "SN_MAIN";
  }
};

const getSlot = (): string => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "slot":
      return VITE_PUBLIC_SLOT || "zkube";
    case "sepolia":
      return "zkube-djizus";
    default:
      return "zkube-ba-mainnet";
  }
};

const getPolicies = (): SessionPolicies | undefined => {
  switch(VITE_PUBLIC_DEPLOY_TYPE) {
    case "slot":
      return undefined;
    case "sepolia":
      return {contracts:{
        "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F": {
            description: "Provides verifiable random functions",
            methods: [
              {
                name: "Request Random",
                description: "Request a random number",
                entrypoint: "request_random"
              }
            ]
          },
          "0x3aeb60202020a2b6a7b0ba3bbafc7f667836c2c89e07aac2a894c2b9b449d8f": {
            description: "Manages zKube game",
            methods: [
              {
                name: "Create Game",
                description: "Create a new zKube game",
                entrypoint: "create"
              },
              {
                name: "Surrender Game",
                description: "Forfeit the current game",
                entrypoint: "surrender"
              },
              {
                name: "Make a Move",
                description: "Make a move in the current game",
                entrypoint: "move"
              },
              {
                name: "Use Bonus",
                description: "Apply a special bonus",
                entrypoint: "apply_bonus"
              },
              {
                name: "Mint Game",
                description: "Mint a new zKube game",
                entrypoint: "mint_game"
              }
            ]
          }
        }
      }
    case "mainnet": 
      return {contracts:{
          "0x051Fea4450Da9D6aeE758BDEbA88B2f665bCbf549D2C61421AA724E9AC0Ced8F": {
              description: "Provides verifiable random functions",
              methods: [
                {
                  name: "Request Random",
                  description: "Request a random number",
                  entrypoint: "request_random"
                }
              ]
            },
            "0x79c30d00719faea99297075e22fd84260f39960e14239f2018ba5d1dc1ab907": {
              description: "Manages zKube game",
              methods: [
                {
                  name: "Create Game",
                  description: "Create a new zKube game",
                  entrypoint: "create"
                },
                {
                  name: "Surrender Game",
                  description: "Forfeit the current game",
                  entrypoint: "surrender"
                },
                {
                  name: "Make a Move",
                  description: "Make a move in the current game",
                  entrypoint: "move"
                },
                {
                  name: "Use Bonus",
                  description: "Apply a special bonus",
                  entrypoint: "apply_bonus"
                },
                {
                  name: "Mint Game",
                  description: "Mint a new zKube game",
                  entrypoint: "mint_game"
                }
              ]
            }
          }
        }
    default:
      return undefined;
  }
}

// Build chains list dynamically based on deploy type
const getChains = () => {
  const chains = [
    { rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet" },
    { rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia" },
  ];

  // Add slot chain if we're in slot mode and have a node URL
  if (VITE_PUBLIC_DEPLOY_TYPE === "slot" && VITE_PUBLIC_NODE_URL) {
    chains.push({ rpcUrl: VITE_PUBLIC_NODE_URL });
  }

  return chains;
};

const options: ControllerOptions = {
  chains: getChains(),
  defaultChainId: stringToFelt(getChainId()).toString(),
  namespace,
  slot: getSlot(),
  policies: getPolicies(),
  preset: VITE_PUBLIC_DEPLOY_TYPE === "mainnet" ? undefined : undefined,
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;
