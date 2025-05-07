import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import useAccountCustom from "@/hooks/useAccountCustom";
import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "./MaxComboIcon";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[700px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4"
      >
        <DialogTitle className="text-4xl text-center mb-2">
          Game Over
        </DialogTitle>

        <div>
          <div className="flex gap-4 justify-center items-center mx-auto mt-4 w-1/2 ">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
