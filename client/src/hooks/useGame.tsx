import { useDojo } from "@/dojo/useDojo";
import { useMemo, useEffect, useState } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import useDeepMemo from "./useDeepMemo";
import { useInRouterContext, useParams } from "react-router-dom";
import { normalizeEntityId } from "@/utils/entityId";
import { createLogger } from "@/utils/logger";

const log = createLogger("useGame");

export const useGame = ({
  gameId,
}: {
  gameId: number | undefined;
  shouldLog: boolean;
}) => {
  const isInRouter = useInRouterContext();
  const params = useParams<{ gameId?: string }>();
  const routeGameId = isInRouter ? params?.gameId : undefined;
  const {
    setup: {
      clientModels: {
        models: { Game, GameSeed },
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
  const seedComponent = useComponentValue(GameSeed, gameKey);

  const game = useDeepMemo(() => {
    return component ? new GameClass(component) : null;
  }, [component]);

  // Track if we need to retry fetching the seed
  const [retryCount, setRetryCount] = useState(0);

  const seed = useMemo(() => {
    const s = seedComponent?.seed ? BigInt(seedComponent.seed) : BigInt(0);
    log.debug("GameSeed fetched:", {
      gameKey,
      hasSeedComponent: !!seedComponent,
      seed: s.toString(),
      retryCount,
    });
    return s;
  }, [seedComponent, gameKey, retryCount]);

  // Retry fetching seed if game exists but seed is missing
  useEffect(() => {
    if (game && !seedComponent && retryCount < 5) {
      const timer = setTimeout(() => {
        log.debug("Retrying seed fetch, attempt:", retryCount + 1);
        setRetryCount((prev) => prev + 1);
      }, 500); // Retry every 500ms
      return () => clearTimeout(timer);
    }
  }, [game, seedComponent, retryCount]);

  // Reset retry count when game changes
  useEffect(() => {
    setRetryCount(0);
  }, [gameKey]);

  // Log game state when it changes
  useEffect(() => {
    if (game) {
      log.debug("Game state:", {
        id: game.id,
        level: game.level,
        levelScore: game.levelScore,
        levelMoves: game.levelMoves,
        totalCubes: game.totalCubes,
        totalScore: game.totalScore,
        comboBonus: game.comboBonus,
        scoreBonus: game.scoreBonus,
        harvest: game.harvest,
        combo: game.combo,
        maxCombo: game.max_combo,
        over: game.over,
      });
    }
  }, [game]);

  return { game, gameKey, seed };
};
