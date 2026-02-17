import { useState, useEffect, useMemo } from 'react';
import { nativePaddingTop, nativePaddingBottom } from '@/utils/capacitorUtils';

export interface FullscreenLayout {
  screenWidth: number;
  screenHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;

  isMobile: boolean;
  isLandscape: boolean;
  devicePixelRatio: number;

  topBarHeight: number;
  topBarY: number;

  statsBarY: number;
  statsBarHeight: number;

  progressBarY: number;
  progressBarHeight: number;

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

  gridCols: number;
  gridRows: number;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  gridX: number;
  gridY: number;

  framePad: number;

  nextLineHeight: number;
  nextLineY: number;

  actionBarHeight: number;
  actionBarY: number;

  showSidePanels: boolean;
  sidePanelWidth: number;
  leftPanelX: number;
  rightPanelX: number;
  sidePanelY: number;
  sidePanelHeight: number;

  uiScale: number;
  padding: number;
  pillGap: number;
}

interface LayoutConfig {
  gridCols?: number;
  gridRows?: number;
  minCellSize?: number;
  maxCellSize?: number;
  baseStatsBarHeight?: number;
  baseProgressBarHeight?: number;
  baseActionBarHeight?: number;
}

const DEFAULT_CONFIG = {
  gridCols: 8,
  gridRows: 10,
  minCellSize: 28,
  maxCellSize: 80,
  baseStatsBarHeight: 32,
  baseProgressBarHeight: 26,
  baseActionBarHeight: 80,
};

const FRAME_PAD = 6;

const readSafeInset = (name: '--safe-area-top' | '--safe-area-bottom'): number => {
  if (typeof window === 'undefined') return 0;
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : 0;
};

const toPxNumber = (value: string): number => {
  const px = parseFloat(value);
  return Number.isFinite(px) ? px : 0;
};

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
    baseStatsBarHeight,
    baseProgressBarHeight,
    baseActionBarHeight,
  } = { ...DEFAULT_CONFIG, ...config };

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    const handleOrientationChange = () => setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

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

  const layout = useMemo((): FullscreenLayout => {
    const devicePixelRatio = typeof window !== 'undefined'
      ? Math.min(window.devicePixelRatio || 1, 2)
      : 1;

    const safeAreaTop = Math.max(readSafeInset('--safe-area-top'), toPxNumber(nativePaddingTop));
    const safeAreaBottom = Math.max(readSafeInset('--safe-area-bottom'), toPxNumber(nativePaddingBottom));

    const isMobile = screenWidth < 768;
    const isLandscape = screenWidth > screenHeight;

    const baseWidth = 375;
    const uiScale = Math.min(1.5, Math.max(0.8, screenWidth / baseWidth));

    const padding = Math.round(6 * uiScale);
    const pillGap = Math.round(8 * uiScale);
    const framePad = FRAME_PAD;

    const statsBarHeight = Math.round(baseStatsBarHeight * uiScale);
    const progressBarHeight = Math.round(baseProgressBarHeight * uiScale);
    const barGap = Math.round(4 * uiScale);
    const actionBarHeight = Math.round(baseActionBarHeight * uiScale);
    const hudBottom = Math.round(6 * uiScale);

    const topBarY = 0;
    const topBarHeight = Math.round((isMobile ? 56 : 60) * uiScale) + safeAreaTop;
    const statsBarY = Math.round(6 * uiScale) + safeAreaTop;
    const progressBarY = statsBarY + statsBarHeight + barGap;

    const hudTotalHeight = progressBarY + progressBarHeight + hudBottom;

    const infoAreaY = statsBarY;
    const infoAreaHeight = statsBarHeight + barGap + progressBarHeight;

    const nextLineGap = 4;
    const usedHeight = hudTotalHeight + actionBarHeight + framePad * 2 + nextLineGap + safeAreaBottom;
    const availableHeight = screenHeight - usedHeight;

    const horizontalPadding = (padding + framePad) * 2;
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
    const gridY = hudTotalHeight + framePad;
    const nextLineY = gridY + gridHeight + nextLineGap;

    const actionBarY = screenHeight - actionBarHeight - safeAreaBottom;

    const levelBadgeWidth = Math.round(Math.min(200, gridWidth * 0.55));
    const levelBadgeX = Math.round((screenWidth - levelBadgeWidth) / 2);
    const levelBadgeY = statsBarY;
    const levelBadgeHeight = statsBarHeight;

    const pillWidth = Math.round((gridWidth - pillGap) / 2);
    const pillHeight = statsBarHeight;
    const pillY = statsBarY;
    const scorePillX = gridX;
    const movesPillX = gridX + pillWidth + pillGap;

    const showSidePanels = !isMobile && screenWidth >= 900;
    const sidePanelWidth = showSidePanels ? Math.round(100 * uiScale) : 0;
    const leftPanelX = gridX - sidePanelWidth - padding;
    const rightPanelX = gridX + gridWidth + padding;
    const sidePanelY = gridY;
    const sidePanelHeight = gridHeight + nextLineHeight + nextLineGap;

    const levelDisplayHeight = 0;
    const levelDisplayY = statsBarY;
    const showMobileHud = false;
    const mobileHudHeight = 0;
    const mobileHudY = statsBarY;

    return {
      screenWidth,
      screenHeight,
      safeAreaTop,
      safeAreaBottom,
      isMobile,
      isLandscape,
      devicePixelRatio,
      topBarHeight,
      topBarY,
      statsBarY,
      statsBarHeight,
      progressBarY,
      progressBarHeight,
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
      framePad,
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
  }, [screenWidth, screenHeight, gridCols, gridRows, minCellSize, maxCellSize, baseStatsBarHeight, baseProgressBarHeight, baseActionBarHeight]);

  return layout;
}

export default useFullscreenLayout;
