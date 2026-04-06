import { useDojo } from "@/dojo/useDojo";
import { useMemo, useEffect, useState } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { ConstraintType } from "@/dojo/game/types/constraint";

// Normalize entity ID to match Torii's format (no leading zeros after 0x)
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  // Remove leading zeros after 0x, but keep at least one digit
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

/** Default star threshold percentages (matches contract defaults) */
const CUBE_3_PERCENT = 40;
const CUBE_2_PERCENT = 70;

export interface GameLevelData {
  gameId: bigint;
  level: number;
  pointsRequired: number;
  maxMoves: number;
  difficulty: number;
  // Primary constraint
  constraintType: ConstraintType;
  constraintValue: number;
  constraintCount: number;
  constraint2Type: ConstraintType;
  constraint2Value: number;
  constraint2Count: number;
  constraint3Type: ConstraintType;
  constraint3Value: number;
  constraint3Count: number;
  mutatorId: number;
  // Derived client-side from maxMoves
  cube3Threshold: number;
  cube2Threshold: number;
}

/**
 * Hook to fetch the GameLevel model from RECS.
 * This model is written by the contract and contains the authoritative level configuration.
 * 
 * @param gameId - The game ID to fetch the level for
 * @returns The GameLevel data if available, or null if not yet synced
 */
export const useGameLevel = ({
  gameId,
}: {
  gameId: bigint | undefined;
}): GameLevelData | null => {
  const {
    setup: {
      clientModels: {
        models: { GameLevel },
      },
    },
  } = useDojo();

  const gameKey = useMemo(() => {
    if (gameId === undefined) return null;
    const rawKey = getEntityIdFromKeys([gameId]);
    return normalizeEntityId(rawKey);
  }, [gameId]);

  const component = useComponentValue(GameLevel, gameKey ?? ("0x0" as Entity));

  // Track if we need to retry fetching
  const [retryCount, setRetryCount] = useState(0);

  // Retry fetching if component is missing but we expect it
  useEffect(() => {
    if (gameId !== undefined && !component && retryCount < 5) {
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameId, component, retryCount]);

  // Reset retry count when game changes
  useEffect(() => {
    setRetryCount(0);
  }, [gameId]);

  const gameLevel = useMemo((): GameLevelData | null => {
    if (!component) return null;

    const maxMoves = component.max_moves;
    const data: GameLevelData = {
      gameId: component.game_id,
      level: component.level,
      pointsRequired: component.points_required,
      maxMoves,
      difficulty: component.difficulty,
      constraintType: component.constraint_type as ConstraintType,
      constraintValue: component.constraint_value,
      constraintCount: component.constraint_count,
      constraint2Type: component.constraint2_type as ConstraintType,
      constraint2Value: component.constraint2_value,
      constraint2Count: component.constraint2_count,
      constraint3Type: component.constraint3_type as ConstraintType,
      constraint3Value: component.constraint3_value,
      constraint3Count: component.constraint3_count,
      mutatorId: component.mutator_id ?? 0,
      cube3Threshold: Math.floor((maxMoves * CUBE_3_PERCENT) / 100),
      cube2Threshold: Math.floor((maxMoves * CUBE_2_PERCENT) / 100),
    };

    return data;
  }, [component, retryCount]);

  return gameLevel;
};
