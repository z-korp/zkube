import useAccountCustom from "@/hooks/useAccountCustom";
import React from "react";
import { useMediaQuery } from "react-responsive";
import Balance from "./Balance";
import { KATANA_ETH_CONTRACT_ADDRESS } from "@dojoengine/core";

const HeaderBalance = () => {
    const { account } = useAccountCustom();
    const isSmOrLarger = useMediaQuery({ query: "(min-width: 640px)" });

    if (account) {
        return (
            <div className="items-center flex gap-1 md:gap-2 rounded-lg px-2 md:px-3 py-1 border h-[36px]">

                <p className="text-sm">
                    {isSmOrLarger ? "Strk Bal: " : "Bal"}
                </p>
                <Balance
                    address={account?.address}
                    token_address={KATANA_ETH_CONTRACT_ADDRESS}
                // symbol="STRK"
                />
            </div>
        );
    }
};

export default React.memo(HeaderBalance);
