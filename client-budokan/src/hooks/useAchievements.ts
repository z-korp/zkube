import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { ACHIEVEMENT_DEFS, type AchievementCategory, type AchievementDef } from "@/config/achievementDefs";

export interface AchievementStatus extends AchievementDef {
  progress: number;
  completed: boolean;
  claimed: boolean;
}

interface UseAchievementsResult {
  achievements: AchievementStatus[];
  isLoading: boolean;
}

export const useAchievements = (playerAddress?: string): UseAchievementsResult => {
  const { address: connectedAddress } = useAccount();
  const resolvedAddress = playerAddress ?? connectedAddress;
  const {
    setup: {
      contractComponents: { AchievementAdvancement, AchievementCompletion },
    },
  } = useDojo();

  const ownerBigInt = useMemo(() => {
    if (!resolvedAddress) return null;
    try {
      return BigInt(resolvedAddress);
    } catch {
      return null;
    }
  }, [resolvedAddress]);

  const advancementEntityIds = useEntityQuery([Has(AchievementAdvancement)]);
  const completionEntityIds = useEntityQuery([Has(AchievementCompletion)]);

  const achievements = useMemo<AchievementStatus[]>(() => {
    const advancementByKey = new Map<string, bigint>();
    for (const entity of advancementEntityIds) {
      const advancement = getComponentValue(AchievementAdvancement, entity);
      if (!advancement || ownerBigInt === null || BigInt(advancement.player_id) !== ownerBigInt) continue;

      const key = `${advancement.achievement_id.toString()}-${advancement.task_id.toString()}`;
      advancementByKey.set(key, BigInt(advancement.count));
    }

    const completionById = new Map<string, { unclaimed: boolean }>();
    for (const entity of completionEntityIds) {
      const completion = getComponentValue(AchievementCompletion, entity);
      if (!completion || ownerBigInt === null || BigInt(completion.player_id) !== ownerBigInt) continue;

      const key = completion.achievement_id.toString();
      // timestamp=0 means the library is just tracking progress, not a real completion
      const isCompleted = (completion.timestamp ?? 0) !== 0;
      completionById.set(key, { unclaimed: completion.unclaimed, isCompleted });
    }

    return ACHIEVEMENT_DEFS.map((achievement) => {
      const advancementKey = `${achievement.id.toString()}-${achievement.taskId.toString()}`;
      const progressRaw = advancementByKey.get(advancementKey) ?? 0n;
      const progress = Number(progressRaw > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : progressRaw);
      const completion = completionById.get(achievement.id.toString());

      return {
        ...achievement,
        progress,
        completed: completion?.isCompleted ?? false,
        claimed: completion?.isCompleted && !completion.unclaimed ? true : false,
      };
    });
  }, [ownerBigInt, advancementEntityIds, completionEntityIds, AchievementAdvancement, AchievementCompletion]);

  return { achievements, isLoading: false };
};

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "Grinder",
  "Sweeper",
  "Combo Master",
  "Guardian Slayer",
  "Explorer",
  "Challenger",
];
