import { useCallback, useRef } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';

interface PopupData {
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

export const ScorePopup = ({ gridWidth, gridHeight, gridSize }: ScorePopupProps) => {
  const { colors } = usePixiTheme();
  const { prefersReducedMotion } = usePerformanceSettings();

  const popupsRef = useRef<PopupData[]>([]);
  const graphicsRef = useRef<PixiGraphics | null>(null);

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const ps = popupsRef.current;
    if (ps.length === 0) return;

    const dt = ticker.deltaMS / 16.667;

    let writeIdx = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.y += p.vy * dt;
      p.vy -= 0.1 * dt;
      p.scale += 0.01 * dt;
      p.alpha = Math.max(0, p.alpha - 0.02 * dt);
      p.life -= dt;

      if (p.life > 0 && p.alpha > 0) {
        ps[writeIdx++] = p;
      }
    }
    ps.length = writeIdx;

    const g = graphicsRef.current;
    if (!g) return;

    g.clear();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const fontSize = 24 * p.scale;

      const textW = p.text.length * fontSize * 0.5;
      const textH = fontSize;
      g.setFillStyle({ color: 0x000000, alpha: p.alpha * 0.5 });
      g.roundRect(p.x - textW / 2 - 4, p.y - textH / 2 - 2, textW + 8, textH + 4, 4);
      g.fill();

      g.setFillStyle({ color: p.color, alpha: p.alpha * 0.8 });
      g.roundRect(p.x - textW / 2 - 4, p.y - textH / 2 - 2, 3, textH + 4, 2);
      g.fill();
    }
  }, []);

  useTick(tickCallback);

  const addPopup = useCallback((
    x: number,
    y: number,
    text: string,
    color?: number
  ) => {
    if (prefersReducedMotion) return;

    popupsRef.current.push({
      x,
      y,
      text,
      color: color ?? 0xFFFFFF,
      scale: 1,
      alpha: 1,
      vy: -3,
      life: 60,
    });
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

  const captureRef = useCallback((g: PixiGraphics) => {
    graphicsRef.current = g;
    g.clear();
  }, []);

  return (
    <pixiGraphics draw={captureRef} eventMode="none" />
  );
};

export default ScorePopup;
