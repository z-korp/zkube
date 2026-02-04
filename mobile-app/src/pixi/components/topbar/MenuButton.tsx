import { useCallback, useState } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { drawMenuIcon, IconColors } from '../ui/Icons';

interface MenuButtonProps {
  x: number;
  y: number;
  size: number;
  onClick?: () => void;
}

/**
 * Hamburger menu button for the top bar
 */
export const MenuButton = ({ x, y, size, onClick }: MenuButtonProps) => {
  const { colors, isProcedural } = usePixiTheme();
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

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : 1;
    const scaledSize = size * scale;
    const offset = (size - scaledSize) / 2;
    const radius = size * 0.25;
    
    // Background
    const bgColor = isProcedural ? 0x1a1a2e : 0x1e293b;
    const hoverColor = isProcedural ? 0x2a2a4e : 0x334155;
    
    g.roundRect(offset, offset, scaledSize, scaledSize, radius);
    g.fill({ color: isHovered ? hoverColor : bgColor, alpha: 0.9 });
    
    // Border
    g.roundRect(offset, offset, scaledSize, scaledSize, radius);
    g.stroke({ color: isProcedural ? colors.accent : 0x475569, width: 1.5, alpha: isHovered ? 0.8 : 0.4 });
  }, [size, isHovered, isPressed, isProcedural, colors.accent]);

  const drawIcon = useCallback((g: PixiGraphics) => {
    drawMenuIcon(g, size * 0.55, isHovered ? IconColors.primary : IconColors.secondary);
  }, [size, isHovered]);

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
      <pixiGraphics
        x={size / 2}
        y={size / 2}
        draw={drawIcon}
      />
    </pixiContainer>
  );
};

export default MenuButton;
