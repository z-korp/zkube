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

/** Returns a deterministic float in [0, 1) for a given (seed, zone, step, salt). */
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ------------------------------------------------------------------ */
/*  Layout constants                                                   */
/* ------------------------------------------------------------------ */

const Y_TOP = 0.08;
const Y_BOTTOM = 0.92;

/** X bounds for node placement */
const X_MIN = 0.15;
const X_MAX = 0.85;
const X_CENTER = 0.5;

/** Minimum horizontal distance between consecutive nodes */
const MIN_X_SHIFT = 0.15;

/** Maximum Y jitter (fraction of yStep) */
const Y_JITTER = 0.25;

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

  let prevX = X_CENTER;

  for (let i = 0; i < nodesPerZone; i++) {
    const isFirst = i === 0;
    const isLast = i === lastNode;

    // Y: even spacing with jitter on interior nodes
    let y = Y_BOTTOM - i * yStep;
    if (!isFirst && !isLast) {
      const yJit = (hashToUnit(seed, zoneIndex, i, 300) - 0.5) * yStep * Y_JITTER;
      y = clamp(y + yJit, Y_TOP, Y_BOTTOM);
    }

    // X: first and last always centered
    if (isFirst || isLast) {
      points.push({ x: X_CENTER, y });
      prevX = X_CENTER;
      continue;
    }

    // Pre-boss: offset from center, away from previous
    if (i === lastNode - 1) {
      const dir = prevX < X_CENTER ? 1 : -1;
      const offset = 0.15 + hashToUnit(seed, zoneIndex, i, 301) * 0.15;
      const x = clamp(X_CENTER + dir * offset, X_MIN, X_MAX);
      points.push({ x, y });
      prevX = x;
      continue;
    }

    // Interior nodes: continuous X with guaranteed shift from previous
    const roll = hashToUnit(seed, zoneIndex, i, 201);

    // Node right after start (level 2): keep left of 0.65 to avoid guardian portrait at bottom-right
    const xCeiling = i === 1 ? 0.65 : X_MAX;

    // Decide direction: biased away from edges, always shift from prevX
    let targetX: number;
    const rightBound = xCeiling;
    if (prevX < 0.35) {
      // Near left edge: bias rightward
      targetX = prevX + MIN_X_SHIFT + roll * (rightBound - prevX - MIN_X_SHIFT);
    } else if (prevX > rightBound - 0.2) {
      // Near right bound: bias leftward
      targetX = prevX - MIN_X_SHIFT - roll * (prevX - MIN_X_SHIFT - X_MIN);
    } else {
      // Middle: go either direction
      if (roll < 0.5) {
        const shift = MIN_X_SHIFT + (roll * 2) * (prevX - X_MIN - MIN_X_SHIFT);
        targetX = prevX - shift;
      } else {
        const shift = MIN_X_SHIFT + ((roll - 0.5) * 2) * (rightBound - prevX - MIN_X_SHIFT);
        targetX = prevX + shift;
      }
    }

    const x = clamp(targetX, X_MIN, xCeiling);
    points.push({ x, y });
    prevX = x;
  }

  // Linear chain edges
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
