/**
 * PlayScreen - 100% PixiJS game screen with new visual style
 * 
 * Features:
 * - Shared background with landing pages (sky + clouds)
 * - PixiJS modals for game over, victory, level complete
 * - Integrated game grid and HUD
 * - Mobile-optimized layout
 */

import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { GameGrid } from '../GameGrid';
import { GridBackground } from '../GridBackground';
import { NextLinePreview } from '../game/NextLinePreview';
import { ActionBar } from '../actionbar';
import { ParticleSystem } from '../effects/ParticleSystem';
import { ScorePopup } from '../effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from '../effects/ScreenShake';
import { MenuModal, GameOverModal, VictoryModal, LevelCompleteModal } from '../modals';
import { CubeBalance } from '../topbar/CubeBalance';
import { LevelDisplay } from '../game/LevelDisplay';
import { GameHUD } from '../game/GameHUD';
import { ScorePanel } from '../game/ScorePanel';
import { MovesPanel } from '../game/MovesPanel';
import { Button } from '../ui';
import { BonusType } from '@/dojo/game/types/bonus';
import type { Block } from '@/types/types';
import type { ConstraintData } from '../hud';

// ============================================================================
// CONSTANTS
// ============================================================================

const T = '/assets/theme-1';
const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

export interface BonusSlotData {
  type: number;
  bonusType: BonusType;
  level: number;
  count: number;
  icon: string;
  tooltip?: string;
  onClick: () => void;
}

interface CloudData {
  id: number;
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

export interface PlayScreenProps {
  // Grid data
  blocks: Block[];
  nextLine: Block[];
  nextLineConsumed: boolean;
  
  // Level info
  level: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves?: number;
  
  // Constraints
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  
  // Combo and stars
  combo: number;
  maxCombo: number;
  stars: number;
  
  // Bonus system
  bonusSlots: BonusSlotData[];
  selectedBonus: BonusType;
  bonusDescription?: string;
  
  // Player info
  cubeBalance?: number;
  totalCubes?: number;
  totalScore?: number;
  
  // State
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
  isLoading?: boolean;
  
  // Game state
  isGameOver: boolean;
  isVictory: boolean;
  isLevelComplete: boolean;
  
  // Level complete data
  levelCompleteCubes?: number;
  levelCompleteBonusAwarded?: { type: string; icon: string } | null;
  constraintMet?: boolean;
  
  // Callbacks
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
  onSurrender?: () => Promise<void>;
  onGoHome: () => void;
  onPlayAgain?: () => void;
  onLevelCompleteContinue: () => void;
  
  // Navigation callbacks
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
// SKY BACKGROUND (same as MainScreen)
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
// CLOUDS (same as MainScreen)
// ============================================================================

const Clouds = ({ w, h }: { w: number; h: number }) => {
  const cloudsRef = useRef<CloudData[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (cloudsRef.current.length > 0) return;
    const count = Math.max(3, Math.floor(w / 180));
    for (let i = 0; i < count; i++) {
      cloudsRef.current.push({
        id: i,
        x: Math.random() * (w + 300) - 150,
        y: 30 + Math.random() * h * 0.15,
        scale: 0.4 + Math.random() * 0.5,
        speed: 0.08 + Math.random() * 0.15,
        alpha: 0.4 + Math.random() * 0.25,
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
        if (c.x > w + 150) { c.x = -150 * c.scale; c.y = 30 + Math.random() * h * 0.15; }
      }
      if (fc % 3 === 0) setTick(n => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  const drawCloud = useCallback((g: PixiGraphics, s: number) => {
    g.clear();
    g.setFillStyle({ color: 0xFFFFFF, alpha: 0.85 });
    g.circle(0, 0, 24 * s); g.fill();
    g.circle(18 * s, -5 * s, 18 * s); g.fill();
    g.circle(-16 * s, -3 * s, 16 * s); g.fill();
    g.circle(8 * s, 7 * s, 20 * s); g.fill();
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
// TOP BAR BUTTON
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
// GAME TOP BAR
// ============================================================================

const GameTopBar = ({
  sw, topBarH, isMobile, uiScale, cubeBalance,
  onMenuClick, onHomeClick,
}: {
  sw: number; topBarH: number; isMobile: boolean; uiScale: number;
  cubeBalance: number;
  onMenuClick: () => void;
  onHomeClick: () => void;
}) => {
  const btnSize = isMobile ? 36 : 42;
  const gap = Math.round(10 * uiScale);
  const pad = Math.round(12 * uiScale);
  const centerY = (topBarH - btnSize) / 2;

  // Left: Home button
  const homeX = pad;

  // Center: cube balance
  const cubeX = sw / 2 - 50;

  // Right: menu button
  const menuX = sw - pad - btnSize;

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
      
      {/* Home button */}
      <TopBarButton x={homeX} y={centerY} size={btnSize} icon="\u{1F3E0}" onClick={onHomeClick} />
      
      {/* Cube Balance (center) */}
      <CubeBalance balance={cubeBalance} x={cubeX} y={centerY} height={btnSize} uiScale={uiScale} />
      
      {/* Menu button */}
      <TopBarButton x={menuX} y={centerY} size={btnSize} icon="\u{2630}" onClick={onMenuClick} />
    </pixiContainer>
  );
};

// ============================================================================
// LOADING SCREEN
// ============================================================================

const LoadingScreen = ({ sw, sh }: { sw: number; sh: number }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <pixiContainer>
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />
      
      {/* Loading text */}
      <pixiText
        text={`Loading${dots}`}
        x={sw / 2}
        y={sh / 2 - 20}
        anchor={0.5}
        style={{
          fontFamily: FONT,
          fontSize: 28,
          fill: 0xffffff,
          dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
        }}
      />
      
      <pixiText
        text="Preparing the blocks..."
        x={sw / 2}
        y={sh / 2 + 20}
        anchor={0.5}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 14,
          fill: 0x94a3b8,
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// PLAY SCREEN INNER
// ============================================================================

const PlayScreenInner = (props: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, isMobile, topBarHeight, uiScale } = layout;
  const { offset, lineClear, combo: comboShake, bigCombo } = useScreenShake();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    blocks, nextLine, nextLineConsumed,
    level, levelScore, targetScore, moves, maxMoves = 30,
    constraint1, constraint2,
    combo, maxCombo, stars,
    bonusSlots, selectedBonus, bonusDescription,
    cubeBalance = 0, totalCubes = 0, totalScore = 0,
    isTxProcessing, isPlayerInDanger, isLoading,
    isGameOver, isVictory, isLevelComplete,
    levelCompleteCubes = 0, levelCompleteBonusAwarded, constraintMet = false,
    onMove, onBonusApply, onSurrender, onGoHome, onPlayAgain, onLevelCompleteContinue,
  } = props;

  // Convert bonus slots to ActionBar format
  const actionBarSlots = useMemo(() => 
    bonusSlots.map(slot => ({
      ...slot,
      onClick: slot.onClick,
    })),
    [bonusSlots]
  );

  const handleMenuClick = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleSurrender = useCallback(async () => {
    if (onSurrender) {
      await onSurrender();
    }
    setIsMenuOpen(false);
  }, [onSurrender]);

  // Trigger screen shake on combos
  const triggerExplosion = useCallback(() => {
    lineClear();
  }, [lineClear]);

  // Show loading screen
  if (isLoading || blocks.length === 0) {
    return <LoadingScreen sw={sw} sh={sh} />;
  }

  return (
    <pixiContainer>
      {/* Background */}
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />

      {/* Top bar */}
      <GameTopBar
        sw={sw} topBarH={topBarHeight} isMobile={isMobile} uiScale={uiScale}
        cubeBalance={cubeBalance}
        onMenuClick={handleMenuClick}
        onHomeClick={onGoHome}
      />

      {/* Level display */}
      <LevelDisplay
        level={level}
        stars={stars}
        constraint1={constraint1}
        constraint2={constraint2}
        x={0}
        y={layout.levelDisplayY}
        width={sw}
        height={layout.levelDisplayHeight}
        uiScale={uiScale}
      />

      {/* Mobile HUD */}
      {layout.showMobileHud && (
        <GameHUD
          score={levelScore}
          targetScore={targetScore}
          moves={moves}
          maxMoves={maxMoves}
          combo={combo}
          x={0}
          y={layout.mobileHudY}
          width={sw}
          uiScale={uiScale}
          isInDanger={isPlayerInDanger}
        />
      )}

      {/* Side panels (desktop only) */}
      {layout.showSidePanels && (
        <>
          <ScorePanel
            score={levelScore}
            targetScore={targetScore}
            x={layout.leftPanelX}
            y={layout.sidePanelY}
            width={layout.sidePanelWidth}
            height={layout.sidePanelHeight}
            uiScale={uiScale}
          />
          <MovesPanel
            moves={moves}
            maxMoves={maxMoves}
            combo={combo}
            maxCombo={maxCombo}
            x={layout.rightPanelX}
            y={layout.sidePanelY}
            width={layout.sidePanelWidth}
            height={layout.sidePanelHeight}
            uiScale={uiScale}
            isInDanger={isPlayerInDanger}
          />
        </>
      )}

      {/* Main game area with screen shake */}
      <ScreenShakeContainer offset={offset}>
        <pixiContainer x={layout.gridX} y={layout.gridY}>
          <GridBackground
            gridSize={layout.cellSize}
            gridWidth={layout.gridCols}
            gridHeight={layout.gridRows}
            isPlayerInDanger={isPlayerInDanger}
          />
          <GameGrid
            blocks={blocks}
            gridSize={layout.cellSize}
            gridWidth={layout.gridCols}
            gridHeight={layout.gridRows}
            onMove={onMove}
            onBonusApply={onBonusApply}
            bonus={selectedBonus}
            isTxProcessing={isTxProcessing || isMenuOpen || isGameOver || isVictory || isLevelComplete}
            onExplosion={triggerExplosion}
          />
        </pixiContainer>

        {/* Next line preview */}
        <pixiContainer x={layout.gridX}>
          <NextLinePreview
            blocks={nextLine}
            cellSize={layout.cellSize}
            gridCols={layout.gridCols}
            y={layout.nextLineY}
            isConsumed={nextLineConsumed}
          />
        </pixiContainer>
      </ScreenShakeContainer>

      {/* Action bar */}
      <ActionBar
        bonusSlots={actionBarSlots}
        selectedBonus={selectedBonus}
        combo={combo}
        maxCombo={maxCombo}
        stars={stars}
        width={sw}
        height={layout.actionBarHeight}
        y={layout.actionBarY}
        isDisabled={isTxProcessing || isMenuOpen || isGameOver || isVictory || isLevelComplete}
        onSurrender={handleMenuClick}
        showSurrender={!!onSurrender}
      />

      {/* Particle system */}
      <pixiContainer x={layout.gridX} y={layout.gridY}>
        <ParticleSystem gridSize={layout.cellSize} />
      </pixiContainer>

      {/* Score popups */}
      <pixiContainer x={layout.gridX} y={layout.gridY}>
        <ScorePopup
          gridWidth={layout.gridCols}
          gridHeight={layout.gridRows}
          gridSize={layout.cellSize}
        />
      </pixiContainer>

      {/* Bonus description overlay */}
      {selectedBonus !== BonusType.None && bonusDescription && (
        <pixiContainer x={sw / 2} y={sh / 3}>
          <pixiText
            text={bonusDescription}
            anchor={0.5}
            style={{
              fontFamily: FONT,
              fontSize: 18,
              fill: 0xfbbf24,
              dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
            }}
          />
        </pixiContainer>
      )}

      {/* Menu Modal */}
      <MenuModal
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onSurrender={handleSurrender}
        screenWidth={sw}
        screenHeight={sh}
        currentLevel={level}
        cubesEarned={totalCubes}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOver && !isVictory}
        onClose={onGoHome}
        onPlayAgain={onPlayAgain}
        onGoHome={onGoHome}
        screenWidth={sw}
        screenHeight={sh}
        level={level}
        totalScore={totalScore}
        totalCubes={totalCubes}
        maxCombo={maxCombo}
      />

      {/* Victory Modal */}
      <VictoryModal
        isOpen={isVictory}
        onClose={onGoHome}
        onGoHome={onGoHome}
        screenWidth={sw}
        screenHeight={sh}
        totalScore={totalScore}
        totalCubes={totalCubes}
        maxCombo={maxCombo}
      />

      {/* Level Complete Modal */}
      <LevelCompleteModal
        isOpen={isLevelComplete}
        onClose={onLevelCompleteContinue}
        screenWidth={sw}
        screenHeight={sh}
        level={level}
        levelScore={levelScore}
        targetScore={targetScore}
        stars={stars}
        bonusAwarded={levelCompleteBonusAwarded}
        cubesEarned={levelCompleteCubes}
        totalCubes={totalCubes}
        constraintMet={constraintMet}
      />

      {/* Danger border overlay */}
      {isPlayerInDanger && (
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, sw, sh);
            g.stroke({ color: 0xef4444, width: 8, alpha: 0.4 });
          }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export const PlayScreen = (props: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh } = layout;
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', overflow: 'hidden', touchAction: 'none' }}>
      <Application
        width={sw} height={sh}
        backgroundAlpha={1} background={0xD0EAF8}
        resolution={dpr} autoDensity antialias
      >
        <PixiThemeProvider>
          <PlayScreenInner {...props} />
        </PixiThemeProvider>
      </Application>
    </div>
  );
};

export default PlayScreen;
