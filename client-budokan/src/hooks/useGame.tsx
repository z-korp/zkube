import { useDojo } from "@/dojo/useDojo";
import { useEffect, useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const useGame = ({
  gameId,
}: {
  gameId: number | undefined;
  shouldLog: boolean;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  useEffect(() => {
    if (gameId) {
      console.log("[useGame] gameId", gameId);
    }
  }, [gameId]);

  const gameKey = useMemo(
    () => getEntityIdFromKeys([BigInt(gameId || 0)]) as Entity,
    [gameId]
  );
  console.log("[useGame] gameId gameKey", gameId, gameKey);
  const component = useComponentValue(Game, gameKey);

  const game = useDeepMemo(() => {
    console.log("[useGame] component", component);
    return component ? new GameClass(component) : null;
  }, [component]);

  useEffect(() => {
    if (game) {
      console.log("qsdqsdqsdqsd game changed", game?.id);
    }
  }, [game]);

  return { game, gameKey };
};
