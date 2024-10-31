import { useState, useEffect, useMemo } from "react";
import { Mode, ModeType } from "../dojo/game/types/mode";
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

      const duration = new Mode(mode).duration();

      const id = Math.floor(currentTimestamp / duration);
      const end = (id + 1) * duration;

      // Check if the current timestamp has reached or passed the end timestamp
      if (currentTimestamp >= endTimestamp) {
        // Reset to initial values
        setEndTimestamp(end);
        setId(id);
      } else {
        // Update remaining time
        setEndTimestamp(end);
      }
    };

    updateTournamentInfo();
    // Update every second instead of every minute
    const intervalId = setInterval(updateTournamentInfo, 1000);

    return () => clearInterval(intervalId);
  }, [mode, endTimestamp]);

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
