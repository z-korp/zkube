import { useCallback } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

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
  maxMoves,
  x,
  y,
  height,
  warningThreshold = 5,
  criticalThreshold = 3,
}: MovesCounterProps) => {
  const { colors } = usePixiTheme();

  const pillHeight = height - 8;
  const pillWidth = 64;
  const cornerRadius = pillHeight / 2;

  // Determine color based on remaining moves
  const isWarning = moves <= warningThreshold && moves > criticalThreshold;
  const isCritical = moves <= criticalThreshold;
  
  const bgColor = isCritical 
    ? 0x7f1d1d // dark red
    : isWarning 
      ? 0x78350f // dark orange
      : 0x1e293b;
  
  const textColor = isCritical
    ? 0xfca5a5 // light red
    : isWarning
      ? 0xfcd34d // light orange
      : 0xffffff;

  const drawPill = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, pillWidth, pillHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.95 });
    
    // Border
    const borderColor = isCritical 
      ? 0xef4444 
      : isWarning 
        ? 0xf97316 
        : 0x475569;
    g.roundRect(0, 0, pillWidth, pillHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1.5, alpha: isCritical || isWarning ? 1 : 0.5 });
  }, [bgColor, pillWidth, pillHeight, cornerRadius, isCritical, isWarning]);

  const movesStyle = new TextStyle({
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'bold',
    fill: textColor,
  });

  const labelStyle = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 9,
    fontWeight: 'normal',
    fill: 0x94a3b8,
  });

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
