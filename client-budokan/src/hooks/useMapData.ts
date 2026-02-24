import { useMemo } from "react";
import { hash } from "starknet";
import {
  DEFAULT_SETTINGS,
  generateLevelConfig,
  type Level,
} from "@/dojo/game/types/level";
import { THEME_IDS, type ThemeId } from "@/config/themes";

export type NodeType = "classic" | "draft" | "boss";
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
  draftPhase: "entry" | "mid" | null;
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

export const NODES_PER_ZONE = 12;
export const CLASSIC_PER_ZONE = 9;
export const TOTAL_ZONES = 5;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;
const ZONE_THEMES_SELECTOR = BigInt("0x5a4f4e455f5448454d4553");
const MICRO_DRAFT_SELECTOR = BigInt("0x44524146545f4d4943524f");
export const ENTRY_DRAFT_NODE_IN_ZONE = 1;
export const MID_DRAFT_NODE_IN_ZONE = 5;
export const BOSS_NODE_IN_ZONE = NODES_PER_ZONE - 1;

export const MAP_NODE_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.35, y: 0.92 },
  { x: 0.65, y: 0.84 },
  { x: 0.35, y: 0.76 },
  { x: 0.6, y: 0.68 },
  { x: 0.3, y: 0.6 },
  { x: 0.6, y: 0.52 },
  { x: 0.35, y: 0.44 },
  { x: 0.6, y: 0.36 },
  { x: 0.3, y: 0.28 },
  { x: 0.6, y: 0.18 },
  { x: 0.5, y: 0.07 },
];

function poseidon(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values));
}

function getNodeType(nodeInZone: number): NodeType {
  if (nodeInZone === BOSS_NODE_IN_ZONE) return "boss";
  if (
    nodeInZone === ENTRY_DRAFT_NODE_IN_ZONE ||
    nodeInZone === MID_DRAFT_NODE_IN_ZONE
  ) {
    return "draft";
  }
  return "classic";
}

function getDraftPhase(nodeInZone: number): "entry" | "mid" | null {
  if (nodeInZone === ENTRY_DRAFT_NODE_IN_ZONE) return "entry";
  if (nodeInZone === MID_DRAFT_NODE_IN_ZONE) return "mid";
  return null;
}

function getZoneMicroDraftTriggerLevel(seed: bigint, zone: number): number {
  const start = (zone - 1) * LEVELS_PER_ZONE + 1;
  const hashed = poseidon([seed, MICRO_DRAFT_SELECTOR, BigInt(zone)]);
  const abs = hashed < 0n ? -hashed : hashed;
  const offset = Number(abs % 7n);
  return start + 1 + offset;
}

function getMapNode(
  nodeIndex: number,
): Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme"> {
  const zone = Math.floor(nodeIndex / NODES_PER_ZONE) + 1;
  const nodeInZone = nodeIndex % NODES_PER_ZONE;
  const type = getNodeType(nodeInZone);
  const draftPhase = getDraftPhase(nodeInZone);

  let contractLevel: number | null = null;
  if (type === "classic") {
    const zoneStartLevel = (zone - 1) * LEVELS_PER_ZONE + 1;
    // nodeInZone 0 = level 1, 2-4 = levels 2-4, 6-10 = levels 5-9
    // Skip entry draft (1) and mid draft (5)
    if (nodeInZone < ENTRY_DRAFT_NODE_IN_ZONE) {
      // nodeInZone 0 → level 1
      contractLevel = zoneStartLevel + nodeInZone;
    } else if (nodeInZone < MID_DRAFT_NODE_IN_ZONE) {
      // nodeInZone 2-4 → levels 2-4 (subtract 1 for entry draft)
      contractLevel = zoneStartLevel + (nodeInZone - 1);
    } else {
      // nodeInZone 6-10 → levels 5-9 (subtract 2 for both drafts)
      contractLevel = zoneStartLevel + (nodeInZone - 2);
    }
  } else if (type === "boss") {
    contractLevel = zone * LEVELS_PER_ZONE;
  }

  const displayLabel =
    type === "draft"
      ? `${zone}-DRAFT`
      : type === "boss"
        ? `${zone}-BOSS`
        : `${contractLevel ?? ""}`;

  return {
    nodeIndex,
    zone,
    nodeInZone,
    type,
    draftPhase,
    contractLevel,
    displayLabel,
  };
}

function getAllNodes(): ReturnType<typeof getMapNode>[] {
  return Array.from({ length: TOTAL_ZONES * NODES_PER_ZONE }, (_, idx) =>
    getMapNode(idx),
  );
}

export function contractLevelToNodeIndex(contractLevel: number): number {
  if (contractLevel < 1 || contractLevel > GAMEPLAY_LEVELS) return 0;

  const zone = Math.ceil(contractLevel / LEVELS_PER_ZONE);
  const levelInZone = contractLevel - (zone - 1) * LEVELS_PER_ZONE;

  if (levelInZone === LEVELS_PER_ZONE) {
    return (zone - 1) * NODES_PER_ZONE + BOSS_NODE_IN_ZONE;
  }

  // Level 1 → nodeInZone 0 (before entry draft at 1)
  // Levels 2-4 → nodeInZone 2-4 (after entry draft, before mid draft)
  // Levels 5-9 → nodeInZone 6-10 (after mid draft)
  let nodeInZone: number;
  if (levelInZone === 1) {
    nodeInZone = 0;
  } else if (levelInZone <= 4) {
    nodeInZone = levelInZone; // 2→2, 3→3, 4→4
  } else {
    nodeInZone = levelInZone + 1; // 5→6, 6→7, ..., 9→10
  }
  return (zone - 1) * NODES_PER_ZONE + nodeInZone;
}

export function getZone(level: number): number {
  const clamped = Math.max(1, Math.min(GAMEPLAY_LEVELS, level));
  return Math.ceil(clamped / LEVELS_PER_ZONE);
}

function getNodeState(
  node: ReturnType<typeof getMapNode>,
  currentLevel: number,
  currentNodeIndex: number,
  seed: bigint,
): NodeState {
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  if (node.nodeIndex === currentNodeIndex) {
    return "current";
  }

  if (node.type === "draft") {
    const zoneStartLevel = (node.zone - 1) * LEVELS_PER_ZONE + 1;
    const zoneEndLevel = node.zone * LEVELS_PER_ZONE;

    if (node.draftPhase === "entry") {
      // Contract triggers: completed_level==1 (zone 1), completed_level==prevBoss (zones 2-5)
      // Draft opens AFTER completing the trigger level, so player is at triggerLevel+1
      // Zone 1: unlocked when currentLevel >= 2 (completed level 1)
      // Zones 2-5: unlocked when currentLevel >= zoneStartLevel (completed prev boss)
      const unlockLevel =
        node.zone === 1 ? zoneStartLevel + 1 : zoneStartLevel;
      if (currentLevel < unlockLevel) return "locked";
      if (currentLevel > zoneEndLevel) return "visited";
      return "available";
    }

    // Mid draft (zone 1 only)
    if (node.zone !== 1) {
      return "locked";
    }

    // Contract triggers when completed_level == trigger, so player is at trigger+1
    const trigger = getZoneMicroDraftTriggerLevel(seed, node.zone);
    if (currentLevel <= trigger) return "locked";
    if (currentLevel > zoneEndLevel) return "visited";
    return "available";
  }

  if (node.contractLevel !== null && node.contractLevel === currentLevel) {
    return "current";
  }

  return "locked";
}

export function deriveZoneThemes(seed: bigint): ThemeId[] {
  const zoneSeed = poseidon([seed, ZONE_THEMES_SELECTOR]);
  const themes = [...THEME_IDS];

  for (let i = 0; i < TOTAL_ZONES; i++) {
    const stepSeed = poseidon([zoneSeed, BigInt(i)]);
    const remaining = themes.length - i;
    const offset = Number(
      (stepSeed < 0n ? -stepSeed : stepSeed) % BigInt(remaining),
    );
    const j = i + offset;
    [themes[i], themes[j]] = [themes[j], themes[i]];
  }

  return themes.slice(0, TOTAL_ZONES);
}

export function generateMapData({
  seed,
  currentLevel,
}: UseMapDataParams): MapData {
  const clampedLevel = Math.max(1, Math.min(GAMEPLAY_LEVELS, currentLevel));
  const zoneThemes = deriveZoneThemes(seed);
  const allNodes = getAllNodes();
  const currentNodeIndex = contractLevelToNodeIndex(clampedLevel);

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
