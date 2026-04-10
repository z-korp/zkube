import { useMemo } from "react";
import { useQuests } from "./useQuests";

export const useClaimableCount = (): number => {
  const { quests } = useQuests();

  return useMemo(() => {
    return quests.filter((q) => q.completed && !q.claimed).length;
  }, [quests]);
};

export const useClaimableCounts = () => {
  const { quests } = useQuests();
  return useMemo(() => {
    const claimable = quests.filter((q) => q.completed && !q.claimed);
    return {
      total: claimable.length,
      daily: claimable.filter((q) => q.type === "daily" || q.type === "finisher").length,
      weekly: claimable.filter((q) => q.type === "weekly").length,
    };
  }, [quests]);
};
