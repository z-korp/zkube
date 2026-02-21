import { useAccount } from "@starknet-react/core";
import type { Account } from "starknet";

export const isSlot = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE === "slot";

const useAccountCustom = () => {
  const { account: controllerAccount } = useAccount();

  return { account: (controllerAccount as Account) ?? null };
};

export default useAccountCustom;
