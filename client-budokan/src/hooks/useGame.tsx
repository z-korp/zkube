import { useDojo } from "@/dojo/useDojo";
import { useMemo, useEffect, useState } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import useDeepMemo from "./useDeepMemo";
import { normalizeEntityId } from "@/utils/entityId";

export const useGame = ({
  gameId,
}: {
  gameId: bigint | undefined;
  shouldLog: boolean;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Game, GameSeed },
        classes: { Game: GameClass },
      },
    },
  } = useDojo();

  const gameKeySource = gameId ?? 0n;

  const gameKey = useMemo(() => {
    const rawKey = getEntityIdFromKeys([gameKeySource]);
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
    return s;
  }, [seedComponent, gameKey, retryCount]);

  // Retry fetching seed if game exists but seed is missing
  useEffect(() => {
    if (game && !seedComponent && retryCount < 5) {
      const delay = 500 * Math.pow(2, retryCount);
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [game, seedComponent, retryCount]);

  // Reset retry count when game changes
  useEffect(() => {
    setRetryCount(0);
  }, [gameKey]);



  return { game, gameKey, seed };
};
