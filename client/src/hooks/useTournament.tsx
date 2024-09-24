import { useState, useEffect } from "react";
import { ModeType } from "../dojo/game/types/mode";
import {
  DAILY_MODE_DURATION,
  NORMAL_MODE_DURATION,
} from "../dojo/game/constants";

interface TournamentInfo {
  id: number;
  endDate: Date;
}

const useTournament = (mode: ModeType): TournamentInfo => {
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({
    id: 0,
    endDate: new Date(),
  });

  useEffect(() => {
    const updateTournamentInfo = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const duration =
        mode === ModeType.Daily ? DAILY_MODE_DURATION : NORMAL_MODE_DURATION;
      const id = Math.floor(currentTime / duration);
      const endTimestamp = (id + 1) * duration;
      const endDate = new Date(endTimestamp * 1000);

      setTournamentInfo({ id, endDate });
    };

    updateTournamentInfo();
    // Update every minute
    const intervalId = setInterval(updateTournamentInfo, 60000);

    return () => clearInterval(intervalId);
  }, [mode]);

  return tournamentInfo;
};

export default useTournament;
