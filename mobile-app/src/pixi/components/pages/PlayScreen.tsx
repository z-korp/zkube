import { Application } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Assets, Texture, Graphics as PixiGraphics, TextStyle } from 'pixi.js';
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
import { ScorePanel } from '../game/ScorePanel';
import { MovesPanel } from '../game/MovesPanel';
import { BonusType } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { useAnimatedValue, usePulse, easings } from '../../hooks/useAnimatedValue';
import { drawTargetIcon, drawMovesIcon, IconColors } from '../ui/Icons';
import type { Block } from '@/types/types';
import type { ConstraintData } from '../hud';

const T = '/assets/theme-1';
const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

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
  blocks: Block[];
  nextLine: Block[];
  nextLineConsumed: boolean;
  level: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves?: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  combo: number;
  maxCombo: number;
  stars: number;
  bonusSlots: BonusSlotData[];
  selectedBonus: BonusType;
  bonusDescription?: string;
  cubeBalance?: number;
  totalCubes?: number;
  totalScore?: number;
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
  isLoading?: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  isLevelComplete: boolean;
  levelCompleteCubes?: number;
  levelCompleteBonusAwarded?: { type: string; icon: string } | null;
  constraintMet?: boolean;
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
  onSurrender?: () => Promise<void>;
  onGoHome: () => void;
  onPlayAgain?: () => void;
  onLevelCompleteContinue: () => void;
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onShopClick?: () => void;
}

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    Assets.load(path).then(t => setTex(t as Texture)).catch(() => setTex(null));
  }, [path]);
  return tex;
}

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

// Slim icon button for the top bar
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
    g.roundRect(0, 0, size, size, 10);
    g.fill({ color: hovered ? 0x334155 : 0x1e293b, alpha: 0.85 });
    g.roundRect(0, 0, size, size, 10);
    g.stroke({ width: 1.5, color: 0x475569, alpha: 0.4 });
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

// Slim translucent top bar: [Home]  🧊 Balance  [Menu]
const GameTopBar = ({
  sw, topBarH, uiScale, cubeBalance,
  onMenuClick, onHomeClick,
}: {
  sw: number; topBarH: number; uiScale: number;
  cubeBalance: number;
  onMenuClick: () => void;
  onHomeClick: () => void;
}) => {
  const btnSize = 32;
  const pad = Math.round(12 * uiScale);
  const centerY = (topBarH - btnSize) / 2;

  const drawBg = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, sw, topBarH);
    g.fill({ color: 0x0f172a, alpha: 0.7 });
  }, [sw, topBarH]);

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()} />
      <TopBarButton x={pad} y={centerY} size={btnSize} icon="🏠" onClick={onHomeClick} />
      <CubeBalance balance={cubeBalance} x={sw / 2 - 50} y={centerY} height={btnSize} uiScale={uiScale} />
      <TopBarButton x={sw - pad - btnSize} y={centerY} size={btnSize} icon="☰" onClick={onMenuClick} />
    </pixiContainer>
  );
};

// Unified game info section: Level badge + Score/Moves pills
const GameInfoBar = ({
  level, stars, levelScore, targetScore, moves, maxMoves,
  constraint1, constraint2, combo, isInDanger,
  layout,
}: {
  level: number;
  stars: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  combo: number;
  isInDanger: boolean;
  layout: ReturnType<typeof useFullscreenLayout>;
}) => {
  const { uiScale } = layout;
  const animatedScore = useAnimatedValue(levelScore, { duration: 300, easing: easings.easeOut });
  const dangerPulse = usePulse(isInDanger, { minScale: 1.0, maxScale: 1.08, duration: 400 });

  const scoreProgress = Math.min(1, levelScore / Math.max(targetScore, 1));

  const hasC1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasC2 = constraint2 && constraint2.type !== ConstraintType.None;

  const getConstraintLabel = (c: ConstraintData) => {
    if (c.type === ConstraintType.ClearLines) return `${c.progress}/${c.count}`;
    if (c.type === ConstraintType.NoBonusUsed) return c.bonusUsed ? '✗' : '✓';
    return '';
  };

  // Level badge
  const drawLevelBadge = useCallback((g: PixiGraphics) => {
    g.clear();
    const w = layout.levelBadgeWidth;
    const h = layout.levelBadgeHeight;
    g.roundRect(0, 0, w, h, 10);
    g.fill({ color: 0x1e293b, alpha: 0.95 });
    g.roundRect(0, 0, w, h, 10);
    g.stroke({ color: 0x3b82f6, width: 2, alpha: 0.7 });
    g.roundRect(2, 2, w - 4, h - 4, 8);
    g.stroke({ color: 0xffffff, width: 1, alpha: 0.08 });
  }, [layout.levelBadgeWidth, layout.levelBadgeHeight]);

  // Stars inside level badge
  const drawStars = useCallback((g: PixiGraphics) => {
    g.clear();
    const starSize = Math.round(11 * uiScale);
    const gap = Math.round(3 * uiScale);
    for (let i = 0; i < 3; i++) {
      const cx = i * (starSize + gap) + starSize / 2;
      const cy = starSize / 2;
      const filled = i < stars;
      const outerR = starSize / 2;
      const innerR = outerR * 0.4;
      const path: number[] = [];
      for (let j = 0; j < 10; j++) {
        const r = j % 2 === 0 ? outerR : innerR;
        const angle = (j * Math.PI) / 5 - Math.PI / 2;
        path.push(cx + r * Math.cos(angle));
        path.push(cy + r * Math.sin(angle));
      }
      g.poly(path);
      g.fill({ color: filled ? 0xfbbf24 : 0x475569, alpha: filled ? 1 : 0.3 });
      if (filled) {
        g.poly(path);
        g.stroke({ color: 0xfcd34d, width: 1, alpha: 0.4 });
      }
    }
  }, [stars, uiScale]);

  // Score pill background
  const drawScorePill = useCallback((g: PixiGraphics) => {
    g.clear();
    const w = layout.scorePillWidth;
    const h = layout.scorePillHeight;
    g.roundRect(0, 0, w, h, 8);
    g.fill({ color: 0x1e293b, alpha: 0.9 });
    g.roundRect(0, 0, w, h, 8);
    g.stroke({ color: 0x334155, width: 1.5, alpha: 0.5 });
    // Progress bar
    const barH = 3;
    const barY = h - 6;
    const barX = 8;
    const barW = w - 16;
    g.roundRect(barX, barY, barW, barH, 1.5);
    g.fill({ color: 0x374151, alpha: 0.6 });
    g.roundRect(barX, barY, barW * scoreProgress, barH, 1.5);
    g.fill({ color: scoreProgress >= 1 ? 0x22c55e : 0x3b82f6 });
  }, [layout.scorePillWidth, layout.scorePillHeight, scoreProgress]);

  // Moves pill background
  const drawMovesPill = useCallback((g: PixiGraphics) => {
    g.clear();
    const w = layout.movesPillWidth;
    const h = layout.movesPillHeight;
    const bgColor = isInDanger ? 0x3b1818 : 0x1e293b;
    const borderColor = isInDanger ? 0xef4444 : 0x334155;
    g.roundRect(0, 0, w, h, 8);
    g.fill({ color: bgColor, alpha: 0.9 });
    g.roundRect(0, 0, w, h, 8);
    g.stroke({ color: borderColor, width: 1.5, alpha: isInDanger ? 0.7 : 0.5 });
  }, [layout.movesPillWidth, layout.movesPillHeight, isInDanger]);

  // Icon helpers
  const drawScoreIcon = useCallback((g: PixiGraphics) => {
    drawTargetIcon(g, Math.round(14 * uiScale), IconColors.primary);
  }, [uiScale]);

  const drawMovesIconCb = useCallback((g: PixiGraphics) => {
    drawMovesIcon(g, Math.round(14 * uiScale), isInDanger ? 0xfca5a5 : IconColors.primary);
  }, [uiScale, isInDanger]);

  const levelLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT,
    fontSize: Math.round(9 * uiScale),
    fill: 0x94a3b8,
    letterSpacing: 2,
  }), [uiScale]);

  const levelNumStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
    fontSize: Math.round(20 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(15 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const movesValueStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: Math.round(15 * uiScale),
    fontWeight: 'bold',
    fill: isInDanger ? 0xfca5a5 : 0xffffff,
  }), [uiScale, isInDanger]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: Math.round(9 * uiScale),
    fill: 0x94a3b8,
    letterSpacing: 1,
  }), [uiScale]);

  const constraintStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: Math.round(9 * uiScale),
    fontWeight: 'bold',
    fill: 0xd1d5db,
  }), [uiScale]);

  // Constraint section inside level badge
  const starAreaWidth = 3 * Math.round(11 * uiScale) + 2 * Math.round(3 * uiScale);
  const constraintText = hasC1 ? getConstraintLabel(constraint1!) : '';
  const constraintSep = (hasC1 || hasC2) ? '  ·  ' : '';
  const constraint2Text = hasC2 ? getConstraintLabel(constraint2!) : '';
  const badgeCenterX = layout.levelBadgeWidth / 2;
  const badgeBottomRow = layout.levelBadgeHeight - Math.round(10 * uiScale);

  return (
    <pixiContainer>
      {/* Level badge */}
      <pixiContainer x={layout.levelBadgeX} y={layout.levelBadgeY}>
        <pixiGraphics draw={drawLevelBadge} />
        <pixiText text="LEVEL" x={badgeCenterX} y={Math.round(6 * uiScale)} anchor={{ x: 0.5, y: 0 }} style={levelLabelStyle} />
        <pixiText text={String(level)} x={badgeCenterX} y={Math.round(16 * uiScale)} anchor={{ x: 0.5, y: 0 }} style={levelNumStyle} />
        {/* Stars + constraint in bottom row */}
        <pixiContainer x={badgeCenterX - starAreaWidth / 2 - (constraintText ? 20 : 0)} y={badgeBottomRow}>
          <pixiGraphics draw={drawStars} />
        </pixiContainer>
        {(hasC1 || hasC2) && (
          <pixiText
            text={`${constraintSep}${constraintText}${constraint2Text ? '  ' + constraint2Text : ''}`}
            x={badgeCenterX + starAreaWidth / 2 - (constraintText ? 10 : 0)}
            y={badgeBottomRow + Math.round(5 * uiScale)}
            anchor={{ x: 0.5, y: 0.5 }}
            style={constraintStyle}
          />
        )}
      </pixiContainer>

      {/* Score pill */}
      <pixiContainer x={layout.scorePillX} y={layout.scorePillY}>
        <pixiGraphics draw={drawScorePill} />
        <pixiGraphics x={12} y={layout.scorePillHeight / 2 - 3} draw={drawScoreIcon} />
        <pixiText
          text={`${Math.round(animatedScore)}/${targetScore}`}
          x={Math.round(28 * uiScale)}
          y={layout.scorePillHeight / 2 - 3}
          anchor={{ x: 0, y: 0.5 }}
          style={valueStyle}
        />
        <pixiText
          text="SCORE"
          x={layout.scorePillWidth / 2}
          y={layout.scorePillHeight - Math.round(8 * uiScale)}
          anchor={{ x: 0.5, y: 1 }}
          style={labelStyle}
        />
      </pixiContainer>

      {/* Moves pill */}
      <pixiContainer
        x={layout.movesPillX + layout.movesPillWidth / 2}
        y={layout.movesPillY + layout.movesPillHeight / 2}
        scale={isInDanger ? dangerPulse : 1}
        pivot={{ x: layout.movesPillWidth / 2, y: layout.movesPillHeight / 2 }}
      >
        <pixiGraphics draw={drawMovesPill} />
        <pixiGraphics x={12} y={layout.movesPillHeight / 2 - 3} draw={drawMovesIconCb} />
        <pixiText
          text={String(moves)}
          x={Math.round(28 * uiScale)}
          y={layout.movesPillHeight / 2 - 3}
          anchor={{ x: 0, y: 0.5 }}
          style={movesValueStyle}
        />
        <pixiText
          text="MOVES"
          x={layout.movesPillWidth / 2}
          y={layout.movesPillHeight - Math.round(8 * uiScale)}
          anchor={{ x: 0.5, y: 1 }}
          style={labelStyle}
        />
        {combo > 0 && (
          <pixiText
            text={`${combo}x`}
            x={layout.movesPillWidth - 10}
            y={6}
            anchor={{ x: 1, y: 0 }}
            style={new TextStyle({
              fontFamily: 'Arial Black, Arial Bold, Arial, sans-serif',
              fontSize: Math.round(11 * uiScale),
              fontWeight: 'bold',
              fill: combo >= 5 ? 0xffd700 : combo >= 3 ? 0xf97316 : 0xfbbf24,
            })}
          />
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

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
      <pixiText
        text={`Loading${dots}`}
        x={sw / 2} y={sh / 2 - 20} anchor={0.5}
        style={{
          fontFamily: FONT, fontSize: 28, fill: 0xffffff,
          dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
        }}
      />
      <pixiText
        text="Preparing the blocks..."
        x={sw / 2} y={sh / 2 + 20} anchor={0.5}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x94a3b8 }}
      />
    </pixiContainer>
  );
};

const PlayScreenInner = (props: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, uiScale } = layout;
  const { offset, lineClear } = useScreenShake();

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

  const actionBarSlots = useMemo(() =>
    bonusSlots.map(slot => ({ ...slot, onClick: slot.onClick })),
    [bonusSlots]
  );

  const handleMenuClick = useCallback(() => setIsMenuOpen(true), []);
  const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);
  const handleSurrender = useCallback(async () => {
    if (onSurrender) await onSurrender();
    setIsMenuOpen(false);
  }, [onSurrender]);

  const triggerExplosion = useCallback(() => lineClear(), [lineClear]);

  const isInteractionBlocked = isTxProcessing || isMenuOpen || isGameOver || isVictory || isLevelComplete;

  if (isLoading || blocks.length === 0) {
    return <LoadingScreen sw={sw} sh={sh} />;
  }

  return (
    <pixiContainer>
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />

      <GameTopBar
        sw={sw} topBarH={layout.topBarHeight} uiScale={uiScale}
        cubeBalance={cubeBalance}
        onMenuClick={handleMenuClick} onHomeClick={onGoHome}
      />

      <GameInfoBar
        level={level} stars={stars}
        levelScore={levelScore} targetScore={targetScore}
        moves={moves} maxMoves={maxMoves}
        constraint1={constraint1} constraint2={constraint2}
        combo={combo} isInDanger={isPlayerInDanger}
        layout={layout}
      />

      {/* Desktop side panels */}
      {layout.showSidePanels && (
        <>
          <ScorePanel
            score={levelScore} targetScore={targetScore}
            x={layout.leftPanelX} y={layout.sidePanelY}
            width={layout.sidePanelWidth} height={layout.sidePanelHeight}
            uiScale={uiScale}
          />
          <MovesPanel
            moves={moves} maxMoves={maxMoves}
            combo={combo} maxCombo={maxCombo}
            x={layout.rightPanelX} y={layout.sidePanelY}
            width={layout.sidePanelWidth} height={layout.sidePanelHeight}
            uiScale={uiScale} isInDanger={isPlayerInDanger}
          />
        </>
      )}

      <ScreenShakeContainer offset={offset}>
        <pixiContainer x={layout.gridX} y={layout.gridY}>
          <GridBackground
            gridSize={layout.cellSize}
            gridWidth={layout.gridCols} gridHeight={layout.gridRows}
            isPlayerInDanger={isPlayerInDanger}
          />
          <GameGrid
            blocks={blocks}
            gridSize={layout.cellSize}
            gridWidth={layout.gridCols} gridHeight={layout.gridRows}
            onMove={onMove} onBonusApply={onBonusApply}
            bonus={selectedBonus}
            isTxProcessing={isInteractionBlocked}
            onExplosion={triggerExplosion}
          />
        </pixiContainer>

        <pixiContainer x={layout.gridX}>
          <NextLinePreview
            blocks={nextLine} cellSize={layout.cellSize}
            gridCols={layout.gridCols} y={layout.nextLineY}
            isConsumed={nextLineConsumed}
          />
        </pixiContainer>
      </ScreenShakeContainer>

      <ActionBar
        bonusSlots={actionBarSlots} selectedBonus={selectedBonus}
        combo={combo} maxCombo={maxCombo} stars={stars}
        width={sw} height={layout.actionBarHeight} y={layout.actionBarY}
        isDisabled={isInteractionBlocked}
        onSurrender={handleMenuClick} showSurrender={!!onSurrender}
      />

      <pixiContainer x={layout.gridX} y={layout.gridY}>
        <ParticleSystem gridSize={layout.cellSize} />
      </pixiContainer>

      <pixiContainer x={layout.gridX} y={layout.gridY}>
        <ScorePopup
          gridWidth={layout.gridCols} gridHeight={layout.gridRows}
          gridSize={layout.cellSize}
        />
      </pixiContainer>

      {selectedBonus !== BonusType.None && bonusDescription && (
        <pixiContainer x={sw / 2} y={layout.gridY + 30}>
          <pixiText text={bonusDescription} anchor={0.5}
            style={{
              fontFamily: FONT, fontSize: 16, fill: 0xfbbf24,
              dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
            }}
          />
        </pixiContainer>
      )}

      <MenuModal isOpen={isMenuOpen} onClose={handleMenuClose} onSurrender={handleSurrender}
        screenWidth={sw} screenHeight={sh} currentLevel={level} cubesEarned={totalCubes} />

      <GameOverModal isOpen={isGameOver && !isVictory} onClose={onGoHome}
        onPlayAgain={onPlayAgain} onGoHome={onGoHome}
        screenWidth={sw} screenHeight={sh}
        level={level} totalScore={totalScore} totalCubes={totalCubes} maxCombo={maxCombo} />

      <VictoryModal isOpen={isVictory} onClose={onGoHome} onGoHome={onGoHome}
        screenWidth={sw} screenHeight={sh}
        totalScore={totalScore} totalCubes={totalCubes} maxCombo={maxCombo} />

      <LevelCompleteModal isOpen={isLevelComplete} onClose={onLevelCompleteContinue}
        screenWidth={sw} screenHeight={sh}
        level={level} levelScore={levelScore} targetScore={targetScore} stars={stars}
        bonusAwarded={levelCompleteBonusAwarded} cubesEarned={levelCompleteCubes}
        totalCubes={totalCubes} constraintMet={constraintMet} />

      {isPlayerInDanger && (
        <pixiGraphics draw={(g) => {
          g.clear();
          g.rect(0, 0, sw, sh);
          g.stroke({ color: 0xef4444, width: 6, alpha: 0.35 });
        }} />
      )}
    </pixiContainer>
  );
};

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
