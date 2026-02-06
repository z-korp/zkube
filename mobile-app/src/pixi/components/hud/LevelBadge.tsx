import { useCallback } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

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
  const { colors } = usePixiTheme();

  const badgeWidth = 56;
  const badgeHeight = height - 8;
  const cornerRadius = 6;

  const drawBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, badgeWidth, badgeHeight, cornerRadius);
    g.fill({ color: 0x334155, alpha: 0.95 });
    
    // Border
    g.roundRect(0, 0, badgeWidth, badgeHeight, cornerRadius);
    g.stroke({ color: 0x475569, width: 1.5, alpha: 0.8 });
  }, [badgeWidth, badgeHeight]);

  const textStyle = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    fontWeight: 'bold',
    fill: 0x94a3b8,
    letterSpacing: 1,
  });

  const levelStyle = new TextStyle({
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'bold',
    fill: 0xffffff,
  });

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
