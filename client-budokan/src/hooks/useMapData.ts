import { useMemo } from "react";
import {
  DEFAULT_SETTINGS,
  generateLevelConfig,
  type Level,
} from "@/dojo/game/types/level";
import type { ThemeId } from "@/config/themes";

export type NodeType = "classic" | "boss";
export type NodeState =
  | "locked"
  | "cleared"
  | "current"
  | "available"
  | "visited";

export interface MapNodeData {
  nodeIndex: number;
  zone: number;
  nodeInZone: number;
  type: NodeType;
  draftPhase: null;
  contractLevel: number | null;
  displayLabel: string;
  state: NodeState;
  levelConfig: Level | null;
  zoneTheme: ThemeId;
}

export interface MapData {
  nodes: MapNodeData[];
  zoneThemes: string[];
  currentNodeIndex: number;
  currentZone: number;
}

export interface UseMapDataParams {
  seed: bigint;
  currentLevel: number;
}

export const NODES_PER_ZONE = 11;
export const TOTAL_ZONES = 1;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;

interface RawNode {
  type: NodeType;
  draftPhase: null;
  contractLevel: number | null;
}

function buildZoneSequence(_seed: bigint, zone: number): RawNode[] {
  const zoneStart = (zone - 1) * LEVELS_PER_ZONE + 1; // e.g. 1, 11, 21…
  const bossLevel = zone * LEVELS_PER_ZONE; // e.g. 10, 20, 30…

  const nodes: RawNode[] = [];

  for (let level = zoneStart; level <= bossLevel; level++) {
    nodes.push({ type: "classic", draftPhase: null, contractLevel: level });
  }

  // Boss — always last
  nodes.push({ type: "boss", draftPhase: null, contractLevel: null });

  return nodes;
}

/* ------------------------------------------------------------------ */
/*  Convert contract level → global node index (needs seed now).      */
/* ------------------------------------------------------------------ */

export function contractLevelToNodeIndex(
  contractLevel: number,
  seed: bigint,
): number {
  if (contractLevel < 1 || contractLevel > GAMEPLAY_LEVELS) return 0;

  const zone = Math.ceil(contractLevel / LEVELS_PER_ZONE);
  const zoneBaseIndex = (zone - 1) * NODES_PER_ZONE;
  const sequence = buildZoneSequence(seed, zone);

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
  const clamped = Math.max(1, Math.min(GAMEPLAY_LEVELS, level));
  return Math.max(
    1,
    Math.min(TOTAL_ZONES, Math.ceil(clamped / LEVELS_PER_ZONE)),
  );
}

/* ------------------------------------------------------------------ */
/*  Node state resolution                                              */
/* ------------------------------------------------------------------ */

function getNodeState(
  node: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">,
  currentLevel: number,
  currentNodeIndex: number,
  _seed: bigint,
): NodeState {
  const zoneEndLevel = node.zone * LEVELS_PER_ZONE;

  if (node.type === "boss") {
    if (currentLevel > zoneEndLevel) return "cleared";
    return currentLevel >= zoneEndLevel ? "available" : "locked";
  }

  // --- Classic + Boss nodes ---

  // Already cleared levels
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  if (node.nodeIndex === currentNodeIndex) {
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
  const clampedLevel = Math.max(1, Math.min(GAMEPLAY_LEVELS, currentLevel));
  const zoneThemes: ThemeId[] = ["theme-1"];

  const allNodes: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">[] = [];

  for (let z = 1; z <= TOTAL_ZONES; z++) {
    const sequence = buildZoneSequence(seed, z);
    const zoneBaseIndex = (z - 1) * NODES_PER_ZONE;

    for (let i = 0; i < sequence.length; i++) {
      const raw = sequence[i];
      const nodeIndex = zoneBaseIndex + i;

      const displayLabel =
        raw.type === "boss"
          ? `${z}-BOSS`
          : `${raw.contractLevel ?? ""}`;

      allNodes.push({
        nodeIndex,
        zone: z,
        nodeInZone: i,
        type: raw.type,
        draftPhase: raw.draftPhase,
        contractLevel: raw.contractLevel,
        displayLabel,
      });
    }
  }

  const currentNodeIndex = contractLevelToNodeIndex(clampedLevel, seed);

  const nodes: MapNodeData[] = allNodes.map((node) => {
    const levelConfig =
      node.contractLevel !== null
        ? generateLevelConfig(seed, node.contractLevel, DEFAULT_SETTINGS)
        : null;

    const state = getNodeState(node, clampedLevel, currentNodeIndex, seed);

    return {
      ...node,
      state,
      levelConfig,
      zoneTheme: zoneThemes[node.zone - 1],
    };
  });

  return {
    nodes,
    zoneThemes,
    currentNodeIndex,
    currentZone: getZone(clampedLevel),
  };
}

export function useMapData({ seed, currentLevel }: UseMapDataParams): MapData {
  return useMemo(
    () => generateMapData({ seed, currentLevel }),
    [seed, currentLevel],
  );
}
