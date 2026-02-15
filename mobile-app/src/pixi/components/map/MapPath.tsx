import { useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
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

type PathType = 'cleared' | 'active' | 'locked';

function getPathType(fromState: NodeState, toState: NodeState): PathType {
  if (fromState === 'cleared' && (toState === 'cleared' || toState === 'visited')) return 'cleared';
  if (fromState === 'cleared' && (toState === 'current' || toState === 'available')) return 'active';
  return 'locked';
}

function getPathStyle(pathType: PathType) {
  switch (pathType) {
    case 'cleared': return { color: PATH_COLOR_CLEARED, alpha: 0.8, width: 3 };
    case 'active': return { color: PATH_COLOR_ACTIVE, alpha: 0.8, width: 3 };
    case 'locked': return { color: PATH_COLOR_LOCKED, alpha: 0.35, width: 2 };
  }
}

function bezierPoint(
  fx: number, fy: number, tx: number, ty: number, t: number,
): { x: number; y: number } {
  const midY = (fy + ty) / 2;
  const u = 1 - t;
  const x = u * u * u * fx + 3 * u * u * t * fx + 3 * u * t * t * tx + t * t * t * tx;
  const y = u * u * u * fy + 3 * u * u * t * midY + 3 * u * t * t * midY + t * t * t * ty;
  return { x, y };
}

const ANT_DOT_COUNT = 6;
const ANT_DOT_RADIUS = 2;
const ANT_SPEED = 0.0008;

export const MapPath = ({ fromX, fromY, toX, toY, fromState, toState }: MapPathProps) => {
  const pathType = getPathType(fromState, toState);
  const style = getPathStyle(pathType);
  const needsAnimation = pathType === 'active' || pathType === 'cleared';

  const graphicsRef = useRef<PixiGraphics | null>(null);
  const timeRef = useRef(0);

  const tickPath = useCallback(
    (ticker: { deltaMS: number }) => {
      const g = graphicsRef.current;
      if (!g) return;

      timeRef.current += ticker.deltaMS;
      g.clear();

      if (pathType === 'locked') {
        const dx = toX - fromX;
        const dy = toY - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dashLen = 6;
        const gapLen = 5;
        const steps = Math.floor(dist / (dashLen + gapLen));

        for (let i = 0; i < steps; i++) {
          const startT = (i * (dashLen + gapLen)) / dist;
          const endT = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
          g.moveTo(fromX + dx * startT, fromY + dy * startT);
          g.lineTo(fromX + dx * endT, fromY + dy * endT);
        }
        g.stroke({ color: style.color, width: style.width, alpha: style.alpha, cap: 'round' });
        return;
      }

      const midY = (fromY + toY) / 2;

      if (pathType === 'cleared') {
        const shimmer = 0.7 + Math.sin(timeRef.current * 0.002) * 0.1;
        g.moveTo(fromX, fromY);
        g.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
        g.stroke({ color: style.color, width: style.width, alpha: shimmer, cap: 'round' });
        return;
      }

      g.moveTo(fromX, fromY);
      g.bezierCurveTo(fromX, midY, toX, midY, toX, toY);
      g.stroke({ color: style.color, width: style.width, alpha: style.alpha, cap: 'round' });

      const offset = (timeRef.current * ANT_SPEED) % 1;
      for (let i = 0; i < ANT_DOT_COUNT; i++) {
        const t = ((i / ANT_DOT_COUNT) + offset) % 1;
        const pt = bezierPoint(fromX, fromY, toX, toY, t);
        g.circle(pt.x, pt.y, ANT_DOT_RADIUS);
        g.fill({ color: PATH_COLOR_ACTIVE, alpha: 0.6 });
      }
    },
    [fromX, fromY, toX, toY, pathType, style],
  );
  useTick((ticker) => {
    if (!needsAnimation) return;
    tickPath(ticker);
  });

  const drawStatic = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dashLen = 6;
      const gapLen = 5;
      const steps = Math.floor(dist / (dashLen + gapLen));

      for (let i = 0; i < steps; i++) {
        const startT = (i * (dashLen + gapLen)) / dist;
        const endT = Math.min((i * (dashLen + gapLen) + dashLen) / dist, 1);
        g.moveTo(fromX + dx * startT, fromY + dy * startT);
        g.lineTo(fromX + dx * endT, fromY + dy * endT);
      }
      g.stroke({ color: style.color, width: style.width, alpha: style.alpha, cap: 'round' });
    },
    [fromX, fromY, toX, toY, style],
  );

  if (needsAnimation) {
    return (
      <pixiGraphics
        ref={(ref) => { graphicsRef.current = ref; }}
        draw={() => {}}
        eventMode="none"
      />
    );
  }

  return <pixiGraphics draw={drawStatic} eventMode="none" />;
};

export default MapPath;
