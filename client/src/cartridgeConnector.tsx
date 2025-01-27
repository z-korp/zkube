import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import { ColorMode, ControllerOptions } from "@cartridge/controller";
import SessionPolicies from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { constants } from "starknet";

const {
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_DEPLOY_TYPE,
} = import.meta.env;

export type Manifest = typeof manifest;

const colorMode: ColorMode = "dark";
const theme = "zkube";
const namespace = "zkube";
const slot = `zkube-${VITE_PUBLIC_DEPLOY_TYPE}`;

const account_contract_address = getContractByName(
  manifest,
  namespace,
  "account",
)?.address;

const play_contract_address = getContractByName(
  manifest,
  namespace,
  "play",
)?.address;

const chest_contract_address = getContractByName(
  manifest,
  namespace,
  "chest",
)?.address;

const tournament_contract_address = getContractByName(
  manifest,
  namespace,
  "tournament",
)?.address;

const minter_contract_address = getContractByName(
  manifest,
  namespace,
  "minter",
)?.address;

const policies: SessionPolicies = {
  contracts: {
    [VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS]: {
      methods: [
        {
          entrypoint: "public_mint",
        },
        {
          entrypoint: "approve",
        },
      ],
    },
    [VITE_PUBLIC_GAME_TOKEN_ADDRESS]: {
      methods: [
        {
          entrypoint: "approve",
        },
        {
          entrypoint: "faucet",
        },
      ],
    },
    [account_contract_address]: {
      methods: [
        {
          entrypoint: "create",
        },
        {
          entrypoint: "rename",
        },
      ],
    },
    [play_contract_address]: {
      methods: [
        {
          entrypoint: "create",
        },
        {
          entrypoint: "surrender",
        },
        {
          entrypoint: "move",
        },
        {
          entrypoint: "apply_bonus",
        },
      ],
    },
    [chest_contract_address]: {
      methods: [
        {
          entrypoint: "claim",
        },
      ],
    },
    [tournament_contract_address]: {
      methods: [
        {
          entrypoint: "claim",
        },
      ],
    },
    [minter_contract_address]: {
      methods: [
        {
          entrypoint: "claim_free_mint",
        },
      ],
    },
  },
};

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
    },
  ],
  defaultChainId: constants.StarknetChainId.SN_MAIN,
  namespace,
  slot,
  policies,
  theme,
  colorMode,
};

const cartridgeConnector = new ControllerConnector(
  options,
) as never as Connector;

export default cartridgeConnector;
