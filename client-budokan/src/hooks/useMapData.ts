import { useMemo } from "react";
import { hash } from "starknet";
import {
  DEFAULT_SETTINGS,
  generateLevelConfig,
  type Level,
} from "@/dojo/game/types/level";
import { THEME_IDS, type ThemeId } from "@/config/themes";

export type NodeType = "classic" | "shop" | "boss";
export type NodeState = "locked" | "cleared" | "current" | "available" | "visited";

export interface MapNodeData {
  nodeIndex: number;
  zone: number;
  nodeInZone: number;
  type: NodeType;
  contractLevel: number | null;
  displayLabel: string;
  state: NodeState;
  levelConfig: Level | null;
  zoneTheme: ThemeId;
  cubesEarned: number;
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
export const CLASSIC_PER_ZONE = 9;
export const TOTAL_ZONES = 5;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;
const ZONE_THEMES_SELECTOR = BigInt("0x5a4f4e455f5448454d4553");

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
  if (nodeInZone < CLASSIC_PER_ZONE) return "classic";
  if (nodeInZone === CLASSIC_PER_ZONE) return "shop";
  return "boss";
}

function getMapNode(nodeIndex: number): Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme" | "cubesEarned"> {
  const zone = Math.floor(nodeIndex / NODES_PER_ZONE) + 1;
  const nodeInZone = nodeIndex % NODES_PER_ZONE;
  const type = getNodeType(nodeInZone);

  let contractLevel: number | null = null;
  if (type === "classic") {
    contractLevel = (zone - 1) * LEVELS_PER_ZONE + nodeInZone + 1;
  } else if (type === "boss") {
    contractLevel = zone * LEVELS_PER_ZONE;
  }

  const displayLabel =
    type === "shop"
      ? `${zone}-SHOP`
      : type === "boss"
        ? `${zone}-BOSS`
        : `${zone}-${nodeInZone + 1}`;

  return { nodeIndex, zone, nodeInZone, type, contractLevel, displayLabel };
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
    return (zone - 1) * NODES_PER_ZONE + NODES_PER_ZONE - 1;
  }

  return (zone - 1) * NODES_PER_ZONE + (levelInZone - 1);
}

export function getZone(level: number): number {
  const clamped = Math.max(1, Math.min(GAMEPLAY_LEVELS, level));
  return Math.ceil(clamped / LEVELS_PER_ZONE);
}

function getNodeState(
  node: ReturnType<typeof getMapNode>,
  currentLevel: number,
  currentNodeIndex: number,
): NodeState {
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  if (node.nodeIndex === currentNodeIndex) {
    return "current";
  }

  if (node.type === "shop") {
    const bossLevel = node.zone * 10;
    const lastClassicInZone = bossLevel - 1;
    if (currentLevel > lastClassicInZone && currentLevel <= bossLevel) {
      return "available";
    }
    if (currentLevel > bossLevel) return "visited";
    return "locked";
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
    const offset = Number((stepSeed < 0n ? -stepSeed : stepSeed) % BigInt(remaining));
    const j = i + offset;
    [themes[i], themes[j]] = [themes[j], themes[i]];
  }

  return themes.slice(0, TOTAL_ZONES);
}

export function generateMapData({ seed, currentLevel }: UseMapDataParams): MapData {
  const clampedLevel = Math.max(1, Math.min(GAMEPLAY_LEVELS, currentLevel));
  const zoneThemes = deriveZoneThemes(seed);
  const allNodes = getAllNodes();
  const currentNodeIndex = contractLevelToNodeIndex(clampedLevel);

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
      zoneTheme: zoneThemes[node.zone - 1],
      cubesEarned: state === "cleared" && node.contractLevel !== null ? 3 : 0,
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
