/**
 * ShopPage - Full-screen shop for permanent upgrades
 * Shows: Starting bonuses, bag sizes, bridging rank, unlock buttons
 */

import { useState, useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { Button } from '../ui';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// CONSTANTS
// ============================================================================

const STARTING_BONUS_COSTS = [100, 250, 500];
const BAG_SIZE_COSTS = [100, 250, 500];
const BRIDGING_COSTS = [200, 500, 1000];
const UNLOCK_BONUS_COST = 200;
const MAX_CUBES_PER_RANK = [0, 5, 10, 20, 40];

// ============================================================================
// LEVEL PIPS
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
      const pipW = 20;
      const pipH = 8;
      const gap = 6;
      for (let i = 0; i < maxLevel; i++) {
        const filled = i < level;
        g.setFillStyle({ color: filled ? color : 0x334155, alpha: filled ? 1 : 0.5 });
        g.roundRect(i * (pipW + gap), 0, pipW, pipH, 3);
        g.fill();
      }
    },
    [level, maxLevel, color]
  );

  return <pixiGraphics x={x} y={y} draw={draw} />;
};

// ============================================================================
// UPGRADE CARD
// ============================================================================

const UpgradeCard = ({
  title,
  icon,
  startingLevel,
  bagLevel,
  isUnlocked,
  x,
  y,
  width,
  height,
  cubeBalance,
  onUpgradeStarting,
  onUpgradeBag,
  onUnlock,
}: {
  title: string;
  icon: string;
  startingLevel: number;
  bagLevel: number;
  isUnlocked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  cubeBalance: number;
  onUpgradeStarting?: () => void;
  onUpgradeBag?: () => void;
  onUnlock?: () => void;
}) => {
  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, width, height, 12);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
      g.roundRect(0, 0, width, height, 12);
      g.stroke();
      if (!isUnlocked) {
        g.setFillStyle({ color: 0x000000, alpha: 0.5 });
        g.roundRect(0, 0, width, height, 12);
        g.fill();
      }
    },
    [width, height, isUnlocked]
  );

  const nextStartingCost = startingLevel < 3 ? STARTING_BONUS_COSTS[startingLevel] : null;
  const nextBagCost = bagLevel < 3 ? BAG_SIZE_COSTS[bagLevel] : null;
  const canUpgradeStarting = nextStartingCost !== null && cubeBalance >= nextStartingCost;
  const canUpgradeBag = nextBagCost !== null && cubeBalance >= nextBagCost;
  const canUnlock = !isUnlocked && cubeBalance >= UNLOCK_BONUS_COST;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Icon & Title */}
      <pixiText text={icon} x={16} y={16} style={{ fontSize: 28 }} />
      <pixiText
        text={title}
        x={52}
        y={20}
        style={{ fontFamily: FONT, fontSize: 16, fill: isUnlocked ? 0xffffff : 0x64748b }}
      />

      {isUnlocked ? (
        <>
          {/* Starting Level */}
          <pixiText
            text="Starting"
            x={16}
            y={52}
            style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
          />
          <LevelPips level={startingLevel} maxLevel={3} x={16} y={68} color={0x60a5fa} />
          {nextStartingCost && onUpgradeStarting && (
            <pixiContainer x={width - 70} y={55}>
              <Button
                text={`${nextStartingCost}`}
                width={54}
                height={26}
                variant={canUpgradeStarting ? 'primary' : 'secondary'}
                fontSize={11}
                onClick={onUpgradeStarting}
                disabled={!canUpgradeStarting}
              />
            </pixiContainer>
          )}

          {/* Bag Level */}
          <pixiText
            text="Bag Size"
            x={16}
            y={92}
            style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
          />
          <LevelPips level={bagLevel} maxLevel={3} x={16} y={108} color={0x22c55e} />
          {nextBagCost && onUpgradeBag && (
            <pixiContainer x={width - 70} y={95}>
              <Button
                text={`${nextBagCost}`}
                width={54}
                height={26}
                variant={canUpgradeBag ? 'primary' : 'secondary'}
                fontSize={11}
                onClick={onUpgradeBag}
                disabled={!canUpgradeBag}
              />
            </pixiContainer>
          )}
        </>
      ) : (
        /* Unlock Button */
        <pixiContainer x={(width - 100) / 2} y={65}>
          <Button
            text={`Unlock ${UNLOCK_BONUS_COST}`}
            width={100}
            height={32}
            variant={canUnlock ? 'primary' : 'secondary'}
            fontSize={12}
            onClick={onUnlock}
            disabled={!canUnlock}
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
  onUpgrade,
}: {
  rank: number;
  x: number;
  y: number;
  width: number;
  height: number;
  cubeBalance: number;
  onUpgrade?: () => void;
}) => {
  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, width, height, 12);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
      g.roundRect(0, 0, width, height, 12);
      g.stroke();
    },
    [width, height]
  );

  const nextCost = rank < 4 ? BRIDGING_COSTS[rank] : null;
  const canUpgrade = nextCost !== null && cubeBalance >= nextCost;
  const maxCubes = MAX_CUBES_PER_RANK[rank] || 0;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />

      <pixiText text="🌉" x={16} y={16} style={{ fontSize: 28 }} />
      <pixiText
        text="Bridging"
        x={52}
        y={20}
        style={{ fontFamily: FONT, fontSize: 16, fill: 0xffffff }}
      />

      <pixiText
        text={`Rank ${rank}`}
        x={16}
        y={55}
        style={{ fontFamily: 'Arial', fontSize: 12, fill: 0x94a3b8 }}
      />
      <pixiText
        text={`Max ${maxCubes} cubes`}
        x={16}
        y={75}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0xfbbf24 }}
      />

      <LevelPips level={rank} maxLevel={4} x={16} y={100} color={0xfbbf24} />

      {nextCost && onUpgrade && (
        <pixiContainer x={width - 70} y={75}>
          <Button
            text={`${nextCost}`}
            width={54}
            height={28}
            variant={canUpgrade ? 'primary' : 'secondary'}
            fontSize={11}
            onClick={onUpgrade}
            disabled={!canUpgrade}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SHOP PAGE
// ============================================================================

interface ShopPageProps {
  playerMeta: PlayerMetaData | null;
  cubeBalance: number;
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
  screenWidth,
  screenHeight,
  topBarHeight,
  onUpgradeStartingBonus,
  onUpgradeBagSize,
  onUpgradeBridging,
  onUnlockBonus,
}: ShopPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const contentPadding = 16;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const cardW = (contentWidth - 12) / 2;
  const cardH = 130;
  const cardGap = 12;

  // Calculate total content height
  const totalRows = 3;
  const totalHeight = totalRows * (cardH + cardGap);
  const listHeight = screenHeight - contentTop - contentPadding;
  const maxScroll = Math.max(0, totalHeight - listHeight);

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const dy = lastY.current - e.data.global.y;
      lastY.current = e.data.global.y;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Extract player data
  const startingHammer = playerMeta?.startingHammer ?? 0;
  const startingWave = playerMeta?.startingWave ?? 0;
  const startingTotem = playerMeta?.startingTotem ?? 0;
  const startingShrink = playerMeta?.startingShrink ?? 0;
  const startingShuffle = playerMeta?.startingShuffle ?? 0;

  const bagHammer = playerMeta?.bagHammerLevel ?? 0;
  const bagWave = playerMeta?.bagWaveLevel ?? 0;
  const bagTotem = playerMeta?.bagTotemLevel ?? 0;
  const bagShrink = playerMeta?.bagShrinkLevel ?? 0;
  const bagShuffle = playerMeta?.bagShuffleLevel ?? 0;

  const bridgingRank = playerMeta?.bridgingRank ?? 0;
  const shrinkUnlocked = playerMeta?.shrinkUnlocked ?? false;
  const shuffleUnlocked = playerMeta?.shuffleUnlocked ?? false;

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="Shop"
        subtitle={`${cubeBalance} cubes available`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      {/* Scrollable content */}
      <pixiContainer x={contentPadding} y={contentTop}>
        <pixiContainer
          eventMode="static"
          onPointerDown={handlePointerDown}
          onGlobalPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerUpOutside={handlePointerUp}
        >
          {/* Invisible hit area */}
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.rect(0, 0, contentWidth, listHeight);
              g.fill({ color: 0xffffff, alpha: 0.001 });
            }}
          />

          <pixiContainer y={-scrollY}>
            {/* Row 1: Hammer, Wave */}
            <UpgradeCard
              title="Hammer"
              icon="🔨"
              startingLevel={startingHammer}
              bagLevel={bagHammer}
              isUnlocked={true}
              x={0}
              y={0}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => onUpgradeStartingBonus?.(1)}
              onUpgradeBag={() => onUpgradeBagSize?.(1)}
            />
            <UpgradeCard
              title="Wave"
              icon="🌊"
              startingLevel={startingWave}
              bagLevel={bagWave}
              isUnlocked={true}
              x={cardW + cardGap}
              y={0}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => onUpgradeStartingBonus?.(3)}
              onUpgradeBag={() => onUpgradeBagSize?.(3)}
            />

            {/* Row 2: Totem, Shrink */}
            <UpgradeCard
              title="Totem"
              icon="🗿"
              startingLevel={startingTotem}
              bagLevel={bagTotem}
              isUnlocked={true}
              x={0}
              y={cardH + cardGap}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => onUpgradeStartingBonus?.(2)}
              onUpgradeBag={() => onUpgradeBagSize?.(2)}
            />
            <UpgradeCard
              title="Shrink"
              icon="🔻"
              startingLevel={startingShrink}
              bagLevel={bagShrink}
              isUnlocked={shrinkUnlocked}
              x={cardW + cardGap}
              y={cardH + cardGap}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => onUpgradeStartingBonus?.(4)}
              onUpgradeBag={() => onUpgradeBagSize?.(4)}
              onUnlock={() => onUnlockBonus?.(4)}
            />

            {/* Row 3: Shuffle, Bridging */}
            <UpgradeCard
              title="Shuffle"
              icon="🔀"
              startingLevel={startingShuffle}
              bagLevel={bagShuffle}
              isUnlocked={shuffleUnlocked}
              x={0}
              y={(cardH + cardGap) * 2}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => onUpgradeStartingBonus?.(5)}
              onUpgradeBag={() => onUpgradeBagSize?.(5)}
              onUnlock={() => onUnlockBonus?.(5)}
            />
            <BridgingCard
              rank={bridgingRank}
              x={cardW + cardGap}
              y={(cardH + cardGap) * 2}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgrade={onUpgradeBridging}
            />
          </pixiContainer>
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
};

export default ShopPage;
