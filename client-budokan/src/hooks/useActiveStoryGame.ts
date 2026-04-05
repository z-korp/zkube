import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";

import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";

export interface ActiveStoryRun {
  gameId: bigint;
  zoneId: number;
  level: number;
}

export const useActiveStoryGame = (): ActiveStoryRun | null => {
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { ActiveStoryGame },
    },
  } = useDojo();

  const ownerBigInt = useMemo(() => {
    if (!account?.address) return null;
    try {
      return BigInt(account.address);
    } catch {
      return null;
    }
  }, [account?.address]);

  const activeStoryGameEntityIds = useEntityQuery([Has(ActiveStoryGame)]);

  return useMemo(() => {
    if (ownerBigInt === null) return null;

    for (const entity of activeStoryGameEntityIds) {
      const active = getComponentValue(ActiveStoryGame, entity);
      if (!active) continue;
      if (BigInt(active.player) !== ownerBigInt) continue;

      const gameId = BigInt(active.game_id ?? 0);
      if (gameId === 0n) continue;

      return {
        gameId,
        zoneId: Number(active.zone_id ?? 0),
        level: Number(active.level ?? 0),
      };
    }

    return null;
  }, [ownerBigInt, activeStoryGameEntityIds, ActiveStoryGame]);
};
