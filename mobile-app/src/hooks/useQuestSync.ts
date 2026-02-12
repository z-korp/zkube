import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@/dojo/models/quest";
import { NAMESPACE, QUEST_REWARDS } from "@/constants";
import { normalizeAddress } from "@/utils/address";
import { showToast } from "@/utils/toast";
import { createLogger } from "@/utils/logger";

const log = createLogger("useQuestSync");

export interface QuestSyncState {
  definitions: QuestDefinition[];
  completions: QuestCompletion[];
  advancements: QuestAdvancement[];
  creations: QuestCreation[];
  status: "loading" | "error" | "success";
  refresh: () => Promise<void>;
}

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

const getPlayerEntityQuery = (namespace: string, playerId: string) => {
  const completion: `${string}-${string}` = `${namespace}-${QuestCompletion.getModelName()}`;
  const advancement: `${string}-${string}` = `${namespace}-${QuestAdvancement.getModelName()}`;
  const key = normalizeAddress(playerId);
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
  const key = normalizeAddress(playerId);
  const clauses = new ClauseBuilder().keys(
    [unlocked, completed, claimed],
    [key],
    "VariableLen",
  );
  return new ToriiQueryBuilder()
    .withClause(clauses.build())
    .includeHashedKeys();
};

export function useQuestSync(
  toriiClient: torii.ToriiClient | null | undefined,
  address: string | undefined,
): QuestSyncState {
  const entitySubscriptionRef = useRef<torii.Subscription | null>(null);
  const eventSubscriptionRef = useRef<torii.Subscription | null>(null);
  const [definitions, setDefinitions] = useState<QuestDefinition[]>([]);
  const [completions, setCompletions] = useState<QuestCompletion[]>([]);
  const [advancements, setAdvancements] = useState<QuestAdvancement[]>([]);
  const [creations, setCreations] = useState<QuestCreation[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const creationsRef = useRef<QuestCreation[]>([]);

  useEffect(() => {
    creationsRef.current = creations;
  }, [creations]);

  const onEntityUpdate = useCallback(
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;

      const entities = response.data || (Array.isArray(response) ? response : [response]);
      if (!entities || entities.length === 0) return;

      entities.forEach((entity: any) => {
        if (!entity?.models) return;

        if (entity.models[`${NAMESPACE}-${QuestDefinition.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestDefinition.getModelName()}`
          ] as unknown as RawDefinition;
          setDefinitions((prev) =>
            QuestDefinition.deduplicate([QuestDefinition.parse(model), ...prev]),
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

          if (parsed.timestamp > 0 && parsed.unclaimed) {
            const quest = creationsRef.current.find(
              (c) => c.definition.id === parsed.quest_id,
            );
            if (quest) {
              showToast({
                message: `${quest.metadata.name}`,
                type: "success",
                toastId: `quest-complete-${parsed.quest_id}-${parsed.interval_id}`,
              });
            }
          }
        }
        if (entity.models[`${NAMESPACE}-${QuestAdvancement.getModelName()}`]) {
          const model = entity.models[
            `${NAMESPACE}-${QuestAdvancement.getModelName()}`
          ] as unknown as RawAdvancement;
          setAdvancements((prev) =>
            QuestAdvancement.deduplicate([QuestAdvancement.parse(model), ...prev]),
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

  const onQuestEvent = useCallback(
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;

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
            showToast({
              message: `${quest.metadata.name}`,
              type: "info",
              toastId: `quest-unlocked-${event.quest_id}-${event.interval_id}`,
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
            showToast({
              message: `${quest.metadata.name}`,
              type: "success",
              toastId: `quest-completed-event-${event.quest_id}-${event.interval_id}`,
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
            let rewardAmount = QUEST_REWARDS[event.quest_id];
            if (rewardAmount === undefined) {
              rewardAmount = quest.metadata.rewards.reduce((sum, r) => {
                const match = r.description.match(/(\d+)/);
                return sum + (match ? parseInt(match[1], 10) : 0);
              }, 0);
            }
            showToast({
              message: `${quest.metadata.name}`,
              description: rewardAmount > 0 ? `+${rewardAmount} CUBE claimed!` : "Reward claimed!",
              type: "success",
              toastId: `quest-claimed-${event.quest_id}-${event.interval_id}`,
            });
          }
        }
      });
    },
    [],
  );

  const fetchQuestData = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    const questEntityQuery = getQuestEntityQuery(NAMESPACE);
    const questEventQuery = getQuestEventQuery(NAMESPACE);
    const playerEntityQuery = getPlayerEntityQuery(NAMESPACE, address);

    try {
      const [questEntities, questEvents, playerEntities] = await Promise.all([
        toriiClient.getEntities(questEntityQuery.build()),
        toriiClient.getEventMessages(questEventQuery.build()),
        toriiClient.getEntities(playerEntityQuery.build()),
      ]);

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
      log.error("Error fetching quest data:", error);
      throw error;
    }
  }, [toriiClient, address, onEntityUpdate]);

  const setupSubscriptions = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    if (entitySubscriptionRef.current) {
      try { entitySubscriptionRef.current.cancel(); } catch { /* ignore */ }
      entitySubscriptionRef.current = null;
    }
    if (eventSubscriptionRef.current) {
      try { eventSubscriptionRef.current.cancel(); } catch { /* ignore */ }
      eventSubscriptionRef.current = null;
    }

    const playerEntityQuery = getPlayerEntityQuery(NAMESPACE, address);
    const playerEventQuery = getPlayerEventQuery(NAMESPACE, address);

    try {
      const entitySubscription = await toriiClient.onEntityUpdated(
        playerEntityQuery.build().clause,
        [],
        (response: any) => {
          if (response) onEntityUpdate(response);
        },
      );
      entitySubscriptionRef.current = entitySubscription;

      const eventSubscription = await toriiClient.onEventMessageUpdated(
        playerEventQuery.build().clause,
        [],
        (response: any) => {
          if (response) onQuestEvent(response);
        },
      );
      eventSubscriptionRef.current = eventSubscription;
    } catch (error) {
      log.error("Error setting up quest subscriptions:", error);
    }
  }, [toriiClient, address, onEntityUpdate, onQuestEvent]);

  const refresh = useCallback(async () => {
    await fetchQuestData();
  }, [fetchQuestData]);

  useEffect(() => {
    if (!toriiClient || !address) return;

    setStatus("loading");
    fetchQuestData()
      .then(() => setStatus("success"))
      .catch((error) => {
        log.error("Quest data fetch failed:", error);
        setStatus("error");
      });
  }, [toriiClient, address, fetchQuestData]);

  useEffect(() => {
    if (status === "success" && toriiClient && address) {
      setupSubscriptions();
    }

    return () => {
      if (entitySubscriptionRef.current) {
        try { entitySubscriptionRef.current.cancel(); } catch { /* ignore */ }
      }
      if (eventSubscriptionRef.current) {
        try { eventSubscriptionRef.current.cancel(); } catch { /* ignore */ }
      }
    };
  }, [status, toriiClient, address, setupSubscriptions]);

  return { definitions, completions, advancements, creations, status, refresh };
}
