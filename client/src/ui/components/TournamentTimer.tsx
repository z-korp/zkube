import React from "react";
import { ModeType } from "@/dojo/game/types/mode";
import useCountdown from "@/hooks/useCountdown";
import { formatRemainingTime } from "../utils";

interface TournamentTimerProps {
  mode: ModeType;
  endTimestamp: number;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({
  mode,
  endTimestamp,
}) => {
  const secondsLeft = useCountdown(new Date(endTimestamp * 1000));

  return (
    <div>
      <p className="text-xs sm:text-lg">
        <strong>Time Remaining</strong>:{" "}
        {formatRemainingTime(mode, secondsLeft)}
      </p>
    </div>
  );
};

export default TournamentTimer;
