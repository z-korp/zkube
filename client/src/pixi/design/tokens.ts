/**
 * zKube V3 Design Tokens
 * Single source of truth for all visual values
 * All px values are base — multiply by uiScale at runtime
 * All colors are hex numbers (0xFFFFFF format) for PixiJS
 */

// ============================================================================
// 1. SPACING
// ============================================================================
export const space = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// ============================================================================
// 2. TYPOGRAPHY
// ============================================================================

// Font family constants
export const FONT_DISPLAY = "'Tilt Prism', 'Arial Black', sans-serif";
export const FONT_UI = "'Arial Black', 'Arial Bold', 'Arial', sans-serif";
export const FONT_BODY = "'Arial', 'Helvetica', sans-serif";

export const text = {
  display: {
    fontFamily: FONT_DISPLAY,
    fontSize: 48,
    fontWeight: 'bold' as const,
    lineHeight: 1.1,
  },
  h1: {
    fontFamily: FONT_DISPLAY,
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 1.2,
  },
  h2: {
    fontFamily: FONT_DISPLAY,
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 1.2,
  },
  h3: {
    fontFamily: FONT_UI,
    fontSize: 20,
    fontWeight: 'bold' as const,
    lineHeight: 1.3,
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 1.4,
  },
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 1.3,
  },
  micro: {
    fontFamily: FONT_UI,
    fontSize: 11,
    fontWeight: 'bold' as const,
    lineHeight: 1.0,
  },
  hud: {
    fontFamily: FONT_UI,
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 1.0,
  },
  hudSmall: {
    fontFamily: FONT_UI,
    fontSize: 16,
    fontWeight: 'bold' as const,
    lineHeight: 1.0,
  },
  combo: {
    fontFamily: FONT_DISPLAY,
    fontSize: 40,
    fontWeight: 'bold' as const,
    lineHeight: 1.0,
  },
} as const;

// ============================================================================
// 3. SEMANTIC COLORS (hex for PixiJS)
// ============================================================================
export const color = {
  bg: {
    primary: 0x1e293b,
    secondary: 0x0f172a,
    surface: 0x334155,
    overlay: 0x000000, // use at 60% alpha
  },
  text: {
    primary: 0xffffff,
    secondary: 0x94a3b8,
    muted: 0x64748b,
  },
  accent: {
    blue: 0x3b82f6,
    gold: 0xfbbf24,
    orange: 0xf97316,
    purple: 0x8b5cf6,
  },
  interactive: {
    pillBg: 0x333333,
    pillPressed: 0x555555,
  },
  status: {
    success: 0x22c55e,
    successDark: 0x14532d,
    successLight: 0x86efac,
    danger: 0xef4444,
    dangerDark: 0x7f1d1d,
    dangerLight: 0xfca5a5,
    warning: 0xf97316,
    warningDark: 0x78350f,
    warningLight: 0xfcd34d,
  },
  state: {
    hover: 0x334155,
    pressed: 0x1e293b,
    disabled: 0x4b5563, // use at 50% alpha
    locked: 0x64748b, // use at 40% alpha
  },
} as const;

// ============================================================================
// 4. EASING FUNCTIONS
// ============================================================================
export const ease = {
  linear: (t: number): number => t,

  outCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  inCubic: (t: number): number => t * t * t,

  outBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  outBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  inOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
} as const;

// ============================================================================
// 5. ANIMATION DURATIONS (milliseconds)
// ============================================================================
export const duration = {
  buttonPress: 150,
  modalEnter: 250,
  modalExit: 200,
  pageSlide: 300,
  playTunnel: 400,
  gravity: 300,
  lineClear: 500,
  scoreCountUp: 500,
  particleBurst: 800,
  screenShake: 200,
  coinFly: 600,
  starPopIn: 400,
} as const;

// ============================================================================
// 6. LAYOUT CONSTANTS
// ============================================================================
export const layout = {
  gridHeightRatio: 0.65, // 65% of viewport
  gridCols: 8,
  gridRows: 10,
  topBarHeight: 44,
  actionBarHeight: 80,
  maxContentWidth: 480,
  touchTarget: 44,
  baseWidth: 375, // iPhone SE baseline
} as const;

// ============================================================================
// 7. BUTTON SIZES
// ============================================================================
export const buttonSize = {
  lg: {
    height: 52,
    minWidth: 200,
    paddingH: 24,
    fontSize: 20,
  },
  md: {
    height: 44,
    minWidth: 140,
    paddingH: 16,
    fontSize: 16,
  },
  sm: {
    height: 36,
    minWidth: 100,
    paddingH: 12,
    fontSize: 13,
  },
  icon: {
    height: 44,
    minWidth: 44,
    paddingH: 10,
    fontSize: 0,
  },
} as const;

// ============================================================================
// 8. 9-SLICE BORDERS
// ============================================================================
export const nineSlice = {
  btn: {
    left: 16,
    top: 16,
    right: 16,
    bottom: 16,
  },
  panel: {
    left: 24,
    top: 24,
    right: 24,
    bottom: 24,
  },
} as const;

// ============================================================================
// 9. TEXT SHADOW PRESET
// ============================================================================
export const textShadow = {
  distance: 2,
  angle: Math.PI / 4,
  alpha: 0.3,
  blur: 2,
  color: 0x000000,
} as const;

// ============================================================================
// 10. UI SCALE HELPER
// ============================================================================
/**
 * Calculate responsive UI scale based on screen width
 * @param screenWidth - Current screen width in pixels
 * @returns Scale factor (0.8 to 1.5)
 */
export function getUiScale(screenWidth: number): number {
  return Math.max(0.8, Math.min(screenWidth / layout.baseWidth, 1.5));
}
