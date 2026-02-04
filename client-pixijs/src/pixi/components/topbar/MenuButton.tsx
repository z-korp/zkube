import { useCallback, useState } from 'react';
import { Graphics as PixiGraphics, FederatedPointerEvent } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface MenuButtonProps {
  x: number;
  y: number;
  size: number;
  onClick?: () => void;
}

/**
 * Hamburger menu button
 * Three horizontal lines that trigger menu dialog
 */
export const MenuButton = ({
  x,
  y,
  size,
  onClick,
}: MenuButtonProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  const lineColor = isProcedural ? colors.accent : 0xffffff;
  const bgColor = isProcedural ? 0x1a1a2e : 0x1e293b;
  const hoverBgColor = isProcedural ? 0x2a2a4e : 0x334155;
  
  const handlePointerDown = useCallback(() => {
    setIsPressed(true);
  }, []);
  
  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    onClick?.();
  }, [onClick]);
  
  const handlePointerOver = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : isHovered ? 1.02 : 1;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Background circle
    const radius = (size / 2 - 2) * scale;
    g.circle(centerX, centerY, radius);
    g.fill({ color: isHovered ? hoverBgColor : bgColor, alpha: 0.9 });
    
    // Border
    g.circle(centerX, centerY, radius);
    g.stroke({ color: lineColor, width: 1.5, alpha: isHovered ? 0.8 : 0.4 });
    
    // Hamburger lines
    const lineWidth = size * 0.4 * scale;
    const lineHeight = 2;
    const lineGap = 5 * scale;
    const startX = centerX - lineWidth / 2;
    const startY = centerY - lineGap;
    
    // Top line
    g.roundRect(startX, startY, lineWidth, lineHeight, 1);
    g.fill({ color: lineColor, alpha: isHovered ? 1 : 0.8 });
    
    // Middle line
    g.roundRect(startX, centerY - lineHeight / 2, lineWidth, lineHeight, 1);
    g.fill({ color: lineColor, alpha: isHovered ? 1 : 0.8 });
    
    // Bottom line
    g.roundRect(startX, startY + lineGap * 2, lineWidth, lineHeight, 1);
    g.fill({ color: lineColor, alpha: isHovered ? 1 : 0.8 });
  }, [size, lineColor, bgColor, hoverBgColor, isHovered, isPressed]);

  return (
    <pixiGraphics
      x={x}
      y={y}
      draw={draw}
      eventMode="static"
      cursor="pointer"
      onpointerdown={handlePointerDown}
      onpointerup={handlePointerUp}
      onpointerover={handlePointerOver}
      onpointerout={handlePointerOut}
    />
  );
};

export default MenuButton;
