import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "./MaxComboIcon";
import { useNavigate } from "react-router-dom";
import WardensLogo from "/assets/wardens-logo.png";

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

          {/* Wardens promo box - with a bit of color */}
          <div className="my-8">
            <div
              className="
                flex flex-col sm:flex-row items-center gap-4 p-4
                bg-gradient-to-br from-yellow-900/60 via-yellow-700/20 to-slate-800/80
                border-2 border-yellow-700
                rounded-2xl shadow-lg
              "
            >
              <img
                src={WardensLogo}
                alt="Wardens Logo"
                className="w-20 h-20 object-contain"
                style={{ minWidth: 64 }}
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="font-bold text-2xl mb-3 text-yellow-400">
                  A new journey is coming!
                </div>
                <div className="mb-4 text-slate-100">
                  Pre-register for{" "}
                  <span className="font-semibold text-yellow-300">Wardens</span>{" "}
                  – our next onchain game: deeper, more strategic, and even more
                  fun. Be among the first to enter the world!
                </div>
                <a
                  href="https://wardens.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
      inline-block px-5 py-2
      rounded-lg shadow
      border border-yellow-300
      bg-yellow-400 text-yellow-900
      font-semibold
      transition
      hover:bg-yellow-300 hover:scale-105
    "
                >
                  Pre-register now
                </a>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
