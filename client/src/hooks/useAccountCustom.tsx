import { useDojo } from "@/dojo/useDojo";
import { useAccount } from "@starknet-react/core";
import { useState, useEffect } from "react";
import { Account } from "starknet";

export const ACCOUNT_CONNECTOR: "burner" | "controller" = "burner";

const useAccountCustom = () => {
  const { account } = useAccount();

  const { account: burner } = useDojo();

  const [customAccount, setCustomAccount] = useState<Account | null>(null);

  useEffect(() => {
    console.log("------> customAccount", customAccount);
  }, [customAccount]);

  useEffect(() => {
    if (ACCOUNT_CONNECTOR === "burner") {
      if (burner.account) setCustomAccount(burner.account as Account);
    } else {
      if (account) {
        setCustomAccount(account as Account);
      }
    }
  }, [burner]);

  return { account: customAccount };
};

export default useAccountCustom;
