import { Application, useTick } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { GameGrid } from '../GameGrid';
import { GridBackground } from '../GridBackground';
import { NextLinePreview } from '../game/NextLinePreview';
import { ActionBar } from '../actionbar';
import { ParticleSystem } from '../effects/ParticleSystem';
import { ScorePopup } from '../effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from '../effects/ScreenShake';
import { GameOverModal, VictoryModal, LevelCompleteModal, MenuModal, InGameShopModal, type InGameShopBonusItem } from '../modals';
import { MapPage } from '../map/MapPage';
import { ScorePanel } from '../game/ScorePanel';
import { MovesPanel } from '../game/MovesPanel';
import { PixiToastLayer } from '../ui/PixiToastLayer';
import { BonusType } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { usePulseRef } from '../../hooks/useAnimatedValue';
import { usePlayGame, type BonusSlotData as PlayBonusSlotData } from '../../hooks/usePlayGame';
import type { Block } from '@/types/types';
import type { ConstraintData } from '../hud';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';
import type { ThemeId } from '../../utils/colors';
import { resolveAsset } from '../../assets/resolver';
import { AssetId } from '../../assets/catalog';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { TickerConfig } from '../TickerConfig';
import { createLogger } from '@/utils/logger';

const playLog = createLogger("PlayScreen");

const LOADING_TITLE_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 28, fill: 0xffffff,
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
};
const LOADING_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8 };
const BONUS_DESC_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 16, fill: 0xfbbf24,
  dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
};
const STATUS_TEXT_STYLE = {
  fontFamily: FONT_BOLD,
  fontSize: 13,
  fill: 0xffffff,
};

export { type PlayBonusSlotData as BonusSlotData };

interface CloudData {
  id: number;
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

export interface PlayScreenProps {
  gameId: number;
  onGoHome: () => void;
  onPlayAgain?: () => void;
}

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

const Clouds = ({ w, h }: { w: number; h: number }) => {
  const cloudsRef = useRef<CloudData[]>([]);
  const gfxRef = useRef<PixiGraphics | null>(null);

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

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const g = gfxRef.current;
    if (!g) return;
    const dt = ticker.deltaMS / 16.667;
    g.clear();
    for (const c of cloudsRef.current) {
      c.x += c.speed * dt;
      if (c.x > w + 150) { c.x = -150 * c.scale; c.y = 30 + Math.random() * h * 0.15; }
      const s = c.scale;
      g.setFillStyle({ color: 0xFFFFFF, alpha: 0.85 * c.alpha });
      g.circle(c.x, c.y, 24 * s); g.fill();
      g.circle(c.x + 18 * s, c.y - 5 * s, 18 * s); g.fill();
      g.circle(c.x - 16 * s, c.y - 3 * s, 16 * s); g.fill();
      g.circle(c.x + 8 * s, c.y + 7 * s, 20 * s); g.fill();
    }
  }, [w, h]);

  useTick(tickCallback);

  return <pixiGraphics ref={gfxRef} eventMode="none" />;
};

const HudPillButton = ({
  x, y, w, h, icon, onClick,
}: {
  x: number; y: number; w: number; h: number; icon: string; onClick: () => void;
}) => {
  const [pressed, setPressed] = useState(false);

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, w, h, h / 2);
    g.fill({ color: pressed ? 0x555555 : 0x333333, alpha: 0.85 });
  }, [w, h, pressed]);

  const iconStyle = useMemo(() => ({ fontSize: h * 0.5 }), [h]);

  return (
    <pixiContainer x={x} y={y} scale={pressed ? 0.92 : 1}>
      <pixiGraphics draw={draw}
        eventMode="static" cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onClick(); }}
        onPointerUpOutside={() => setPressed(false)}
      />
      <pixiText text={icon} x={w / 2} y={h / 2} anchor={0.5}
        style={iconStyle}
        eventMode="none"
      />
    </pixiContainer>
  );
};

const StatsBar = ({
  sw, barY, barH, gridX, gridW, uiScale,
  level, levelScore, targetScore, moves, maxMoves, combo, isInDanger, cubeBalance,
  onHomeClick,
}: {
  sw: number; barY: number; barH: number; gridX: number; gridW: number; uiScale: number;
  level: number; levelScore: number; targetScore: number; moves: number; maxMoves: number;
  combo: number; isInDanger: boolean; cubeBalance: number;
  onHomeClick: () => void;
}) => {
  const { colors, themeName } = usePixiTheme();
  const { containerRef: dangerContainerRef } = usePulseRef(isInDanger, { minScale: 1.0, maxScale: 1.08, duration: 400 });
  const hudCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.HudBar), [themeName]);
  const hudTex = useTextureWithFallback(hudCandidates);

  const pad = Math.round(8 * uiScale);
  const barX = gridX - pad;
  const barW = gridW + pad * 2;
  const radius = barH / 2;

  const backBtnW = Math.round(28 * uiScale);
  const backBtnH = barH - 6;
  const backBtnX = 3;
  const backBtnY = 3;

  const levelBadgeR = Math.round((barH - 4) / 2);
  const levelBadgeX = backBtnW + Math.round(8 * uiScale);
  const levelBadgeCX = levelBadgeX + levelBadgeR;
  const levelBadgeCY = barH / 2;

  const scoreX = levelBadgeX + levelBadgeR * 2 + Math.round(10 * uiScale);
  const cubeX = barW - Math.round(14 * uiScale);

  const drawBar = useCallback((g: PixiGraphics) => {
    g.clear();
    if (!hudTex) {
      g.roundRect(0, 0, barW, barH, radius);
      g.fill({ color: colors.hudBar, alpha: 0.92 });
      g.roundRect(0, 0, barW, barH, radius);
      g.stroke({ color: colors.hudBarBorder, width: 1.5, alpha: 0.3 });
    }

    g.circle(levelBadgeCX, levelBadgeCY, levelBadgeR);
    g.fill({ color: 0xB8860B, alpha: 0.9 });
    g.circle(levelBadgeCX, levelBadgeCY, levelBadgeR);
    g.stroke({ color: 0xDAA520, width: 1.5, alpha: 0.6 });
  }, [barW, barH, radius, colors, hudTex, levelBadgeCX, levelBadgeCY, levelBadgeR]);

  const levelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(13 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(9 * uiScale),
    fill: 0x94a3b8,
  }), [uiScale]);

  const scoreStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(13 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const movesStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold',
    fill: isInDanger ? 0xef4444 : 0xffffff,
  }), [uiScale, isInDanger]);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(11 * uiScale),
    fontWeight: 'bold',
    fill: 0xfbbf24,
  }), [uiScale]);

  const comboColor = combo >= 5 ? 0xffd700 : combo >= 3 ? 0xf97316 : 0xfbbf24;
  const comboStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(12 * uiScale),
    fontWeight: 'bold',
    fill: comboColor,
  }), [uiScale, comboColor]);

  const cubeWidth = cubeBalance > 0 ? Math.round(50 * uiScale) : 0;
  const movesX = Math.max(scoreX + Math.round(80 * uiScale), barW - Math.round(14 * uiScale) - cubeWidth);

  return (
    <pixiContainer x={barX} y={barY}>
      {hudTex ? (
        <pixiSprite texture={hudTex} width={barW} height={barH} />
      ) : null}
      <pixiGraphics draw={drawBar} />

      <HudPillButton x={backBtnX} y={backBtnY} w={backBtnW} h={backBtnH} icon="☰" onClick={onHomeClick} />

      <pixiText text={String(level)} x={levelBadgeCX} y={levelBadgeCY} anchor={0.5} style={levelStyle} />

      <pixiContainer x={scoreX} y={barH / 2}>
        <pixiText text={String(levelScore)} x={0} y={-1} anchor={{ x: 0, y: 0.5 }} style={scoreStyle} />
        <pixiText text={`/${targetScore}`} x={String(levelScore).length * Math.round(8 * uiScale) + 2} y={-1} anchor={{ x: 0, y: 0.5 }} style={labelStyle} />
      </pixiContainer>

      <pixiContainer ref={dangerContainerRef} x={movesX} y={barH / 2}>
        <pixiText text={String(moves)} x={0} y={-1} anchor={{ x: 1, y: 0.5 }} style={movesStyle} />
        <pixiText text={`/${maxMoves}`} x={2} y={-1} anchor={{ x: 0, y: 0.5 }} style={labelStyle} />
      </pixiContainer>

      {cubeBalance > 0 && (
        <pixiContainer x={cubeX} y={barH / 2}>
          <pixiText text={`🧊${cubeBalance}`} x={0} y={0} anchor={{ x: 1, y: 0.5 }} style={cubeStyle} />
        </pixiContainer>
      )}

      {combo > 0 && (
        <pixiText
          text={`${combo}x`}
          x={movesX - Math.round(32 * uiScale)}
          y={barH / 2}
          anchor={0.5}
          style={comboStyle}
        />
      )}
    </pixiContainer>
  );
};

const ProgressHudBar = ({
  sw, barY, barH, gridX, gridW, uiScale,
  levelScore, targetScore, stars,
  constraint1, constraint2, constraint3,
}: {
  sw: number; barY: number; barH: number; gridX: number; gridW: number; uiScale: number;
  levelScore: number; targetScore: number; stars: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  constraint3?: ConstraintData;
}) => {
  const { colors, themeName } = usePixiTheme();
  const scoreProgress = Math.min(1, levelScore / Math.max(targetScore, 1));
  const hudCandidates = useMemo(() => resolveAsset(themeName as ThemeId, AssetId.HudBar), [themeName]);
  const hudTex = useTextureWithFallback(hudCandidates);

  const hasC1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasC2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasC3 = constraint3 && constraint3.type !== ConstraintType.None;
  const hasConstraints = hasC1 || hasC2 || hasC3;

  const pad = Math.round(8 * uiScale);
  const barX = gridX - pad;
  const barW = gridW + pad * 2;
  const radius = barH / 2;

  const progressPad = Math.round(10 * uiScale);
  const starSection = Math.round(40 * uiScale);
  const constraintSection = hasConstraints ? Math.round(70 * uiScale) : 0;
  const progressW = barW - progressPad * 2 - starSection - constraintSection;
  const progressH = Math.round(8 * uiScale);
  const progressX = progressPad;
  const progressY = (barH - progressH) / 2;

  const drawBar = useCallback((g: PixiGraphics) => {
    g.clear();

    if (!hudTex) {
      g.roundRect(0, 0, barW, barH, radius);
      g.fill({ color: colors.hudBar, alpha: 0.88 });
      g.roundRect(0, 0, barW, barH, radius);
      g.stroke({ color: colors.hudBarBorder, width: 1, alpha: 0.25 });
    }

    g.roundRect(progressX, progressY, progressW, progressH, progressH / 2);
    g.fill({ color: 0x333333, alpha: 0.8 });

    if (scoreProgress > 0) {
      const fillW = Math.max(progressH, progressW * scoreProgress);
      const fillColor = scoreProgress >= 1 ? 0x22c55e : scoreProgress > 0.7 ? 0x4ade80 : 0x3b82f6;
      g.roundRect(progressX, progressY, fillW, progressH, progressH / 2);
      g.fill({ color: fillColor });
    }

    if (hasConstraints) {
      const cX = progressX + progressW + Math.round(6 * uiScale);
      const cMid = barH / 2;
      const constraintCount = (hasC1 ? 1 : 0) + (hasC2 ? 1 : 0) + (hasC3 ? 1 : 0);
      const spacing = constraintCount >= 3 ? Math.round(7 * uiScale) : Math.round(5 * uiScale);

      if (constraintCount === 1) {
        if (hasC1 && constraint1) drawConstraintInline(g, constraint1, cX, cMid, uiScale);
        else if (hasC2 && constraint2) drawConstraintInline(g, constraint2, cX, cMid, uiScale);
        else if (hasC3 && constraint3) drawConstraintInline(g, constraint3, cX, cMid, uiScale);
      } else if (constraintCount === 2) {
        let idx = 0;
        if (hasC1 && constraint1) { drawConstraintInline(g, constraint1, cX, cMid - spacing, uiScale); idx++; }
        if (hasC2 && constraint2) { drawConstraintInline(g, constraint2, cX, idx === 0 ? cMid - spacing : cMid + spacing, uiScale); idx++; }
        if (hasC3 && constraint3) { drawConstraintInline(g, constraint3, cX, cMid + spacing, uiScale); }
      } else {
        if (hasC1 && constraint1) drawConstraintInline(g, constraint1, cX, cMid - spacing, uiScale);
        if (hasC2 && constraint2) drawConstraintInline(g, constraint2, cX, cMid, uiScale);
        if (hasC3 && constraint3) drawConstraintInline(g, constraint3, cX, cMid + spacing, uiScale);
      }
    }
  }, [barW, barH, radius, colors, hudTex, progressX, progressY, progressW, progressH, scoreProgress, hasConstraints, hasC1, hasC2, hasC3, constraint1, constraint2, constraint3, uiScale]);

  const starX = barW - starSection;

  const starFilledStyle = useMemo(() => new TextStyle({
    fontSize: Math.round(10 * uiScale),
    fill: 0xfbbf24,
  }), [uiScale]);

  const starEmptyStyle = useMemo(() => new TextStyle({
    fontSize: Math.round(10 * uiScale),
    fill: 0x555555,
  }), [uiScale]);

  return (
    <pixiContainer x={barX} y={barY}>
      {hudTex ? <pixiSprite texture={hudTex} width={barW} height={barH} /> : null}
      <pixiGraphics draw={drawBar} />

      <pixiContainer x={starX} y={barH / 2}>
        {[0, 1, 2].map(i => (
          <pixiText
            key={i}
            text={i < stars ? '⭐' : '☆'}
            x={i * Math.round(12 * uiScale)}
            y={0}
            anchor={0.5}
            style={i < stars ? starFilledStyle : starEmptyStyle}
          />
        ))}
      </pixiContainer>
    </pixiContainer>
  );
};

function drawConstraintInline(g: PixiGraphics, c: ConstraintData, x: number, cy: number, uiScale: number) {
  const hasCountProgress = (
    c.type === ConstraintType.ClearLines ||
    c.type === ConstraintType.BreakBlocks ||
    c.type === ConstraintType.FillAndClear
  ) && c.count > 0 && c.count <= 10;

  const isOneShot = c.type === ConstraintType.AchieveCombo || c.type === ConstraintType.ClearGrid;

  if (hasCountProgress) {
    const dotR = Math.round(3 * uiScale);
    const dotGap = Math.round(3 * uiScale);
    const satisfied = c.progress >= c.count;

    for (let i = 0; i < c.count; i++) {
      const cx = x + i * (dotR * 2 + dotGap) + dotR;
      const filled = i < c.progress;
      g.circle(cx, cy, dotR);
      g.fill({ color: filled ? (satisfied ? 0x22c55e : 0xf97316) : 0x555555, alpha: filled ? 1 : 0.5 });
    }
  } else if (isOneShot) {
    const done = c.progress >= 1;
    const dotR = Math.round(4 * uiScale);
    g.circle(x + dotR, cy, dotR);
    g.fill({ color: done ? 0x22c55e : 0x555555, alpha: done ? 1 : 0.5 });
  } else if (c.type === ConstraintType.NoBonusUsed) {
    const ok = !c.bonusUsed;
    g.roundRect(x, cy - 6, Math.round(50 * uiScale), 12, 3);
    g.fill({ color: ok ? 0x14532d : 0x7f1d1d, alpha: 0.8 });
    g.roundRect(x, cy - 6, Math.round(50 * uiScale), 12, 3);
    g.stroke({ color: ok ? 0x22c55e : 0xef4444, width: 1, alpha: 0.6 });
  }
}

const LoadingScreen = ({ sw, sh, topOffset }: { sw: number; sh: number; topOffset: number }) => {
  const elapsedRef = useRef(0);
  const dotCountRef = useRef(0);
  const textRef = useRef<any>(null);

  const tickDots = useCallback((ticker: { deltaMS: number }) => {
    elapsedRef.current += ticker.deltaMS;
    if (elapsedRef.current < 400) return;
    elapsedRef.current = 0;
    dotCountRef.current = (dotCountRef.current + 1) % 4;
    if (textRef.current) {
      textRef.current.text = `Loading${'.'.repeat(dotCountRef.current)}`;
    }
  }, []);

  useTick(tickDots);

  return (
      <pixiContainer>
        <SkyBackground w={sw} h={sh} />
        <Clouds w={sw} h={sh} />
      <PixiToastLayer screenWidth={sw} topOffset={topOffset} />
      <pixiText
        ref={textRef}
        text="Loading"
        x={sw / 2} y={sh / 2 - 20} anchor={0.5}
        style={LOADING_TITLE_STYLE}
        eventMode="none"
      />
      <pixiText
        text="Preparing the blocks..."
        x={sw / 2} y={sh / 2 + 20} anchor={0.5}
        style={LOADING_SUB_STYLE}
        eventMode="none"
      />
    </pixiContainer>
  );
};

const PlayScreenInner = ({ gameId, onGoHome, onPlayAgain }: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, uiScale } = layout;
  const { containerRef: shakeContainerRef, lineClear } = useScreenShake();

  const gameState = usePlayGame(gameId);

  useEffect(() => {
    if (gameState.walletDisconnected) onGoHome();
  }, [gameState.walletDisconnected, onGoHome]);

  const [isSurrendering, setIsSurrendering] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const {
    blocks, nextLine, nextLineConsumed: nextLineConsumed,
    level, levelScore, targetScore, moves, maxMoves,
    constraint1, constraint2, constraint3,
    combo, maxCombo, stars,
    bonusSlots, selectedBonus, bonusDescription,
    cubeBalance, totalCubes, totalScore,
    isTxProcessing, isPlayerInDanger, isLoading,
    isGameOver, isVictory, isLevelComplete,
    isInGameShopOpen,
    shopCubesAvailable,
    shopItems,
    isShopPurchasing,
    levelCompleteCubes, levelCompleteBonusAwarded, constraintMet,
    handleMove: onMove, handleBonusApply: onBonusApply, handleSurrender: onSurrender,
    handleShare: onShare, handleLevelCompleteContinue: onLevelCompleteContinue,
    handleInGameShopClose: onInGameShopClose,
    seed, showMapView, handleMapContinue: onMapContinue,
  } = gameState;

  const actionBarSlots = useMemo(() =>
    bonusSlots.map(slot => ({ ...slot, onClick: slot.onClick })),
    [bonusSlots]
  );

  const handleSurrender = useCallback(async () => {
    if (onSurrender && !isSurrendering) {
      setIsSurrendering(true);
      try { await onSurrender(); } finally { setIsSurrendering(false); }
    }
  }, [onSurrender, isSurrendering]);

  const triggerExplosion = useCallback(() => lineClear(), [lineClear]);

  const drawDangerBorder = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, sw, sh);
    g.stroke({ color: 0xef4444, width: 4, alpha: 0.25 });
  }, [sw, sh]);

  const transientStatusLabel = useMemo(() => {
    if (isShopPurchasing) return 'Purchasing item...';
    if (isSurrendering) return 'Surrendering run...';
    if (isTxProcessing) return 'Syncing move...';
    return null;
  }, [isShopPurchasing, isSurrendering, isTxProcessing]);

  const drawStatusBubble = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, 180, 30, 12);
    g.fill({ color: 0x1f2937, alpha: 0.9 });
    g.roundRect(0, 0, 180, 30, 12);
    g.stroke({ color: 0x60a5fa, width: 1.5, alpha: 0.6 });
  }, []);

  type ActiveModal = 'none' | 'menu' | 'gameOver' | 'victory' | 'levelComplete' | 'inGameShop' | 'map';
  const activeModal: ActiveModal = useMemo(() => {
    if (isGameOver && !isVictory) return 'gameOver';
    if (isVictory) return 'victory';
    if (isLevelComplete) return 'levelComplete';
    if (showMapView) return 'map';
    if (isInGameShopOpen) return 'inGameShop';
    if (isMenuOpen) return 'menu';
    return 'none';
  }, [isGameOver, isVictory, isLevelComplete, showMapView, isInGameShopOpen, isMenuOpen]);

  const isInteractionBlocked = isTxProcessing || isSurrendering || activeModal !== 'none';

  useEffect(() => {
    playLog.info("interaction state", {
      isInteractionBlocked,
      isTxProcessing,
      isSurrendering,
      activeModal,
      blockCount: blocks.length,
      isLoading,
    });
  }, [isInteractionBlocked, isTxProcessing, isSurrendering, activeModal, blocks.length, isLoading]);

  useEffect(() => {
    if (isGameOver || isVictory || isLevelComplete || isInGameShopOpen || showMapView) {
      setIsMenuOpen(false);
    }
  }, [isGameOver, isVictory, isLevelComplete, isInGameShopOpen, showMapView]);

  if (isLoading || blocks.length === 0) {
    playLog.info("showing LoadingScreen", { isLoading, blockCount: blocks.length });
    return <LoadingScreen sw={sw} sh={sh} topOffset={layout.statsBarY + 4} />;
  }

  return (
    <pixiContainer>
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />
      <PixiToastLayer screenWidth={sw} topOffset={layout.statsBarY + 4} />

      <StatsBar
        sw={sw} barY={layout.statsBarY} barH={layout.statsBarHeight}
        gridX={layout.gridX} gridW={layout.gridWidth} uiScale={uiScale}
        level={level} levelScore={levelScore} targetScore={targetScore}
        moves={moves} maxMoves={maxMoves}
        combo={combo} isInDanger={isPlayerInDanger} cubeBalance={cubeBalance}
        onHomeClick={() => setIsMenuOpen(true)}
      />

      <ProgressHudBar
        sw={sw} barY={layout.progressBarY} barH={layout.progressBarHeight}
        gridX={layout.gridX} gridW={layout.gridWidth} uiScale={uiScale}
        levelScore={levelScore} targetScore={targetScore} stars={stars}
        constraint1={constraint1} constraint2={constraint2} constraint3={constraint3}
      />

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

      <ScreenShakeContainer containerRef={shakeContainerRef}>
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
        onSurrender={handleSurrender} showSurrender={!!onSurrender}
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
            style={BONUS_DESC_STYLE}
            eventMode="none"
          />
        </pixiContainer>
      )}

      {transientStatusLabel && (
        <pixiContainer x={sw / 2 - 90} y={layout.progressBarY + layout.progressBarHeight + 8}>
          <pixiGraphics draw={drawStatusBubble} eventMode="none" />
          <pixiText
            text={transientStatusLabel}
            x={90}
            y={15}
            anchor={0.5}
            style={STATUS_TEXT_STYLE}
            eventMode="none"
          />
        </pixiContainer>
      )}

      <GameOverModal isOpen={activeModal === 'gameOver'} onClose={onGoHome}
        onPlayAgain={onPlayAgain} onGoHome={onGoHome}
        screenWidth={sw} screenHeight={sh}
        level={level} totalScore={totalScore} totalCubes={totalCubes} maxCombo={maxCombo} />

      <MenuModal
        isOpen={activeModal === 'menu'}
        onClose={() => setIsMenuOpen(false)}
        onSurrender={handleSurrender}
        screenWidth={sw}
        screenHeight={sh}
        currentLevel={level}
        cubesEarned={totalCubes}
      />

      <VictoryModal isOpen={activeModal === 'victory'} onClose={onGoHome} onGoHome={onGoHome} onShare={onShare}
        screenWidth={sw} screenHeight={sh}
        totalScore={totalScore} totalCubes={totalCubes} maxCombo={maxCombo} />

      <LevelCompleteModal isOpen={activeModal === 'levelComplete'} onClose={onLevelCompleteContinue}
        screenWidth={sw} screenHeight={sh}
        level={level} levelScore={levelScore} targetScore={targetScore} stars={stars}
        bonusAwarded={levelCompleteBonusAwarded} cubesEarned={levelCompleteCubes}
        totalCubes={totalCubes} constraintMet={constraintMet} />

      <InGameShopModal
        isOpen={activeModal === 'inGameShop'}
        onClose={onInGameShopClose ?? (() => {})}
        screenWidth={sw}
        screenHeight={sh}
        cubesAvailable={shopCubesAvailable}
        items={shopItems}
        isPurchasing={isShopPurchasing}
      />

      {activeModal === 'map' && seed > 0n && (
        <pixiContainer>
          <SkyBackground w={sw} h={sh} />
          <MapPage
            seed={seed}
            currentLevel={level}
            screenWidth={sw}
            screenHeight={sh}
            topBarHeight={0}
            onPlayLevel={() => onMapContinue()}
            standalone={true}
          />
        </pixiContainer>
      )}

      {isPlayerInDanger && activeModal === 'none' && (
        <pixiGraphics draw={drawDangerBorder} />
      )}
    </pixiContainer>
  );
};

export const PlayScreen = ({ gameId, onGoHome, onPlayAgain }: PlayScreenProps) => {
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
          <TickerConfig />
          <PlayScreenInner gameId={gameId} onGoHome={onGoHome} onPlayAgain={onPlayAgain} />
        </PixiThemeProvider>
      </Application>
    </div>
  );
};

export default PlayScreen;
