import { useMemo } from "react";
import { generateLevelConfig, type Level, type GameSettings } from "@/dojo/game/types/level";
import type { ThemeId } from "@/config/themes";

export type NodeType = "classic" | "boss";
export type NodeState =
  | "locked"
  | "cleared"
  | "current"
  | "available"
  | "visited"
  | "playing";

export interface ActiveStoryNode {
  zoneId: number;
  level: number;
}

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
  zoneTheme: ThemeId;
  currentNodeIndex: number;
}

export interface UseMapDataParams {
  seed: bigint;
  zoneId: number;
  zoneState: StoryZoneMapState | undefined;
  activeStoryNode?: ActiveStoryNode | null;
  settings?: GameSettings;
  starThresholdModifier?: number;
}

export const NODES_PER_ZONE = 10;
export const TOTAL_ZONES = 10;
export const GAMEPLAY_LEVELS = 10;
const LEVELS_PER_ZONE = 10;

// Must match contract config.cairo theme_id assignments per zone:
// Zone 1=theme-1, 2=theme-2, 3=theme-3, 4=theme-4, 5=theme-6,
export const ZONE_THEMES: ThemeId[] = [
  "theme-1", "theme-2", "theme-3", "theme-4", "theme-5",
  "theme-6", "theme-7", "theme-8", "theme-9", "theme-10",
];

export function getZoneTheme(zoneId: number): ThemeId {
  return ZONE_THEMES[zoneId - 1] ?? "theme-1";
}

interface RawNode {
  type: NodeType;
  draftPhase: null;
  contractLevel: number | null;
}

function buildZoneSequence(): RawNode[] {
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
  activeStoryNode: ActiveStoryNode | null,
): NodeState {
  if (!zoneState?.unlocked) return "locked";
  const level = node.contractLevel ?? LEVELS_PER_ZONE;

  if (
    activeStoryNode !== null &&
    node.zone === activeStoryNode.zoneId &&
    level === activeStoryNode.level
  ) {
    return "playing";
  }

  const highestCleared = zoneState.highestCleared ?? 0;

  if (level <= highestCleared) return "cleared";

  const nextLevel = highestCleared >= LEVELS_PER_ZONE ? LEVELS_PER_ZONE : highestCleared + 1;
  if (level === nextLevel) {
    return "current";
  }

  return "locked";
}

export function generateMapData({
  seed,
  zoneId,
  zoneState,
  activeStoryNode = null,
  settings,
  starThresholdModifier = 128,
}: UseMapDataParams): MapData {
  const zoneTheme = getZoneTheme(zoneId);
  const sequence = buildZoneSequence();

  const nodes: MapNodeData[] = sequence.map((raw, i) => {
    const displayLabel =
      raw.type === "boss"
        ? `${zoneId}-BOSS`
        : `${raw.contractLevel ?? ""}`;

    const partial = {
      nodeIndex: i,
      zone: zoneId,
      nodeInZone: i,
      type: raw.type,
      draftPhase: raw.draftPhase,
      contractLevel: raw.contractLevel,
      displayLabel,
    };

    const localLevel = raw.contractLevel ?? LEVELS_PER_ZONE;
    const levelConfig = generateLevelConfig(seed, localLevel, settings, starThresholdModifier);
    const state = getNodeState(partial, zoneState, activeStoryNode);

    return {
      ...partial,
      state,
      levelConfig,
      zoneTheme,
    };
  });

  return {
    nodes,
    zoneTheme,
    currentNodeIndex: contractLevelToNodeIndex(
      (zoneState?.highestCleared ?? 0) + 1,
    ),
  };
}

export function useMapData({
  seed,
  zoneId,
  zoneState,
  activeStoryNode = null,
  settings,
  starThresholdModifier = 128,
}: UseMapDataParams): MapData {
  return useMemo(
    () => generateMapData({ seed, zoneId, zoneState, activeStoryNode, settings, starThresholdModifier }),
    [seed, zoneId, zoneState, activeStoryNode, settings, starThresholdModifier],
  );
}
