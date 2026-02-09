import { Application, useTick } from '@pixi/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Texture, Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { GameGrid } from '../GameGrid';
import { GridBackground } from '../GridBackground';
import { NextLinePreview } from '../game/NextLinePreview';
import { ActionBar } from '../actionbar';
import { ParticleSystem } from '../effects/ParticleSystem';
import { ScorePopup } from '../effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from '../effects/ScreenShake';
import { GameOverModal, VictoryModal, LevelCompleteModal } from '../modals';
import { ScorePanel } from '../game/ScorePanel';
import { MovesPanel } from '../game/MovesPanel';
import { BonusType } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { usePulseRef } from '../../hooks/useAnimatedValue';
import type { Block } from '@/types/types';
import type { ConstraintData } from '../hud';
import { FONT_TITLE, FONT_BOLD, FONT_BODY, THEME_ASSETS } from '../../utils/colors';
import { loadTextureCached } from '../../assets/textureLoader';

const LOADING_TITLE_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 28, fill: 0xffffff,
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
};
const LOADING_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8 };
const BONUS_DESC_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 16, fill: 0xfbbf24,
  dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
};

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
    let cancelled = false;

    if (!path) {
      setTex(null);
      return;
    }

    loadTextureCached(path)
      .then((t) => {
        if (!cancelled) setTex(t);
      })
      .catch(() => {
        if (!cancelled) setTex(null);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);
  return tex;
}

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
  const { colors, getAssetPath } = usePixiTheme();
  const { containerRef: dangerContainerRef } = usePulseRef(isInDanger, { minScale: 1.0, maxScale: 1.08, duration: 400 });
  const hudTex = useTexture(getAssetPath(THEME_ASSETS.hudBar));

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

  const movesX = barW - Math.round(14 * uiScale) - (cubeBalance > 0 ? Math.round(50 * uiScale) : 0);

  return (
    <pixiContainer x={barX} y={barY}>
      {hudTex ? (
        <pixiSprite texture={hudTex} width={barW} height={barH} />
      ) : null}
      <pixiGraphics draw={drawBar} />

      <HudPillButton x={backBtnX} y={backBtnY} w={backBtnW} h={backBtnH} icon="←" onClick={onHomeClick} />

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
  constraint1, constraint2,
}: {
  sw: number; barY: number; barH: number; gridX: number; gridW: number; uiScale: number;
  levelScore: number; targetScore: number; stars: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
}) => {
  const { colors, getAssetPath } = usePixiTheme();
  const scoreProgress = Math.min(1, levelScore / Math.max(targetScore, 1));
  const hudTex = useTexture(getAssetPath(THEME_ASSETS.hudBar));

  const hasC1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasC2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasConstraints = hasC1 || hasC2;

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

      if (hasC1 && constraint1) {
        drawConstraintInline(g, constraint1, cX, hasC2 ? cMid - Math.round(5 * uiScale) : cMid, uiScale);
      }
      if (hasC2 && constraint2) {
        drawConstraintInline(g, constraint2, cX, hasC1 ? cMid + Math.round(5 * uiScale) : cMid, uiScale);
      }
    }
  }, [barW, barH, radius, colors, hudTex, progressX, progressY, progressW, progressH, scoreProgress, hasConstraints, hasC1, hasC2, constraint1, constraint2, uiScale]);

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
  if (c.type === ConstraintType.ClearLines && c.count > 0) {
    const dotR = Math.round(3 * uiScale);
    const dotGap = Math.round(3 * uiScale);
    const satisfied = c.progress >= c.count;

    for (let i = 0; i < c.count; i++) {
      const cx = x + i * (dotR * 2 + dotGap) + dotR;
      const filled = i < c.progress;
      g.circle(cx, cy, dotR);
      g.fill({ color: filled ? (satisfied ? 0x22c55e : 0xf97316) : 0x555555, alpha: filled ? 1 : 0.5 });
    }
  } else if (c.type === ConstraintType.NoBonusUsed) {
    const ok = !c.bonusUsed;
    g.roundRect(x, cy - 6, Math.round(50 * uiScale), 12, 3);
    g.fill({ color: ok ? 0x14532d : 0x7f1d1d, alpha: 0.8 });
    g.roundRect(x, cy - 6, Math.round(50 * uiScale), 12, 3);
    g.stroke({ color: ok ? 0x22c55e : 0xef4444, width: 1, alpha: 0.6 });
  }
}

const LoadingScreen = ({ sw, sh }: { sw: number; sh: number }) => {
  const [dotCount, setDotCount] = useState(0);
  const elapsedRef = useRef(0);

  const tickDots = useCallback((ticker: { deltaMS: number }) => {
    elapsedRef.current += ticker.deltaMS;
    if (elapsedRef.current < 400) return;
    elapsedRef.current = 0;
    setDotCount((prev) => (prev + 1) % 4);
  }, []);

  useTick(tickDots);

  const dots = '.'.repeat(dotCount);

  return (
    <pixiContainer>
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />
      <pixiText
        text={`Loading${dots}`}
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

const PlayScreenInner = (props: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, uiScale } = layout;
  const { containerRef: shakeContainerRef, lineClear } = useScreenShake();

  const [isSurrendering, setIsSurrendering] = useState(false);

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

  const handleSurrender = useCallback(async () => {
    if (onSurrender && !isSurrendering) {
      setIsSurrendering(true);
      try { await onSurrender(); } finally { setIsSurrendering(false); }
    }
  }, [onSurrender, isSurrendering]);

  const triggerExplosion = useCallback(() => lineClear(), [lineClear]);

  const isInteractionBlocked = isTxProcessing || isSurrendering || isGameOver || isVictory || isLevelComplete;

  if (isLoading || blocks.length === 0) {
    return <LoadingScreen sw={sw} sh={sh} />;
  }

  return (
    <pixiContainer>
      <SkyBackground w={sw} h={sh} />
      <Clouds w={sw} h={sh} />

      <StatsBar
        sw={sw} barY={layout.statsBarY} barH={layout.statsBarHeight}
        gridX={layout.gridX} gridW={layout.gridWidth} uiScale={uiScale}
        level={level} levelScore={levelScore} targetScore={targetScore}
        moves={moves} maxMoves={maxMoves}
        combo={combo} isInDanger={isPlayerInDanger} cubeBalance={cubeBalance}
        onHomeClick={onGoHome}
      />

      <ProgressHudBar
        sw={sw} barY={layout.progressBarY} barH={layout.progressBarHeight}
        gridX={layout.gridX} gridW={layout.gridWidth} uiScale={uiScale}
        levelScore={levelScore} targetScore={targetScore} stars={stars}
        constraint1={constraint1} constraint2={constraint2}
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
          g.stroke({ color: 0xef4444, width: 4, alpha: 0.25 });
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
