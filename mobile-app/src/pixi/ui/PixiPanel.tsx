/**
 * PixiPanel - Tiki-themed panel component
 * 
 * Uses 9-slice sprite for scalable panel backgrounds.
 * Supports different panel styles (wood, dark, leaf, glass).
 * Can contain child components.
 */

import { useMemo, useCallback, type ReactNode } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { FONT_BOLD, type ThemeId } from '../utils/colors';
import { PANEL_BORDERS, PANEL_TYPE_TO_ASSET, type PanelType } from '../assets/catalog';
import { resolveAsset } from '../assets/resolver';
import { useTextureWithFallback } from '../hooks/useTexture';
import { usePixiTheme } from '../themes/ThemeContext';

export interface PixiPanelProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Panel width */
  width: number;
  /** Panel height */
  height: number;
  /** Panel style variant */
  variant?: PanelType;
  /** Panel alpha/opacity */
  alpha?: number;
  /** Anchor point (0-1, default: 0 = top-left) */
  anchor?: number;
  /** Content padding inside panel */
  padding?: number;
  /** Child elements */
  children?: ReactNode;
  /** Whether panel is visible */
  visible?: boolean;
}

export function PixiPanel({
  x = 0,
  y = 0,
  width,
  height,
  variant = 'wood',
  alpha = 1,
  anchor = 0,
  padding = 16,
  children,
  visible = true,
}: PixiPanelProps) {
  const { themeName } = usePixiTheme();
  const candidates = useMemo(() => {
    const assetId = PANEL_TYPE_TO_ASSET[variant];
    if (!assetId) return null;
    return resolveAsset(themeName as ThemeId, assetId);
  }, [variant, themeName]);
  const texture = useTextureWithFallback(candidates);

  // Calculate anchor offset
  const anchorOffset = useMemo(() => ({
    x: -width * anchor,
    y: -height * anchor,
  }), [width, height, anchor]);

  // Content area (inside padding)
  const contentArea = useMemo(() => ({
    x: padding,
    y: padding,
    width: width - padding * 2,
    height: height - padding * 2,
  }), [width, height, padding]);

  if (!visible) return null;

  return (
    <pixiContainer
      x={x + anchorOffset.x}
      y={y + anchorOffset.y}
      alpha={alpha}
    >
      {/* 9-slice panel background */}
      {texture && (
        <pixiNineSliceSprite
          texture={texture}
          leftWidth={PANEL_BORDERS.left}
          topHeight={PANEL_BORDERS.top}
          rightWidth={PANEL_BORDERS.right}
          bottomHeight={PANEL_BORDERS.bottom}
          width={width}
          height={height}
          roundPixels={true}
        />
      )}

      {/* Content container (with padding offset) */}
      <pixiContainer x={contentArea.x} y={contentArea.y}>
        {children}
      </pixiContainer>
    </pixiContainer>
  );
}

/**
 * PixiPanelHeader - Title bar for panels
 */
export interface PixiPanelHeaderProps {
  /** Header text */
  title: string;
  /** Width of the header (usually matches panel width - padding) */
  width: number;
  /** Font size */
  fontSize?: number;
  /** Text color */
  color?: number;
}

export function PixiPanelHeader({
  title,
  width,
  fontSize = 24,
  color = 0xFFFFFF,
}: PixiPanelHeaderProps) {
  const headerStyle = useMemo(() => ({
    fontFamily: FONT_BOLD,
    fontSize,
    fill: color,
    align: 'center' as const,
    dropShadow: {
      alpha: 0.6,
      angle: Math.PI / 4,
      blur: 3,
      distance: 3,
      color: 0x000000,
    },
  }), [fontSize, color]);

  return (
    <pixiText
      text={title}
      x={width / 2}
      y={0}
      anchor={{ x: 0.5, y: 0 }}
      style={headerStyle}
      eventMode="none"
    />
  );
}

/**
 * PixiPanelDivider - Horizontal line divider
 */
export interface PixiPanelDividerProps {
  /** Y position */
  y: number;
  /** Width of divider */
  width: number;
  /** Color */
  color?: number;
  /** Alpha */
  alpha?: number;
}

export function PixiPanelDivider({
  y,
  width,
  color = 0xFFFFFF,
  alpha = 0.2,
}: PixiPanelDividerProps) {
  const drawDivider = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setStrokeStyle({ width: 1, color, alpha });
    g.moveTo(0, 0);
    g.lineTo(width, 0);
    g.stroke();
  }, [width, color, alpha]);

  return (
    <pixiGraphics y={y} draw={drawDivider} />
  );
}

export default PixiPanel;
