import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import Balance from "./Balance";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS, VITE_PUBLIC_GAME_TOKEN_SYMBOL } =
  import.meta.env;

const HeaderBalance = React.memo(() => {
  const { account } = useAccountCustom();

  if (!account) {
    return null;
  }

  return (
    <div className="rounded-lg items-center flex text-secondary-foreground shadow-sm md:gap-2 px-2 md:px-3 py-1">
      <Balance
        address={account?.address}
        token_address={VITE_PUBLIC_GAME_TOKEN_ADDRESS}
        symbol={VITE_PUBLIC_GAME_TOKEN_SYMBOL}
      />
      <div className="ml-4">
        <Balance
          address={account?.address}
          token_address={import.meta.env.VITE_PUBLIC_LORDS_CONTRACT}
          symbol="Games"
        />
      </div>
    </div>
  );
});

HeaderBalance.displayName = "HeaderBalance";

export default HeaderBalance;
