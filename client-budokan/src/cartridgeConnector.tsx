import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import type { ControllerOptions, SessionPolicies } from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { shortString } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

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
      return "WP_BUDOKAN_MATTH";
    default:
      return "SN_MAIN";
  }
};

const getSlot = (): string => {
  switch (VITE_PUBLIC_DEPLOY_TYPE) {
    case "slot":
      return "budokan-matth";
    case "sepolia":
      return "zkube-ba-sepolia";
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
          "0x6d09ee095fd3fab025ded7802d0f8180a37ee5d7da827e3c642d1ede779abba": {
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

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/budokan-matth/katana",
    },
  ],
  defaultChainId: stringToFelt(getChainId()).toString(),
  namespace,
  slot: getSlot(),
  policies: getPolicies(),
  preset:VITE_PUBLIC_DEPLOY_TYPE === "mainnet" ? undefined : undefined,
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;
