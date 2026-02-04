import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Layout configuration for the game canvas
 * All measurements in pixels
 */
export interface GameLayout {
  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  
  // Cell sizing
  cellSize: number;
  
  // Grid dimensions
  gridWidth: number;
  gridHeight: number;
  gridCols: number;
  gridRows: number;
  
  // Component heights
  hudHeight: number;
  nextLineHeight: number;
  actionBarHeight: number;
  
  // Spacing
  padding: number;
  componentGap: number;
  
  // Positions (Y offsets from top of canvas)
  hudY: number;
  gridY: number;
  nextLineY: number;
  actionBarY: number;
  
  // Device info
  isMobile: boolean;
  isLandscape: boolean;
  devicePixelRatio: number;
}

interface LayoutConfig {
  // Grid configuration
  gridCols?: number;
  gridRows?: number;
  
  // Minimum/maximum cell sizes
  minCellSize?: number;
  maxCellSize?: number;
  
  // Fixed component heights (0 = auto-calculate)
  hudHeight?: number;
  actionBarHeight?: number;
  
  // React header height to subtract from viewport
  headerHeight?: number;
  
  // Padding around the canvas
  padding?: number;
  componentGap?: number;
}

const DEFAULT_CONFIG: Required<LayoutConfig> = {
  gridCols: 8,
  gridRows: 10,
  minCellSize: 32,
  maxCellSize: 60,
  hudHeight: 40,
  actionBarHeight: 56,
  headerHeight: 48,
  padding: 8,
  componentGap: 4,
};

/**
 * Hook for calculating dynamic game layout based on viewport size
 * 
 * This hook maximizes the grid size while ensuring all UI components fit
 * and touch targets meet minimum size requirements (44px per Apple HIG).
 * 
 * @param config - Optional layout configuration overrides
 * @returns GameLayout object with all calculated dimensions and positions
 */
export function useGameLayout(config: LayoutConfig = {}): GameLayout {
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 667
  );

  // Merge config with defaults
  const {
    gridCols,
    gridRows,
    minCellSize,
    maxCellSize,
    hudHeight,
    actionBarHeight,
    headerHeight,
    padding,
    componentGap,
  } = { ...DEFAULT_CONFIG, ...config };

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };

    // Also handle orientation change
    const handleOrientationChange = () => {
      // Delay to allow browser to update dimensions
      setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Visual viewport API for mobile keyboards
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Calculate layout based on current viewport
  const layout = useMemo((): GameLayout => {
    const devicePixelRatio = typeof window !== 'undefined' 
      ? window.devicePixelRatio || 1 
      : 1;
    
    const isMobile = viewportWidth < 768;
    const isLandscape = viewportWidth > viewportHeight;

    // Available space after subtracting React header
    const availableWidth = viewportWidth - padding * 2;
    const availableHeight = viewportHeight - headerHeight - padding * 2;

    // Calculate reserved heights for HUD and action bar
    const reservedHeight = hudHeight + actionBarHeight + componentGap * 3;
    
    // Space available for grid + next line preview
    const gridAreaHeight = availableHeight - reservedHeight;
    
    // Next line is 1 row
    const totalRows = gridRows + 1; // grid rows + next line preview
    
    // Calculate max cell size that fits
    const maxCellFromWidth = Math.floor(availableWidth / gridCols);
    const maxCellFromHeight = Math.floor(gridAreaHeight / totalRows);
    
    // Use the smaller of the two to ensure it fits both dimensions
    let cellSize = Math.min(maxCellFromWidth, maxCellFromHeight);
    
    // Clamp to min/max
    cellSize = Math.max(minCellSize, Math.min(maxCellSize, cellSize));
    
    // Calculate actual dimensions
    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const nextLineHeight = cellSize;
    
    // Total canvas dimensions
    const canvasWidth = gridWidth;
    const canvasHeight = hudHeight + componentGap + gridHeight + componentGap + nextLineHeight + componentGap + actionBarHeight;
    
    // Calculate Y positions for each component
    const hudY = 0;
    const gridY = hudHeight + componentGap;
    const nextLineY = gridY + gridHeight + componentGap;
    const actionBarY = nextLineY + nextLineHeight + componentGap;

    return {
      canvasWidth,
      canvasHeight,
      cellSize,
      gridWidth,
      gridHeight,
      gridCols,
      gridRows,
      hudHeight,
      nextLineHeight,
      actionBarHeight,
      padding,
      componentGap,
      hudY,
      gridY,
      nextLineY,
      actionBarY,
      isMobile,
      isLandscape,
      devicePixelRatio,
    };
  }, [
    viewportWidth,
    viewportHeight,
    gridCols,
    gridRows,
    minCellSize,
    maxCellSize,
    hudHeight,
    actionBarHeight,
    headerHeight,
    padding,
    componentGap,
  ]);

  return layout;
}

/**
 * Helper to convert grid coordinates to canvas pixel coordinates
 */
export function gridToCanvas(
  gridX: number,
  gridY: number,
  layout: GameLayout
): { x: number; y: number } {
  return {
    x: gridX * layout.cellSize,
    y: layout.gridY + gridY * layout.cellSize,
  };
}

/**
 * Helper to convert canvas pixel coordinates to grid coordinates
 */
export function canvasToGrid(
  canvasX: number,
  canvasY: number,
  layout: GameLayout
): { col: number; row: number } | null {
  // Check if within grid bounds
  if (canvasY < layout.gridY || canvasY > layout.gridY + layout.gridHeight) {
    return null;
  }
  if (canvasX < 0 || canvasX > layout.gridWidth) {
    return null;
  }

  const col = Math.floor(canvasX / layout.cellSize);
  const row = Math.floor((canvasY - layout.gridY) / layout.cellSize);

  if (col < 0 || col >= layout.gridCols || row < 0 || row >= layout.gridRows) {
    return null;
  }

  return { col, row };
}

export default useGameLayout;
