import { useState, useEffect } from "react";
import { ModeType } from "../dojo/game/types/mode";
import {
  DAILY_MODE_DURATION,
  NORMAL_MODE_DURATION,
} from "../dojo/game/constants";

interface TournamentInfo {
  id: number;
  endTimestamp: number;
}

const useTournament = (mode: ModeType): TournamentInfo => {
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo>({
    id: 0,
    endTimestamp: 0,
  });

  useEffect(() => {
    const updateTournamentInfo = () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const duration =
        mode === ModeType.Daily ? DAILY_MODE_DURATION : NORMAL_MODE_DURATION;

      const id = Math.floor(currentTimestamp / duration);
      const endTimestamp = (id + 1) * duration;

      setTournamentInfo({ id, endTimestamp });
    };

    updateTournamentInfo();
    // Update every minute
    const intervalId = setInterval(updateTournamentInfo, 60000);

    return () => clearInterval(intervalId);
  }, [mode]);

  return tournamentInfo;
};

export default useTournament;
