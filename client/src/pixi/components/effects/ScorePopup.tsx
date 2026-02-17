import { useCallback, useRef } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { color } from '@/pixi/design/tokens';

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

export const ScorePopup = ({ gridWidth: _gridWidth, gridHeight: _gridHeight, gridSize: _gridSize }: ScorePopupProps) => {
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
      g.setFillStyle({ color: color.bg.overlay, alpha: p.alpha * 0.5 });
      g.roundRect(p.x - textW / 2 - 4, p.y - textH / 2 - 2, textW + 8, textH + 4, 4);
      g.fill();

      g.setFillStyle({ color: p.color, alpha: p.alpha * 0.8 });
      g.roundRect(p.x - textW / 2 - 4, p.y - textH / 2 - 2, 3, textH + 4, 2);
      g.fill();
    }
  }, []);

  useTick(tickCallback);

  const captureRef = useCallback((g: PixiGraphics) => {
    graphicsRef.current = g;
    g.clear();
  }, []);

  return (
    <pixiGraphics draw={captureRef} eventMode="none" />
  );
};

export default ScorePopup;
