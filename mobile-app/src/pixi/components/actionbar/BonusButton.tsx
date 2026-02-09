import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useTick } from '@pixi/react';
import { TextStyle, Graphics as PixiGraphics, Texture, Assets } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { usePulseRef } from '../../hooks/useAnimatedValue';
import { FONT_BODY, THEME_ASSETS } from '../../utils/colors';
import { GlowFilter } from '../../extend';

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
  const { getAssetPath } = usePixiTheme();

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [texture, setTexture] = useState<Texture | null>(null);
  const [bgTex, setBgTex] = useState<Texture | null>(null);
  const containerRef = useRef<import('pixi.js').Container | null>(null);

  const shouldPulse = count > 0 && !isDisabled && !isSelected && !isHovered;
  const { valueRef: pulseScaleRef } = usePulseRef(shouldPulse, {
    minScale: 1.0,
    maxScale: 1.05,
    duration: 2000
  });

  useEffect(() => {
    if (icon) {
      Assets.load(icon)
        .then((tex) => setTexture(tex as Texture))
        .catch(() => setTexture(null));
    }
  }, [icon]);

  useEffect(() => {
    const path = getAssetPath(THEME_ASSETS.bonusBtnBg);
    Assets.load(path).then(t => setBgTex(t as Texture)).catch(() => setBgTex(null));
  }, [getAssetPath]);

  const radius = size / 2;
  const badgeSize = 16;

  const drawButton = useCallback((g: PixiGraphics) => {
    g.clear();

    if (!bgTex) {
      const bgColor = isDisabled ? 0x2D2D2D
        : isSelected ? 0x1E3A5A
        : isPressed ? 0x4A4A4A
        : isHovered ? 0x3A3A3A
        : 0x2A2A2A;

      g.circle(radius, radius, radius);
      g.fill({ color: bgColor, alpha: isDisabled ? 0.5 : 0.95 });

      if (!isDisabled) {
        g.circle(radius, radius * 0.7, radius * 0.85);
        g.fill({ color: 0xFFFFFF, alpha: 0.08 });
      }

      const borderColor = isDisabled ? 0x555555
        : isSelected ? 0x60a5fa
        : isHovered ? 0x888888
        : 0x666666;

      g.circle(radius, radius, radius - 1);
      g.stroke({ color: borderColor, width: isSelected ? 2.5 : 2, alpha: isDisabled ? 0.3 : 0.7 });

      if (isSelected && !isDisabled) {
        g.circle(radius, radius, radius + 3);
        g.stroke({ color: 0x60a5fa, width: 2, alpha: 0.3 });
      }
    }
  }, [size, radius, isSelected, isDisabled, isHovered, isPressed, bgTex]);

  const drawCountBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    if (count <= 0) return;

    const bx = size - badgeSize / 2 + 2;
    const by = badgeSize / 2 - 2;

    g.circle(bx, by, badgeSize / 2);
    g.fill({ color: 0x22c55e });
    g.circle(bx, by, badgeSize / 2);
    g.stroke({ color: 0xffffff, width: 1.5 });
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
      g.fill({ color: 0xfbbf24 });
    }
  }, [size, level]);

  const countStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: 0xffffff,
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
      color: 0x60a5fa,
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
