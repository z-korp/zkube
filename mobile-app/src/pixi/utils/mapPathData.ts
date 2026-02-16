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
//   Image: 1536×2752  (aspect ratio ≈ 0.558)
//   Pads detected at pixel coordinates, converted to image-space fractions.
//   On mobile (~9:16 viewport) the image covers the viewport almost exactly
//   so fractions translate directly to viewport percentages.
// ---------------------------------------------------------------------------

const MAYA_POSITIONS: ZoneNodePositions = [
  { x: 0.32, y: 0.95 },  // L1 — bottom stone dais
  { x: 0.74, y: 0.81 },  // L2 — first right curve
  { x: 0.36, y: 0.73 },  // L3 — left bend
  { x: 0.33, y: 0.60 },  // L4 — left, near broken columns
  { x: 0.51, y: 0.57 },  // L5 — center path
  { x: 0.63, y: 0.49 },  // L6 — right, above waterfall
  { x: 0.54, y: 0.41 },  // L7 — center
  { x: 0.60, y: 0.33 },  // L8 — right, near cascades
  { x: 0.51, y: 0.27 },  // L9 — center clearing
  { x: 0.65, y: 0.17 },  // SHOP — market stall area (right upper)
  { x: 0.50, y: 0.06 },  // BOSS — temple entrance (top center)
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const THEME_MAP_CONFIGS: Partial<Record<ThemeId, ThemeMapConfig>> = {
  'theme-4': {
    hasBackgroundImage: true,
    positions: MAYA_POSITIONS,
    imageAspectRatio: 1536 / 2752, // ≈ 0.558
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
