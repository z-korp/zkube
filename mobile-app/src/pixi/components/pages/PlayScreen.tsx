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
import { GameOverModal, VictoryModal, LevelCompleteModal } from '../modals';
import { CubeBalance } from '../topbar/CubeBalance';
import { ScorePanel } from '../game/ScorePanel';
import { MovesPanel } from '../game/MovesPanel';
import { BonusType } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import { useAnimatedValue, usePulse, easings } from '../../hooks/useAnimatedValue';
import type { Block } from '@/types/types';
import type { ConstraintData } from '../hud';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';


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
    g.roundRect(0, 0, size, size, 8);
    g.fill({ color: hovered ? 0x334155 : 0x1e293b, alpha: 0.7 });
    g.roundRect(0, 0, size, size, 8);
    g.stroke({ width: 1, color: 0x475569, alpha: 0.3 });
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
        style={{ fontSize: size * 0.45 }}
      />
    </pixiContainer>
  );
};

const GameTopBar = ({
  sw, topBarH, uiScale, cubeBalance, level, combo, maxCombo, totalScore,
  onHomeClick,
}: {
  sw: number; topBarH: number; uiScale: number;
  cubeBalance: number; level: number; combo: number; maxCombo: number; totalScore: number;
  onHomeClick: () => void;
}) => {
  const btnSize = 30;
  const pad = Math.round(10 * uiScale);
  const centerY = (topBarH - btnSize) / 2;

  const drawBg = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, sw, topBarH);
    g.fill({ color: 0x000000, alpha: 1 });
    g.moveTo(0, topBarH - 0.5);
    g.lineTo(sw, topBarH - 0.5);
    g.stroke({ color: 0x1e293b, width: 0.5, alpha: 0.5 });
  }, [sw, topBarH]);

  const levelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold',
    fill: 0xffffff,
  }), [uiScale]);

  const statLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fill: 0x64748b,
  }), [uiScale]);

  const statValueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(12 * uiScale),
    fontWeight: 'bold',
    fill: 0xf97316,
  }), [uiScale]);

  const scoreValueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(12 * uiScale),
    fontWeight: 'bold',
    fill: 0x60a5fa,
  }), [uiScale]);

  const afterBackX = pad + btnSize + Math.round(8 * uiScale);

  return (
    <pixiContainer y={0}>
      <pixiGraphics draw={drawBg} eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()} />

      <TopBarButton x={pad} y={centerY} size={btnSize} icon="←" onClick={onHomeClick} />
      <pixiText text={`Level ${level}`} x={afterBackX} y={topBarH / 2} anchor={{ x: 0, y: 0.5 }} style={levelStyle} />

      <CubeBalance balance={cubeBalance} x={sw - pad - Math.round(90 * uiScale)} y={centerY} height={btnSize} uiScale={uiScale} />

      {totalScore > 0 && (
        <pixiContainer x={sw - pad - Math.round(90 * uiScale) - Math.round(70 * uiScale)} y={centerY}>
          <pixiText text="Score" x={0} y={btnSize * 0.25} anchor={{ x: 0, y: 0.5 }} style={statLabelStyle} />
          <pixiText text={String(totalScore)} x={Math.round(35 * uiScale)} y={btnSize * 0.25} anchor={{ x: 0, y: 0.5 }} style={scoreValueStyle} />
        </pixiContainer>
      )}

      {maxCombo > 0 && (
        <pixiContainer x={sw - pad - Math.round(90 * uiScale) - Math.round(130 * uiScale)} y={centerY}>
          <pixiText text="🔥" x={0} y={btnSize * 0.28} anchor={{ x: 0, y: 0.5 }} style={{ fontSize: Math.round(12 * uiScale) }} />
          <pixiText text={String(maxCombo)} x={Math.round(16 * uiScale)} y={btnSize * 0.25} anchor={{ x: 0, y: 0.5 }} style={statValueStyle} />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

const GameInfoBar = ({
  levelScore, targetScore, moves, maxMoves,
  constraint1, constraint2, combo, isInDanger,
  layout,
}: {
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
  const dangerPulse = usePulse(isInDanger, { minScale: 1.0, maxScale: 1.06, duration: 400 });

  const scoreProgress = Math.min(1, levelScore / Math.max(targetScore, 1));
  const hasC1 = constraint1 && constraint1.type !== ConstraintType.None;
  const hasC2 = constraint2 && constraint2.type !== ConstraintType.None;
  const hasConstraints = hasC1 || hasC2;

  const barX = layout.gridX;
  const barY = layout.infoAreaY + Math.round(2 * uiScale);
  const barW = layout.gridWidth;
  const barH = layout.infoAreaHeight - Math.round(4 * uiScale);

  const scoreSectionW = hasConstraints ? barW * 0.42 : barW * 0.6;
  const movesSectionW = barW * 0.25;
  const constraintSectionW = hasConstraints ? barW - scoreSectionW - movesSectionW : 0;
  const constraintSectionX = scoreSectionW;
  const movesSectionX = barW - movesSectionW;
  const sectionCenterY = barH / 2;

  const drawBar = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, barW, barH, 6);
    g.fill({ color: 0x0f172a, alpha: 0.85 });
    g.roundRect(0, 0, barW, barH, 6);
    g.stroke({ color: 0x1e293b, width: 1, alpha: 0.6 });

    const dividerPad = 6;
    if (hasConstraints) {
      g.moveTo(scoreSectionW, dividerPad);
      g.lineTo(scoreSectionW, barH - dividerPad);
      g.stroke({ color: 0x334155, width: 1, alpha: 0.4 });
    }
    g.moveTo(movesSectionX, dividerPad);
    g.lineTo(movesSectionX, barH - dividerPad);
    g.stroke({ color: 0x334155, width: 1, alpha: 0.4 });

    const progressBarH = 3;
    const progressBarY = barH - 7;
    const progressBarX = 8;
    const progressBarW = scoreSectionW - 16;
    g.roundRect(progressBarX, progressBarY, progressBarW, progressBarH, 1.5);
    g.fill({ color: 0x1e293b, alpha: 0.8 });
    if (scoreProgress > 0) {
      g.roundRect(progressBarX, progressBarY, progressBarW * scoreProgress, progressBarH, 1.5);
      g.fill({ color: scoreProgress >= 1 ? 0x22c55e : 0x3b82f6 });
    }
  }, [barW, barH, hasConstraints, scoreSectionW, movesSectionX, scoreProgress]);

  const scoreLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(9 * uiScale),
    fill: 0x64748b,
  }), [uiScale]);

  const scoreValueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(11 * uiScale),
    fontWeight: 'bold',
    fill: 0x93c5fd,
  }), [uiScale]);

  const scoreTargetStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(11 * uiScale),
    fontWeight: 'bold',
    fill: 0x93c5fd,
  }), [uiScale]);

  const movesValueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BOLD,
    fontSize: Math.round(14 * uiScale),
    fontWeight: 'bold',
    fill: isInDanger ? 0xef4444 : 0xffffff,
  }), [uiScale, isInDanger]);

  const movesLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(9 * uiScale),
    fill: isInDanger ? 0xfca5a5 : 0x64748b,
  }), [uiScale, isInDanger]);

  const constraintLabelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: Math.round(10 * uiScale),
    fontWeight: 'bold',
    fill: 0xe2e8f0,
  }), [uiScale]);

  const drawConstraintDots = useCallback((g: PixiGraphics, c: ConstraintData, offsetX: number, centerY: number) => {
    if (c.type !== ConstraintType.ClearLines || c.count === 0) return;
    const dotR = Math.round(3.5 * uiScale);
    const dotGap = Math.round(4 * uiScale);
    const totalW = c.count * dotR * 2 + (c.count - 1) * dotGap;
    const startX = offsetX - totalW / 2;
    const satisfied = c.progress >= c.count;

    for (let i = 0; i < c.count; i++) {
      const cx = startX + i * (dotR * 2 + dotGap) + dotR;
      const filled = i < c.progress;
      g.circle(cx, centerY, dotR);
      if (filled) {
        g.fill({ color: satisfied ? 0x22c55e : 0xf97316, alpha: 1 });
      } else {
        g.fill({ color: 0x475569, alpha: 0.5 });
      }
    }
  }, [uiScale]);

  const drawConstraints = useCallback((g: PixiGraphics) => {
    g.clear();
    if (!hasConstraints) return;

    const midX = constraintSectionW / 2;
    const hasBoth = hasC1 && hasC2;
    const rowH = hasBoth ? barH / 2 : barH;

    if (hasC1 && constraint1) {
      const cy = hasBoth ? rowH / 2 : sectionCenterY;
      if (constraint1.type === ConstraintType.ClearLines) {
        drawConstraintDots(g, constraint1, midX, cy + Math.round(4 * uiScale));
      } else if (constraint1.type === ConstraintType.NoBonusUsed) {
        const ok = !constraint1.bonusUsed;
        g.roundRect(midX - 30, cy - 7, 60, 14, 3);
        g.fill({ color: ok ? 0x14532d : 0x7f1d1d, alpha: 0.8 });
        g.roundRect(midX - 30, cy - 7, 60, 14, 3);
        g.stroke({ color: ok ? 0x22c55e : 0xef4444, width: 1, alpha: 0.6 });
      }
    }

    if (hasC2 && constraint2) {
      const cy = hasBoth ? rowH + rowH / 2 : sectionCenterY;
      if (constraint2.type === ConstraintType.ClearLines) {
        drawConstraintDots(g, constraint2, midX, cy + Math.round(4 * uiScale));
      } else if (constraint2.type === ConstraintType.NoBonusUsed) {
        const ok = !constraint2.bonusUsed;
        g.roundRect(midX - 30, cy - 7, 60, 14, 3);
        g.fill({ color: ok ? 0x14532d : 0x7f1d1d, alpha: 0.8 });
        g.roundRect(midX - 30, cy - 7, 60, 14, 3);
        g.stroke({ color: ok ? 0x22c55e : 0xef4444, width: 1, alpha: 0.6 });
      }
    }
  }, [hasConstraints, hasC1, hasC2, constraint1, constraint2, constraintSectionW, barH, sectionCenterY, uiScale, drawConstraintDots]);

  const getConstraintLabel = (c: ConstraintData): string => {
    if (c.type === ConstraintType.ClearLines) return `${c.value}+`;
    if (c.type === ConstraintType.NoBonusUsed) return c.bonusUsed ? 'No Bonus ✗' : 'No Bonus ✓';
    return '';
  };

  const getConstraintColor = (c: ConstraintData): number => {
    if (c.type === ConstraintType.NoBonusUsed) return c.bonusUsed ? 0xfca5a5 : 0x86efac;
    if (c.type === ConstraintType.ClearLines) return c.progress >= c.count ? 0x86efac : 0xfbbf24;
    return 0x94a3b8;
  };

  const c1Label = hasC1 ? getConstraintLabel(constraint1!) : '';
  const c2Label = hasC2 ? getConstraintLabel(constraint2!) : '';
  const c1Color = hasC1 ? getConstraintColor(constraint1!) : 0x94a3b8;
  const c2Color = hasC2 ? getConstraintColor(constraint2!) : 0x94a3b8;
  const hasBothConstraints = hasC1 && hasC2;

  return (
    <pixiContainer x={barX} y={barY}>
      <pixiGraphics draw={drawBar} />

      <pixiText text="Score" x={8} y={sectionCenterY - Math.round(4 * uiScale)} anchor={{ x: 0, y: 0.5 }} style={scoreLabelStyle} />
      <pixiText text={String(Math.round(animatedScore))} x={Math.round(42 * uiScale)} y={sectionCenterY - Math.round(4 * uiScale)} anchor={{ x: 0, y: 0.5 }} style={scoreValueStyle} />
      <pixiText text={String(targetScore)} x={scoreSectionW - 8} y={sectionCenterY - Math.round(4 * uiScale)} anchor={{ x: 1, y: 0.5 }} style={scoreTargetStyle} />

      {hasConstraints && (
        <pixiContainer x={constraintSectionX}>
          <pixiGraphics draw={drawConstraints} />
          {hasC1 && (
            <pixiText
              text={c1Label}
              x={constraintSectionW / 2}
              y={hasBothConstraints ? barH * 0.25 - Math.round(4 * uiScale) : sectionCenterY - Math.round(4 * uiScale)}
              anchor={0.5}
              style={new TextStyle({
                fontFamily: FONT_BODY,
                fontSize: Math.round(10 * uiScale),
                fontWeight: 'bold',
                fill: c1Color,
              })}
            />
          )}
          {hasC2 && (
            <pixiText
              text={c2Label}
              x={constraintSectionW / 2}
              y={hasBothConstraints ? barH * 0.75 - Math.round(4 * uiScale) : sectionCenterY - Math.round(4 * uiScale)}
              anchor={0.5}
              style={new TextStyle({
                fontFamily: FONT_BODY,
                fontSize: Math.round(10 * uiScale),
                fontWeight: 'bold',
                fill: c2Color,
              })}
            />
          )}
        </pixiContainer>
      )}

      <pixiContainer
        x={movesSectionX + movesSectionW / 2}
        y={sectionCenterY}
        scale={isInDanger ? dangerPulse : 1}
      >
        <pixiText text={String(moves)} x={0} y={-Math.round(2 * uiScale)} anchor={0.5} style={movesValueStyle} />
        <pixiText text="moves" x={0} y={Math.round(10 * uiScale)} anchor={0.5} style={movesLabelStyle} />
      </pixiContainer>

      {combo > 0 && (
        <pixiText
          text={`${combo}x`}
          x={movesSectionX - Math.round(6 * uiScale)}
          y={sectionCenterY}
          anchor={0.5}
          style={new TextStyle({
            fontFamily: FONT_BOLD,
            fontSize: Math.round(12 * uiScale),
            fontWeight: 'bold',
            fill: combo >= 5 ? 0xffd700 : combo >= 3 ? 0xf97316 : 0xfbbf24,
          })}
        />
      )}
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
          fontFamily: FONT_TITLE, fontSize: 28, fill: 0xffffff,
          dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
        }}
      />
      <pixiText
        text="Preparing the blocks..."
        x={sw / 2} y={sh / 2 + 20} anchor={0.5}
        style={{ fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8 }}
      />
    </pixiContainer>
  );
};

const PlayScreenInner = (props: PlayScreenProps) => {
  const layout = useFullscreenLayout();
  const { screenWidth: sw, screenHeight: sh, uiScale } = layout;
  const { offset, lineClear } = useScreenShake();

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

      <GameTopBar
        sw={sw} topBarH={layout.topBarHeight} uiScale={uiScale}
        cubeBalance={cubeBalance} level={level}
        combo={combo} maxCombo={maxCombo} totalScore={totalScore}
        onHomeClick={onGoHome}
      />

      <GameInfoBar
        levelScore={levelScore} targetScore={targetScore}
        moves={moves} maxMoves={maxMoves}
        constraint1={constraint1} constraint2={constraint2}
        combo={combo} isInDanger={isPlayerInDanger}
        layout={layout}
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
            style={{
              fontFamily: FONT_TITLE, fontSize: 16, fill: 0xfbbf24,
              dropShadow: { alpha: 0.8, angle: Math.PI / 4, blur: 4, distance: 2, color: 0x000000 },
            }}
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
