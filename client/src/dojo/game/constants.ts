const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

// Game
export const DEFAULT_GRID_WIDTH = 8;
export const DEFAULT_GRID_HEIGHT = 10;

// Packing
export const COLOR_SIZE = 8;
export const COLOR_BIT_COUNT = 3;
export const BLOCK_SIZE = 8;
export const BLOCK_BIT_COUNT = 3;
export const ROW_SIZE = 16777216;
export const ROW_BIT_COUNT = 24;

// Tournament
export const DAILY_MODE_DURATION =
  VITE_PUBLIC_DEPLOY_TYPE === "slotdev" ? 3600 : 86400; // 1h or 1 day in seconds
export const NORMAL_MODE_DURATION =
  VITE_PUBLIC_DEPLOY_TYPE === "slotdev" ? 43200 : 604800; // 12 heures or 1 weeks in seconds
export const FREE_MODE_DURATION = 1577880000; // 50 ans
