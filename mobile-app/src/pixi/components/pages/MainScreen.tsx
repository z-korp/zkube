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
import { PlayScreenInner } from './PlayScreen';
import { PageTopBar } from './PageTopBar';
import { PixiToastLayer } from '../ui/PixiToastLayer';
import { useGame } from '@/hooks/useGame';
import { useMusicPlayer } from '@/contexts/hooks';
import { getZone } from '@/pixi/utils/mapLayout';
import { getZoneTheme } from '@/pixi/utils/zoneThemes';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import type { QuestFamily } from '@/types/questFamily';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import type { ThemeId } from '../../utils/colors';
import { resolveAsset } from '../../assets/resolver';
import { AssetId } from '../../assets/catalog';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { PixiButton } from '../../ui/PixiButton';

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

export interface MainScreenProps {
  // Navigation
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
  onRefreshGames?: () => void;
  // Trophies
  onTrophyClick?: () => void;
  // Loadout/Play
  onStartGame: (selectedBonuses: number[], cubesToBring: number) => Promise<number | undefined>;
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
  // Settings — audio volume sliders
  musicVolume?: number;
  effectsVolume?: number;
  onMusicVolumeChange?: (v: number) => void;
  onEffectsVolumeChange?: (v: number) => void;
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
        <pixiText text="ZKUBE" anchor={0.5} style={logoFallbackStyle} />
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

      <PixiButton x={tutorialX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="scroll" onPress={onTutorialClick} />
      <PixiButton x={questsX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="scroll" onPress={onQuestsClick} />
      <PixiButton x={trophyX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="trophy" onPress={onTrophyClick} />
      <PixiButton x={settingsBtnX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="settings" onPress={onSettingsClick} />

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
      <PixiButton x={centerX - btnW / 2} y={playY}
        width={btnW} height={btnH} variant="orange"
        label="PLAY GAME" onPress={() => navigate('loadout')}
        textStyle={{ fontFamily: FONT_TITLE, fontSize: isMobile ? 20 : 24 }} />

      {/* My Games */}
      <PixiButton x={centerX - btnW / 2} y={myGamesY}
        width={btnW} height={btnH} variant="purple"
        label={`MY GAMES${activeGamesCount > 0 ? ` (${activeGamesCount})` : ''}`}
        onPress={() => navigate('mygames')}
        textStyle={{ fontFamily: FONT_TITLE, fontSize: isMobile ? 18 : 20 }} />

      {/* Shop */}
      <PixiButton x={centerX - btnW / 2} y={shopY}
        width={btnW} height={btnH} variant="green"
        label="SHOP" onPress={() => navigate('shop')}
        textStyle={{ fontFamily: FONT_TITLE, fontSize: isMobile ? 18 : 20 }} />

      {/* Leaderboard */}
      <PixiButton x={centerX - btnW / 2} y={leaderboardY}
        width={btnW} height={btnH} variant="orange"
        label="LEADERBOARD" onPress={() => navigate('leaderboard')}
        textStyle={{ fontFamily: FONT_TITLE, fontSize: isMobile ? 18 : 20 }} />

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
    onConnect, onProfileClick, isConnected, username, walletAddress,
    cubeBalance = 0, games = [], gamesLoading = false, onRefreshGames, onTrophyClick,
    onStartGame, isStartingGame = false, playerMetaData,
    leaderboardEntries = [], leaderboardLoading = false, onRefreshLeaderboard,
    questFamilies = [], questsLoading = false, questsStatus = 'success', onRefreshQuests, onClaimQuest,
    onUpgradeStartingBonus, onUpgradeBagSize, onUpgradeBridging, onUnlockBonus,
    musicVolume, effectsVolume, onMusicVolumeChange, onEffectsVolumeChange,
  } = props;

  const { currentPage, isTransitioning, transitionDirection, transitionProgressRef, navigate, goHome } = usePageNavigator();
  const { setMusicContext } = useMusicPlayer();
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  // Fetch game data for map view when a game is selected
  const { game: activeGame, seed: activeGameSeed } = useGame({
    gameId: activeGameId ?? undefined,
    shouldLog: false,
  });
  const mapSeed = activeGame ? activeGameSeed : undefined;
  const mapCurrentLevel = activeGame ? activeGame.level : undefined;

  useEffect(() => {
    if (currentPage === 'map' && mapSeed && mapCurrentLevel) {
      const zone = getZone(mapCurrentLevel);
      const zoneTheme = getZoneTheme(mapSeed, zone);
      setMusicContext('map', zoneTheme);
      return;
    }

    if (currentPage === 'play') return;

    setMusicContext('main');
  }, [currentPage, mapSeed, mapCurrentLevel, setMusicContext]);
  const mapIsGameOver = activeGame ? Boolean(activeGame.over) : false;
  const mapLevelStarsFn = useMemo(
    () => activeGame ? (level: number) => activeGame.getLevelStars(level) : undefined,
    [activeGame],
  );

  const handleGoHome = useCallback(() => {
    goHome();
    setActiveGameId(null);
    onRefreshGames?.();
  }, [goHome, onRefreshGames]);

  const handlePlayAgain = useCallback(() => {
    setActiveGameId(null);
    navigate('loadout');
  }, [navigate]);

  const handlePlayLevel = useCallback((_contractLevel: number) => {
    if (activeGameId) {
      navigate('play');
    }
  }, [activeGameId, navigate]);

  const handleNavigateToGame = useCallback((gameId: number) => {
    setActiveGameId(gameId);
    navigate('map');
  }, [navigate]);

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
      <PixiToastLayer screenWidth={sw} screenHeight={sh} />

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
            uiScale={uiScale}
            musicVolume={musicVolume}
            effectsVolume={effectsVolume}
            onMusicVolumeChange={onMusicVolumeChange}
            onEffectsVolumeChange={onEffectsVolumeChange}
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
            onResumeGame={handleNavigateToGame}
          />
        )}

        {currentPage === 'tutorial' && (
          <TutorialPage
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
          />
        )}

        {currentPage === 'map' && (
          mapSeed !== undefined && mapCurrentLevel !== undefined ? (
            <MapPage
              seed={mapSeed}
              currentLevel={mapCurrentLevel}
              isGameOver={mapIsGameOver}
              screenWidth={sw}
              screenHeight={sh}
              topBarHeight={topBarH}
              onPlayLevel={handlePlayLevel}
              onBack={handleGoHome}
              levelStarsFn={mapLevelStarsFn}
            />
          ) : (
            <pixiContainer>
              <PageTopBar
                title="ADVENTURE MAP"
                subtitle="SYNCING GAME DATA..."
                screenWidth={sw}
                topBarHeight={topBarH}
              />
            </pixiContainer>
          )
        )}

        {currentPage === 'loadout' && (
          <LoadoutPage
            onConfirm={async (bonuses, cubes) => {
              const gameId = await onStartGame(bonuses, cubes);
              if (gameId) handleNavigateToGame(gameId);
            }}
            onCancel={goHome}
            playerMetaData={playerMetaData ?? null}
            cubeBalance={cubeBalance}
            isLoading={isStartingGame}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={topBarH}
          />
        )}

        {currentPage === 'play' && activeGameId != null && (
          <PlayScreenInner
            gameId={activeGameId}
            onGoHome={handleGoHome}
            onPlayAgain={handlePlayAgain}
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
