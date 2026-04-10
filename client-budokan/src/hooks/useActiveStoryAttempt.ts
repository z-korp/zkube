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

export const useActiveStoryAttempt = (): ActiveStoryRun | null => {
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { ActiveStoryAttempt },
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

  const activeStoryAttemptEntityIds = useEntityQuery([Has(ActiveStoryAttempt)]);

  return useMemo(() => {
    if (ownerBigInt === null) return null;

    for (const entity of activeStoryAttemptEntityIds) {
      const active = getComponentValue(ActiveStoryAttempt, entity);
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
  }, [ownerBigInt, activeStoryAttemptEntityIds, ActiveStoryAttempt]);
};
