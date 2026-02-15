import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import type { ConstraintData } from '../hud';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { useGlow } from '../../hooks/useAnimatedValue';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';

interface LevelDisplayProps {
  level: number;
  stars: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  constraint3?: ConstraintData;
  x: number;
  y: number;
  width: number;
  height: number;
  uiScale?: number;
}

/**
 * Centered level display above the grid
 * Shows: Level number, star rating, and constraint progress badges
 * 
 * Layout: [ Constraint1 ]  LEVEL 9  ★★★  [ Constraint2 ]
 */
export const LevelDisplay = ({
  level,
  stars,
  constraint1,
  constraint2,
  constraint3,
  x,
  y,
  width,
  height,
  uiScale = 1,
}: LevelDisplayProps) => {
  // Track previous stars to detect when new star is earned
  const prevStarsRef = useRef(stars);
  const [starJustEarned, setStarJustEarned] = useState(false);
  
  useEffect(() => {
    if (stars > prevStarsRef.current) {
      setStarJustEarned(true);
      // Reset after animation
      const timer = setTimeout(() => setStarJustEarned(false), 800);
      return () => clearTimeout(timer);
    }
    prevStarsRef.current = stars;
  }, [stars]);

  // Glow effect when star is earned
  const starGlowIntensity = useGlow(starJustEarned, { duration: 200, fadeOut: 600 });

  const hasConstraint1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasConstraint2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasConstraint3 = constraint3 && constraint3.type !== ConstraintType.None;

  // Sizing
  const levelBadgeWidth = Math.round(80 * uiScale);
  const levelBadgeHeight = Math.round(32 * uiScale);
  const starSize = Math.round(14 * uiScale);
  const starGap = Math.round(3 * uiScale);
  const constraintBadgeWidth = Math.round(70 * uiScale);
  const constraintBadgeHeight = Math.round(24 * uiScale);
  const sectionGap = Math.round(12 * uiScale);

  // Calculate total width of elements
  const starsWidth = 3 * starSize + 2 * starGap;
  const centerSectionWidth = levelBadgeWidth + sectionGap + starsWidth;
  
  // Center everything
  const centerX = width / 2;

  // Draw level badge background
  const drawLevelBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Gradient-like background
    g.roundRect(0, 0, levelBadgeWidth, levelBadgeHeight, 8);
    g.fill({ color: 0x1e293b, alpha: 0.95 });
    
    g.roundRect(0, 0, levelBadgeWidth, levelBadgeHeight, 8);
    g.stroke({ color: 0x3b82f6, width: 2, alpha: 0.8 });
    
    // Inner glow effect
    g.roundRect(2, 2, levelBadgeWidth - 4, levelBadgeHeight - 4, 6);
    g.stroke({ color: 0xffffff, width: 1, alpha: 0.1 });
  }, [levelBadgeWidth, levelBadgeHeight]);

  // Draw stars with glow effect
  const drawStars = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const filledColor = 0xfbbf24;
    const emptyColor = 0x475569;
    
    for (let i = 0; i < 3; i++) {
      const starX = i * (starSize + starGap) + starSize / 2;
      const starY = starSize / 2;
      const filled = i < stars;
      
      // Draw 5-pointed star
      const outerRadius = starSize / 2;
      const innerRadius = outerRadius * 0.4;
      const points = 5;
      const path: number[] = [];
      
      for (let j = 0; j < points * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = (j * Math.PI) / points - Math.PI / 2;
        path.push(starX + radius * Math.cos(angle));
        path.push(starY + radius * Math.sin(angle));
      }
      
      // Glow effect for filled stars
      if (filled && starGlowIntensity > 0) {
        // Outer glow
        const glowRadius = outerRadius * (1 + starGlowIntensity * 0.5);
        const glowPath: number[] = [];
        for (let j = 0; j < points * 2; j++) {
          const radius = j % 2 === 0 ? glowRadius : glowRadius * 0.4;
          const angle = (j * Math.PI) / points - Math.PI / 2;
          glowPath.push(starX + radius * Math.cos(angle));
          glowPath.push(starY + radius * Math.sin(angle));
        }
        g.poly(glowPath);
        g.fill({ color: 0xfef3c7, alpha: starGlowIntensity * 0.4 });
      }
      
      g.poly(path);
      g.fill({ color: filled ? filledColor : emptyColor, alpha: filled ? 1 : 0.3 });
      
      if (filled) {
        g.poly(path);
        g.stroke({ color: 0xfcd34d, width: 1, alpha: 0.5 + starGlowIntensity * 0.5 });
      }
    }
  }, [stars, starSize, starGap, starGlowIntensity]);

  // Draw constraint badge
  const drawConstraintBadge = useCallback((g: PixiGraphics, _constraint: ConstraintData, isComplete: boolean) => {
    g.clear();
    
    const bgColor = isComplete ? 0x22c55e : 0x374151;
    const borderColor = isComplete ? 0x4ade80 : 0x6b7280;
    
    g.roundRect(0, 0, constraintBadgeWidth, constraintBadgeHeight, 4);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    g.roundRect(0, 0, constraintBadgeWidth, constraintBadgeHeight, 4);
    g.stroke({ color: borderColor, width: 1.5, alpha: 0.8 });
  }, [constraintBadgeWidth, constraintBadgeHeight]);

  // Get constraint display text
  const getConstraintText = useCallback((constraint: ConstraintData): string => {
    if (!constraint) return '';
    
    switch (constraint.type) {
      case ConstraintType.ClearLines:
      case ConstraintType.BreakBlocks:
      case ConstraintType.FillAndClear:
        return `${constraint.progress}/${constraint.count}`;
      case ConstraintType.AchieveCombo:
      case ConstraintType.ClearGrid:
        return constraint.progress >= 1 ? 'DONE' : '0/1';
      case ConstraintType.NoBonusUsed:
        return constraint.bonusUsed ? 'FAIL' : 'OK';
      default:
        return '';
    }
  }, []);

  const isConstraintComplete = useCallback((constraint: ConstraintData): boolean => {
    if (!constraint) return false;
    
    switch (constraint.type) {
      case ConstraintType.ClearLines:
      case ConstraintType.BreakBlocks:
      case ConstraintType.FillAndClear:
        return constraint.progress >= (constraint.count ?? 0);
      case ConstraintType.AchieveCombo:
      case ConstraintType.ClearGrid:
        return constraint.progress >= 1;
      case ConstraintType.NoBonusUsed:
        return !constraint.bonusUsed;
      default:
        return false;
    }
  }, []);

  // Text styles
  const levelLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fontWeight: 'bold',
    fill: 0x94a3b8,
    letterSpacing: 1,
  }), [uiScale]);

  const levelNumberStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(16 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const constraintTextStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const drawConstraint1Badge = useCallback((g: PixiGraphics) => {
    if (constraint1) drawConstraintBadge(g, constraint1, isConstraintComplete(constraint1));
  }, [drawConstraintBadge, constraint1, isConstraintComplete]);

  const drawConstraint2Badge = useCallback((g: PixiGraphics) => {
    if (constraint2) drawConstraintBadge(g, constraint2, isConstraintComplete(constraint2));
  }, [drawConstraintBadge, constraint2, isConstraintComplete]);

  const drawConstraint3Badge = useCallback((g: PixiGraphics) => {
    if (constraint3) drawConstraintBadge(g, constraint3, isConstraintComplete(constraint3));
  }, [drawConstraintBadge, constraint3, isConstraintComplete]);

  // Positions
  const levelBadgeX = centerX - centerSectionWidth / 2;
  const starsX = levelBadgeX + levelBadgeWidth + sectionGap;
  const constraint1X = hasConstraint1 ? levelBadgeX - constraintBadgeWidth - sectionGap : 0;
  const constraint2X = hasConstraint2 ? starsX + starsWidth + sectionGap : 0;
  const constraint3X = hasConstraint3 ? starsX + starsWidth + sectionGap : 0;

  return (
    <pixiContainer x={x} y={y}>
      {/* Constraint 1 (left) */}
      {hasConstraint1 && constraint1 && (
        <pixiContainer x={constraint1X} y={(height - constraintBadgeHeight) / 2}>
          <pixiGraphics draw={drawConstraint1Badge} />
          <pixiText
            text={getConstraintText(constraint1)}
            x={constraintBadgeWidth / 2}
            y={constraintBadgeHeight / 2}
            anchor={{ x: 0.5, y: 0.5 }}
            style={constraintTextStyle}
          />
        </pixiContainer>
      )}

      {/* Level Badge (center-left) */}
      <pixiContainer x={levelBadgeX} y={(height - levelBadgeHeight) / 2}>
        <pixiGraphics draw={drawLevelBadge} />
        <pixiText
          text="LEVEL"
          x={levelBadgeWidth / 2}
          y={6}
          anchor={{ x: 0.5, y: 0 }}
          style={levelLabelStyle}
        />
        <pixiText
          text={String(level)}
          x={levelBadgeWidth / 2}
          y={levelBadgeHeight - 4}
          anchor={{ x: 0.5, y: 1 }}
          style={levelNumberStyle}
        />
      </pixiContainer>

      {/* Stars (center-right) */}
      <pixiContainer x={starsX} y={(height - starSize) / 2}>
        <pixiGraphics draw={drawStars} />
      </pixiContainer>

      {/* Constraint 2 (right) */}
      {hasConstraint2 && constraint2 && (
        <pixiContainer x={constraint2X} y={hasConstraint3 ? (height - constraintBadgeHeight) / 2 - constraintBadgeHeight / 2 - 2 : (height - constraintBadgeHeight) / 2}>
          <pixiGraphics draw={drawConstraint2Badge} />
          <pixiText
            text={getConstraintText(constraint2)}
            x={constraintBadgeWidth / 2}
            y={constraintBadgeHeight / 2}
            anchor={{ x: 0.5, y: 0.5 }}
            style={constraintTextStyle}
          />
        </pixiContainer>
      )}

      {/* Constraint 3 (right, below constraint 2) */}
      {hasConstraint3 && constraint3 && (
        <pixiContainer x={constraint3X} y={(height - constraintBadgeHeight) / 2 + constraintBadgeHeight / 2 + 2}>
          <pixiGraphics draw={drawConstraint3Badge} />
          <pixiText
            text={getConstraintText(constraint3)}
            x={constraintBadgeWidth / 2}
            y={constraintBadgeHeight / 2}
            anchor={{ x: 0.5, y: 0.5 }}
            style={constraintTextStyle}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

export default LevelDisplay;
