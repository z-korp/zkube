/**
 * MainScreen - Main container that handles page-based navigation with slide transitions
 * 
 * This is the root PixiJS component that renders different pages based on navigation state.
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { PageNavigatorProvider, usePageNavigator, type PageId } from './PageNavigator';
import { LeaderboardPage } from './LeaderboardPage';
import { ShopPage } from './ShopPage';
import { QuestsPage } from './QuestsPage';
import { SettingsPage } from './SettingsPage';
import { MyGamesPage, type PlayerGame } from './MyGamesPage';
import { LoadoutPage } from './LoadoutPage';
import { Button } from '../ui';
import { CubeBalance } from '../topbar/CubeBalance';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import type { QuestFamily } from '@/types/questFamily';

// ============================================================================
// CONSTANTS
// ============================================================================

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

export interface MainScreenProps {
  // Navigation
  onNavigateToGame: (gameId: number) => void;
  // Wallet
  onConnect?: () => void;
  onProfileClick?: () => void;
  isConnected?: boolean;
  username?: string;
  walletAddress?: string;
  cubeBalance?: number;
  // Games
  games?: PlayerGame[];
  gamesLoading?: boolean;
  // Trophies
  onTrophyClick?: () => void;
  // Loadout/Play
  onStartGame: (selectedBonuses: number[], cubesToBring: number) => void;
  isStartingGame?: boolean;
  playerMetaData?: PlayerMetaData | null;
  // Leaderboard
  leaderboardEntries?: LeaderboardEntry[];
  leaderboardLoading?: boolean;
  onRefreshLeaderboard?: () => void;
  // Quests
  questFamilies?: QuestFamily[];
  questsLoading?: boolean;
  onClaimQuest?: (questId: string, intervalId: number) => Promise<void>;
  // Shop
  onUpgradeStartingBonus?: (bonusType: number) => Promise<void>;
  onUpgradeBagSize?: (bonusType: number) => Promise<void>;
  onUpgradeBridging?: () => Promise<void>;
  onUnlockBonus?: (bonusType: number) => Promise<void>;
  // Settings
  isSoundEnabled?: boolean;
  isMusicEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleMusic?: () => void;
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
  const { getAssetPath } = usePixiTheme();
  const bgTex = useTexture(getAssetPath('theme-2-1.png'));

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
  const [, setTick] = useState(0);

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
  const { getAssetPath } = usePixiTheme();
  const tex = useTexture(getAssetPath('logo.png'));
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
// STYLED BUTTON (for main menu buttons)
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
// TOP BAR ICON BUTTON
// ============================================================================

const TopBarButton = ({
  x, y, size, icon, onClick,
}: {
  x: number; y: number; size: number; icon: string; onClick: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = pressed ? 0.9 : hovered ? 1.05 : 1;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: hovered ? 0x334155 : 0x1e293b, alpha: 0.9 });
    g.roundRect(0, 0, size, size, 8);
    g.fill();
    g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
    g.roundRect(0, 0, size, size, 8);
    g.stroke();
  }, [size, hovered]);

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics draw={draw}
        eventMode="static" cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onClick(); }}
        onPointerUpOutside={() => { setPressed(false); setHovered(false); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => { setHovered(false); setPressed(false); }}
      />
      <pixiText text={icon} x={size / 2} y={size / 2} anchor={0.5}
        style={{ fontSize: size * 0.5 }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// HOME TOP BAR
// ============================================================================

const HomeTopBar = ({
  sw, topBarH, isMobile, uiScale, cubeBalance,
  username, isConnected,
  onQuestsClick, onTrophyClick, onSettingsClick, onProfileClick, onConnect,
}: {
  sw: number; topBarH: number; isMobile: boolean; uiScale: number;
  cubeBalance: number;
  username?: string;
  isConnected: boolean;
  onQuestsClick: () => void;
  onTrophyClick: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onConnect?: () => void;
}) => {
  const btnSize = isMobile ? 34 : 40;
  const gap = Math.round(8 * uiScale);
  const pad = Math.round(10 * uiScale);
  const centerY = (topBarH - btnSize) / 2;

  const drawBg = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, sw, topBarH);
    g.fill({ color: 0x000000, alpha: 1 });
    g.rect(0, topBarH - 1, sw, 1);
    g.fill({ color: 0x334155, alpha: 0.8 });
  }, [sw, topBarH]);

  const cubeCountStyle = useMemo(() => ({
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold' as const,
    fill: 0xfbbf24,
  }), [uiScale]);

  const cubeIconStyle = useMemo(() => ({
    fontSize: Math.round(14 * uiScale),
  }), [uiScale]);

  const usernameStyle = useMemo(() => ({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(11 * uiScale),
    fontWeight: 'bold' as const,
    fill: 0xffffff,
  }), [uiScale]);

  const controllerBtnW = isConnected && username
    ? Math.max(btnSize, Math.min(120, username.length * 8 + 30))
    : btnSize;

  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [ctrlHovered, setCtrlHovered] = useState(false);
  const ctrlScale = ctrlPressed ? 0.9 : ctrlHovered ? 1.05 : 1;

  const drawControllerBtn = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, controllerBtnW, btnSize, 8);
    g.fill({ color: ctrlHovered ? 0x4338ca : 0x3730a3, alpha: 0.9 });
    g.roundRect(0, 0, controllerBtnW, btnSize, 8);
    g.stroke({ color: 0x6366f1, width: 1, alpha: 0.5 });
  }, [controllerBtnW, btnSize, ctrlHovered]);

  const settingsX = sw - pad - controllerBtnW;
  const settingsBtnX = settingsX - gap - btnSize;
  const trophyX = settingsBtnX - gap - btnSize;
  const questsX = trophyX - gap - btnSize;

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()} />

      <pixiText text="🧊" x={pad} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeIconStyle} />
      <pixiText text={String(cubeBalance)} x={pad + Math.round(20 * uiScale)} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeCountStyle} />

      <TopBarButton x={questsX} y={centerY} size={btnSize} icon="📜" onClick={onQuestsClick} />
      <TopBarButton x={trophyX} y={centerY} size={btnSize} icon="🏆" onClick={onTrophyClick} />
      <TopBarButton x={settingsBtnX} y={centerY} size={btnSize} icon="⚙" onClick={onSettingsClick} />

      <pixiContainer x={settingsX} y={centerY} scale={ctrlScale}>
        <pixiGraphics draw={drawControllerBtn}
          eventMode="static" cursor="pointer"
          onPointerDown={() => setCtrlPressed(true)}
          onPointerUp={() => { setCtrlPressed(false); isConnected ? onProfileClick() : onConnect?.(); }}
          onPointerUpOutside={() => { setCtrlPressed(false); setCtrlHovered(false); }}
          onPointerOver={() => setCtrlHovered(true)}
          onPointerOut={() => { setCtrlHovered(false); setCtrlPressed(false); }}
        />
        <pixiText
          text={isConnected && username ? username : "👤"}
          x={controllerBtnW / 2} y={btnSize / 2} anchor={0.5}
          style={isConnected && username ? usernameStyle : { fontSize: btnSize * 0.45 }}
          eventMode="none"
        />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// HOME PAGE CONTENT
// ============================================================================

const HomePageContent = ({
  sw, sh, topBarH, isMobile, uiScale, cubeBalance,
  games, isConnected, username, onConnect, onProfileClick, onTrophyClick,
  navigate,
}: {
  sw: number;
  sh: number;
  topBarH: number;
  isMobile: boolean;
  uiScale: number;
  cubeBalance: number;
  games: PlayerGame[];
  isConnected: boolean;
  username?: string;
  onConnect?: () => void;
  onProfileClick?: () => void;
  onTrophyClick?: () => void;
  navigate: (page: PageId) => void;
}) => {
  const centerX = sw / 2;
  const logoMaxH = isMobile ? 80 : 120;
  const logoMaxW = isMobile ? 220 : 340;
  const logoY = topBarH + (isMobile ? 40 : 70) + logoMaxH / 2;

  const btnW = isMobile ? 220 : 260;
  const btnH = isMobile ? 50 : 56;
  const btnGap = 12;
  const firstBtnY = logoY + logoMaxH / 2 + (isMobile ? 20 : 35);

  const activeGamesCount = games.filter(g => !g.gameOver).length;

  let btnIdx = 0;
  const playY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const myGamesY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const shopY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const leaderboardY = firstBtnY + (btnH + btnGap) * btnIdx++;

  return (
    <pixiContainer>
      {/* Logo */}
      <Logo x={centerX} y={logoY} maxW={logoMaxW} maxH={logoMaxH} />

      {/* Play Game */}
      <LandingButton x={centerX - btnW / 2} y={playY}
        width={btnW} height={btnH} color={0xF97316}
        label="Play Game" onPress={() => navigate('loadout')} fontSize={isMobile ? 20 : 24} />

      {/* My Games */}
      <LandingButton x={centerX - btnW / 2} y={myGamesY}
        width={btnW} height={btnH} color={0x3B82F6}
        label={`My Games${activeGamesCount > 0 ? ` (${activeGamesCount})` : ''}`}
        onPress={() => navigate('mygames')} fontSize={isMobile ? 18 : 20} />

      {/* Shop */}
      <LandingButton x={centerX - btnW / 2} y={shopY}
        width={btnW} height={btnH} color={0x22C55E}
        label="Shop" onPress={() => navigate('shop')}
        fontSize={isMobile ? 18 : 20} />

      {/* Leaderboard */}
      <LandingButton x={centerX - btnW / 2} y={leaderboardY}
        width={btnW} height={btnH} color={0xEAB308}
        label="Leaderboard" onPress={() => navigate('leaderboard')}
        fontSize={isMobile ? 18 : 20} />

      {/* Footer */}
      <pixiText text="Built on Starknet with Dojo"
        x={centerX} y={sh - 16} anchor={0.5}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0xFFFFFF,
          dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
        }}
      />

      {/* TopBar - last for z-order */}
      <HomeTopBar
        sw={sw} topBarH={topBarH} isMobile={isMobile} uiScale={uiScale}
        cubeBalance={cubeBalance}
        username={username} isConnected={isConnected}
        onQuestsClick={() => navigate('quests')}
        onTrophyClick={onTrophyClick ?? (() => {})}
        onSettingsClick={() => navigate('settings')}
        onProfileClick={onProfileClick ?? (() => {})}
        onConnect={onConnect}
      />
    </pixiContainer>
  );
};

// ============================================================================
// PAGE RENDERER - handles transitions
// ============================================================================

const PageRenderer = (props: MainScreenProps & {
  sw: number;
  sh: number;
  topBarH: number;
  isMobile: boolean;
  uiScale: number;
}) => {
  const {
    sw, sh, topBarH, isMobile, uiScale,
    onNavigateToGame, onConnect, onProfileClick, isConnected, username, walletAddress,
    cubeBalance = 0, games = [], gamesLoading = false, onTrophyClick,
    onStartGame, isStartingGame = false, playerMetaData,
    leaderboardEntries = [], leaderboardLoading = false, onRefreshLeaderboard,
    questFamilies = [], questsLoading = false, onClaimQuest,
    onUpgradeStartingBonus, onUpgradeBagSize, onUpgradeBridging, onUnlockBonus,
    isSoundEnabled, isMusicEnabled, onToggleSound, onToggleMusic,
  } = props;

  const { currentPage, previousPage, isTransitioning, transitionDirection, transitionProgress, navigate, goHome } = usePageNavigator();

  // Calculate slide positions
  const getPageX = (page: PageId, isCurrent: boolean): number => {
    if (!isTransitioning) return 0;

    if (transitionDirection === 'forward') {
      // Current page slides in from right
      if (isCurrent) {
        return sw * (1 - transitionProgress);
      }
      // Previous page slides out to left
      return -sw * transitionProgress * 0.3; // Partial slide for parallax effect
    } else {
      // Back transition: current page slides out to right
      if (isCurrent && page !== 'home') {
        return sw * transitionProgress;
      }
      // Home slides in from left
      if (page === 'home') {
        return -sw * 0.3 * (1 - transitionProgress);
      }
    }
    return 0;
  };

  // Only render the current page - fade it in during transition
  // This prevents old page elements from showing through
  const pageAlpha = isTransitioning ? transitionProgress : 1;
  const pageX = isTransitioning 
    ? (transitionDirection === 'forward' ? sw * (1 - transitionProgress) * 0.3 : -sw * (1 - transitionProgress) * 0.3)
    : 0;

  return (
    <pixiContainer>
      {/* Background (shared, always visible) */}
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />

      {/* Current page only - fades in during transition */}
      <pixiContainer x={pageX} alpha={pageAlpha}>
        {currentPage === 'home' && (
          <HomePageContent
            sw={sw} sh={sh} topBarH={topBarH} isMobile={isMobile} uiScale={uiScale}
            cubeBalance={cubeBalance} games={games}
            isConnected={isConnected ?? false} username={username}
            onConnect={onConnect} onProfileClick={onProfileClick} onTrophyClick={onTrophyClick}
            navigate={navigate}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage
            entries={leaderboardEntries}
            loading={leaderboardLoading}
            onRefresh={onRefreshLeaderboard ?? (() => {})}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
          />
        )}

        {currentPage === 'shop' && (
          <ShopPage
            playerMeta={playerMetaData ?? null}
            cubeBalance={cubeBalance}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
            onUpgradeStartingBonus={onUpgradeStartingBonus}
            onUpgradeBagSize={onUpgradeBagSize}
            onUpgradeBridging={onUpgradeBridging}
            onUnlockBonus={onUnlockBonus}
          />
        )}

        {currentPage === 'quests' && (
          <QuestsPage
            questFamilies={questFamilies}
            loading={questsLoading}
            onClaim={onClaimQuest ?? (async () => {})}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
            cubeBalance={cubeBalance}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
            isSoundEnabled={isSoundEnabled}
            isMusicEnabled={isMusicEnabled}
            onToggleSound={onToggleSound}
            onToggleMusic={onToggleMusic}
            username={username}
            walletAddress={walletAddress}
          />
        )}

        {currentPage === 'mygames' && (
          <MyGamesPage
            games={games}
            loading={gamesLoading}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
            onResumeGame={onNavigateToGame}
          />
        )}

        {currentPage === 'loadout' && (
          <LoadoutPage
            onConfirm={onStartGame}
            onCancel={goHome}
            playerMetaData={playerMetaData ?? null}
            cubeBalance={cubeBalance}
            isLoading={isStartingGame}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
          />
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// MAIN SCREEN INNER
// ============================================================================

const MainScreenInner = (props: MainScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight, uiScale } = layout;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <Application
        width={sw} height={sh}
        backgroundAlpha={1} background={0xD0EAF8}
        resolution={dpr} autoDensity antialias
      >
        <PageNavigatorProvider>
          <PageRenderer {...props} sw={sw} sh={sh} topBarH={topBarHeight} isMobile={isMobile} uiScale={uiScale} />
        </PageNavigatorProvider>
      </Application>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export const MainScreen = (props: MainScreenProps) => {
  return (
    <PixiThemeProvider>
      <MainScreenInner {...props} />
    </PixiThemeProvider>
  );
};

export default MainScreen;
