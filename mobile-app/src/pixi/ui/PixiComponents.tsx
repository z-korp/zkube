/**
 * Supporting PixiJS UI Components
 * 
 * - ProgressBar: Animated progress bar with label
 * - StarRating: 1-3 star rating display
 * - Badge: Notification count badge
 * - PixiIcon: Icon sprite with tinting
 * - PixiLabel: Styled text label
 */

import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { AssetId, ICON_TYPE_TO_ASSET, type IconType } from '../assets/catalog';
import { resolveAsset } from '../assets/resolver';
import { FONT_BOLD, FONT_BODY, type ThemeId } from '../utils/colors';
import { useTextureWithFallback } from '../hooks/useTexture';
import { usePixiTheme } from '../themes/ThemeContext';

// ============================================================================
// PROGRESS BAR
// ============================================================================

export interface PixiProgressBarProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Bar width */
  width: number;
  /** Bar height */
  height?: number;
  /** Progress value (0-1) */
  progress: number;
  /** Background color */
  backgroundColor?: number;
  /** Fill color */
  fillColor?: number;
  /** Secondary fill color for gradient effect */
  fillColorSecondary?: number;
  /** Border color */
  borderColor?: number;
  /** Border width */
  borderWidth?: number;
  /** Corner radius */
  radius?: number;
  /** Whether to show percentage text */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
  /** Label color */
  labelColor?: number;
}

export function PixiProgressBar({
  x = 0,
  y = 0,
  width,
  height = 20,
  progress,
  backgroundColor = 0x1e293b,
  fillColor = 0x4ADE80,
  fillColorSecondary: _fillColorSecondary,
  borderColor = 0xFFFFFF,
  borderWidth = 2,
  radius = 6,
  showLabel = false,
  label,
  labelColor = 0xFFFFFF,
}: PixiProgressBarProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const fillWidth = Math.max(0, (width - borderWidth * 2) * clampedProgress);

  const drawBar = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.setFillStyle({ color: backgroundColor });
    g.roundRect(0, 0, width, height, radius);
    g.fill();
    
    // Fill
    if (fillWidth > 0) {
      g.setFillStyle({ color: fillColor });
      g.roundRect(
        borderWidth, 
        borderWidth, 
        fillWidth, 
        height - borderWidth * 2, 
        Math.max(0, radius - borderWidth)
      );
      g.fill();
      
      // Highlight on fill
      g.setFillStyle({ color: 0xFFFFFF, alpha: 0.2 });
      g.roundRect(
        borderWidth + 2,
        borderWidth + 1,
        Math.max(0, fillWidth - 4),
        (height - borderWidth * 2) / 3,
        2
      );
      g.fill();
    }
    
    // Border
    g.setStrokeStyle({ width: borderWidth, color: borderColor, alpha: 0.5 });
    g.roundRect(0, 0, width, height, radius);
    g.stroke();
  }, [width, height, fillWidth, backgroundColor, fillColor, borderColor, borderWidth, radius]);

  const displayLabel = label ?? `${Math.round(clampedProgress * 100)}%`;
  const labelStyle = useMemo(() => ({
    fontFamily: FONT_BOLD,
    fontSize: Math.max(10, height - 6),
    fill: labelColor,
  }), [height, labelColor]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBar} />
      {showLabel && (
        <pixiText
          text={displayLabel}
          x={width / 2}
          y={height / 2}
          anchor={0.5}
          style={labelStyle}
          eventMode="none"
        />
      )}
    </pixiContainer>
  );
}

// ============================================================================
// STAR RATING
// ============================================================================

export interface PixiStarRatingProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Number of filled stars (0-3) */
  rating: number;
  /** Maximum stars */
  maxStars?: number;
  /** Star size */
  size?: number;
  /** Gap between stars */
  gap?: number;
  /** Whether to center the rating */
  centered?: boolean;
}

export function PixiStarRating({
  x = 0,
  y = 0,
  rating,
  maxStars = 3,
  size = 32,
  gap = 4,
  centered = false,
}: PixiStarRatingProps) {
  const { themeName } = usePixiTheme();
  const filledCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.IconStarFilled),
    [themeName],
  );
  const emptyCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.IconStarEmpty),
    [themeName],
  );
  const filledTexture = useTextureWithFallback(filledCandidates);
  const emptyTexture = useTextureWithFallback(emptyCandidates);

  const totalWidth = maxStars * size + (maxStars - 1) * gap;
  const offsetX = centered ? -totalWidth / 2 : 0;

  if (!filledTexture || !emptyTexture) return null;

  return (
    <pixiContainer x={x} y={y}>
      {Array.from({ length: maxStars }, (_, i) => (
        <pixiSprite
          key={i}
          texture={i < rating ? filledTexture : emptyTexture}
          x={offsetX + i * (size + gap)}
          width={size}
          height={size}
          anchor={{ x: 0, y: 0.5 }}
        />
      ))}
    </pixiContainer>
  );
}

// ============================================================================
// BADGE (Notification Count)
// ============================================================================

export interface PixiBadgeProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Badge count (hidden if 0) */
  count: number;
  /** Max count to display (shows "9+" if exceeded) */
  maxCount?: number;
  /** Badge size */
  size?: number;
  /** Background color */
  backgroundColor?: number;
  /** Text color */
  textColor?: number;
  /** Whether to show when count is 0 */
  showZero?: boolean;
}

export function PixiBadge({
  x = 0,
  y = 0,
  count,
  maxCount = 9,
  size = 20,
  backgroundColor = 0xEF4444,
  textColor = 0xFFFFFF,
  showZero = false,
}: PixiBadgeProps) {
  const displayText = count > maxCount ? `${maxCount}+` : String(count);
  const isWide = displayText.length > 1;
  const badgeWidth = isWide ? size * 1.5 : size;

  const drawBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: backgroundColor });
    g.roundRect(-badgeWidth / 2, -size / 2, badgeWidth, size, size / 2);
    g.fill();
    
    g.setStrokeStyle({ width: 1, color: 0xFFFFFF, alpha: 0.3 });
    g.roundRect(-badgeWidth / 2, -size / 2, badgeWidth, size, size / 2);
    g.stroke();
  }, [backgroundColor, badgeWidth, size]);

  const badgeTextStyle = useMemo(() => ({
    fontFamily: FONT_BOLD,
    fontSize: size * 0.6,
    fill: textColor,
    fontWeight: 'bold' as const,
  }), [size, textColor]);

  if (count === 0 && !showZero) return null;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBadge} />
      <pixiText
        text={displayText}
        anchor={0.5}
        style={badgeTextStyle}
        eventMode="none"
      />
    </pixiContainer>
  );
}

// ============================================================================
// ICON
// ============================================================================

export interface PixiIconProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Icon type */
  icon: IconType;
  /** Icon size */
  size?: number;
  /** Tint color */
  tint?: number;
  /** Alpha */
  alpha?: number;
  /** Anchor point */
  anchor?: number | { x: number; y: number };
}

export function PixiIcon({
  x = 0,
  y = 0,
  icon,
  size = 32,
  tint = 0xFFFFFF,
  alpha = 1,
  anchor = 0.5,
}: PixiIconProps) {
  const { themeName } = usePixiTheme();
  const candidates = useMemo(() => {
    const assetId = ICON_TYPE_TO_ASSET[icon];
    if (!assetId) return null;
    return resolveAsset(themeName as ThemeId, assetId);
  }, [icon, themeName]);
  const texture = useTextureWithFallback(candidates);

  if (!texture) return null;

  return (
    <pixiSprite
      x={x}
      y={y}
      texture={texture}
      width={size}
      height={size}
      tint={tint}
      alpha={alpha}
      anchor={anchor}
    />
  );
}

// ============================================================================
// LABEL (Styled Text)
// ============================================================================

export type LabelVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'button';

const LABEL_STYLES: Record<LabelVariant, object> = {
  title: {
    fontFamily: FONT_BOLD,
    fontSize: 28,
    fill: 0xFFFFFF,
    dropShadow: {
      alpha: 0.6,
      angle: Math.PI / 4,
      blur: 3,
      distance: 3,
      color: 0x000000,
    },
  },
  subtitle: {
    fontFamily: FONT_BOLD,
    fontSize: 20,
    fill: 0xFFFFFF,
    dropShadow: {
      alpha: 0.4,
      angle: Math.PI / 4,
      blur: 2,
      distance: 2,
      color: 0x000000,
    },
  },
  body: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    fill: 0xFFFFFF,
  },
  caption: {
    fontFamily: FONT_BODY,
    fontSize: 12,
    fill: 0xCCCCCC,
  },
  button: {
    fontFamily: FONT_BOLD,
    fontSize: 18,
    fill: 0xFFFFFF,
    dropShadow: {
      alpha: 0.5,
      angle: Math.PI / 4,
      blur: 2,
      distance: 2,
      color: 0x000000,
    },
  },
};

export interface PixiLabelProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Text content */
  text: string;
  /** Label style variant */
  variant?: LabelVariant;
  /** Text color override */
  color?: number;
  /** Font size override */
  fontSize?: number;
  /** Anchor point */
  anchor?: number | { x: number; y: number };
  /** Word wrap width (0 = no wrap) */
  wordWrapWidth?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Alpha */
  alpha?: number;
}

export function PixiLabel({
  x = 0,
  y = 0,
  text,
  variant = 'body',
  color,
  fontSize,
  anchor = 0,
  wordWrapWidth = 0,
  align = 'left',
  alpha = 1,
}: PixiLabelProps) {
  const style = useMemo(() => ({
    ...LABEL_STYLES[variant],
    ...(color !== undefined && { fill: color }),
    ...(fontSize !== undefined && { fontSize }),
    ...(wordWrapWidth > 0 && { 
      wordWrap: true, 
      wordWrapWidth,
      align,
    }),
  }), [variant, color, fontSize, wordWrapWidth, align]);

  return (
    <pixiText
      x={x}
      y={y}
      text={text}
      anchor={anchor}
      alpha={alpha}
      style={style}
    />
  );
}

// ============================================================================
// DIVIDER
// ============================================================================

export interface PixiDividerProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Divider width */
  width: number;
  /** Divider color */
  color?: number;
  /** Divider alpha */
  alpha?: number;
  /** Divider thickness */
  thickness?: number;
}

export function PixiDivider({
  x = 0,
  y = 0,
  width,
  color = 0xFFFFFF,
  alpha = 0.2,
  thickness = 1,
}: PixiDividerProps) {
  const drawDivider = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setStrokeStyle({ width: thickness, color, alpha });
    g.moveTo(0, 0);
    g.lineTo(width, 0);
    g.stroke();
  }, [width, color, alpha, thickness]);

  return <pixiGraphics x={x} y={y} draw={drawDivider} />;
}

// ============================================================================
// SPACER (Layout helper)
// ============================================================================

export interface PixiSpacerProps {
  /** Width */
  width?: number;
  /** Height */
  height?: number;
}

export function PixiSpacer({ width = 0, height = 0 }: PixiSpacerProps) {
  // Spacer is just a container with size - used for layout purposes
  return <pixiContainer width={width} height={height} />;
}
