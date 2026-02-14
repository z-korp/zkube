/**
 * MainScreen - Main container that handles page-based navigation with slide transitions
 * 
 * This is the root PixiJS component that renders different pages based on navigation state.
 */

import { Application, useTick } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { PageNavigatorProvider, usePageNavigator, type PageId } from './PageNavigator';
import { TickerConfig } from '../TickerConfig';
import { LeaderboardPage } from './LeaderboardPage';
import { ShopPage } from './ShopPage';
import { QuestsPage } from './QuestsPage';
import { SettingsPage } from './SettingsPage';
import { MyGamesPage, type PlayerGame } from './MyGamesPage';
import { LoadoutPage } from './LoadoutPage';
import { TutorialPage } from './TutorialPage';
import { MapPage } from '../map/MapPage';
import { Button } from '../ui';
import { CubeBalance } from '../topbar/CubeBalance';
import { PixiToastLayer } from '../ui/PixiToastLayer';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import type { QuestFamily } from '@/types/questFamily';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import type { ThemeId } from '../../utils/colors';
import { resolveAsset } from '../../assets/resolver';
import { AssetId } from '../../assets/catalog';
import { useTextureWithFallback } from '../../hooks/useTexture';

const MAIN_FOOTER_STYLE = {
  fontFamily: FONT_BODY, fontSize: 10, fill: 0xFFFFFF,
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
};

// ============================================================================
// CONSTANTS
// ============================================================================


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
  initialPage?: string;
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
  questsStatus?: 'loading' | 'error' | 'success';
  onRefreshQuests?: () => Promise<void> | void;
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
  // Map
  mapSeed?: bigint;
  mapCurrentLevel?: number;
  mapIsGameOver?: boolean;
  onPlayLevel?: (contractLevel: number) => void;
  requestMapNavigation?: boolean;
  onMapNavigated?: () => void;
}

// ============================================================================
// SKY BACKGROUND
// ============================================================================

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const { themeName } = usePixiTheme();
  const bgCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.Background), [themeName]);
  const bgTex = useTextureWithFallback(bgCandidates);

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
  const gfxRef = useRef<PixiGraphics | null>(null);

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

  const tickClouds = useCallback((ticker: { deltaMS: number }) => {
    const g = gfxRef.current;
    if (!g) return;
    const dt = ticker.deltaMS / 16.667;
    g.clear();
    for (const c of cloudsRef.current) {
      c.x += c.speed * dt;
      if (c.x > w + 200) { c.x = -200 * c.scale; c.y = 50 + Math.random() * h * 0.25; }
      const s = c.scale;
      g.setFillStyle({ color: 0xFFFFFF, alpha: 0.9 * c.alpha });
      g.circle(c.x, c.y, 28 * s); g.fill();
      g.circle(c.x + 22 * s, c.y - 7 * s, 22 * s); g.fill();
      g.circle(c.x - 20 * s, c.y - 4 * s, 20 * s); g.fill();
      g.circle(c.x + 10 * s, c.y + 9 * s, 24 * s); g.fill();
      g.circle(c.x - 12 * s, c.y + 10 * s, 18 * s); g.fill();
    }
  }, [w, h]);
  useTick(tickClouds);

  return <pixiGraphics ref={gfxRef} eventMode="none" />;
};

// ============================================================================
// LOGO
// ============================================================================

const Logo = ({ x, y, maxW, maxH }: { x: number; y: number; maxW: number; maxH: number }) => {
  const { themeName } = usePixiTheme();
  const logoCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.Logo), [themeName]);
  const tex = useTextureWithFallback(logoCandidates);
  const containerRef = useRef<import('pixi.js').Container | null>(null);
  const timeRef = useRef(0);

  const tickBounce = useCallback((ticker: { deltaMS: number }) => {
    const dt = ticker.deltaMS / 16.667;
    timeRef.current += 0.025 * dt;
    const container = containerRef.current;
    if (container) {
      container.y = y + Math.sin(timeRef.current * 2) * 4;
    }
  }, [y]);
  useTick(tickBounce);

  const logoFallbackStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 64, fill: 0x6D28D9, letterSpacing: 4,
    stroke: { color: 0xFFFFFF, width: 5 },
    dropShadow: { alpha: 0.3, angle: Math.PI / 6, blur: 6, distance: 4, color: 0x4C1D95 },
  }), []);

  if (!tex) {
    return (
      <pixiContainer ref={containerRef} x={x} y={y}>
        <pixiText text="zKube" anchor={0.5} style={logoFallbackStyle} />
      </pixiContainer>
    );
  }

  const scale = Math.min(maxW / tex.width, maxH / tex.height, 1);
  return (
    <pixiContainer ref={containerRef} x={x} y={y}>
      <pixiSprite texture={tex} anchor={0.5} scale={scale} />
    </pixiContainer>
  );
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
  const btnTextStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize, fill: 0xFFFFFF, letterSpacing: 1,
    dropShadow: { alpha: 0.6, angle: Math.PI / 4, blur: 2, distance: 2, color: 0x000000 },
  }), [fontSize]);

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
      <pixiText text={label} x={width / 2} y={height / 2} anchor={0.5} style={btnTextStyle} eventMode="none" />
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
  const topBtnIconStyle = useMemo(() => ({ fontSize: size * 0.5 }), [size]);

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
      <pixiText text={icon} x={size / 2} y={size / 2} anchor={0.5} style={topBtnIconStyle} eventMode="none" />
    </pixiContainer>
  );
};

// ============================================================================
// HOME TOP BAR
// ============================================================================

const HomeTopBar = ({
  sw, topBarH, isMobile, uiScale, cubeBalance,
  username, isConnected,
  onTutorialClick, onQuestsClick, onTrophyClick, onSettingsClick, onProfileClick, onConnect,
}: {
  sw: number; topBarH: number; isMobile: boolean; uiScale: number;
  cubeBalance: number;
  username?: string;
  isConnected: boolean;
  onTutorialClick: () => void;
  onQuestsClick: () => void;
  onTrophyClick: () => void;
  onSettingsClick: () => void;
  onProfileClick: () => void;
  onConnect?: () => void;
}) => {
  const btnSize = isMobile ? 44 : 48;
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
    fontFamily: FONT_BOLD,
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold' as const,
    fill: 0xfbbf24,
  }), [uiScale]);

  const cubeIconStyle = useMemo(() => ({
    fontSize: Math.round(14 * uiScale),
  }), [uiScale]);

  const usernameStyle = useMemo(() => ({
    fontFamily: FONT_BODY,
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
  const tutorialX = questsX - gap - btnSize;

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()} />

      <pixiText text="🧊" x={pad} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeIconStyle} />
      <pixiText text={String(cubeBalance)} x={pad + Math.round(20 * uiScale)} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeCountStyle} />

      <TopBarButton x={tutorialX} y={centerY} size={btnSize} icon="📖" onClick={onTutorialClick} />
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
        style={MAIN_FOOTER_STYLE}
        eventMode="none"
      />

      {/* TopBar - last for z-order */}
      <HomeTopBar
        sw={sw} topBarH={topBarH} isMobile={isMobile} uiScale={uiScale}
        cubeBalance={cubeBalance}
        username={username} isConnected={isConnected}
        onTutorialClick={() => navigate('tutorial')}
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
    questFamilies = [], questsLoading = false, questsStatus = 'success', onRefreshQuests, onClaimQuest,
    onUpgradeStartingBonus, onUpgradeBagSize, onUpgradeBridging, onUnlockBonus,
    isSoundEnabled, isMusicEnabled, onToggleSound, onToggleMusic,
    mapSeed, mapCurrentLevel, mapIsGameOver, onPlayLevel,
    requestMapNavigation, onMapNavigated,
  } = props;

  const { currentPage, previousPage, isTransitioning, transitionDirection, transitionProgressRef, navigate, goHome } = usePageNavigator();

  useEffect(() => {
    if (requestMapNavigation && mapSeed !== undefined && mapCurrentLevel !== undefined) {
      navigate('map');
      onMapNavigated?.();
    }
  }, [requestMapNavigation, mapSeed, mapCurrentLevel, navigate, onMapNavigated]);

  const pageContainerRef = useRef<any>(null);

  const tickPageTransition = useCallback(() => {
    const container = pageContainerRef.current;
    if (!container) return;

    const p = transitionProgressRef.current;
    if (!isTransitioning) {
      container.x = 0;
      container.alpha = 1;
      return;
    }

    container.alpha = p;
    if (transitionDirection === 'forward') {
      container.x = sw * (1 - p) * 0.3;
    } else {
      container.x = -sw * (1 - p) * 0.3;
    }
  }, [isTransitioning, transitionDirection, sw, transitionProgressRef]);

  useTick(tickPageTransition);

  return (
    <pixiContainer>
      {/* Background (shared, always visible) */}
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />
      <PixiToastLayer screenWidth={sw} topOffset={topBarH + 8} />

      <pixiContainer ref={pageContainerRef}>
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
            isConnected={isConnected ?? false}
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
            status={questsStatus}
            onClaim={onClaimQuest ?? (async () => {})}
            onRefresh={onRefreshQuests}
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

        {currentPage === 'tutorial' && (
          <TutorialPage
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
          />
        )}

        {currentPage === 'map' && mapSeed !== undefined && mapCurrentLevel !== undefined && (
          <MapPage
            seed={mapSeed}
            currentLevel={mapCurrentLevel}
            isGameOver={mapIsGameOver ?? false}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
            onPlayLevel={onPlayLevel}
            onBack={goHome}
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
        <PixiThemeProvider>
          <TickerConfig />
          <PageNavigatorProvider initialPage={props.initialPage as PageId | undefined}>
            <PageRenderer {...props} sw={sw} sh={sh} topBarH={topBarHeight} isMobile={isMobile} uiScale={uiScale} />
          </PageNavigatorProvider>
        </PixiThemeProvider>
      </Application>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export const MainScreen = (props: MainScreenProps) => {
  return <MainScreenInner {...props} />;
};

export default MainScreen;
