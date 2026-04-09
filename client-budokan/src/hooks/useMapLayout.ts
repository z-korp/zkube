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
}

/* ------------------------------------------------------------------ */
/*  Hash helpers                                                       */
/* ------------------------------------------------------------------ */

function poseidon(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values));
}

function hashToUnit(seed: bigint, zone: number, step: number, salt: number): number {
  const value = poseidon([seed, BigInt(zone + 1), BigInt(step + 1), BigInt(salt)]);
  const normalized = value < 0n ? -value : value;
  const scale = 10_000n;
  return Number(normalized % scale) / Number(scale);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const Y_TOP = 0.08;
const Y_BOTTOM = 0.92;
const X_MIN = 0.14;
const X_MAX = 0.86;

/* ------------------------------------------------------------------ */
/*  Layout patterns — each produces a different visual feel            */
/* ------------------------------------------------------------------ */

type PatternFn = (seed: bigint, zoneIndex: number, i: number, total: number) => number;

/** Classic 3-lane zigzag */
const patternZigzag: PatternFn = (seed, zoneIndex, i, total) => {
  const lanes = [0.2, 0.5, 0.8];
  const jitter = (hashToUnit(seed, zoneIndex, i, 202) - 0.5) * 0.10;

  if (i === 0 || i === total - 1) return 0.5;
  if (i === total - 2) return hashToUnit(seed, zoneIndex, i, 201) < 0.5 ? 0.2 + jitter : 0.8 + jitter;

  // Alternate lanes deterministically
  const roll = hashToUnit(seed, zoneIndex, i, 201);
  const prevLane = i === 1 ? 1 : (Math.round((patternZigzag(seed, zoneIndex, i - 1, total) - 0.2) / 0.3));
  let lane: number;
  if (prevLane === 1) lane = roll < 0.5 ? 0 : 2;
  else if (prevLane === 0) lane = roll < 0.5 ? 1 : 2;
  else lane = roll < 0.5 ? 1 : 0;

  return lanes[lane] + jitter;
};

/** Spiral — nodes curve around the center */
const patternSpiral: PatternFn = (seed, zoneIndex, i, total) => {
  if (i === 0 || i === total - 1) return 0.5;
  const t = i / (total - 1);
  const angle = t * Math.PI * 2.5; // ~2.5 turns
  const radius = 0.15 + t * 0.12;
  const jitter = (hashToUnit(seed, zoneIndex, i, 203) - 0.5) * 0.06;
  return 0.5 + Math.sin(angle + zoneIndex) * radius + jitter;
};

/** Snake — smooth S-curves */
const patternSnake: PatternFn = (seed, zoneIndex, i, total) => {
  if (i === 0 || i === total - 1) return 0.5;
  const t = i / (total - 1);
  const amplitude = 0.25 + hashToUnit(seed, zoneIndex, 0, 210) * 0.1;
  const phase = hashToUnit(seed, zoneIndex, 0, 211) * Math.PI;
  const jitter = (hashToUnit(seed, zoneIndex, i, 204) - 0.5) * 0.05;
  return 0.5 + Math.sin(t * Math.PI * 2 + phase) * amplitude + jitter;
};

/** Staircase — alternates between two sides with plateaus */
const patternStaircase: PatternFn = (seed, zoneIndex, i, total) => {
  if (i === 0 || i === total - 1) return 0.5;
  const side = Math.floor(i / 2) % 2 === 0;
  const jitter = (hashToUnit(seed, zoneIndex, i, 205) - 0.5) * 0.08;
  return side ? 0.3 + jitter : 0.7 + jitter;
};

/** Drift — gradual wander from one side to the other */
const patternDrift: PatternFn = (seed, zoneIndex, i, total) => {
  if (i === 0 || i === total - 1) return 0.5;
  const startSide = hashToUnit(seed, zoneIndex, 0, 220) < 0.5 ? 0.25 : 0.75;
  const endSide = startSide < 0.5 ? 0.75 : 0.25;
  const t = i / (total - 1);
  const base = startSide + (endSide - startSide) * t;
  const jitter = (hashToUnit(seed, zoneIndex, i, 206) - 0.5) * 0.12;
  return base + jitter;
};

const PATTERNS: PatternFn[] = [patternZigzag, patternSpiral, patternSnake, patternStaircase, patternDrift];

/* ------------------------------------------------------------------ */
/*  Build zone layout                                                  */
/* ------------------------------------------------------------------ */

function buildZoneLayout(
  seed: bigint,
  zoneIndex: number,
  nodesPerZone: number,
): ZoneLayout {
  const points: MapLayoutPoint[] = [];
  const edges: MapLayoutEdge[] = [];
  const lastNode = nodesPerZone - 1;
  const yStep = (Y_BOTTOM - Y_TOP) / Math.max(lastNode, 1);

  // Pick pattern based on seed + zoneIndex for variety
  const patternIdx = Number(poseidon([seed, BigInt(zoneIndex + 100)]) % BigInt(PATTERNS.length));
  const pattern = PATTERNS[patternIdx];

  // Add slight Y variance so nodes aren't perfectly evenly spaced
  for (let i = 0; i < nodesPerZone; i++) {
    const baseY = Y_BOTTOM - i * yStep;
    const yJitter = (i === 0 || i === lastNode) ? 0 : (hashToUnit(seed, zoneIndex, i, 300) - 0.5) * yStep * 0.3;
    const y = clamp(baseY + yJitter, Y_TOP, Y_BOTTOM);

    const rawX = pattern(seed, zoneIndex, i, nodesPerZone);
    const x = clamp(rawX, X_MIN, X_MAX);

    points.push({ x, y });
  }

  for (let i = 0; i < nodesPerZone - 1; i++) {
    edges.push({ from: i, to: i + 1, kind: "main" });
  }

  return { points, edges };
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useMapLayout({
  seed,
  totalZones,
  nodesPerZone,
}: UseMapLayoutParams): ZoneLayout[] {
  return useMemo(
    () =>
      Array.from({ length: totalZones }, (_, zoneIndex) =>
        buildZoneLayout(seed, zoneIndex, nodesPerZone),
      ),
    [seed, totalZones, nodesPerZone],
  );
}
