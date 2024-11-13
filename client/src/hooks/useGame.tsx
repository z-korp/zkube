import { useDojo } from "@/dojo/useDojo";
import { useEffect, useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";
import { consoleTSLog } from "@/utils/logger";

export const useGame = ({
  gameId,
}: {
  gameId: string | undefined;
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

  const gameKey = useMemo(
    () => getEntityIdFromKeys([BigInt(gameId || 0)]) as Entity,
    [gameId],
  );
  const component = useComponentValue(Game, gameKey);

  const game = useDeepMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  useEffect(() => {
    consoleTSLog("danger", "Game grid changed", game?.blocks);
  }, [game?.blocks]);

  return { game, gameKey };
};
