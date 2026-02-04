import { useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../themes/ThemeContext';

interface GridBackgroundProps {
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  isPlayerInDanger: boolean;
}

export const GridBackground = ({
  gridSize,
  gridWidth,
  gridHeight,
  isPlayerInDanger,
}: GridBackgroundProps) => {
  const { colors, isProcedural } = usePixiTheme();
  
  const width = gridWidth * gridSize;
  const height = gridHeight * gridSize;

  // Memoize danger zone style based on theme
  const dangerStyle = useMemo(() => ({
    color: colors.dangerZone,
    alpha: isPlayerInDanger ? colors.dangerZoneAlpha : 0,
  }), [colors, isPlayerInDanger]);

  const drawGrid = useCallback((g: PixiGraphics) => {
    g.clear();

    // Background gradient (subtle)
    if (isProcedural) {
      // Neon theme - darker background with slight gradient feel
      g.setFillStyle({ color: colors.background, alpha: 1 });
      g.rect(0, 0, width, height);
      g.fill();
      
      // Add subtle vignette effect
      g.setFillStyle({ color: 0x000000, alpha: 0.3 });
      g.rect(0, 0, width, 2);
      g.fill();
      g.rect(0, height - 2, width, 2);
      g.fill();
    }

    // Grid lines
    g.setStrokeStyle({ 
      width: 1, 
      color: colors.gridLines, 
      alpha: colors.gridLinesAlpha 
    });

    // Draw vertical lines
    for (let x = 0; x <= gridWidth; x++) {
      const xPos = x * gridSize;
      g.moveTo(xPos, 0);
      g.lineTo(xPos, height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= gridHeight; y++) {
      const yPos = y * gridSize;
      g.moveTo(0, yPos);
      g.lineTo(width, yPos);
    }

    g.stroke();

    // Neon theme: Add glow dots at intersections
    if (isProcedural) {
      g.setFillStyle({ color: colors.accent, alpha: 0.15 });
      for (let x = 0; x <= gridWidth; x++) {
        for (let y = 0; y <= gridHeight; y++) {
          g.circle(x * gridSize, y * gridSize, 2);
        }
      }
      g.fill();
    }

    // Draw danger zone overlay for top 2 rows
    if (dangerStyle.alpha > 0) {
      g.setFillStyle({ 
        color: dangerStyle.color, 
        alpha: dangerStyle.alpha 
      });
      g.rect(0, 0, width, gridSize * 2);
      g.fill();

      // Add danger line indicator
      g.setStrokeStyle({ 
        width: 2, 
        color: dangerStyle.color, 
        alpha: dangerStyle.alpha * 2 
      });
      g.moveTo(0, gridSize * 2);
      g.lineTo(width, gridSize * 2);
      g.stroke();
    }

  }, [gridSize, gridWidth, gridHeight, width, height, colors, isProcedural, dangerStyle]);

  return (
    <pixiGraphics draw={drawGrid} />
  );
};

export default GridBackground;
