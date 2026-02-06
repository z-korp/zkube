import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { LevelBadge } from './LevelBadge';
import { ProgressBar } from './ProgressBar';
import { MovesCounter } from './MovesCounter';
import { ConstraintIndicator } from './ConstraintIndicator';
import type { ConstraintData } from './ConstraintIndicator';
import { ConstraintType } from '@/dojo/game/types/constraint';

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
  /** First constraint */
  constraint1?: ConstraintData;
  /** Second constraint (for dual constraint levels) */
  constraint2?: ConstraintData;
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
 * Top HUD bar containing level badge, progress bar, moves counter, and constraints
 * 
 * Layout (single row):
 * [LVL 9]  [████████░░░░░░░░]  [Constraint]  [26 moves]
 */
export const HUDBar = ({
  level,
  levelScore,
  targetScore,
  moves,
  maxMoves,
  constraint1,
  constraint2,
  width,
  height,
  y = 0,
  isInDanger = false,
}: HUDBarProps) => {
  const { colors } = usePixiTheme();

  // Check if we have active constraints
  const hasConstraint1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasConstraint2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasAnyConstraint = hasConstraint1 || hasConstraint2;

  // Layout calculations
  const padding = 4;
  const levelBadgeWidth = 56;
  const movesWidth = 64;
  const constraintWidth = hasAnyConstraint ? 90 : 0;
  const gap = 6;
  
  const progressBarX = levelBadgeWidth + gap;
  const constraintX = width - movesWidth - gap - constraintWidth;
  const progressBarWidth = constraintX - progressBarX - gap;
  const movesX = width - movesWidth;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Semi-transparent background
    g.rect(0, 0, width, height);
    g.fill({ color: 0x1a2744, alpha: 0.9 });
    
    g.moveTo(0, height - 1);
    g.lineTo(width, height - 1);
    g.stroke({ color: 0x334155, width: 1, alpha: 0.4 });
  }, [width, height]);

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
      
      {/* Constraints - stacked if both present */}
      {hasConstraint1 && constraint1 && (
        <ConstraintIndicator
          constraint={constraint1}
          x={constraintX}
          y={hasConstraint2 ? 2 : (height - 28) / 2}
          width={constraintWidth}
          height={hasConstraint2 ? 16 : 28}
        />
      )}
      {hasConstraint2 && constraint2 && (
        <ConstraintIndicator
          constraint={constraint2}
          x={constraintX}
          y={height - 18}
          width={constraintWidth}
          height={16}
        />
      )}
      
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
