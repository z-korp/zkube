/**
 * LandingScreen - Full PixiJS landing page using real tiki assets
 *
 * - bg-sky texture as full background
 * - Drifting procedural clouds
 * - grass-strip + bush-strip at the bottom
 * - Real tiki block textures (block-1/2/3) stacking at the bottom
 * - logo-zkube.png as title
 * - Real button textures (btn-orange-lg, btn-green-lg)
 * - TopBar with menu, cube balance, quests, trophy, shop (reuses existing PixiJS components)
 * - Palm trees on sides
 * - Floating decorative blocks
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { TopBar } from '../topbar';
import { MenuModal } from '../modals';

// ============================================================================
// CONSTANTS
// ============================================================================

const A = '/assets/tiki2'; // asset base path
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
// TEXTURE LOADER HOOK
// ============================================================================

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    Assets.load(path).then(t => setTex(t as Texture)).catch(() => setTex(null));
  }, [path]);
  return tex;
}

function useTextures(paths: string[]): Record<string, Texture | null> {
  const [textures, setTextures] = useState<Record<string, Texture | null>>({});
  useEffect(() => {
    const result: Record<string, Texture | null> = {};
    Promise.all(
      paths.map(p =>
        Assets.load(p)
          .then(t => { result[p] = t as Texture; })
          .catch(() => { result[p] = null; })
      )
    ).then(() => setTextures({ ...result }));
  }, [paths.join(',')]);
  return textures;
}

// ============================================================================
// SKY BACKGROUND (texture-based)
// ============================================================================

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const tex = useTexture(`${A}/bg-sky.png`);

  // Fallback gradient (always defined, hooks can't be conditional)
  const drawFallback = useCallback((g: PixiGraphics) => {
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

  if (!tex) {
    return <pixiGraphics draw={drawFallback} />;
  }

  // Cover the full screen with the sky texture
  const scaleX = w / tex.width;
  const scaleY = h / tex.height;
  const scale = Math.max(scaleX, scaleY);
  const offX = (w - tex.width * scale) / 2;
  const offY = (h - tex.height * scale) / 2;

  return (
    <pixiSprite texture={tex} x={offX} y={offY} scale={{ x: scale, y: scale }} />
  );
};

// ============================================================================
// CLOUDS (procedural - lightweight)
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
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.35 });
    g.circle(5 * s, -12 * s, 14 * s); g.fill();
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
// GROUND LAYERS (grass + bush textures)
// ============================================================================

const GroundLayers = ({ w, groundY }: { w: number; groundY: number }) => {
  const grassTex = useTexture(`${A}/grass-strip.png`);
  const bushTex = useTexture(`${A}/bush-strip.png`);

  // Fallback if textures don't load
  const drawFallback = useCallback((g: PixiGraphics) => {
    if (grassTex) return;
    g.clear();
    g.setFillStyle({ color: 0x86EFAC, alpha: 0.7 });
    g.rect(0, 0, w, 300);
    g.fill();
  }, [w, grassTex]);

  const grassH = grassTex ? 40 : 0;
  const bushH = bushTex ? 50 : 0;

  return (
    <pixiContainer y={groundY}>
      {/* Fallback green */}
      {!grassTex && <pixiGraphics draw={drawFallback} />}

      {/* Bush strip (behind grass) */}
      {bushTex && (
        <pixiTilingSprite
          texture={bushTex}
          width={w}
          height={bushH}
          y={-bushH + 5}
        />
      )}

      {/* Grass strip */}
      {grassTex && (
        <pixiTilingSprite
          texture={grassTex}
          width={w}
          height={grassH}
          y={-grassH / 2}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// PALM TREES
// ============================================================================

const PalmTrees = ({ w, groundY }: { w: number; groundY: number }) => {
  const palm1 = useTexture(`${A}/palm-tree-1.png`);
  const palm2 = useTexture(`${A}/palm-tree-2.png`);

  if (!palm1 && !palm2) return null;

  const palmH = 180;
  const palmW = 120;

  return (
    <pixiContainer>
      {palm1 && (
        <pixiSprite texture={palm1} x={-10} y={groundY - palmH}
          width={palmW} height={palmH} alpha={0.85} />
      )}
      {palm2 && (
        <pixiSprite texture={palm2} x={w - palmW + 10} y={groundY - palmH + 20}
          width={palmW} height={palmH} alpha={0.85} />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// BLOCK PILE (uses real tiki block textures)
// ============================================================================

const BlockPile = ({ w, h, cellSize }: { w: number; h: number; cellSize: number }) => {
  const blocksRef = useRef<FallingBlock[]>([]);
  const gridRef = useRef<boolean[][]>([]);
  const nextIdRef = useRef(0);
  const [tick, setTick] = useState(0);

  // Load block textures (1=green, 2=blue, 3=purple wide)
  const blockPaths = useMemo(() => [
    `${A}/block-1.png`, `${A}/block-2.png`, `${A}/block-3.png`,
  ], []);
  const textures = useTextures(blockPaths);

  const getBlockTex = useCallback((width: number): Texture | null => {
    // block-1 for 1-wide, block-2 for 2-wide, block-3 for 3+ wide
    if (width <= 1) return textures[blockPaths[0]] ?? null;
    if (width <= 2) return textures[blockPaths[1]] ?? null;
    return textures[blockPaths[2]] ?? null;
  }, [textures, blockPaths]);

  useEffect(() => {
    const totalRows = Math.ceil(h / cellSize);
    gridRef.current = Array.from({ length: totalRows }, () =>
      new Array(GRID_COLS).fill(false));
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
    const widths = [1, 1, 2, 2, 2, 3, 3];
    const blockW = widths[Math.floor(Math.random() * widths.length)];
    const spot = findSpot(blockW);
    if (!spot) return;
    const grid = gridRef.current;
    for (let dx = 0; dx < blockW; dx++) {
      if (grid[spot.row]) grid[spot.row][spot.col + dx] = true;
    }
    blocksRef.current.push({
      id: nextIdRef.current++,
      col: spot.col, row: spot.row, width: blockW,
      y: -cellSize * 2 - Math.random() * 150,
      targetY: spot.row * cellSize,
      speed: 2 + Math.random() * 2.5,
      settled: false,
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
        const tex = getBlockTex(b.width);

        if (tex) {
          return (
            <pixiSprite key={b.id} texture={tex}
              x={bx} y={b.y} width={bw} height={bh} />
          );
        }

        // Procedural fallback
        const color = BLOCK_COLORS[b.colorIdx % BLOCK_COLORS.length];
        return (
          <pixiGraphics key={b.id} x={bx} y={b.y}
            draw={(g) => {
              g.clear();
              const r = Math.min(bw, bh) * 0.18;
              g.setFillStyle({ color: color.fill });
              g.roundRect(2, 2, bw - 4, bh - 4, r);
              g.fill();
              g.setStrokeStyle({ width: 2, color: color.border, alpha: 0.7 });
              g.roundRect(2, 2, bw - 4, bh - 4, r);
              g.stroke();
            }}
          />
        );
      })}
    </pixiContainer>
  );
};

// ============================================================================
// LOGO
// ============================================================================

const Logo = ({ x, y, maxW, maxH }: { x: number; y: number; maxW: number; maxH: number }) => {
  const tex = useTexture(`${A}/logo-zkube.png`);
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
    // Text fallback
    return (
      <pixiText text="zKube" x={x} y={y + bounce} anchor={0.5}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif',
          fontSize: 64,
          fill: 0x6D28D9,
          letterSpacing: 4,
          stroke: { color: 0xFFFFFF, width: 5 },
          dropShadow: { alpha: 0.3, angle: Math.PI / 6, blur: 6, distance: 4, color: 0x4C1D95 },
        }}
      />
    );
  }

  // Scale logo to fit within maxW x maxH
  const scaleX = maxW / tex.width;
  const scaleY = maxH / tex.height;
  const scale = Math.min(scaleX, scaleY, 1); // don't upscale

  return (
    <pixiSprite texture={tex}
      x={x} y={y + bounce}
      anchor={0.5}
      scale={scale}
    />
  );
};

// ============================================================================
// TEXTURE BUTTON (uses real button images)
// ============================================================================

const TextureButton = ({
  x, y, width, height, texturePath, label, onPress, fontSize = 20,
}: {
  x: number; y: number; width: number; height: number;
  texturePath: string; label: string;
  onPress: () => void; fontSize?: number;
}) => {
  const tex = useTexture(texturePath);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const scale = pressed ? 0.95 : hovered ? 1.02 : 1;

  return (
    <pixiContainer
      x={x + width / 2} y={y + height / 2}
      scale={scale}
      pivot={{ x: width / 2, y: height / 2 }}
      eventMode="static" cursor="pointer"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => { setPressed(false); onPress(); }}
      onPointerUpOutside={() => setPressed(false)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => { setHovered(false); setPressed(false); }}
    >
      {tex ? (
        <pixiSprite texture={tex} width={width} height={height} />
      ) : (
        <pixiGraphics draw={(g) => {
          g.clear();
          g.setFillStyle({ color: 0xFF8C00 });
          g.roundRect(0, 0, width, height, 12);
          g.fill();
        }} />
      )}
      <pixiText text={label}
        x={width / 2} y={height / 2}
        anchor={0.5}
        style={{
          fontFamily: 'Bangers, Arial Black, sans-serif',
          fontSize,
          fill: 0xFFFFFF,
          dropShadow: { alpha: 0.5, angle: Math.PI / 4, blur: 2, distance: 2, color: 0x000000 },
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// FLOATING DECORATIVE BLOCK
// ============================================================================

const FloatingBlock = ({
  x, y, size, texturePath, delay = 0,
}: {
  x: number; y: number; size: number; texturePath: string; delay?: number;
}) => {
  const tex = useTexture(texturePath);
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

  return (
    <pixiSprite texture={tex}
      x={x} y={y + offsetY}
      anchor={0.5}
      width={size} height={size}
      rotation={rotation}
    />
  );
};

// ============================================================================
// LANDING SCREEN INNER
// ============================================================================

const LandingScreenInner = ({
  onPlay, onConnect, isConnected,
  cubeBalance = 0, onQuestsClick, onTrophyClick, onShopClick,
}: LandingScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, uiScale } = layout;

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dpr = typeof window !== 'undefined'
    ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Layout
  const cellSize = Math.min(MAX_CELL_SIZE, Math.floor(sw / GRID_COLS));
  const pileHeight = MAX_STACK_ROWS * cellSize;
  const groundY = sh - pileHeight;

  const topBarH = layout.topBarHeight;
  const logoMaxH = isMobile ? 80 : 120;
  const logoMaxW = isMobile ? 220 : 340;
  const logoY = topBarH + (isMobile ? 30 : 50) + logoMaxH / 2;
  const centerX = sw / 2;

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
        {/* 1. Sky background */}
        <SkyBackground w={sw} h={sh} />

        {/* 2. Clouds */}
        <Clouds w={sw} h={sh} />

        {/* 3. Palm trees */}
        <PalmTrees w={sw} groundY={groundY} />

        {/* 4. Ground layers (grass + bush) */}
        <GroundLayers w={sw} groundY={groundY} />

        {/* 5. Block pile */}
        <pixiContainer y={groundY}>
          <BlockPile w={sw} h={pileHeight + cellSize} cellSize={cellSize} />
        </pixiContainer>

        {/* 6. Top bar (menu, cube balance, quests, trophy, shop) */}
        <TopBar
          layout={layout}
          cubeBalance={cubeBalance}
          onMenuClick={() => setIsMenuOpen(true)}
          onQuestsClick={onQuestsClick}
          onTrophyClick={onTrophyClick}
          onShopClick={onShopClick}
        />

        {/* 7. Floating decorative blocks */}
        <FloatingBlock x={centerX - (isMobile ? 130 : 200)} y={logoY}
          size={floatSize} texturePath={`${A}/block-1.png`} delay={0} />
        <FloatingBlock x={centerX + (isMobile ? 110 : 175)} y={logoY - 10}
          size={floatSize * 0.8} texturePath={`${A}/block-2.png`} delay={1.5} />
        <FloatingBlock x={centerX + (isMobile ? 90 : 155)} y={buttonsY + btnH}
          size={floatSize * 0.6} texturePath={`${A}/block-3.png`} delay={3} />
        <FloatingBlock x={centerX - (isMobile ? 120 : 170)} y={buttonsY + btnH / 2}
          size={floatSize * 0.7} texturePath={`${A}/block-1.png`} delay={2} />

        {/* 8. Logo */}
        <Logo x={centerX} y={logoY} maxW={logoMaxW} maxH={logoMaxH} />

        {/* 9. Subtitle */}
        <pixiText text="On-Chain Puzzle Roguelike"
          x={centerX} y={subtitleY} anchor={0.5}
          style={{
            fontFamily: 'Fredericka the Great, Bangers, Arial, sans-serif',
            fontSize: isMobile ? 14 : 18,
            fill: 0x6B7280, letterSpacing: 1,
          }}
        />

        {/* 10. Buttons */}
        <pixiContainer>
          {/* Play Game */}
          <TextureButton
            x={centerX - btnW / 2} y={buttonsY}
            width={btnW} height={btnH}
            texturePath={`${A}/btn-orange-lg.png`}
            label="Play Game"
            onPress={onPlay}
            fontSize={isMobile ? 20 : 24}
          />

          {/* Connect (only if not connected) */}
          {!isConnected && onConnect && (
            <TextureButton
              x={centerX - btnW / 2} y={buttonsY + btnH + btnGap}
              width={btnW} height={btnH}
              texturePath={`${A}/btn-purple-lg.png`}
              label="Connect"
              onPress={onConnect}
              fontSize={isMobile ? 18 : 20}
            />
          )}

          {/* Adventures */}
          <TextureButton
            x={centerX - btnW / 2}
            y={buttonsY + (btnH + btnGap) * ((!isConnected && onConnect) ? 2 : 1)}
            width={btnW} height={btnH}
            texturePath={`${A}/btn-green-lg.png`}
            label="Adventures"
            onPress={() => {}}
            fontSize={isMobile ? 18 : 20}
          />
        </pixiContainer>

        {/* 11. Footer */}
        <pixiText text="Built on Starknet with Dojo"
          x={centerX} y={sh - 16} anchor={0.5}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x9CA3AF }}
        />

        {/* 12. Menu modal */}
        <MenuModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onSurrender={async () => setIsMenuOpen(false)}
          screenWidth={sw}
          screenHeight={sh}
          currentLevel={0}
          cubesEarned={0}
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
