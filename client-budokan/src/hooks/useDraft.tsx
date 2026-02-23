import { useMemo } from "react";
import { useComponentValue } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import type { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";

const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

export interface DraftStateData {
  gameId: number;
  active: boolean;
  eventSlot: number;
  eventType: number;
  triggerLevel: number;
  zone: number;
  choice1: number;
  choice2: number;
  choice3: number;
  reroll1: number;
  reroll2: number;
  reroll3: number;
  spentCubes: number;
  completedMask: number;
  selectedPicks: bigint;
  selectedSlot: number;
  selectedChoice: number;
}

export const getDraftPickForSlot = (selectedPicks: bigint, slot: number): number => {
  if (slot < 0 || slot >= 10) return 0;
  const shift = BigInt(slot * 16);
  return Number((selectedPicks >> shift) & 0xffffn);
};

export const isDraftSlotCompleted = (completedMask: number, slot: number): boolean => {
  if (slot < 0 || slot >= 16) return false;
  return (completedMask & (1 << slot)) !== 0;
};

export const useDraft = ({
  gameId,
}: {
  gameId: number | undefined;
}): DraftStateData | null => {
  const {
    setup: {
      clientModels: {
        models: { DraftState },
      },
    },
  } = useDojo();

  const gameKey = useMemo(() => {
    if (gameId === undefined) return null;
    const rawKey = getEntityIdFromKeys([BigInt(gameId)]);
    return normalizeEntityId(rawKey);
  }, [gameId]);

  const component = useComponentValue(DraftState, gameKey ?? ("0x0" as Entity));

  return useMemo(() => {
    if (!component) return null;
    return {
      gameId: component.game_id,
      active: component.active,
      eventSlot: component.event_slot,
      eventType: component.event_type,
      triggerLevel: component.trigger_level,
      zone: component.zone,
      choice1: component.choice_1,
      choice2: component.choice_2,
      choice3: component.choice_3,
      reroll1: component.reroll_1,
      reroll2: component.reroll_2,
      reroll3: component.reroll_3,
      spentCubes: component.spent_cubes,
      completedMask: component.completed_mask,
      selectedPicks: BigInt(component.selected_picks ?? 0),
      selectedSlot: component.selected_slot,
      selectedChoice: component.selected_choice,
    };
  }, [component]);
};
