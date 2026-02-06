/**
 * LandingScreen - 100% PixiJS. No HTML.
 *
 * Layout:
 *   [TopBar: menu | cube balance | quests | trophy | shop]
 *   [Logo]
 *   [Play Game]
 *   [My Games (X)]
 *   [Shop]
 *   [Connect / Login]   (only when not connected)
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { Modal, Button } from '../ui';
import { MenuButton } from '../topbar/MenuButton';
import { CubeBalance } from '../topbar/CubeBalance';
import { NavButton } from '../topbar/NavButton';
import { MyGamesModal, type PlayerGame } from './MyGamesModal';
import { LoadoutModal } from './LoadoutModal';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';

// ============================================================================
// CONSTANTS
// ============================================================================

const T = '/assets/theme-1';
const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

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
  // Game data for My Games
  games?: PlayerGame[];
  gamesLoading?: boolean;
  onResumeGame?: (tokenId: number) => void;
  // TopBar callbacks
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onShopClick?: () => void;
  // LoadoutModal props
  showLoadoutModal?: boolean;
  onLoadoutClose?: () => void;
  onLoadoutConfirm?: (selectedBonuses: number[], cubesToBring: number) => void;
  playerMetaData?: PlayerMetaData | null;
  isStartingGame?: boolean;
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
// SKY BACKGROUND
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
// CLOUDS
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
        y: 50 + Math.random() * h * 0.25,
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
        if (c.x > w + 200) { c.x = -200 * c.scale; c.y = 50 + Math.random() * h * 0.25; }
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
// LOGO
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
          fontFamily: FONT, fontSize: 64, fill: 0x6D28D9, letterSpacing: 4,
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
// STYLED BUTTON (whiter text, consistent)
// ============================================================================

const LandingButton = ({
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
    g.setFillStyle({ color: 0x000000, alpha: 0.2 });
    g.roundRect(3, 4, width, height, r); g.fill();
    g.setFillStyle({ color });
    g.roundRect(0, 0, width, height, r); g.fill();
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.25 });
    g.roundRect(4, 3, width - 8, height * 0.35, r - 2); g.fill();
    g.setStrokeStyle({ width: 2, color: 0xFFFFFF, alpha: 0.3 });
    g.roundRect(0, 0, width, height, r); g.stroke();
  }, [width, height, color]);

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics draw={draw}
        eventMode="static" cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onPress(); }}
        onPointerUpOutside={() => { setPressed(false); setHovered(false); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => { setHovered(false); setPressed(false); }}
      />
      <pixiText text={label} x={width / 2} y={height / 2} anchor={0.5}
        style={{
          fontFamily: FONT, fontSize, fill: 0xFFFFFF,
          letterSpacing: 1,
          dropShadow: { alpha: 0.6, angle: Math.PI / 4, blur: 2, distance: 2, color: 0x000000 },
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// INLINE TOP BAR
// ============================================================================

const LandingTopBar = ({
  sw, topBarH, isMobile, uiScale, cubeBalance,
  onMenuClick, onQuestsClick, onTrophyClick, onShopClick,
}: {
  sw: number; topBarH: number; isMobile: boolean; uiScale: number;
  cubeBalance: number;
  onMenuClick: () => void; onQuestsClick: () => void;
  onTrophyClick: () => void; onShopClick: () => void;
}) => {
  const btnSize = isMobile ? 36 : 42;
  const gap = Math.round(8 * uiScale);
  const pad = Math.round(12 * uiScale);
  const navW = isMobile ? 40 : 56;

  const menuX = pad;
  const menuY = (topBarH - btnSize) / 2;
  const cubeX = menuX + btnSize + gap;
  const shopX = sw - pad - navW;
  const trophyX = shopX - navW - gap;
  const questsX = trophyX - navW - gap;

  const drawBg = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, sw, topBarH);
    g.fill({ color: 0x0f172a, alpha: 0.85 });
    g.rect(0, topBarH - 1, sw, 1);
    g.fill({ color: 0x334155, alpha: 0.4 });
  }, [sw, topBarH]);

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()} />
      <MenuButton x={menuX} y={menuY} size={btnSize} onClick={onMenuClick} />
      <CubeBalance balance={cubeBalance} x={cubeX} y={menuY} height={btnSize} uiScale={uiScale} />
      <NavButton icon="quests" x={questsX} y={menuY} width={navW} height={btnSize}
        onClick={onQuestsClick} label={isMobile ? undefined : 'Quests'} />
      <NavButton icon="trophy" x={trophyX} y={menuY} width={navW} height={btnSize}
        onClick={onTrophyClick} />
      <NavButton icon="shop" x={shopX} y={menuY} width={navW} height={btnSize}
        onClick={onShopClick} />
    </pixiContainer>
  );
};

// ============================================================================
// PLACEHOLDER MODAL (for menu/quests/shop)
// ============================================================================

const PlaceholderModal = ({
  isOpen, onClose, title, subtitle, sw, sh,
}: {
  isOpen: boolean; onClose: () => void; title: string; subtitle: string;
  sw: number; sh: number;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}
      width={320} screenWidth={sw} screenHeight={sh}>
      <pixiContainer x={24} y={0}>
        <pixiText text="Coming soon..." x={136} y={16} anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x94a3b8 }} />
        <Button text="Close" y={60} width={272} height={44} variant="secondary" onClick={onClose} />
      </pixiContainer>
    </Modal>
  );
};

// ============================================================================
// LANDING SCREEN INNER
// ============================================================================

const LandingScreenInner = ({
  onPlay, onConnect, isConnected,
  cubeBalance = 0,
  games = [], gamesLoading = false, onResumeGame,
  onQuestsClick, onTrophyClick, onShopClick,
  // LoadoutModal props
  showLoadoutModal = false, onLoadoutClose, onLoadoutConfirm,
  playerMetaData = null, isStartingGame = false,
}: LandingScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight, uiScale } = layout;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMyGamesOpen, setIsMyGamesOpen] = useState(false);

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const centerX = sw / 2;

  // Layout
  const logoMaxH = isMobile ? 80 : 120;
  const logoMaxW = isMobile ? 220 : 340;
  const logoY = topBarHeight + (isMobile ? 40 : 70) + logoMaxH / 2;

  const btnW = isMobile ? 220 : 260;
  const btnH = isMobile ? 50 : 56;
  const btnGap = 12;
  const firstBtnY = logoY + logoMaxH / 2 + (isMobile ? 20 : 35);

  const activeGamesCount = games.filter(g => !g.gameOver).length;

  // Button positions
  let btnIdx = 0;
  const playY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const myGamesY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const shopY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const connectY = firstBtnY + (btnH + btnGap) * btnIdx++;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <Application
        width={sw} height={sh}
        backgroundAlpha={1} background={0xD0EAF8}
        resolution={dpr} autoDensity antialias
      >
        {/* Background */}
        <SkyBackground w={sw} h={sh} />
        <Clouds w={sw} h={sh} />

        {/* Logo (no subtitle) */}
        <Logo x={centerX} y={logoY} maxW={logoMaxW} maxH={logoMaxH} />

        {/* Play Game */}
        <LandingButton x={centerX - btnW / 2} y={playY}
          width={btnW} height={btnH} color={0xF97316}
          label="Play Game" onPress={onPlay} fontSize={isMobile ? 20 : 24} />

        {/* My Games (X) */}
        <LandingButton x={centerX - btnW / 2} y={myGamesY}
          width={btnW} height={btnH} color={0x3B82F6}
          label={`My Games${activeGamesCount > 0 ? ` (${activeGamesCount})` : ''}`}
          onPress={() => setIsMyGamesOpen(true)} fontSize={isMobile ? 18 : 20} />

        {/* Shop */}
        <LandingButton x={centerX - btnW / 2} y={shopY}
          width={btnW} height={btnH} color={0x22C55E}
          label="Shop" onPress={onShopClick ?? (() => setIsShopOpen(true))}
          fontSize={isMobile ? 18 : 20} />

        {/* Connect / Login (only when not connected) */}
        {!isConnected && onConnect && (
          <LandingButton x={centerX - btnW / 2} y={connectY}
            width={btnW} height={btnH} color={0x8B5CF6}
            label="Connect" onPress={onConnect} fontSize={isMobile ? 18 : 20} />
        )}

        {/* Footer */}
        <pixiText text="Built on Starknet with Dojo"
          x={centerX} y={sh - 16} anchor={0.5}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0xFFFFFF,
            dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
          }}
        />

        {/* TopBar - last for z-order */}
        <LandingTopBar
          sw={sw} topBarH={topBarHeight} isMobile={isMobile} uiScale={uiScale}
          cubeBalance={cubeBalance}
          onMenuClick={() => setIsMenuOpen(true)}
          onQuestsClick={onQuestsClick ?? (() => setIsQuestsOpen(true))}
          onTrophyClick={onTrophyClick ?? (() => {})}
          onShopClick={onShopClick ?? (() => setIsShopOpen(true))}
        />

        {/* Modals */}
        <PlaceholderModal isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}
          title="Menu" subtitle="Settings & options" sw={sw} sh={sh} />
        <PlaceholderModal isOpen={isQuestsOpen} onClose={() => setIsQuestsOpen(false)}
          title="Quests" subtitle="Daily challenges" sw={sw} sh={sh} />
        <PlaceholderModal isOpen={isShopOpen} onClose={() => setIsShopOpen(false)}
          title="Shop" subtitle="Upgrades & items" sw={sw} sh={sh} />

        {/* My Games Modal */}
        <MyGamesModal
          isOpen={isMyGamesOpen}
          onClose={() => setIsMyGamesOpen(false)}
          games={games}
          loading={gamesLoading}
          screenWidth={sw}
          screenHeight={sh}
          onResumeGame={onResumeGame ?? (() => {})}
        />

        {/* Loadout Modal */}
        {onLoadoutConfirm && (
          <LoadoutModal
            isOpen={showLoadoutModal}
            onClose={onLoadoutClose ?? (() => {})}
            onConfirm={onLoadoutConfirm}
            playerMetaData={playerMetaData}
            cubeBalance={cubeBalance}
            isLoading={isStartingGame}
            screenWidth={sw}
            screenHeight={sh}
          />
        )}
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
