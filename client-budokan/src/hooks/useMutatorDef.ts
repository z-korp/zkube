import { useMemo } from "react";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { shortString } from "starknet";

const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

export interface MutatorDefData {
  mutatorId: number;
  name: string;
  zoneId: number;
  // Passive stat modifiers
  movesModifier: number;
  ratioModifier: number;
  difficultyOffset: number;
  comboScoreMultX100: number;
  starThresholdModifier: number;
  endlessRampMultX100: number;
  lineClearBonus: number;
  perfectClearBonus: number;
  startingRows: number;
  // Active bonus slots
  bonus1Type: number;
  bonus1TriggerType: number;
  bonus1TriggerThreshold: number;
  bonus1StartingCharges: number;
  bonus2Type: number;
  bonus2TriggerType: number;
  bonus2TriggerThreshold: number;
  bonus2StartingCharges: number;
  bonus3Type: number;
  bonus3TriggerType: number;
  bonus3TriggerThreshold: number;
  bonus3StartingCharges: number;
}

function decodeFelt252Name(raw: bigint | string | number | undefined): string {
  if (!raw) return "";
  try {
    const hex = typeof raw === "bigint" ? `0x${raw.toString(16)}` : String(raw);
    if (hex === "0x0" || hex === "0") return "";
    return shortString.decodeShortString(hex);
  } catch {
    return "";
  }
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
      name: decodeFelt252Name(raw.name),
      zoneId: raw.zone_id ?? 0,
      movesModifier: raw.moves_modifier ?? 128,
      ratioModifier: raw.ratio_modifier ?? 128,
      difficultyOffset: raw.difficulty_offset ?? 0,
      comboScoreMultX100: raw.combo_score_mult_x100 ?? 100,
      starThresholdModifier: raw.star_threshold_modifier ?? 128,
      endlessRampMultX100: raw.endless_ramp_mult_x100 ?? 100,
      lineClearBonus: raw.line_clear_bonus ?? 0,
      perfectClearBonus: raw.perfect_clear_bonus ?? 0,
      startingRows: raw.starting_rows ?? 0,
      bonus1Type: raw.bonus_1_type ?? 0,
      bonus1TriggerType: raw.bonus_1_trigger_type ?? 0,
      bonus1TriggerThreshold: raw.bonus_1_trigger_threshold ?? 0,
      bonus1StartingCharges: raw.bonus_1_starting_charges ?? 0,
      bonus2Type: raw.bonus_2_type ?? 0,
      bonus2TriggerType: raw.bonus_2_trigger_type ?? 0,
      bonus2TriggerThreshold: raw.bonus_2_trigger_threshold ?? 0,
      bonus2StartingCharges: raw.bonus_2_starting_charges ?? 0,
      bonus3Type: raw.bonus_3_type ?? 0,
      bonus3TriggerType: raw.bonus_3_trigger_type ?? 0,
      bonus3TriggerThreshold: raw.bonus_3_trigger_threshold ?? 0,
      bonus3StartingCharges: raw.bonus_3_starting_charges ?? 0,
    };
  }, [raw, mutatorId]);

  return { data, isLoading: !raw && mutatorId > 0 };
}
