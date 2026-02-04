/**
 * Color palettes for different themes
 */

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
 * Tiki/Tribal Theme - Deep blues with warm accents
 */
export const TIKI_COLORS: ThemeColors = {
  background: 0x10172A,
  backgroundGradientStart: 0x1a2744,
  backgroundGradientEnd: 0x0a0f1a,
  gridLines: 0x1E293B,
  gridLinesAlpha: 0.8,
  dangerZone: 0xEF4444,
  dangerZoneAlpha: 0.15,
  accent: 0x3B82F6,
  blocks: {
    1: { fill: 0x4ADE80, glow: 0x22C55E, highlight: 0x86EFAC }, // Green
    2: { fill: 0x38BDF8, glow: 0x0EA5E9, highlight: 0x7DD3FC }, // Blue
    3: { fill: 0xA78BFA, glow: 0x8B5CF6, highlight: 0xC4B5FD }, // Purple
    4: { fill: 0xFBBF24, glow: 0xF59E0B, highlight: 0xFDE047 }, // Yellow
  },
  particles: {
    primary: [0x4ADE80, 0x38BDF8, 0xA78BFA, 0xFBBF24],
    explosion: [0xFFFFFF, 0xFBBF24, 0xF97316, 0xEF4444],
  },
};

/**
 * Neon/Cyberpunk Theme - Dark with vibrant glowing colors
 */
export const NEON_COLORS: ThemeColors = {
  background: 0x0A0A0F,
  backgroundGradientStart: 0x15152a,
  backgroundGradientEnd: 0x050508,
  gridLines: 0x1A1A2E,
  gridLinesAlpha: 0.6,
  dangerZone: 0xFF0040,
  dangerZoneAlpha: 0.2,
  accent: 0x00FFFF,
  blocks: {
    1: { fill: 0x00FF88, glow: 0x00FF88, highlight: 0x80FFCC }, // Neon Green
    2: { fill: 0x00CCFF, glow: 0x00CCFF, highlight: 0x80E5FF }, // Cyan
    3: { fill: 0xFF00FF, glow: 0xFF00FF, highlight: 0xFF80FF }, // Magenta
    4: { fill: 0xFFFF00, glow: 0xFFFF00, highlight: 0xFFFF80 }, // Yellow
  },
  particles: {
    primary: [0x00FF88, 0x00CCFF, 0xFF00FF, 0xFFFF00],
    explosion: [0xFFFFFF, 0x00FFFF, 0xFF00FF, 0x00FF88],
  },
};

/**
 * Get theme colors by theme name
 */
export function getThemeColors(theme: string): ThemeColors {
  switch (theme) {
    case 'theme-neon':
    case 'neon':
      return NEON_COLORS;
    case 'theme-1':
    case 'theme-2':
    case 'tiki':
    default:
      return TIKI_COLORS;
  }
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
export function isProceduralTheme(theme: string): boolean {
  return theme === 'theme-neon' || theme === 'neon';
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
