import { useCallback, useRef, useEffect, useState } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { FONT_BODY } from '../../utils/colors';

interface ProgressBarProps {
  /** Current score/progress value */
  current: number;
  /** Target score to reach */
  target: number;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width of the progress bar */
  width: number;
  /** Height of the progress bar */
  height: number;
  /** Whether to show the score text */
  showScore?: boolean;
  /** Whether in danger state (progress going backwards) */
  isDanger?: boolean;
}

/**
 * Animated progress bar showing level completion progress
 */
export const ProgressBar = ({
  current,
  target,
  x,
  y,
  width,
  height,
  showScore = true,
  isDanger = false,
}: ProgressBarProps) => {
  const { colors } = usePixiTheme();
  
  // Animated fill width
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const targetProgress = Math.min(1, Math.max(0, current / target));
  
  // Animate progress changes
  useEffect(() => {
    const diff = targetProgress - animatedProgress;
    if (Math.abs(diff) < 0.001) {
      setAnimatedProgress(targetProgress);
      return;
    }
    
    const step = diff * 0.15; // Smooth easing
    const frame = requestAnimationFrame(() => {
      setAnimatedProgress(prev => prev + step);
    });
    
    return () => cancelAnimationFrame(frame);
  }, [targetProgress, animatedProgress]);

  const barHeight = height - 8;
  const cornerRadius = barHeight / 2;
  const innerPadding = 2;
  const innerHeight = barHeight - innerPadding * 2;
  const innerCornerRadius = innerHeight / 2;
  const fillWidth = Math.max(0, (width - innerPadding * 2) * animatedProgress);

  // Colors
  const bgColor = 0x0f172a;
  const fillColor = isDanger ? 0xef4444 : 0x3b82f6;
  const glowColor = isDanger ? 0xf87171 : 0x60a5fa;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Outer background
    g.roundRect(0, 0, width, barHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    // Subtle border
    g.roundRect(0, 0, width, barHeight, cornerRadius);
    g.stroke({ color: 0x1e293b, width: 1, alpha: 0.5 });
  }, [width, barHeight, cornerRadius]);

  const drawFill = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (fillWidth < innerCornerRadius * 2) {
      // Too small for rounded rect, draw circle
      if (fillWidth > 0) {
        g.circle(innerPadding + innerHeight / 2, innerPadding + innerHeight / 2, fillWidth / 2);
        g.fill({ color: fillColor });
      }
      return;
    }
    
    // Main fill
    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight, innerCornerRadius);
    g.fill({ color: fillColor });
    
    // Highlight (top gradient effect)
    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight / 2, innerCornerRadius);
    g.fill({ color: 0xffffff, alpha: 0.15 });
  }, [fillWidth, innerHeight, innerCornerRadius, innerPadding, fillColor]);

  const textStyle = new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: 'bold',
    fill: 0xffffff,
  });

  return (
    <pixiContainer x={x} y={y + 4}>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawFill} />
      
      {showScore && (
        <pixiText
          text={`${current} / ${target}`}
          x={width / 2}
          y={barHeight / 2}
          anchor={0.5}
          style={textStyle}
        />
      )}
    </pixiContainer>
  );
};

export default ProgressBar;
