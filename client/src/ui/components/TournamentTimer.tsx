import React, { useState, useEffect } from "react";
import { differenceInSeconds, format } from "date-fns";
import { ModeType } from "@/dojo/game/types/mode";
import useTournament from "@/hooks/useTournament";

interface TournamentTimerProps {
  mode: ModeType;
}

const TournamentTimer: React.FC<TournamentTimerProps> = ({ mode }) => {
  const { endDate } = useTournament(mode);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  useEffect(() => {
    const updateRemainingTime = () => {
      const now = new Date();
      const timeLeft = Math.max(0, differenceInSeconds(endDate, now));
      setRemainingTime(timeLeft);
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [endDate]);

  const formatRemainingTime = (seconds: number): string => {
    if (mode === ModeType.Normal) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return format(new Date(seconds * 1000), "HH:mm:ss");
    }
  };

  return (
    <div>
      {/*<p>Tournament ID: {id}</p>
      <p>End Date: {endDate.toLocaleString()}</p>*/}
      <p className="text-lg">
        <strong>Time Remaining</strong>: {formatRemainingTime(remainingTime)}
      </p>
    </div>
  );
};

export default TournamentTimer;
