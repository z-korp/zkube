import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import type { ControllerOptions } from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { constants } from "starknet";

const {
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  VITE_PUBLIC_DEPLOY_TYPE,
} = import.meta.env;

export type Manifest = typeof manifest;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

const preset = "zkube";
const namespace = VITE_PUBLIC_NAMESPACE;
const slot = `zkube-${VITE_PUBLIC_DEPLOY_TYPE}`;

const play_contract_address = getContractByName(
  manifest,
  namespace,
  "play"
)?.address;

const policies = {
  contracts: {
    [VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS]: {
      methods: [{ entrypoint: "public_mint" }, { entrypoint: "approve" }],
    },
    [VITE_PUBLIC_GAME_TOKEN_ADDRESS]: {
      methods: [{ entrypoint: "approve" }, { entrypoint: "faucet" }],
    },
    [play_contract_address]: {
      methods: [
        { entrypoint: "create" },
        { entrypoint: "surrender" },
        { entrypoint: "move" },
        { entrypoint: "apply_bonus" },
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
  preset,
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;
