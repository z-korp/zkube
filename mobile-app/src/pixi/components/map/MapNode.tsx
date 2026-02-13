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
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { useTick } from '@pixi/react';
import type { MapNodeData, NodeState } from '../../hooks/useMapData';
import { getThemeColors, type ThemeColors, FONT_BOLD, FONT_BODY, UI } from '../../utils/colors';

// ============================================================================
// CONSTANTS
// ============================================================================

export const NODE_RADIUS = 22;
const BOSS_RADIUS = 28;
const SHOP_W = 48;
const SHOP_H = 40;
const BOSS_BADGE_SIZE = 56;

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
}

// ============================================================================
// CLASSIC NODE
// ============================================================================

const ClassicNode = ({ node, x, y, onTap }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'current' || node.state === 'available';
  const colors = STATE_COLORS[node.state];
  const themeColors = getThemeColors(node.zoneTheme);
  const timeRef = useRef(0);
  const glowRef = useRef<PixiGraphics | null>(null);

  // Pulse animation for current node
  const tickPulse = useCallback(
    (ticker: { deltaMS: number }) => {
      if (node.state !== 'current') return;
      const g = glowRef.current;
      if (!g) return;
      const dt = ticker.deltaMS / 16.667;
      timeRef.current += 0.04 * dt;
      const pulse = 0.3 + Math.sin(timeRef.current) * 0.15;
      g.alpha = pulse;
    },
    [node.state],
  );
  useTick(tickPulse, node.state === 'current');

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

      // Fill
      g.circle(0, 0, r);
      g.fill({ color: colors.fill, alpha: colors.alpha });

      // Border ring
      g.circle(0, 0, r);
      g.stroke({ color: colors.border, width: 2.5, alpha: colors.alpha });

      // Inner accent ring for cleared
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

  const labelText = node.state === 'cleared' ? '\u2713' : String(node.contractLevel ?? '');

  return (
    <pixiContainer x={x} y={y} alpha={colors.alpha}>
      {/* Pulse glow */}
      {node.state === 'current' && (
        <pixiGraphics ref={(ref) => { glowRef.current = ref; }} draw={drawGlow} />
      )}

      {/* Node circle */}
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

      {/* Label */}
      <pixiText
        text={labelText}
        x={0}
        y={0}
        anchor={0.5}
        style={labelStyle}
        alpha={colors.textAlpha}
        eventMode="none"
      />
    </pixiContainer>
  );
};

// ============================================================================
// BOSS NODE
// ============================================================================

const BossNode = ({ node, x, y, onTap }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'current' || node.state === 'available';
  const colors = STATE_COLORS[node.state];
  const themeColors = getThemeColors(node.zoneTheme);
  const timeRef = useRef(0);
  const glowRef = useRef<PixiGraphics | null>(null);

  const tickPulse = useCallback(
    (ticker: { deltaMS: number }) => {
      if (node.state !== 'current') return;
      const g = glowRef.current;
      if (!g) return;
      const dt = ticker.deltaMS / 16.667;
      timeRef.current += 0.04 * dt;
      const pulse = 0.35 + Math.sin(timeRef.current) * 0.2;
      g.alpha = pulse;
    },
    [node.state],
  );
  useTick(tickPulse, node.state === 'current');

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

      // Outer ring
      g.circle(0, 0, r + 3);
      g.stroke({ color: 0xfbbf24, width: 2, alpha: colors.alpha * 0.6 });

      // Fill
      g.circle(0, 0, r);
      g.fill({ color: colors.fill, alpha: colors.alpha });

      // Border
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

  const iconText = node.state === 'cleared' ? '\u2713' : '\u2605';

  return (
    <pixiContainer x={x} y={y} alpha={colors.alpha}>
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
        text={iconText}
        x={0}
        y={0}
        anchor={0.5}
        style={labelStyle}
        alpha={colors.textAlpha}
        eventMode="none"
      />
    </pixiContainer>
  );
};

// ============================================================================
// SHOP NODE
// ============================================================================

const ShopNode = ({ node, x, y, onTap }: MapNodeProps) => {
  const [pressed, setPressed] = useState(false);
  const isInteractive = node.state === 'available' || node.state === 'current';
  const colors = STATE_COLORS[node.state];

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
    <pixiContainer x={x} y={y} alpha={colors.alpha}>
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
      <pixiText text={node.state === 'visited' ? '\u2713' : '\uD83D\uDED2'} x={0} y={0} anchor={0.5} style={iconStyle} eventMode="none" />
    </pixiContainer>
  );
};

// ============================================================================
// MAIN EXPORT
// ============================================================================

export const MapNode = (props: MapNodeProps) => {
  const { node } = props;
  switch (node.type) {
    case 'boss':
      return <BossNode {...props} />;
    case 'shop':
      return <ShopNode {...props} />;
    default:
      return <ClassicNode {...props} />;
  }
};

export default MapNode;
