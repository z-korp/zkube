import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { useMutatorDef } from "./useMutatorDef";
import { applyStarThresholdModifier } from "@/dojo/game/types/level";
import { normalizeEntityId } from "@/utils/entityId";
import {
  useReceiptGameStore,
  type ReceiptGameLevelComponent,
} from "@/stores/receiptGameStore";

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
  mutatorId: number;
  // Derived client-side from maxMoves
  star3Threshold: number;
  star2Threshold: number;
}

type GameLevelComponent = ReceiptGameLevelComponent;

/**
 * Hook to fetch the GameLevel model.
 *
 * Source preference: receipt store (set by start-game TX) → Torii component.
 * The receipt path lets a freshly-started game render its level config without
 * waiting for Torii to index the new entity.
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

  const toriiComponent = useComponentValue(
    GameLevel,
    gameKey ?? ("0x0" as Entity),
  );

  const receiptGameId = useReceiptGameStore((s) => s.gameId);
  const receiptLevel = useReceiptGameStore((s) => s.level);
  const useReceipt =
    gameId !== undefined &&
    receiptGameId !== null &&
    BigInt(gameId) === receiptGameId;

  // Kickstart pattern: prefer the receipt-cached level only until Torii syncs.
  // Once toriiComponent arrives we yield to it — this ensures level-up writes
  // (which the contract makes via level_system, not parsed from move
  // receipts here) take effect without needing a refresh.
  const component: GameLevelComponent | undefined = toriiComponent
    ? (toriiComponent as GameLevelComponent)
    : useReceipt && receiptLevel
      ? receiptLevel
      : undefined;

  const passiveMutatorId = component?.mutator_id ?? 0;
  const { data: passiveMutator } = useMutatorDef(passiveMutatorId);

  const gameLevel = useMemo((): GameLevelData | null => {
    if (!component) return null;

    const maxMoves = component.max_moves;
    const modifier = passiveMutator?.starThresholdModifier ?? 128;
    const { star3Pct, star2Pct } = applyStarThresholdModifier(modifier);
    const data: GameLevelData = {
      gameId: BigInt(component.game_id),
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
      mutatorId: component.mutator_id ?? 0,
      star3Threshold: Math.floor((maxMoves * star3Pct) / 100),
      star2Threshold: Math.floor((maxMoves * star2Pct) / 100),
    };

    return data;
  }, [component, passiveMutator]);

  return gameLevel;
};
