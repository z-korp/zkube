import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { Game } from "@/dojo/game/models/game";

export const useGames = (): { games: Game[] } => {
  const [games, setGames] = useState<any>({});

  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeys = useEntityQuery([Has(Game)]);

  useEffect(() => {
    const components = gameKeys.map((entity) => {
      const component = getComponentValue(Game, entity);
      if (!component) {
        return undefined;
      }
      return new GameClass(component);
    });

    const objectified = components.reduce(
      (obj: any, game: Game | undefined) => {
        if (game) {
          obj[game.id] = game;
        }
        return obj;
      },
      {},
    );

    setGames(objectified);
  }, [gameKeys]);

  return { games: Object.values(games) };
};
