export { GameStage } from './GameStage';
export { GameGrid } from './GameGrid';
export { GridBackground } from './GridBackground';
export { BlockSprite } from './BlockSprite';
export type { GameStageRef } from '../types';

// New unified canvas
export { GameCanvas } from './game';
export type { BonusSlotData } from './game/GameCanvas';

// HUD components
export { HUDBar, LevelBadge, ProgressBar, MovesCounter } from './hud';

// Action bar components
export { ActionBar, BonusButton, ComboDisplay, StarRating } from './actionbar';
export type { BonusButtonData } from './actionbar';

// Game components
export { NextLinePreview } from './game';
