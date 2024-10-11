import { useDojo } from "@/dojo/useDojo";
import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";
import { Account } from "starknet";

type AccountType = "burner" | "controller";

// eslint-disable-next-line prefer-const
export let ACCOUNT_CONNECTOR: AccountType = "controller";

const useAccountCustom = () => {
  const { account } = useAccount();

  const { account: burner } = useDojo();

  const [customAccount, setCustomAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (ACCOUNT_CONNECTOR === "burner") {
      if (burner.account) {
        console.log("------> setCustomAccount burner.account", burner.account);
        setCustomAccount(burner.account as Account);
      } else {
        setCustomAccount(null);
      }
    } else {
      console.log("Controller account", account);
      if (account) {
        console.log("------> setCustomAccount account", account);
        setCustomAccount(account as Account);
      } else {
        setCustomAccount(null);
      }
    }
  }, [burner, account]);

  return { account: customAccount };
};

export default useAccountCustom;
