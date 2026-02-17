import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useTick } from '@pixi/react';
import { TextStyle, Graphics as PixiGraphics, Texture } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { usePulseRef } from '../../hooks/useAnimatedValue';
import { FONT_BODY, type ThemeId } from '../../utils/colors';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { GlowFilter } from '../../extend';
import { loadTextureCached } from '../../assets/textureLoader';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { color } from '@/pixi/design/tokens';

// Component-local background colors (kept local for button state management)
const DISABLED_BG = 0x2D2D2D;
const SELECTED_BG = 0x1E3A5A;
const PRESSED_BG = 0x4A4A4A;
const HOVERED_BG = 0x3A3A3A;
const DEFAULT_BG = 0x2A2A2A;
const HOVERED_BORDER = 0x888888;
const DEFAULT_BORDER = 0x666666;

export interface BonusButtonData {
  type: number;
  level: number;
  count: number;
  icon: string;
  tooltip?: string;
}

interface BonusButtonProps extends BonusButtonData {
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
}

export const BonusButton = ({
  type: _type,
  level,
  count,
  icon,
  x,
  y,
  size,
  isSelected,
  isDisabled,
  onClick,
}: BonusButtonProps) => {
  const { themeName } = usePixiTheme();

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [texture, setTexture] = useState<Texture | null>(null);
  const containerRef = useRef<import('pixi.js').Container | null>(null);

  const shouldPulse = count > 0 && !isDisabled && !isSelected && !isHovered;
  const { valueRef: pulseScaleRef } = usePulseRef(shouldPulse, {
    minScale: 1.0,
    maxScale: 1.05,
    duration: 2000
  });

  useEffect(() => {
    let cancelled = false;
    if (icon) {
      loadTextureCached(icon)
        .then((tex) => {
          if (!cancelled) setTexture(tex);
        })
        .catch(() => {
          if (!cancelled) setTexture(null);
        });
      return () => {
        cancelled = true;
      };
    }
    setTexture(null);
  }, [icon]);

  const bgCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.BonusBtnBg),
    [themeName],
  );
  const bgTex = useTextureWithFallback(bgCandidates);

  const radius = size / 2;
  const badgeSize = 16;

  const drawButton = useCallback((g: PixiGraphics) => {
    g.clear();

    if (!bgTex) {
      const bgColor = isDisabled ? DISABLED_BG
        : isSelected ? SELECTED_BG
        : isPressed ? PRESSED_BG
        : isHovered ? HOVERED_BG
        : DEFAULT_BG;

      g.circle(radius, radius, radius);
      g.fill({ color: bgColor, alpha: isDisabled ? 0.5 : 0.95 });

      if (!isDisabled) {
        g.circle(radius, radius * 0.7, radius * 0.85);
        g.fill({ color: color.text.primary, alpha: 0.08 });
      }

      const borderColor = isDisabled ? color.interactive.pillPressed
        : isSelected ? color.accent.blue
        : isHovered ? HOVERED_BORDER
        : DEFAULT_BORDER;

      g.circle(radius, radius, radius - 1);
      g.stroke({ color: borderColor, width: isSelected ? 2.5 : 2, alpha: isDisabled ? 0.3 : 0.7 });

      if (isSelected && !isDisabled) {
        g.circle(radius, radius, radius + 3);
        g.stroke({ color: color.accent.blue, width: 2, alpha: 0.3 });
      }
    }
  }, [radius, isSelected, isDisabled, isHovered, isPressed, bgTex]);

  const drawCountBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    if (count <= 0) return;

    const bx = size - badgeSize / 2 + 2;
    const by = badgeSize / 2 - 2;

    g.circle(bx, by, badgeSize / 2);
    g.fill({ color: color.status.success });
    g.circle(bx, by, badgeSize / 2);
    g.stroke({ color: color.text.primary, width: 1.5 });
  }, [size, count, badgeSize]);

  const drawLevelDots = useCallback((g: PixiGraphics) => {
    g.clear();
    const dotR = 2.5;
    const dotGap = 3;
    const totalW = level * dotR * 2 + (level - 1) * dotGap;
    const startX = (size - totalW) / 2;
    const dotY = size - dotR - 2;

    for (let i = 0; i < level; i++) {
      const cx = startX + i * (dotR * 2 + dotGap) + dotR;
      g.circle(cx, dotY, dotR);
      g.fill({ color: color.accent.gold });
    }
  }, [size, level]);

  const countStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: color.text.primary,
  }), []);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (!isDisabled && count > 0) onClick();
  }, [isDisabled, count, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!isDisabled) setIsHovered(true);
  }, [isDisabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const iconSize = size * 0.55;
  const iconOffset = (size - iconSize) / 2;

  const pivotOffset = radius;

  const tickScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scale = isPressed ? 0.92 : (isHovered ? 1.04 : pulseScaleRef.current);
    container.scale.set(scale, scale);
  }, [isPressed, isHovered, pulseScaleRef]);
  useTick(tickScale);

  const prevGlowRef = useRef<InstanceType<typeof GlowFilter> | null>(null);
  const glowFilter = useMemo(() => {
    if (prevGlowRef.current) {
      prevGlowRef.current.destroy();
      prevGlowRef.current = null;
    }
    if (!isSelected || isDisabled) return null;
    const f = new GlowFilter({
      distance: 8,
      outerStrength: 2.5,
      innerStrength: 0.5,
      color: color.accent.blue,
      quality: 0.15,
    });
    prevGlowRef.current = f;
    return f;
  }, [isSelected, isDisabled]);

  useEffect(() => {
    return () => { prevGlowRef.current?.destroy(); };
  }, []);

  const filters = useMemo(() => glowFilter ? [glowFilter] : [], [glowFilter]);

  return (
    <pixiContainer
      ref={containerRef}
      x={x + pivotOffset}
      y={y + pivotOffset}
      pivot={{ x: pivotOffset, y: pivotOffset }}
      eventMode={isDisabled ? 'none' : 'static'}
      cursor={isDisabled || count === 0 ? 'not-allowed' : 'pointer'}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      filters={filters}
    >
      {bgTex ? (
        <pixiSprite texture={bgTex} width={size} height={size}
          alpha={isDisabled ? 0.5 : 1} eventMode="none" />
      ) : (
        <pixiGraphics draw={drawButton} eventMode="none" />
      )}

      {texture && (
        <pixiSprite
          texture={texture}
          x={iconOffset}
          y={iconOffset}
          width={iconSize}
          height={iconSize}
          alpha={isDisabled || count === 0 ? 0.3 : 1}
          eventMode="none"
        />
      )}

      {level > 0 && <pixiGraphics draw={drawLevelDots} eventMode="none" />}

      <pixiGraphics draw={drawCountBadge} eventMode="none" />
      {count > 0 && (
        <pixiText
          text={String(count)}
          x={size - badgeSize / 2 + 2}
          y={badgeSize / 2 - 2}
          anchor={0.5}
          style={countStyle}
          eventMode="none"
        />
      )}
    </pixiContainer>
  );
};

export default BonusButton;
