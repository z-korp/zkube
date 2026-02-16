/**
 * ShopPage — Permanent upgrade shop
 *
 * 2-column card grid with momentum scroll.
 * Bonuses have Starting Charges + Bag Size upgrades (3 levels each).
 * Wave and Supply require unlock before upgrading.
 * Bridging increases max cubes bridgeable per run.
 *
 * Contract bonus_type mapping:
 *   Upgrades (starting/bag): 0=Combo  1=Score  2=Harvest  3=Wave  4=Supply
 *   Unlocks:                 4=Wave   5=Supply
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTick } from '@pixi/react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { PixiButton } from '../../ui/PixiButton';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import { FONT_TITLE, FONT_BODY, UI } from '../../utils/colors';

// ============================================================================
// CONTRACT CONSTANTS — must match contracts/src/types/bonus.cairo
// ============================================================================

/** bonus_type values sent to onUpgradeStartingBonus / onUpgradeBagSize */
const UPGRADE_TYPE = {
  COMBO: 0,
  SCORE: 1,
  HARVEST: 2,
  WAVE: 3,
  SUPPLY: 4,
} as const;

/** bonus_type values sent to onUnlockBonus */
const UNLOCK_TYPE = {
  WAVE: 4,
  SUPPLY: 5,
} as const;

/** Cost per upgrade level: index = current level, value = cost to reach next */
const STARTING_COSTS = [100, 250, 500];
const BAG_COSTS = [100, 250, 500];
const BRIDGING_COSTS = [200, 500, 1000];
const UNLOCK_COST = 200;

/** Max cubes bridgeable per run at each rank */
const MAX_CUBES_PER_RANK = [0, 5, 10, 20, 40];
const MAX_LEVEL = 3;

// ============================================================================
// CARD LAYOUT
// ============================================================================

const CARD_RADIUS = 10;
const CARD_PAD = 14;
const BTN_W = 62;
const BTN_H = 36;

// ============================================================================
// TEXT STYLES (module-level constants)
// ============================================================================

const STYLE_HEADER = { fontFamily: FONT_TITLE, fontSize: 15, fill: UI.text.primary };
const STYLE_HEADER_DIM = { fontFamily: FONT_TITLE, fontSize: 15, fill: UI.text.muted };
const STYLE_LABEL = { fontFamily: FONT_BODY, fontSize: 11, fill: UI.text.secondary };
const STYLE_ICON = { fontSize: 22 };
const STYLE_LOCK = { fontSize: 16 };
const STYLE_RANK = { fontFamily: FONT_BODY, fontSize: 12, fill: UI.text.secondary };
const STYLE_CUBES = { fontFamily: FONT_TITLE, fontSize: 13, fill: UI.accent.gold };
const STYLE_EMPTY_ICON = { fontSize: 40 };
const STYLE_EMPTY_TITLE = { fontFamily: FONT_TITLE, fontSize: 18, fill: UI.text.muted };
const STYLE_EMPTY_SUB = { fontFamily: FONT_BODY, fontSize: 13, fill: UI.text.secondary };

// ============================================================================
// LEVEL PIPS — filled/empty dots showing upgrade progress
// ============================================================================

const LevelPips = ({
  level,
  maxLevel,
  x,
  y,
  color,
}: {
  level: number;
  maxLevel: number;
  x: number;
  y: number;
  color: number;
}) => {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const pw = 18;
      const ph = 6;
      const gap = 5;
      for (let i = 0; i < maxLevel; i++) {
        const on = i < level;
        g.setFillStyle({ color: on ? color : UI.bg.hover, alpha: on ? 1 : 0.4 });
        g.roundRect(i * (pw + gap), 0, pw, ph, 3);
        g.fill();
      }
    },
    [level, maxLevel, color],
  );

  return <pixiGraphics x={x} y={y} draw={draw} />;
};

// ============================================================================
// BONUS CARD — Starting Charges + Bag Size (or Unlock for locked bonuses)
// ============================================================================

const BonusCard = ({
  name,
  icon,
  accent,
  startingLevel,
  bagLevel,
  isUnlocked,
  x,
  y,
  width,
  height,
  cubeBalance,
  upgrading,
  onUpgradeStarting,
  onUpgradeBag,
  onUnlock,
}: {
  name: string;
  icon: string;
  accent: number;
  startingLevel: number;
  bagLevel: number;
  isUnlocked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  cubeBalance: number;
  upgrading: boolean;
  onUpgradeStarting?: () => void;
  onUpgradeBag?: () => void;
  onUnlock?: () => void;
}) => {
  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Background
      g.setFillStyle({ color: UI.bg.card, alpha: 0.95 });
      g.roundRect(0, 0, width, height, CARD_RADIUS);
      g.fill();
      // Left accent strip
      g.setFillStyle({ color: accent });
      g.roundRect(0, 4, 3, height - 8, 1.5);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 1, color: UI.border.primary, alpha: 0.4 });
      g.roundRect(0, 0, width, height, CARD_RADIUS);
      g.stroke();
      // Locked overlay
      if (!isUnlocked) {
        g.setFillStyle({ color: 0x000000, alpha: 0.4 });
        g.roundRect(0, 0, width, height, CARD_RADIUS);
        g.fill();
      }
    },
    [width, height, accent, isUnlocked],
  );

  const startMaxed = startingLevel >= MAX_LEVEL;
  const startCost = startMaxed ? 0 : STARTING_COSTS[startingLevel];
  const canStart = !startMaxed && cubeBalance >= startCost && !upgrading;

  const bagMaxed = bagLevel >= MAX_LEVEL;
  const bagCost = bagMaxed ? 0 : BAG_COSTS[bagLevel];
  const canBag = !bagMaxed && cubeBalance >= bagCost && !upgrading;

  const canUnlock = !isUnlocked && cubeBalance >= UNLOCK_COST && !upgrading;

  const btnX = width - CARD_PAD - BTN_W;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Header */}
      <pixiText text={icon} x={CARD_PAD} y={12} style={STYLE_ICON} eventMode="none" />
      <pixiText
        text={name}
        x={CARD_PAD + 30}
        y={14}
        style={isUnlocked ? STYLE_HEADER : STYLE_HEADER_DIM}
        eventMode="none"
      />
      {!isUnlocked && (
        <pixiText text="🔒" x={width - 30} y={12} style={STYLE_LOCK} eventMode="none" />
      )}

      {isUnlocked ? (
        <>
           {/* Starting Charges */}
           <pixiText text="STARTING" x={CARD_PAD} y={48} style={STYLE_LABEL} eventMode="none" />
          <LevelPips level={startingLevel} maxLevel={MAX_LEVEL} x={CARD_PAD} y={66} color={accent} />
          <pixiContainer x={btnX} y={48}>
            <PixiButton
              label={startMaxed ? 'MAX' : `${startCost}`}
              width={BTN_W}
              height={BTN_H}
              variant={canStart ? 'orange' : 'purple'}
              disabled={!canStart}
              onPress={onUpgradeStarting}
              textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
            />
          </pixiContainer>

           {/* Bag Size */}
           <pixiText text="BAG" x={CARD_PAD} y={94} style={STYLE_LABEL} eventMode="none" />
          <LevelPips level={bagLevel} maxLevel={MAX_LEVEL} x={CARD_PAD} y={112} color={accent} />
          <pixiContainer x={btnX} y={94}>
            <PixiButton
              label={bagMaxed ? 'MAX' : `${bagCost}`}
              width={BTN_W}
              height={BTN_H}
              variant={canBag ? 'orange' : 'purple'}
              disabled={!canBag}
              onPress={onUpgradeBag}
              textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
            />
          </pixiContainer>
        </>
      ) : (
        /* Unlock button centered in remaining space */
        <pixiContainer x={(width - 120) / 2} y={68}>
            <PixiButton
             label={`UNLOCK ${UNLOCK_COST} 🧊`}
             width={120}
             height={40}
             variant={canUnlock ? 'orange' : 'purple'}
             disabled={!canUnlock}
             onPress={onUnlock}
             textStyle={{ fontFamily: FONT_TITLE, fontSize: 13 }}
           />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ============================================================================
// BRIDGING CARD
// ============================================================================

const BridgingCard = ({
  rank,
  x,
  y,
  width,
  height,
  cubeBalance,
  upgrading,
  onUpgrade,
}: {
  rank: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cubeBalance: number;
  upgrading: boolean;
  onUpgrade?: () => void;
}) => {
  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: UI.bg.card, alpha: 0.95 });
      g.roundRect(0, 0, width, height, CARD_RADIUS);
      g.fill();
      g.setFillStyle({ color: UI.accent.gold });
      g.roundRect(0, 4, 3, height - 8, 1.5);
      g.fill();
      g.setStrokeStyle({ width: 1, color: UI.border.primary, alpha: 0.4 });
      g.roundRect(0, 0, width, height, CARD_RADIUS);
      g.stroke();
    },
    [width, height],
  );

  const isMaxed = rank >= BRIDGING_COSTS.length;
  const cost = isMaxed ? 0 : BRIDGING_COSTS[rank];
  const canUpgrade = !isMaxed && cubeBalance >= cost && !upgrading;
  const maxCubes = MAX_CUBES_PER_RANK[rank] ?? 0;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Header */}
      <pixiText text="🌉" x={CARD_PAD} y={12} style={STYLE_ICON} eventMode="none" />
      <pixiText text="Bridging" x={CARD_PAD + 30} y={14} style={STYLE_HEADER} eventMode="none" />

      {/* Info */}
      <pixiText text={`Rank ${rank}`} x={CARD_PAD} y={50} style={STYLE_RANK} eventMode="none" />
      <pixiText
        text={`Max ${maxCubes} cubes/run`}
        x={CARD_PAD}
        y={68}
        style={STYLE_CUBES}
        eventMode="none"
      />

      {/* Pips */}
      <LevelPips level={rank} maxLevel={MAX_LEVEL} x={CARD_PAD} y={92} color={UI.accent.gold} />

      {/* Upgrade button */}
      <pixiContainer x={width - CARD_PAD - BTN_W} y={86}>
        <PixiButton
          label={isMaxed ? 'MAX' : `${cost}`}
          width={BTN_W}
          height={BTN_H}
          variant={canUpgrade ? 'orange' : 'purple'}
          disabled={!canUpgrade}
          onPress={onUpgrade}
          textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// SHOP PAGE
// ============================================================================

interface ShopPageProps {
  playerMeta: PlayerMetaData | null;
  cubeBalance: number;
  isConnected: boolean;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  onUpgradeStartingBonus?: (bonusType: number) => Promise<void>;
  onUpgradeBagSize?: (bonusType: number) => Promise<void>;
  onUpgradeBridging?: () => Promise<void>;
  onUnlockBonus?: (bonusType: number) => Promise<void>;
}

export const ShopPage = ({
  playerMeta,
  cubeBalance,
  isConnected,
  screenWidth,
  screenHeight,
  topBarHeight,
  onUpgradeStartingBonus,
  onUpgradeBagSize,
  onUpgradeBridging,
  onUnlockBonus,
}: ShopPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const [upgrading, setUpgrading] = useState(false);
  const upgradingRef = useRef(false);
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const velocity = useRef(0);

  // ---- LAYOUT ----

  const pad = 16;
  const contentTop = topBarHeight + pad;
  const contentWidth = Math.min(screenWidth - pad * 2, 720);
  const contentX = Math.max(pad, (screenWidth - contentWidth) / 2);
  const gap = 12;
  const cardW = (contentWidth - gap) / 2;
  const cardH = 148;
  const rows = 3;
  const totalHeight = rows * cardH + (rows - 1) * gap;
  const listHeight = screenHeight - contentTop - pad;
  const maxScroll = Math.max(0, totalHeight - listHeight);

  // ---- SCROLL ----

  const drawHitArea = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.rect(0, 0, contentWidth, listHeight);
      g.fill({ color: 0xffffff, alpha: 0.001 });
    },
    [contentWidth, listHeight],
  );

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
    velocity.current = 0;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const dy = lastY.current - e.data.global.y;
      lastY.current = e.data.global.y;
      velocity.current = velocity.current * 0.6 + dy * 0.4;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev)));
  }, [maxScroll]);

  useTick((ticker) => {
    if (isDragging.current) return;
    if (Math.abs(velocity.current) < 0.05) {
      velocity.current = 0;
      return;
    }
    const s = ticker.deltaMS / 16.67;
    const delta = velocity.current * s;
    velocity.current *= Math.pow(0.92, s);
    setScrollY((prev) => {
      const next = Math.max(0, Math.min(maxScroll, prev + delta));
      if (next === 0 || next === maxScroll) velocity.current = 0;
      return next;
    });
  });

  // ---- ACTION HANDLER (ref-guarded to prevent double-clicks) ----

  const handleAction = useCallback(async (fn: () => void) => {
    if (upgradingRef.current) return;
    upgradingRef.current = true;
    setUpgrading(true);
    try {
      await fn();
    } catch {
      // parent handlers display errors via toast
    } finally {
      upgradingRef.current = false;
      setUpgrading(false);
    }
  }, []);

  // ---- PLAYER DATA (default to zeros when meta hasn't loaded yet) ----

  const DEFAULT_META: PlayerMetaData = {
    startingCombo: 0, startingScore: 0, startingHarvest: 0, startingWave: 0, startingSupply: 0,
    bagComboLevel: 0, bagScoreLevel: 0, bagHarvestLevel: 0, bagWaveLevel: 0, bagSupplyLevel: 0,
    bridgingRank: 0, waveUnlocked: false, supplyUnlocked: false, totalRuns: 0, totalCubesEarned: 0,
  };
  const meta = playerMeta ?? DEFAULT_META;
  const col2X = cardW + gap;
  const rowY = (r: number) => r * (cardH + gap);

  return (
    <pixiContainer>
      <PageTopBar
        title="Shop"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      <pixiContainer x={contentX} y={contentTop}>
        {!isConnected ? (
          /* Not connected */
          <pixiContainer>
            <pixiText
              text="🛒"
              x={contentWidth / 2}
              y={60}
              anchor={0.5}
              style={STYLE_EMPTY_ICON}
              eventMode="none"
            />
            <pixiText
              text="Connect to view shop"
              x={contentWidth / 2}
              y={110}
              anchor={0.5}
              style={STYLE_EMPTY_TITLE}
              eventMode="none"
            />
            <pixiText
              text="Log in to upgrade bonuses"
              x={contentWidth / 2}
              y={138}
              anchor={0.5}
              style={STYLE_EMPTY_SUB}
              eventMode="none"
            />
          </pixiContainer>
        ) : (
          /* Scrollable card grid */
          <pixiContainer
            eventMode="static"
            onPointerDown={handlePointerDown}
            onGlobalPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
          >
            <pixiGraphics draw={drawHitArea} />

            <pixiContainer y={-scrollY}>
              {/* ── Row 0: Combo + Score ── */}
              <BonusCard
                name="Combo"
                icon="🔥"
                accent={UI.accent.orange}
                startingLevel={meta.startingCombo}
                bagLevel={meta.bagComboLevel}
                isUnlocked
                x={0}
                y={rowY(0)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgradeStarting={() =>
                  handleAction(() => onUpgradeStartingBonus?.(UPGRADE_TYPE.COMBO))
                }
                onUpgradeBag={() =>
                  handleAction(() => onUpgradeBagSize?.(UPGRADE_TYPE.COMBO))
                }
              />
              <BonusCard
                name="Score"
                icon="⭐"
                accent={UI.accent.gold}
                startingLevel={meta.startingScore}
                bagLevel={meta.bagScoreLevel}
                isUnlocked
                x={col2X}
                y={rowY(0)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgradeStarting={() =>
                  handleAction(() => onUpgradeStartingBonus?.(UPGRADE_TYPE.SCORE))
                }
                onUpgradeBag={() =>
                  handleAction(() => onUpgradeBagSize?.(UPGRADE_TYPE.SCORE))
                }
              />

              {/* ── Row 1: Harvest + Wave ── */}
              <BonusCard
                name="Harvest"
                icon="🌾"
                accent={UI.status.success}
                startingLevel={meta.startingHarvest}
                bagLevel={meta.bagHarvestLevel}
                isUnlocked
                x={0}
                y={rowY(1)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgradeStarting={() =>
                  handleAction(() => onUpgradeStartingBonus?.(UPGRADE_TYPE.HARVEST))
                }
                onUpgradeBag={() =>
                  handleAction(() => onUpgradeBagSize?.(UPGRADE_TYPE.HARVEST))
                }
              />
              <BonusCard
                name="Wave"
                icon="🌊"
                accent={UI.accent.blue}
                startingLevel={meta.startingWave}
                bagLevel={meta.bagWaveLevel}
                isUnlocked={meta.waveUnlocked}
                x={col2X}
                y={rowY(1)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgradeStarting={() =>
                  handleAction(() => onUpgradeStartingBonus?.(UPGRADE_TYPE.WAVE))
                }
                onUpgradeBag={() =>
                  handleAction(() => onUpgradeBagSize?.(UPGRADE_TYPE.WAVE))
                }
                onUnlock={() =>
                  handleAction(() => onUnlockBonus?.(UNLOCK_TYPE.WAVE))
                }
              />

              {/* ── Row 2: Supply + Bridging ── */}
              <BonusCard
                name="Supply"
                icon="📦"
                accent={UI.accent.purple}
                startingLevel={meta.startingSupply}
                bagLevel={meta.bagSupplyLevel}
                isUnlocked={meta.supplyUnlocked}
                x={0}
                y={rowY(2)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgradeStarting={() =>
                  handleAction(() => onUpgradeStartingBonus?.(UPGRADE_TYPE.SUPPLY))
                }
                onUpgradeBag={() =>
                  handleAction(() => onUpgradeBagSize?.(UPGRADE_TYPE.SUPPLY))
                }
                onUnlock={() =>
                  handleAction(() => onUnlockBonus?.(UNLOCK_TYPE.SUPPLY))
                }
              />
              <BridgingCard
                rank={meta.bridgingRank}
                x={col2X}
                y={rowY(2)}
                width={cardW}
                height={cardH}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgrade={() =>
                  handleAction(() => onUpgradeBridging?.())
                }
              />
            </pixiContainer>
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default ShopPage;
