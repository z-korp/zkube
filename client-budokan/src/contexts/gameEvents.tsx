import type React from "react";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { ClauseBuilder, ToriiQueryBuilder } from "@dojoengine/sdk";
import type * as torii from "@dojoengine/torii-client";
import { useAccount } from "@starknet-react/core";
import { toast } from "sonner";
import { NAMESPACE } from "@/constants";
import { useDojo } from "@/dojo/useDojo";
import { getToastPlacement } from "@/utils/toast";
import {
  BonusLevelUp,
  ConsumablePurchased,
  LevelCompleted,
  LevelStarted,
  RunCompleted,
  RunEnded,
  StartGame,
  UseBonus,
} from "@/dojo/models/gameEvent";

interface GameEventsContextType {}

const GameEventsContext = createContext<GameEventsContextType | undefined>(undefined);

const normalizeAddress = (address: string): string => {
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const getPlayerEventQuery = (namespace: string, playerId: string) => {
  const startGame: `${string}-${string}` = `${namespace}-${StartGame.getModelName()}`;
  const useBonus: `${string}-${string}` = `${namespace}-${UseBonus.getModelName()}`;
  const levelStarted: `${string}-${string}` = `${namespace}-${LevelStarted.getModelName()}`;
  const levelCompleted: `${string}-${string}` = `${namespace}-${LevelCompleted.getModelName()}`;
  const runEnded: `${string}-${string}` = `${namespace}-${RunEnded.getModelName()}`;
  const runCompleted: `${string}-${string}` = `${namespace}-${RunCompleted.getModelName()}`;
  const consumablePurchased: `${string}-${string}` = `${namespace}-${ConsumablePurchased.getModelName()}`;
  const bonusLevelUp: `${string}-${string}` = `${namespace}-${BonusLevelUp.getModelName()}`;
  const normalizedAddress = normalizeAddress(playerId);
  const key = normalizedAddress.toLowerCase();
  const clauses = new ClauseBuilder().keys(
    [
      startGame,
      useBonus,
      levelStarted,
      levelCompleted,
      runEnded,
      runCompleted,
      consumablePurchased,
      bonusLevelUp,
    ],
    [key],
    "VariableLen",
  );
  return new ToriiQueryBuilder().withClause(clauses.build()).includeHashedKeys();
};

export function GameEventsProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const { setup } = useDojo();
  const { toriiClient } = setup;

  const eventSubscriptionRef = useRef<torii.Subscription | null>(null);

  const onGameEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (response: { data?: any[]; error?: Error } | any) => {
      if (!response) return;

      const entities = response.data || (Array.isArray(response) ? response : [response]);
      if (!entities || entities.length === 0) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      entities.forEach((entity: any) => {
        if (!entity?.models) return;

        if (entity.models[`${NAMESPACE}-${StartGame.getModelName()}`]) {
          StartGame.parse(entity.models[`${NAMESPACE}-${StartGame.getModelName()}`]);
        }

        if (entity.models[`${NAMESPACE}-${UseBonus.getModelName()}`]) {
          UseBonus.parse(entity.models[`${NAMESPACE}-${UseBonus.getModelName()}`]);
        }

        if (entity.models[`${NAMESPACE}-${LevelStarted.getModelName()}`]) {
          const event = LevelStarted.parse(
            entity.models[`${NAMESPACE}-${LevelStarted.getModelName()}`],
          );
          toast.info(`Level ${event.level} started`, {
            description: `${event.points_required} points needed in ${event.max_moves} moves`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${LevelCompleted.getModelName()}`]) {
          const event = LevelCompleted.parse(
            entity.models[`${NAMESPACE}-${LevelCompleted.getModelName()}`],
          );
          toast.success(`Level ${event.level} complete!`, {
            description: `+${event.cubes} CUBE earned`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${RunEnded.getModelName()}`]) {
          const event = RunEnded.parse(entity.models[`${NAMESPACE}-${RunEnded.getModelName()}`]);
          toast(`Run ended at Level ${event.final_level}`, {
            description: `Score: ${event.final_score} | ${event.total_cubes} CUBE earned`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${RunCompleted.getModelName()}`]) {
          const event = RunCompleted.parse(
            entity.models[`${NAMESPACE}-${RunCompleted.getModelName()}`],
          );
          toast.success("🏆 Victory! All 50 levels cleared!", {
            description: `Score: ${event.final_score} | ${event.total_cubes} CUBE earned`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${ConsumablePurchased.getModelName()}`]) {
          const event = ConsumablePurchased.parse(
            entity.models[`${NAMESPACE}-${ConsumablePurchased.getModelName()}`],
          );
          toast.info("Item purchased", {
            description: `-${event.cost} CUBE`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${BonusLevelUp.getModelName()}`]) {
          const event = BonusLevelUp.parse(
            entity.models[`${NAMESPACE}-${BonusLevelUp.getModelName()}`],
          );
          toast.success("Bonus upgraded!", {
            description: `Now level ${event.new_level}`,
            position: getToastPlacement(),
          });
        }
      });
    },
    [],
  );

  const setupSubscriptions = useCallback(async () => {
    if (!NAMESPACE || !toriiClient || !address) return;

    if (eventSubscriptionRef.current) {
      try {
        eventSubscriptionRef.current.cancel();
      } catch {
      }
      eventSubscriptionRef.current = null;
    }

    const playerEventQuery = getPlayerEventQuery(NAMESPACE, address);

    try {
      const eventSubscription = await toriiClient.onEventMessageUpdated(
        playerEventQuery.build().clause,
        [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response: any) => {
          if (response) {
            onGameEvent(response);
          }
        },
      );
      eventSubscriptionRef.current = eventSubscription;
    } catch (error) {
      console.error("Error setting up game event subscriptions:", error);
    }
  }, [toriiClient, address, onGameEvent]);

  useEffect(() => {
    if (toriiClient && address) {
      setupSubscriptions();
    }

    return () => {
      if (eventSubscriptionRef.current) {
        try {
          eventSubscriptionRef.current.cancel();
        } catch {
        }
      }
    };
  }, [toriiClient, address, setupSubscriptions]);

  return <GameEventsContext.Provider value={{}}>{children}</GameEventsContext.Provider>;
}

export function useGameEvents() {
  const context = useContext(GameEventsContext);
  if (!context) {
    throw new Error("useGameEvents must be used within a GameEventsProvider");
  }
  return context;
}
