/**
 * ShopPage - Full-screen shop for permanent upgrades
 * Shows: Starting bonuses, bag sizes, bridging rank, unlock buttons
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useTick } from '@pixi/react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { Button } from '../ui';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import { FONT_TITLE, FONT_BOLD, FONT_BODY } from '../../utils/colors';

const SHOP_ICON_STYLE = { fontSize: 28 };
const SHOP_LABEL_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 };
const BRIDGING_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff };
const BRIDGING_RANK_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x94a3b8 };
const BRIDGING_CUBES_STYLE = { fontFamily: FONT_TITLE, fontSize: 14, fill: 0xfbbf24 };
const CONFIRM_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff };
const CONFIRM_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x94a3b8 };
const CONFIRM_COST_STYLE = { fontFamily: FONT_BOLD, fontSize: 18, fill: 0xfbbf24 };
const CONFIRM_BALANCE_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x94a3b8 };
const EMPTY_ICON_STYLE = { fontSize: 40 };
const EMPTY_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 18, fill: 0x64748b };
const EMPTY_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 13, fill: 0x94a3b8 };

interface PendingPurchase {
  label: string;
  cost: number;
  action: () => Promise<void> | void;
}


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

  const cardTitleStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 16, fill: isUnlocked ? 0xffffff : 0x64748b,
  }), [isUnlocked]);

  const nextStartingCost = startingLevel < 3 ? STARTING_BONUS_COSTS[startingLevel] : null;
  const nextBagCost = bagLevel < 3 ? BAG_SIZE_COSTS[bagLevel] : null;
  const canUpgradeStarting = nextStartingCost !== null && cubeBalance >= nextStartingCost;
  const canUpgradeBag = nextBagCost !== null && cubeBalance >= nextBagCost;
  const canUnlock = !isUnlocked && cubeBalance >= UNLOCK_BONUS_COST;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />

      <pixiText text={icon} x={16} y={16} style={SHOP_ICON_STYLE} eventMode="none" />
      <pixiText
        text={title}
        x={52}
        y={20}
        style={cardTitleStyle}
        eventMode="none"
      />

      {isUnlocked ? (
        <>
          <pixiText
            text="Starting"
            x={16}
            y={52}
            style={SHOP_LABEL_STYLE}
            eventMode="none"
          />
          <LevelPips level={startingLevel} maxLevel={3} x={16} y={68} color={0x60a5fa} />
          {nextStartingCost && onUpgradeStarting && (
            <pixiContainer x={width - 78} y={52}>
              <Button
                text={`${nextStartingCost}`}
                width={62}
                height={44}
                variant={canUpgradeStarting ? 'primary' : 'secondary'}
                fontSize={12}
                onClick={onUpgradeStarting}
                disabled={!canUpgradeStarting}
              />
            </pixiContainer>
          )}

          {/* Bag Level */}
            <pixiText
              text="Bag Size"
              x={16}
              y={100}
              style={SHOP_LABEL_STYLE}
              eventMode="none"
            />
          <LevelPips level={bagLevel} maxLevel={3} x={16} y={116} color={0x22c55e} />
          {nextBagCost && onUpgradeBag && (
            <pixiContainer x={width - 78} y={98}>
              <Button
                text={`${nextBagCost}`}
                width={62}
                height={44}
                variant={canUpgradeBag ? 'primary' : 'secondary'}
                fontSize={12}
                onClick={onUpgradeBag}
                disabled={!canUpgradeBag}
              />
            </pixiContainer>
          )}
        </>
      ) : (
        /* Unlock Button */
        <pixiContainer x={(width - 114) / 2} y={58}>
          <Button
            text={`Unlock ${UNLOCK_BONUS_COST}`}
            width={114}
            height={44}
            variant={canUnlock ? 'primary' : 'secondary'}
            fontSize={13}
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

      <pixiText text="🌉" x={16} y={16} style={SHOP_ICON_STYLE} eventMode="none" />
      <pixiText
        text="Bridging"
        x={52}
        y={20}
        style={BRIDGING_TITLE_STYLE}
        eventMode="none"
      />

      <pixiText
        text={`Rank ${rank}`}
        x={16}
        y={55}
        style={BRIDGING_RANK_STYLE}
        eventMode="none"
      />
      <pixiText
        text={`Max ${maxCubes} cubes`}
        x={16}
        y={75}
        style={BRIDGING_CUBES_STYLE}
        eventMode="none"
      />

      <LevelPips level={rank} maxLevel={4} x={16} y={100} color={0xfbbf24} />

      {nextCost && onUpgrade && (
        <pixiContainer x={width - 78} y={70}>
          <Button
            text={`${nextCost}`}
            width={62}
            height={44}
            variant={canUpgrade ? 'primary' : 'secondary'}
            fontSize={12}
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
  isConnected: boolean;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  onUpgradeStartingBonus?: (bonusType: number) => Promise<void>;
  onUpgradeBagSize?: (bonusType: number) => Promise<void>;
  onUpgradeBridging?: () => Promise<void>;
  onUnlockBonus?: (bonusType: number) => Promise<void>;
}

const ConfirmOverlay = ({
  purchase,
  cubeBalance,
  screenWidth,
  screenHeight,
  onConfirm,
  onCancel,
  isConfirming,
}: {
  purchase: PendingPurchase;
  cubeBalance: number;
  screenWidth: number;
  screenHeight: number;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isConfirming: boolean;
}) => {
  const modalW = Math.min(280, screenWidth - 48);
  const modalH = 172;
  const modalX = (screenWidth - modalW) / 2;
  const modalY = (screenHeight - modalH) / 2;

  const drawBackdrop = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, screenWidth, screenHeight);
    g.fill({ color: 0x000000, alpha: 0.6 });
  }, [screenWidth, screenHeight]);

  const drawModal = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: 0x1e293b });
    g.roundRect(0, 0, modalW, modalH, 14);
    g.fill();
    g.setStrokeStyle({ width: 2, color: 0x475569, alpha: 0.8 });
    g.roundRect(0, 0, modalW, modalH, 14);
    g.stroke();
  }, [modalW, modalH]);

  return (
    <pixiContainer>
      <pixiGraphics
        draw={drawBackdrop}
        eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()}
      />
      <pixiContainer x={modalX} y={modalY}>
        <pixiGraphics draw={drawModal} />
        <pixiText
          text={isConfirming ? 'Processing purchase...' : purchase.label}
          x={modalW / 2}
          y={24}
          anchor={0.5}
          style={CONFIRM_TITLE_STYLE}
          eventMode="none"
        />
        <pixiText
          text={isConfirming ? 'Please confirm in wallet' : 'Confirm this permanent upgrade'}
          x={modalW / 2}
          y={42}
          anchor={0.5}
          style={CONFIRM_SUB_STYLE}
          eventMode="none"
        />
        <pixiText
          text={`Cost: ${purchase.cost} 🧊`}
          x={modalW / 2}
          y={64}
          anchor={0.5}
          style={CONFIRM_COST_STYLE}
          eventMode="none"
        />
        <pixiText
          text={`Balance: ${cubeBalance} → ${cubeBalance - purchase.cost}`}
          x={modalW / 2}
          y={88}
          anchor={0.5}
          style={CONFIRM_BALANCE_STYLE}
          eventMode="none"
        />
        <Button
          text={isConfirming ? 'Processing...' : 'Confirm'}
          x={16}
          y={116}
          width={(modalW - 48) / 2}
          height={44}
          variant="primary"
          fontSize={14}
          onClick={onConfirm}
          disabled={isConfirming}
        />
        <Button
          text="Cancel"
          x={modalW / 2 + 8}
          y={116}
          width={(modalW - 48) / 2}
          height={44}
          variant="secondary"
          fontSize={14}
          onClick={onCancel}
          disabled={isConfirming}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

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
  const isDragging = useRef(false);
  const lastY = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const [pending, setPending] = useState<PendingPurchase | null>(null);
  const [isConfirmingPurchase, setIsConfirmingPurchase] = useState(false);

  const contentPadding = 16;
  const contentTop = topBarHeight + contentPadding;
  const contentMaxWidth = 720;
  const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth);
  const contentX = Math.max(contentPadding, (screenWidth - contentWidth) / 2);
  const cardW = (contentWidth - 12) / 2;
  const cardH = 156;
  const cardGap = 12;

  const totalRows = 3;
  const totalHeight = totalRows * (cardH + cardGap);
  const listHeight = screenHeight - contentTop - contentPadding;
  const maxScroll = Math.max(0, totalHeight - listHeight);

  const drawScrollHitArea = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, contentWidth, listHeight);
    g.fill({ color: 0xffffff, alpha: 0.001 });
  }, [contentWidth, listHeight]);

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
    velocityRef.current = 0;
    lastMoveTimeRef.current = performance.now();
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const dy = lastY.current - e.data.global.y;
      lastY.current = e.data.global.y;
      const now = performance.now();
      const dt = Math.max(now - lastMoveTimeRef.current, 1);
      lastMoveTimeRef.current = now;

      const instantaneousVelocity = dy / (dt / 16.67);
      velocityRef.current = velocityRef.current * 0.6 + instantaneousVelocity * 0.4;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev)));
  }, [maxScroll]);

  useTick((ticker) => {
    if (isDragging.current) return;
    if (Math.abs(velocityRef.current) < 0.05) {
      velocityRef.current = 0;
      return;
    }

    const frameScale = ticker.deltaMS / 16.67;
    const nextVelocity = velocityRef.current * Math.pow(0.92, frameScale);
    const delta = velocityRef.current * frameScale;

    setScrollY((prev) => {
      const next = Math.max(0, Math.min(maxScroll, prev + delta));
      if (next === 0 || next === maxScroll) {
        velocityRef.current = 0;
      }
      return next;
    });

    velocityRef.current = nextVelocity;
  });

  const requestPurchase = useCallback((label: string, cost: number, action: () => Promise<void> | void) => {
    setPending({ label, cost, action });
  }, []);

  const confirmPurchase = useCallback(async () => {
    if (!pending || isConfirmingPurchase) return;

    setIsConfirmingPurchase(true);
    try {
      await pending.action();
      setPending(null);
    } catch {
      // keep modal open so user can retry/cancel after on-screen error feedback
    } finally {
      setIsConfirmingPurchase(false);
    }
  }, [isConfirmingPurchase, pending]);

  const startingCombo = playerMeta?.startingCombo ?? 0;
  const startingHarvest = playerMeta?.startingHarvest ?? 0;
  const startingScore = playerMeta?.startingScore ?? 0;
  const startingWave = playerMeta?.startingWave ?? 0;
  const startingSupply = playerMeta?.startingSupply ?? 0;

  const bagCombo = playerMeta?.bagComboLevel ?? 0;
  const bagHarvest = playerMeta?.bagHarvestLevel ?? 0;
  const bagScore = playerMeta?.bagScoreLevel ?? 0;
  const bagWave = playerMeta?.bagWaveLevel ?? 0;
  const bagSupply = playerMeta?.bagSupplyLevel ?? 0;

  const bridgingRank = playerMeta?.bridgingRank ?? 0;
  const waveUnlocked = playerMeta?.waveUnlocked ?? false;
  const supplyUnlocked = playerMeta?.supplyUnlocked ?? false;

  const startingCosts = STARTING_BONUS_COSTS;
  const bagCosts = BAG_SIZE_COSTS;
  const bridgeCosts = BRIDGING_COSTS;

  return (
    <pixiContainer>
      <PageTopBar
        title="Shop"
        subtitle={`${cubeBalance} cubes available`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      <pixiContainer x={contentX} y={contentTop}>
        {!isConnected || !playerMeta ? (
          <pixiContainer>
            <pixiText
              text="🛒"
              x={contentWidth / 2}
              y={60}
              anchor={0.5}
              style={EMPTY_ICON_STYLE}
              eventMode="none"
            />
            <pixiText
              text={isConnected ? "Loading shop..." : "Connect to view shop"}
              x={contentWidth / 2}
              y={110}
              anchor={0.5}
              style={EMPTY_TITLE_STYLE}
              eventMode="none"
            />
            <pixiText
              text={isConnected ? "Fetching your upgrades" : "Log in to upgrade bonuses and abilities"}
              x={contentWidth / 2}
              y={138}
              anchor={0.5}
              style={EMPTY_SUB_STYLE}
              eventMode="none"
            />
          </pixiContainer>
        ) : (
        <pixiContainer
          eventMode="static"
          onPointerDown={handlePointerDown}
          onGlobalPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerUpOutside={handlePointerUp}
        >
          <pixiGraphics draw={drawScrollHitArea} />

          <pixiContainer y={-scrollY}>
            <UpgradeCard
              title="Combo"
              icon="🔥"
              startingLevel={startingCombo}
              bagLevel={bagCombo}
              isUnlocked={true}
              x={0}
              y={0}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => requestPurchase('Upgrade Combo Starting', startingCosts[startingCombo] ?? 0, () => onUpgradeStartingBonus?.(1))}
              onUpgradeBag={() => requestPurchase('Upgrade Combo Bag', bagCosts[bagCombo] ?? 0, () => onUpgradeBagSize?.(1))}
            />
            <UpgradeCard
              title="Harvest"
              icon="🌾"
              startingLevel={startingHarvest}
              bagLevel={bagHarvest}
              isUnlocked={true}
              x={cardW + cardGap}
              y={0}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => requestPurchase('Upgrade Harvest Starting', startingCosts[startingHarvest] ?? 0, () => onUpgradeStartingBonus?.(3))}
              onUpgradeBag={() => requestPurchase('Upgrade Harvest Bag', bagCosts[bagHarvest] ?? 0, () => onUpgradeBagSize?.(3))}
            />

            <UpgradeCard
              title="Score"
              icon="⭐"
              startingLevel={startingScore}
              bagLevel={bagScore}
              isUnlocked={true}
              x={0}
              y={cardH + cardGap}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => requestPurchase('Upgrade Score Starting', startingCosts[startingScore] ?? 0, () => onUpgradeStartingBonus?.(2))}
              onUpgradeBag={() => requestPurchase('Upgrade Score Bag', bagCosts[bagScore] ?? 0, () => onUpgradeBagSize?.(2))}
            />
            <UpgradeCard
              title="Wave"
              icon="🌊"
              startingLevel={startingWave}
              bagLevel={bagWave}
              isUnlocked={waveUnlocked}
              x={cardW + cardGap}
              y={cardH + cardGap}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => requestPurchase('Upgrade Wave Starting', startingCosts[startingWave] ?? 0, () => onUpgradeStartingBonus?.(4))}
              onUpgradeBag={() => requestPurchase('Upgrade Wave Bag', bagCosts[bagWave] ?? 0, () => onUpgradeBagSize?.(4))}
              onUnlock={() => requestPurchase('Unlock Wave', UNLOCK_BONUS_COST, () => onUnlockBonus?.(4))}
            />

            <UpgradeCard
              title="Supply"
              icon="📦"
              startingLevel={startingSupply}
              bagLevel={bagSupply}
              isUnlocked={supplyUnlocked}
              x={0}
              y={(cardH + cardGap) * 2}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgradeStarting={() => requestPurchase('Upgrade Supply Starting', startingCosts[startingSupply] ?? 0, () => onUpgradeStartingBonus?.(5))}
              onUpgradeBag={() => requestPurchase('Upgrade Supply Bag', bagCosts[bagSupply] ?? 0, () => onUpgradeBagSize?.(5))}
              onUnlock={() => requestPurchase('Unlock Supply', UNLOCK_BONUS_COST, () => onUnlockBonus?.(5))}
            />
            <BridgingCard
              rank={bridgingRank}
              x={cardW + cardGap}
              y={(cardH + cardGap) * 2}
              width={cardW}
              height={cardH}
              cubeBalance={cubeBalance}
              onUpgrade={() => requestPurchase('Upgrade Bridging', bridgeCosts[bridgingRank] ?? 0, () => onUpgradeBridging?.())}
            />
          </pixiContainer>
        </pixiContainer>
        )}
      </pixiContainer>

      {pending && (
        <ConfirmOverlay
          purchase={pending}
          cubeBalance={cubeBalance}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          onConfirm={confirmPurchase}
          onCancel={() => {
            if (!isConfirmingPurchase) {
              setPending(null);
            }
          }}
          isConfirming={isConfirmingPurchase}
        />
      )}
    </pixiContainer>
  );
};

export default ShopPage;
