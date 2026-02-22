import { hash } from "starknet";
import type { PendingDraftEvent } from "@/stores/navigationStore";

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
    const nextZone = completedLevel / LEVELS_PER_ZONE + 1;
    return {
      type: "post_boss",
      triggerLevel: completedLevel,
      zone: nextZone,
      eventId: `post_boss:${completedLevel}:${nextZone}`,
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
