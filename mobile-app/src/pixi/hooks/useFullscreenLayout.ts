import { useState, useEffect, useMemo } from 'react';

/**
 * Layout for fullscreen PixiJS game:
 * TOP BAR (36px) → INFO BAR (28px) → GRID (maximized) → NEXT LINE → ACTION BAR (56px)
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

  infoAreaY: number;
  infoAreaHeight: number;

  levelBadgeX: number;
  levelBadgeY: number;
  levelBadgeWidth: number;
  levelBadgeHeight: number;

  scorePillX: number;
  scorePillY: number;
  scorePillWidth: number;
  scorePillHeight: number;

  movesPillX: number;
  movesPillY: number;
  movesPillWidth: number;
  movesPillHeight: number;

  levelDisplayHeight: number;
  levelDisplayY: number;

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

    const topBarHeight = 36;
    const actionBarHeight = 56;

    const infoAreaHeight = Math.round(30 * uiScale);

    const topBarY = 0;
    const infoAreaY = topBarHeight;

    const nextLineGap = 4;
    const usedHeight = topBarHeight + infoAreaHeight + actionBarHeight + padding + nextLineGap;
    const availableHeight = screenHeight - usedHeight;

    const horizontalPadding = padding * 2;
    const availableWidth = screenWidth - horizontalPadding;

    const totalRows = gridRows + 1;
    const maxCellFromWidth = Math.floor(availableWidth / gridCols);
    const maxCellFromHeight = Math.floor(availableHeight / totalRows);

    let cellSize = Math.min(maxCellFromWidth, maxCellFromHeight);
    cellSize = Math.max(minCellSize, Math.min(maxCellSize, cellSize));

    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const nextLineHeight = cellSize;

    const gridX = Math.round((screenWidth - gridWidth) / 2);
    const gridY = infoAreaY + infoAreaHeight + Math.round(2 * uiScale);
    const nextLineY = gridY + gridHeight + nextLineGap;

    const actionBarY = screenHeight - actionBarHeight;

    const levelBadgeWidth = Math.round(Math.min(200, gridWidth * 0.55));
    const levelBadgeX = Math.round((screenWidth - levelBadgeWidth) / 2);
    const levelBadgeY = infoAreaY;
    const levelBadgeHeight = infoAreaHeight;

    const pillWidth = Math.round((gridWidth - pillGap) / 2);
    const pillHeight = infoAreaHeight;
    const pillY = infoAreaY;
    const scorePillX = gridX;
    const movesPillX = gridX + pillWidth + pillGap;

    const showSidePanels = !isMobile && screenWidth >= 900;
    const sidePanelWidth = showSidePanels ? Math.round(100 * uiScale) : 0;
    const leftPanelX = gridX - sidePanelWidth - padding;
    const rightPanelX = gridX + gridWidth + padding;
    const sidePanelY = gridY;
    const sidePanelHeight = gridHeight + nextLineHeight + nextLineGap;

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
