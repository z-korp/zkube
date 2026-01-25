import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";
import { useInRouterContext, useParams } from "react-router-dom";

// Normalize entity ID to match Torii's format (no leading zeros after 0x)
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  // Remove leading zeros after 0x, but keep at least one digit
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

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

  const gameKey = useMemo(() => {
    const rawKey = getEntityIdFromKeys([BigInt(gameKeySource)]);
    return normalizeEntityId(rawKey);
  }, [gameKeySource]);

  const component = useComponentValue(Game, gameKey);

  console.log("[useGame] Game lookup:", {
    gameKeySource,
    gameKey,
    hasComponent: !!component,
    componentBlocks: component?.blocks,
    componentBlocksType: typeof component?.blocks,
  });

  const game = useDeepMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  return { game, gameKey };
};
