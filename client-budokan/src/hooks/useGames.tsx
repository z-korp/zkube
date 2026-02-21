import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { Has, getComponentValue } from "@dojoengine/recs";
import type { Game } from "@/dojo/game/models/game";

export const useGames = (): { games: Game[] } => {
  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeys = useEntityQuery([Has(Game)]);

  const games = useMemo(() => {
    const result: Game[] = [];
    for (const entity of gameKeys) {
      const component = getComponentValue(Game, entity);
      if (component) {
        result.push(new GameClass(component));
      }
    }
    return result;
  }, [gameKeys, Game, GameClass]);

  return { games };
};
