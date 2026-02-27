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
  if (completedLevel < 0 || completedLevel > MAX_LEVEL) {
    return null;
  }

  // Zone 1 entry draft: at game creation (completed_level == 0)
  if (completedLevel === 0) {
    return {
      type: "post_level_1",
      triggerLevel: 0,
      zone: 1,
      eventId: "post_level_1:0:1",
    };
  }

  // Entry draft for zones 2-5: after clearing boss
  if (completedLevel < MAX_LEVEL && completedLevel % LEVELS_PER_ZONE === 0) {
    const nextZone = completedLevel / LEVELS_PER_ZONE + 1;
    return {
      type: "post_boss",
      triggerLevel: completedLevel,
      zone: nextZone,
      eventId: `post_boss:${completedLevel}:${nextZone}`,
    };
  }

  // Mid-zone (micro) draft: one per zone at a random level
  const zone = toZone(completedLevel);
  if (zone > 5) return null;
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

  // Entry draft events: the draft that appears at the start of this zone
  if (zone === 1) {
    // Zone 1 entry draft: at game creation (completed_level == 0)
    events.push({
      type: "post_level_1",
      triggerLevel: 0,
      zone: 1,
      eventId: "post_level_1:0:1",
    });
  } else {
    // Zones 2-5 entry draft: triggers after completing previous zone's boss
    const prevBossLevel = (zone - 1) * LEVELS_PER_ZONE;
    events.push({
      type: "post_boss",
      triggerLevel: prevBossLevel,
      zone, // The entry draft belongs to THIS zone (matches contract: zone = next_zone)
      eventId: `post_boss:${prevBossLevel}:${zone}`,
    });
  }

  // Mid draft event: triggers at random level within the zone
  const microTrigger = getZoneMicroDraftTriggerLevel(seed, zone);
  events.push({
    type: "zone_micro",
    triggerLevel: microTrigger,
    zone,
    eventId: `zone_micro:${microTrigger}:${zone}`,
  });

  return events.sort((a, b) => a.triggerLevel - b.triggerLevel);
};

export const isDraftEventUnlocked = (
  currentLevel: number,
  event: PendingDraftEvent,
): boolean => currentLevel > event.triggerLevel;

export const getDraftEventSlot = (event: PendingDraftEvent): number => {
  // Formula matches contract: entry_slot = (zone-1)*2, mid_slot = (zone-1)*2+1
  if (event.type === "zone_micro") return (event.zone - 1) * 2 + 1;
  // Entry drafts: post_level_1 (zone 1) and post_boss (zones 2-5)
  return (event.zone - 1) * 2;
};

export interface StoredDraftPick {
  title: string;
  description: string;
  kind: string;
  pool: string;
  skillId: number;
}

export type DraftNodePhase = "entry" | "mid";

// vNext: completedMask/selectedPicks removed from DraftState.
// Draft completion is now tracked by draftState.active + picksMade.
// These helpers are kept for backward compatibility with MapPage.

const toStoredDraftPick = (skillId: number): StoredDraftPick | null => {
  const skill = getSkillById(skillId);
  if (!skill) return null;

  return {
    title: `Skill Draft: ${skill.name}`,
    description: skill.description,
    kind: skill.category === "bonus" ? "new_powerup" : "zone_modifier",
    pool: skill.category === "bonus" ? "powerup" : "world",
    skillId,
  };
};

export const isDraftEventCompleted = (
  draftState: DraftStateData | null,
  _event: PendingDraftEvent,
): boolean => {
  if (!draftState) return false;
  // vNext: draft is completed when it is no longer active
  return !draftState.active;
};

export const getStoredDraftPick = (
  draftState: DraftStateData | null,
  _event: PendingDraftEvent,
): StoredDraftPick | null => {
  if (!draftState) return null;
  // vNext: return the last selected choice if draft is completed
  if (draftState.active) return null;
  if (draftState.selectedChoice === 0) return null;
  return toStoredDraftPick(draftState.selectedChoice);
};

export const getDraftEventForZoneNode = (
  seed: bigint,
  zone: number,
  currentLevel: number,
  draftState: DraftStateData | null,
  phase: DraftNodePhase = "entry",
): PendingDraftEvent | null => {
  const unlocked = getDraftEventsForZone(seed, zone).filter((event) =>
    isDraftEventUnlocked(currentLevel, event),
  );

  const phaseEvents = unlocked.filter((event) => {
    if (phase === "mid") {
      return event.type === "zone_micro";
    }
    return event.type === "post_level_1" || event.type === "post_boss";
  });

  if (phaseEvents.length === 0) {
    return null;
  }

  const pending = phaseEvents.find(
    (event) => !isDraftEventCompleted(draftState, event),
  );

  if (pending) {
    return pending;
  }

  return phaseEvents[phaseEvents.length - 1];
};
