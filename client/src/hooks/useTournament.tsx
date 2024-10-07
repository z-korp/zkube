import { useState, useEffect, useMemo } from "react";
import { ModeType } from "../dojo/game/types/mode";
import {
  DAILY_MODE_DURATION,
  NORMAL_MODE_DURATION,
} from "../dojo/game/constants";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useDojo } from "@/dojo/useDojo";
import { Tournament } from "@/dojo/game/models/tournament";

interface TournamentInfo {
  id: number;
  endTimestamp: number;
  tournament: Tournament | null;
}

const useTournament = (mode: ModeType): TournamentInfo => {
  const {
    setup: {
      clientModels: {
        models: { Tournament },
        classes: { Tournament: TournamentClass },
      },
    },
  } = useDojo();

  const [id, setId] = useState(0);
  const [endTimestamp, setEndTimestamp] = useState(0);

  useEffect(() => {
    const updateTournamentInfo = () => {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const duration =
        mode === ModeType.Daily ? DAILY_MODE_DURATION : NORMAL_MODE_DURATION;

      const id = Math.floor(currentTimestamp / duration);
      const end = (id + 1) * duration;

      setEndTimestamp(end);
      setId(id);
    };

    updateTournamentInfo();
    // Update every minute
    const intervalId = setInterval(updateTournamentInfo, 60000);

    return () => clearInterval(intervalId);
  }, [mode]);

  const tournamentKey = useMemo(
    () => getEntityIdFromKeys([BigInt(id)]) as Entity,
    [id],
  );

  const component = useComponentValue(Tournament, tournamentKey);
  const tournament = useMemo(() => {
    return component ? new TournamentClass(component) : null;
  }, [component]);

  return { id, endTimestamp, tournament };
};

export default useTournament;
