import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import {
  faStar,
  faFire,
  faLayerGroup,
  faGem,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4"
      >
        <DialogTitle className="text-4xl text-center mb-2">
          Game Over
        </DialogTitle>

        <div className="flex flex-col gap-4 mt-4">
          {/* Level reached */}
          <div className="text-center text-xl text-slate-300">
            You reached Level {game.level}
          </div>

          {/* Stats row */}
          <div className="flex gap-6 justify-center items-center mx-auto mt-2">
            {/* Total Stars */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl flex gap-2 items-center">
                {game.totalStars}
                <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
              </div>
              <div className="text-sm text-slate-400">Stars</div>
            </div>

            {/* Total Score */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl flex gap-2 items-center">
                {game.totalScore.toLocaleString()}
                <FontAwesomeIcon icon={faGem} className="text-cyan-400" />
              </div>
              <div className="text-sm text-slate-400">Points</div>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl flex gap-2 items-center">
                {game.maxComboRun}
                <FontAwesomeIcon icon={faFire} className="text-orange-500" />
              </div>
              <div className="text-sm text-slate-400">Max Combo</div>
            </div>

            {/* Levels Completed */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-4xl flex gap-2 items-center">
                {Math.max(0, game.level - 1)}
                <FontAwesomeIcon
                  icon={faLayerGroup}
                  className="text-purple-400"
                />
              </div>
              <div className="text-sm text-slate-400">Levels</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
