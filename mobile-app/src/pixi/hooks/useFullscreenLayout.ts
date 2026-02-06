import { useState, useEffect, useMemo } from 'react';

/**
 * Layout configuration for fullscreen PixiJS game
 * Polished mobile-first layout inspired by Tetris Combo
 *
 * Visual structure (top to bottom):
 * ┌───────────────────────────────┐
 * │     TOP BAR (40px)            │  Home / Cubes / Menu
 * ├───────────────────────────────┤
 * │     INFO AREA (~80px)         │  Level badge + Score/Moves pills
 * ├───────────────────────────────┤
 * │                               │
 * │     GAME GRID (maximized)     │  8×10 block grid
 * │                               │
 * ├───────────────────────────────┤
 * │     NEXT LINE (1 row)         │
 * ├───────────────────────────────┤
 * │     ACTION BAR (60px)         │  Bonus buttons + combo + surrender
 * └───────────────────────────────┘
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

  // Info area (level badge + score/moves pills)
  infoAreaY: number;
  infoAreaHeight: number;

  // Level badge (centered, inside info area)
  levelBadgeX: number;
  levelBadgeY: number;
  levelBadgeWidth: number;
  levelBadgeHeight: number;

  // Score pill (left, below level badge)
  scorePillX: number;
  scorePillY: number;
  scorePillWidth: number;
  scorePillHeight: number;

  // Moves pill (right, below level badge)
  movesPillX: number;
  movesPillY: number;
  movesPillWidth: number;
  movesPillHeight: number;

  // Legacy: Level display (for backward compat)
  levelDisplayHeight: number;
  levelDisplayY: number;

  // Legacy: Mobile HUD (for backward compat)
  mobileHudHeight: number;
  mobileHudY: number;
  showMobileHud: boolean;

  // Grid configuration
  gridCols: number;
  gridRows: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gridX: number;
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

  // Pill gap (space between score/moves pills)
  pillGap: number;
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
 * Hook for fullscreen polished game layout
 * Maximizes grid area while keeping HUD elements clean and readable
 */
export function useFullscreenLayout(config: LayoutConfig = {}): FullscreenLayout {
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [screenHeight, setScreenHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 812
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
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;

    const isMobile = screenWidth < 768;
    const isLandscape = screenWidth > screenHeight;

    // UI scale based on screen width
    const baseWidth = 375;
    const uiScale = Math.min(1.5, Math.max(0.8, screenWidth / baseWidth));

    // Padding
    const padding = Math.round(10 * uiScale);
    const pillGap = Math.round(12 * uiScale);

    // === FIXED HEIGHTS ===
    const topBarHeight = 40;
    const actionBarHeight = 60;

    // Info area: level badge row + score/moves pills row
    const levelBadgeHeight = Math.round(42 * uiScale);
    const pillHeight = Math.round(36 * uiScale);
    const infoGapV = Math.round(6 * uiScale);
    const infoAreaHeight = levelBadgeHeight + infoGapV + pillHeight + Math.round(4 * uiScale);

    // === VERTICAL POSITIONING ===
    const topBarY = 0;
    const infoAreaY = topBarHeight;

    // === CALCULATE GRID SIZE ===
    const usedHeight = topBarHeight + infoAreaHeight + actionBarHeight + padding;
    const availableHeight = screenHeight - usedHeight;

    const horizontalPadding = padding * 2;
    const availableWidth = screenWidth - horizontalPadding;

    const totalRows = gridRows + 1; // +1 for next line preview
    const maxCellFromWidth = Math.floor(availableWidth / gridCols);
    const maxCellFromHeight = Math.floor((availableHeight - 4) / totalRows);

    let cellSize = Math.min(maxCellFromWidth, maxCellFromHeight);
    cellSize = Math.max(minCellSize, Math.min(maxCellSize, cellSize));

    // Grid dimensions
    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const nextLineHeight = cellSize;

    // Center grid horizontally
    const gridX = Math.round((screenWidth - gridWidth) / 2);

    // Grid starts after info area
    const gridY = infoAreaY + infoAreaHeight;
    const nextLineY = gridY + gridHeight + 4;

    // Action bar at bottom
    const actionBarY = screenHeight - actionBarHeight;

    // === INFO AREA POSITIONING ===
    const levelBadgeWidth = Math.round(Math.min(200, gridWidth * 0.55));
    const levelBadgeX = Math.round((screenWidth - levelBadgeWidth) / 2);
    const levelBadgeY = infoAreaY + Math.round(2 * uiScale);

    // Score/Moves pills: below level badge, aligned with grid edges
    const pillWidth = Math.round((gridWidth - pillGap) / 2);
    const pillY = levelBadgeY + levelBadgeHeight + infoGapV;
    const scorePillX = gridX;
    const movesPillX = gridX + pillWidth + pillGap;

    // === SIDE PANELS (desktop only) ===
    const showSidePanels = !isMobile && screenWidth >= 900;
    const sidePanelWidth = showSidePanels ? Math.round(100 * uiScale) : 0;
    const leftPanelX = gridX - sidePanelWidth - padding;
    const rightPanelX = gridX + gridWidth + padding;
    const sidePanelY = gridY;
    const sidePanelHeight = gridHeight + nextLineHeight + 4;

    // === LEGACY COMPAT ===
    const levelDisplayHeight = 0;
    const levelDisplayY = infoAreaY;
    const showMobileHud = false;
    const mobileHudHeight = 0;
    const mobileHudY = infoAreaY;

    return {
      screenWidth,
      screenHeight,
      isMobile,
      isLandscape,
      devicePixelRatio,
      topBarHeight,
      topBarY,
      infoAreaY,
      infoAreaHeight,
      levelBadgeX,
      levelBadgeY,
      levelBadgeWidth,
      levelBadgeHeight,
      scorePillX,
      scorePillY: pillY,
      scorePillWidth: pillWidth,
      scorePillHeight: pillHeight,
      movesPillX,
      movesPillY: pillY,
      movesPillWidth: pillWidth,
      movesPillHeight: pillHeight,
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
      pillGap,
    };
  }, [screenWidth, screenHeight, gridCols, gridRows, minCellSize, maxCellSize]);

  return layout;
}

export default useFullscreenLayout;
