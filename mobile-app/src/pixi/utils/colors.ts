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

// ============================================================================
// SHARED ASSET PATHS (theme-independent)
// ============================================================================

export const SHARED_ASSETS = {
  iconMoves: '/assets/icon-moves.png',
  iconScore: '/assets/icon-score.png',
  iconCube: '/assets/icon-cube.png',
  iconLevel: '/assets/icon-level.png',
  iconSurrender: '/assets/icon-surrender.png',
} as const;

// ============================================================================
// THEME ASSET NAMES (resolved via getAssetPath)
// ============================================================================

export const THEME_ASSETS = {
  background: 'background.png',
  gridBg: 'grid-bg.png',
  gridFrame: 'grid-frame.png',
  hudBar: 'hud-bar.png',
  actionBar: 'action-bar.png',
  bonusBtnBg: 'bonus-btn-bg.png',
  starFilled: 'star-filled.png',
  starEmpty: 'star-empty.png',
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
  gridBg: number;
  gridCellAlt: number;
  frameBorder: number;
  hudBar: number;
  hudBarBorder: number;
  actionBarBg: number;
  dangerZone: number;
  dangerZoneAlpha: number;
  accent: number;
  blocks: Record<number, BlockColors>;
  particles: {
    primary: number[];
    explosion: number[];
  };
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

/** All available theme IDs */
export const THEME_IDS = [
  'theme-1',    // Tiki / Tropical
  'theme-2',    // Cosmic / Space
  'theme-3',    // Neon / Cyberpunk
  'theme-4',    // Ocean / Deep Sea
  'theme-5',    // Forest / Enchanted
  'theme-6',    // Desert / Sand
  'theme-7',    // Ice / Arctic
  'theme-8',    // Lava / Volcano
  'theme-9',    // Candy / Sweet
  'theme-10',   // Steampunk / Brass
] as const;

export type ThemeId = typeof THEME_IDS[number];

/** Human-readable theme metadata */
export const THEME_META: Record<ThemeId, { name: string; icon: string; description: string }> = {
  'theme-1':  { name: 'Tiki',      icon: '🌴', description: 'Tropical paradise with wooden frames and jungle vibes' },
  'theme-2':  { name: 'Cosmic',    icon: '🌌', description: 'Deep space with nebula gradients and star fields' },
  'theme-3':  { name: 'Neon',      icon: '💜', description: 'Cyberpunk neon lights on dark city grid' },
  'theme-4':  { name: 'Ocean',     icon: '🌊', description: 'Deep sea blues with coral and bioluminescence' },
  'theme-5':  { name: 'Forest',    icon: '🌿', description: 'Enchanted woodland with moss and fireflies' },
  'theme-6':  { name: 'Desert',    icon: '🏜️', description: 'Golden sands with terracotta and sun-baked stone' },
  'theme-7':  { name: 'Arctic',    icon: '❄️', description: 'Frozen tundra with ice crystals and aurora borealis' },
  'theme-8':  { name: 'Lava',      icon: '🌋', description: 'Volcanic forge with molten rock and obsidian' },
  'theme-9':  { name: 'Candy',     icon: '🍬', description: 'Sweet pastel world with candy colors' },
  'theme-10': { name: 'Steampunk', icon: '⚙️', description: 'Brass gears and copper pipes on dark leather' },
};

/**
 * Theme 1 — Tiki / Tropical
 * Sky blue backgrounds, wooden UI, vibrant block colors
 */
const TIKI_COLORS: ThemeColors = {
  background: 0x87CEEB,
  backgroundGradientStart: 0xB0E0E6,
  backgroundGradientEnd: 0xFFF8DC,
  gridLines: 0x3E2723,
  gridLinesAlpha: 0.35,
  gridBg: 0x5D4037,
  gridCellAlt: 0x6D4C41,
  frameBorder: 0xB8860B,
  hudBar: 0x1A0E08,
  hudBarBorder: 0x5D4037,
  actionBarBg: 0x1A0E08,
  dangerZone: 0xFF6B6B,
  dangerZoneAlpha: 0.2,
  accent: 0xFF8C00,
  blocks: {
    1: { fill: 0x4ADE80, glow: 0x22C55E, highlight: 0x86EFAC },
    2: { fill: 0x4AA8DE, glow: 0x3B82F6, highlight: 0x93C5FD },
    3: { fill: 0x9F7AEA, glow: 0x8B5CF6, highlight: 0xC4B5FD },
    4: { fill: 0xFBBF24, glow: 0xF59E0B, highlight: 0xFDE047 },
  },
  particles: {
    primary: [0x4ADE80, 0x4AA8DE, 0x9F7AEA, 0xFBBF24, 0xFF6B6B],
    explosion: [0xFFFFFF, 0xFBBF24, 0xFF8C00, 0xFF6B6B, 0x4ADE80],
  },
};

/**
 * Theme 2 — Cosmic / Space
 * Deep purple-blue nebula gradients, starfield, cool-toned blocks
 */
const COSMIC_COLORS: ThemeColors = {
  background: 0x0B0D21,
  backgroundGradientStart: 0x0B0D21,
  backgroundGradientEnd: 0x1A1040,
  gridLines: 0x4A3F8A,
  gridLinesAlpha: 0.3,
  gridBg: 0x12102A,
  gridCellAlt: 0x1A1535,
  frameBorder: 0x6C5CE7,
  hudBar: 0x0A0820,
  hudBarBorder: 0x3D3580,
  actionBarBg: 0x0A0820,
  dangerZone: 0xFF4757,
  dangerZoneAlpha: 0.25,
  accent: 0xA29BFE,
  blocks: {
    1: { fill: 0x00D2D3, glow: 0x01A3A4, highlight: 0x48DBFB },
    2: { fill: 0x6C5CE7, glow: 0x5541D7, highlight: 0xA29BFE },
    3: { fill: 0xFD79A8, glow: 0xE84393, highlight: 0xFAB1C8 },
    4: { fill: 0xFDCB6E, glow: 0xF9A825, highlight: 0xFDEB9C },
  },
  particles: {
    primary: [0x00D2D3, 0x6C5CE7, 0xFD79A8, 0xFDCB6E, 0xA29BFE],
    explosion: [0xFFFFFF, 0xA29BFE, 0x6C5CE7, 0x48DBFB, 0xFDCB6E],
  },
};

/**
 * Theme 3 — Neon / Cyberpunk
 * Dark background, electric neon outlines, high contrast
 */
const NEON_COLORS: ThemeColors = {
  background: 0x0A0A1A,
  backgroundGradientStart: 0x0A0A1A,
  backgroundGradientEnd: 0x15152D,
  gridLines: 0xFF00FF,
  gridLinesAlpha: 0.2,
  gridBg: 0x0D0D22,
  gridCellAlt: 0x111130,
  frameBorder: 0xFF00FF,
  hudBar: 0x08081A,
  hudBarBorder: 0xBF00FF,
  actionBarBg: 0x08081A,
  dangerZone: 0xFF0055,
  dangerZoneAlpha: 0.3,
  accent: 0x00FFFF,
  blocks: {
    1: { fill: 0x00FF88, glow: 0x00CC6A, highlight: 0x66FFBB },
    2: { fill: 0x00DDFF, glow: 0x00AACC, highlight: 0x66EEFF },
    3: { fill: 0xFF00FF, glow: 0xCC00CC, highlight: 0xFF66FF },
    4: { fill: 0xFFFF00, glow: 0xCCCC00, highlight: 0xFFFF66 },
  },
  particles: {
    primary: [0x00FF88, 0x00DDFF, 0xFF00FF, 0xFFFF00, 0xFF0055],
    explosion: [0xFFFFFF, 0x00FFFF, 0xFF00FF, 0x00FF88, 0xFFFF00],
  },
};

/**
 * Theme 4 — Ocean / Deep Sea
 * Aquatic blues and teals, coral accents, bioluminescent glow
 */
const OCEAN_COLORS: ThemeColors = {
  background: 0x0A2540,
  backgroundGradientStart: 0x0A2540,
  backgroundGradientEnd: 0x053055,
  gridLines: 0x1A6E8E,
  gridLinesAlpha: 0.3,
  gridBg: 0x0C2D4A,
  gridCellAlt: 0x103555,
  frameBorder: 0x20B2AA,
  hudBar: 0x081E35,
  hudBarBorder: 0x1A6E8E,
  actionBarBg: 0x081E35,
  dangerZone: 0xFF6B6B,
  dangerZoneAlpha: 0.2,
  accent: 0x00CED1,
  blocks: {
    1: { fill: 0x00E5A0, glow: 0x00B880, highlight: 0x66F2C8 },
    2: { fill: 0x00B4D8, glow: 0x0090AD, highlight: 0x66D4E8 },
    3: { fill: 0xFF6F91, glow: 0xD94F70, highlight: 0xFF9FB5 },
    4: { fill: 0xFFC947, glow: 0xCCA030, highlight: 0xFFDB7A },
  },
  particles: {
    primary: [0x00E5A0, 0x00B4D8, 0xFF6F91, 0xFFC947, 0x20B2AA],
    explosion: [0xFFFFFF, 0x00CED1, 0x00E5A0, 0xFF6F91, 0xFFC947],
  },
};

/**
 * Theme 5 — Forest / Enchanted
 * Deep greens, earthy browns, golden firefly accents
 */
const FOREST_COLORS: ThemeColors = {
  background: 0x1A3A1A,
  backgroundGradientStart: 0x1A3A1A,
  backgroundGradientEnd: 0x2D5A27,
  gridLines: 0x3D6B35,
  gridLinesAlpha: 0.35,
  gridBg: 0x1E3E1E,
  gridCellAlt: 0x254A24,
  frameBorder: 0x8B7355,
  hudBar: 0x142814,
  hudBarBorder: 0x3D6B35,
  actionBarBg: 0x142814,
  dangerZone: 0xFF6B6B,
  dangerZoneAlpha: 0.2,
  accent: 0xDAA520,
  blocks: {
    1: { fill: 0x66BB6A, glow: 0x43A047, highlight: 0xA5D6A7 },
    2: { fill: 0x42A5F5, glow: 0x1E88E5, highlight: 0x90CAF9 },
    3: { fill: 0xAB47BC, glow: 0x8E24AA, highlight: 0xCE93D8 },
    4: { fill: 0xFFCA28, glow: 0xFFB300, highlight: 0xFFE082 },
  },
  particles: {
    primary: [0x66BB6A, 0x42A5F5, 0xAB47BC, 0xFFCA28, 0xDAA520],
    explosion: [0xFFFFFF, 0xDAA520, 0x66BB6A, 0xFFCA28, 0xAB47BC],
  },
};

/**
 * Theme 6 — Desert / Sand
 * Warm sandy tones, terracotta, sun-baked palette
 */
const DESERT_COLORS: ThemeColors = {
  background: 0xC2956B,
  backgroundGradientStart: 0xE8C99B,
  backgroundGradientEnd: 0xC2956B,
  gridLines: 0x8B6914,
  gridLinesAlpha: 0.3,
  gridBg: 0x9E7E5A,
  gridCellAlt: 0xAA8A64,
  frameBorder: 0xCD853F,
  hudBar: 0x5C3D1E,
  hudBarBorder: 0x8B6914,
  actionBarBg: 0x5C3D1E,
  dangerZone: 0xFF4444,
  dangerZoneAlpha: 0.25,
  accent: 0xE07B39,
  blocks: {
    1: { fill: 0xE07B39, glow: 0xC06020, highlight: 0xF0A060 },
    2: { fill: 0xD4463B, glow: 0xB03030, highlight: 0xE87070 },
    3: { fill: 0x3D9970, glow: 0x2D7D55, highlight: 0x70C0A0 },
    4: { fill: 0xE8C547, glow: 0xC0A030, highlight: 0xF0D870 },
  },
  particles: {
    primary: [0xE07B39, 0xD4463B, 0x3D9970, 0xE8C547, 0xCD853F],
    explosion: [0xFFFFFF, 0xE8C547, 0xE07B39, 0xD4463B, 0x3D9970],
  },
};

/**
 * Theme 7 — Arctic / Ice
 * Cool whites and blues, crystalline, aurora accents
 */
const ARCTIC_COLORS: ThemeColors = {
  background: 0xD0E8F0,
  backgroundGradientStart: 0xE8F4F8,
  backgroundGradientEnd: 0xB0D0E0,
  gridLines: 0x6090A8,
  gridLinesAlpha: 0.3,
  gridBg: 0xA8C8D8,
  gridCellAlt: 0xB5D0DE,
  frameBorder: 0x7EB8D0,
  hudBar: 0x3A6078,
  hudBarBorder: 0x6090A8,
  actionBarBg: 0x3A6078,
  dangerZone: 0xFF5555,
  dangerZoneAlpha: 0.3,
  accent: 0x40E0D0,
  blocks: {
    1: { fill: 0x40E0D0, glow: 0x30B0A5, highlight: 0x80F0E0 },
    2: { fill: 0x5B9BD5, glow: 0x4080B8, highlight: 0x90C0E8 },
    3: { fill: 0xB070D0, glow: 0x9050B0, highlight: 0xD0A0E8 },
    4: { fill: 0xF0C060, glow: 0xD0A040, highlight: 0xF8D890 },
  },
  particles: {
    primary: [0x40E0D0, 0x5B9BD5, 0xB070D0, 0xF0C060, 0xFFFFFF],
    explosion: [0xFFFFFF, 0x40E0D0, 0x5B9BD5, 0xE0F0FF, 0xB070D0],
  },
};

/**
 * Theme 8 — Lava / Volcano
 * Dark obsidian, molten orange-red, volcanic cracks
 */
const LAVA_COLORS: ThemeColors = {
  background: 0x1A0A0A,
  backgroundGradientStart: 0x1A0A0A,
  backgroundGradientEnd: 0x2D1010,
  gridLines: 0x8B2500,
  gridLinesAlpha: 0.35,
  gridBg: 0x1E0E0E,
  gridCellAlt: 0x251414,
  frameBorder: 0xFF4500,
  hudBar: 0x140808,
  hudBarBorder: 0x8B2500,
  actionBarBg: 0x140808,
  dangerZone: 0xFF0000,
  dangerZoneAlpha: 0.3,
  accent: 0xFF6600,
  blocks: {
    1: { fill: 0xFF6600, glow: 0xDD4400, highlight: 0xFF9944 },
    2: { fill: 0xFF2222, glow: 0xCC0000, highlight: 0xFF6666 },
    3: { fill: 0xFFAA00, glow: 0xDD8800, highlight: 0xFFCC44 },
    4: { fill: 0xFF4488, glow: 0xDD2266, highlight: 0xFF77AA },
  },
  particles: {
    primary: [0xFF6600, 0xFF2222, 0xFFAA00, 0xFF4488, 0xFF4500],
    explosion: [0xFFFFFF, 0xFF6600, 0xFF2222, 0xFFAA00, 0xFFCC44],
  },
};

/**
 * Theme 9 — Candy / Sweet
 * Pastel pinks, mint, lavender — playful and light
 */
const CANDY_COLORS: ThemeColors = {
  background: 0xFFF0F5,
  backgroundGradientStart: 0xFFF5FA,
  backgroundGradientEnd: 0xFFE0EB,
  gridLines: 0xDDA0C8,
  gridLinesAlpha: 0.3,
  gridBg: 0xF0D0E0,
  gridCellAlt: 0xF5D8E5,
  frameBorder: 0xE88EBF,
  hudBar: 0xC06090,
  hudBarBorder: 0xDDA0C8,
  actionBarBg: 0xC06090,
  dangerZone: 0xFF4466,
  dangerZoneAlpha: 0.25,
  accent: 0xFF69B4,
  blocks: {
    1: { fill: 0x7DCEA0, glow: 0x58B880, highlight: 0xA9E0C0 },
    2: { fill: 0x85C1E9, glow: 0x5DA8D8, highlight: 0xADD8F0 },
    3: { fill: 0xD7BDE2, glow: 0xBB8FCE, highlight: 0xE8D5EE },
    4: { fill: 0xF9E154, glow: 0xE0C830, highlight: 0xFBEB80 },
  },
  particles: {
    primary: [0x7DCEA0, 0x85C1E9, 0xD7BDE2, 0xF9E154, 0xFF69B4],
    explosion: [0xFFFFFF, 0xFF69B4, 0x7DCEA0, 0x85C1E9, 0xF9E154],
  },
};

/**
 * Theme 10 — Steampunk / Brass
 * Dark leather, copper & brass, warm amber accents
 */
const STEAMPUNK_COLORS: ThemeColors = {
  background: 0x2A1F14,
  backgroundGradientStart: 0x2A1F14,
  backgroundGradientEnd: 0x3D2D1C,
  gridLines: 0x8B6F47,
  gridLinesAlpha: 0.35,
  gridBg: 0x30241A,
  gridCellAlt: 0x382C20,
  frameBorder: 0xB8860B,
  hudBar: 0x1E1610,
  hudBarBorder: 0x8B6F47,
  actionBarBg: 0x1E1610,
  dangerZone: 0xFF4444,
  dangerZoneAlpha: 0.25,
  accent: 0xD4A017,
  blocks: {
    1: { fill: 0xB87333, glow: 0x9A5B20, highlight: 0xD49560 },
    2: { fill: 0xC5A050, glow: 0xA08030, highlight: 0xDDC070 },
    3: { fill: 0x6B8E23, glow: 0x557018, highlight: 0x90B040 },
    4: { fill: 0xCC5544, glow: 0xAA3333, highlight: 0xE08070 },
  },
  particles: {
    primary: [0xB87333, 0xC5A050, 0x6B8E23, 0xCC5544, 0xD4A017],
    explosion: [0xFFFFFF, 0xD4A017, 0xB87333, 0xC5A050, 0xCC5544],
  },
};

// ============================================================================
// THEME MAP
// ============================================================================

const THEME_COLORS_MAP: Record<ThemeId, ThemeColors> = {
  'theme-1':  TIKI_COLORS,
  'theme-2':  COSMIC_COLORS,
  'theme-3':  NEON_COLORS,
  'theme-4':  OCEAN_COLORS,
  'theme-5':  FOREST_COLORS,
  'theme-6':  DESERT_COLORS,
  'theme-7':  ARCTIC_COLORS,
  'theme-8':  LAVA_COLORS,
  'theme-9':  CANDY_COLORS,
  'theme-10': STEAMPUNK_COLORS,
};

export function getThemeColors(theme: string): ThemeColors {
  return THEME_COLORS_MAP[theme as ThemeId] ?? TIKI_COLORS;
}

/**
 * Get block colors for a specific block width
 */
export function getBlockColors(theme: string, blockWidth: number): BlockColors {
  const colors = getThemeColors(theme);
  return colors.blocks[blockWidth] || colors.blocks[1];
}

export function isProceduralTheme(theme: string): boolean {
  // Themes 3-10 have no art assets yet — render procedurally
  return theme !== 'theme-1' && theme !== 'theme-2';
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
