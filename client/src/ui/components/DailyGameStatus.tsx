import useAccountCustom from "@/hooks/useAccountCustom";
import { usePlayer } from "@/hooks/usePlayer";

const DailyGameStatus = () => {
    const { account } = useAccountCustom();
    const { player } = usePlayer({ playerId: account?.address });

    if (player) {
        return (
            <div className="items-center flex rounded-lg px-2 md:px-3 py-1 border h-[36px]">
                <div className="text-sm">Free Games: {player.daily_games_played}/{player.daily_games_limit}</div>
            </div>
        );
    }
};

export default DailyGameStatus;
