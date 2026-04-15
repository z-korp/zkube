import { useAccount } from "@starknet-react/core";
import type { Account } from "starknet";

const useAccountCustom = () => {
  const { account: controllerAccount } = useAccount();

  return { account: (controllerAccount as Account) ?? null };
};

export default useAccountCustom;
