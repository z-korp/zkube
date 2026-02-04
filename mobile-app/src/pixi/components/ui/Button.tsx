import { useCallback, useState, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  text: string;
  x?: number;
  y?: number;
  width: number;
  height: number;
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
  fontSize?: number;
}

/**
 * Reusable button component for PixiJS modals and UI
 */
export const Button = ({
  text,
  x = 0,
  y = 0,
  width,
  height,
  variant = 'primary',
  disabled = false,
  onClick,
  fontSize = 14,
}: ButtonProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Color schemes based on variant
  const getColors = useCallback(() => {
    const baseAlpha = disabled ? 0.5 : 1;
    
    switch (variant) {
      case 'primary':
        return {
          bg: isProcedural ? 0x6366f1 : 0x3b82f6,
          bgHover: isProcedural ? 0x818cf8 : 0x60a5fa,
          border: isProcedural ? 0x818cf8 : 0x60a5fa,
          text: 0xffffff,
          alpha: baseAlpha,
        };
      case 'secondary':
        return {
          bg: isProcedural ? 0x334155 : 0x475569,
          bgHover: isProcedural ? 0x475569 : 0x64748b,
          border: isProcedural ? 0x475569 : 0x64748b,
          text: 0xffffff,
          alpha: baseAlpha,
        };
      case 'danger':
        return {
          bg: 0xdc2626,
          bgHover: 0xef4444,
          border: 0xef4444,
          text: 0xffffff,
          alpha: baseAlpha,
        };
      case 'ghost':
        return {
          bg: 0x000000,
          bgHover: isProcedural ? 0x1a1a2e : 0x1e293b,
          border: isProcedural ? 0x475569 : 0x64748b,
          text: 0xffffff,
          alpha: baseAlpha * 0.1,
        };
      default:
        return {
          bg: 0x3b82f6,
          bgHover: 0x60a5fa,
          border: 0x60a5fa,
          text: 0xffffff,
          alpha: baseAlpha,
        };
    }
  }, [variant, disabled, isProcedural]);

  const colorScheme = getColors();

  const handlePointerDown = useCallback(() => {
    if (!disabled) setIsPressed(true);
  }, [disabled]);

  const handlePointerUp = useCallback(() => {
    if (!disabled && isPressed) {
      setIsPressed(false);
      onClick?.();
    }
  }, [disabled, isPressed, onClick]);

  const handlePointerOver = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    setIsPressed(false);
  }, []);

  const drawButton = useCallback((g: PixiGraphics) => {
    g.clear();

    const scale = isPressed ? 0.98 : 1;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;
    const radius = height / 4;

    const bgColor = isHovered && !disabled ? colorScheme.bgHover : colorScheme.bg;
    const bgAlpha = variant === 'ghost' 
      ? (isHovered ? 0.3 : 0.1) * colorScheme.alpha
      : colorScheme.alpha;

    // Background
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.fill({ color: bgColor, alpha: bgAlpha });

    // Border
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.stroke({ 
      color: colorScheme.border, 
      width: 1.5, 
      alpha: isHovered ? colorScheme.alpha : colorScheme.alpha * 0.6 
    });
  }, [width, height, isHovered, isPressed, disabled, colorScheme, variant]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize,
    fontWeight: 'bold',
    fill: colorScheme.text,
  }), [fontSize, colorScheme.text]);

  return (
    <pixiContainer x={x} y={y} alpha={colorScheme.alpha}>
      <pixiGraphics
        draw={drawButton}
        eventMode={disabled ? 'none' : 'static'}
        cursor={disabled ? 'default' : 'pointer'}
        onpointerdown={handlePointerDown}
        onpointerup={handlePointerUp}
        onpointerupoutside={handlePointerOut}
        onpointerover={handlePointerOver}
        onpointerout={handlePointerOut}
      />
      <pixiText
        text={text}
        x={width / 2}
        y={height / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={textStyle}
        alpha={disabled ? 0.5 : 1}
      />
    </pixiContainer>
  );
};

export default Button;
