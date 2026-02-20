import { useMemo } from "react";
import { hash } from "starknet";

export type MapLayoutEdgeKind = "main" | "branch";

export interface MapLayoutPoint {
  x: number;
  y: number;
}

export interface MapLayoutEdge {
  from: number;
  to: number;
  kind: MapLayoutEdgeKind;
}

export interface ZoneLayout {
  points: MapLayoutPoint[];
  edges: MapLayoutEdge[];
}

export interface UseMapLayoutParams {
  seed: bigint;
  totalZones: number;
  nodesPerZone: number;
  preset?: MapLayoutPresetId;
}

export const MAP_LAYOUT_PRESETS = {
  stable: {
    label: "Stable",
    laneSpread: [0.3, 0.5, 0.7] as const,
    laneJitter: 0.07,
    yJitter: 0.015,
    laneMoveThresholdLow: 0.24,
    laneMoveThresholdHigh: 0.76,
    branchOdds: 0.14,
    branchLongOdds: 0.22,
  },
  balanced: {
    label: "Balanced",
    laneSpread: [0.24, 0.5, 0.76] as const,
    laneJitter: 0.11,
    yJitter: 0.024,
    laneMoveThresholdLow: 0.33,
    laneMoveThresholdHigh: 0.67,
    branchOdds: 0.34,
    branchLongOdds: 0.28,
  },
  wild: {
    label: "Wild",
    laneSpread: [0.18, 0.5, 0.82] as const,
    laneJitter: 0.15,
    yJitter: 0.035,
    laneMoveThresholdLow: 0.41,
    laneMoveThresholdHigh: 0.59,
    branchOdds: 0.54,
    branchLongOdds: 0.4,
  },
} as const;

export type MapLayoutPresetId = keyof typeof MAP_LAYOUT_PRESETS;

type MapLayoutPreset = (typeof MAP_LAYOUT_PRESETS)[MapLayoutPresetId];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function poseidon(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values));
}

function hashToUnit(seed: bigint, zone: number, step: number, salt: number): number {
  const value = poseidon([
    seed,
    BigInt(zone + 1),
    BigInt(step + 1),
    BigInt(salt),
  ]);
  const normalized = value < 0n ? -value : value;
  const scale = 10_000n;
  return Number(normalized % scale) / Number(scale);
}

function buildZoneLayout(
  seed: bigint,
  zoneIndex: number,
  nodesPerZone: number,
  preset: MapLayoutPreset,
): ZoneLayout {
  const points: MapLayoutPoint[] = [];
  const edges: MapLayoutEdge[] = [];
  const lastNode = nodesPerZone - 1;

  let lane = 1;

  for (let i = 0; i < nodesPerZone; i++) {
    const isTerminal = i === 0 || i === lastNode;

    if (i > 0 && !isTerminal) {
      const moveRoll = hashToUnit(seed, zoneIndex, i, 101);
      let laneDelta = 0;

      if (moveRoll < preset.laneMoveThresholdLow) laneDelta = -1;
      if (moveRoll > preset.laneMoveThresholdHigh) laneDelta = 1;

      lane = clamp(lane + laneDelta, 0, preset.laneSpread.length - 1);
    }

    const xJitter =
      isTerminal ? 0 : (hashToUnit(seed, zoneIndex, i, 102) - 0.5) * preset.laneJitter;
    const yJitter =
      isTerminal ? 0 : (hashToUnit(seed, zoneIndex, i, 103) - 0.5) * preset.yJitter;

    const progress = lastNode === 0 ? 0 : i / lastNode;
    const baseY = 0.92 - progress * 0.84;

    const x = clamp(preset.laneSpread[lane] + xJitter, 0.14, 0.86);
    const y = clamp(baseY + yJitter, 0.07, 0.93);

    points.push({ x, y });
  }

  for (let i = 0; i < nodesPerZone - 1; i++) {
    edges.push({ from: i, to: i + 1, kind: "main" });
  }

  return { points, edges };
}

export function useMapLayout({
  seed,
  totalZones,
  nodesPerZone,
  preset = "balanced",
}: UseMapLayoutParams): ZoneLayout[] {
  const activePreset = MAP_LAYOUT_PRESETS[preset] ?? MAP_LAYOUT_PRESETS.balanced;

  return useMemo(
    () =>
      Array.from({ length: totalZones }, (_, zoneIndex) =>
        buildZoneLayout(seed, zoneIndex, nodesPerZone, activePreset),
      ),
    [activePreset, seed, totalZones, nodesPerZone],
  );
}
