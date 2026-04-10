/**
 * Chrome layout constants — single source of truth for all UI chrome geometry.
 * All coordinates are in SVG viewBox units. The toPercent() helper converts
 * them to CSS percentage values for the sibling overlay div.
 */

// ─── HUD Bar ───
export const HUD_BAR = {
  viewBox: { width: 500, height: 164 },
  sockets: {
    guardian: { cx: 72, cy: 62, r: 30 },
    // Level badge overlaid on guardian — no separate socket
    stars: { x: 190, y: 8, width: 120, height: 26 },
    scoreBar: { x: 130, y: 44, width: 260, height: 22 },
    combo: { cx: 250, cy: 88, r: 16 },
    moves: { cx: 432, cy: 62, r: 32 },
    // Constraints — below combo, centered
    constraint1: { cx: 222, cy: 130, r: 18 },
    constraint2: { cx: 278, cy: 130, r: 18 },
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
  /** Padding around the grid content in viewBox units */
  padding: 12,
  /** Border thickness */
  borderWidth: 6,
  /** Corner radius */
  cornerRadius: 10,
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
