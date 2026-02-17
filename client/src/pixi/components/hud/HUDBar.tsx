import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { LevelBadge } from './LevelBadge';
import { ProgressBar } from './ProgressBar';
import { MovesCounter } from './MovesCounter';
import { ConstraintIndicator } from './ConstraintIndicator';
import type { ConstraintData } from './ConstraintIndicator';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { usePixiTheme } from '../../themes/ThemeContext';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';
import type { ThemeId } from '../../utils/colors';
import { color } from '@/pixi/design/tokens';

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
  /** Third constraint (for triple constraint boss levels) */
  constraint3?: ConstraintData;
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
  constraint3,
  width,
  height,
  y = 0,
  isInDanger = false,
}: HUDBarProps) => {
  const { themeName } = usePixiTheme();
  const barCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.HudBar),
    [themeName],
  );
  const barTex = useTextureWithFallback(barCandidates);

  const hasConstraint1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasConstraint2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasConstraint3 = constraint3 && constraint3.type !== ConstraintType.None;
  const hasAnyConstraint = hasConstraint1 || hasConstraint2 || hasConstraint3;

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

    if (!barTex) {
      // Procedural fallback
      g.rect(0, 0, width, height);
      g.fill({ color: color.bg.primary, alpha: 0.9 });

      g.moveTo(0, height - 1);
      g.lineTo(width, height - 1);
      g.stroke({ color: color.bg.surface, width: 1, alpha: 0.4 });
    }
  }, [width, height, barTex]);

  return (
    <pixiContainer y={y}>
      {barTex ? (
        <pixiSprite texture={barTex} width={width} height={height} />
      ) : (
        <pixiGraphics draw={drawBackground} />
      )}
      
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
      
      {hasConstraint1 && constraint1 && (
        <ConstraintIndicator
          constraint={constraint1}
          x={constraintX}
          y={hasConstraint2 || hasConstraint3 ? 1 : (height - 28) / 2}
          width={constraintWidth}
          height={hasConstraint2 || hasConstraint3 ? 14 : 28}
        />
      )}
      {hasConstraint2 && constraint2 && (
        <ConstraintIndicator
          constraint={constraint2}
          x={constraintX}
          y={hasConstraint3 ? Math.round(height / 2) - 7 : height - 16}
          width={constraintWidth}
          height={14}
        />
      )}
      {hasConstraint3 && constraint3 && (
        <ConstraintIndicator
          constraint={constraint3}
          x={constraintX}
          y={height - 15}
          width={constraintWidth}
          height={14}
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
