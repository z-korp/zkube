/**
 * Per-theme map path data.
 *
 * Each zone has 11 nodes (9 classic + 1 shop + 1 boss).
 * Positions are normalised to [0, 1] relative to the zone viewport
 * (x = fraction of viewport width, y = fraction of viewport height).
 *
 * For image-based themes the background is rendered in "cover" mode and
 * positions are tuned so the buttons land on the stone pads / landmarks
 * in the map artwork.
 *
 * For procedural themes the default zig-zag layout is used.
 */

import type { ThemeId } from './colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MapNodePosition {
  readonly x: number; // 0-1 fraction of viewport width
  readonly y: number; // 0-1 fraction of viewport height
}

/**
 * 11 positions per zone (indices 0-8 = classic, 9 = shop, 10 = boss).
 */
export type ZoneNodePositions = readonly [
  MapNodePosition, MapNodePosition, MapNodePosition,
  MapNodePosition, MapNodePosition, MapNodePosition,
  MapNodePosition, MapNodePosition, MapNodePosition,
  MapNodePosition, // shop
  MapNodePosition, // boss
];

export interface ThemeMapConfig {
  /** If true, ZoneBackground should render in "cover" mode. */
  hasBackgroundImage: boolean;
  /** Node positions for one zone (all zones in a theme share the same layout). */
  positions: ZoneNodePositions;
  /** Original image aspect ratio (width/height). Used for cover calculations. */
  imageAspectRatio?: number;
}

// ---------------------------------------------------------------------------
// Default layout — procedural zig-zag (same as legacy MAP_NODE_POSITIONS)
// ---------------------------------------------------------------------------

const DEFAULT_POSITIONS: ZoneNodePositions = [
  { x: 0.35, y: 0.92 },
  { x: 0.65, y: 0.84 },
  { x: 0.35, y: 0.76 },
  { x: 0.60, y: 0.68 },
  { x: 0.30, y: 0.60 },
  { x: 0.60, y: 0.52 },
  { x: 0.35, y: 0.44 },
  { x: 0.60, y: 0.36 },
  { x: 0.30, y: 0.28 },
  { x: 0.60, y: 0.18 }, // shop
  { x: 0.50, y: 0.07 }, // boss
];

// ---------------------------------------------------------------------------
// Theme-4 (Maya) — positions extracted from map.png stone pads
//
//   Image: 1080×1920  (aspect ratio ≈ 0.5625, 9:16)
//   Pads detected via vision analysis, converted to normalised fractions.
//   Path flows bottom → top (L1 at bottom, boss at top).
// ---------------------------------------------------------------------------

const MAYA_POSITIONS: ZoneNodePositions = [
  { x: 0.50, y: 0.91 },  // L1 — bottom stone pad
  { x: 0.44, y: 0.86 },  // L2 — lower-left pad
  { x: 0.60, y: 0.77 },  // L3 — right curve
  { x: 0.72, y: 0.68 },  // L4 — far right pad
  { x: 0.74, y: 0.60 },  // L5 — upper-right pad
  { x: 0.56, y: 0.57 },  // L6 — center path
  { x: 0.43, y: 0.52 },  // L7 — left-center pad
  { x: 0.35, y: 0.42 },  // L8 — upper-left pad
  { x: 0.51, y: 0.34 },  // L9 — center clearing
  { x: 0.86, y: 0.37 },  // SHOP — market plaza (right upper)
  { x: 0.50, y: 0.06 },  // BOSS — temple entrance (top center)
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const THEME_MAP_CONFIGS: Partial<Record<ThemeId, ThemeMapConfig>> = {
  'theme-4': {
    hasBackgroundImage: true,
    positions: MAYA_POSITIONS,
    imageAspectRatio: 1080 / 1920, // 0.5625 (9:16)
  },
  // Add more themes here as map artwork is created:
  // 'theme-1': { hasBackgroundImage: true, positions: TIKI_POSITIONS, imageAspectRatio: ... },
};

const DEFAULT_CONFIG: ThemeMapConfig = {
  hasBackgroundImage: false,
  positions: DEFAULT_POSITIONS,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the map configuration for a theme.
 * Returns theme-specific config if available, otherwise the default zig-zag.
 */
export function getThemeMapConfig(themeId: ThemeId): ThemeMapConfig {
  return THEME_MAP_CONFIGS[themeId] ?? DEFAULT_CONFIG;
}

/**
 * Get node positions for a given theme.
 * Convenience wrapper — returns the 11-element positions array.
 */
export function getThemeNodePositions(themeId: ThemeId): ZoneNodePositions {
  return getThemeMapConfig(themeId).positions;
}
