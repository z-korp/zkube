import { useCallback } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';

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
  const width = gridWidth * gridSize;
  const height = gridHeight * gridSize;

  const drawGrid = useCallback((g: PixiGraphics) => {
    g.clear();

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

    g.stroke({ width: 1, color: 0x1E293B, alpha: 0.8 });

    // Draw danger zone overlay for top 2 rows
    if (isPlayerInDanger) {
      g.rect(0, 0, width, gridSize * 2);
      g.fill({ color: 0xEF4444, alpha: 0.15 });
    }
  }, [gridSize, gridWidth, gridHeight, width, height, isPlayerInDanger]);

  return (
    <pixiGraphics draw={drawGrid} />
  );
};

export default GridBackground;
