import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { usePulse, useGlow } from '../../hooks/useAnimatedValue';
import { FONT_BOLD, FONT_BODY } from '../../utils/colors';

interface MovesPanelProps {
  moves: number;
  maxMoves: number;
  combo: number;
  maxCombo: number;
  x: number;
  y: number;
  width: number;
  height: number;
  uiScale?: number;
  isInDanger?: boolean;
}

/**
 * Right side panel showing moves and combo (desktop only)
 * 
 * Layout:
 * ┌─────────┐
 * │  MOVES  │
 * │   26    │
 * │         │
 * │  COMBO  │
 * │   🔥 5  │
 * │  MAX: 8 │
 * └─────────┘
 */
export const MovesPanel = ({
  moves,
  maxMoves,
  combo,
  maxCombo,
  x,
  y,
  width,
  height,
  uiScale = 1,
  isInDanger = false,
}: MovesPanelProps) => {
  const { colors } = usePixiTheme();

  // Track combo changes for animation
  const prevComboRef = useRef(combo);
  const [comboIncreased, setComboIncreased] = useState(false);
  
  useEffect(() => {
    if (combo > prevComboRef.current) {
      setComboIncreased(true);
      const timer = setTimeout(() => setComboIncreased(false), 500);
      return () => clearTimeout(timer);
    }
    prevComboRef.current = combo;
  }, [combo]);

  // Pulse animation for combo when active
  const comboPulse = usePulse(combo > 0, { minScale: 1.0, maxScale: 1.15, duration: 800 });
  
  // Glow effect when combo increases
  const comboGlow = useGlow(comboIncreased, { duration: 150, fadeOut: 350 });

  // Danger pulse for low moves
  const dangerPulse = usePulse(isInDanger, { minScale: 1.0, maxScale: 1.08, duration: 500 });

  const padding = Math.round(8 * uiScale);
  const cornerRadius = Math.round(8 * uiScale);
  const sectionHeight = height / 2;

  // Draw panel background
  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Main background
    g.roundRect(0, 0, width, height, cornerRadius);
    g.fill({ color: 0x0f172a, alpha: 0.85 });
    
    const borderColor = isInDanger 
      ? 0xef4444 
      : 0x334155;
    g.roundRect(0, 0, width, height, cornerRadius);
    g.stroke({ color: borderColor, width: isInDanger ? 2 : 1.5, alpha: isInDanger ? 0.8 : 0.5 });
    
    // Danger glow
    if (isInDanger) {
      g.roundRect(2, 2, width - 4, height - 4, cornerRadius - 2);
      g.stroke({ color: 0xef4444, width: 3, alpha: 0.2 });
    }
    
    // Divider line
    g.moveTo(padding, sectionHeight);
    g.lineTo(width - padding, sectionHeight);
    g.stroke({ color: 0x334155, width: 1, alpha: 0.3 });
  }, [width, height, cornerRadius, isInDanger, sectionHeight, padding]);

  // Draw combo flame icon with glow effect
  const drawFlame = useCallback((g: PixiGraphics, cx: number, cy: number, size: number) => {
    g.clear();
    
    if (combo === 0) return;
    
    // Simple flame shape
    const flameColor = combo >= 5 ? 0xef4444 : (combo >= 3 ? 0xf97316 : 0xfbbf24);
    
    // Glow effect when combo increases
    if (comboGlow > 0) {
      const glowSize = size * (1 + comboGlow * 0.3);
      g.circle(cx, cy, glowSize * 0.6);
      g.fill({ color: flameColor, alpha: comboGlow * 0.3 });
    }
    
    // Outer flame
    g.moveTo(cx, cy - size * 0.5);
    g.quadraticCurveTo(cx + size * 0.4, cy - size * 0.2, cx + size * 0.3, cy + size * 0.3);
    g.quadraticCurveTo(cx + size * 0.1, cy + size * 0.1, cx, cy + size * 0.5);
    g.quadraticCurveTo(cx - size * 0.1, cy + size * 0.1, cx - size * 0.3, cy + size * 0.3);
    g.quadraticCurveTo(cx - size * 0.4, cy - size * 0.2, cx, cy - size * 0.5);
    g.fill({ color: flameColor, alpha: 0.9 });
    
    // Inner glow
    g.moveTo(cx, cy - size * 0.25);
    g.quadraticCurveTo(cx + size * 0.15, cy, cx + size * 0.1, cy + size * 0.2);
    g.quadraticCurveTo(cx, cy + size * 0.1, cx - size * 0.1, cy + size * 0.2);
    g.quadraticCurveTo(cx - size * 0.15, cy, cx, cy - size * 0.25);
    g.fill({ color: 0xfef3c7, alpha: 0.8 });
  }, [combo, comboGlow]);

  // Text styles
  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fontWeight: 'bold',
    fill: 0x94a3b8,
    letterSpacing: 1,
  }), [uiScale]);

  const movesStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(24 * uiScale),
    fontWeight: 'bold',
    fill: isInDanger ? 0xef4444 : 0xffffff,
  }), [uiScale, isInDanger]);

  const comboStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(18 * uiScale),
    fontWeight: 'bold',
    fill: combo > 0 ? 0xfbbf24 : 0x64748b,
  }), [uiScale, combo]);

  const maxComboStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(9 * uiScale),
    fill: 0x64748b,
  }), [uiScale]);

  return (
    <pixiContainer x={x} y={y}>
      {/* Background */}
      <pixiGraphics draw={drawBackground} />
      
      {/* MOVES Section */}
      <pixiContainer
        x={width / 2}
        y={sectionHeight / 2}
        pivot={{ x: 0, y: 0 }}
        scale={{ x: isInDanger ? dangerPulse : 1, y: isInDanger ? dangerPulse : 1 }}
      >
        <pixiText
          text="MOVES"
          x={0}
          y={-sectionHeight / 2 + padding + 4}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
        />
        
        <pixiText
          text={String(moves)}
          x={0}
          y={8 * uiScale}
          anchor={{ x: 0.5, y: 0.5 }}
          style={movesStyle}
        />
      </pixiContainer>
      
      {/* COMBO Section */}
      <pixiContainer y={sectionHeight}>
        <pixiText
          text="COMBO"
          x={width / 2}
          y={padding + 4}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
        />
        
        {/* Flame + combo number with pulse animation */}
        <pixiContainer 
          x={width / 2}
          y={sectionHeight / 2 - 4 * uiScale + 10 * uiScale}
          pivot={{ x: 0, y: 0 }}
          scale={{ x: combo > 0 ? comboPulse : 1, y: combo > 0 ? comboPulse : 1 }}
        >
          {combo > 0 && (
            <pixiGraphics
              x={-20 * uiScale - (combo > 0 ? 6 * uiScale : 0)}
              y={-10 * uiScale}
              draw={(g) => drawFlame(g, 10 * uiScale, 10 * uiScale, 16 * uiScale)}
            />
          )}
          <pixiText
            text={combo > 0 ? `x${combo}` : '-'}
            x={combo > 0 ? 6 * uiScale : 0}
            y={0}
            anchor={{ x: 0.5, y: 0.5 }}
            style={comboStyle}
          />
        </pixiContainer>
        
        {/* Max combo */}
        <pixiText
          text={`MAX: ${maxCombo}`}
          x={width / 2}
          y={sectionHeight - padding - 4}
          anchor={{ x: 0.5, y: 1 }}
          style={maxComboStyle}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default MovesPanel;
