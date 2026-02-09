/**
 * PixiButton - Tiki-themed button component
 * 
 * Uses 9-slice sprite for scalable backgrounds with:
 * - Multiple color variants (orange, green, purple, red)
 * - Press/hover/disabled states
 * - Optional icon support
 * - Optional text label
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Texture, FederatedPointerEvent, TextStyle } from 'pixi.js';
import { FONT_BOLD } from '../utils/colors';
import { loadTextureCached } from '../assets/textureLoader';
import { 
  BUTTON_ASSETS, 
  BUTTON_BORDERS,
  ICON_BUTTON_BORDERS,
  type ButtonVariant,
  ICON_ASSETS,
  type IconType,
} from '../assets/manifest';

export interface PixiButtonProps {
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Button width (will scale 9-slice) */
  width?: number;
  /** Button height (will scale 9-slice) */
  height?: number;
  /** Color variant */
  variant?: ButtonVariant;
  /** Button text label */
  label?: string;
  /** Icon to show (instead of or alongside text) */
  icon?: IconType;
  /** Icon size (default: 24) */
  iconSize?: number;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onPress?: () => void;
  /** Whether to show as icon-only button (uses btn-icon texture) */
  iconOnly?: boolean;
  /** Text style overrides */
  textStyle?: Partial<TextStyle>;
  /** Anchor point (0-1, default: 0 = top-left) */
  anchor?: number;
  /** Scale factor for press animation */
  pressScale?: number;
}

// Default text style for buttons
const DEFAULT_TEXT_STYLE: Partial<TextStyle> = {
  fontFamily: FONT_BOLD,
  fontSize: 18,
  fill: 0xFFFFFF,
  align: 'center',
  dropShadow: {
    alpha: 0.5,
    angle: Math.PI / 4,
    blur: 2,
    distance: 2,
    color: 0x000000,
  },
};

export function PixiButton({
  x = 0,
  y = 0,
  width = 120,
  height = 48,
  variant = 'orange',
  label,
  icon,
  iconSize = 24,
  disabled = false,
  onPress,
  iconOnly = false,
  textStyle = {},
  anchor = 0,
  pressScale = 0.95,
}: PixiButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [textures, setTextures] = useState<{
    normal: Texture;
    pressed: Texture;
    disabled: Texture;
  } | null>(null);
  const [iconTexture, setIconTexture] = useState<Texture | null>(null);

  // Use icon button variant if iconOnly
  const actualVariant = iconOnly ? 'icon' : variant;
  const borders = iconOnly ? ICON_BUTTON_BORDERS : BUTTON_BORDERS;

  // Load button textures
  useEffect(() => {
    let cancelled = false;
    const buttonAssets = BUTTON_ASSETS[actualVariant];
    if (!buttonAssets) return;

    Promise.all([
      loadTextureCached(buttonAssets.normal.path),
      loadTextureCached(buttonAssets.pressed.path),
      loadTextureCached(buttonAssets.disabled.path),
    ]).then(([normal, pressed, disabledTex]) => {
      if (!cancelled) {
        setTextures({ normal, pressed, disabled: disabledTex });
      }
    }).catch(() => {
      if (!cancelled) setTextures(null);
    });

    return () => {
      cancelled = true;
    };
  }, [actualVariant]);

  // Load icon texture
  useEffect(() => {
    let cancelled = false;
    if (!icon) {
      setIconTexture(null);
      return;
    }

    const iconAsset = ICON_ASSETS[icon];
    if (!iconAsset) return;

    loadTextureCached(iconAsset.path)
      .then((texture) => {
        if (!cancelled) setIconTexture(texture);
      })
      .catch(() => {
        if (!cancelled) setIconTexture(null);
      });

    return () => {
      cancelled = true;
    };
  }, [icon]);

  // Get current texture based on state
  const currentTexture = useMemo(() => {
    if (!textures) return Texture.WHITE;
    if (disabled) return textures.disabled;
    if (isPressed) return textures.pressed;
    return textures.normal;
  }, [textures, disabled, isPressed]);

  // Combined text style
  const combinedTextStyle = useMemo(() => ({
    ...DEFAULT_TEXT_STYLE,
    ...textStyle,
  }), [textStyle]);

  // Calculate positions based on anchor
  const anchorOffset = useMemo(() => ({
    x: -width * anchor,
    y: -height * anchor,
  }), [width, height, anchor]);

  // Calculate scale based on state
  const scale = useMemo(() => {
    if (disabled) return 1;
    if (isPressed) return pressScale;
    if (isHovered) return 1.02;
    return 1;
  }, [disabled, isPressed, isHovered, pressScale]);

  // Event handlers
  const handlePointerDown = useCallback((e: FederatedPointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsPressed(true);
  }, [disabled]);

  const handlePointerUp = useCallback((e: FederatedPointerEvent) => {
    if (disabled) return;
    e.stopPropagation();
    if (isPressed) {
      setIsPressed(false);
      onPress?.();
    }
  }, [disabled, isPressed, onPress]);

  const handlePointerUpOutside = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handlePointerOver = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  // Calculate content positioning
  const contentLayout = useMemo(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    if (iconOnly && icon) {
      // Icon only - centered
      return {
        iconX: centerX,
        iconY: centerY,
        textX: 0,
        textY: 0,
        showText: false,
      };
    }
    
    if (icon && label) {
      // Icon + text - icon left, text right
      const gap = 8;
      const totalWidth = iconSize + gap + (label.length * 10); // rough estimate
      const startX = centerX - totalWidth / 2;
      return {
        iconX: startX + iconSize / 2,
        iconY: centerY,
        textX: startX + iconSize + gap + (label.length * 10) / 2,
        textY: centerY,
        showText: true,
      };
    }
    
    // Text only - centered
    return {
      iconX: 0,
      iconY: 0,
      textX: centerX,
      textY: centerY,
      showText: true,
    };
  }, [width, height, icon, iconOnly, label, iconSize]);

  const cursor = disabled ? 'not-allowed' : 'pointer';
  const alpha = disabled ? 0.6 : 1;

  // Scale origin should be center of button
  const pivotX = width / 2;
  const pivotY = height / 2;

  return (
    <pixiContainer
      x={x + pivotX + anchorOffset.x}
      y={y + pivotY + anchorOffset.y}
      scale={scale}
      pivot={{ x: pivotX, y: pivotY }}
      alpha={alpha}
      eventMode={disabled ? 'none' : 'static'}
      cursor={cursor}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUpOutside}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 9-slice background */}
      <pixiNineSliceSprite
        texture={currentTexture}
        leftWidth={borders.left}
        topHeight={borders.top}
        rightWidth={borders.right}
        bottomHeight={borders.bottom}
        width={width}
        height={height}
      />

      {/* Icon */}
      {icon && iconTexture && (
        <pixiSprite
          texture={iconTexture}
          x={contentLayout.iconX}
          y={contentLayout.iconY}
          width={iconSize}
          height={iconSize}
          anchor={0.5}
        />
      )}

      {/* Text label */}
      {label && contentLayout.showText && (
        <pixiText
          text={label}
          x={contentLayout.textX}
          y={contentLayout.textY}
          anchor={0.5}
          style={combinedTextStyle}
        />
      )}
    </pixiContainer>
  );
}

export default PixiButton;
