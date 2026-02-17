import { useCallback, useMemo } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { color } from '@/pixi/design/tokens';
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
  const isSatisfied = (): boolean => {
    switch (constraint.type) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ClearLines:
      case ConstraintType.BreakBlocks:
      case ConstraintType.FillAndClear:
        return constraint.progress >= constraint.count;
      case ConstraintType.AchieveCombo:
      case ConstraintType.ClearGrid:
        return constraint.progress >= 1;
      case ConstraintType.NoBonusUsed:
        return !constraint.bonusUsed;
      default:
        return true;
    }
  };

  const isFailed = (): boolean => {
    return constraint.type === ConstraintType.NoBonusUsed && !!constraint.bonusUsed;
  };

  const getLabel = (): string => {
    switch (constraint.type) {
      case ConstraintType.None:
        return "";
      case ConstraintType.ClearLines:
        return `${constraint.value}+ lines`;
      case ConstraintType.BreakBlocks:
        return `Break size-${constraint.value}`;
      case ConstraintType.AchieveCombo:
        return `${constraint.value}+ combo`;
      case ConstraintType.FillAndClear:
        return `Row ${constraint.value}`;
      case ConstraintType.NoBonusUsed:
        return "No Bonus";
      case ConstraintType.ClearGrid:
        return "Clear Grid";
      default:
        return "";
    }
  };

  const satisfied = isSatisfied();
  const failed = isFailed();
  
  const bgColor = failed 
    ? color.status.dangerDark
    : satisfied 
      ? color.status.successDark
      : color.bg.primary;
  
  const textColor = failed
    ? color.status.dangerLight
    : satisfied
      ? color.status.successLight
      : color.text.secondary;
  
  const accentColor = failed
    ? color.status.danger
    : satisfied
      ? color.status.success
      : color.accent.blue;

  const cornerRadius = 4;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    g.roundRect(0, 0, width, height, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    g.roundRect(0, 0, width, height, cornerRadius);
    g.stroke({ color: accentColor, width: 1, alpha: 0.6 });
    
    const hasCountProgress = (
      constraint.type === ConstraintType.ClearLines ||
      constraint.type === ConstraintType.BreakBlocks ||
      constraint.type === ConstraintType.FillAndClear
    ) && constraint.count > 0 && constraint.count <= 10;
    
    if (hasCountProgress) {
      const dotSize = 4;
      const dotGap = 3;
      const totalWidth = constraint.count * dotSize + (constraint.count - 1) * dotGap;
      const startX = width - 6 - totalWidth;
      const dotY = height / 2;
      
      for (let i = 0; i < constraint.count; i++) {
        const dotX = startX + i * (dotSize + dotGap);
        const filled = i < constraint.progress;
        g.circle(dotX + dotSize / 2, dotY, dotSize / 2);
        g.fill({ color: filled ? accentColor : color.state.hover, alpha: filled ? 1 : 0.5 });
      }
    }
  }, [width, height, bgColor, accentColor, constraint.type, constraint.count, constraint.progress]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'bold',
    fill: textColor,
  }), [textColor]);

  if (constraint.type === ConstraintType.None) {
    return null;
  }

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
