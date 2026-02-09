import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';

interface ComboDisplayProps {
  /** Current combo count */
  combo: number;
  /** Maximum combo achieved this run */
  maxCombo: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Height of the container */
  height: number;
}

/**
 * Displays current combo with fire animation effect
 */
export const ComboDisplay = ({
  combo,
  maxCombo,
  x,
  y,
  height,
}: ComboDisplayProps) => {
  const { colors } = usePixiTheme();
  
  const [animatedScale, setAnimatedScale] = useState(1);
  const [pulseAlpha, setPulseAlpha] = useState(0);
  const prevComboRef = useRef(combo);

  // Animate on combo change
  useEffect(() => {
    if (combo > prevComboRef.current && combo > 0) {
      // Combo increased - trigger animation
      setAnimatedScale(1.3);
      setPulseAlpha(1);
      
      const scaleTimer = setTimeout(() => setAnimatedScale(1), 150);
      const pulseTimer = setTimeout(() => setPulseAlpha(0), 300);
      
      return () => {
        clearTimeout(scaleTimer);
        clearTimeout(pulseTimer);
      };
    }
    prevComboRef.current = combo;
  }, [combo]);

  const containerWidth = 50;
  const containerHeight = height - 8;

  // Color based on combo size
  const getComboColor = () => {
    if (combo >= 7) return 0xffd700; // gold
    if (combo >= 5) return 0xff6b00; // orange
    if (combo >= 3) return 0xf97316; // light orange
    return 0x64748b;
  };

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (combo === 0) return;
    
    // Fire glow effect
    const glowColor = getComboColor();
    g.roundRect(-4, -4, containerWidth + 8, containerHeight + 8, 8);
    g.fill({ color: glowColor, alpha: pulseAlpha * 0.3 });
  }, [combo, containerWidth, containerHeight, pulseAlpha]);

  const comboColor = getComboColor();
  const comboStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: 18,
    fontWeight: 'bold',
    fill: comboColor,
    stroke: combo >= 3 ? { color: 0x000000, width: 2 } : undefined,
  }), [comboColor, combo]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 9,
    fontWeight: 'normal',
    fill: 0x94a3b8,
  }), []);

  if (combo === 0) {
    return null;
  }

  return (
    <pixiContainer x={x} y={y + 4}>
      <pixiGraphics draw={drawBackground} />
      
      <pixiContainer
        x={containerWidth / 2}
        y={containerHeight / 2 - 4}
        scale={animatedScale}
      >
        <pixiText
          text={`${combo}x`}
          anchor={0.5}
          style={comboStyle}
        />
      </pixiContainer>
      
      <pixiText
        text="COMBO"
        x={containerWidth / 2}
        y={containerHeight - 2}
        anchor={{ x: 0.5, y: 1 }}
        style={labelStyle}
      />
    </pixiContainer>
  );
};

export default ComboDisplay;
