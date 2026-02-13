import { useMemo } from 'react';
import {
  type MapNode,
  getAllNodes,
  getZone,
  contractLevelToNodeIndex,
  TOTAL_NODES,
} from '../utils/mapLayout';
import { deriveZoneThemes } from '../utils/zoneThemes';
import {
  generateLevelConfig,
  type GameSettings,
  DEFAULT_SETTINGS,
  type Level,
} from '@/dojo/game/types/level';
import type { ThemeId } from '../utils/colors';

export type NodeState = 'locked' | 'cleared' | 'current' | 'available' | 'visited';

export interface MapNodeData extends MapNode {
  state: NodeState;
  levelConfig: Level | null;
  zoneTheme: ThemeId;
}

export interface MapData {
  nodes: MapNodeData[];
  zoneThemes: ThemeId[];
  currentNodeIndex: number;
  currentZone: number;
}

function getNodeState(
  node: MapNode,
  currentLevel: number,
  currentNodeIndex: number,
): NodeState {
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return 'cleared';
  }
  if (node.nodeIndex === currentNodeIndex) {
    return 'current';
  }

  if (node.type === 'shop') {
    const bossLevel = node.contractLevel === null
      ? (node.zone * 10)
      : node.contractLevel;
    const lastClassicInZone = bossLevel - 1;
    if (currentLevel > lastClassicInZone && currentLevel <= bossLevel) {
      return 'available';
    }
    if (currentLevel > bossLevel) return 'visited';
    return 'locked';
  }

  if (node.contractLevel !== null && node.contractLevel === currentLevel) {
    return 'current';
  }

  const nextNodeIndex = currentNodeIndex + 1;
  if (node.nodeIndex === nextNodeIndex && nextNodeIndex < TOTAL_NODES) {
    return 'available';
  }

  return 'locked';
}

export function generateMapData(
  seed: bigint,
  currentLevel: number,
  settings: GameSettings = DEFAULT_SETTINGS,
): MapData {
  const zoneThemes = deriveZoneThemes(seed);
  const allNodes = getAllNodes();
  const currentNodeIndex = contractLevelToNodeIndex(currentLevel);

  const nodes: MapNodeData[] = allNodes.map((node) => {
    const levelConfig = node.contractLevel !== null
      ? generateLevelConfig(seed, node.contractLevel, settings)
      : null;

    const state = getNodeState(node, currentLevel, currentNodeIndex);
    const zoneTheme = zoneThemes[node.zone - 1];

    return { ...node, state, levelConfig, zoneTheme };
  });

  return {
    nodes,
    zoneThemes,
    currentNodeIndex,
    currentZone: getZone(currentLevel),
  };
}

export function useMapData(
  seed: bigint,
  currentLevel: number,
  settings: GameSettings = DEFAULT_SETTINGS,
): MapData {
  return useMemo(
    () => generateMapData(seed, currentLevel, settings),
    [seed, currentLevel, settings],
  );
}
