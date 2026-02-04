import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { drawTargetIcon, drawMovesIcon, drawComboIcon, IconColors } from '../ui/Icons';
import { useAnimatedValue, usePulse, easings } from '../../hooks/useAnimatedValue';

interface GameHUDProps {
  score: number;
  targetScore: number;
  moves: number;
  maxMoves: number;
  combo: number;
  x: number;
  y: number;
  width: number;
  uiScale?: number;
  isInDanger?: boolean;
}

/**
 * Compact game HUD showing score, moves, and combo
 * Designed for mobile - sits below the level display
 * 
 * Layout: [Score/Target] [Moves] [Combo]
 */
export const GameHUD = ({
  score,
  targetScore,
  moves,
  maxMoves,
  combo,
  x,
  y,
  width,
  uiScale = 1,
  isInDanger = false,
}: GameHUDProps) => {
  const { colors, isProcedural } = usePixiTheme();

  // Animated score
  const animatedScore = useAnimatedValue(score, { duration: 300, easing: easings.easeOut });
  
  // Pulse when combo is active
  const comboPulse = usePulse(combo > 0, { minScale: 1.0, maxScale: 1.1, duration: 500 });
  
  // Danger pulse for low moves
  const dangerPulse = usePulse(isInDanger, { minScale: 1.0, maxScale: 1.05, duration: 300 });

  // Layout
  const itemHeight = Math.round(28 * uiScale);
  const itemGap = Math.round(8 * uiScale);
  const iconSize = Math.round(16 * uiScale);
  const padding = Math.round(8 * uiScale);
  
  // Calculate item widths
  const scoreWidth = Math.round(100 * uiScale);
  const movesWidth = Math.round(70 * uiScale);
  const comboWidth = Math.round(60 * uiScale);
  
  const totalWidth = scoreWidth + movesWidth + comboWidth + itemGap * 2;
  const startX = (width - totalWidth) / 2;

  // Progress bar for score
  const scoreProgress = Math.min(1, score / targetScore);

  const drawScoreItem = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Background
    g.roundRect(0, 0, scoreWidth, itemHeight, 6);
    g.fill({ color: isProcedural ? 0x1a1a2e : 0x1e293b, alpha: 0.9 });
    
    // Progress bar background
    const barX = iconSize + padding * 2;
    const barWidth = scoreWidth - barX - padding;
    const barHeight = 4;
    const barY = itemHeight - 8;
    
    g.roundRect(barX, barY, barWidth, barHeight, 2);
    g.fill({ color: 0x374151, alpha: 0.8 });
    
    // Progress bar fill
    g.roundRect(barX, barY, barWidth * scoreProgress, barHeight, 2);
    g.fill({ color: scoreProgress >= 1 ? 0x22c55e : 0x3b82f6 });
    
    // Border
    g.roundRect(0, 0, scoreWidth, itemHeight, 6);
    g.stroke({ color: isProcedural ? colors.accent : 0x475569, width: 1, alpha: 0.5 });
  }, [scoreWidth, itemHeight, iconSize, padding, isProcedural, colors.accent, scoreProgress]);

  const drawMovesItem = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const scale = isInDanger ? dangerPulse : 1;
    const scaledWidth = movesWidth * scale;
    const scaledHeight = itemHeight * scale;
    const offsetX = (movesWidth - scaledWidth) / 2;
    const offsetY = (itemHeight - scaledHeight) / 2;
    
    const bgColor = isInDanger ? 0x7f1d1d : (isProcedural ? 0x1a1a2e : 0x1e293b);
    const borderColor = isInDanger ? 0xef4444 : (isProcedural ? colors.accent : 0x475569);
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, 6);
    g.fill({ color: bgColor, alpha: 0.9 });
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, 6);
    g.stroke({ color: borderColor, width: 1, alpha: isInDanger ? 0.8 : 0.5 });
  }, [movesWidth, itemHeight, isProcedural, colors.accent, isInDanger, dangerPulse]);

  const drawComboItem = useCallback((g: PixiGraphics) => {
    g.clear();
    
    if (combo === 0) {
      // Hidden/dim when no combo
      g.roundRect(0, 0, comboWidth, itemHeight, 6);
      g.fill({ color: isProcedural ? 0x1a1a2e : 0x1e293b, alpha: 0.5 });
      return;
    }
    
    const scale = comboPulse;
    const scaledWidth = comboWidth * scale;
    const scaledHeight = itemHeight * scale;
    const offsetX = (comboWidth - scaledWidth) / 2;
    const offsetY = (itemHeight - scaledHeight) / 2;
    
    // Gradient-like glow for active combo
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, 6);
    g.fill({ color: 0x7c2d12, alpha: 0.9 });
    
    g.roundRect(offsetX, offsetY, scaledWidth, scaledHeight, 6);
    g.stroke({ color: 0xf97316, width: 1.5, alpha: 0.8 });
  }, [comboWidth, itemHeight, combo, comboPulse, isProcedural]);

  const drawScoreIcon = useCallback((g: PixiGraphics) => {
    drawTargetIcon(g, iconSize, IconColors.primary);
  }, [iconSize]);

  const drawMovesIconCb = useCallback((g: PixiGraphics) => {
    const color = isInDanger ? 0xfca5a5 : IconColors.primary;
    drawMovesIcon(g, iconSize, color);
  }, [iconSize, isInDanger]);

  const drawComboIconCb = useCallback((g: PixiGraphics) => {
    if (combo === 0) return;
    drawComboIcon(g, iconSize, 0xf97316);
  }, [iconSize, combo]);

  // Text styles
  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(13 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(9 * uiScale),
    fill: 0x94a3b8,
  }), [uiScale]);

  const comboStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold',
    fill: combo > 0 ? 0xfbbf24 : 0x6b7280,
  }), [uiScale, combo]);

  const dangerStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(13 * uiScale),
    fontWeight: 'bold',
    fill: isInDanger ? 0xfca5a5 : 0xffffff,
  }), [uiScale, isInDanger]);

  return (
    <pixiContainer x={x} y={y}>
      {/* Score Item */}
      <pixiContainer x={startX}>
        <pixiGraphics draw={drawScoreItem} />
        <pixiGraphics x={padding + iconSize / 2} y={itemHeight / 2 - 2} draw={drawScoreIcon} />
        <pixiText
          text={`${Math.round(animatedScore)}/${targetScore}`}
          x={iconSize + padding * 2}
          y={itemHeight / 2 - 5}
          anchor={{ x: 0, y: 0.5 }}
          style={valueStyle}
        />
      </pixiContainer>

      {/* Moves Item */}
      <pixiContainer x={startX + scoreWidth + itemGap}>
        <pixiGraphics draw={drawMovesItem} />
        <pixiGraphics x={padding + iconSize / 2} y={itemHeight / 2} draw={drawMovesIconCb} />
        <pixiText
          text={String(moves)}
          x={iconSize + padding * 1.5}
          y={itemHeight / 2}
          anchor={{ x: 0, y: 0.5 }}
          style={dangerStyle}
        />
      </pixiContainer>

      {/* Combo Item */}
      <pixiContainer x={startX + scoreWidth + movesWidth + itemGap * 2}>
        <pixiGraphics draw={drawComboItem} />
        {combo > 0 && (
          <>
            <pixiGraphics x={padding + iconSize / 2} y={itemHeight / 2} draw={drawComboIconCb} />
            <pixiText
              text={`x${combo}`}
              x={iconSize + padding * 1.5}
              y={itemHeight / 2}
              anchor={{ x: 0, y: 0.5 }}
              style={comboStyle}
            />
          </>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default GameHUD;
