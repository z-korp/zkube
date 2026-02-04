import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { LevelBadge } from './LevelBadge';
import { ProgressBar } from './ProgressBar';
import { MovesCounter } from './MovesCounter';

interface HUDBarProps {
  /** Current level */
  level: number;
  /** Current score for this level */
  levelScore: number;
  /** Target score to complete the level */
  targetScore: number;
  /** Remaining moves */
  moves: number;
  /** Maximum moves for the level */
  maxMoves?: number;
  /** Width of the HUD bar */
  width: number;
  /** Height of the HUD bar */
  height: number;
  /** Y position */
  y?: number;
  /** Whether player is in danger (low on moves or grid filling up) */
  isInDanger?: boolean;
}

/**
 * Top HUD bar containing level badge, progress bar, and moves counter
 * 
 * Layout:
 * [LVL 9]  [████████░░░░░░░░]  [26 moves]
 */
export const HUDBar = ({
  level,
  levelScore,
  targetScore,
  moves,
  maxMoves,
  width,
  height,
  y = 0,
  isInDanger = false,
}: HUDBarProps) => {
  const { colors, isProcedural } = usePixiTheme();

  // Layout calculations
  const padding = 4;
  const levelBadgeWidth = 56;
  const movesWidth = 64;
  const gap = 8;
  
  const progressBarX = levelBadgeWidth + gap;
  const progressBarWidth = width - levelBadgeWidth - movesWidth - gap * 2;
  const movesX = width - movesWidth;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Semi-transparent background
    g.rect(0, 0, width, height);
    g.fill({ color: isProcedural ? 0x0a0a0f : 0x1a2744, alpha: 0.85 });
    
    // Bottom border line
    g.moveTo(0, height - 1);
    g.lineTo(width, height - 1);
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 1, alpha: 0.3 });
  }, [width, height, isProcedural, colors.accent]);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBackground} />
      
      <LevelBadge
        level={level}
        x={padding}
        y={0}
        height={height}
      />
      
      <ProgressBar
        current={levelScore}
        target={targetScore}
        x={progressBarX}
        y={0}
        width={progressBarWidth}
        height={height}
        isDanger={isInDanger}
      />
      
      <MovesCounter
        moves={moves}
        maxMoves={maxMoves}
        x={movesX - padding}
        y={0}
        height={height}
      />
    </pixiContainer>
  );
};

export default HUDBar;
