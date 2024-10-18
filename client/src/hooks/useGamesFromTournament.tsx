import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { Has, HasValue, getComponentValue } from "@dojoengine/recs";
import { Game } from "@/dojo/game/models/game";

export const useGamesFromTournament = ({
  tournamentId,
}: {
  tournamentId: number;
}): { games: Game[] } => {
  const [games, setGames] = useState<Game[]>([]);

  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeys = useEntityQuery([
    Has(Game),
    HasValue(Game, { tournament_id: tournamentId }),
  ]);

  useEffect(() => {
    const components = gameKeys
      .map((entity) => {
        const component = getComponentValue(Game, entity);
        if (!component) {
          return undefined;
        }
        return new GameClass(component);
      })
      .filter((e): e is Game => e !== undefined);

    if (components.length > 0) {
      setGames(
        components.sort(
          (a, b) => b.score_in_tournament - a.score_in_tournament,
        ),
      );
    }
  }, [gameKeys]);

  return { games };
};
