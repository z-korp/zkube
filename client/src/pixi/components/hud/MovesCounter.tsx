import { useCallback, useMemo } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { color } from '@/pixi/design/tokens';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';

interface MovesCounterProps {
  moves: number;
  maxMoves?: number;
  x: number;
  y: number;
  height: number;
  /** Low moves warning threshold (default: 5) */
  warningThreshold?: number;
  /** Critical moves threshold (default: 3) */
  criticalThreshold?: number;
}

/**
 * Displays remaining moves in a pill-shaped counter
 */
export const MovesCounter = ({
  moves,
  x,
  y,
  height,
  warningThreshold = 5,
  criticalThreshold = 3,
}: MovesCounterProps) => {
  const pillHeight = height - 8;
  const pillWidth = 64;
  const cornerRadius = pillHeight / 2;

  // Determine color based on remaining moves
  const isWarning = moves <= warningThreshold && moves > criticalThreshold;
  const isCritical = moves <= criticalThreshold;
  
  const bgColor = isCritical 
    ? color.status.dangerDark
    : isWarning 
      ? color.status.warningDark
      : color.bg.primary;
  
  const textColor = isCritical
    ? color.status.dangerLight
    : isWarning
      ? color.status.warningLight
      : color.text.primary;

  const drawPill = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, pillWidth, pillHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.95 });
    
    // Border
    const borderColor = isCritical 
      ? color.status.danger
      : isWarning 
        ? color.status.warning
        : color.state.hover;
    g.roundRect(0, 0, pillWidth, pillHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1.5, alpha: isCritical || isWarning ? 1 : 0.5 });
  }, [bgColor, pillWidth, pillHeight, cornerRadius, isCritical, isWarning]);

  const movesStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: 16,
    fontWeight: 'bold',
    fill: textColor,
  }), [textColor]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 9,
    fontWeight: 'normal',
    fill: color.text.secondary,
  }), []);

  return (
    <pixiContainer x={x} y={y + 4}>
      <pixiGraphics draw={drawPill} />
      <pixiText
        text={String(moves)}
        x={pillWidth / 2}
        y={pillHeight / 2 - 2}
        anchor={0.5}
        style={movesStyle}
      />
      <pixiText
        text="moves"
        x={pillWidth / 2}
        y={pillHeight - 4}
        anchor={{ x: 0.5, y: 1 }}
        style={labelStyle}
      />
    </pixiContainer>
  );
};

export default MovesCounter;
