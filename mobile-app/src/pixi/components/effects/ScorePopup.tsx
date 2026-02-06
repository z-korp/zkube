import { useState, useCallback, useEffect, useRef } from 'react';
import { TextStyle } from 'pixi.js';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';

interface PopupData {
  id: number;
  x: number;
  y: number;
  text: string;
  color: number;
  scale: number;
  alpha: number;
  vy: number;
  life: number;
}

interface ScorePopupProps {
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
}

/**
 * Displays floating score popups when lines are cleared
 */
export const ScorePopup = ({ gridWidth, gridHeight, gridSize }: ScorePopupProps) => {
  const { colors } = usePixiTheme();
  const { prefersReducedMotion } = usePerformanceSettings();
  
  const [popups, setPopups] = useState<PopupData[]>([]);
  const idRef = useRef(0);
  const frameRef = useRef<number>();

  // Animation loop
  useEffect(() => {
    if (popups.length === 0) return;
    
    const animate = () => {
      setPopups(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            y: p.y + p.vy,
            vy: p.vy - 0.1, // decelerate upward
            scale: p.scale + 0.01, // grow slightly
            alpha: Math.max(0, p.alpha - 0.02),
            life: p.life - 1,
          }))
          .filter(p => p.life > 0 && p.alpha > 0);
        
        return updated;
      });
      
      if (popups.length > 0) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [popups.length]);

  // Add a new popup
  const addPopup = useCallback((
    x: number, 
    y: number, 
    text: string, 
    color?: number
  ) => {
    if (prefersReducedMotion) return;
    
    const popup: PopupData = {
      id: idRef.current++,
      x,
      y,
      text,
      color: color ?? 0xFFFFFF,
      scale: 1,
      alpha: 1,
      vy: -3, // initial upward velocity
      life: 60, // ~1 second at 60fps
    };
    
    setPopups(prev => [...prev, popup]);
  }, [prefersReducedMotion]);

  // Preset for score popup
  const showScore = useCallback((points: number, y: number) => {
    const x = (gridWidth * gridSize) / 2;
    const adjustedY = y * gridSize;
    addPopup(x, adjustedY, `+${points}`, colors.accent);
  }, [addPopup, colors.accent, gridSize, gridWidth]);

  // Preset for combo popup
  const showCombo = useCallback((combo: number, y: number) => {
    const x = (gridWidth * gridSize) / 2;
    const adjustedY = y * gridSize;
    
    let text = '';
    let color = colors.accent;
    
    if (combo >= 7) {
      text = 'INCREDIBLE!';
      color = 0xFFD700; // gold
    } else if (combo >= 5) {
      text = 'AMAZING!';
      color = 0xFF00FF; // magenta
    } else if (combo >= 3) {
      text = 'NICE!';
      color = 0x00FF88; // green
    } else {
      text = `${combo}x COMBO`;
    }
    
    addPopup(x, adjustedY, text, color);
  }, [addPopup, colors.accent, gridSize, gridWidth]);

  // Store methods globally for access
  useEffect(() => {
    (window as any).__scorePopup = { addPopup, showScore, showCombo };
    
    return () => {
      delete (window as any).__scorePopup;
    };
  }, [addPopup, showScore, showCombo]);

  // Text style
  const textStyle = new TextStyle({
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0xFFFFFF,
    stroke: { color: 0x000000, width: 4 },
    dropShadow: undefined,
  });

  if (popups.length === 0) {
    return null;
  }

  return (
    <>
      {popups.map(popup => (
        <pixiText
          key={popup.id}
          text={popup.text}
          x={popup.x}
          y={popup.y}
          anchor={0.5}
          scale={popup.scale}
          alpha={popup.alpha}
          style={{
            ...textStyle,
            fill: popup.color,
          }}
        />
      ))}
    </>
  );
};

/**
 * Hook to access score popup methods
 */
export function useScorePopup() {
  return (window as any).__scorePopup || null;
}

export default ScorePopup;
