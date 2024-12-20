import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has } from "@dojoengine/recs";
import { useGeneralStore } from "@/stores/generalStore";

export const useWonTournaments = () => {
  const {
    setup: {
      clientModels: {
        models: { Tournament },
        classes: { Tournament: TournamentClass },
      },
    },
  } = useDojo();
  const { playerId: player_id } = useGeneralStore();
  type TournamentInstance = InstanceType<typeof TournamentClass>;
  const [tournaments, setTournaments] = useState<TournamentInstance[]>([]);

  const tournamentKeys = useEntityQuery([Has(Tournament)]);

  useEffect(() => {
    const components = tournamentKeys.map((entity) => {
      const component = getComponentValue(Tournament, entity);

      if (!component) {
        return undefined;
      }
      return new TournamentClass(component, 0n);
    });

    setTournaments(
      components
        .map(
          (component) => new TournamentClass(component as ComponentValue, 0n),
        )
        .filter((tournament) => {
          if (!player_id) return false;

          return (
            tournament.top1_player_id === player_id ||
            tournament.top2_player_id === player_id ||
            tournament.top3_player_id === player_id
          );
        }),
    );
  }, [tournamentKeys, player_id, Tournament, TournamentClass]);

  return tournaments;
};
