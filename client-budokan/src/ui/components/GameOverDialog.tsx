import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "./MaxComboIcon";
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

        <div>
          <div className="flex gap-4 justify-center items-center mx-auto mt-4 w-1/2 ">
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.score}
              <FontAwesomeIcon icon={faStar} />
            </div>
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.combo}
              <FontAwesomeIcon icon={faFire} />
            </div>
            <div className="grow text-4xl flex gap-2 justify-center">
              {game.max_combo}
              <MaxComboIcon width={36} height={36} />
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
