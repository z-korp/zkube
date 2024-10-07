import useAccountCustom from "@/hooks/useAccountCustom";
import { useCredits } from "@/hooks/useCredits";
import { usePlayer } from "@/hooks/usePlayer";
import React from "react";
import { useMediaQuery } from "react-responsive";

const DailyGameStatus = React.memo(() => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });
  const { credits } = useCredits({ playerId: account?.address });
  const isSmOrLarger = useMediaQuery({ query: "(min-width: 640px)" });

  if (player && credits) {
    return (
      <div className="items-center flex rounded-lg px-2 md:px-3 py-1 text-sm md:text-md md:h-[36px] bg-secondary text-secondary-foreground shadow-sm">
        <div className="text-sm">
          {isSmOrLarger ? "Free Games: " : "Free : "}
          {credits.get_remaining(Date.now() / 1000)}/{credits.get_max_per_day()}
        </div>
      </div>
    );
  }

  return null;
});

DailyGameStatus.displayName = "DailyGameStatus";

export default DailyGameStatus;
