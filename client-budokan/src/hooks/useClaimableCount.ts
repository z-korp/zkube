import { useMemo } from "react";
import { useQuests } from "./useQuests";

export const useClaimableCount = (): number => {
  const { quests } = useQuests();

  return useMemo(() => {
    return quests.filter((q) => q.completed && !q.claimed).length;
  }, [quests]);
};
