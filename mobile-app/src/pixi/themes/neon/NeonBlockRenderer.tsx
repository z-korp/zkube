import { useCallback, useMemo } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme, usePerformanceSettings } from '../ThemeContext';
import { getBlockColors, lightenColor } from '../../utils/colors';

interface NeonBlockRendererProps {
  blockWidth: number; // 1-4 units
  gridSize: number;
  x: number;
  y: number;
  isDragging: boolean;
  isSelected: boolean;
  isHovered: boolean;
  alpha?: number;
}

/**
 * Renders a neon-style block using PixiJS Graphics API
 * Fully procedural - no texture files needed
 */
export const NeonBlockRenderer = ({
  blockWidth,
  gridSize,
  x,
  y,
  isDragging,
  isSelected,
  isHovered,
  alpha = 1,
}: NeonBlockRendererProps) => {
  const { themeName, colors } = usePixiTheme();
  const { glowQuality } = usePerformanceSettings();
  
  const blockColors = useMemo(() => 
    getBlockColors(themeName, blockWidth),
    [themeName, blockWidth]
  );
  
  const width = blockWidth * gridSize;
  const height = gridSize;
  
  // Calculate visual adjustments based on state
  const visualState = useMemo(() => {
    let fillAlpha = 0.85;
    let glowIntensity = 1;
    let borderAlpha = 0.4;
    let highlightAlpha = 0.3;
    
    if (isDragging) {
      fillAlpha = 0.95;
      glowIntensity = 1.5;
      borderAlpha = 0.6;
    } else if (isSelected) {
      glowIntensity = 1.3;
      borderAlpha = 0.5;
    } else if (isHovered) {
      fillAlpha = 0.9;
      glowIntensity = 1.2;
      highlightAlpha = 0.4;
    }
    
    return { fillAlpha, glowIntensity, borderAlpha, highlightAlpha };
  }, [isDragging, isSelected, isHovered]);
  
  const drawBlock = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const padding = 2;
    const radius = 6;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    
    // Main fill - rounded rectangle
    g.setFillStyle({ 
      color: blockColors.fill, 
      alpha: visualState.fillAlpha * alpha 
    });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.fill();
    
    // Outer border (white, subtle)
    g.setStrokeStyle({ 
      width: 2, 
      color: 0xFFFFFF, 
      alpha: visualState.borderAlpha * alpha 
    });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.stroke();
    
    // Inner highlight (top edge shine)
    const highlightHeight = innerHeight * 0.35;
    g.setFillStyle({ 
      color: lightenColor(blockColors.fill, 30), 
      alpha: visualState.highlightAlpha * alpha 
    });
    g.roundRect(
      padding + 3, 
      padding + 3, 
      innerWidth - 6, 
      highlightHeight, 
      radius - 2
    );
    g.fill();
    
    // Center line accent (gives depth)
    g.setStrokeStyle({ 
      width: 1, 
      color: 0xFFFFFF, 
      alpha: 0.1 * alpha 
    });
    g.moveTo(padding + 4, height / 2);
    g.lineTo(width - padding - 4, height / 2);
    g.stroke();
    
    // Bottom edge shadow
    g.setFillStyle({ 
      color: 0x000000, 
      alpha: 0.2 * alpha 
    });
    g.roundRect(
      padding + 2, 
      height - padding - 4, 
      innerWidth - 4, 
      3, 
      2
    );
    g.fill();
    
  }, [width, height, blockColors, visualState, alpha]);
  
  // For the glow effect, we'll use a filter in the parent component
  // This just renders the base block shape
  
  return (
    <pixiGraphics
      x={x}
      y={y}
      draw={drawBlock}
    />
  );
};

/**
 * Draw function for neon blocks (can be used standalone)
 */
export function drawNeonBlock(
  g: PixiGraphics,
  width: number,
  height: number,
  color: number,
  alpha: number = 1
) {
  const padding = 2;
  const radius = 6;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  
  // Main fill
  g.setFillStyle({ color, alpha: 0.85 * alpha });
  g.roundRect(padding, padding, innerWidth, innerHeight, radius);
  g.fill();
  
  // Border
  g.setStrokeStyle({ width: 2, color: 0xFFFFFF, alpha: 0.4 * alpha });
  g.roundRect(padding, padding, innerWidth, innerHeight, radius);
  g.stroke();
  
  // Highlight
  g.setFillStyle({ color: lightenColor(color, 30), alpha: 0.3 * alpha });
  g.roundRect(padding + 3, padding + 3, innerWidth - 6, innerHeight * 0.35, radius - 2);
  g.fill();
}

export default NeonBlockRenderer;
