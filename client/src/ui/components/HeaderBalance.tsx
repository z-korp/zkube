import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import Balance from "./Balance";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";

const HeaderBalance = React.memo(() => {
  const { account } = useAccountCustom();

  if (account) {
    return (
      <div className="items-center flex gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-1 border h-[36px]">
        <Balance
          address={account?.address}
          token_address={KATANA_ETH_CONTRACT_ADDRESS}
          symbol="ETH"
        />
      </div>
    );
  }
});

HeaderBalance.displayName = "HeaderBalance";

export default HeaderBalance;
