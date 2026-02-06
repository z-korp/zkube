import { useCallback, useState, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { 
import { FONT_BODY } from '../../utils/colors';
  drawQuestsIcon, 
  drawTrophyIcon, 
  drawShopIcon, 
  IconColors 
} from '../ui/Icons';

type NavIcon = 'quests' | 'trophy' | 'shop' | 'settings';

interface NavButtonProps {
  icon: NavIcon;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  label?: string;
  badge?: number;
}

const iconDrawers: Record<NavIcon, (g: PixiGraphics, size: number, color: number) => void> = {
  quests: drawQuestsIcon,
  trophy: drawTrophyIcon,
  shop: drawShopIcon,
  settings: () => {}, // TODO: implement if needed
};

const iconColors: Record<NavIcon, number> = {
  quests: IconColors.primary,
  trophy: IconColors.gold,
  shop: IconColors.success,
  settings: IconColors.secondary,
};

/**
 * Navigation button for top bar with icon
 */
export const NavButton = ({
  icon,
  x,
  y,
  width,
  height,
  onClick,
  label,
  badge,
}: NavButtonProps) => {
  const { colors } = usePixiTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback(() => setIsPressed(true), []);
  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    onClick?.();
  }, [onClick]);
  const handlePointerOver = useCallback(() => setIsHovered(true), []);
  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const iconSize = Math.min(width, height) * 0.55;
  const hasLabel = label && width > 50;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : 1;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    const radius = height * 0.25;
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.fill({ color: isHovered ? 0x334155 : 0x1e293b, alpha: 0.9 });
    
    const borderColor = isHovered ? iconColors[icon] : 0x475569;
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.stroke({ color: borderColor, width: 1.5, alpha: isHovered ? 0.8 : 0.4 });
  }, [width, height, isHovered, isPressed, icon]);

  const drawIcon = useCallback((g: PixiGraphics) => {
    const drawer = iconDrawers[icon];
    const color = isHovered ? iconColors[icon] : IconColors.secondary;
    drawer(g, iconSize, color);
  }, [icon, iconSize, isHovered]);

  const drawBadge = useCallback((g: PixiGraphics) => {
    if (!badge || badge <= 0) return;
    
    g.clear();
    const badgeSize = 16;
    g.circle(0, 0, badgeSize / 2);
    g.fill({ color: 0xef4444 });
  }, [badge]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 9,
    fill: isHovered ? 0xffffff : 0x94a3b8,
    letterSpacing: 0.3,
  }), [isHovered]);

  const badgeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: 0xffffff,
  }), []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawBackground}
        eventMode="static"
        cursor="pointer"
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerupoutside={handlePointerOut}
        onpointerover={handlePointerOver}
        onpointerout={handlePointerOut}
      />
      
      {/* Icon */}
      <pixiGraphics
        x={width / 2}
        y={hasLabel ? height / 2 - 5 : height / 2}
        draw={drawIcon}
      />
      
      {/* Optional label */}
      {hasLabel && (
        <pixiText
          text={label}
          x={width / 2}
          y={height - 6}
          anchor={{ x: 0.5, y: 1 }}
          style={labelStyle}
        />
      )}
      
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <pixiContainer x={width - 6} y={6}>
          <pixiGraphics draw={drawBadge} />
          <pixiText
            text={String(badge)}
            anchor={{ x: 0.5, y: 0.5 }}
            style={badgeStyle}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

export default NavButton;
