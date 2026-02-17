import { faStar, faFire } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MaxComboIcon from "./MaxComboIcon";
import { useLerpNumber } from "@/hooks/useLerpNumber";

interface GameScoresProps {
  isMdOrLarger: boolean;
  score: number;
  combo: number;
  maxCombo: number;
}

const GameScores: React.FC<GameScoresProps> = ({
  isMdOrLarger,
  score,
  combo,
  maxCombo,
}) => {
  const displayScore = useLerpNumber(score, {
    integer: true,
  });
  const displayCombo = useLerpNumber(combo, {
    integer: true,
  });
  const displayMaxCombo = useLerpNumber(maxCombo, {
    integer: true,
  });

  return (
    <div className="flex gap-2">
      <div
        className={`flex items-center ${isMdOrLarger ? "text-3xl" : "text-2xl"}`}
      >
        <span
          className={`${isMdOrLarger ? "w-[52px]" : "w-[44px]"} text-right`}
        >
          {displayScore}
        </span>
        <FontAwesomeIcon
          icon={faStar}
          className="text-yellow-500 ml-1"
          width={26}
          height={26}
        />
      </div>
      <div
        className={`flex items-center ${isMdOrLarger ? "text-3xl" : "text-2xl"}`}
      >
        <span
          className={`${isMdOrLarger ? "w-[52px]" : "w-[44px]"} text-right`}
        >
          {displayCombo}
        </span>
        <FontAwesomeIcon
          icon={faFire}
          className="text-slate-500 ml-1"
          width={26}
          height={26}
        />
      </div>
      <div
        className={`flex items-center ${isMdOrLarger ? "text-3xl" : "text-2xl"}`}
      >
        <span
          className={`${isMdOrLarger ? "w-[20px]" : "w-[13px]"} text-right`}
        >
          {displayMaxCombo}
        </span>
        <MaxComboIcon
          width={isMdOrLarger ? 31 : 25}
          height={isMdOrLarger ? 31 : 25}
          className="text-slate-500 ml-1"
        />
      </div>
    </div>
  );
};

export default GameScores;
