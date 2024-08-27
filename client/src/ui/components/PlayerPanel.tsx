import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFire,
  faStar,
  faWebAwesome,
} from "@fortawesome/free-solid-svg-icons";

interface PlayerPanelProps {
  score: number;
  combo: number;
  maxCombo: number;
  styleBoolean: boolean;
  children: React.ReactNode;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  score,
  combo,
  maxCombo,
  styleBoolean,
  children,
}) => {
  return (
    <div
      className={`${
        styleBoolean ? "w-[413px]" : "w-[300px]"
      } mb-4 flex justify-start items-center`}
    >
      {children}
      <div
        className={`flex grow ${
          styleBoolean ? "text-4xl" : "text-2xl"
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
          styleBoolean ? "text-4xl" : "text-2xl"
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
          styleBoolean ? "text-4xl" : "text-2xl"
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
    </div>
  );
};

export default PlayerPanel;
