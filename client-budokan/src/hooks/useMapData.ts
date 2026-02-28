import { useMemo } from "react";
import { hash } from "starknet";
import {
  DEFAULT_SETTINGS,
  generateLevelConfig,
  type Level,
} from "@/dojo/game/types/level";
import { THEME_IDS, type ThemeId } from "@/config/themes";
import type { DraftStateData } from "@/hooks/useDraft";
import {
  getDraftEventForZone,
  isDraftEventCompleted,
} from "@/utils/draftEvents";

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
  draftState?: DraftStateData | null;
}

/**
 * vNext: 11 nodes per zone (no mid-zone draft)
 * Sequence: entry_draft, L1, L2, ..., L9, boss
 */
export const NODES_PER_ZONE = 11;
export const TOTAL_ZONES = 5;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;
const ZONE_THEMES_SELECTOR = BigInt("0x5a4f4e455f5448454d4553");

function poseidon(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values));
}

/* ------------------------------------------------------------------ */
/*  Build the ordered 11-node sequence for a single zone.             */
/*                                                                    */
/*  Sequence: entry_draft, L1 … L9, boss                             */
/* ------------------------------------------------------------------ */

interface RawNode {
  type: NodeType;
  contractLevel: number | null;
}

function buildZoneSequence(_seed: bigint, zone: number): RawNode[] {
  const zoneStart = (zone - 1) * LEVELS_PER_ZONE + 1; // e.g. 1, 11, 21…
  const bossLevel = zone * LEVELS_PER_ZONE; // e.g. 10, 20, 30…

  const nodes: RawNode[] = [];

  // Entry draft — always first
  nodes.push({ type: "draft", contractLevel: null });

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
  return Math.ceil(clamped / LEVELS_PER_ZONE);
}

/* ------------------------------------------------------------------ */
/*  Node state resolution                                              */
/* ------------------------------------------------------------------ */

function getNodeState(
  node: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">,
  currentLevel: number,
  currentNodeIndex: number,
  seed: bigint,
  draftState?: DraftStateData | null,
): NodeState {
  const zoneEndLevel = node.zone * LEVELS_PER_ZONE;

  // --- Draft nodes (entry only in vNext) ---
  if (node.type === "draft") {
    const zoneStartLevel = (node.zone - 1) * LEVELS_PER_ZONE + 1;

    // Entry draft: unlocks when player reaches this zone
    const unlockLevel = node.zone === 1 ? 1 : zoneStartLevel;
    if (currentLevel < unlockLevel) return "locked";
    if (currentLevel > zoneEndLevel) return "visited";

    const entryEvent = getDraftEventForZone(seed, node.zone);
    if (isDraftEventCompleted(draftState ?? null, entryEvent)) {
      return "visited";
    }
    return "available";
  }

  // --- Classic + Boss nodes ---

  // Already cleared levels
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  // Level 1 of zone: locked until entry draft is done
  if (node.contractLevel === (node.zone - 1) * LEVELS_PER_ZONE + 1) {
    const entryEvent = getDraftEventForZone(seed, node.zone);

    if (!isDraftEventCompleted(draftState ?? null, entryEvent)) {
      if (node.contractLevel !== null && node.contractLevel >= currentLevel) {
        return "locked";
      }
    }
  }

  // Current level
  if (node.nodeIndex === currentNodeIndex) {
    return "current";
  }

  if (node.contractLevel !== null && node.contractLevel === currentLevel) {
    // First level in zone: entry draft must be completed
    const zoneFirstLevel = (node.zone - 1) * LEVELS_PER_ZONE + 1;
    if (node.contractLevel === zoneFirstLevel) {
      const entryEvent = getDraftEventForZone(seed, node.zone);
      if (isDraftEventCompleted(draftState ?? null, entryEvent)) {
        return "current";
      }
      return "locked";
    }

    return "current";
  }

  return "locked";
}

/* ------------------------------------------------------------------ */
/*  Zone themes                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main generator                                                     */
/* ------------------------------------------------------------------ */

export function generateMapData({
  seed,
  currentLevel,
  draftState,
}: UseMapDataParams): MapData {
  const clampedLevel = Math.max(1, Math.min(GAMEPLAY_LEVELS, currentLevel));
  const zoneThemes = deriveZoneThemes(seed);

  const allNodes: Omit<MapNodeData, "state" | "levelConfig" | "zoneTheme">[] = [];

  for (let z = 1; z <= TOTAL_ZONES; z++) {
    const sequence = buildZoneSequence(seed, z);
    const zoneBaseIndex = (z - 1) * NODES_PER_ZONE;

    for (let i = 0; i < sequence.length; i++) {
      const raw = sequence[i];
      const nodeIndex = zoneBaseIndex + i;

      const displayLabel =
        raw.type === "draft"
          ? `${z}-DRAFT`
          : raw.type === "boss"
            ? `${z}-BOSS`
            : `${raw.contractLevel ?? ""}`;

      allNodes.push({
        nodeIndex,
        zone: z,
        nodeInZone: i,
        type: raw.type,
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

    const state = getNodeState(node, clampedLevel, currentNodeIndex, seed, draftState);

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

export function useMapData({ seed, currentLevel, draftState }: UseMapDataParams): MapData {
  return useMemo(
    () => generateMapData({ seed, currentLevel, draftState }),
    [seed, currentLevel, draftState],
  );
}
