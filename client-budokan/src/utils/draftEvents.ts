import type { PendingDraftEvent } from "@/stores/navigationStore";
import type { DraftStateData } from "@/hooks/useDraft";
import { getSkillById } from "@/dojo/game/types/skillData";

const LEVELS_PER_ZONE = 10;
const MAX_LEVEL = 50;

/**
 * vNext Draft System:
 * - Initial draft: 1 pick at game start (completedLevel === 0)
 * - Boss upgrade: 1 pick after each boss clear (levels 10, 20, 30, 40 — NOT 50)
 * - No mid-zone (micro) drafts
 */

/**
 * Returns the draft event triggered by completing a given level.
 * - completedLevel === 0 → initial draft (post_level_1)
 * - completedLevel === 10/20/30/40 → boss upgrade (post_boss)
 * - All other levels → null
 */
export const getDraftEventForCompletedLevel = (
  _seed: bigint,
  completedLevel: number,
): PendingDraftEvent | null => {
  if (completedLevel < 0 || completedLevel > MAX_LEVEL) {
    return null;
  }

  // Initial draft: at game creation (completed_level == 0)
  if (completedLevel === 0) {
    return {
      type: "post_level_1",
      triggerLevel: 0,
      zone: 1,
      eventId: "post_level_1:0:1",
    };
  }

  // Boss upgrade: after clearing boss (levels 10, 20, 30, 40 — NOT 50)
  if (completedLevel < MAX_LEVEL && completedLevel % LEVELS_PER_ZONE === 0) {
    const nextZone = completedLevel / LEVELS_PER_ZONE + 1;
    return {
      type: "post_boss",
      triggerLevel: completedLevel,
      zone: nextZone,
      eventId: `post_boss:${completedLevel}:${nextZone}`,
    };
  }

  return null;
};

/**
 * Returns the single draft event for a zone (entry draft only, no mid-zone).
 */
export const getDraftEventForZone = (
  _seed: bigint,
  zone: number,
): PendingDraftEvent => {
  if (zone === 1) {
    return {
      type: "post_level_1",
      triggerLevel: 0,
      zone: 1,
      eventId: "post_level_1:0:1",
    };
  }

  const prevBossLevel = (zone - 1) * LEVELS_PER_ZONE;
  return {
    type: "post_boss",
    triggerLevel: prevBossLevel,
    zone,
    eventId: `post_boss:${prevBossLevel}:${zone}`,
  };
};

export const isDraftEventUnlocked = (
  currentLevel: number,
  event: PendingDraftEvent,
): boolean => currentLevel > event.triggerLevel;

export interface StoredDraftPick {
  title: string;
  description: string;
  kind: string;
  pool: string;
  skillId: number;
}

// vNext: completedMask/selectedPicks removed from DraftState.
// Draft completion is now tracked by draftState.active + picksMade.

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
  // vNext: selected choice is no longer stored in DraftState.
  // Draft completion is tracked via draftState.active only.
  if (draftState.active) return null;
  return null;
};

/**
 * Get the draft event for a zone's entry draft node.
 * vNext: only entry drafts exist (no mid-zone drafts).
 */
export const getDraftEventForZoneNode = (
  seed: bigint,
  zone: number,
  currentLevel: number,
  draftState: DraftStateData | null,
): PendingDraftEvent | null => {
  const event = getDraftEventForZone(seed, zone);

  if (!isDraftEventUnlocked(currentLevel, event)) {
    return null;
  }

  return event;
};
