import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import {
  faFire,
  faGem,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

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
  const navigate = useNavigate();
  const handleClose = () => {
    onClose();
    navigate("/");
  };

  // Generate tweet URL
  const tweetUrl = useMemo(() => {
    const cubesDisplay = "🧊".repeat(Math.min(game.totalCubes, 10)) + (game.totalCubes > 10 ? `+${game.totalCubes - 10}` : "");
    const tweetMsg = `\uD83C\uDFAE Reached Level ${game.level} on zKube! Game Over!
${cubesDisplay} ${game.totalCubes} cubes earned
\uD83D\uDC8E ${game.totalScore.toLocaleString()} total points
Can you beat that? \uD83D\uDE0E
Play now: app.zkube.xyz
@zkorp_ @zkube_game`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}&url=app.zkube.xyz`;
  }, [game.level, game.totalCubes, game.totalScore]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-4xl text-center mb-4">
          Game Over
        </DialogTitle>

        <div className="flex flex-col gap-6">
          {/* Level reached - prominent display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-1">{game.level}</div>
            <div className="text-lg text-slate-400 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faLayerGroup} className="text-purple-400" />
              Level Reached
            </div>
          </div>

          {/* Stats row: Cubes, Score, Combo */}
          <div className="flex gap-4 justify-center items-center">
            {/* Total Cubes */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-4 py-3 rounded-lg flex-1">
              <div className="text-3xl flex gap-2 items-center text-yellow-400">
                {game.totalCubes}
                <span>🧊</span>
              </div>
              <div className="text-xs text-slate-400">Cubes</div>
            </div>

            {/* Total Score */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-4 py-3 rounded-lg flex-1">
              <div className="text-3xl flex gap-2 items-center text-cyan-400">
                {game.totalScore.toLocaleString()}
                <FontAwesomeIcon icon={faGem} />
              </div>
              <div className="text-xs text-slate-400">Score</div>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-4 py-3 rounded-lg flex-1">
              <div className="text-3xl flex gap-2 items-center text-orange-500">
                {game.maxComboRun}
                <FontAwesomeIcon icon={faFire} />
              </div>
              <div className="text-xs text-slate-400">Best Combo</div>
            </div>
          </div>

          {/* Share on X button */}
          <a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-black border border-slate-600 hover:border-slate-400 text-white rounded-lg px-4 py-3 transition-colors"
          >
            <span className="font-bold text-lg">𝕏</span>
            <span>Share on X</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
