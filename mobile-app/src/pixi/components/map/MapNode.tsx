/**
 * MapNode - A single node on the progression map
 *
 * Visual states:
 *  - locked:    dimmed, no interaction
 *  - cleared:   fully lit, checkmark, theme-colored ring
 *  - current:   pulsing glow, highlighted
 *  - available: bright, tappable
 *  - visited:   semi-lit (shop only)
 *
 * Node types:
 *  - classic:   circle with level number
 *  - shop:      rounded-rect with bag icon
 *  - boss:      large circle with skull/crown icon
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle, Container } from 'pixi.js';
import { useTick } from '@pixi/react';
import type { MapNodeData, NodeState } from '../../hooks/useMapData';
import { getThemeColors, FONT_BOLD, UI } from '../../utils/colors';
import { usePulseRef } from '../../hooks/useAnimatedValue';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NODE_RADIUS = 22;
const BOSS_RADIUS = 28;
const SHOP_W = 48;
const SHOP_H = 40;
const STAR_YELLOW = 0xfbbf24;
const STAR_GRAY = 0x4b5563;
// Node state colors
const STATE_COLORS: Record<NodeState, { fill: number; border: number; alpha: number; textAlpha: number }> = {
  locked:    { fill: 0x374151, border: 0x4b5563, alpha: 0.5, textAlpha: 0.4 },
  cleared:   { fill: 0x166534, border: 0x22c55e, alpha: 1, textAlpha: 1 },
  current:   { fill: 0x1e3a5f, border: 0x3b82f6, alpha: 1, textAlpha: 1 },
  available: { fill: 0x1e293b, border: 0xf97316, alpha: 1, textAlpha: 1 },
  visited:   { fill: 0x1e3a2e, border: 0x4ade80, alpha: 0.8, textAlpha: 0.8 },
};

// ============================================================================
// PROPS
// ============================================================================

export interface MapNodeProps {
  node: MapNodeData;
  x: number;
  y: number;
  onTap?: (node: MapNodeData) => void;
  entryDelay?: number;
}

// ============================================================================
// CLASSIC NODE
// ============================================================================

const ClassicNode = ({ node, x, y, onTap, entryDelay = 0 }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'current' || node.state === 'available' || node.state === 'cleared';
  const colors = STATE_COLORS[node.state];
  const themeColors = getThemeColors(node.zoneTheme);

  const { containerRef: pulseRef } = usePulseRef(node.state === 'current', {
    minScale: 0.97,
    maxScale: 1.05,
    duration: 1200,
  });

  const glowRef = useRef<PixiGraphics | null>(null);
  const entryRef = useRef({ elapsed: 0, done: entryDelay <= 0 });
  const outerRef = useRef<Container | null>(null);

  const tickAnimations = useCallback(
    (ticker: { deltaMS: number }) => {
      if (!entryRef.current.done) {
        entryRef.current.elapsed += ticker.deltaMS;
        const c = outerRef.current;
        if (c) {
          if (entryRef.current.elapsed < entryDelay) {
            c.alpha = 0;
          } else {
            const fadeProgress = Math.min((entryRef.current.elapsed - entryDelay) / 300, 1);
            c.alpha = fadeProgress * colors.alpha;
            if (fadeProgress >= 1) entryRef.current.done = true;
          }
        }
        return;
      }

      if (node.state === 'current') {
        const g = glowRef.current;
        if (g) {
          entryRef.current.elapsed += ticker.deltaMS;
          const t = entryRef.current.elapsed * 0.003;
          g.alpha = 0.3 + Math.sin(t) * 0.15;
        }
      }
    },
    [node.state, entryDelay, colors.alpha],
  );
  useTick(tickAnimations);

  const drawGlow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, NODE_RADIUS + 8);
      g.fill({ color: colors.border, alpha: 0.3 });
    },
    [colors.border],
  );

  const drawNode = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const scale = pressed ? 0.92 : 1;
      const r = NODE_RADIUS * scale;

      g.circle(0, 0, r);
      g.fill({ color: colors.fill, alpha: colors.alpha });

      g.circle(0, 0, r);
      g.stroke({ color: colors.border, width: 2.5, alpha: colors.alpha });

      if (node.state === 'cleared') {
        g.circle(0, 0, r - 4);
        g.stroke({ color: themeColors.accent, width: 1.5, alpha: 0.5 });
      }
    },
    [pressed, colors, node.state, themeColors.accent],
  );

  const labelStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BOLD,
        fontSize: 11,
        fontWeight: 'bold',
        fill: node.state === 'cleared' ? 0x4ade80 : UI.text.primary,
      }),
    [node.state],
  );

  const labelText = node.state === 'cleared' ? '✓' : String(node.contractLevel ?? '');

  return (
    <pixiContainer
      ref={(ref: Container | null) => {
        outerRef.current = ref;
        if (ref && !entryRef.current.done) ref.alpha = 0;
      }}
      x={x}
      y={y}
      alpha={colors.alpha}
    >
      <pixiContainer ref={pulseRef}>
        {node.state === 'current' && (
          <pixiGraphics ref={(ref) => { glowRef.current = ref; }} draw={drawGlow} />
        )}

        <pixiGraphics
          draw={drawNode}
          eventMode={isInteractive ? 'static' : 'none'}
          cursor={isInteractive ? 'pointer' : 'default'}
          onPointerDown={() => isInteractive && setPressed(true)}
          onPointerUp={() => {
            if (isInteractive) {
              setPressed(false);
              onTap?.(node);
            }
          }}
          onPointerUpOutside={() => setPressed(false)}
        />

        <pixiText
          text={labelText}
          x={0}
          y={0}
          anchor={0.5}
          style={labelStyle}
          alpha={colors.textAlpha}
          eventMode="none"
        />

        {node.state === 'cleared' && node.stars > 0 && (
          <pixiContainer x={0} y={NODE_RADIUS + 8}>
            {[0, 1, 2].map(i => (
              <pixiText
                key={i}
                text="★"
                x={(i - 1) * 10}
                y={0}
                anchor={0.5}
                style={{ fontSize: 9, fill: i < node.stars ? STAR_YELLOW : STAR_GRAY }}
                eventMode="none"
              />
            ))}
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// BOSS NODE
// ============================================================================

const BossNode = ({ node, x, y, onTap, entryDelay = 0 }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'current' || node.state === 'available' || node.state === 'cleared';
  const colors = STATE_COLORS[node.state];

  const { containerRef: pulseRef } = usePulseRef(node.state === 'current', {
    minScale: 0.95,
    maxScale: 1.08,
    duration: 1400,
  });

  const glowRef = useRef<PixiGraphics | null>(null);
  const ringRef = useRef<PixiGraphics | null>(null);
  const rotationRef = useRef(0);
  const entryRef = useRef({ elapsed: 0, done: entryDelay <= 0 });
  const outerRef = useRef<Container | null>(null);

  const tickAnimations = useCallback(
    (ticker: { deltaMS: number }) => {
      const dt = ticker.deltaMS / 16.667;

      if (!entryRef.current.done) {
        entryRef.current.elapsed += ticker.deltaMS;
        const c = outerRef.current;
        if (c) {
          if (entryRef.current.elapsed < entryDelay) {
            c.alpha = 0;
          } else {
            const fadeProgress = Math.min((entryRef.current.elapsed - entryDelay) / 300, 1);
            c.alpha = fadeProgress * colors.alpha;
            if (fadeProgress >= 1) entryRef.current.done = true;
          }
        }
        return;
      }

      rotationRef.current += 0.5 * dt / 60;
      const ring = ringRef.current;
      if (ring) {
        ring.clear();
        const r = BOSS_RADIUS + 6;
        const segments = 12;
        const arcLen = (Math.PI * 2) / segments;
        const offset = rotationRef.current;
        for (let i = 0; i < segments; i += 2) {
          const startAngle = offset + i * arcLen;
          const endAngle = startAngle + arcLen * 0.7;
          ring.arc(0, 0, r, startAngle, endAngle);
          ring.stroke({ color: 0xfbbf24, width: 2, alpha: colors.alpha * 0.5 });
          ring.moveTo(0, 0);
        }
      }

      if (node.state === 'current') {
        const g = glowRef.current;
        if (g) {
          const t = rotationRef.current * 6;
          g.alpha = 0.35 + Math.sin(t) * 0.2;
        }
      }
    },
    [node.state, entryDelay, colors.alpha],
  );
  useTick(tickAnimations);

  const drawGlow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.circle(0, 0, BOSS_RADIUS + 10);
      g.fill({ color: 0xfbbf24, alpha: 0.3 });
    },
    [],
  );

  const drawNode = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const scale = pressed ? 0.92 : 1;
      const r = BOSS_RADIUS * scale;

      g.circle(0, 0, r);
      g.fill({ color: colors.fill, alpha: colors.alpha });

      g.circle(0, 0, r);
      g.stroke({ color: colors.border, width: 3, alpha: colors.alpha });

      if (node.state === 'cleared') {
        g.circle(0, 0, r - 5);
        g.stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.5 });
      }
    },
    [pressed, colors, node.state],
  );

  const labelStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BOLD,
        fontSize: 13,
        fontWeight: 'bold',
        fill: node.state === 'cleared' ? 0xfbbf24 : UI.text.primary,
      }),
    [node.state],
  );

  const iconText = node.state === 'cleared' ? '✓' : '★';

  return (
    <pixiContainer
      ref={(ref: Container | null) => {
        outerRef.current = ref;
        if (ref && !entryRef.current.done) ref.alpha = 0;
      }}
      x={x}
      y={y}
      alpha={colors.alpha}
    >
      <pixiContainer ref={pulseRef}>
        {node.state === 'current' && (
          <pixiGraphics ref={(ref) => { glowRef.current = ref; }} draw={drawGlow} />
        )}

        <pixiGraphics ref={(ref) => { ringRef.current = ref; }} draw={() => {}} eventMode="none" />

        <pixiGraphics
          draw={drawNode}
          eventMode={isInteractive ? 'static' : 'none'}
          cursor={isInteractive ? 'pointer' : 'default'}
          onPointerDown={() => isInteractive && setPressed(true)}
          onPointerUp={() => {
            if (isInteractive) {
              setPressed(false);
              onTap?.(node);
            }
          }}
          onPointerUpOutside={() => setPressed(false)}
        />

        <pixiText
          text={iconText}
          x={0}
          y={0}
          anchor={0.5}
          style={labelStyle}
          alpha={colors.textAlpha}
          eventMode="none"
        />

        {node.state === 'cleared' && node.stars > 0 && (
          <pixiContainer x={0} y={BOSS_RADIUS + 10}>
            {[0, 1, 2].map(i => (
              <pixiText
                key={i}
                text="★"
                x={(i - 1) * 11}
                y={0}
                anchor={0.5}
                style={{ fontSize: 10, fill: i < node.stars ? STAR_YELLOW : STAR_GRAY }}
                eventMode="none"
              />
            ))}
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// SHOP NODE
// ============================================================================

const ShopNode = ({ node, x, y, onTap, entryDelay = 0 }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'available' || node.state === 'current';
  const colors = STATE_COLORS[node.state];
  const outerRef = useRef<Container | null>(null);
  const innerRef = useRef<Container | null>(null);
  const bobRef = useRef(0);
  const entryRef = useRef({ elapsed: 0, done: entryDelay <= 0 });

  const tickAnimations = useCallback(
    (ticker: { deltaMS: number }) => {
      if (!entryRef.current.done) {
        entryRef.current.elapsed += ticker.deltaMS;
        const c = outerRef.current;
        if (c) {
          if (entryRef.current.elapsed < entryDelay) {
            c.alpha = 0;
          } else {
            const fadeProgress = Math.min((entryRef.current.elapsed - entryDelay) / 300, 1);
            c.alpha = fadeProgress * colors.alpha;
            if (fadeProgress >= 1) entryRef.current.done = true;
          }
        }
        return;
      }

      bobRef.current += ticker.deltaMS * 0.003;
      const c = innerRef.current;
      if (c) {
        c.y = Math.sin(bobRef.current) * 3;
      }
    },
    [entryDelay, colors.alpha],
  );
  useTick(tickAnimations);

  const drawNode = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const scale = pressed ? 0.92 : 1;
      const w = SHOP_W * scale;
      const h = SHOP_H * scale;

      g.roundRect(-w / 2, -h / 2, w, h, 10);
      g.fill({ color: colors.fill, alpha: colors.alpha });
      g.roundRect(-w / 2, -h / 2, w, h, 10);
      g.stroke({ color: 0x22c55e, width: 2, alpha: colors.alpha });
    },
    [pressed, colors],
  );

  const iconStyle = useMemo(
    () => new TextStyle({ fontSize: 18 }),
    [],
  );

  return (
    <pixiContainer
      ref={(ref: Container | null) => {
        outerRef.current = ref;
        if (ref && !entryRef.current.done) ref.alpha = 0;
      }}
      x={x}
      y={y}
      alpha={colors.alpha}
    >
      <pixiContainer ref={innerRef}>
        <pixiGraphics
          draw={drawNode}
          eventMode={isInteractive ? 'static' : 'none'}
          cursor={isInteractive ? 'pointer' : 'default'}
          onPointerDown={() => isInteractive && setPressed(true)}
          onPointerUp={() => {
            if (isInteractive) {
              setPressed(false);
              onTap?.(node);
            }
          }}
          onPointerUpOutside={() => setPressed(false)}
        />
        <pixiText text={node.state === 'visited' ? '✓' : '🛒'} x={0} y={0} anchor={0.5} style={iconStyle} eventMode="none" />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const MapNode = (props: MapNodeProps) => {
  switch (props.node.type) {
    case 'boss':
      return <BossNode {...props} />;
    case 'shop':
      return <ShopNode {...props} />;
    default:
      return <ClassicNode {...props} />;
  }
};

export default MapNode;
