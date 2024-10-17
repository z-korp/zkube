import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import useAccountCustom from "@/hooks/useAccountCustom";
import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "./MaxComboIcon";
import { usePlayer } from "@/hooks/usePlayer";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const { account } = useAccountCustom();
  const { player } = usePlayer({ playerId: account?.address });

  // Retrieve multipliers as floats (e.g., 1.0 for x1.0)
  const gameModeMultiplier = game.getGameModeMultiplier();
  const accountAgeMultiplier = player ? player.getAccountAgeMultiplier() : 1.0;
  const dailyStreakMultiplier = player
    ? player.getDailyStreakMultiplier()
    : 1.0;
  const levelMultiplier = player ? player.getLevelMultiplier() : 1.0;

  // Gather data for each multiplier type
  const multiplierData = [
    {
      type: "Game Mode",
      data: game.isPaid() ? "Paid" : "Free",
      multiplier:
        gameModeMultiplier > 1.0 ? `x${gameModeMultiplier.toFixed(3)}` : "-",
    },
    {
      type: "Account Age",
      data: player ? `${player.getAccountAgeInDays()} days` : "N/A",
      multiplier:
        accountAgeMultiplier > 1.0
          ? `x${accountAgeMultiplier.toFixed(3)}`
          : "-",
    },
    {
      type: "Daily Streak",
      data: player ? `${player.daily_streak} days` : "N/A",
      multiplier:
        dailyStreakMultiplier > 1.0
          ? `x${dailyStreakMultiplier.toFixed(3)}`
          : "-",
    },
    {
      type: "Level",
      data: `Level ${player?.getLevel()}`,
      multiplier: `x${levelMultiplier.toFixed(3)}`,
    },
  ];

  /*console.log(
    gameModeMultiplier,
    accountAgeMultiplier,
    dailyStreakMultiplier,
    levelMultiplier,
  );*/

  // Calculate total multiplier
  const totalMultiplier =
    gameModeMultiplier *
    accountAgeMultiplier *
    dailyStreakMultiplier *
    levelMultiplier;

  // Calculate the final score after applying multipliers
  const baseScore = game.score;
  const finalScore = Math.floor(baseScore * totalMultiplier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4">
        <DialogTitle className="text-4xl text-center mb-2">
          Game Over
        </DialogTitle>

        <div>
          <div className="flex gap-4 justify-center items-center mx-auto mt-4 w-1/2">
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.score}
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
            </div>
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.combo}
              <FontAwesomeIcon icon={faFire} className="text-slate-700" />
            </div>
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.max_combo}
              <MaxComboIcon width={36} height={36} className="text-slate-700" />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Your Multipliers
            </h2>
            <div className="overflow-x-auto">
              <table className="table-auto mx-auto text-left">
                <tbody>
                  {multiplierData.map((item) => (
                    <tr key={item.type}>
                      <td className="border px-4 py-2">{item.type}</td>
                      <td className="border px-4 py-2">{item.data}</td>
                      <td className="border px-4 py-2">{item.multiplier}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-4 py-2 font-bold">Total</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2 font-bold">
                      x{totalMultiplier.toFixed(3)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Visual Calculation */}
            <div className="mt-4 text-center">
              <div className="text-xl mt-2 border w-fit px-4 py-1 mx-auto border-white">
                Final Score = {baseScore} × {totalMultiplier.toFixed(2)} ={" "}
                <strong>{finalScore.toFixed(0)}</strong>
              </div>
              <div className="mt-4">
                This is the XP you've earned and the amount you contribute to
                the chest.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
