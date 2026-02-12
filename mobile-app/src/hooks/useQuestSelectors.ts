import { useMemo } from "react";
import type {
  QuestDefinition,
  QuestCompletion,
  QuestAdvancement,
  QuestCreation,
  QuestReward,
} from "@/dojo/models/quest";
import { QUEST_FAMILIES, QUEST_REWARDS } from "@/constants";
import type { QuestProps } from "@/contexts/quests";
import type { QuestFamily, QuestFamilyId, QuestTier } from "@/types/questFamily";

function getRewardAmount(questId: string, rewards: QuestReward[]): number {
  if (QUEST_REWARDS[questId] !== undefined) {
    return QUEST_REWARDS[questId];
  }
  return rewards.reduce((sum, r) => {
    const match = r.description.match(/(\d+)/);
    return sum + (match ? parseInt(match[1], 10) : 0);
  }, 0);
}

export function useQuestSelectors(
  definitions: QuestDefinition[],
  completions: QuestCompletion[],
  advancements: QuestAdvancement[],
  creations: QuestCreation[],
): { quests: QuestProps[]; questFamilies: QuestFamily[] } {
  const quests: QuestProps[] = useMemo(() => {
    const questList = definitions.map((definition) => {
      const intervalId = definition.getIntervalId();
      const intervalIdToUse = intervalId ?? 0;

      const creation = creations.find(
        (c) => c.definition.id === definition.id,
      );

      const completion = completions.find(
        (c) =>
          c.quest_id === definition.id &&
          c.interval_id === intervalIdToUse,
      );

      const tasks = definition.tasks.map((task) => {
        const advancement = advancements.find(
          (adv) =>
            adv.quest_id === definition.id &&
            adv.task_id === task.id &&
            adv.interval_id === intervalIdToUse,
        );

        return {
          description: task.description,
          total: task.total,
          count: advancement?.count || 0n,
        };
      });

      return {
        id: definition.id,
        intervalId: intervalIdToUse,
        name: creation?.metadata.name || "Quest",
        description: creation?.metadata.description || "",
        registry: creation?.metadata.registry || "",
        end: definition.getNextEnd() || 0,
        completed: (completion?.timestamp || 0) > 0,
        claimed: !!completion && !completion.unclaimed,
        locked: false,
        conditions: definition.conditions,
        progression: 0,
        rewards: creation?.metadata.rewards || [],
        tasks,
      };
    });

    return questList
      .map((quest) => {
        const hasNoConditions = !quest.conditions || quest.conditions.length === 0;
        const allConditionsMet = quest.conditions?.every(
          (questId: string) => questList.find((q) => q.id === questId)?.completed,
        ) ?? true;
        const unlocked = hasNoConditions || allConditionsMet;

        return {
          ...quest,
          locked: !unlocked,
          progression: quest.tasks.reduce(
            (acc, task) =>
              acc + (Number(task.count) / Number(task.total)) * 100,
            0,
          ) / (quest.tasks.length || 1),
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id))
      .sort((a, b) => (a.end > b.end ? 1 : -1))
      .sort((a, b) => b.progression - a.progression)
      .sort((a, b) => (a.completed && !b.completed ? -1 : 1));
  }, [definitions, completions, advancements, creations]);

  const questFamilies: QuestFamily[] = useMemo(() => {
    const families: QuestFamily[] = Object.entries(QUEST_FAMILIES).map(([familyId, config]) => {
      const familyQuests = config.questIds
        .map((questId) => quests.find((q) => q.id === questId))
        .filter((q): q is QuestProps => q !== undefined);

      const tiers: QuestTier[] = familyQuests.map((quest, index) => {
        const target = quest.tasks.length > 0 ? Number(quest.tasks[0].total) : 1;
        const reward = getRewardAmount(quest.id, quest.rewards);

        return {
          tier: index + 1,
          questId: quest.id,
          name: quest.name,
          description: quest.description,
          target,
          reward,
          completed: quest.completed,
          claimed: quest.claimed,
          locked: quest.locked,
          intervalId: quest.intervalId,
        };
      });

      const progress = familyQuests.length > 0 && familyQuests[0].tasks.length > 0
        ? Number(familyQuests[0].tasks[0].count)
        : 0;

      const currentTierIndex = tiers.findIndex((t) => !t.completed);
      const nextTarget = currentTierIndex >= 0 ? tiers[currentTierIndex].target : 0;
      const claimableTier = tiers.find((t) => t.completed && !t.claimed) ?? null;

      const totalReward = tiers.reduce((sum, t) => sum + t.reward, 0);
      const claimedReward = tiers.filter((t) => t.claimed).reduce((sum, t) => sum + t.reward, 0);
      const earnedReward = tiers.filter((t) => t.completed).reduce((sum, t) => sum + t.reward, 0);

      return {
        id: familyId as QuestFamilyId,
        name: config.name,
        icon: config.icon,
        tiers,
        currentTierIndex,
        totalTiers: tiers.length,
        progress,
        nextTarget,
        claimableTier,
        totalReward,
        claimedReward,
        earnedReward,
      };
    });

    return families.sort((a, b) => {
      if (a.id === 'finisher') return 1;
      if (b.id === 'finisher') return -1;
      if (a.claimableTier && !b.claimableTier) return -1;
      if (!a.claimableTier && b.claimableTier) return 1;
      return 0;
    });
  }, [quests]);

  return { quests, questFamilies };
}
