import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../elements/dialog";
import { ScrollArea } from "@/ui/elements/scroll-area";
import { faHeart, faUsers } from "@fortawesome/free-solid-svg-icons";
import { useParticipationsFromChest } from "@/hooks/useParticipationsFromChest";
import { usePlayerList } from "@/hooks/usePlayerList";
import { Chest } from "@/dojo/game/models/chest";
import { formatPrize } from "@/utils/price";

const { VITE_PUBLIC_GAME_TOKEN_SYMBOL } = import.meta.env;

export function DialogPrizePoolContributors({ chest }: { chest: Chest }) {
  const playerList = usePlayerList();
  const participations = useParticipationsFromChest({ chest_id: chest.id });

  // Helper function to get player name from playerList
  const getPlayerName = (playerId: bigint) => {
    const player = playerList.find((p) => p.id === playerId.toString(16));
    return player ? player.name : playerId.toString(16).slice(0, 4); // Fallback to ID if no name is found
  };

  // Calculate the total points contributed as bigint
  const totalPoints = participations.reduce(
    (sum, p) => sum + BigInt(p.points),
    BigInt(0),
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={`w-10 h-10 rounded-full border border-sky-300 transform }`}
        >
          <FontAwesomeIcon icon={faUsers} className="text-sky-300" />
        </button>
      </DialogTrigger>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[650px] w-[95%] rounded-lg px-2 pl-6 font-semibold"
      >
        <DialogHeader className="flex flex-row">
          <div>
            <img src={chest.getIcon()} alt="chest icon" className="w-11" />
          </div>
          <div className="ml-4">
            <DialogTitle className="text-left">
              <div className="text-2xl">Top Contributors</div>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Top legends that contributed to the chest
            </DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="h-[300px] pr-4">
          <div className="grid gap-3">
            {participations.map((p, index) => {
              // Ensure points and prize are bigints
              const playerPoints = BigInt(p.points);
              const chestPrize = chest.prize;

              // Calculate proportional prize as bigint
              const proportionalPrize =
                (chestPrize * playerPoints) / totalPoints;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between px-4 py-2 border rounded-lg"
                >
                  <div className="flex flex-row gap-2 w-[130px] md:w-[150px]">
                    <div>{index + 1}.</div>
                    <div>{getPlayerName(p.player_id)}</div>
                  </div>
                  <div className="w-[100px] text-right flex gap-2">
                    <span>{playerPoints.toString()}</span>
                    <span>points</span>
                  </div>
                  <div className="w-[80px] text-right">
                    {
                      formatPrize(
                        proportionalPrize,
                        VITE_PUBLIC_GAME_TOKEN_SYMBOL,
                      ).withImage
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <FontAwesomeIcon icon={faHeart} className="mr-4" />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
