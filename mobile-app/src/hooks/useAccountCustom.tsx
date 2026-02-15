import { useAccount } from "@starknet-react/core";
import { useState, useEffect, useMemo } from "react";
import { Account, RpcProvider } from "starknet";

const {
  VITE_PUBLIC_DEPLOY_TYPE,
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_MASTER_ADDRESS,
  VITE_PUBLIC_MASTER_PRIVATE_KEY,
} = import.meta.env;

const isSlot = VITE_PUBLIC_DEPLOY_TYPE === "slot";

const useAccountCustom = () => {
  const { account: controllerAccount } = useAccount();

  const burnerAccount = useMemo(() => {
    if (!isSlot || !VITE_PUBLIC_MASTER_ADDRESS || !VITE_PUBLIC_MASTER_PRIVATE_KEY) return null;
    const provider = new RpcProvider({ nodeUrl: VITE_PUBLIC_NODE_URL });
    return new Account(provider, VITE_PUBLIC_MASTER_ADDRESS, VITE_PUBLIC_MASTER_PRIVATE_KEY);
  }, []);

  const [customAccount, setCustomAccount] = useState<Account | null>(burnerAccount);

  useEffect(() => {
    if (isSlot) {
      setCustomAccount(burnerAccount);
    } else if (controllerAccount) {
      setCustomAccount(controllerAccount as Account);
    } else {
      setCustomAccount(null);
    }
  }, [controllerAccount, burnerAccount]);

  return { account: customAccount };
};

export default useAccountCustom;
