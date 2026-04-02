import { useMemo } from "react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { QUEST_DEFS, getQuestIntervalId, isQuestActive, type QuestDef, type QuestType } from "@/config/questDefs";

export interface QuestStatus extends QuestDef {
  intervalId: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  active: boolean;
}

interface UseQuestsResult {
  quests: QuestStatus[];
  isLoading: boolean;
}

export const useQuests = (): UseQuestsResult => {
  const { address } = useAccount();
  const {
    setup: {
      contractComponents: { QuestAdvancement, QuestCompletion },
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

  const quests = useMemo<QuestStatus[]>(() => {
    const nowSeconds = Math.floor(Date.now() / 1000);

    const advancementByKey = new Map<string, bigint>();
    const advancementEntities = Array.from(runQuery([Has(QuestAdvancement)]));
    for (const entity of advancementEntities) {
      const advancement = getComponentValue(QuestAdvancement, entity);
      if (!advancement || ownerBigInt === null || BigInt(advancement.player_id) !== ownerBigInt) continue;

      const key = `${advancement.quest_id.toString()}-${advancement.task_id.toString()}-${Number(advancement.interval_id)}`;
      advancementByKey.set(key, BigInt(advancement.count));
    }

    const completionByKey = new Map<string, { unclaimed: boolean }>();
    const completionEntities = Array.from(runQuery([Has(QuestCompletion)]));
    for (const entity of completionEntities) {
      const completion = getComponentValue(QuestCompletion, entity);
      if (!completion || ownerBigInt === null || BigInt(completion.player_id) !== ownerBigInt) continue;

      const key = `${completion.quest_id.toString()}-${Number(completion.interval_id)}`;
      completionByKey.set(key, { unclaimed: completion.unclaimed });
    }

    return QUEST_DEFS.map((quest) => {
      const intervalId = getQuestIntervalId(quest, nowSeconds);
      const advancementKey = `${quest.id.toString()}-${quest.taskId.toString()}-${intervalId}`;
      const completionKey = `${quest.id.toString()}-${intervalId}`;

      const progressRaw = advancementByKey.get(advancementKey) ?? 0n;
      const progress = Number(progressRaw > BigInt(Number.MAX_SAFE_INTEGER) ? BigInt(Number.MAX_SAFE_INTEGER) : progressRaw);
      const completion = completionByKey.get(completionKey);

      return {
        ...quest,
        intervalId,
        progress,
        completed: Boolean(completion),
        claimed: completion ? !completion.unclaimed : false,
        active: isQuestActive(quest, nowSeconds),
      };
    });
  }, [ownerBigInt, QuestAdvancement, QuestCompletion]);

  return { quests, isLoading: false };
};

export const groupQuests = (quests: QuestStatus[]): Record<QuestType, QuestStatus[]> => ({
  daily: quests.filter((quest) => quest.type === "daily"),
  weekly: quests.filter((quest) => quest.type === "weekly"),
  finisher: quests.filter((quest) => quest.type === "finisher"),
});
