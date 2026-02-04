import type { PixiReactElementProps } from '@pixi/react';
import type { Container, Graphics, Sprite, Text, TilingSprite } from 'pixi.js';

// Extend PixiElements for TypeScript support
declare module '@pixi/react' {
  interface PixiElements {
    pixiContainer: PixiReactElementProps<typeof Container>;
    pixiGraphics: PixiReactElementProps<typeof Graphics>;
    pixiSprite: PixiReactElementProps<typeof Sprite>;
    pixiText: PixiReactElementProps<typeof Text>;
    pixiTilingSprite: PixiReactElementProps<typeof TilingSprite>;
  }
}

// GameStage ref type for imperative handle
export interface GameStageRef {
  triggerExplosion: (x: number, y: number) => void;
  triggerLineExplosion?: (y: number, lineCount: number) => void;
}

// Block type for PixiJS rendering
export interface PixiBlock {
  id: number;
  x: number;
  y: number;
  width: number;
}

// Animation state for blocks
export interface BlockAnimationState {
  isDragging: boolean;
  isSelected: boolean;
  isFalling: boolean;
  isExploding: boolean;
}

// Grid configuration
export interface GridConfig {
  width: number;
  height: number;
  cellSize: number;
  cols: number;
  rows: number;
}

// Particle configuration for effects
export interface ParticleConfig {
  x: number;
  y: number;
  color: number;
  count: number;
}
