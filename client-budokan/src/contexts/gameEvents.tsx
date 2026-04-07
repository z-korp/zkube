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
  ConstraintProgress,
  LevelCompleted,
  LevelStarted,
  RunEnded,
  StartGame,
  ZoneClearBonus,
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
  const levelStarted: `${string}-${string}` = `${namespace}-${LevelStarted.getModelName()}`;
  const levelCompleted: `${string}-${string}` = `${namespace}-${LevelCompleted.getModelName()}`;
  const runEnded: `${string}-${string}` = `${namespace}-${RunEnded.getModelName()}`;
  const zoneClearBonus: `${string}-${string}` = `${namespace}-${ZoneClearBonus.getModelName()}`;
  const constraintProgress: `${string}-${string}` = `${namespace}-${ConstraintProgress.getModelName()}`;
  const normalizedAddress = normalizeAddress(playerId);
  const key = normalizedAddress.toLowerCase();
  const clauses = new ClauseBuilder().keys(
    [
      startGame,
      levelStarted,
      levelCompleted,
      runEnded,
      zoneClearBonus,
      constraintProgress,
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
            description: `Score: ${event.score} (Total: ${event.total_score})`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${RunEnded.getModelName()}`]) {
          const event = RunEnded.parse(entity.models[`${NAMESPACE}-${RunEnded.getModelName()}`]);
          toast(`Run ended at Level ${event.final_level}`, {
            description: `Score: ${event.final_score}`,
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${ZoneClearBonus.getModelName()}`]) {
          ZoneClearBonus.parse(
            entity.models[`${NAMESPACE}-${ZoneClearBonus.getModelName()}`],
          );
          toast.success("Zone cleared!", {
            description: "Bonus reward earned",
            position: getToastPlacement(),
          });
        }

        if (entity.models[`${NAMESPACE}-${ConstraintProgress.getModelName()}`]) {
          ConstraintProgress.parse(
            entity.models[`${NAMESPACE}-${ConstraintProgress.getModelName()}`],
          );
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
