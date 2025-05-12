import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import type { ControllerOptions } from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { constants } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

export type Manifest = typeof manifest;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

const preset = "zkube";
const namespace = VITE_PUBLIC_NAMESPACE;
const slot = `zkube-${VITE_PUBLIC_DEPLOY_TYPE}`;
const VRF_PROVIDER_ADDRESS =
  "0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f";

const game_contract_address = getContractByName(
  manifest,
  namespace,
  "game_system"
)?.address;

const policies = {
  contracts: {
    [VRF_PROVIDER_ADDRESS]: {
      methods: [{ entrypoint: "consume_random" }],
    },
    [game_contract_address]: {
      methods: [
        { entrypoint: "create" },
        { entrypoint: "surrender" },
        { entrypoint: "move" },
        { entrypoint: "apply_bonus" },
        { entrypoint: "mint" },
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
