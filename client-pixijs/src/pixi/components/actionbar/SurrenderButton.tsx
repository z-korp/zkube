import { useCallback, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface SurrenderButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  isDisabled?: boolean;
}

/**
 * Surrender/Give Up button for the action bar
 * Shows a flag icon or "QUIT" text
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

  const cornerRadius = 6;
  
  const bgColor = isPressed ? 0x7f1d1d : (isHovered ? 0x991b1b : 0xb91c1c);
  const borderColor = 0xef4444;

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (!isDisabled) {
      onClick?.();
    }
  }, [isDisabled, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!isDisabled) setIsHovered(true);
  }, [isDisabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const drawButton = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isPressed ? 0.95 : (isHovered ? 1.02 : 1);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    
    // Background
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: isDisabled ? 0.4 : 0.9 });
    
    // Border
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1.5, alpha: isDisabled ? 0.3 : (isHovered ? 0.9 : 0.6) });
    
    // Flag icon
    if (!isDisabled) {
      const iconSize = Math.min(scaledWidth, scaledHeight) * 0.5;
      const iconX = offsetX + (scaledWidth - iconSize) / 2;
      const iconY = offsetY + (scaledHeight - iconSize) / 2;
      
      // Flag pole
      g.moveTo(iconX + iconSize * 0.2, iconY);
      g.lineTo(iconX + iconSize * 0.2, iconY + iconSize);
      g.stroke({ color: 0xffffff, width: 2, alpha: 0.9 });
      
      // Flag
      g.moveTo(iconX + iconSize * 0.2, iconY + iconSize * 0.1);
      g.lineTo(iconX + iconSize * 0.8, iconY + iconSize * 0.25);
      g.lineTo(iconX + iconSize * 0.2, iconY + iconSize * 0.5);
      g.closePath();
      g.fill({ color: 0xffffff, alpha: 0.9 });
    }
  }, [width, height, cornerRadius, bgColor, borderColor, isHovered, isPressed, isDisabled]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawButton}
        eventMode={isDisabled ? 'none' : 'static'}
        cursor={isDisabled ? 'not-allowed' : 'pointer'}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerover={handlePointerOver}
        onpointerout={handlePointerOut}
      />
    </pixiContainer>
  );
};

export default SurrenderButton;
