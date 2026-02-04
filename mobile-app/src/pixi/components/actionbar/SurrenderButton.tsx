import { useCallback, useState } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { drawFlagIcon, IconColors } from '../ui/Icons';

interface SurrenderButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  isDisabled?: boolean;
}

/**
 * Surrender/menu button in the action bar
 */
export const SurrenderButton = ({
  x,
  y,
  width,
  height,
  onClick,
  isDisabled = false,
}: SurrenderButtonProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (!isDisabled) onClick?.();
  }, [isDisabled, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!isDisabled) setIsHovered(true);
  }, [isDisabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : 1;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    const radius = 6;
    
    // Background - slightly red on hover
    const bgColor = isHovered ? 0x7f1d1d : (isProcedural ? 0x1a1a2e : 0x1e293b);
    const borderColor = isHovered ? 0xef4444 : (isProcedural ? colors.accent : 0x475569);
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.fill({ color: bgColor, alpha: isDisabled ? 0.5 : 0.9 });
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.stroke({ color: borderColor, width: 1.5, alpha: isDisabled ? 0.3 : (isHovered ? 0.8 : 0.5) });
  }, [width, height, isHovered, isPressed, isProcedural, colors.accent, isDisabled]);

  const drawIcon = useCallback((g: PixiGraphics) => {
    const iconSize = Math.min(width, height) * 0.6;
    const color = isHovered ? 0xfca5a5 : (isDisabled ? IconColors.secondary : IconColors.danger);
    drawFlagIcon(g, iconSize, color);
  }, [width, height, isHovered, isDisabled]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawBackground}
        eventMode={isDisabled ? 'none' : 'static'}
        cursor={isDisabled ? 'default' : 'pointer'}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerupoutside={handlePointerOut}
        onpointerover={handlePointerOver}
        onpointerout={handlePointerOut}
      />
      <pixiGraphics
        x={width / 2}
        y={height / 2}
        draw={drawIcon}
        alpha={isDisabled ? 0.5 : 1}
      />
    </pixiContainer>
  );
};

export default SurrenderButton;
