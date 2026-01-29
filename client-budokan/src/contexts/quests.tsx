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
  type RawDefinition,
  type RawCompletion,
  type RawAdvancement,
  type RawCreation,
  type QuestReward,
} from "@/dojo/models/quest";
// getChecksumAddress imported for future use if needed
// import { getChecksumAddress } from "starknet";
import { useAccount } from "@starknet-react/core";
import { NAMESPACE } from "@/constants";
import { useDojo } from "@/dojo/useDojo";
import { toast } from "sonner";

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
  console.log("[Quests] Player entity query key:", key);
  const clauses = new ClauseBuilder().keys(
    [completion, advancement],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;
      
      // Handle both direct data array and wrapped response
      const entities = response.data || (Array.isArray(response) ? response : [response]);
      if (!entities || entities.length === 0) return;
      
      console.log("[Quests] onEntityUpdate received entities:", entities.length);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entities.forEach((entity: any) => {
        if (!entity?.models) {
          console.log("[Quests] Entity has no models:", entity);
          return;
        }
        
        // Log all model keys to see what's available
        console.log("[Quests] Entity model keys:", Object.keys(entity.models));
        
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

  // Fetch all quest data
  const fetchQuestData = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    console.log("[Quests] Fetching quest data for:", { NAMESPACE, address });

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

      console.log("[Quests] Fetched data:", {
        questEntities: questEntities?.items?.length || 0,
        questEvents: questEvents?.items?.length || 0,
        playerEntities: playerEntities?.items?.length || 0,
      });

      // Debug: log player entities to see what's being returned
      if (playerEntities?.items && playerEntities.items.length > 0) {
        console.log("[Quests] Player entities sample:", playerEntities.items[0]);
      } else {
        console.log("[Quests] No player entities found");
      }

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

    // Cancel existing subscription
    if (entitySubscriptionRef.current) {
      try {
        entitySubscriptionRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      entitySubscriptionRef.current = null;
    }

    const playerEntityQuery = getPlayerEntityQuery(NAMESPACE, address);

    try {
      // Subscribe to player entity updates (completions, advancements)
      const subscription = await toriiClient.onEntityUpdated(
        playerEntityQuery.build().clause,
        [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response: any) => {
          // Handle subscription updates
          if (response) {
            onEntityUpdate(response);
          }
        }
      );
      entitySubscriptionRef.current = subscription;
    } catch (error) {
      console.error("Error setting up quest subscriptions:", error);
    }
  }, [toriiClient, address, onEntityUpdate]);

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
    };
  }, [status, toriiClient, address, setupSubscriptions]);

  // Compute quests from the raw data
  const quests: QuestProps[] = useMemo(() => {
    // Debug logging
    console.log("[Quests] Computing quests from:", {
      definitions: definitions.length,
      completions: completions.length,
      advancements: advancements.length,
      creations: creations.length,
    });
    
    if (advancements.length > 0) {
      console.log("[Quests] Sample advancement:", advancements[0]);
    }

    const questList = definitions.map((definition) => {
      const intervalId = definition.getIntervalId();
      const intervalIdToUse = intervalId ?? 0; // Use 0 as fallback
      
      const creation = creations.find(
        (creation) => creation.definition.id === definition.id,
      );
      
      // Find completion - try exact interval match first, then any completion for this quest
      let completion = completions.find(
        (completion) =>
          completion.quest_id === definition.id &&
          completion.interval_id === intervalIdToUse,
      );
      
      // Fallback: if no exact match, try to find any completion for this quest
      if (!completion) {
        completion = completions.find(
          (c) => c.quest_id === definition.id
        );
      }
      
      // Find tasks with advancement data
      const tasks = definition.tasks.map((task) => {
        // Debug: log what we're looking for
        console.log("[Quests] Looking for advancement:", {
          quest_id: definition.id,
          task_id: task.id,
          intervalIdToUse,
          availableAdvancements: advancements.map(a => ({
            quest_id: a.quest_id,
            task_id: a.task_id,
            interval_id: a.interval_id,
            count: a.count.toString(),
          })),
        });
        
        // Try exact interval match first
        let advancement = advancements.find(
          (adv) =>
            adv.quest_id === definition.id &&
            adv.task_id === task.id &&
            adv.interval_id === intervalIdToUse,
        );
        
        // Fallback: try any advancement for this quest/task
        if (!advancement) {
          advancement = advancements.find(
            (adv) =>
              adv.quest_id === definition.id &&
              adv.task_id === task.id,
          );
        }
        
        if (advancement) {
          console.log("[Quests] Found advancement for", definition.id, task.id, ":", advancement.count.toString());
        } else {
          console.log("[Quests] No advancement found for", definition.id, task.id);
        }
        
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

  const value: QuestsContextType = {
    quests,
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
