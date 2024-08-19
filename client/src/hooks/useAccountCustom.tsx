import { useDojo } from "@/dojo/useDojo";
import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";
import { Account } from "starknet";

const useAccountCustom = () => {
  const { account } = useAccount();

  const { account: burner } = useDojo();

  const [customAccount, setCustomAccount] = useState<Account | null>(null);

  useEffect(() => {
    console.log("------> customAccount", customAccount);
  }, [customAccount]);

  useEffect(() => {
    /*if (account) {
      setCustomAccount(account as Account);
    }*/
    if (burner.account) setCustomAccount(burner.account as Account);
  }, [burner]);

  return { account: customAccount };
};

export default useAccountCustom;
