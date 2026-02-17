import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';
import { color } from '@/pixi/design/tokens';

// Component-local combo threshold colors (kept local for combo milestone effects)
const COMBO_HIGH = 0xffd700;
const COMBO_MED = 0xff6b00;

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
  x,
  y,
  height,
}: ComboDisplayProps) => {
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

  const comboColor = useMemo(() => {
    if (combo >= 7) return COMBO_HIGH;
    if (combo >= 5) return COMBO_MED;
    if (combo >= 3) return color.accent.orange;
    return color.text.muted;
  }, [combo]);

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (combo === 0) return;
    
    g.roundRect(-4, -4, containerWidth + 8, containerHeight + 8, 8);
    g.fill({ color: comboColor, alpha: pulseAlpha * 0.3 });
  }, [combo, containerWidth, containerHeight, pulseAlpha, comboColor]);
  const comboStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: 18,
    fontWeight: 'bold',
    fill: comboColor,
    stroke: combo >= 3 ? { color: color.bg.overlay, width: 2 } : undefined,
  }), [comboColor, combo]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 9,
    fontWeight: 'normal',
    fill: color.text.secondary,
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
