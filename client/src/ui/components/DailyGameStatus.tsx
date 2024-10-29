import useAccountCustom from "@/hooks/useAccountCustom";
import { useContract } from "@starknet-react/core";
import React from "react";
import { useMediaQuery } from "react-responsive";

const DailyGameStatus = React.memo(() => {
  const { account } = useAccountCustom();
  const isSmOrLarger = useMediaQuery({ query: "(min-width: 640px)" });

  // TODO: Add contract ABI and address
  const { contract } = useContract({
    abi: [], // Add credits contract ABI
    address: "", // Add credits contract address
  });

  const [credits, setCredits] = React.useState<number | null>(null);

  React.useEffect(() => {
    const getCredits = async () => {
      if (!contract || !account?.address) return;

      try {
        const result = await contract.get_credits(account.address);
        setCredits(Number(result));
      } catch (error) {
        console.error("Error fetching credits:", error);
      }
    };

    getCredits();
  }, [contract, account]);

  if (credits !== null) {
    return (
      <div className="items-center flex rounded-lg px-2 md:px-3 py-1 text-sm md:text-md md:h-[36px] bg-secondary text-secondary-foreground shadow-sm">
        <div className="text-sm">
          {isSmOrLarger ? "Game Credits: " : "Credits: "}
          {credits}
        </div>
      </div>
    );
  }

  return null;
});

DailyGameStatus.displayName = "DailyGameStatus";

export default DailyGameStatus;
