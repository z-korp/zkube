import { Connector } from "@starknet-react/core";
import CartridgeConnector from "@cartridge/connector";
import { getContractByName } from "@dojoengine/core";
import manifest from "../../contracts/manifests/sepolia/manifest.json";

const actions_contract_address = getContractByName(
  manifest,
  "zkube::systems::actions::actions",
)?.address;

console.log(
  "import.meta.env.VITE_PUBLIC_FEE_TOKEN_ADDRESS",
  import.meta.env.VITE_PUBLIC_FEE_TOKEN_ADDRESS,
);
console.log(
  "import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH",
  import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH,
);
console.log("actions_contract_address", actions_contract_address);

const cartridgeConnector = new CartridgeConnector(
  [
    {
      target: import.meta.env.VITE_PUBLIC_FEE_TOKEN_ADDRESS,
      method: "approve",
    },
    {
      target: import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH,
      method: "initialize",
    },
    {
      target: import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH,
      method: "create",
    },
    // actions
    {
      target: actions_contract_address,
      method: "create",
    },
    {
      target: actions_contract_address,
      method: "rename",
    },
    {
      target: actions_contract_address,
      method: "start",
    },
    {
      target: actions_contract_address,
      method: "surrender",
    },
    {
      target: actions_contract_address,
      method: "move",
    },
    {
      target: actions_contract_address,
      method: "apply_bonus",
    },
  ],
  //{ theme: "zkube" },
) as never as Connector;

export default cartridgeConnector;
