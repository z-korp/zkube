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

  const dangerAlpha = isPlayerInDanger ? colors.dangerZoneAlpha : 0;

  const drawGrid = useCallback((g: PixiGraphics) => {
    g.clear();

    const radius = 12;

    if (isProcedural) {
      g.roundRect(0, 0, width, height, radius);
      g.fill({ color: 0x0a0a12, alpha: 0.85 });
      g.circle(width / 2, height / 2, Math.max(width, height) * 0.6);
      g.fill({ color: colors.accent, alpha: 0.03 });
    } else {
      g.roundRect(0, 0, width, height, radius);
      g.fill({ color: 0x0a1628, alpha: 0.92 });

      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          if ((x + y) % 2 === 0) {
            g.rect(x * gridSize, y * gridSize, gridSize, gridSize);
            g.fill({ color: 0x0e1f38, alpha: 0.35 });
          }
        }
      }
    }

    g.setStrokeStyle({ width: 0.5, color: isProcedural ? 0x2a2a3a : 0x1a2d4a, alpha: 0.2 });
    for (let x = 1; x < gridWidth; x++) {
      g.moveTo(x * gridSize, 0);
      g.lineTo(x * gridSize, height);
    }
    for (let y = 1; y < gridHeight; y++) {
      g.moveTo(0, y * gridSize);
      g.lineTo(width, y * gridSize);
    }
    g.stroke();

    g.roundRect(0, 0, width, height, radius);
    g.stroke({ color: isProcedural ? colors.accent : 0x1e3a5f, width: 1.5, alpha: 0.4 });

    if (isProcedural) {
      g.circle(0, 0, 3);
      g.circle(width, 0, 3);
      g.circle(0, height, 3);
      g.circle(width, height, 3);
      g.fill({ color: colors.accent, alpha: 0.4 });
    }

    // Danger zone (top 2 rows)
    if (dangerAlpha > 0) {
      g.rect(0, 0, width, gridSize * 2);
      g.fill({ color: colors.dangerZone, alpha: dangerAlpha });
      g.moveTo(0, gridSize * 2);
      g.lineTo(width, gridSize * 2);
      g.stroke({ color: colors.dangerZone, width: 2, alpha: dangerAlpha * 2 });
    }

  }, [gridSize, gridWidth, gridHeight, width, height, colors, isProcedural, dangerAlpha]);

  return (
    <pixiGraphics draw={drawGrid} />
  );
};

export default GridBackground;
