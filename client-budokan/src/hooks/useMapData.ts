import { useMemo } from "react";
import { generateLevelConfig, type Level } from "@/dojo/game/types/level";
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

export interface StoryZoneMapState {
  zoneId: number;
  unlocked: boolean;
  highestCleared: number;
  levelStars: number[];
}

export interface MapData {
  nodes: MapNodeData[];
  zoneThemes: string[];
  currentNodeIndex: number;
  currentZone: number;
}

export interface UseMapDataParams {
  seed: bigint;
  currentZone: number;
  zones: StoryZoneMapState[];
}

export const NODES_PER_ZONE = 10;
export const TOTAL_ZONES = 2;
export const GAMEPLAY_LEVELS = 10;
const LEVELS_PER_ZONE = 10;

interface RawNode {
  type: NodeType;
  draftPhase: null;
  contractLevel: number | null;
}

function buildZoneSequence(zone: number): RawNode[] {
  const nodes: RawNode[] = [];

  for (let level = 1; level < LEVELS_PER_ZONE; level++) {
    nodes.push({ type: "classic", draftPhase: null, contractLevel: level });
  }

  nodes.push({ type: "boss", draftPhase: null, contractLevel: LEVELS_PER_ZONE });

  return nodes;
}

export function contractLevelToNodeIndex(contractLevel: number): number {
  if (contractLevel < 1 || contractLevel > LEVELS_PER_ZONE) return 0;
  return contractLevel - 1;
}

function getNodeState(
  node: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">,
  zoneState: StoryZoneMapState | undefined,
  currentZone: number,
): NodeState {
  if (!zoneState?.unlocked) return "locked";
  const level = node.contractLevel ?? LEVELS_PER_ZONE;
  const highestCleared = zoneState.highestCleared ?? 0;

  if (level <= highestCleared) return "cleared";

  const nextLevel = highestCleared >= LEVELS_PER_ZONE ? LEVELS_PER_ZONE : highestCleared + 1;
  if (level === nextLevel) {
    return node.zone === currentZone ? "current" : "available";
  }

  return "locked";
}

export function generateMapData({ seed, currentZone, zones }: UseMapDataParams): MapData {
  const zoneThemes: ThemeId[] = ["theme-1", "theme-2"];
  const zoneMap = new Map(zones.map((zone) => [zone.zoneId, zone]));
  const effectiveCurrentZone = Math.max(1, Math.min(TOTAL_ZONES, currentZone));

  const allNodes: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">[] = [];

  for (let z = 1; z <= TOTAL_ZONES; z++) {
    const sequence = buildZoneSequence(z);
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

  const nodes: MapNodeData[] = allNodes.map((node) => {
    const zoneState = zoneMap.get(node.zone);
    const localLevel = node.contractLevel ?? LEVELS_PER_ZONE;
    const levelConfig = generateLevelConfig(seed, localLevel);
    const state = getNodeState(node, zoneState, effectiveCurrentZone);

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
    currentNodeIndex: contractLevelToNodeIndex(
      (zoneMap.get(effectiveCurrentZone)?.highestCleared ?? 0) + 1,
    ),
    currentZone: effectiveCurrentZone,
  };
}

export function useMapData({ seed, currentZone, zones }: UseMapDataParams): MapData {
  return useMemo(() => generateMapData({ seed, currentZone, zones }), [seed, currentZone, zones]);
}
