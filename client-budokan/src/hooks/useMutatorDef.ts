import { useMemo } from "react";
import { useComponentValue } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { normalizeEntityId } from "@/utils/entityId";

export interface MutatorDefData {
  mutatorId: number;
  zoneId: number;
  // Passive stat modifiers
  movesModifier: number;
  ratioModifier: number;
  difficultyOffset: number;
  scoreMultX100: number;
  starThresholdModifier: number;
  endlessRampMultX100: number;
  lineClearBonus: number;
  perfectClearBonus: number;
  startingRows: number;
  comboBonusMultX100: number;
  // Active bonus: one bonus type per zone, rolled among enabled triggers
  bonusType: number;
  comboTriggerThreshold: number;
  linesTriggerThreshold: number;
  scoreTriggerThreshold: number;
  startingCharges: number;
}

export function useMutatorDef(mutatorId: number): {
  data: MutatorDefData | null;
  isLoading: boolean;
} {
  const {
    setup: {
      clientModels: {
        models: { MutatorDef },
      },
    },
  } = useDojo();

  const entityKey = useMemo(() => {
    const rawKey = getEntityIdFromKeys([BigInt(mutatorId)]);
    return normalizeEntityId(rawKey);
  }, [mutatorId]);

  const raw = useComponentValue(MutatorDef, entityKey);

  const data = useMemo<MutatorDefData | null>(() => {
    if (!raw || mutatorId === 0) return null;
    return {
      mutatorId: raw.mutator_id ?? mutatorId,
      zoneId: raw.zone_id ?? 0,
      movesModifier: raw.moves_modifier ?? 128,
      ratioModifier: raw.ratio_modifier ?? 128,
      difficultyOffset: raw.difficulty_offset ?? 0,
      scoreMultX100: raw.score_mult_x100 ?? 100,
      starThresholdModifier: raw.star_threshold_modifier ?? 128,
      endlessRampMultX100: raw.endless_ramp_mult_x100 ?? 100,
      lineClearBonus: raw.line_clear_bonus ?? 0,
      perfectClearBonus: raw.perfect_clear_bonus ?? 0,
      startingRows: raw.starting_rows ?? 0,
      comboBonusMultX100: raw.combo_bonus_mult_x100 ?? 100,
      bonusType: raw.bonus_type ?? 0,
      comboTriggerThreshold: raw.combo_trigger_threshold ?? 0,
      linesTriggerThreshold: raw.lines_trigger_threshold ?? 0,
      scoreTriggerThreshold: raw.score_trigger_threshold ?? 0,
      startingCharges: raw.starting_charges ?? 0,
    };
  }, [raw, mutatorId]);

  return { data, isLoading: !raw && mutatorId > 0 };
}
