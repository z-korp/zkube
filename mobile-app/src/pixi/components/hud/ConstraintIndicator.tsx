import { useCallback, useMemo } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { FONT_BODY } from '../../utils/colors';

export interface ConstraintData {
  type: ConstraintType;
  value: number;
  count: number;
  progress: number;
  bonusUsed?: boolean;
}

interface ConstraintIndicatorProps {
  constraint: ConstraintData;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Displays constraint progress (e.g., "Clear 3+ lines: 1/2")
 */
export const ConstraintIndicator = ({
  constraint,
  x,
  y,
  width,
  height,
}: ConstraintIndicatorProps) => {
  const { colors } = usePixiTheme();

  // Determine if constraint is satisfied
  const isSatisfied = (): boolean => {
    switch (constraint.type) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ClearLines:
        return constraint.progress >= constraint.count;
      case ConstraintType.NoBonusUsed:
        return !constraint.bonusUsed;
      default:
        return true;
    }
  };

  // Determine if constraint is failed (for NoBonusUsed)
  const isFailed = (): boolean => {
    if (constraint.type === ConstraintType.NoBonusUsed && constraint.bonusUsed) {
      return true;
    }
    return false;
  };

  // Get label text
  const getLabel = (): string => {
    switch (constraint.type) {
      case ConstraintType.None:
        return "";
      case ConstraintType.ClearLines:
        return `${constraint.value}+ lines`;
      case ConstraintType.NoBonusUsed:
        return "No Bonus";
      default:
        return "";
    }
  };

  // Get progress text
  const getProgress = (): string => {
    switch (constraint.type) {
      case ConstraintType.ClearLines:
        return `${constraint.progress}/${constraint.count}`;
      case ConstraintType.NoBonusUsed:
        return constraint.bonusUsed ? "FAILED" : "OK";
      default:
        return "";
    }
  };

  if (constraint.type === ConstraintType.None) {
    return null;
  }

  const satisfied = isSatisfied();
  const failed = isFailed();
  
  const bgColor = failed 
    ? 0x7f1d1d 
    : satisfied 
      ? 0x14532d 
      : 0x1e293b;
  
  const textColor = failed
    ? 0xfca5a5
    : satisfied
      ? 0x86efac
      : 0x94a3b8;
  
  const accentColor = failed
    ? 0xef4444
    : satisfied
      ? 0x22c55e
      : 0x3b82f6;

  const cornerRadius = 4;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, width, height, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    // Border
    g.roundRect(0, 0, width, height, cornerRadius);
    g.stroke({ color: accentColor, width: 1, alpha: 0.6 });
    
    // Progress indicator (small dots or bar)
    if (constraint.type === ConstraintType.ClearLines && constraint.count > 0) {
      const dotSize = 4;
      const dotGap = 3;
      const totalWidth = constraint.count * dotSize + (constraint.count - 1) * dotGap;
      const startX = width - 6 - totalWidth;
      const dotY = height / 2;
      
      for (let i = 0; i < constraint.count; i++) {
        const dotX = startX + i * (dotSize + dotGap);
        const filled = i < constraint.progress;
        g.circle(dotX + dotSize / 2, dotY, dotSize / 2);
        g.fill({ color: filled ? accentColor : 0x475569, alpha: filled ? 1 : 0.5 });
      }
    }
  }, [width, height, bgColor, accentColor, constraint.type, constraint.count, constraint.progress]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: textColor,
  }), [textColor]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
      <pixiText
        text={getLabel()}
        x={6}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={labelStyle}
      />
    </pixiContainer>
  );
};

export default ConstraintIndicator;
