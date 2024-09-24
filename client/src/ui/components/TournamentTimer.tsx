import React, { useState, useEffect } from "react";
import { ModeType } from "@/dojo/game/types/mode";
import useTournament from "@/hooks/useTournament";
import useCountdown from "@/hooks/useCountdown";
import { formatRemainingTime } from "../utils";

interface TournamentTimerProps {
  mode: ModeType;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({ mode }) => {
  const { endTimestamp } = useTournament(mode);
  const secondsLeft = useCountdown(new Date(endTimestamp * 1000));

  return (
    <div>
      <p className="text-lg">
        <strong>Time Remaining</strong>:{" "}
        {formatRemainingTime(mode, secondsLeft)}
      </p>
    </div>
  );
};

export default TournamentTimer;
