import { hash } from "starknet";
import type { PendingDraftEvent } from "@/stores/navigationStore";
import type { DraftStateData } from "@/hooks/useDraft";
import { getSkillById } from "@/dojo/game/types/skillData";

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

  if (completedLevel >= 10) {
    return null;
  }

  const zone = toZone(completedLevel);
  if (zone !== 1) {
    return null;
  }
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

  if (zone === 1) {
    const microTrigger = getZoneMicroDraftTriggerLevel(seed, zone);
    events.push({
      type: "zone_micro",
      triggerLevel: microTrigger,
      zone,
      eventId: `zone_micro:${microTrigger}:${zone}`,
    });
  }

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
  if (event.type === "zone_micro") return 1;
  return event.triggerLevel / 10 + 1;
};

export interface StoredDraftPick {
  title: string;
  description: string;
  kind: string;
  pool: string;
}

const getDraftPickForSlot = (selectedPicks: bigint, slot: number): number => {
  if (slot < 0 || slot >= 10) return 0;
  const shift = BigInt(slot * 8);
  return Number((selectedPicks >> shift) & 0xffn);
};

const isDraftSlotCompleted = (completedMask: number, slot: number): boolean => {
  if (slot < 0 || slot >= 16) return false;
  return (completedMask & (1 << slot)) !== 0;
};

const toStoredDraftPick = (skillId: number): StoredDraftPick | null => {
  const skill = getSkillById(skillId);
  if (!skill) return null;

  return {
    title: `Skill Draft: ${skill.name}`,
    description: skill.description,
    kind: skill.category === "bonus" ? "new_powerup" : "zone_modifier",
    pool: skill.category === "bonus" ? "powerup" : "world",
  };
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
  return toStoredDraftPick(code);
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
