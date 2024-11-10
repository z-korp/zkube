import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import { useNftBalance } from "@/hooks/useNftBalance";

const HeaderNftBalance = React.memo(() => {
  const { account } = useAccountCustom();

  const { balance } = useNftBalance(account?.address ? account.address : "");

  if (account) {
    return (
      <span className="text-xs font-semibold md:font-normal flex items-center">
        {`${balance} Game${balance > 1 ? "s" : ""}`}
      </span>
    );
  }
});

HeaderNftBalance.displayName = "HeaderNftBalance";

export default HeaderNftBalance;
