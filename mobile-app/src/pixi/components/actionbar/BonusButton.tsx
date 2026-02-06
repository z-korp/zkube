import { useCallback, useState, useEffect } from 'react';
import { TextStyle, Graphics as PixiGraphics, Texture, Assets } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { usePulse } from '../../hooks/useAnimatedValue';
import { FONT_BODY } from '../../utils/colors';

export interface BonusButtonData {
  /** Bonus type identifier */
  type: number;
  /** Bonus level (1-3) */
  level: number;
  /** Number of uses available */
  count: number;
  /** Icon URL or texture name */
  icon: string;
  /** Tooltip text */
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

/**
 * Interactive bonus button with count badge and level indicator
 */
export const BonusButton = ({
  type,
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
  const { colors } = usePixiTheme();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [texture, setTexture] = useState<Texture | null>(null);

  // Pulse animation when bonus is available and not selected
  const shouldPulse = count > 0 && !isDisabled && !isSelected && !isHovered;
  const pulseScale = usePulse(shouldPulse, { 
    minScale: 1.0, 
    maxScale: 1.05, 
    duration: 2000 
  });

  // Load icon texture
  useEffect(() => {
    if (icon) {
      Assets.load(icon)
        .then((tex) => setTexture(tex as Texture))
        .catch(() => setTexture(null));
    }
  }, [icon]);

  const cornerRadius = 10;
  const badgeSize = 18;

  const getBgColor = () => {
    if (isDisabled) return 0x1e293b;
    if (isSelected) return 0x172554;
    if (isPressed) return 0x374151;
    if (isHovered) return 0x334155;
    return 0x1e293b;
  };

  const getBorderColor = () => {
    if (isDisabled) return 0x374151;
    if (isSelected) return 0x60a5fa;
    if (isHovered) return 0x64748b;
    return 0x475569;
  };

  const drawButton = useCallback((g: PixiGraphics) => {
    g.clear();

    const bgColor = getBgColor();
    const borderColor = getBorderColor();

    g.roundRect(0, 0, size, size, cornerRadius);
    g.fill({ color: bgColor, alpha: isDisabled ? 0.4 : 0.95 });

    g.roundRect(0, 0, size, size, cornerRadius);
    g.stroke({ color: borderColor, width: isSelected ? 2 : 1.5, alpha: isDisabled ? 0.25 : 0.8 });

    if (isSelected && !isDisabled) {
      g.roundRect(-3, -3, size + 6, size + 6, cornerRadius + 3);
      g.stroke({ color: borderColor, width: 2, alpha: 0.25 });
    }
  }, [size, isSelected, isDisabled, isHovered, isPressed]);

  const drawCountBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (count <= 0) return;
    
    // Badge background
    const badgeColor = count > 0 ? 0x22c55e : 0xef4444;
    g.circle(size - 4, 4, badgeSize / 2);
    g.fill({ color: badgeColor });
    
    // Badge border
    g.circle(size - 4, 4, badgeSize / 2);
    g.stroke({ color: 0xffffff, width: 1.5 });
  }, [size, count]);

  const drawLevelIndicator = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Draw level dots at bottom of button
    const dotSize = 4;
    const dotGap = 3;
    const totalWidth = level * dotSize + (level - 1) * dotGap;
    const startX = (size - totalWidth) / 2;
    const dotY = size - 6;
    
    for (let i = 0; i < level; i++) {
      const dotX = startX + i * (dotSize + dotGap);
      g.circle(dotX + dotSize / 2, dotY, dotSize / 2);
      g.fill({ color: 0xfbbf24 });
    }
  }, [size, level]);

  const countStyle = new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: 0xffffff,
  });

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (!isDisabled && count > 0) {
      onClick();
    }
  }, [isDisabled, count, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!isDisabled) setIsHovered(true);
  }, [isDisabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const iconSize = size - 16;
  const iconOffset = 8;

  // Calculate scale for animation
  const containerScale = isPressed ? 0.95 : (isHovered ? 1.02 : pulseScale);
  const pivotOffset = size / 2;

  return (
    <pixiContainer
      x={x + pivotOffset}
      y={y + pivotOffset}
      pivot={{ x: pivotOffset, y: pivotOffset }}
      scale={{ x: containerScale, y: containerScale }}
      eventMode={isDisabled ? 'none' : 'static'}
      cursor={isDisabled || count === 0 ? 'not-allowed' : 'pointer'}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <pixiGraphics draw={drawButton} />
      
      {/* Icon */}
      {texture && (
        <pixiSprite
          texture={texture}
          x={iconOffset}
          y={iconOffset}
          width={iconSize}
          height={iconSize}
          alpha={isDisabled || count === 0 ? 0.3 : 1}
        />
      )}
      
      {/* Level indicator dots */}
      {level > 0 && <pixiGraphics draw={drawLevelIndicator} />}
      
      {/* Count badge */}
      <pixiGraphics draw={drawCountBadge} />
      {count > 0 && (
        <pixiText
          text={String(count)}
          x={size - 4}
          y={4}
          anchor={0.5}
          style={countStyle}
        />
      )}
    </pixiContainer>
  );
};

export default BonusButton;
