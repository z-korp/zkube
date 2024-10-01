import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector";
import { getContractByName } from "@dojoengine/core";
import { ControllerOptions, PaymasterOptions } from "@cartridge/controller";
import { shortString } from "starknet";

import local from "../../contracts/manifests/dev/deployment/manifest.json";
import slot from "../../contracts/manifests/slot/deployment/manifest.json";
import slotdev from "../../contracts/manifests/slotdev/deployment/manifest.json";
import sepolia from "../../contracts/manifests/dev/deployment/manifest.json";

const {
  VITE_PUBLIC_DEPLOY_TYPE,
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_NODE_URL,
} = import.meta.env;

const manifest =
  VITE_PUBLIC_DEPLOY_TYPE === "sepolia"
    ? sepolia
    : VITE_PUBLIC_DEPLOY_TYPE === "slot"
      ? slot
      : VITE_PUBLIC_DEPLOY_TYPE === "slotdev"
        ? slotdev
        : local;

const account_contract_address = getContractByName(
  manifest,
  "zkube",
  "account",
)?.address;

const play_contract_address = getContractByName(
  manifest,
  "zkube",
  "play",
)?.address;

console.log("account_contract_address", account_contract_address);
console.log("play_contract_address", play_contract_address);

const policies = [
  {
    target: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
    method: "approve",
  },
  {
    target: VITE_PUBLIC_GAME_TOKEN_ADDRESS,
    method: "faucet",
  },
  // account
  {
    target: account_contract_address,
    method: "create",
  },
  {
    target: account_contract_address,
    method: "rename",
  },
  // play
  {
    target: play_contract_address,
    method: "create",
  },
  {
    target: play_contract_address,
    method: "surrender",
  },
  {
    target: play_contract_address,
    method: "move",
  },
  {
    target: play_contract_address,
    method: "apply_bonus",
  },
];

const paymaster: PaymasterOptions = {
  caller: shortString.encodeShortString("ANY_CALLER"),
};

const options: ControllerOptions = {
  rpc: VITE_PUBLIC_NODE_URL,
  policies,
  paymaster,
};

const cartridgeConnector = new CartridgeConnector(
  options,
) as never as Connector;

export default cartridgeConnector;
