/**
 * Chrome layout constants — single source of truth for all UI chrome geometry.
 * All coordinates are in SVG viewBox units. The toPercent() helper converts
 * them to CSS percentage values for the sibling overlay div.
 */

// ─── HUD Bar ───
export const HUD_BAR = {
  viewBox: { width: 500, height: 152 },
  /** Central panel rect — portrait & moves overlap its left/right edges */
  panel: { x: 76, y: 16, width: 348, height: 88, rx: 12 },
  sockets: {
    guardian: { cx: 76, cy: 60, r: 32 },
    stars: { x: 186, y: 22, width: 128, height: 22 },
    scoreBar: { x: 144, y: 48, width: 212, height: 20 },
    combo: { x: 218, y: 74, width: 64, height: 24 },
    moves: { cx: 424, cy: 60, r: 34 },
    // Constraints: left-of-center and right-of-center, below panel
    constraint1: { cx: 160, cy: 110, r: 18 },
    constraint2: { cx: 340, cy: 110, r: 18 },
  },
} as const;

// ─── Action Bar ───
export const ACTION_BAR = {
  viewBox: { width: 400, height: 100 },
  sockets: {
    surrender: { cx: 72, cy: 50, r: 26 },
    bonus: { cx: 200, cy: 50, r: 30 },
    settings: { cx: 328, cy: 50, r: 26 },
  },
} as const;

// ─── Constraint Bar ───
export const CONSTRAINT_BAR = {
  viewBox: { width: 200, height: 70 },
  sockets: {
    ring1: { cx: 68, cy: 38, r: 22 },
    ring2: { cx: 132, cy: 38, r: 22 },
  },
} as const;

// ─── Grid Frame ───
export const GRID_FRAME = {
  /** Padding around the grid content in viewBox units (matches CSS padding+border) */
  padding: 9,
  /** Border thickness */
  borderWidth: 2,
  /** Corner radius */
  cornerRadius: 8,
} as const;

// ─── Helpers ───

interface CircleSocket {
  cx: number;
  cy: number;
  r: number;
}

interface RectSocket {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ViewBox {
  width: number;
  height: number;
}

/** Convert a circular socket to CSS percentage position/size */
export function circleToPercent(socket: CircleSocket, vb: ViewBox) {
  return {
    left: `${((socket.cx - socket.r) / vb.width) * 100}%`,
    top: `${((socket.cy - socket.r) / vb.height) * 100}%`,
    width: `${((socket.r * 2) / vb.width) * 100}%`,
    height: `${((socket.r * 2) / vb.height) * 100}%`,
  };
}

/** Convert a rectangular socket to CSS percentage position/size */
export function rectToPercent(socket: RectSocket, vb: ViewBox) {
  return {
    left: `${(socket.x / vb.width) * 100}%`,
    top: `${(socket.y / vb.height) * 100}%`,
    width: `${(socket.width / vb.width) * 100}%`,
    height: `${(socket.height / vb.height) * 100}%`,
  };
}
