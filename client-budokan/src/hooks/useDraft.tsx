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
  seed: bigint;
  active: boolean;
  draftType: number;      // 1=initial, 2=boss_upgrade
  picksMade: number;      // 0-3 (how many skills picked in initial draft)
  choice1: number;        // skill_id option 1
  choice2: number;        // skill_id option 2
  choice3: number;        // skill_id option 3
  rerollCount: number;
  spentCubes: number;
  selectedSlot: number;   // which choice slot was selected (0, 1, or 2)
  selectedChoice: number; // the skill_id that was selected
}

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
      seed: BigInt(component.seed ?? 0),
      active: component.active,
      draftType: component.draft_type,
      picksMade: component.picks_made,
      choice1: component.choice_1,
      choice2: component.choice_2,
      choice3: component.choice_3,
      rerollCount: component.reroll_count,
      spentCubes: component.spent_cubes,
      selectedSlot: component.selected_slot,
      selectedChoice: component.selected_choice,
    };
  }, [component]);
};
