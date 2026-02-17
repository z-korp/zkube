import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { useAnimatedValue, easings } from '../../hooks/useAnimatedValue';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';
import { color } from '@/pixi/design/tokens';

interface ScorePanelProps {
  score: number;
  targetScore: number;
  x: number;
  y: number;
  width: number;
  height: number;
  uiScale?: number;
}

/**
 * Left side panel showing score and progress (desktop only)
 * Features animated score counter and smooth progress bar
 * 
 * Layout:
 * ┌─────────┐
 * │  SCORE  │
 * │   45    │
 * │ ████░░░ │  <- vertical progress bar
 * │  / 60   │
 * └─────────┘
 */
export const ScorePanel = ({
  score,
  targetScore,
  x,
  y,
  width,
  height,
  uiScale = 1,
}: ScorePanelProps) => {
  // Animated score counter
  const displayScore = useAnimatedValue(score, {
    duration: 400,
    easing: easings.easeOut,
  });

  const padding = Math.round(8 * uiScale);
  const progressBarWidth = Math.round(12 * uiScale);
  const progressBarHeight = height - 100 * uiScale;
  const cornerRadius = Math.round(8 * uiScale);

  // Calculate progress percentage (using animated score for smooth bar)
  const progress = targetScore > 0 ? Math.min(1, displayScore / targetScore) : 0;

  // Draw panel background
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Main background
    g.roundRect(0, 0, width, height, cornerRadius);
    g.fill({ color: color.bg.secondary, alpha: 0.85 });
    
    g.roundRect(0, 0, width, height, cornerRadius);
    g.stroke({ color: color.bg.surface, width: 1.5, alpha: 0.5 });
    
    // Inner highlight
    g.roundRect(1, 1, width - 2, height / 3, cornerRadius);
    g.fill({ color: color.text.primary, alpha: 0.03 });
  }, [width, height, cornerRadius]);

  // Draw progress bar (vertical)
  const drawProgressBar = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const barX = (width - progressBarWidth) / 2;
    const barY = 0;
    
    // Background track
    g.roundRect(barX, barY, progressBarWidth, progressBarHeight, progressBarWidth / 2);
    g.fill({ color: color.bg.primary, alpha: 0.8 });
    
    // Progress fill (from bottom up)
    const fillHeight = progressBarHeight * progress;
    if (fillHeight > 0) {
      g.roundRect(
        barX, 
        barY + progressBarHeight - fillHeight, 
        progressBarWidth, 
        fillHeight, 
        progressBarWidth / 2
      );
      
      // Color based on progress
      let fillColor = color.accent.blue;
      if (progress >= 1) {
        fillColor = color.status.success;
      } else if (progress >= 0.75) {
        fillColor = color.accent.gold;
      }
      
      g.fill({ color: fillColor, alpha: 0.9 });
      
      // Glow effect
      g.roundRect(
        barX + 2, 
        barY + progressBarHeight - fillHeight + 2, 
        progressBarWidth - 4, 
        Math.max(0, fillHeight - 4), 
        (progressBarWidth - 4) / 2
      );
      g.fill({ color: color.text.primary, alpha: 0.2 });
    }
  }, [width, progressBarWidth, progressBarHeight, progress]);

  // Text styles
  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fontWeight: 'bold',
    fill: color.text.secondary,
    letterSpacing: 1,
  }), [uiScale]);

  const scoreStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(20 * uiScale),
    fontWeight: 'bold',
    fill: color.text.primary,
  }), [uiScale]);

  const targetStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(11 * uiScale),
    fill: color.text.muted,
  }), [uiScale]);

  return (
    <pixiContainer x={x} y={y}>
      {/* Background */}
      <pixiGraphics draw={drawBackground} />
      
      {/* SCORE label */}
      <pixiText
        text="SCORE"
        x={width / 2}
        y={padding + 4}
        anchor={{ x: 0.5, y: 0 }}
        style={labelStyle}
      />
      
      {/* Current score (animated) */}
      <pixiText
        text={String(displayScore)}
        x={width / 2}
        y={padding + 22 * uiScale}
        anchor={{ x: 0.5, y: 0 }}
        style={scoreStyle}
      />
      
      {/* Progress bar */}
      <pixiContainer y={padding + 50 * uiScale}>
        <pixiGraphics draw={drawProgressBar} />
      </pixiContainer>
      
      {/* Target score */}
      <pixiText
        text={`/ ${targetScore}`}
        x={width / 2}
        y={height - padding - 4}
        anchor={{ x: 0.5, y: 1 }}
        style={targetStyle}
      />
    </pixiContainer>
  );
};

export default ScorePanel;
