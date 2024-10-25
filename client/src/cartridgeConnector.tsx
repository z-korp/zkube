import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import { ControllerOptions } from "@cartridge/controller";

import local from "../../contracts/manifests/dev/deployment/manifest.json";
import slot from "../../contracts/manifests/slot/deployment/manifest.json";
import slotdev from "../../contracts/manifests/slotdev/deployment/manifest.json";
import sepolia from "../../contracts/manifests/sepolia/deployment/manifest.json";
import sepoliadev1 from "../../contracts/manifests/sepoliadev1/deployment/manifest.json";
import sepoliadev2 from "../../contracts/manifests/sepoliadev2/deployment/manifest.json";

const {
  VITE_PUBLIC_DEPLOY_TYPE,
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_NODE_URL,
} = import.meta.env;

const manifest =
  VITE_PUBLIC_DEPLOY_TYPE === "sepolia"
    ? sepolia
    : VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev1"
      ? sepoliadev1
      : VITE_PUBLIC_DEPLOY_TYPE === "sepoliadev2"
        ? sepoliadev2
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

const chest_contract_address = getContractByName(
  manifest,
  "zkube",
  "chest",
)?.address;

const tournament_contract_address = getContractByName(
  manifest,
  "zkube",
  "tournament",
)?.address;

console.log("account_contract_address", account_contract_address);
console.log("play_contract_address", play_contract_address);
console.log("chest_contract_address", chest_contract_address);
console.log("tournament_contract_address", tournament_contract_address);

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
  // chest
  {
    target: chest_contract_address,
    method: "claim",
  },
  // tournament
  {
    target: tournament_contract_address,
    method: "claim",
  },
];

const options: ControllerOptions = {
  rpc: VITE_PUBLIC_NODE_URL as string,
  policies,
  theme: "zkube",
};

const cartridgeConnector = new CartridgeConnector(
  options,
) as never as Connector;

export default cartridgeConnector;
