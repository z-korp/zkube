import useAccountCustom from "@/hooks/useAccountCustom";
import React, { useMemo } from "react";
import { useNftBalance } from "@/hooks/useNftBalance";
import NftZKUBE from "/assets/nft-zkube.png";

const HeaderNftBalance = React.memo(() => {
  const { account } = useAccountCustom();

  const { balance } = useNftBalance(account?.address ? account.address : "");
  const memoizedImage = useMemo(
    () => <img src={NftZKUBE} alt="ZKUBE" className="ml-1 h-8 w-8" />,
    [],
  );

  if (account) {
    return (
      <span className="text-xs font-semibold md:font-normal flex items-center">
        {/*`${balance} Game${balance > 1 ? "s" : ""}`*/}
        {`${balance}`} {memoizedImage}
      </span>
    );
  }
});

HeaderNftBalance.displayName = "HeaderNftBalance";

export default HeaderNftBalance;
