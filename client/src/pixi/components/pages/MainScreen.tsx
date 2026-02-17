import { Application, useTick } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { PageNavigatorProvider, usePageNavigator, type PageId } from './PageNavigator';
import { TickerConfig } from '../TickerConfig';
import { LoadoutPage } from './LoadoutPage';
import { PageTopBar } from './PageTopBar';
import { PlayScreenInner } from './PlayScreen';
import { LeaderboardPage } from './LeaderboardPage';
import { ShopPage } from './ShopPage';
import { QuestsPage } from './QuestsPage';
import { SettingsPage } from './SettingsPage';
import { MyGamesPage } from './MyGamesPage';
import { TutorialPage } from './TutorialPage';
import { PixiToastLayer } from '../ui/PixiToastLayer';
import { useGame } from '@/hooks/useGame';
import { useMusicPlayer } from '@/contexts/hooks';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import type { QuestFamily } from '@/types/questFamily';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import type { ThemeId } from '../../utils/colors';
import { resolveAsset } from '../../assets/resolver';
import { AssetId } from '../../assets/catalog';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { PixiButton } from '../../ui/PixiButton';
import { MapPage } from '../map/MapPage';
import { getZone } from '../../utils/mapLayout';
import { getZoneTheme } from '../../utils/zoneThemes';
import { color, space, layout, FONT_DISPLAY, FONT_UI } from '@/pixi/design/tokens';

export type PlayerGame = {
  tokenId: number;
  name: string;
  level: number;
  totalScore: number;
  cubesAvailable: number;
  gameOver: boolean;
};

export interface MainScreenProps {
  initialPage?: string;
  onConnect?: () => void;
  onProfileClick?: () => void;
  isConnected?: boolean;
  username?: string;
  walletAddress?: string;
  cubeBalance?: number;
  games?: PlayerGame[];
  gamesLoading?: boolean;
  onRefreshGames?: () => void;
  onTrophyClick?: () => void;
  onStartGame: (selectedBonuses: number[], cubesToBring: number) => Promise<number | undefined>;
  isStartingGame?: boolean;
  playerMetaData?: PlayerMetaData | null;
  leaderboardEntries?: LeaderboardEntry[];
  leaderboardLoading?: boolean;
  onRefreshLeaderboard?: () => void;
  questFamilies?: QuestFamily[];
  questsLoading?: boolean;
  questsStatus?: 'loading' | 'error' | 'success';
  onRefreshQuests?: () => Promise<void> | void;
  onClaimQuest?: (questId: string, intervalId: number) => Promise<void>;
  onUpgradeStartingBonus?: (bonusType: number) => Promise<void>;
  onUpgradeBagSize?: (bonusType: number) => Promise<void>;
  onUpgradeBridging?: () => Promise<void>;
  onUnlockBonus?: (bonusType: number) => Promise<void>;
  musicVolume?: number;
  effectsVolume?: number;
  onMusicVolumeChange?: (v: number) => void;
  onEffectsVolumeChange?: (v: number) => void;
}

const FOOTER_STYLE = {
  fontFamily: FONT_BODY, fontSize: 10, fill: 0xFFFFFF,
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
};

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const { themeName } = usePixiTheme();
  const bgCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.Background), [themeName]);
  const bgTex = useTextureWithFallback(bgCandidates);

  const drawGradient = useCallback((g: PixiGraphics) => {
    g.clear();
    const steps = 20;
    const stepH = Math.ceil(h / steps) + 1;
    const top = { r: 0x0f, g: 0x17, b: 0x2a };
    const bot = { r: 0x1e, g: 0x29, b: 0x3b };
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

const Logo = ({ x, y, maxW, maxH }: { x: number; y: number; maxW: number; maxH: number }) => {
  const { themeName } = usePixiTheme();
  const logoCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.Logo), [themeName]);
  const tex = useTextureWithFallback(logoCandidates);
  const containerRef = useRef<import('pixi.js').Container | null>(null);
  const timeRef = useRef(0);

  useTick((ticker) => {
    const dt = ticker.deltaMS / 16.667;
    timeRef.current += 0.025 * dt;
    const container = containerRef.current;
    if (container) {
      container.y = y + Math.sin(timeRef.current * 2) * 4;
    }
  });

  const logoFallbackStyle = useMemo(() => ({
    fontFamily: FONT_DISPLAY, fontSize: 64, fill: 0x6D28D9, letterSpacing: 4,
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
    g.fill({ color: color.bg.primary, alpha: 0.9 });
    g.rect(0, topBarH - 1, sw, 1);
    g.fill({ color: color.bg.surface, alpha: 0.6 });
  }, [sw, topBarH]);

  const cubeCountStyle = useMemo(() => ({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold' as const,
    fill: color.accent.gold,
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

  const settingsX = sw - pad - controllerBtnW;
  const settingsBtnX = settingsX - gap - btnSize;
  const trophyX = settingsBtnX - gap - btnSize;
  const questsX = trophyX - gap - btnSize;
  const tutorialX = questsX - gap - btnSize;

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: import('pixi.js').FederatedPointerEvent) => e.stopPropagation()} />

      <pixiText text="🧊" x={pad} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeIconStyle} />
      <pixiText text={String(cubeBalance)} x={pad + Math.round(20 * uiScale)} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={cubeCountStyle} />

      <PixiButton x={tutorialX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="scroll" onPress={onTutorialClick} />
      <PixiButton x={questsX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="scroll" onPress={onQuestsClick} />
      <PixiButton x={trophyX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="trophy" onPress={onTrophyClick} />
      <PixiButton x={settingsBtnX} y={centerY} width={btnSize} height={btnSize} iconOnly icon="settings" onPress={onSettingsClick} />

      <PixiButton
        x={settingsX} y={centerY}
        width={controllerBtnW} height={btnSize}
        variant="purple"
        label={isConnected && username ? username : undefined}
        icon={!(isConnected && username) ? "menu" : undefined}
        iconOnly={!(isConnected && username)}
        onPress={isConnected ? onProfileClick : onConnect}
        textStyle={usernameStyle}
      />
    </pixiContainer>
  );
};

const HomePageContent = ({
  sw, sh, topBarH, isMobile, uiScale, cubeBalance,
  games, isConnected, username, onConnect, onProfileClick, onTrophyClick,
  navigate,
}: {
  sw: number; sh: number; topBarH: number; isMobile: boolean; uiScale: number;
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

  // Hero card layout
  const cardW = Math.min(sw - 32, 380);
  const cardH = 140;
  const cardX = centerX - cardW / 2;
  const heroCardY = logoY + logoMaxH / 2 + 24;
  const activeGame = games.find(g => !g.gameOver);

  const drawHeroCard = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: color.bg.primary, alpha: 0.85 });
    g.roundRect(0, 0, cardW, cardH, 16);
    g.fill();
  }, [cardW]);

  const heroTitleStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 24, fill: 0xFFFFFF,
  }), []);

  const heroSubtitleStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 13, fill: color.text.secondary,
  }), []);

  // Hub tile grid layout
  const tileGap = 12;
  const tileH = 88;
  const row1TileW = (cardW - 2 * tileGap) / 3;
  const row2TileW = (cardW - tileGap) / 2;
  const row1Y = heroCardY + cardH + 16;
  const row2Y = row1Y + tileH + tileGap;

  const tileIconStyle = useMemo(() => ({ fontSize: 24 }), []);
  const tileLabelStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 13, fill: 0xFFFFFF,
  }), []);

  const drawRow1Tile = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: color.bg.primary, alpha: 0.85 });
    g.roundRect(0, 0, row1TileW, tileH, 12);
    g.fill();
  }, [row1TileW]);

  const drawRow2Tile = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: color.bg.primary, alpha: 0.85 });
    g.roundRect(0, 0, row2TileW, tileH, 12);
    g.fill();
  }, [row2TileW]);

  return (
    <pixiContainer>
      <Logo x={centerX} y={logoY} maxW={logoMaxW} maxH={logoMaxH} />

      {/* Hero Card */}
      <pixiContainer x={cardX} y={heroCardY}>
        <pixiGraphics draw={drawHeroCard} />
        <pixiText
          text={activeGame ? 'CONTINUE RUN' : 'START NEW RUN'}
          x={cardW / 2} y={30} anchor={{ x: 0.5, y: 0.5 }}
          style={heroTitleStyle}
        />
        <pixiText
          text={activeGame ? `Level ${activeGame.level} · Score ${activeGame.totalScore}` : 'Choose your bonuses'}
          x={cardW / 2} y={58} anchor={{ x: 0.5, y: 0.5 }}
          style={heroSubtitleStyle}
        />
        <PixiButton
          x={cardW / 2 - 70} y={82}
          width={140} height={42}
          variant={activeGame ? 'green' : 'orange'}
          label={activeGame ? 'CONTINUE' : 'PLAY'}
          onPress={() => navigate('loadout')}
          textStyle={{ fontFamily: FONT_TITLE, fontSize: 18 }}
        />
      </pixiContainer>

      {/* Hub Tile Grid — Row 1 (3 tiles) */}
      {([
        { icon: '\u{1F4DC}', label: 'Quests', action: () => navigate('quests') },
        { icon: '\u{1F6D2}', label: 'Shop', action: () => navigate('shop') },
        { icon: '\u{1F3C6}', label: 'Achievements', action: () => onTrophyClick?.() },
      ] as const).map((tile, i) => (
        <pixiContainer
          key={`row1-${i}`}
          x={cardX + i * (row1TileW + tileGap)} y={row1Y}
          eventMode="static" cursor="pointer"
          onPointerDown={tile.action}
        >
          <pixiGraphics draw={drawRow1Tile} />
          <pixiText text={tile.icon} x={row1TileW / 2} y={30} anchor={0.5} style={tileIconStyle} />
          <pixiText text={tile.label} x={row1TileW / 2} y={60} anchor={0.5} style={tileLabelStyle} />
        </pixiContainer>
      ))}

      {/* Hub Tile Grid — Row 2 (2 tiles) */}
      {([
        { icon: '\u{1F3C5}', label: 'Leaderboard', action: () => navigate('leaderboard') },
        { icon: '\u{1F3AE}', label: 'My Games', action: () => navigate('mygames') },
      ] as const).map((tile, i) => (
        <pixiContainer
          key={`row2-${i}`}
          x={cardX + i * (row2TileW + tileGap)} y={row2Y}
          eventMode="static" cursor="pointer"
          onPointerDown={tile.action}
        >
          <pixiGraphics draw={drawRow2Tile} />
          <pixiText text={tile.icon} x={row2TileW / 2} y={30} anchor={0.5} style={tileIconStyle} />
          <pixiText text={tile.label} x={row2TileW / 2} y={60} anchor={0.5} style={tileLabelStyle} />
        </pixiContainer>
      ))}

      <pixiText text="Built on Starknet with Dojo"
        x={centerX} y={sh - 16} anchor={0.5}
        style={FOOTER_STYLE} eventMode="none" />

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

const PlaceholderPage = ({ title, sw, sh, topBarH }: {
  title: string; sw: number; sh: number; topBarH: number;
}) => {
  const placeholderStyle = useMemo(() => ({
    fontFamily: FONT_UI, fontSize: 16, fill: color.text.secondary,
  }), []);

  return (
    <pixiContainer>
      <PageTopBar title={title} screenWidth={sw} topBarHeight={topBarH} />
      <pixiText text={`${title} - Coming Soon`} x={sw / 2} y={sh / 2} anchor={0.5} style={placeholderStyle} />
    </pixiContainer>
  );
};

const PageRenderer = (props: MainScreenProps & {
  sw: number; sh: number; topBarH: number; isMobile: boolean; uiScale: number;
}) => {
  const {
    sw, sh, topBarH, isMobile, uiScale,
    onConnect, onProfileClick, isConnected, username, walletAddress,
    cubeBalance = 0, games = [], onRefreshGames, onTrophyClick,
    onStartGame, isStartingGame = false, playerMetaData,
    leaderboardEntries = [], leaderboardLoading = false, onRefreshLeaderboard,
    questFamilies = [], questsLoading = false, questsStatus = 'success',
    onRefreshQuests, onClaimQuest,
    onUpgradeStartingBonus, onUpgradeBagSize, onUpgradeBridging, onUnlockBonus,
    musicVolume, effectsVolume, onMusicVolumeChange, onEffectsVolumeChange,
  } = props;

  const { currentPage, isTransitioning, transitionDirection, transitionProgressRef, navigate, goHome } = usePageNavigator();
  const { setMusicContext } = useMusicPlayer();
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  const { game: activeGame, seed: activeGameSeed } = useGame({
    gameId: activeGameId ?? undefined,
    shouldLog: false,
  });

  const mapSeed = activeGame ? activeGameSeed : undefined;
  const mapCurrentLevel = activeGame ? activeGame.level : undefined;
  const mapIsGameOver = activeGame ? Boolean(activeGame.over) : false;
  const mapLevelStarsFn = useMemo(
    () => activeGame ? (level: number) => activeGame.getLevelStars(level) : undefined,
    [activeGame],
  );

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

  const handleGoHome = useCallback(() => {
    goHome();
    setActiveGameId(null);
    onRefreshGames?.();
  }, [goHome, onRefreshGames]);

  const handleNavigateToGame = useCallback((gameId: number) => {
    setActiveGameId(gameId);
    navigate('play');
  }, [navigate]);

  const handlePlayAgain = useCallback(() => {
    handleGoHome();
    navigate('loadout');
  }, [handleGoHome, navigate]);

  const handlePlayLevel = useCallback((_contractLevel: number) => {
    if (activeGameId) {
      navigate('play');
    }
  }, [activeGameId, navigate]);

  const pageContainerRef = useRef<import('pixi.js').Container | null>(null);

  useTick(() => {
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
  });

  return (
    <pixiContainer>
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
            loading={games.length === 0}
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

const MainScreenInner = (props: MainScreenProps) => {
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight, uiScale } = useFullscreenLayout();
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <Application
        width={sw} height={sh}
        backgroundAlpha={1} background={color.bg.secondary}
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

export const MainScreen = (props: MainScreenProps) => {
  return <MainScreenInner {...props} />;
};

export default MainScreen;
