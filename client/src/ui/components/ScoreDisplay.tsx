import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faFire,
  faWebAwesome,
} from "@fortawesome/free-solid-svg-icons";

interface ScoreDisplayProps {
  score: number;
  combo: number;
  maxCombo: number;
  isMdOrLarger: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  combo,
  maxCombo,
  isMdOrLarger,
}) => {
  return (
    <>
      <div
        className={`flex grow ${
          isMdOrLarger ? "text-4xl" : "text-2xl"
        } sm:gap-2 gap-[2px] justify-end ml-4`}
      >
        {score}
        <div className="relative inline-block">
          <FontAwesomeIcon
            icon={faStar}
            className="text-yellow-500"
            width={26}
            height={26}
          />
        </div>
      </div>
      <div
        className={`flex grow ${
          isMdOrLarger ? "text-4xl" : "text-2xl"
        } sm:gap-2 gap-[2px] justify-end relative ml-4`}
      >
        {combo}
        <div className="relative inline-block">
          <FontAwesomeIcon
            icon={faFire}
            className="text-slate-500"
            width={26}
            height={26}
          />
        </div>
      </div>
      <div
        className={`flex grow ${
          isMdOrLarger ? "text-4xl" : "text-2xl"
        } sm:gap-2 gap-[2px] justify-end relative ml-4`}
      >
        {maxCombo}
        <FontAwesomeIcon
          icon={faWebAwesome}
          className="text-slate-500"
          width={28}
          height={28}
        />
      </div>
    </>
  );
};

export default ScoreDisplay;
