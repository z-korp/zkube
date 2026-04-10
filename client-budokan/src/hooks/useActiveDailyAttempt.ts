import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";

import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";

export interface ActiveDailyRun {
  gameId: bigint;
  challengeId: number;
}

export const useActiveDailyAttempt = (): ActiveDailyRun | null => {
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { ActiveDailyAttempt },
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

  const entities = useEntityQuery([Has(ActiveDailyAttempt)]);

  return useMemo(() => {
    if (ownerBigInt === null) return null;

    for (const entity of entities) {
      const active = getComponentValue(ActiveDailyAttempt, entity);
      if (!active) continue;
      if (BigInt(active.player) !== ownerBigInt) continue;

      const gameId = BigInt(active.game_id ?? 0);
      if (gameId === 0n) continue;

      return {
        gameId,
        challengeId: Number(active.challenge_id ?? 0),
      };
    }

    return null;
  }, [ownerBigInt, entities, ActiveDailyAttempt]);
};
