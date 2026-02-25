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
  getDraftEventsForZone,
  getZoneMicroDraftTriggerLevel,
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
  draftState?: DraftStateData | null;
}

export const NODES_PER_ZONE = 12;
export const TOTAL_ZONES = 5;
export const GAMEPLAY_LEVELS = 50;
const LEVELS_PER_ZONE = 10;
const ZONE_THEMES_SELECTOR = BigInt("0x5a4f4e455f5448454d4553");

function poseidon(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values));
}

/* ------------------------------------------------------------------ */
/*  Build the ordered 12-node sequence for a single zone.             */
/*                                                                    */
/*  Sequence: entry_draft, L1 … Ln, mid_draft, L(n+1) … L9, boss     */
/*  The mid_draft appears AFTER the level whose completion triggers    */
/*  the draft (getZoneMicroDraftTriggerLevel).                        */
/* ------------------------------------------------------------------ */

interface RawNode {
  type: NodeType;
  draftPhase: "entry" | "mid" | null;
  contractLevel: number | null;
}

function buildZoneSequence(seed: bigint, zone: number): RawNode[] {
  const zoneStart = (zone - 1) * LEVELS_PER_ZONE + 1; // e.g. 1, 11, 21…
  const bossLevel = zone * LEVELS_PER_ZONE; // e.g. 10, 20, 30…
  const midTrigger = getZoneMicroDraftTriggerLevel(seed, zone);

  const nodes: RawNode[] = [];

  // Entry draft — always first
  nodes.push({ type: "draft", draftPhase: "entry", contractLevel: null });

  // 9 regular levels (zoneStart to zoneStart+8) interleaved with mid-draft
  for (let level = zoneStart; level < bossLevel; level++) {
    nodes.push({ type: "classic", draftPhase: null, contractLevel: level });

    // Mid-draft appears AFTER the trigger level
    if (level === midTrigger) {
      nodes.push({ type: "draft", draftPhase: "mid", contractLevel: null });
    }
  }

  // Boss — always last
  nodes.push({ type: "boss", draftPhase: null, contractLevel: bossLevel });

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

  // --- Draft nodes ---
  if (node.type === "draft") {
    const zoneStartLevel = (node.zone - 1) * LEVELS_PER_ZONE + 1;

    if (node.draftPhase === "entry") {
      // Entry draft: unlocks when player reaches this zone
      const unlockLevel = node.zone === 1 ? 1 : zoneStartLevel;
      if (currentLevel < unlockLevel) return "locked";
      if (currentLevel > zoneEndLevel) return "visited";

      const events = getDraftEventsForZone(seed, node.zone);
      const entryEvent = events.find(
        (e) => e.type === "post_level_1" || e.type === "post_boss",
      );
      if (entryEvent && isDraftEventCompleted(draftState ?? null, entryEvent)) {
        return "visited";
      }
      return "available";
    }

    // Mid draft: triggers when completed_level == trigger, so player is at trigger+1
    const trigger = getZoneMicroDraftTriggerLevel(seed, node.zone);
    if (currentLevel <= trigger) return "locked";
    if (currentLevel > zoneEndLevel) return "visited";

    const events = getDraftEventsForZone(seed, node.zone);
    const midEvent = events.find((e) => e.type === "zone_micro");
    if (midEvent && isDraftEventCompleted(draftState ?? null, midEvent)) {
      return "visited";
    }
    return "available";
  }

  // --- Classic + Boss nodes ---

  // Already cleared levels
  if (node.contractLevel !== null && node.contractLevel < currentLevel) {
    return "cleared";
  }

  // Level 1 special case: locked until entry draft for zone 1 is done
  if (node.contractLevel === (node.zone - 1) * LEVELS_PER_ZONE + 1) {
    // Check if entry draft for this zone is completed
    const events = getDraftEventsForZone(seed, node.zone);
    const entryEvent = events.find(
      (e) => e.type === "post_level_1" || e.type === "post_boss",
    );

    if (!entryEvent || !isDraftEventCompleted(draftState ?? null, entryEvent)) {
      // Entry draft not done yet — this level is locked
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
    // Check if the previous sequential node (draft or level) is done
    // For the first level in zone: entry draft must be completed
    const zoneFirstLevel = (node.zone - 1) * LEVELS_PER_ZONE + 1;
    if (node.contractLevel === zoneFirstLevel) {
      const events = getDraftEventsForZone(seed, node.zone);
      const entryEvent = events.find(
        (e) => e.type === "post_level_1" || e.type === "post_boss",
      );
      if (entryEvent && isDraftEventCompleted(draftState ?? null, entryEvent)) {
        return "current";
      }
      return "locked";
    }

    // For levels right after mid-draft: mid-draft must be completed
    const trigger = getZoneMicroDraftTriggerLevel(seed, node.zone);
    if (node.contractLevel === trigger + 1) {
      const events = getDraftEventsForZone(seed, node.zone);
      const midEvent = events.find((e) => e.type === "zone_micro");
      if (midEvent && isDraftEventCompleted(draftState ?? null, midEvent)) {
        return "current";
      }
      // If mid-draft not completed, draft is the "current" node, level after it is locked
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
