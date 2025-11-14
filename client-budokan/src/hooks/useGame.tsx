import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";
import { useInRouterContext, useParams } from "react-router-dom";

export const useGame = ({
  gameId,
}: {
  gameId: number | undefined;
  shouldLog: boolean;
}) => {
  const isInRouter = useInRouterContext();
  const params = isInRouter ? useParams<{ gameId?: string }>() : undefined;
  const routeGameId = params?.gameId;
  const {
    setup: {
      clientModels: {
        models: { Game },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeySource =
    routeGameId ?? (gameId !== undefined ? gameId.toString() : "0");

  const gameKey = useMemo(
    () => getEntityIdFromKeys([BigInt(gameKeySource)]) as Entity,
    [gameKeySource]
  );
  console.log("gameKey", gameKey)

  
  const component = useComponentValue(Game, "0x" +BigInt(gameKey).toString(16) as Entity);
  console.log("component", component)

  const game = useDeepMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  return { game, gameKey };
};
