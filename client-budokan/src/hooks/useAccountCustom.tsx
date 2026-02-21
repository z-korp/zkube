import { useAccount } from "@starknet-react/core";
import { useState, useEffect, useMemo } from "react";
import { Account, RpcProvider } from "starknet";

export const isSlot = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE === "slot";

const useAccountCustom = () => {
  const { account: controllerAccount } = useAccount();

  const burnerAccount = useMemo(() => {
    const masterAddr = import.meta.env.VITE_PUBLIC_MASTER_ADDRESS;
    const masterKey = import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY;
    const nodeUrl = import.meta.env.VITE_PUBLIC_NODE_URL;
    if (!isSlot || !masterAddr || !masterKey) return null;
    const provider = new RpcProvider({ nodeUrl });
    return new Account({ provider, address: masterAddr, signer: masterKey });
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
