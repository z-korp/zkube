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

    // === BACKGROUND ===
    // Semi-transparent so the theme background shows through
    if (isProcedural) {
      // Neon theme - dark with subtle radial gradient effect
      g.rect(0, 0, width, height);
      g.fill({ color: 0x0a0a12, alpha: 0.85 });
      
      // Center glow
      const centerX = width / 2;
      const centerY = height / 2;
      g.circle(centerX, centerY, Math.max(width, height) * 0.6);
      g.fill({ color: colors.accent, alpha: 0.03 });
      
      // Top edge shadow
      g.rect(0, 0, width, gridSize * 2);
      g.fill({ color: 0x000000, alpha: 0.15 });
    } else {
      // Tiki theme - semi-transparent dark overlay so background shows
      g.rect(0, 0, width, height);
      g.fill({ color: 0x0a1525, alpha: 0.75 });
      
      // Subtle pattern overlay (checkerboard effect)
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          if ((x + y) % 2 === 0) {
            g.rect(x * gridSize, y * gridSize, gridSize, gridSize);
            g.fill({ color: 0x102030, alpha: 0.3 });
          }
        }
      }
      
      // Vignette effect - darker edges
      g.rect(0, 0, width, gridSize);
      g.fill({ color: 0x000000, alpha: 0.15 });
      g.rect(0, height - gridSize, width, gridSize);
      g.fill({ color: 0x000000, alpha: 0.1 });
    }

    // === GRID LINES ===
    // Main grid lines - subtle
    g.setStrokeStyle({ 
      width: 1, 
      color: isProcedural ? 0x2a2a3a : 0x1e3a5a, 
      alpha: 0.4 
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

    // === BORDER ===
    // Outer border - more prominent
    const borderRadius = 4;
    g.roundRect(0, 0, width, height, borderRadius);
    g.stroke({ 
      color: isProcedural ? colors.accent : 0x3b82f6, 
      width: 2, 
      alpha: 0.5 
    });

    // Inner glow border
    g.roundRect(2, 2, width - 4, height - 4, borderRadius - 1);
    g.stroke({ 
      color: isProcedural ? colors.accent : 0x60a5fa, 
      width: 1, 
      alpha: 0.2 
    });

    // === CORNER ACCENTS ===
    const cornerSize = 12;
    const cornerColor = isProcedural ? colors.accent : 0x3b82f6;
    const cornerAlpha = 0.6;

    // Top-left corner
    g.moveTo(0, cornerSize);
    g.lineTo(0, 0);
    g.lineTo(cornerSize, 0);
    g.stroke({ color: cornerColor, width: 2, alpha: cornerAlpha });

    // Top-right corner
    g.moveTo(width - cornerSize, 0);
    g.lineTo(width, 0);
    g.lineTo(width, cornerSize);
    g.stroke({ color: cornerColor, width: 2, alpha: cornerAlpha });

    // Bottom-left corner
    g.moveTo(0, height - cornerSize);
    g.lineTo(0, height);
    g.lineTo(cornerSize, height);
    g.stroke({ color: cornerColor, width: 2, alpha: cornerAlpha });

    // Bottom-right corner
    g.moveTo(width - cornerSize, height);
    g.lineTo(width, height);
    g.lineTo(width, height - cornerSize);
    g.stroke({ color: cornerColor, width: 2, alpha: cornerAlpha });

    // === NEON THEME EXTRAS ===
    if (isProcedural) {
      // Glow dots at corners
      g.circle(0, 0, 3);
      g.circle(width, 0, 3);
      g.circle(0, height, 3);
      g.circle(width, height, 3);
      g.fill({ color: colors.accent, alpha: 0.4 });
      
      // Subtle scanlines effect
      for (let y = 0; y < gridHeight * 2; y++) {
        if (y % 2 === 0) {
          g.moveTo(0, y * (gridSize / 2));
          g.lineTo(width, y * (gridSize / 2));
        }
      }
      g.stroke({ color: 0xffffff, width: 1, alpha: 0.02 });
    }

    // === DANGER ZONE ===
    if (dangerStyle.alpha > 0) {
      // Danger overlay for top 2 rows
      g.rect(0, 0, width, gridSize * 2);
      g.fill({ color: dangerStyle.color, alpha: dangerStyle.alpha });

      // Pulsing danger line
      g.moveTo(0, gridSize * 2);
      g.lineTo(width, gridSize * 2);
      g.stroke({ color: dangerStyle.color, width: 2, alpha: dangerStyle.alpha * 2 });
      
      // Warning triangles at edges
      const triSize = 8;
      g.poly([
        width / 4 - triSize, gridSize * 2,
        width / 4, gridSize * 2 - triSize,
        width / 4 + triSize, gridSize * 2,
      ]);
      g.poly([
        width * 3 / 4 - triSize, gridSize * 2,
        width * 3 / 4, gridSize * 2 - triSize,
        width * 3 / 4 + triSize, gridSize * 2,
      ]);
      g.fill({ color: dangerStyle.color, alpha: dangerStyle.alpha * 1.5 });
    }

  }, [gridSize, gridWidth, gridHeight, width, height, colors, isProcedural, dangerStyle]);

  return (
    <pixiGraphics draw={drawGrid} />
  );
};

export default GridBackground;
