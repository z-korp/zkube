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

/** Y range for nodes: top of zone = 0.08, bottom = 0.92 */
const Y_TOP = 0.08;
const Y_BOTTOM = 0.92;

/** 3-lane X positions — wide spread for visual variety */
const LANES = [0.2, 0.5, 0.8] as const;

/** Maximum jitter applied to X */
const X_JITTER = 0.10;

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

  // Evenly space nodes vertically with guaranteed monotonic ascent
  const yStep = (Y_BOTTOM - Y_TOP) / Math.max(lastNode, 1);

  let lane = 1;

  for (let i = 0; i < nodesPerZone; i++) {
    // Y: strict even spacing, bottom to top (node 0 = bottom, last = top)
    const y = Y_BOTTOM - i * yStep;

    const isFirst = i === 0;
    const isLast = i === lastNode;

    if (isFirst || isLast) {
      points.push({ x: 0.5, y });
      lane = 1;
      continue;
    }

    // Pre-boss node: force to an outer lane (opposite of previous) so it
    // doesn't tangle with the large centered boss above it.
    if (i === lastNode - 1) {
      lane = lane === 0 ? 2 : 0; // flip to opposite outer lane
      const xJitter = (hashToUnit(seed, zoneIndex, i, 202) - 0.5) * X_JITTER;
      const x = clamp(LANES[lane] + xJitter, 0.14, 0.86);
      points.push({ x, y });
      continue;
    }

    // Force lane change: NEVER same lane as previous node.
    // From center (1) → go left or right.
    // From left (0) → go center or right.
    // From right (2) → go center or left.
    const moveRoll = hashToUnit(seed, zoneIndex, i, 201);

    if (lane === 1) {
      // From center: go left or right (never stay center)
      lane = moveRoll < 0.5 ? 0 : 2;
    } else if (lane === 0) {
      // From left: go center or right (never stay left)
      lane = moveRoll < 0.5 ? 1 : 2;
    } else {
      // From right: go center or left (never stay right)
      lane = moveRoll < 0.5 ? 1 : 0;
    }

    const xJitter = (hashToUnit(seed, zoneIndex, i, 202) - 0.5) * X_JITTER;
    const x = clamp(LANES[lane] + xJitter, 0.14, 0.86);

    points.push({ x, y });
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
