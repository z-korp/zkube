import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import { useNftBalance } from "@/hooks/useNftBalance";

const HeaderNftBalance = React.memo(() => {
  const { account } = useAccountCustom();

  const { balance } = useNftBalance(account?.address ? account.address : "");

  if (account) {
    return (
      <div className="rounded-lg items-center flex gap-1 bg-secondary text-secondary-foreground shadow-sm md:gap-2 px-2 md:px-3 py-1 h-[36px] text-sm">
        <p>{`${balance} Credits`}</p>
      </div>
    );
  }
});

HeaderNftBalance.displayName = "HeaderNftBalance";

export default HeaderNftBalance;
