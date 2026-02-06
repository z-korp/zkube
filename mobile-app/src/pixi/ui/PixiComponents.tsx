/**
 * Supporting PixiJS UI Components
 * 
 * - ProgressBar: Animated progress bar with label
 * - StarRating: 1-3 star rating display
 * - Badge: Notification count badge
 * - PixiIcon: Icon sprite with tinting
 * - PixiLabel: Styled text label
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { ICON_ASSETS, type IconType } from '../assets/manifest';

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
  backgroundColor = 0x1a1a2e,
  fillColor = 0x4ADE80,
  fillColorSecondary,
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
  }, [width, height, clampedProgress, fillWidth, backgroundColor, fillColor, borderColor, borderWidth, radius]);

  const displayLabel = label ?? `${Math.round(clampedProgress * 100)}%`;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBar} />
      {showLabel && (
        <pixiText
          text={displayLabel}
          x={width / 2}
          y={height / 2}
          anchor={0.5}
          style={{
            fontFamily: 'Arial Bold, Arial, sans-serif',
            fontSize: Math.max(10, height - 6),
            fill: labelColor,
          }}
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
  const [filledTexture, setFilledTexture] = useState<Texture | null>(null);
  const [emptyTexture, setEmptyTexture] = useState<Texture | null>(null);

  // Load star textures
  useEffect(() => {
    Promise.all([
      Assets.load(ICON_ASSETS.starFilled.path),
      Assets.load(ICON_ASSETS.starEmpty.path),
    ]).then(([filled, empty]) => {
      setFilledTexture(filled);
      setEmptyTexture(empty);
    }).catch(console.error);
  }, []);

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
  if (count === 0 && !showZero) return null;

  const displayText = count > maxCount ? `${maxCount}+` : String(count);
  const isWide = displayText.length > 1;
  const badgeWidth = isWide ? size * 1.5 : size;

  const drawBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: backgroundColor });
    g.roundRect(-badgeWidth / 2, -size / 2, badgeWidth, size, size / 2);
    g.fill();
    
    // Subtle border
    g.setStrokeStyle({ width: 1, color: 0xFFFFFF, alpha: 0.3 });
    g.roundRect(-badgeWidth / 2, -size / 2, badgeWidth, size, size / 2);
    g.stroke();
  }, [backgroundColor, badgeWidth, size]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBadge} />
      <pixiText
        text={displayText}
        anchor={0.5}
        style={{
          fontFamily: 'Arial Bold, Arial, sans-serif',
          fontSize: size * 0.6,
          fill: textColor,
          fontWeight: 'bold',
        }}
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
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    const iconAsset = ICON_ASSETS[icon];
    if (!iconAsset) return;

    Assets.load(iconAsset.path)
      .then(setTexture)
      .catch(console.error);
  }, [icon]);

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
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
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
    fontFamily: 'Arial Bold, Arial, sans-serif',
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
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fill: 0xFFFFFF,
  },
  caption: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fill: 0xCCCCCC,
  },
  button: {
    fontFamily: 'Arial Bold, Arial, sans-serif',
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
