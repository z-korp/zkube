import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has } from "@dojoengine/recs";

export const useTournaments = ({
  player_id,
}: {
  player_id: string | undefined;
}) => {
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

    console.log(components);

    setTournaments(
      components
        .map((component) => new TournamentClass(component as ComponentValue))
        .filter((tournament) => {
          if (!player_id) return false;
          const id = BigInt(player_id).toString(16);
          return (
            tournament.top1_player_id.toString(16) === id ||
            tournament.top2_player_id.toString(16) === id ||
            tournament.top3_player_id.toString(16) === id
          );
        }),
    );
  }, [tournamentKeys, player_id]);

  return tournaments;
};
