import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { drawFlagIcon, IconColors } from '../ui/Icons';
import { FONT_BOLD } from '../../utils/colors';

const CONFIRM_TIMEOUT_MS = 2000;

interface SurrenderButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  isDisabled?: boolean;
}

export const SurrenderButton = ({
  x,
  y,
  width,
  height,
  onClick,
  isDisabled = false,
}: SurrenderButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handlePointerDown = useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = useCallback(() => {
    setIsPressed(false);
    if (isDisabled) return;

    if (awaitingConfirm) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setAwaitingConfirm(false);
      onClick?.();
    } else {
      setAwaitingConfirm(true);
      confirmTimer.current = setTimeout(() => setAwaitingConfirm(false), CONFIRM_TIMEOUT_MS);
    }
  }, [isDisabled, awaitingConfirm, onClick]);

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
    
    const bgColor = awaitingConfirm ? 0x991b1b : isHovered ? 0x7f1d1d : 0x1e293b;
    const borderColor = awaitingConfirm ? 0xef4444 : isHovered ? 0xef4444 : 0x475569;
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.fill({ color: bgColor, alpha: isDisabled ? 0.5 : 0.9 });
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, radius);
    g.stroke({ color: borderColor, width: awaitingConfirm ? 2 : 1.5, alpha: isDisabled ? 0.3 : (awaitingConfirm || isHovered ? 0.8 : 0.5) });
  }, [width, height, isHovered, isPressed, isDisabled, awaitingConfirm]);

  const drawIcon = useCallback((g: PixiGraphics) => {
    const iconSize = Math.min(width, height) * 0.6;
    const color = awaitingConfirm ? 0xfca5a5 : isHovered ? 0xfca5a5 : (isDisabled ? IconColors.secondary : IconColors.danger);
    drawFlagIcon(g, iconSize, color);
  }, [width, height, isHovered, isDisabled, awaitingConfirm]);

  const confirmTextStyle = useMemo(() => ({
    fontFamily: FONT_BOLD,
    fontSize: Math.min(width, height) * 0.3,
    fill: 0xfca5a5,
  }), [width, height]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawBackground}
        eventMode={isDisabled ? 'none' : 'static'}
        cursor={isDisabled ? 'default' : 'pointer'}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerOut}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      {awaitingConfirm ? (
        <pixiText
          text="Sure?"
          x={width / 2}
          y={height / 2}
          anchor={0.5}
          style={confirmTextStyle}
          eventMode="none"
        />
      ) : (
        <pixiGraphics
          x={width / 2}
          y={height / 2}
          draw={drawIcon}
          alpha={isDisabled ? 0.5 : 1}
          eventMode="none"
        />
      )}
    </pixiContainer>
  );
};

export default SurrenderButton;
