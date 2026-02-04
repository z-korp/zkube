import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface StarRatingProps {
  /** Number of stars earned (0-3) */
  stars: number;
  /** Maximum stars possible (usually 3) */
  maxStars?: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Size of each star */
  starSize?: number;
  /** Gap between stars */
  gap?: number;
}

/**
 * Displays star rating for level performance
 */
export const StarRating = ({
  stars,
  maxStars = 3,
  x,
  y,
  starSize = 16,
  gap = 4,
}: StarRatingProps) => {
  const { colors, isProcedural } = usePixiTheme();

  const filledColor = 0xfbbf24; // gold
  const emptyColor = 0x475569; // gray

  // Draw a 5-pointed star at given position
  const drawStar = useCallback((g: PixiGraphics, cx: number, cy: number, size: number, filled: boolean) => {
    const outerRadius = size / 2;
    const innerRadius = outerRadius * 0.4;
    const points = 5;
    
    const path: number[] = [];
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      path.push(cx + radius * Math.cos(angle));
      path.push(cy + radius * Math.sin(angle));
    }
    
    // Draw the star shape
    g.poly(path);
    g.fill({ color: filled ? filledColor : emptyColor, alpha: filled ? 1 : 0.3 });
    
    // Add a slight border for definition
    if (filled) {
      g.poly(path);
      g.stroke({ color: 0xfcd34d, width: 1, alpha: 0.5 });
    }
  }, [filledColor, emptyColor]);

  const totalWidth = maxStars * starSize + (maxStars - 1) * gap;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    for (let i = 0; i < maxStars; i++) {
      const starX = i * (starSize + gap) + starSize / 2;
      const starY = starSize / 2;
      const filled = i < stars;
      
      drawStar(g, starX, starY, starSize, filled);
    }
  }, [maxStars, stars, starSize, gap, drawStar]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
};

export default StarRating;
