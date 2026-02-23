import { hash } from "starknet";
import type { PendingDraftEvent } from "@/stores/navigationStore";
import {
  getDraftPickForSlot,
  isDraftSlotCompleted,
  type DraftStateData,
} from "@/hooks/useDraft";

const LEVELS_PER_ZONE = 10;
const MAX_LEVEL = 50;
const MICRO_DRAFT_SELECTOR = BigInt("0x44524146545f4d4943524f");

const poseidon = (values: bigint[]): bigint =>
  BigInt(hash.computePoseidonHashOnElements(values));

const toZone = (level: number): number => Math.ceil(level / LEVELS_PER_ZONE);

const zoneStartLevel = (zone: number): number =>
  (zone - 1) * LEVELS_PER_ZONE + 1;

const mod = (value: bigint, size: number): number => {
  if (size <= 0) return 0;
  const abs = value < 0n ? -value : value;
  return Number(abs % BigInt(size));
};

export const getZoneMicroDraftTriggerLevel = (
  seed: bigint,
  zone: number,
): number => {
  const start = zoneStartLevel(zone);
  const offset = mod(poseidon([seed, MICRO_DRAFT_SELECTOR, BigInt(zone)]), 7);
  return start + 1 + offset;
};

export const getDraftEventForCompletedLevel = (
  seed: bigint,
  completedLevel: number,
): PendingDraftEvent | null => {
  if (completedLevel < 1 || completedLevel > MAX_LEVEL) {
    return null;
  }

  if (completedLevel === 1) {
    return {
      type: "post_level_1",
      triggerLevel: 1,
      zone: 1,
      eventId: "post_level_1:1:1",
    };
  }

  if (completedLevel < MAX_LEVEL && completedLevel % LEVELS_PER_ZONE === 0) {
    const zone = completedLevel / LEVELS_PER_ZONE;
    return {
      type: "post_boss",
      triggerLevel: completedLevel,
      zone,
      eventId: `post_boss:${completedLevel}:${zone}`,
    };
  }

  const zone = toZone(completedLevel);
  const trigger = getZoneMicroDraftTriggerLevel(seed, zone);

  if (completedLevel === trigger) {
    return {
      type: "zone_micro",
      triggerLevel: completedLevel,
      zone,
      eventId: `zone_micro:${completedLevel}:${zone}`,
    };
  }

  return null;
};

export const getDraftEventsForZone = (
  seed: bigint,
  zone: number,
): PendingDraftEvent[] => {
  const events: PendingDraftEvent[] = [];

  if (zone === 1) {
    events.push({
      type: "post_level_1",
      triggerLevel: 1,
      zone: 1,
      eventId: "post_level_1:1:1",
    });
  }

  const microTrigger = getZoneMicroDraftTriggerLevel(seed, zone);
  events.push({
    type: "zone_micro",
    triggerLevel: microTrigger,
    zone,
    eventId: `zone_micro:${microTrigger}:${zone}`,
  });

  if (zone < 5) {
    const bossTrigger = zone * LEVELS_PER_ZONE;
    events.push({
      type: "post_boss",
      triggerLevel: bossTrigger,
      zone,
      eventId: `post_boss:${bossTrigger}:${zone}`,
    });
  }

  return events.sort((a, b) => a.triggerLevel - b.triggerLevel);
};

export const isDraftEventUnlocked = (
  currentLevel: number,
  event: PendingDraftEvent,
): boolean => currentLevel > event.triggerLevel;

export const getDraftEventSlot = (event: PendingDraftEvent): number => {
  if (event.type === "post_level_1") return 0;
  if (event.type === "zone_micro") return event.zone;
  return 5 + event.zone;
};

export interface StoredDraftPick {
  title: string;
  description: string;
  kind: string;
  pool: string;
}

export const decodeDraftChoice = (choiceCode: number): StoredDraftPick | null => {
  if (choiceCode >= 101 && choiceCode <= 105) {
    const bonusCode = choiceCode - 100;
    const bonusName =
      bonusCode === 1
        ? "Combo"
        : bonusCode === 2
          ? "Score"
          : bonusCode === 3
            ? "Harvest"
            : bonusCode === 4
              ? "Wave"
              : "Supply";
    return {
      title: `Bonus Draft: ${bonusName}`,
      description: `Swap or add ${bonusName} in your active loadout.`,
      kind: "new_bonus",
      pool: "bonus",
    };
  }

  if (choiceCode >= 201 && choiceCode <= 204) {
    const title =
      choiceCode === 201
        ? "Upgrade Active Bonus"
        : choiceCode === 202
          ? "Focus Upgrade"
          : choiceCode === 203
            ? "Specialization Choice"
            : "Advanced Specialization";
    return {
      title,
      description: "Boost one or more equipped bonus levels.",
      kind: "upgrade_bonus",
      pool: "upgrade",
    };
  }

  if (choiceCode >= 301 && choiceCode <= 307) {
    const worldNames: Record<number, string> = {
      301: "Zone Tempo",
      302: "Zone Bounty",
      303: "Double Gain Contract",
      304: "Tight Moves Contract",
      305: "Relic: First Strike",
      306: "Relic: Boss Vigor",
      307: "Relic: Constraint Fuel",
    };
    return {
      title: worldNames[choiceCode] ?? "World Draft",
      description: "Apply a world modifier effect to your run.",
      kind: choiceCode <= 304 ? "zone_modifier" : "relic",
      pool: "world",
    };
  }

  return null;
};

export const isDraftEventCompleted = (
  draftState: DraftStateData | null,
  event: PendingDraftEvent,
): boolean => {
  if (!draftState) return false;
  const slot = getDraftEventSlot(event);
  return isDraftSlotCompleted(draftState.completedMask, slot);
};

export const getStoredDraftPick = (
  draftState: DraftStateData | null,
  event: PendingDraftEvent,
): StoredDraftPick | null => {
  if (!draftState) return null;
  const slot = getDraftEventSlot(event);
  if (!isDraftSlotCompleted(draftState.completedMask, slot)) {
    return null;
  }

  const code = getDraftPickForSlot(draftState.selectedPicks, slot);
  return decodeDraftChoice(code);
};

export const getDraftEventForZoneNode = (
  seed: bigint,
  zone: number,
  currentLevel: number,
  draftState: DraftStateData | null,
): PendingDraftEvent | null => {
  const unlocked = getDraftEventsForZone(seed, zone).filter((event) =>
    isDraftEventUnlocked(currentLevel, event),
  );

  if (unlocked.length === 0) {
    return null;
  }

  const pending = unlocked.find((event) => !isDraftEventCompleted(draftState, event));

  if (pending) {
    return pending;
  }

  return unlocked[unlocked.length - 1];
};
