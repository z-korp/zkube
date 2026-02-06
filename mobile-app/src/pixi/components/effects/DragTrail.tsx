import { useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';
import { getBlockColors, lightenColor } from '../../utils/colors';

interface TrailPosition {
  x: number;
  y: number;
  alpha: number;
}

interface DragTrailProps {
  positions: TrailPosition[];
  blockWidth: number;
  gridSize: number;
}

/**
 * Renders a trail of ghost blocks following the dragged block
 */
export const DragTrail = ({
  positions,
  blockWidth,
  gridSize,
}: DragTrailProps) => {
  const { themeName } = usePixiTheme();
  const { enableTrails } = usePerformanceSettings();
  
  const blockColors = useMemo(() => 
    getBlockColors(themeName, blockWidth),
    [themeName, blockWidth]
  );
  
  const width = blockWidth * gridSize;
  const height = gridSize;

  
  if (!enableTrails || positions.length === 0) {
    return null;
  }

  return (
    <>
      {positions.map((pos, index) => (
        <TrailGhost
          key={index}
          x={pos.x}
          y={pos.y}
          width={width}
          height={height}
          alpha={pos.alpha}
          color={blockColors.glow}
        />
      ))}
    </>
  );
};

interface TrailGhostProps {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  color: number;
}

const TrailGhost = ({ x, y, width, height, alpha, color }: TrailGhostProps) => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const padding = 2;
    const radius = 6;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    
    // Ghost fill
    g.setFillStyle({ color, alpha: alpha * 0.3 });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.fill();
    
    // Ghost border
    g.setStrokeStyle({ width: 1, color: 0xFFFFFF, alpha: alpha * 0.2 });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.stroke();
    
  }, [width, height, alpha, color]);

  return <pixiGraphics x={x} y={y} draw={draw} />;
};

/**
 * Hook to manage trail positions
 */
export function useDragTrail(maxTrailLength: number = 5) {
  const positions: TrailPosition[] = [];
  
  const addPosition = (x: number, y: number) => {
    // Add new position
    positions.unshift({ x, y, alpha: 1 });
    
    // Update alphas and remove old positions
    for (let i = 0; i < positions.length; i++) {
      positions[i].alpha = 1 - (i / maxTrailLength);
    }
    
    // Keep only maxTrailLength positions
    while (positions.length > maxTrailLength) {
      positions.pop();
    }
  };
  
  const clearTrail = () => {
    positions.length = 0;
  };
  
  return { positions, addPosition, clearTrail };
}

export default DragTrail;
