export type NodeType = 'classic' | 'shop' | 'boss';

export interface MapNode {
  nodeIndex: number;
  zone: number;
  nodeInZone: number;
  type: NodeType;
  contractLevel: number | null;
  displayLabel: string;
}

export const NODES_PER_ZONE = 11;
export const CLASSIC_PER_ZONE = 9;
export const TOTAL_ZONES = 5;
export const TOTAL_NODES = NODES_PER_ZONE * TOTAL_ZONES;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;

export function getNodeType(nodeInZone: number): NodeType {
  if (nodeInZone < CLASSIC_PER_ZONE) return 'classic';
  if (nodeInZone === CLASSIC_PER_ZONE) return 'shop';
  return 'boss';
}

export function getMapNode(nodeIndex: number): MapNode {
  const zone = Math.floor(nodeIndex / NODES_PER_ZONE) + 1;
  const nodeInZone = nodeIndex % NODES_PER_ZONE;
  const type = getNodeType(nodeInZone);

  let contractLevel: number | null = null;
  if (type === 'classic') {
    contractLevel = (zone - 1) * LEVELS_PER_ZONE + nodeInZone + 1;
  } else if (type === 'boss') {
    contractLevel = zone * LEVELS_PER_ZONE;
  }

  let displayLabel: string;
  if (type === 'shop') {
    displayLabel = `${zone}-SHOP`;
  } else if (type === 'boss') {
    displayLabel = `${zone}-BOSS`;
  } else {
    displayLabel = `${zone}-${nodeInZone + 1}`;
  }

  return { nodeIndex, zone, nodeInZone, type, contractLevel, displayLabel };
}

export function contractLevelToNodeIndex(contractLevel: number): number {
  if (contractLevel < 1 || contractLevel > GAMEPLAY_LEVELS) return -1;
  const zone = Math.ceil(contractLevel / LEVELS_PER_ZONE);
  const levelInZone = contractLevel - (zone - 1) * LEVELS_PER_ZONE;

  if (levelInZone === LEVELS_PER_ZONE) {
    // Boss level
    return (zone - 1) * NODES_PER_ZONE + NODES_PER_ZONE - 1;
  }
  // Classic level (1-9 maps to nodeInZone 0-8)
  return (zone - 1) * NODES_PER_ZONE + (levelInZone - 1);
}

export function nodeIndexToContractLevel(nodeIndex: number): number | null {
  return getMapNode(nodeIndex).contractLevel;
}

export function getZone(contractLevel: number): number {
  return Math.ceil(contractLevel / LEVELS_PER_ZONE);
}

export function getNodesForZone(zone: number): MapNode[] {
  const start = (zone - 1) * NODES_PER_ZONE;
  return Array.from({ length: NODES_PER_ZONE }, (_, i) => getMapNode(start + i));
}

export function getAllNodes(): MapNode[] {
  return Array.from({ length: TOTAL_NODES }, (_, i) => getMapNode(i));
}

export function isShopNode(nodeIndex: number): boolean {
  return nodeIndex % NODES_PER_ZONE === CLASSIC_PER_ZONE;
}

export function isBossNode(nodeIndex: number): boolean {
  return nodeIndex % NODES_PER_ZONE === NODES_PER_ZONE - 1;
}

export function getShopNodeForZone(zone: number): number {
  return (zone - 1) * NODES_PER_ZONE + CLASSIC_PER_ZONE;
}

export function getBossNodeForZone(zone: number): number {
  return (zone - 1) * NODES_PER_ZONE + NODES_PER_ZONE - 1;
}

export function getCurrentNodeIndex(contractLevel: number): number {
  return contractLevelToNodeIndex(contractLevel);
}

export { getThemeNodePositions, getThemeMapConfig } from './mapPathData';
export type { ZoneNodePositions, ThemeMapConfig } from './mapPathData';

/**
 * @deprecated Use `getThemeNodePositions(themeId)` for theme-aware positions.
 * Kept for backward compatibility — identical to the default procedural layout.
 */
export const MAP_NODE_POSITIONS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0.35, y: 0.92 },
  { x: 0.65, y: 0.84 },
  { x: 0.35, y: 0.76 },
  { x: 0.60, y: 0.68 },
  { x: 0.30, y: 0.60 },
  { x: 0.60, y: 0.52 },
  { x: 0.35, y: 0.44 },
  { x: 0.60, y: 0.36 },
  { x: 0.30, y: 0.28 },
  { x: 0.60, y: 0.18 },
  { x: 0.50, y: 0.07 },
];
