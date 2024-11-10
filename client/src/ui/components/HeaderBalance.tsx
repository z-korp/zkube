import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import Balance from "./Balance";
import HeaderNftBalance from "./HeaderNftBalance";

const { VITE_PUBLIC_GAME_TOKEN_ADDRESS, VITE_PUBLIC_GAME_TOKEN_SYMBOL } =
  import.meta.env;

const HeaderBalance = React.memo(() => {
  const { account } = useAccountCustom();

  if (!account) {
    return null;
  }

  return (
    <div className="rounded-lg items-center flex gap-3 bg-secondary text-secondary-foreground shadow-sm md:gap-5 px-2 md:px-3 py-1 h-[36px]">
      <Balance
        address={account?.address}
        token_address={VITE_PUBLIC_GAME_TOKEN_ADDRESS}
        symbol={VITE_PUBLIC_GAME_TOKEN_SYMBOL}
      />
      <HeaderNftBalance />
    </div>
  );
});

HeaderBalance.displayName = "HeaderBalance";

export default HeaderBalance;
