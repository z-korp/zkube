import useAccountCustom from "@/hooks/useAccountCustom";
import { usePlayer } from "@/hooks/usePlayer";
import React from "react";
import { useMediaQuery } from "react-responsive";

const DailyGameStatus = () => {
    const { account } = useAccountCustom();
    const { player } = usePlayer({ playerId: account?.address });
    const isSmOrLarger = useMediaQuery({ query: "(min-width: 640px)" });

    if (player) {
        return (
            <div className="items-center flex rounded-lg px-2 md:px-3 py-1 border h-[36px]">
                <div className="text-sm">
                    {isSmOrLarger ? "Free Games: " : ""}
                    {player.daily_games_available}/{player.daily_games_limit}
                </div>
            </div>
        );
    }
};

export default React.memo(DailyGameStatus);
