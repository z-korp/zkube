import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has } from "@dojoengine/recs";
import { ModeType } from "@/dojo/game/types/mode";

export const useTournaments = ({ mode }: { mode: ModeType }) => {
  const {
    setup: {
      clientModels: {
        models: { Tournament },
        classes: { Tournament: TournamentClass },
      },
    },
  } = useDojo();
  type TournamentInstance = InstanceType<typeof TournamentClass>;
  const [tournaments, setTournaments] = useState<TournamentInstance[]>([]);

  const tournamentKeys = useEntityQuery([Has(Tournament)]);

  useEffect(() => {
    const components = tournamentKeys.map((entity) => {
      const component = getComponentValue(Tournament, entity);

      if (!component) {
        return undefined;
      }
      return new TournamentClass(component);
    });

    setTournaments(
      components
        .map((component) => new TournamentClass(component as ComponentValue))
        .filter((tournament) => tournament.mode.value === mode)
        .sort((a, b) => b.getEndDate().getTime() - a.getEndDate().getTime()),
    );
  }, [tournamentKeys]);

  return tournaments;
};
