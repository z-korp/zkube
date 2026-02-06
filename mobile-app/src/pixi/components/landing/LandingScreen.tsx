/**
 * LandingScreen - Full PixiJS landing page
 * 
 * Inspired by Tetris Combo reference:
 * - Bright pastel sky gradient background
 * - Drifting fluffy clouds
 * - Cute colorful blocks with faces stacked at the bottom
 * - New blocks gently falling in
 * - "zKube" title rendered in PixiJS
 * - Play / Adventures buttons rendered as PixiJS buttons
 * - Entirely inside the PixiJS canvas, no HTML overlay
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { PixiThemeProvider } from '../../themes/ThemeContext';
import { PixiButton } from '../../ui/PixiButton';
import { PixiLabel } from '../../ui/PixiComponents';

// ============================================================================
// TYPES
// ============================================================================

interface FallingBlock {
  id: number;
  col: number;
  row: number;
  width: number; // 1-4
  y: number; // current pixel y
  targetY: number;
  speed: number;
  settled: boolean;
  colorIdx: number;
}

interface CloudData {
  id: number;
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

interface LandingScreenProps {
  onPlay: () => void;
  onConnect?: () => void;
  isConnected?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BLOCK_COLORS = [
  { fill: 0x4ADE80, border: 0x22C55E, highlight: 0x86EFAC }, // Green
  { fill: 0xFB923C, border: 0xEA580C, highlight: 0xFDBA74 }, // Orange
  { fill: 0x60A5FA, border: 0x3B82F6, highlight: 0x93C5FD }, // Blue
  { fill: 0xFBBF24, border: 0xF59E0B, highlight: 0xFDE68A }, // Yellow
  { fill: 0xF87171, border: 0xEF4444, highlight: 0xFCA5A5 }, // Red
  { fill: 0xC084FC, border: 0xA855F7, highlight: 0xD8B4FE }, // Purple
  { fill: 0x2DD4BF, border: 0x14B8A6, highlight: 0x5EEAD4 }, // Teal
];

const GRID_COLS = 8;
const MAX_STACK_ROWS = 6; // How many rows of blocks to stack
const MAX_CELL_SIZE = 52; // Cap block size so they don't become enormous on desktop

// ============================================================================
// SKY GRADIENT BACKGROUND
// ============================================================================

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    const steps = 24;
    const stepH = Math.ceil(h / steps) + 1;
    // Light pastel sky: powder blue top -> warm cream/peach bottom
    const top = { r: 0xD0, g: 0xEA, b: 0xF8 };    // Very light sky blue
    const mid = { r: 0xE8, g: 0xD5, b: 0xF0 };     // Soft lavender
    const bot = { r: 0xF5, g: 0xF0, b: 0xE0 };     // Warm cream

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let r: number, gC: number, b: number;
      if (t < 0.5) {
        const t2 = t * 2;
        r = Math.round(top.r + (mid.r - top.r) * t2);
        gC = Math.round(top.g + (mid.g - top.g) * t2);
        b = Math.round(top.b + (mid.b - top.b) * t2);
      } else {
        const t2 = (t - 0.5) * 2;
        r = Math.round(mid.r + (bot.r - mid.r) * t2);
        gC = Math.round(mid.g + (bot.g - mid.g) * t2);
        b = Math.round(mid.b + (bot.b - mid.b) * t2);
      }
      g.setFillStyle({ color: (r << 16) | (gC << 8) | b });
      g.rect(0, i * stepH, w, stepH);
      g.fill();
    }
  }, [w, h]);

  return <pixiGraphics draw={draw} />;
};

// ============================================================================
// CLOUDS
// ============================================================================

const Clouds = ({ w, h }: { w: number; h: number }) => {
  const cloudsRef = useRef<CloudData[]>([]);
  const [tick, setTick] = useState(0);

  // Init clouds
  useEffect(() => {
    if (cloudsRef.current.length > 0) return;
    const count = Math.max(5, Math.floor(w / 120));
    const clouds: CloudData[] = [];
    for (let i = 0; i < count; i++) {
      clouds.push({
        id: i,
        x: Math.random() * (w + 300) - 150,
        y: 15 + Math.random() * h * 0.22,
        scale: 0.5 + Math.random() * 0.9,
        speed: 0.12 + Math.random() * 0.25,
        alpha: 0.55 + Math.random() * 0.35,
      });
    }
    cloudsRef.current = clouds;
  }, [w, h]);

  // Animate
  useEffect(() => {
    let raf: number;
    let frameCount = 0;
    const loop = () => {
      frameCount++;
      for (const c of cloudsRef.current) {
        c.x += c.speed;
        if (c.x > w + 200) {
          c.x = -220 * c.scale;
          c.y = 15 + Math.random() * h * 0.22;
        }
      }
      // Render at ~30fps
      if (frameCount % 2 === 0) setTick(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  const drawCloud = useCallback((g: PixiGraphics, s: number) => {
    g.clear();
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.92 });
    g.circle(0, 0, 28 * s);
    g.fill();
    g.circle(22 * s, -7 * s, 22 * s);
    g.fill();
    g.circle(-20 * s, -4 * s, 20 * s);
    g.fill();
    g.circle(10 * s, 9 * s, 24 * s);
    g.fill();
    g.circle(-12 * s, 10 * s, 18 * s);
    g.fill();
    // Subtle highlight
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.4 });
    g.circle(5 * s, -12 * s, 14 * s);
    g.fill();
  }, []);

  return (
    <pixiContainer>
      {cloudsRef.current.map(c => (
        <pixiGraphics
          key={c.id}
          x={c.x}
          y={c.y}
          alpha={c.alpha}
          draw={(g) => drawCloud(g, c.scale)}
        />
      ))}
    </pixiContainer>
  );
};

// ============================================================================
// CUTE BLOCK (procedural with face)
// ============================================================================

function drawCuteBlock(
  g: PixiGraphics,
  w: number,
  h: number,
  colorIdx: number,
) {
  const color = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length];
  const r = Math.min(w, h) * 0.2;
  const pad = 1.5;

  g.clear();

  // Drop shadow
  g.setFillStyle({ color: 0x000000, alpha: 0.1 });
  g.roundRect(pad + 2, pad + 3, w - pad * 2, h - pad * 2, r);
  g.fill();

  // Body
  g.setFillStyle({ color: color.fill });
  g.roundRect(pad, pad, w - pad * 2, h - pad * 2, r);
  g.fill();

  // Border
  g.setStrokeStyle({ width: 2, color: color.border, alpha: 0.7 });
  g.roundRect(pad, pad, w - pad * 2, h - pad * 2, r);
  g.stroke();

  // Top highlight
  g.setFillStyle({ color: color.highlight, alpha: 0.5 });
  g.roundRect(pad + 4, pad + 3, w - pad * 2 - 8, (h - pad * 2) * 0.28, r - 2);
  g.fill();

  // Eyes
  const cx = w / 2;
  const eyeY = h * 0.38;
  const eyeSpace = Math.min(w * 0.13, 9);
  const eyeR = Math.max(2, Math.min(w, h) * 0.055);

  g.setFillStyle({ color: 0x2D2D2D, alpha: 0.9 });
  g.circle(cx - eyeSpace, eyeY, eyeR);
  g.fill();
  g.circle(cx + eyeSpace, eyeY, eyeR);
  g.fill();

  // Eye highlights
  g.setFillStyle({ color: 0xFFFFFF, alpha: 0.9 });
  g.circle(cx - eyeSpace + eyeR * 0.4, eyeY - eyeR * 0.4, eyeR * 0.4);
  g.fill();
  g.circle(cx + eyeSpace + eyeR * 0.4, eyeY - eyeR * 0.4, eyeR * 0.4);
  g.fill();

  // Smile
  const smileY = h * 0.55;
  const smileW = Math.min(w * 0.13, 7);
  g.setStrokeStyle({ width: 1.6, color: 0x2D2D2D, alpha: 0.75 });
  g.arc(cx, smileY - 1, smileW, 0.15, Math.PI - 0.15);
  g.stroke();
}

// ============================================================================
// BLOCK PILE - blocks stacked at the bottom
// ============================================================================

const BlockPile = ({ w, h, cellSize: externalCellSize }: { w: number; h: number; cellSize: number }) => {
  const cellSize = externalCellSize;
  const blocksRef = useRef<FallingBlock[]>([]);
  const gridRef = useRef<boolean[][]>([]);
  const nextIdRef = useRef(0);
  const [tick, setTick] = useState(0);
  const texturesRef = useRef<Record<number, Texture | null>>({});

  // Load tiki block textures
  useEffect(() => {
    for (let i = 1; i <= 4; i++) {
      Assets.load(`/assets/tiki/blocks/block-${i}.png`)
        .then(tex => { texturesRef.current[i] = tex as Texture; })
        .catch(() => { texturesRef.current[i] = null; });
    }
  }, []);

  // Init grid occupancy
  useEffect(() => {
    const totalRows = Math.ceil(h / cellSize);
    gridRef.current = Array.from({ length: totalRows }, () =>
      new Array(GRID_COLS).fill(false),
    );
  }, [h, cellSize]);

  // Find valid landing spot for a block
  const findSpot = useCallback((blockW: number): { col: number; row: number } | null => {
    const grid = gridRef.current;
    if (!grid.length) return null;
    const maxRow = grid.length - 1;
    const bottomRow = maxRow;
    const topLimit = Math.max(0, bottomRow - MAX_STACK_ROWS);

    // Try random columns
    const cols: number[] = [];
    for (let c = 0; c <= GRID_COLS - blockW; c++) cols.push(c);
    // Shuffle
    for (let i = cols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cols[i], cols[j]] = [cols[j], cols[i]];
    }

    for (const col of cols) {
      for (let row = maxRow; row >= topLimit; row--) {
        let canPlace = true;
        for (let dx = 0; dx < blockW; dx++) {
          if (grid[row]?.[col + dx]) { canPlace = false; break; }
        }
        if (!canPlace) continue;
        // Need support below or bottom row
        if (row === maxRow) return { col, row };
        let hasSupport = false;
        for (let dx = 0; dx < blockW; dx++) {
          if (grid[row + 1]?.[col + dx]) { hasSupport = true; break; }
        }
        if (hasSupport) return { col, row };
      }
    }
    return null;
  }, [cellSize]);

  // Spawn one block
  const spawnBlock = useCallback(() => {
    const widths = [1, 1, 2, 2, 2, 3, 3, 4];
    const blockW = widths[Math.floor(Math.random() * widths.length)];
    const spot = findSpot(blockW);
    if (!spot) return;

    const grid = gridRef.current;
    for (let dx = 0; dx < blockW; dx++) {
      if (grid[spot.row]) grid[spot.row][spot.col + dx] = true;
    }

    const id = nextIdRef.current++;
    const targetY = spot.row * cellSize;
    const gridOffsetX = (w - GRID_COLS * cellSize) / 2; // center grid

    blocksRef.current.push({
      id,
      col: spot.col,
      row: spot.row,
      width: blockW,
      y: -cellSize * 2 - Math.random() * 150,
      targetY,
      speed: 2 + Math.random() * 2.5,
      settled: false,
      colorIdx: Math.floor(Math.random() * BLOCK_COLORS.length),
    });
  }, [cellSize, w, findSpot]);

  // Spawn initial batch + periodic spawning
  useEffect(() => {
    // Initial pile
    const initTimer = setTimeout(() => {
      for (let i = 0; i < 22; i++) spawnBlock();
      // Settle them immediately
      for (const b of blocksRef.current) {
        b.y = b.targetY;
        b.settled = true;
      }
      setTick(n => n + 1);
    }, 50);

    // Ongoing spawning
    const interval = setInterval(() => {
      spawnBlock();
    }, 900 + Math.random() * 700);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [spawnBlock]);

  // Animate falling
  useEffect(() => {
    let raf: number;
    const loop = () => {
      let dirty = false;
      for (const b of blocksRef.current) {
        if (!b.settled) {
          b.y += b.speed;
          if (b.y >= b.targetY) {
            b.y = b.targetY;
            b.settled = true;
          }
          dirty = true;
        }
      }
      if (dirty) setTick(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const gridOffsetX = (w - GRID_COLS * cellSize) / 2;

  return (
    <pixiContainer>
      {blocksRef.current.map(b => {
        const bw = b.width * cellSize;
        const bh = cellSize;
        const bx = gridOffsetX + b.col * cellSize;
        const tex = texturesRef.current[b.width];

        if (tex) {
          return (
            <pixiSprite
              key={b.id}
              texture={tex}
              x={bx}
              y={b.y}
              width={bw}
              height={bh}
            />
          );
        }

        return (
          <pixiGraphics
            key={b.id}
            x={bx}
            y={b.y}
            draw={(g) => drawCuteBlock(g, bw, bh, b.colorIdx)}
          />
        );
      })}
    </pixiContainer>
  );
};

// ============================================================================
// FLOATING BLOCK (decorative block that bobs around the title)
// ============================================================================

const FloatingBlock = ({
  x, y, size, colorIdx, delay = 0,
}: {
  x: number; y: number; size: number; colorIdx: number; delay?: number;
}) => {
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const timeRef = useRef(delay);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      timeRef.current += 0.02;
      setOffsetY(Math.sin(timeRef.current * 1.5) * 8);
      setRotation(Math.sin(timeRef.current * 0.8) * 0.08);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <pixiGraphics
      x={x}
      y={y + offsetY}
      rotation={rotation}
      draw={(g) => drawCuteBlock(g, size, size, colorIdx)}
    />
  );
};

// ============================================================================
// GRASS STRIP at the bottom
// ============================================================================

const GrassStrip = ({ w, h, groundY }: { w: number; h: number; groundY: number }) => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    const stripH = h - groundY + 10; // extend slightly past bottom
    // Light grass highlight
    g.setFillStyle({ color: 0xBBF7D0, alpha: 0.6 });
    g.rect(0, groundY - 4, w, 8);
    g.fill();
    // Main green
    g.setFillStyle({ color: 0x86EFAC, alpha: 0.7 });
    g.rect(0, groundY, w, stripH);
    g.fill();
    // Darker base
    g.setFillStyle({ color: 0x4ADE80, alpha: 0.5 });
    g.rect(0, groundY + 6, w, stripH - 6);
    g.fill();
  }, [w, h, groundY]);

  return <pixiGraphics draw={draw} />;
};

// ============================================================================
// TITLE TEXT
// ============================================================================

const TitleText = ({ x, y, fontSize }: { x: number; y: number; fontSize: number }) => {
  const [bounce, setBounce] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      timeRef.current += 0.03;
      setBounce(Math.sin(timeRef.current * 2) * 3);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <pixiContainer x={x} y={y + bounce}>
      {/* Shadow text */}
      <pixiText
        text="zKube"
        anchor={0.5}
        x={3}
        y={3}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif',
          fontSize: fontSize,
          fill: 0x5B21B6,
          letterSpacing: 4,
          align: 'center',
        }}
      />
      {/* Main text with gradient-like effect */}
      <pixiText
        text="zKube"
        anchor={0.5}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif',
          fontSize: fontSize,
          fill: 0x6D28D9, // Rich purple
          letterSpacing: 4,
          align: 'center',
          stroke: {
            color: 0xFFFFFF,
            width: 5,
          },
          dropShadow: {
            alpha: 0.3,
            angle: Math.PI / 6,
            blur: 6,
            distance: 4,
            color: 0x4C1D95,
          },
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// SUBTITLE
// ============================================================================

const SubtitleText = ({ x, y, fontSize }: { x: number; y: number; fontSize: number }) => {
  return (
    <pixiText
      text="On-Chain Puzzle Roguelike"
      x={x}
      y={y}
      anchor={0.5}
      style={{
        fontFamily: 'Fredericka the Great, Bangers, Arial, sans-serif',
        fontSize: fontSize,
        fill: 0x6B7280,
        letterSpacing: 1,
        align: 'center',
      }}
    />
  );
};

// ============================================================================
// LANDING SCREEN INNER (inside PixiThemeProvider)
// ============================================================================

const LandingScreenInner = ({ onPlay, onConnect, isConnected }: LandingScreenProps) => {
  const [screenW, setScreenW] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375,
  );
  const [screenH, setScreenH] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 667,
  );

  useEffect(() => {
    const onResize = () => {
      setScreenW(window.innerWidth);
      setScreenH(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
    };
  }, []);

  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const isMobile = screenW < 768;

  // Layout calculations
  const titleFontSize = isMobile ? 56 : 72;
  const subtitleFontSize = isMobile ? 14 : 18;
  const titleY = screenH * 0.15;
  const subtitleY = titleY + titleFontSize * 0.7;
  const buttonsY = subtitleY + subtitleFontSize + (isMobile ? 30 : 45);
  const buttonW = isMobile ? 200 : 240;
  const buttonH = isMobile ? 52 : 56;
  const buttonGap = 16;
  const centerX = screenW / 2;

  // Cell size: capped so blocks don't become huge on wide screens
  const cellSize = Math.min(MAX_CELL_SIZE, Math.floor(screenW / GRID_COLS));
  const pileHeight = MAX_STACK_ROWS * cellSize;
  
  // Ground line: blocks stack up from the very bottom of the screen
  const groundY = screenH - pileHeight;
  
  // Floating decorative blocks around title
  const floatSize = isMobile ? 36 : 48;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <Application
        width={screenW}
        height={screenH}
        backgroundAlpha={1}
        background={0xD0EAF8}
        resolution={dpr}
        autoDensity
        antialias
      >
        {/* Layer 1: Sky gradient */}
        <SkyBackground w={screenW} h={screenH} />

        {/* Layer 2: Clouds */}
        <Clouds w={screenW} h={screenH} />

        {/* Layer 3: Grass */}
        <GrassStrip w={screenW} h={screenH} groundY={groundY} />

        {/* Layer 4: Block pile at bottom */}
        <pixiContainer y={groundY}>
          <BlockPile w={screenW} h={pileHeight + cellSize} cellSize={cellSize} />
        </pixiContainer>

        {/* Layer 5: Floating decorative blocks */}
        <FloatingBlock
          x={centerX - (isMobile ? 130 : 180)}
          y={titleY - floatSize / 2}
          size={floatSize}
          colorIdx={0}
          delay={0}
        />
        <FloatingBlock
          x={centerX + (isMobile ? 100 : 150)}
          y={titleY - floatSize * 0.3}
          size={floatSize * 0.8}
          colorIdx={3}
          delay={1.5}
        />
        <FloatingBlock
          x={centerX + (isMobile ? 120 : 170)}
          y={buttonsY - 10}
          size={floatSize * 0.65}
          colorIdx={5}
          delay={3}
        />
        <FloatingBlock
          x={centerX - (isMobile ? 140 : 190)}
          y={buttonsY + 10}
          size={floatSize * 0.7}
          colorIdx={2}
          delay={2}
        />

        {/* Layer 6: Title */}
        <TitleText x={centerX} y={titleY} fontSize={titleFontSize} />

        {/* Layer 7: Subtitle */}
        <SubtitleText x={centerX} y={subtitleY} fontSize={subtitleFontSize} />

        {/* Layer 8: Buttons */}
        <pixiContainer>
          {/* Play button (primary - orange) */}
          <PixiButton
            x={centerX - buttonW / 2}
            y={buttonsY}
            width={buttonW}
            height={buttonH}
            variant="orange"
            label="Play Game"
            onPress={onPlay}
            textStyle={{ fontSize: isMobile ? 20 : 22 }}
          />

          {/* Connect button (secondary - purple) */}
          {!isConnected && onConnect && (
            <PixiButton
              x={centerX - buttonW / 2}
              y={buttonsY + buttonH + buttonGap}
              width={buttonW}
              height={buttonH}
              variant="purple"
              label="Connect"
              onPress={onConnect}
              textStyle={{ fontSize: isMobile ? 18 : 20 }}
            />
          )}

          {/* Adventures button (green, below play) */}
          <PixiButton
            x={centerX - buttonW / 2}
            y={buttonsY + (buttonH + buttonGap) * ((!isConnected && onConnect) ? 2 : 1)}
            width={buttonW}
            height={buttonH}
            variant="green"
            label="Adventures"
            onPress={() => {}} // TODO: Navigate to adventures
            textStyle={{ fontSize: isMobile ? 18 : 20 }}
          />
        </pixiContainer>

        {/* Layer 9: Version/footer text */}
        <pixiText
          text="Built on Starknet with Dojo"
          x={centerX}
          y={screenH - 20}
          anchor={0.5}
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fill: 0x9CA3AF,
            align: 'center',
          }}
        />
      </Application>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export const LandingScreen = (props: LandingScreenProps) => {
  return (
    <PixiThemeProvider>
      <LandingScreenInner {...props} />
    </PixiThemeProvider>
  );
};

export default LandingScreen;
