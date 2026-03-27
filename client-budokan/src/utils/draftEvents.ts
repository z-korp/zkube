const LEVELS_PER_ZONE = 10;
const MAX_LEVEL = 50;

export interface DraftEvent {
  type: "post_level_1" | "post_boss";
  triggerLevel: number;
  zone: number;
  eventId: string;
}

export const getDraftEventForCompletedLevel = (
  _seed: bigint,
  completedLevel: number,
): DraftEvent | null => {
  if (completedLevel < 0 || completedLevel > MAX_LEVEL) {
    return null;
  }

  if (completedLevel === 0) {
    return {
      type: "post_level_1",
      triggerLevel: 0,
      zone: 1,
      eventId: "post_level_1:0:1",
    };
  }

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
