import { useState, useCallback, useRef, useMemo } from 'react';
import { TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';
import { FONT_BOLD } from '../../utils/colors';

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

// Cache TextStyle instances per color to avoid recreation on every render
const styleCache = new Map<number, TextStyle>();
function getPopupStyle(color: number): TextStyle {
  let style = styleCache.get(color);
  if (!style) {
    style = new TextStyle({
      fontFamily: FONT_BOLD,
      fontSize: 24,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: 0x000000, width: 4 },
    });
    styleCache.set(color, style);
  }
  return style;
}

interface ScorePopupProps {
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
}

export const ScorePopup = ({ gridWidth, gridHeight, gridSize }: ScorePopupProps) => {
  const { colors } = usePixiTheme();
  const { prefersReducedMotion } = usePerformanceSettings();

  const [popups, setPopups] = useState<PopupData[]>([]);
  const idRef = useRef(0);

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    setPopups(prev => {
      if (prev.length === 0) return prev;

      const dt = ticker.deltaMS / 16.667;
      const updated = prev
        .map(p => ({
          ...p,
          y: p.y + p.vy * dt,
          vy: p.vy - 0.1 * dt,
          scale: p.scale + 0.01 * dt,
          alpha: Math.max(0, p.alpha - 0.02 * dt),
          life: p.life - dt,
        }))
        .filter(p => p.life > 0 && p.alpha > 0);

      return updated;
    });
  }, []);

  useTick(tickCallback);

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
      vy: -3,
      life: 60,
    };

    setPopups(prev => [...prev, popup]);
  }, [prefersReducedMotion]);

  const showScore = useCallback((points: number, y: number) => {
    const x = (gridWidth * gridSize) / 2;
    const adjustedY = y * gridSize;
    addPopup(x, adjustedY, `+${points}`, colors.accent);
  }, [addPopup, colors.accent, gridSize, gridWidth]);

  const showCombo = useCallback((combo: number, y: number) => {
    const x = (gridWidth * gridSize) / 2;
    const adjustedY = y * gridSize;

    let text = '';
    let color = colors.accent;

    if (combo >= 7) {
      text = 'INCREDIBLE!';
      color = 0xFFD700;
    } else if (combo >= 5) {
      text = 'AMAZING!';
      color = 0xFF00FF;
    } else if (combo >= 3) {
      text = 'NICE!';
      color = 0x00FF88;
    } else {
      text = `${combo}x COMBO`;
    }

    addPopup(x, adjustedY, text, color);
  }, [addPopup, colors.accent, gridSize, gridWidth]);

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
          style={getPopupStyle(popup.color)}
          eventMode="none"
        />
      ))}
    </>
  );
};

export default ScorePopup;
