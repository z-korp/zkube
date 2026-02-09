import type React from "react";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ClauseBuilder,
  ToriiQueryBuilder,
} from "@dojoengine/sdk";
import type * as torii from "@dojoengine/torii-client";
import {
  QuestAdvancement,
  QuestCompletion,
  QuestDefinition,
  QuestCreation,
  QuestUnlocked,
  QuestCompleted,
  QuestClaimed,
  type RawDefinition,
  type RawCompletion,
  type RawAdvancement,
  type RawCreation,
  type RawUnlocked,
  type RawCompleted,
  type RawClaimed,
  type QuestReward,
} from "@/dojo/models/quest";
// getChecksumAddress imported for future use if needed
// import { getChecksumAddress } from "starknet";
import { useAccount } from "@starknet-react/core";
import { NAMESPACE, QUEST_FAMILIES, QUEST_REWARDS } from "@/constants";
import { useDojo } from "@/dojo/useDojo";
import { toast } from "sonner";
import { getToastPlacement } from "@/utils/toast";
import type { QuestFamily, QuestFamilyId, QuestTier } from "@/types/questFamily";

export type QuestProps = {
  id: string;
  intervalId: number;
  name: string;
  description: string;
  end: number;
  completed: boolean;
  locked: boolean;
  claimed: boolean;
  progression: number;
  registry: string;
  rewards: QuestReward[];
  tasks: {
    description: string;
    total: bigint;
    count: bigint;
  }[];
};

interface QuestsContextType {
  quests: QuestProps[];
  questFamilies: QuestFamily[];
  status: "loading" | "error" | "success";
  refresh: () => Promise<void>;
}

const QuestsContext = createContext<QuestsContextType | undefined>(undefined);

const getQuestEntityQuery = (namespace: string) => {
  const definition: `${string}-${string}` = `${namespace}-${QuestDefinition.getModelName()}`;
  const clauses = new ClauseBuilder().keys(
    [definition],
    [undefined],
    "FixedLen",
  );
  return new ToriiQueryBuilder()
    .withClause(clauses.build())
    .includeHashedKeys();
};

const getQuestEventQuery = (namespace: string) => {
  const creation: `${string}-${string}` = `${namespace}-${QuestCreation.getModelName()}`;
  const clauses = new ClauseBuilder().keys([creation], [undefined], "FixedLen");
  return new ToriiQueryBuilder()
    .withClause(clauses.build())
    .includeHashedKeys();
};

// Normalize address to match Torii's format (no leading zeros after 0x)
const normalizeAddress = (address: string): string => {
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const getPlayerEntityQuery = (namespace: string, playerId: string) => {
  const completion: `${string}-${string}` = `${namespace}-${QuestCompletion.getModelName()}`;
  const advancement: `${string}-${string}` = `${namespace}-${QuestAdvancement.getModelName()}`;
  // Normalize address to match Torii's storage format
  const normalizedAddress = normalizeAddress(playerId);
  const key = normalizedAddress.toLowerCase();
  const clauses = new ClauseBuilder().keys(
    [completion, advancement],
    [key],
    "VariableLen",
  );
  return new ToriiQueryBuilder()
    .withClause(clauses.build())
    .includeHashedKeys();
};

const getPlayerEventQuery = (namespace: string, playerId: string) => {
  const unlocked: `${string}-${string}` = `${namespace}-${QuestUnlocked.getModelName()}`;
  const completed: `${string}-${string}` = `${namespace}-${QuestCompleted.getModelName()}`;
  const claimed: `${string}-${string}` = `${namespace}-${QuestClaimed.getModelName()}`;
  // Normalize address to match Torii's storage format
  const normalizedAddress = normalizeAddress(playerId);
  const key = normalizedAddress.toLowerCase();
  const clauses = new ClauseBuilder().keys(
    [unlocked, completed, claimed],
    [key],
    "VariableLen",
  );
  return new ToriiQueryBuilder()
    .withClause(clauses.build())
    .includeHashedKeys();
};

export function QuestsProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { setup } = useDojo();
  const { toriiClient } = setup;
  
  const entitySubscriptionRef = useRef<torii.Subscription | null>(null);
  const eventSubscriptionRef = useRef<torii.Subscription | null>(null);
  const [definitions, setDefinitions] = useState<QuestDefinition[]>([]);
  const [completions, setCompletions] = useState<QuestCompletion[]>([]);
  const [advancements, setAdvancements] = useState<QuestAdvancement[]>([]);
  const [creations, setCreations] = useState<QuestCreation[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );
  const creationsRef = useRef<QuestCreation[]>([]);
  
  // Keep creationsRef in sync
  useEffect(() => {
    creationsRef.current = creations;
  }, [creations]);

  // Handler for entity updates (definitions, completions, advancements, creations)
  const onEntityUpdate = useCallback(
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;
      
      // Handle both direct data array and wrapped response
      const entities = response.data || (Array.isArray(response) ? response : [response]);
      if (!entities || entities.length === 0) return;
      
      entities.forEach((entity: any) => {
        if (!entity?.models) return;
        
        if (entity.models[`${NAMESPACE}-${QuestDefinition.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestDefinition.getModelName()}`
          ] as unknown as RawDefinition;
          setDefinitions((prev) =>
            QuestDefinition.deduplicate([
              QuestDefinition.parse(model),
              ...prev,
            ]),
          );
        }
        if (entity.models[`${NAMESPACE}-${QuestCompletion.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestCompletion.getModelName()}`
          ] as unknown as RawCompletion;
          const parsed = QuestCompletion.parse(model);
          setCompletions((prev) =>
            QuestCompletion.deduplicate([parsed, ...prev]),
          );
          
          // Show toast for quest completion
          if (parsed.timestamp > 0 && parsed.unclaimed) {
            const quest = creationsRef.current.find(
              (c) => c.definition.id === parsed.quest_id,
            );
            if (quest) {
              toast.success(`${quest.metadata.name}`, {
                description: "Quest completed! Claim your reward.",
                position: getToastPlacement(),
              });
            }
          }
        }
        if (entity.models[`${NAMESPACE}-${QuestAdvancement.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestAdvancement.getModelName()}`
          ] as unknown as RawAdvancement;
          setAdvancements((prev) =>
            QuestAdvancement.deduplicate([
              QuestAdvancement.parse(model),
              ...prev,
            ]),
          );
        }
        if (entity.models[`${NAMESPACE}-${QuestCreation.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestCreation.getModelName()}`
          ] as unknown as RawCreation;
          setCreations((prev) =>
            QuestCreation.deduplicate([QuestCreation.parse(model), ...prev]),
          );
        }
      });
    },
    [],
  );

  // Handler for quest events (unlocked, completed, claimed) - triggers toasts
  const onQuestEvent = useCallback(
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;
      
      // Handle both direct data array and wrapped response
      const entities = response.data || (Array.isArray(response) ? response : [response]);
      if (!entities || entities.length === 0) return;
      
      entities.forEach((entity: any) => {
        if (!entity?.models) return;
        
        if (entity.models[`${NAMESPACE}-${QuestUnlocked.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestUnlocked.getModelName()}`
          ] as unknown as RawUnlocked;
          const event = QuestUnlocked.parse(model);
          const quest = creationsRef.current.find(
            (c) => c.definition.id === event.quest_id,
          );
          if (quest) {
            toast.info(`${quest.metadata.name}`, {
              description: "New quest unlocked!",
              position: getToastPlacement(),
            });
          }
        }
        if (entity.models[`${NAMESPACE}-${QuestCompleted.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestCompleted.getModelName()}`
          ] as unknown as RawCompleted;
          const event = QuestCompleted.parse(model);
          const quest = creationsRef.current.find(
            (c) => c.definition.id === event.quest_id,
          );
          if (quest) {
            toast.success(`${quest.metadata.name}`, {
              description: "Quest completed! Claim your reward.",
              position: getToastPlacement(),
            });
          }
        }
        if (entity.models[`${NAMESPACE}-${QuestClaimed.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestClaimed.getModelName()}`
          ] as unknown as RawClaimed;
          const event = QuestClaimed.parse(model);
          const quest = creationsRef.current.find(
            (c) => c.definition.id === event.quest_id,
          );
          if (quest) {
            // Get reward amount - use override if available
            let rewardAmount = QUEST_REWARDS[event.quest_id];
            if (rewardAmount === undefined) {
              // Fallback: parse from metadata
              rewardAmount = quest.metadata.rewards.reduce((sum, r) => {
                const match = r.description.match(/(\d+)/);
                return sum + (match ? parseInt(match[1], 10) : 0);
              }, 0);
            }
            toast.success(`${quest.metadata.name}`, {
              description: rewardAmount > 0 
                ? `+${rewardAmount} CUBE claimed!` 
                : "Reward claimed!",
              position: getToastPlacement(),
            });
          }
        }
      });
    },
    [],
  );

  // Fetch all quest data
  const fetchQuestData = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    const questEntityQuery = getQuestEntityQuery(NAMESPACE);
    const questEventQuery = getQuestEventQuery(NAMESPACE);
    const playerEntityQuery = getPlayerEntityQuery(NAMESPACE, address);

    try {
      // Fetch initial data in parallel
      const [questEntities, questEvents, playerEntities] = await Promise.all([
        toriiClient.getEntities(questEntityQuery.build()),
        toriiClient.getEventMessages(questEventQuery.build()),
        toriiClient.getEntities(playerEntityQuery.build()),
      ]);

      // Process results
      if (questEntities?.items) {
        onEntityUpdate({ data: questEntities.items });
      }
      if (questEvents?.items) {
        onEntityUpdate({ data: questEvents.items });
      }
      if (playerEntities?.items) {
        onEntityUpdate({ data: playerEntities.items });
      }
    } catch (error) {
      console.error("Error fetching quest data:", error);
      throw error;
    }
  }, [toriiClient, address, onEntityUpdate]);

  // Setup subscriptions
  const setupSubscriptions = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    // Cancel existing subscriptions
    if (entitySubscriptionRef.current) {
      try {
        entitySubscriptionRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      entitySubscriptionRef.current = null;
    }
    if (eventSubscriptionRef.current) {
      try {
        eventSubscriptionRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      eventSubscriptionRef.current = null;
    }

    const playerEntityQuery = getPlayerEntityQuery(NAMESPACE, address);
    const playerEventQuery = getPlayerEventQuery(NAMESPACE, address);

    try {
      // Subscribe to player entity updates (completions, advancements)
        const entitySubscription = await toriiClient.onEntityUpdated(
          playerEntityQuery.build().clause,
          [],
          (response: any) => {
          // Handle subscription updates
          if (response) {
            onEntityUpdate(response);
          }
        }
      );
      entitySubscriptionRef.current = entitySubscription;

      // Subscribe to quest event messages (unlocked, completed, claimed)
        const eventSubscription = await toriiClient.onEventMessageUpdated(
          playerEventQuery.build().clause,
          [],
          (response: any) => {
          // Handle event updates
          if (response) {
            onQuestEvent(response);
          }
        }
      );
      eventSubscriptionRef.current = eventSubscription;
    } catch (error) {
      console.error("Error setting up quest subscriptions:", error);
    }
  }, [toriiClient, address, onEntityUpdate, onQuestEvent]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchQuestData();
  }, [fetchQuestData]);

  // Initial fetch
  useEffect(() => {
    if (!toriiClient || !address) return;
    
    setStatus("loading");
    fetchQuestData()
      .then(() => {
        setStatus("success");
      })
      .catch((error) => {
        console.error(error);
        setStatus("error");
      });
  }, [toriiClient, address, fetchQuestData]);

  // Setup subscriptions after initial data is loaded
  useEffect(() => {
    if (status === "success" && toriiClient && address) {
      setupSubscriptions();
    }

    return () => {
      if (entitySubscriptionRef.current) {
        try {
          entitySubscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
      }
      if (eventSubscriptionRef.current) {
        try {
          eventSubscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
      }
    };
  }, [status, toriiClient, address, setupSubscriptions]);

  // Compute quests from the raw data
  const quests: QuestProps[] = useMemo(() => {
    const questList = definitions.map((definition) => {
      const intervalId = definition.getIntervalId();
      const intervalIdToUse = intervalId ?? 0; // Use 0 as fallback
      
      const creation = creations.find(
        (creation) => creation.definition.id === definition.id,
      );
      
      // Find completion for the CURRENT interval only (daily reset)
      const completion = completions.find(
        (completion) =>
          completion.quest_id === definition.id &&
          completion.interval_id === intervalIdToUse,
      );
      
      // Find tasks with advancement data for the CURRENT interval only
      const tasks = definition.tasks.map((task) => {
        // Only match advancements for the current interval (daily reset)
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

      const result = {
        id: definition.id,
        intervalId: intervalIdToUse,
        name: creation?.metadata.name || "Quest",
        description: creation?.metadata.description || "",
        registry: creation?.metadata.registry || "",
        end: definition.getNextEnd() || 0,
        completed: (completion?.timestamp || 0) > 0,
        claimed: !!completion && !completion.unclaimed,
        locked: false, // Will be set based on conditions below
        conditions: definition.conditions,
        progression: 0,
        rewards: creation?.metadata.rewards || [],
        tasks,
      };
      
      return result;
    });

    return questList
      .map((quest) => {
        // A quest is unlocked if it has no conditions OR all condition quests are completed
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

  // Compute quest families from the raw quest data
  const questFamilies: QuestFamily[] = useMemo(() => {
    // Helper to get reward amount - uses QUEST_REWARDS override if available, falls back to parsing metadata
    const getRewardAmount = (questId: string, rewards: QuestReward[]): number => {
      // Use override if available (since contract metadata may be stale)
      if (QUEST_REWARDS[questId] !== undefined) {
        return QUEST_REWARDS[questId];
      }
      // Fallback: parse from metadata description
      return rewards.reduce((sum, r) => {
        const match = r.description.match(/(\d+)/);
        return sum + (match ? parseInt(match[1], 10) : 0);
      }, 0);
    };

    // Build families from the QUEST_FAMILIES config
    const families: QuestFamily[] = Object.entries(QUEST_FAMILIES).map(([familyId, config]) => {
      // Get quests for this family in tier order
      const familyQuests = config.questIds
        .map((questId) => quests.find((q) => q.id === questId))
        .filter((q): q is QuestProps => q !== undefined);

      // Build tiers from quests
      const tiers: QuestTier[] = familyQuests.map((quest, index) => {
        // Get the target from the task (first task's total)
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

      // Get current progress from the first task of the first quest
      // Since all quests in a family share the same task, they should have the same progress
      const progress = familyQuests.length > 0 && familyQuests[0].tasks.length > 0
        ? Number(familyQuests[0].tasks[0].count)
        : 0;

      // Find current tier index (first incomplete tier)
      const currentTierIndex = tiers.findIndex((t) => !t.completed);

      // Get next target (target of current tier, or 0 if all done)
      const nextTarget = currentTierIndex >= 0 ? tiers[currentTierIndex].target : 0;

      // Find first claimable tier (completed but not claimed)
      const claimableTier = tiers.find((t) => t.completed && !t.claimed) ?? null;

      // Calculate reward totals
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

    // Sort: finisher last, then by progress
    return families.sort((a, b) => {
      if (a.id === 'finisher') return 1;
      if (b.id === 'finisher') return -1;
      // Sort by whether there's something claimable
      if (a.claimableTier && !b.claimableTier) return -1;
      if (!a.claimableTier && b.claimableTier) return 1;
      return 0;
    });
  }, [quests]);

  const value: QuestsContextType = {
    quests,
    questFamilies,
    status,
    refresh,
  };

  return (
    <QuestsContext.Provider value={value}>{children}</QuestsContext.Provider>
  );
}

export function useQuests() {
  const context = useContext(QuestsContext);
  if (!context) {
    throw new Error("useQuests must be used within a QuestsProvider");
  }
  return context;
}
