/**
 * LandingScreen - Full PixiJS landing page
 *
 * Uses ONLY theme-1 assets:
 *   block-1/2/3/4.png, logo.png, palmtree-left/right.png, theme-2-1.png
 * Everything else (sky, clouds, grass, buttons, icons) is procedural.
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { TopBar } from '../topbar';

// ============================================================================
// CONSTANTS
// ============================================================================

const T = '/assets/theme-1'; // theme base path
const GRID_COLS = 8;
const MAX_STACK_ROWS = 6;
const MAX_CELL_SIZE = 52;

const BLOCK_COLORS = [
  { fill: 0x4ADE80, border: 0x22C55E, highlight: 0x86EFAC },
  { fill: 0xFB923C, border: 0xEA580C, highlight: 0xFDBA74 },
  { fill: 0x60A5FA, border: 0x3B82F6, highlight: 0x93C5FD },
  { fill: 0xFBBF24, border: 0xF59E0B, highlight: 0xFDE68A },
  { fill: 0xF87171, border: 0xEF4444, highlight: 0xFCA5A5 },
  { fill: 0xC084FC, border: 0xA855F7, highlight: 0xD8B4FE },
  { fill: 0x2DD4BF, border: 0x14B8A6, highlight: 0x5EEAD4 },
];

// ============================================================================
// TYPES
// ============================================================================

interface FallingBlock {
  id: number;
  col: number;
  row: number;
  width: number;
  y: number;
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

export interface LandingScreenProps {
  onPlay: () => void;
  onConnect?: () => void;
  isConnected?: boolean;
  cubeBalance?: number;
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onShopClick?: () => void;
}

// ============================================================================
// TEXTURE HOOK
// ============================================================================

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    Assets.load(path).then(t => setTex(t as Texture)).catch(() => setTex(null));
  }, [path]);
  return tex;
}

// ============================================================================
// SKY BACKGROUND (procedural gradient, theme-2-1.png overlay)
// ============================================================================

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const bgTex = useTexture(`${T}/theme-2-1.png`);

  const drawGradient = useCallback((g: PixiGraphics) => {
    g.clear();
    const steps = 20;
    const stepH = Math.ceil(h / steps) + 1;
    const top = { r: 0xD0, g: 0xEA, b: 0xF8 };
    const bot = { r: 0xF5, g: 0xF0, b: 0xE0 };
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(top.r + (bot.r - top.r) * t);
      const gC = Math.round(top.g + (bot.g - top.g) * t);
      const b = Math.round(top.b + (bot.b - top.b) * t);
      g.setFillStyle({ color: (r << 16) | (gC << 8) | b });
      g.rect(0, i * stepH, w, stepH);
      g.fill();
    }
  }, [w, h]);

  if (bgTex) {
    const scaleX = w / bgTex.width;
    const scaleY = h / bgTex.height;
    const scale = Math.max(scaleX, scaleY);
    const offX = (w - bgTex.width * scale) / 2;
    const offY = (h - bgTex.height * scale) / 2;
    return <pixiSprite texture={bgTex} x={offX} y={offY} scale={{ x: scale, y: scale }} />;
  }

  return <pixiGraphics draw={drawGradient} />;
};

// ============================================================================
// CLOUDS (procedural)
// ============================================================================

const Clouds = ({ w, h }: { w: number; h: number }) => {
  const cloudsRef = useRef<CloudData[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (cloudsRef.current.length > 0) return;
    const count = Math.max(4, Math.floor(w / 140));
    for (let i = 0; i < count; i++) {
      cloudsRef.current.push({
        id: i,
        x: Math.random() * (w + 300) - 150,
        y: 50 + Math.random() * h * 0.2,
        scale: 0.5 + Math.random() * 0.8,
        speed: 0.1 + Math.random() * 0.2,
        alpha: 0.5 + Math.random() * 0.35,
      });
    }
  }, [w, h]);

  useEffect(() => {
    let raf: number;
    let fc = 0;
    const loop = () => {
      fc++;
      for (const c of cloudsRef.current) {
        c.x += c.speed;
        if (c.x > w + 200) { c.x = -200 * c.scale; c.y = 50 + Math.random() * h * 0.2; }
      }
      if (fc % 2 === 0) setTick(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  const drawCloud = useCallback((g: PixiGraphics, s: number) => {
    g.clear();
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.9 });
    g.circle(0, 0, 28 * s); g.fill();
    g.circle(22 * s, -7 * s, 22 * s); g.fill();
    g.circle(-20 * s, -4 * s, 20 * s); g.fill();
    g.circle(10 * s, 9 * s, 24 * s); g.fill();
    g.circle(-12 * s, 10 * s, 18 * s); g.fill();
  }, []);

  return (
    <pixiContainer>
      {cloudsRef.current.map(c => (
        <pixiGraphics key={c.id} x={c.x} y={c.y} alpha={c.alpha}
          draw={(g) => drawCloud(g, c.scale)} />
      ))}
    </pixiContainer>
  );
};

// ============================================================================
// GRASS (procedural)
// ============================================================================

const Grass = ({ w, groundY, h }: { w: number; groundY: number; h: number }) => {
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    // Light top edge
    g.setFillStyle({ color: 0xBBF7D0, alpha: 0.6 });
    g.rect(0, groundY - 4, w, 8);
    g.fill();
    // Main green
    g.setFillStyle({ color: 0x86EFAC, alpha: 0.7 });
    g.rect(0, groundY, w, h - groundY + 10);
    g.fill();
    // Darker base
    g.setFillStyle({ color: 0x4ADE80, alpha: 0.5 });
    g.rect(0, groundY + 6, w, h - groundY + 4);
    g.fill();
  }, [w, h, groundY]);

  return <pixiGraphics draw={draw} />;
};

// ============================================================================
// PALM TREES (theme-1 assets)
// ============================================================================

const PalmTrees = ({ w, groundY }: { w: number; groundY: number }) => {
  const left = useTexture(`${T}/palmtree-left.png`);
  const right = useTexture(`${T}/palmtree-right.png`);
  if (!left && !right) return null;
  const pH = 200;
  const pW = 130;
  return (
    <pixiContainer>
      {left && <pixiSprite texture={left} x={-10} y={groundY - pH} width={pW} height={pH} alpha={0.9} />}
      {right && <pixiSprite texture={right} x={w - pW + 10} y={groundY - pH + 20} width={pW} height={pH} alpha={0.9} />}
    </pixiContainer>
  );
};

// ============================================================================
// BLOCK PILE (theme-1 block textures)
// ============================================================================

const BlockPile = ({ w, h, cellSize }: { w: number; h: number; cellSize: number }) => {
  const blocksRef = useRef<FallingBlock[]>([]);
  const gridRef = useRef<boolean[][]>([]);
  const nextIdRef = useRef(0);
  const [tick, setTick] = useState(0);

  // Load block textures from theme-1
  const [textures, setTextures] = useState<Record<number, Texture | null>>({});
  useEffect(() => {
    const load = async () => {
      const result: Record<number, Texture | null> = {};
      for (let i = 1; i <= 4; i++) {
        try { result[i] = await Assets.load(`${T}/block-${i}.png`) as Texture; }
        catch { result[i] = null; }
      }
      setTextures(result);
    };
    load();
  }, []);

  useEffect(() => {
    const totalRows = Math.ceil(h / cellSize);
    gridRef.current = Array.from({ length: totalRows }, () => new Array(GRID_COLS).fill(false));
  }, [h, cellSize]);

  const findSpot = useCallback((blockW: number): { col: number; row: number } | null => {
    const grid = gridRef.current;
    if (!grid.length) return null;
    const maxRow = grid.length - 1;
    const topLimit = Math.max(0, maxRow - MAX_STACK_ROWS);
    const cols: number[] = [];
    for (let c = 0; c <= GRID_COLS - blockW; c++) cols.push(c);
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
        if (row === maxRow) return { col, row };
        let hasSupport = false;
        for (let dx = 0; dx < blockW; dx++) {
          if (grid[row + 1]?.[col + dx]) { hasSupport = true; break; }
        }
        if (hasSupport) return { col, row };
      }
    }
    return null;
  }, []);

  const spawnBlock = useCallback(() => {
    const widths = [1, 1, 2, 2, 2, 3, 3, 4];
    const blockW = widths[Math.floor(Math.random() * widths.length)];
    const spot = findSpot(blockW);
    if (!spot) return;
    const grid = gridRef.current;
    for (let dx = 0; dx < blockW; dx++) {
      if (grid[spot.row]) grid[spot.row][spot.col + dx] = true;
    }
    blocksRef.current.push({
      id: nextIdRef.current++, col: spot.col, row: spot.row, width: blockW,
      y: -cellSize * 2 - Math.random() * 150,
      targetY: spot.row * cellSize,
      speed: 2 + Math.random() * 2.5, settled: false,
      colorIdx: Math.floor(Math.random() * BLOCK_COLORS.length),
    });
  }, [cellSize, findSpot]);

  useEffect(() => {
    const t = setTimeout(() => {
      for (let i = 0; i < 24; i++) spawnBlock();
      for (const b of blocksRef.current) { b.y = b.targetY; b.settled = true; }
      setTick(n => n + 1);
    }, 80);
    const iv = setInterval(() => spawnBlock(), 1000 + Math.random() * 800);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [spawnBlock]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      let dirty = false;
      for (const b of blocksRef.current) {
        if (!b.settled) {
          b.y += b.speed;
          if (b.y >= b.targetY) { b.y = b.targetY; b.settled = true; }
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
        // Use closest block texture: 1->1, 2->2, 3->3, 4->4
        const tex = textures[Math.min(b.width, 4)] ?? null;
        if (tex) {
          return <pixiSprite key={b.id} texture={tex} x={bx} y={b.y} width={bw} height={bh} />;
        }
        // Procedural fallback
        const color = BLOCK_COLORS[b.colorIdx % BLOCK_COLORS.length];
        return (
          <pixiGraphics key={b.id} x={bx} y={b.y} draw={(g) => {
            g.clear();
            const r = Math.min(bw, bh) * 0.18;
            g.setFillStyle({ color: color.fill });
            g.roundRect(2, 2, bw - 4, bh - 4, r); g.fill();
            g.setStrokeStyle({ width: 2, color: color.border, alpha: 0.7 });
            g.roundRect(2, 2, bw - 4, bh - 4, r); g.stroke();
          }} />
        );
      })}
    </pixiContainer>
  );
};

// ============================================================================
// LOGO (theme-1/logo.png)
// ============================================================================

const Logo = ({ x, y, maxW, maxH }: { x: number; y: number; maxW: number; maxH: number }) => {
  const tex = useTexture(`${T}/logo.png`);
  const [bounce, setBounce] = useState(0);
  const timeRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      timeRef.current += 0.025;
      setBounce(Math.sin(timeRef.current * 2) * 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!tex) {
    return (
      <pixiText text="zKube" x={x} y={y + bounce} anchor={0.5}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif', fontSize: 64,
          fill: 0x6D28D9, letterSpacing: 4,
          stroke: { color: 0xFFFFFF, width: 5 },
          dropShadow: { alpha: 0.3, angle: Math.PI / 6, blur: 6, distance: 4, color: 0x4C1D95 },
        }}
      />
    );
  }

  const scale = Math.min(maxW / tex.width, maxH / tex.height, 1);
  return <pixiSprite texture={tex} x={x} y={y + bounce} anchor={0.5} scale={scale} />;
};

// ============================================================================
// PROCEDURAL BUTTON
// ============================================================================

const ProceduralButton = ({
  x, y, width, height, label, color, onPress, fontSize = 20,
}: {
  x: number; y: number; width: number; height: number;
  label: string; color: number; onPress: () => void; fontSize?: number;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = pressed ? 0.95 : hovered ? 1.02 : 1;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    const r = 14;
    // Shadow
    g.setFillStyle({ color: 0x000000, alpha: 0.2 });
    g.roundRect(3, 4, width, height, r); g.fill();
    // Body
    g.setFillStyle({ color });
    g.roundRect(0, 0, width, height, r); g.fill();
    // Top highlight
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.25 });
    g.roundRect(4, 3, width - 8, height * 0.35, r - 2); g.fill();
    // Border
    g.setStrokeStyle({ width: 2, color: 0xFFFFFF, alpha: 0.3 });
    g.roundRect(0, 0, width, height, r); g.stroke();
  }, [width, height, color]);

  return (
    <pixiContainer
      x={x + width / 2} y={y + height / 2}
      scale={scale} pivot={{ x: width / 2, y: height / 2 }}
      eventMode="static" cursor="pointer"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress(); }}
      onPointerUpOutside={() => setPressed(false)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setPressed(false); }}
    >
      <pixiGraphics draw={draw} />
      <pixiText text={label} x={width / 2} y={height / 2} anchor={0.5}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif', fontSize,
          fill: 0xFFFFFF,
          dropShadow: { alpha: 0.5, angle: Math.PI / 4, blur: 2, distance: 2, color: 0x000000 },
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// FLOATING BLOCK
// ============================================================================

const FloatingBlock = ({ x, y, size, blockNum, delay = 0 }: {
  x: number; y: number; size: number; blockNum: number; delay?: number;
}) => {
  const tex = useTexture(`${T}/block-${blockNum}.png`);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const timeRef = useRef(delay);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      timeRef.current += 0.02;
      setOffsetY(Math.sin(timeRef.current * 1.5) * 8);
      setRotation(Math.sin(timeRef.current * 0.8) * 0.1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!tex) return null;
  return <pixiSprite texture={tex} x={x} y={y + offsetY} anchor={0.5}
    width={size} height={size} rotation={rotation} />;
};

// ============================================================================
// LANDING SCREEN INNER
// ============================================================================

const LandingScreenInner = ({
  onPlay, onConnect, isConnected,
  cubeBalance = 0, onQuestsClick, onTrophyClick, onShopClick,
}: LandingScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight } = layout;

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const cellSize = Math.min(MAX_CELL_SIZE, Math.floor(sw / GRID_COLS));
  const pileHeight = MAX_STACK_ROWS * cellSize;
  const groundY = sh - pileHeight;
  const centerX = sw / 2;

  const logoMaxH = isMobile ? 80 : 120;
  const logoMaxW = isMobile ? 220 : 340;
  const logoY = topBarHeight + (isMobile ? 30 : 50) + logoMaxH / 2;
  const subtitleY = logoY + logoMaxH / 2 + 8;
  const buttonsY = subtitleY + (isMobile ? 35 : 50);
  const btnW = isMobile ? 200 : 250;
  const btnH = isMobile ? 50 : 56;
  const btnGap = 14;
  const floatSize = isMobile ? 45 : 60;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <Application
        width={sw} height={sh}
        backgroundAlpha={1} background={0xD0EAF8}
        resolution={dpr} autoDensity antialias
      >
        {/* 1. Sky / background */}
        <SkyBackground w={sw} h={sh} />

        {/* 2. Clouds */}
        <Clouds w={sw} h={sh} />

        {/* 3. Palm trees */}
        <PalmTrees w={sw} groundY={groundY} />

        {/* 4. Grass */}
        <Grass w={sw} groundY={groundY} h={sh} />

        {/* 5. Block pile */}
        <pixiContainer y={groundY}>
          <BlockPile w={sw} h={pileHeight + cellSize} cellSize={cellSize} />
        </pixiContainer>

        {/* 6. Floating blocks */}
        <FloatingBlock x={centerX - (isMobile ? 130 : 200)} y={logoY}
          size={floatSize} blockNum={1} delay={0} />
        <FloatingBlock x={centerX + (isMobile ? 110 : 175)} y={logoY - 10}
          size={floatSize * 0.8} blockNum={2} delay={1.5} />
        <FloatingBlock x={centerX + (isMobile ? 90 : 155)} y={buttonsY + btnH}
          size={floatSize * 0.6} blockNum={3} delay={3} />
        <FloatingBlock x={centerX - (isMobile ? 120 : 170)} y={buttonsY + btnH / 2}
          size={floatSize * 0.7} blockNum={4} delay={2} />

        {/* 7. Logo */}
        <Logo x={centerX} y={logoY} maxW={logoMaxW} maxH={logoMaxH} />

        {/* 8. Subtitle */}
        <pixiText text="On-Chain Puzzle Roguelike"
          x={centerX} y={subtitleY} anchor={0.5}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: isMobile ? 14 : 18, fill: 0x6B7280, letterSpacing: 1 }}
        />

        {/* 9. Buttons (procedural) */}
        <pixiContainer>
          <ProceduralButton x={centerX - btnW / 2} y={buttonsY}
            width={btnW} height={btnH} color={0xF97316}
            label="Play Game" onPress={onPlay} fontSize={isMobile ? 20 : 24} />

          {!isConnected && onConnect && (
            <ProceduralButton x={centerX - btnW / 2} y={buttonsY + btnH + btnGap}
              width={btnW} height={btnH} color={0x8B5CF6}
              label="Connect" onPress={onConnect} fontSize={isMobile ? 18 : 20} />
          )}

          <ProceduralButton x={centerX - btnW / 2}
            y={buttonsY + (btnH + btnGap) * ((!isConnected && onConnect) ? 2 : 1)}
            width={btnW} height={btnH} color={0x22C55E}
            label="Adventures" onPress={() => {}} fontSize={isMobile ? 18 : 20} />
        </pixiContainer>

        {/* 10. Top bar - LAST so it's on top and clickable */}
        <TopBar
          layout={layout}
          cubeBalance={cubeBalance}
          onMenuClick={() => {}}
          onQuestsClick={onQuestsClick}
          onTrophyClick={onTrophyClick}
          onShopClick={onShopClick}
        />

        {/* 11. Footer */}
        <pixiText text="Built on Starknet with Dojo"
          x={centerX} y={sh - 16} anchor={0.5}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x9CA3AF }}
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
