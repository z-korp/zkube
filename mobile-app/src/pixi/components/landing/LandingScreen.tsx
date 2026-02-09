/**
 * LandingScreen - 100% PixiJS. No HTML.
 *
 * Layout:
 *   [TopBar: tutorial | cubes | quests | trophies | settings]
 *   [Logo]
 *   [Play Game]
 *   [My Games (X)]
 *   [Shop]
 *   [Connect / Username]  (always visible)
 */

import { Application, useTick } from '@pixi/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { Modal, Button } from '../ui';
import { CubeBalance } from '../topbar/CubeBalance';
import { MyGamesModal, type PlayerGame } from './MyGamesModal';
import { LoadoutModal } from './LoadoutModal';
import { LeaderboardModal } from './LeaderboardModal';
import { ShopModal } from './ShopModal';
import { QuestsModal } from './QuestsModal';
import { SettingsModal } from './SettingsModal';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import type { QuestFamily } from '@/types/questFamily';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';

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

export interface LandingScreenProps {
  onPlay: () => void;
  onConnect?: () => void;
  onProfileClick?: () => void;
  isConnected?: boolean;
  username?: string;
  walletAddress?: string;
  cubeBalance?: number;
  // Game data for My Games
  games?: PlayerGame[];
  gamesLoading?: boolean;
  onResumeGame?: (tokenId: number) => void;
  // TopBar callbacks
  onTutorialClick?: () => void;
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onSettingsClick?: () => void;
  onShopClick?: () => void;
  onLeaderboardClick?: () => void;
  // LoadoutModal props
  showLoadoutModal?: boolean;
  onLoadoutClose?: () => void;
  onLoadoutConfirm?: (selectedBonuses: number[], cubesToBring: number) => void;
  playerMetaData?: PlayerMetaData | null;
  isStartingGame?: boolean;
  // Leaderboard data
  leaderboardEntries?: LeaderboardEntry[];
  leaderboardLoading?: boolean;
  onRefreshLeaderboard?: () => void;
  // Quest data
  questFamilies?: QuestFamily[];
  questsLoading?: boolean;
  onClaimQuest?: (questId: string, intervalId: number) => Promise<void>;
  // Shop callbacks
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

  const frameCountRef = useRef(0);
  const tickClouds = useCallback((ticker: { deltaMS: number }) => {
    const dt = ticker.deltaMS / 16.667;
    for (const c of cloudsRef.current) {
      c.x += c.speed * dt;
      if (c.x > w + 200) { c.x = -200 * c.scale; c.y = 50 + Math.random() * h * 0.25; }
    }
    frameCountRef.current++;
    if (frameCountRef.current % 2 === 0) setTick(n => n + 1);
  }, [w, h]);
  useTick(tickClouds);

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

  const tickBounce = useCallback((ticker: { deltaMS: number }) => {
    const dt = ticker.deltaMS / 16.667;
    timeRef.current += 0.025 * dt;
    setBounce(Math.sin(timeRef.current * 2) * 4);
  }, []);
  useTick(tickBounce);

  if (!tex) {
    return (
      <pixiText text="zKube" x={x} y={y + bounce} anchor={0.5}
        style={{
          fontFamily: FONT_TITLE, fontSize: 64, fill: 0x6D28D9, letterSpacing: 4,
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
          fontFamily: FONT_TITLE, fontSize, fill: 0xFFFFFF,
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
  x, y, size, icon, onClick, label,
}: {
  x: number; y: number; size: number; icon: string; onClick: () => void; label?: string;
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
      {label && (
        <pixiText text={label} x={size / 2} y={size + 4} anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: FONT_BODY, fontSize: 8, fill: 0x94a3b8 }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// NEW TOP BAR: tutorial | cubes | quests | trophies | settings
// ============================================================================

const LandingTopBar = ({
  sw, topBarH, isMobile, uiScale, cubeBalance,
  onTutorialClick, onQuestsClick, onTrophyClick, onSettingsClick,
}: {
  sw: number; topBarH: number; isMobile: boolean; uiScale: number;
  cubeBalance: number;
  onTutorialClick: () => void; onQuestsClick: () => void;
  onTrophyClick: () => void; onSettingsClick: () => void;
}) => {
  const btnSize = isMobile ? 36 : 42;
  const gap = Math.round(10 * uiScale);
  const pad = Math.round(12 * uiScale);
  const centerY = (topBarH - btnSize) / 2;

  // Left side: tutorial
  const tutorialX = pad;

  // Center: cube balance
  const cubeX = sw / 2 - 50;

  // Right side: quests, trophies, settings
  const settingsX = sw - pad - btnSize;
  const trophyX = settingsX - btnSize - gap;
  const questsX = trophyX - btnSize - gap;

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
      
      {/* Tutorial button (left) */}
      <TopBarButton x={tutorialX} y={centerY} size={btnSize} icon="📖" onClick={onTutorialClick} />
      
      {/* Cube Balance (center) */}
      <CubeBalance balance={cubeBalance} x={cubeX} y={centerY} height={btnSize} uiScale={uiScale} />
      
      {/* Quests button */}
      <TopBarButton x={questsX} y={centerY} size={btnSize} icon="📜" onClick={onQuestsClick} />
      
      {/* Trophy button */}
      <TopBarButton x={trophyX} y={centerY} size={btnSize} icon="🏆" onClick={onTrophyClick} />
      
      {/* Settings button */}
      <TopBarButton x={settingsX} y={centerY} size={btnSize} icon="⚙️" onClick={onSettingsClick} />
    </pixiContainer>
  );
};

// ============================================================================
// PLACEHOLDER MODAL (for menu/quests/shop/settings)
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
          style={{ fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8 }} />
        <Button text="Close" y={60} width={272} height={44} variant="secondary" onClick={onClose} />
      </pixiContainer>
    </Modal>
  );
};

// ============================================================================
// LANDING SCREEN INNER
// ============================================================================

const LandingScreenInner = ({
  onPlay, onConnect, onProfileClick, isConnected, username, walletAddress,
  cubeBalance = 0,
  games = [], gamesLoading = false, onResumeGame,
  onTutorialClick, onQuestsClick, onTrophyClick, onSettingsClick, onShopClick, onLeaderboardClick,
  // LoadoutModal props
  showLoadoutModal = false, onLoadoutClose, onLoadoutConfirm,
  playerMetaData = null, isStartingGame = false,
  // Leaderboard
  leaderboardEntries = [], leaderboardLoading = false, onRefreshLeaderboard,
  // Quests
  questFamilies = [], questsLoading = false, onClaimQuest,
  // Shop
  onUpgradeStartingBonus, onUpgradeBagSize, onUpgradeBridging, onUnlockBonus,
  // Settings
  isSoundEnabled = true, isMusicEnabled = true, onToggleSound, onToggleMusic,
}: LandingScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight, uiScale } = layout;

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMyGamesOpen, setIsMyGamesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

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

  // Button positions - show 5 buttons
  let btnIdx = 0;
  const playY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const myGamesY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const shopY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const leaderboardY = firstBtnY + (btnH + btnGap) * btnIdx++;
  const connectY = firstBtnY + (btnH + btnGap) * btnIdx++;

  // Handle connect/profile button click
  const handleConnectClick = useCallback(() => {
    if (isConnected && onProfileClick) {
      onProfileClick();
    } else if (onConnect) {
      onConnect();
    }
  }, [isConnected, onConnect, onProfileClick]);

  // Connect button label: show username if connected, else "Connect"
  const connectLabel = isConnected && username ? username : "Connect";
  const connectColor = isConnected ? 0x6366f1 : 0x8B5CF6;

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

        {/* Leaderboard */}
        <LandingButton x={centerX - btnW / 2} y={leaderboardY}
          width={btnW} height={btnH} color={0xEAB308}
          label="Leaderboard" onPress={onLeaderboardClick ?? (() => setIsLeaderboardOpen(true))}
          fontSize={isMobile ? 18 : 20} />

        {/* Connect / Username (always visible) */}
        <LandingButton x={centerX - btnW / 2} y={connectY}
          width={btnW} height={btnH} color={connectColor}
          label={connectLabel} onPress={handleConnectClick} fontSize={isMobile ? 16 : 18} />

        {/* Footer */}
        <pixiText text="Built on Starknet with Dojo"
          x={centerX} y={sh - 16} anchor={0.5}
          style={{ fontFamily: FONT_BODY, fontSize: 10, fill: 0xFFFFFF,
            dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
          }}
        />

        {/* TopBar - last for z-order */}
        <LandingTopBar
          sw={sw} topBarH={topBarHeight} isMobile={isMobile} uiScale={uiScale}
          cubeBalance={cubeBalance}
          onTutorialClick={onTutorialClick ?? (() => setIsTutorialOpen(true))}
          onQuestsClick={onQuestsClick ?? (() => setIsQuestsOpen(true))}
          onTrophyClick={onTrophyClick ?? (() => {})}
          onSettingsClick={onSettingsClick ?? (() => setIsSettingsOpen(true))}
        />

        {/* Modals */}
        <PlaceholderModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)}
          title="Tutorial" subtitle="Learn how to play" sw={sw} sh={sh} />
        
        {/* Quests Modal */}
        <QuestsModal
          isOpen={isQuestsOpen}
          onClose={() => setIsQuestsOpen(false)}
          questFamilies={questFamilies}
          loading={questsLoading}
          onClaim={onClaimQuest ?? (async () => {})}
          screenWidth={sw}
          screenHeight={sh}
        />
        
        {/* Shop Modal */}
        <ShopModal
          isOpen={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          playerMeta={playerMetaData}
          cubeBalance={cubeBalance}
          screenWidth={sw}
          screenHeight={sh}
          onUpgradeStartingBonus={onUpgradeStartingBonus}
          onUpgradeBagSize={onUpgradeBagSize}
          onUpgradeBridging={onUpgradeBridging}
          onUnlockBonus={onUnlockBonus}
        />
        
        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          screenWidth={sw}
          screenHeight={sh}
          isSoundEnabled={isSoundEnabled}
          isMusicEnabled={isMusicEnabled}
          onToggleSound={onToggleSound}
          onToggleMusic={onToggleMusic}
          username={username}
          walletAddress={walletAddress}
        />
        
        {/* Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          entries={leaderboardEntries}
          loading={leaderboardLoading}
          onRefresh={onRefreshLeaderboard ?? (() => {})}
          screenWidth={sw}
          screenHeight={sh}
        />

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
