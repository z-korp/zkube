import { useCallback, useMemo } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { color } from '@/pixi/design/tokens';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';

interface LevelBadgeProps {
  level: number;
  x: number;
  y: number;
  height: number;
}

/**
 * Displays the current level in a styled badge
 */
export const LevelBadge = ({ level, x, y, height }: LevelBadgeProps) => {
  const badgeWidth = 56;
  const badgeHeight = height - 8;
  const cornerRadius = 6;

  const drawBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, badgeWidth, badgeHeight, cornerRadius);
    g.fill({ color: color.bg.surface, alpha: 0.95 });
    
    // Border
    g.roundRect(0, 0, badgeWidth, badgeHeight, cornerRadius);
    g.stroke({ color: color.state.hover, width: 1.5, alpha: 0.8 });
  }, [badgeWidth, badgeHeight]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 11,
    fontWeight: 'bold',
    fill: color.text.secondary,
    letterSpacing: 1,
  }), []);

  const levelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: 16,
    fontWeight: 'bold',
    fill: color.text.primary,
  }), []);

  return (
    <pixiContainer x={x} y={y + 4}>
      <pixiGraphics draw={drawBadge} />
      <pixiText
        text="LVL"
        x={badgeWidth / 2}
        y={6}
        anchor={{ x: 0.5, y: 0 }}
        style={textStyle}
      />
      <pixiText
        text={String(level)}
        x={badgeWidth / 2}
        y={badgeHeight - 6}
        anchor={{ x: 0.5, y: 1 }}
        style={levelStyle}
      />
    </pixiContainer>
  );
};

export default LevelBadge;
