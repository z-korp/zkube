import { useState, useEffect, useMemo } from 'react';

/**
 * Layout configuration for fullscreen PixiJS game
 * Candy Crush style - entire screen is the game
 */
export interface FullscreenLayout {
  // Viewport dimensions
  screenWidth: number;
  screenHeight: number;
  
  // Device info
  isMobile: boolean;
  isLandscape: boolean;
  devicePixelRatio: number;
  
  // Top bar
  topBarHeight: number;
  topBarY: number;
  
  // Level display (above grid)
  levelDisplayHeight: number;
  levelDisplayY: number;
  
  // Mobile HUD (score, moves, combo - below level display)
  mobileHudHeight: number;
  mobileHudY: number;
  showMobileHud: boolean;
  
  // Grid configuration
  gridCols: number;
  gridRows: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gridX: number;  // Centered horizontally
  gridY: number;
  
  // Next line preview
  nextLineHeight: number;
  nextLineY: number;
  
  // Action bar (bottom)
  actionBarHeight: number;
  actionBarY: number;
  
  // Side panels (desktop only)
  showSidePanels: boolean;
  sidePanelWidth: number;
  leftPanelX: number;
  rightPanelX: number;
  sidePanelY: number;
  sidePanelHeight: number;
  
  // UI scaling factor
  uiScale: number;
  
  // Padding
  padding: number;
}

interface LayoutConfig {
  gridCols?: number;
  gridRows?: number;
  minCellSize?: number;
  maxCellSize?: number;
}

const DEFAULT_CONFIG = {
  gridCols: 8,
  gridRows: 10,
  minCellSize: 28,
  maxCellSize: 56,
};

/**
 * Hook for fullscreen Candy Crush-style layout
 * Calculates all dimensions based on viewport size
 */
export function useFullscreenLayout(config: LayoutConfig = {}): FullscreenLayout {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [screenHeight, setScreenHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 667
  );

  const {
    gridCols,
    gridRows,
    minCellSize,
    maxCellSize,
  } = { ...DEFAULT_CONFIG, ...config };

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 100));
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  const layout = useMemo((): FullscreenLayout => {
    const devicePixelRatio = typeof window !== 'undefined' 
      ? Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x for performance
      : 1;
    
    const isMobile = screenWidth < 768;
    const isLandscape = screenWidth > screenHeight;
    
    // UI scale based on screen size
    const baseWidth = 375; // iPhone SE width
    const uiScale = Math.min(1.5, Math.max(0.8, screenWidth / baseWidth));
    
    // Padding scales with screen
    const padding = Math.round(8 * uiScale);
    
    // Fixed heights (scaled)
    const topBarHeight = Math.round(isMobile ? 48 : 56);
    const levelDisplayHeight = Math.round(isMobile ? 36 : 44);
    const actionBarHeight = Math.round(isMobile ? 56 : 64);
    
    // Mobile HUD for score/moves/combo (only on mobile, hidden on desktop where side panels show)
    const showMobileHud = isMobile || screenWidth < 900;
    const mobileHudHeight = showMobileHud ? Math.round(32 * uiScale) : 0;
    
    // Side panels only on desktop
    const showSidePanels = !isMobile && screenWidth >= 900;
    const sidePanelWidth = showSidePanels ? Math.round(100 * uiScale) : 0;
    
    // Calculate available space for grid
    const verticalPadding = padding * 2;
    const horizontalPadding = padding * 2 + (showSidePanels ? sidePanelWidth * 2 + padding * 2 : 0);
    
    const availableWidth = screenWidth - horizontalPadding;
    const availableHeight = screenHeight - topBarHeight - levelDisplayHeight - mobileHudHeight - actionBarHeight - verticalPadding;
    
    // Calculate cell size (grid + next line = gridRows + 1)
    const totalRows = gridRows + 1; // +1 for next line preview
    const maxCellFromWidth = Math.floor(availableWidth / gridCols);
    const maxCellFromHeight = Math.floor(availableHeight / totalRows);
    
    let cellSize = Math.min(maxCellFromWidth, maxCellFromHeight);
    cellSize = Math.max(minCellSize, Math.min(maxCellSize, cellSize));
    
    // Grid dimensions
    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const nextLineHeight = cellSize;
    
    // Center grid horizontally
    const totalGameWidth = gridWidth;
    const gridX = Math.round((screenWidth - totalGameWidth) / 2);
    
    // Vertical positioning
    const topBarY = 0;
    const levelDisplayY = topBarHeight;
    const mobileHudY = levelDisplayY + levelDisplayHeight;
    const gridY = mobileHudY + mobileHudHeight + padding;
    const nextLineY = gridY + gridHeight + 4;
    const actionBarY = screenHeight - actionBarHeight;
    
    // Side panel positioning
    const leftPanelX = gridX - sidePanelWidth - padding;
    const rightPanelX = gridX + gridWidth + padding;
    const sidePanelY = gridY;
    const sidePanelHeight = gridHeight + nextLineHeight + 4;

    return {
      screenWidth,
      screenHeight,
      isMobile,
      isLandscape,
      devicePixelRatio,
      topBarHeight,
      topBarY,
      levelDisplayHeight,
      levelDisplayY,
      mobileHudHeight,
      mobileHudY,
      showMobileHud,
      gridCols,
      gridRows,
      cellSize,
      gridWidth,
      gridHeight,
      gridX,
      gridY,
      nextLineHeight,
      nextLineY,
      actionBarHeight,
      actionBarY,
      showSidePanels,
      sidePanelWidth,
      leftPanelX,
      rightPanelX,
      sidePanelY,
      sidePanelHeight,
      uiScale,
      padding,
    };
  }, [screenWidth, screenHeight, gridCols, gridRows, minCellSize, maxCellSize]);

  return layout;
}

export default useFullscreenLayout;
