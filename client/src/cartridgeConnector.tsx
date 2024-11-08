import { Connector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { getContractByName } from "@dojoengine/core";
import { ColorMode, ControllerOptions } from "@cartridge/controller";
import { manifest } from "./config/manifest";

const {
  VITE_PUBLIC_GAME_TOKEN_ADDRESS,
  VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
  VITE_PUBLIC_NODE_URL,
} = import.meta.env;

export type Manifest = typeof manifest;

const colorMode: ColorMode = "dark";
const theme = "zkube";
const namespace = "zkube";
const slot = "zkube-slotdev";

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

console.log("account_contract_address", account_contract_address);
console.log("play_contract_address", play_contract_address);
console.log("chest_contract_address", chest_contract_address);
console.log("tournament_contract_address", tournament_contract_address);

const policies = [
  // erc721
  {
    target: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    method: "public_mint",
  },
  {
    target: VITE_PUBLIC_GAME_CREDITS_TOKEN_ADDRESS,
    method: "approve",
  },
  // erc20
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
  rpc: VITE_PUBLIC_NODE_URL,
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
