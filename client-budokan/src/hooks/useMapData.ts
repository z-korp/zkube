import { useMemo } from "react";
import {
  DEFAULT_SETTINGS,
  generateLevelConfig,
  type Level,
} from "@/dojo/game/types/level";


export type NodeType = "classic" | "boss";
export type NodeState =
  | "locked"
  | "cleared"
  | "current"
  | "available"
  | "visited";

export interface MapNodeData {
  nodeIndex: number;
  nodeInZone: number;
  type: NodeType;
  contractLevel: number | null;
  displayLabel: string;
  state: NodeState;
  levelConfig: Level | null;
}

export interface MapData {
  nodes: MapNodeData[];
  currentNodeIndex: number;
}

export interface UseMapDataParams {
  seed: bigint;
  currentLevel: number;
}

export const TOTAL_LEVELS = 10;

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */

interface RawNode {
  type: NodeType;
  contractLevel: number | null;
}

function buildZoneSequence(_seed: bigint, zone: number): RawNode[] {
  const zoneStart = (zone - 1) * TOTAL_LEVELS + 1;
  const bossLevel = zone * TOTAL_LEVELS;

  const nodes: RawNode[] = [];

  // 9 regular levels (zoneStart to zoneStart+8)
  for (let level = zoneStart; level < bossLevel; level++) {
    nodes.push({ type: "classic", contractLevel: level });
  }

  // Boss — always last
  nodes.push({ type: "boss", contractLevel: bossLevel });

  return nodes;
}

/* ------------------------------------------------------------------ */
/*  Convert contract level → global node index.                       */
/* ------------------------------------------------------------------ */

export function contractLevelToNodeIndex(
  contractLevel: number,
  _seed: bigint,
): number {
  if (contractLevel < 1 || contractLevel > TOTAL_LEVELS) return 0;

  const zone = 1;
  const zoneBaseIndex = 0;
  const sequence = buildZoneSequence(0n, zone);

  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i].contractLevel === contractLevel) {
      return zoneBaseIndex + i;
    }
  }

  // Fallback: shouldn't happen
  return zoneBaseIndex;
}

/* ------------------------------------------------------------------ */
/*  Zone helper                                                        */
/* ------------------------------------------------------------------ */

export function getZone(level: number): number {
  void level;
  return 1;
}

/* ------------------------------------------------------------------ */
/*  Node state resolution                                              */
/* ------------------------------------------------------------------ */

function getNodeState(
  node: Omit<MapNodeData, "state" | "levelConfig">,
  currentLevel: number,
  currentNodeIndex: number,
): NodeState {
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  if (node.nodeIndex === currentNodeIndex) {
    return "current";
  }

  if (node.contractLevel !== null && node.contractLevel === currentLevel) {
    return "current";
  }

  return "locked";
}

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export function generateMapData({
  seed,
  currentLevel,
}: UseMapDataParams): MapData {
  const clampedLevel = Math.max(1, Math.min(TOTAL_LEVELS, currentLevel));

  const allNodes: Omit<MapNodeData, "state" | "levelConfig">[] = [];

  const sequence = buildZoneSequence(seed, 1);
  const zoneBaseIndex = 0;

  for (let i = 0; i < sequence.length; i++) {
    const raw = sequence[i];
    const nodeIndex = zoneBaseIndex + i;

    const displayLabel = raw.type === "boss" ? "BOSS" : `${raw.contractLevel ?? ""}`;

    allNodes.push({
      nodeIndex,
      nodeInZone: i,
      type: raw.type,
      contractLevel: raw.contractLevel,
      displayLabel,
    });
  }

  const currentNodeIndex = contractLevelToNodeIndex(clampedLevel, seed);

  const nodes: MapNodeData[] = allNodes.map((node) => {
    const levelConfig =
      node.contractLevel !== null
        ? generateLevelConfig(seed, node.contractLevel, DEFAULT_SETTINGS)
        : null;

    const state = getNodeState(node, clampedLevel, currentNodeIndex);

    return {
      ...node,
      state,
      levelConfig,
    };
  });

  return {
    nodes,
    currentNodeIndex,
  };
}

export function useMapData({ seed, currentLevel }: UseMapDataParams): MapData {
  return useMemo(
    () => generateMapData({ seed, currentLevel }),
    [seed, currentLevel],
  );
}
