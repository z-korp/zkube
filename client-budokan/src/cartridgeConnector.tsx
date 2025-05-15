import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import type { ControllerOptions } from "@cartridge/controller";
import { manifest } from "./config/manifest";
import { shortString, type BigNumberish } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

export type Manifest = typeof manifest;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

const preset = "zkube";
const namespace = VITE_PUBLIC_NAMESPACE;

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
      methods: [{ entrypoint: "request_random" }],
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

const stringToFelt = (v: string): BigNumberish =>
  v ? shortString.encodeShortString(v) : "0x0";
const bigintToHex = (v: BigNumberish): `0x${string}` =>
  !v ? "0x0" : `0x${BigInt(v).toString(16)}`;

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
      return "zkube-budo-sepolia";
    default:
      return `zkube-${VITE_PUBLIC_DEPLOY_TYPE}`;
  }
};

const options: ControllerOptions = {
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/budokan-matth/katana",
    },
  ],
  defaultChainId: bigintToHex(stringToFelt(getChainId())),
  namespace,
  slot: getSlot(),
  policies,
  preset,
};

const cartridgeConnector = new ControllerConnector(
  options
) as never as Connector;

export default cartridgeConnector;
