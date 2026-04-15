import { useMemo } from "react";
import { useQuests } from "./useQuests";
import { useUnsettledRewards } from "./useUnsettledRewards";

export const useClaimableCount = (): number => {
  const { quests } = useQuests();
  const { totalUnsettled } = useUnsettledRewards();

  return useMemo(() => {
    return quests.filter((q) => q.completed && !q.claimed).length + totalUnsettled;
  }, [quests, totalUnsettled]);
};

export const useClaimableCounts = () => {
  const { quests } = useQuests();
  const { hasUnsettledDaily, unsettledWeeklyZones } = useUnsettledRewards();
  return useMemo(() => {
    const claimable = quests.filter((q) => q.completed && !q.claimed);
    return {
      total: claimable.length + (hasUnsettledDaily ? 1 : 0) + unsettledWeeklyZones.size,
      daily: claimable.filter((q) => q.type === "daily" || q.type === "finisher").length,
      weekly: claimable.filter((q) => q.type === "weekly").length,
      unsettledDaily: hasUnsettledDaily ? 1 : 0,
      unsettledWeeklyZones,
    };
  }, [quests, hasUnsettledDaily, unsettledWeeklyZones]);
};
