import { useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import type { NodeState } from '../../hooks/useMapData';

export interface MapPathProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromState: NodeState;
  toState: NodeState;
}

const PATH_COLOR_CLEARED = 0x22c55e;
const PATH_COLOR_ACTIVE = 0xf97316;
const PATH_COLOR_LOCKED = 0x4b5563;

function getPathStyle(fromState: NodeState, toState: NodeState) {
  if (fromState === 'cleared' && (toState === 'cleared' || toState === 'visited')) {
    return { color: PATH_COLOR_CLEARED, alpha: 0.8, width: 3, dashed: false };
  }
  if (fromState === 'cleared' && (toState === 'current' || toState === 'available')) {
    return { color: PATH_COLOR_ACTIVE, alpha: 0.8, width: 3, dashed: false };
  }
  return { color: PATH_COLOR_LOCKED, alpha: 0.35, width: 2, dashed: true };
}

export const MapPath = ({ fromX, fromY, toX, toY, fromState, toState }: MapPathProps) => {
  const style = getPathStyle(fromState, toState);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      if (style.dashed) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dashLen = 6;
        const gapLen = 5;
        const steps = Math.floor(dist / (dashLen + gapLen));
        const nx = dx / dist;
        const ny = dy / dist;

        for (let i = 0; i < steps; i++) {
          const startT = (i * (dashLen + gapLen)) / dist;
          const endT = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
          g.moveTo(fromX + dx * startT, fromY + dy * startT);
          g.lineTo(fromX + dx * endT, fromY + dy * endT);
        }
        g.stroke({ color: style.color, width: style.width, alpha: style.alpha, cap: 'round' });
      } else {
        const midY = (fromY + toY) / 2;
        g.moveTo(fromX, fromY);
        g.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
        g.stroke({ color: style.color, width: style.width, alpha: style.alpha, cap: 'round' });
      }
    },
    [fromX, fromY, toX, toY, style],
  );

  return <pixiGraphics draw={draw} eventMode="none" />;
};

export default MapPath;
