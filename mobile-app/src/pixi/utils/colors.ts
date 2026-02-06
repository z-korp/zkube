/**
 * Color palettes and typography for different themes
 */

// ============================================================================
// FONTS
// ============================================================================

export const FONT_TITLE = 'Fredericka the Great, Bangers, Arial Black, sans-serif';
export const FONT_BOLD = 'Arial Black, Arial Bold, Arial, sans-serif';
export const FONT_BODY = 'Arial, Helvetica, sans-serif';

export const UI = {
  bg: {
    primary: 0x1e293b,
    secondary: 0x0f172a,
    dark: 0x000000,
    hover: 0x334155,
    card: 0x1e293b,
  },
  border: {
    primary: 0x475569,
    secondary: 0x334155,
    muted: 0x64748b,
  },
  text: {
    primary: 0xffffff,
    secondary: 0x94a3b8,
    muted: 0x64748b,
    dark: 0x475569,
  },
  accent: {
    blue: 0x3b82f6,
    blueLight: 0x60a5fa,
    gold: 0xfbbf24,
    orange: 0xf97316,
    purple: 0x6366f1,
    purpleDark: 0x3730a3,
    purpleHover: 0x4338ca,
  },
  status: {
    success: 0x22c55e,
    successLight: 0x4ade80,
    successDark: 0x166534,
    danger: 0xef4444,
    dangerDark: 0x7f1d1d,
    dangerDarker: 0x991b1b,
    dangerLight: 0xfca5a5,
    warning: 0xf97316,
  },
  state: {
    hover: 0x334155,
    pressed: 0x374151,
    disabled: 0x6b7280,
    locked: 0x4b5563,
  },
} as const;

export interface BlockColors {
  fill: number;
  glow: number;
  highlight: number;
}

export interface ThemeColors {
  background: number;
  backgroundGradientStart: number;
  backgroundGradientEnd: number;
  gridLines: number;
  gridLinesAlpha: number;
  dangerZone: number;
  dangerZoneAlpha: number;
  accent: number;
  blocks: Record<number, BlockColors>;
  particles: {
    primary: number[];
    explosion: number[];
  };
}

/**
 * Tiki/Tropical Theme - Bright, playful colors inspired by Tetris Combo
 * Sky blue backgrounds with vibrant block colors
 */
export const TIKI_COLORS: ThemeColors = {
  // Light, airy sky background
  background: 0x87CEEB, // Sky blue
  backgroundGradientStart: 0xB0E0E6, // Powder blue (top)
  backgroundGradientEnd: 0xFFF8DC, // Cornsilk/cream (bottom, warm)
  // Soft purple grid lines to match the grid panel
  gridLines: 0x9370DB, // Medium purple
  gridLinesAlpha: 0.4,
  // Danger zone remains red but softer
  dangerZone: 0xFF6B6B,
  dangerZoneAlpha: 0.2,
  // Orange accent to match buttons
  accent: 0xFF8C00, // Dark orange
  // Block colors match the new tiki face blocks
  blocks: {
    1: { fill: 0x4ADE80, glow: 0x22C55E, highlight: 0x86EFAC }, // Green (matches block-1)
    2: { fill: 0x4AA8DE, glow: 0x3B82F6, highlight: 0x93C5FD }, // Blue (matches block-2)
    3: { fill: 0x9F7AEA, glow: 0x8B5CF6, highlight: 0xC4B5FD }, // Purple (matches block-3)
    4: { fill: 0xFBBF24, glow: 0xF59E0B, highlight: 0xFDE047 }, // Yellow/Orange (matches block-4)
  },
  particles: {
    // Bright, tropical particle colors
    primary: [0x4ADE80, 0x4AA8DE, 0x9F7AEA, 0xFBBF24, 0xFF6B6B],
    explosion: [0xFFFFFF, 0xFBBF24, 0xFF8C00, 0xFF6B6B, 0x4ADE80],
  },
};

export function getThemeColors(_theme: string): ThemeColors {
  return TIKI_COLORS;
}

/**
 * Get block colors for a specific block width
 */
export function getBlockColors(theme: string, blockWidth: number): BlockColors {
  const colors = getThemeColors(theme);
  return colors.blocks[blockWidth] || colors.blocks[1];
}

/**
 * Check if theme uses procedural rendering (neon) vs textures (tiki)
 */
export function isProceduralTheme(_theme: string): boolean {
  return false;
}

/**
 * Convert hex color to RGB components
 */
export function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xFF,
    g: (hex >> 8) & 0xFF,
    b: hex & 0xFF,
  };
}

/**
 * Lighten a hex color by a percentage
 */
export function lightenColor(hex: number, percent: number): number {
  const { r, g, b } = hexToRgb(hex);
  const amount = Math.round(255 * (percent / 100));
  const newR = Math.min(255, r + amount);
  const newG = Math.min(255, g + amount);
  const newB = Math.min(255, b + amount);
  return (newR << 16) | (newG << 8) | newB;
}

/**
 * Darken a hex color by a percentage
 */
export function darkenColor(hex: number, percent: number): number {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - (percent / 100);
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  return (newR << 16) | (newG << 8) | newB;
}
