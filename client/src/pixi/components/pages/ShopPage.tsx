/**
 * ShopPage — Permanent upgrade shop
 *
 * Single-column card layout (V3 spec) with PixiScrollContainer.
 * 4 sections: STARTING BONUSES, BAG SIZE, BRIDGING, UNLOCK BONUSES.
 * Each card: icon + title + current/next + cost + progress pips + upgrade button.
 *
 * Contract bonus_type mapping:
 *   Upgrades (starting/bag): 0=Combo  1=Score  2=Harvest  3=Wave  4=Supply
 *   Unlocks:                 4=Wave   5=Supply
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { PixiButton } from '../../ui/PixiButton';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { color, space } from '@/pixi/design/tokens';

// ============================================================================
// CONTRACT CONSTANTS — must match contracts/src/types/bonus.cairo
// ============================================================================

const UPGRADE_TYPE = {
  COMBO: 0,
  SCORE: 1,
  HARVEST: 2,
  WAVE: 3,
  SUPPLY: 4,
} as const;

const UNLOCK_TYPE = {
  WAVE: 4,
  SUPPLY: 5,
} as const;

const STARTING_COSTS = [100, 250, 500];
const BAG_COSTS = [100, 250, 500];
const BRIDGING_COSTS = [200, 500, 1000];
const UNLOCK_COST = 200;

const MAX_CUBES_PER_RANK = [0, 5, 10, 20, 40];
const MAX_LEVEL = 3;

// ============================================================================
// TEXT STYLES
// ============================================================================

const STYLE_SECTION_HEADER = { fontFamily: FONT_TITLE, fontSize: 14, fill: color.text.secondary };
const STYLE_CARD_TITLE = { fontFamily: FONT_TITLE, fontSize: 15, fill: color.text.primary };
const STYLE_CARD_TITLE_DIM = { fontFamily: FONT_TITLE, fontSize: 15, fill: color.text.muted };
const STYLE_LABEL = { fontFamily: FONT_BODY, fontSize: 12, fill: color.text.secondary };
const STYLE_COST = { fontFamily: FONT_TITLE, fontSize: 13, fill: color.accent.gold };
const STYLE_ICON = { fontSize: 22 };
const STYLE_LOCK_ICON = { fontSize: 16 };
const STYLE_EMPTY_ICON = { fontSize: 40 };
const STYLE_EMPTY_TITLE = { fontFamily: FONT_TITLE, fontSize: 18, fill: color.text.muted };
const STYLE_EMPTY_SUB = { fontFamily: FONT_BODY, fontSize: 13, fill: color.text.secondary };

const CARD_RADIUS = 12;
const CARD_PAD = 14;
const CARD_H = 80;
const BTN_W = 72;
const BTN_H = 36;

// ============================================================================
// LEVEL PIPS — filled/empty dots showing upgrade progress
// ============================================================================

const LevelPips = ({
  level,
  maxLevel,
  x,
  y,
  pipColor,
}: {
  level: number;
  maxLevel: number;
  x: number;
  y: number;
  pipColor: number;
}) => {
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const pw = 18;
      const ph = 6;
      const gap = 5;
      for (let i = 0; i < maxLevel; i++) {
        const on = i < level;
        g.setFillStyle({ color: on ? pipColor : color.state.hover, alpha: on ? 1 : 0.4 });
        g.roundRect(i * (pw + gap), 0, pw, ph, 3);
        g.fill();
      }
    },
    [level, maxLevel, pipColor],
  );

  return <pixiGraphics x={x} y={y} draw={draw} />;
};

// ============================================================================
// SHOP CARD — Single-column card for one upgrade item
// ============================================================================

const ShopCard = ({
  name,
  icon,
  accent,
  level,
  maxLvl,
  costs,
  y,
  width,
  cubeBalance,
  upgrading,
  onUpgrade,
}: {
  name: string;
  icon: string;
  accent: number;
  level: number;
  maxLvl: number;
  costs: number[];
  y: number;
  width: number;
  cubeBalance: number;
  upgrading: boolean;
  onUpgrade?: () => void;
}) => {
  const isMaxed = level >= maxLvl;
  const cost = isMaxed ? 0 : costs[level];
  const canUpgrade = !isMaxed && cubeBalance >= cost && !upgrading;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.primary, alpha: 0.95 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.fill();
      // Left accent strip
      g.setFillStyle({ color: accent });
      g.roundRect(0, 4, 3, CARD_H - 8, 1.5);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.4 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.stroke();
    },
    [width, accent],
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />
      {/* Icon + Title */}
      <pixiText text={icon} x={CARD_PAD} y={14} style={STYLE_ICON} eventMode="none" />
      <pixiText text={name} x={CARD_PAD + 30} y={16} style={STYLE_CARD_TITLE} eventMode="none" />
      {/* Current → Next */}
      <pixiText
        text={isMaxed ? 'MAX LEVEL' : `Level ${level} → ${level + 1}`}
        x={CARD_PAD}
        y={44}
        style={STYLE_LABEL}
        eventMode="none"
      />
      {/* Cost */}
      {!isMaxed && (
        <pixiText
          text={`Cost: ${cost} CUBE`}
          x={CARD_PAD}
          y={60}
          style={STYLE_COST}
          eventMode="none"
        />
      )}
      {/* Pips */}
      <LevelPips level={level} maxLevel={maxLvl} x={width / 2} y={62} pipColor={accent} />
      {/* Button */}
      <pixiContainer x={width - CARD_PAD - BTN_W} y={(CARD_H - BTN_H) / 2}>
        <PixiButton
          label={isMaxed ? 'MAX' : `${cost}`}
          width={BTN_W}
          height={BTN_H}
          variant={isMaxed ? 'green' : canUpgrade ? 'orange' : 'purple'}
          disabled={!canUpgrade}
          onPress={onUpgrade}
          textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// UNLOCK CARD — For Wave/Supply unlock
// ============================================================================

const UnlockCard = ({
  name,
  icon,
  accent,
  isUnlocked,
  y,
  width,
  cubeBalance,
  upgrading,
  onUnlock,
}: {
  name: string;
  icon: string;
  accent: number;
  isUnlocked: boolean;
  y: number;
  width: number;
  cubeBalance: number;
  upgrading: boolean;
  onUnlock?: () => void;
}) => {
  const canUnlock = !isUnlocked && cubeBalance >= UNLOCK_COST && !upgrading;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.primary, alpha: 0.95 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.fill();
      // Left accent strip
      g.setFillStyle({ color: accent });
      g.roundRect(0, 4, 3, CARD_H - 8, 1.5);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.4 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.stroke();
      // Locked overlay
      if (!isUnlocked) {
        g.setFillStyle({ color: 0x000000, alpha: 0.3 });
        g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
        g.fill();
      }
    },
    [width, accent, isUnlocked],
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />
      <pixiText text={icon} x={CARD_PAD} y={14} style={STYLE_ICON} eventMode="none" />
      <pixiText
        text={name}
        x={CARD_PAD + 30}
        y={16}
        style={isUnlocked ? STYLE_CARD_TITLE : STYLE_CARD_TITLE_DIM}
        eventMode="none"
      />
      {!isUnlocked && (
        <pixiText text="🔒" x={CARD_PAD + 30 + name.length * 9} y={14} style={STYLE_LOCK_ICON} eventMode="none" />
      )}
      <pixiText
        text={isUnlocked ? 'UNLOCKED' : `Unlock to use ${name} bonus`}
        x={CARD_PAD}
        y={44}
        style={STYLE_LABEL}
        eventMode="none"
      />
      {!isUnlocked && (
        <pixiText
          text={`Cost: ${UNLOCK_COST} CUBE`}
          x={CARD_PAD}
          y={60}
          style={STYLE_COST}
          eventMode="none"
        />
      )}
      <pixiContainer x={width - CARD_PAD - (isUnlocked ? BTN_W : 100)} y={(CARD_H - BTN_H) / 2}>
        <PixiButton
          label={isUnlocked ? '✓' : `UNLOCK ${UNLOCK_COST}`}
          width={isUnlocked ? BTN_W : 100}
          height={BTN_H}
          variant={isUnlocked ? 'green' : canUnlock ? 'orange' : 'purple'}
          disabled={isUnlocked || !canUnlock}
          onPress={onUnlock}
          textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// BRIDGING CARD
// ============================================================================

const BridgingCard = ({
  rank,
  y,
  width,
  cubeBalance,
  upgrading,
  onUpgrade,
}: {
  rank: number;
  y: number;
  width: number;
  cubeBalance: number;
  upgrading: boolean;
  onUpgrade?: () => void;
}) => {
  const isMaxed = rank >= BRIDGING_COSTS.length;
  const cost = isMaxed ? 0 : BRIDGING_COSTS[rank];
  const canUpgrade = !isMaxed && cubeBalance >= cost && !upgrading;
  const maxCubes = MAX_CUBES_PER_RANK[rank] ?? 0;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.primary, alpha: 0.95 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.fill();
      g.setFillStyle({ color: color.accent.gold });
      g.roundRect(0, 4, 3, CARD_H - 8, 1.5);
      g.fill();
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.4 });
      g.roundRect(0, 0, width, CARD_H, CARD_RADIUS);
      g.stroke();
    },
    [width],
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />
      <pixiText text="🌉" x={CARD_PAD} y={14} style={STYLE_ICON} eventMode="none" />
      <pixiText text="Bridging" x={CARD_PAD + 30} y={16} style={STYLE_CARD_TITLE} eventMode="none" />
      <pixiText
        text={`Rank ${rank} · Max ${maxCubes} cubes/run`}
        x={CARD_PAD}
        y={44}
        style={STYLE_LABEL}
        eventMode="none"
      />
      {!isMaxed && (
        <pixiText text={`Cost: ${cost} CUBE`} x={CARD_PAD} y={60} style={STYLE_COST} eventMode="none" />
      )}
      <LevelPips level={rank} maxLevel={MAX_LEVEL} x={width / 2} y={62} pipColor={color.accent.gold} />
      <pixiContainer x={width - CARD_PAD - BTN_W} y={(CARD_H - BTN_H) / 2}>
        <PixiButton
          label={isMaxed ? 'MAX' : `${cost}`}
          width={BTN_W}
          height={BTN_H}
          variant={isMaxed ? 'green' : canUpgrade ? 'orange' : 'purple'}
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
  const [upgrading, setUpgrading] = useState(false);
  const upgradingRef = useRef(false);

  const pad = space.lg;
  const contentTop = topBarHeight + pad;
  const contentWidth = Math.min(screenWidth - pad * 2, 720);
  const contentX = Math.max(pad, (screenWidth - contentWidth) / 2);
  const listHeight = screenHeight - contentTop - pad;

  // Ref-guarded action handler to prevent double-clicks
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

  // Default meta when not loaded
  const DEFAULT_META: PlayerMetaData = {
    startingCombo: 0, startingScore: 0, startingHarvest: 0, startingWave: 0, startingSupply: 0,
    bagComboLevel: 0, bagScoreLevel: 0, bagHarvestLevel: 0, bagWaveLevel: 0, bagSupplyLevel: 0,
    bridgingRank: 0, waveUnlocked: false, supplyUnlocked: false, totalRuns: 0, totalCubesEarned: 0,
  };
  const meta = playerMeta ?? DEFAULT_META;

  // ---- LAYOUT: single-column, 4 sections ----
  const sectionGap = 24;
  const cardGap = 8;
  const sectionHeaderH = 28;

  // Bonus items for Starting + Bag sections
  const bonuses = useMemo(() => [
    { name: 'Combo', icon: '🔥', accent: color.accent.orange, type: UPGRADE_TYPE.COMBO },
    { name: 'Score', icon: '⭐', accent: color.accent.gold, type: UPGRADE_TYPE.SCORE },
    { name: 'Harvest', icon: '🌾', accent: color.status.success, type: UPGRADE_TYPE.HARVEST },
    { name: 'Wave', icon: '🌊', accent: color.accent.blue, type: UPGRADE_TYPE.WAVE },
    { name: 'Supply', icon: '📦', accent: color.accent.purple, type: UPGRADE_TYPE.SUPPLY },
  ], []);

  const getStartingLevel = (type: number) => {
    switch (type) {
      case 0: return meta.startingCombo;
      case 1: return meta.startingScore;
      case 2: return meta.startingHarvest;
      case 3: return meta.startingWave;
      case 4: return meta.startingSupply;
      default: return 0;
    }
  };

  const getBagLevel = (type: number) => {
    switch (type) {
      case 0: return meta.bagComboLevel;
      case 1: return meta.bagScoreLevel;
      case 2: return meta.bagHarvestLevel;
      case 3: return meta.bagWaveLevel;
      case 4: return meta.bagSupplyLevel;
      default: return 0;
    }
  };

  // Calculate total scrollable content height
  let yOffset = 0;

  // Section 1: STARTING BONUSES
  const startingSectionY = yOffset;
  yOffset += sectionHeaderH;
  const startingCards = bonuses.map((b, i) => {
    const cardY = yOffset;
    yOffset += CARD_H + cardGap;
    return { ...b, y: cardY, level: getStartingLevel(b.type) };
  });
  yOffset += sectionGap - cardGap;

  // Section 2: BAG SIZE
  const bagSectionY = yOffset;
  yOffset += sectionHeaderH;
  const bagCards = bonuses.map((b, i) => {
    const cardY = yOffset;
    yOffset += CARD_H + cardGap;
    return { ...b, y: cardY, level: getBagLevel(b.type) };
  });
  yOffset += sectionGap - cardGap;

  // Section 3: BRIDGING
  const bridgingSectionY = yOffset;
  yOffset += sectionHeaderH;
  const bridgingY = yOffset;
  yOffset += CARD_H + sectionGap;

  // Section 4: UNLOCK BONUSES
  const unlockSectionY = yOffset;
  yOffset += sectionHeaderH;
  const waveUnlockY = yOffset;
  yOffset += CARD_H + cardGap;
  const supplyUnlockY = yOffset;
  yOffset += CARD_H + pad;

  const totalHeight = yOffset;

  return (
    <pixiContainer>
      <PageTopBar
        title="SHOP"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      <pixiContainer x={contentX} y={contentTop}>
        {!isConnected ? (
          <pixiContainer>
            <pixiText text="🛒" x={contentWidth / 2} y={60} anchor={0.5} style={STYLE_EMPTY_ICON} eventMode="none" />
            <pixiText text="Connect to view shop" x={contentWidth / 2} y={110} anchor={0.5} style={STYLE_EMPTY_TITLE} eventMode="none" />
            <pixiText text="Log in to upgrade bonuses" x={contentWidth / 2} y={138} anchor={0.5} style={STYLE_EMPTY_SUB} eventMode="none" />
          </pixiContainer>
        ) : (
          <PixiScrollContainer
            width={contentWidth}
            height={listHeight}
            contentHeight={totalHeight}
          >
            {/* ── SECTION 1: STARTING BONUSES ── */}
            <pixiText text="STARTING BONUSES" x={0} y={startingSectionY + 6} style={STYLE_SECTION_HEADER} eventMode="none" />
            {startingCards.map((card) => (
              <ShopCard
                key={`start-${card.type}`}
                name={card.name}
                icon={card.icon}
                accent={card.accent}
                level={card.level}
                maxLvl={MAX_LEVEL}
                costs={STARTING_COSTS}
                y={card.y}
                width={contentWidth}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgrade={() => handleAction(() => onUpgradeStartingBonus?.(card.type))}
              />
            ))}

            {/* ── SECTION 2: BAG SIZE ── */}
            <pixiText text="BAG SIZE" x={0} y={bagSectionY + 6} style={STYLE_SECTION_HEADER} eventMode="none" />
            {bagCards.map((card) => (
              <ShopCard
                key={`bag-${card.type}`}
                name={card.name}
                icon={card.icon}
                accent={card.accent}
                level={card.level}
                maxLvl={MAX_LEVEL}
                costs={BAG_COSTS}
                y={card.y}
                width={contentWidth}
                cubeBalance={cubeBalance}
                upgrading={upgrading}
                onUpgrade={() => handleAction(() => onUpgradeBagSize?.(card.type))}
              />
            ))}

            {/* ── SECTION 3: BRIDGING ── */}
            <pixiText text="BRIDGING" x={0} y={bridgingSectionY + 6} style={STYLE_SECTION_HEADER} eventMode="none" />
            <BridgingCard
              rank={meta.bridgingRank}
              y={bridgingY}
              width={contentWidth}
              cubeBalance={cubeBalance}
              upgrading={upgrading}
              onUpgrade={() => handleAction(() => onUpgradeBridging?.())}
            />

            {/* ── SECTION 4: UNLOCK BONUSES ── */}
            <pixiText text="UNLOCK BONUSES" x={0} y={unlockSectionY + 6} style={STYLE_SECTION_HEADER} eventMode="none" />
            <UnlockCard
              name="Wave"
              icon="🌊"
              accent={color.accent.blue}
              isUnlocked={meta.waveUnlocked}
              y={waveUnlockY}
              width={contentWidth}
              cubeBalance={cubeBalance}
              upgrading={upgrading}
              onUnlock={() => handleAction(() => onUnlockBonus?.(UNLOCK_TYPE.WAVE))}
            />
            <UnlockCard
              name="Supply"
              icon="📦"
              accent={color.accent.purple}
              isUnlocked={meta.supplyUnlocked}
              y={supplyUnlockY}
              width={contentWidth}
              cubeBalance={cubeBalance}
              upgrading={upgrading}
              onUnlock={() => handleAction(() => onUnlockBonus?.(UNLOCK_TYPE.SUPPLY))}
            />
          </PixiScrollContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default ShopPage;
