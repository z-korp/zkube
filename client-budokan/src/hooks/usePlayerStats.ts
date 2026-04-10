import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";

const feltFromShortString = (value: string): bigint => {
  let result = 0n;
  for (let i = 0; i < value.length; i++) {
    result = (result << 8n) | BigInt(value.charCodeAt(i));
  }
  return result;
};

const TASK_LINE_CLEAR = feltFromShortString("LINE_CLEAR");
const TASK_BOSS_DEFEAT = feltFromShortString("BOSS_DEFEAT");
const TASK_COMBO_4 = feltFromShortString("COMBO_4");

export interface PlayerStats {
  totalLines: number;
  totalBosses: number;
  combo4Count: number;
}

export const usePlayerStats = (overrideAddress?: string): PlayerStats => {
  const { address: connectedAddress } = useAccount();
  const address = overrideAddress || connectedAddress;
  const {
    setup: {
      contractComponents: { AchievementAdvancement },
    },
  } = useDojo();

  const ownerBigInt = useMemo(() => {
    if (!address) return null;
    try {
      return BigInt(address);
    } catch {
      return null;
    }
  }, [address]);

  const entities = useEntityQuery([Has(AchievementAdvancement)]);

  return useMemo(() => {
    const stats: PlayerStats = { totalLines: 0, totalBosses: 0, combo4Count: 0 };
    if (ownerBigInt === null) return stats;

    for (const entity of entities) {
      const adv = getComponentValue(AchievementAdvancement, entity);
      if (!adv || BigInt(adv.player_id) !== ownerBigInt) continue;

      const taskId = BigInt(adv.task_id);
      const count = Number(BigInt(adv.count));

      if (taskId === TASK_LINE_CLEAR) {
        stats.totalLines = Math.max(stats.totalLines, count);
      } else if (taskId === TASK_BOSS_DEFEAT) {
        stats.totalBosses = Math.max(stats.totalBosses, count);
      } else if (taskId === TASK_COMBO_4) {
        stats.combo4Count = Math.max(stats.combo4Count, count);
      }
    }

    return stats;
  }, [ownerBigInt, entities, AchievementAdvancement]);
};
