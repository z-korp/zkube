/**
 * ShopModal - PixiJS modal for permanent upgrades
 * Shows: Starting bonuses, bag sizes, bridging rank, unlock buttons
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Graphics as PixiGraphics, Assets, Texture } from 'pixi.js';
import { Modal, Button } from '../ui';
import type { PlayerMetaData } from '@/hooks/usePlayerMeta';
import { BonusType } from '@/dojo/game/types/bonus';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';
const T = '/assets/theme-1';

// ============================================================================
// CONSTANTS - Costs from client-budokan
// ============================================================================

const STARTING_BONUS_COSTS = [100, 250, 500];
const BAG_SIZE_COSTS = [100, 250, 500];
const BRIDGING_COSTS = [200, 500, 1000];
const UNLOCK_BONUS_COST = 200;

const MAX_CUBES_PER_RANK = [0, 5, 10, 20, 40]; // Bridging rank -> max cubes

// ============================================================================
// TYPES
// ============================================================================

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerMeta: PlayerMetaData | null;
  cubeBalance: number;
  screenWidth: number;
  screenHeight: number;
  // Callbacks for purchases
  onUpgradeStartingBonus?: (bonusType: number) => Promise<void>;
  onUpgradeBagSize?: (bonusType: number) => Promise<void>;
  onUpgradeBridging?: () => Promise<void>;
  onUnlockBonus?: (bonusType: number) => Promise<void>;
}

// ============================================================================
// TEXTURE HOOK
// ============================================================================

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useState(() => {
    if (!path) return;
    Assets.load(path).then(t => setTex(t as Texture)).catch(() => {});
  });
  return tex;
}

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
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    const pipW = 16;
    const pipH = 6;
    const gap = 4;
    for (let i = 0; i < maxLevel; i++) {
      const filled = i < level;
      g.setFillStyle({ color: filled ? color : 0x334155, alpha: filled ? 1 : 0.5 });
      g.roundRect(i * (pipW + gap), 0, pipW, pipH, 2);
      g.fill();
    }
  }, [level, maxLevel, color]);

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
  const drawCard = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: 0x1E293B, alpha: 0.9 });
    g.roundRect(0, 0, width, height, 10);
    g.fill();
    g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
    g.roundRect(0, 0, width, height, 10);
    g.stroke();
    if (!isUnlocked) {
      g.setFillStyle({ color: 0x000000, alpha: 0.5 });
      g.roundRect(0, 0, width, height, 10);
      g.fill();
    }
  }, [width, height, isUnlocked]);

  const nextStartingCost = startingLevel < 3 ? STARTING_BONUS_COSTS[startingLevel] : null;
  const nextBagCost = bagLevel < 3 ? BAG_SIZE_COSTS[bagLevel] : null;
  const canUpgradeStarting = nextStartingCost !== null && cubeBalance >= nextStartingCost;
  const canUpgradeBag = nextBagCost !== null && cubeBalance >= nextBagCost;
  const canUnlock = !isUnlocked && cubeBalance >= UNLOCK_BONUS_COST;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />
      
      {/* Icon & Title */}
      <pixiText text={icon} x={12} y={12}
        style={{ fontSize: 24 }} />
      <pixiText text={title} x={44} y={14}
        style={{ fontFamily: FONT, fontSize: 14, fill: isUnlocked ? 0xFFFFFF : 0x64748B }} />
      
      {isUnlocked ? (
        <>
          {/* Starting Level */}
          <pixiText text="Starting" x={12} y={42}
            style={{ fontFamily: 'Arial', fontSize: 9, fill: 0x94A3B8 }} />
          <LevelPips level={startingLevel} maxLevel={3} x={12} y={54} color={0x60A5FA} />
          {nextStartingCost && onUpgradeStarting && (
            <pixiContainer x={width - 60} y={44}>
              <Button
                text={`${nextStartingCost}`}
                width={48}
                height={22}
                variant={canUpgradeStarting ? "primary" : "secondary"}
                fontSize={10}
                onClick={onUpgradeStarting}
                disabled={!canUpgradeStarting}
              />
            </pixiContainer>
          )}
          
          {/* Bag Level */}
          <pixiText text="Bag Size" x={12} y={70}
            style={{ fontFamily: 'Arial', fontSize: 9, fill: 0x94A3B8 }} />
          <LevelPips level={bagLevel} maxLevel={3} x={12} y={82} color={0x22C55E} />
          {nextBagCost && onUpgradeBag && (
            <pixiContainer x={width - 60} y={72}>
              <Button
                text={`${nextBagCost}`}
                width={48}
                height={22}
                variant={canUpgradeBag ? "primary" : "secondary"}
                fontSize={10}
                onClick={onUpgradeBag}
                disabled={!canUpgradeBag}
              />
            </pixiContainer>
          )}
        </>
      ) : (
        /* Unlock Button */
        <pixiContainer x={(width - 80) / 2} y={50}>
          <Button
            text={`Unlock ${UNLOCK_BONUS_COST}`}
            width={80}
            height={28}
            variant={canUnlock ? "primary" : "secondary"}
            fontSize={11}
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
  const drawCard = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: 0x1E293B, alpha: 0.9 });
    g.roundRect(0, 0, width, height, 10);
    g.fill();
    g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
    g.roundRect(0, 0, width, height, 10);
    g.stroke();
  }, [width, height]);

  const nextCost = rank < 4 ? BRIDGING_COSTS[rank] : null;
  const canUpgrade = nextCost !== null && cubeBalance >= nextCost;
  const maxCubes = MAX_CUBES_PER_RANK[rank] || 0;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawCard} />
      
      <pixiText text="🌉" x={12} y={12}
        style={{ fontSize: 24 }} />
      <pixiText text="Bridging" x={44} y={14}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF }} />
      
      <pixiText text={`Rank ${rank}`} x={12} y={42}
        style={{ fontFamily: 'Arial', fontSize: 10, fill: 0x94A3B8 }} />
      <pixiText text={`Max ${maxCubes} cubes`} x={12} y={56}
        style={{ fontFamily: FONT, fontSize: 12, fill: 0xFBBF24 }} />
      
      <LevelPips level={rank} maxLevel={4} x={12} y={76} color={0xFBBF24} />
      
      {nextCost && onUpgrade && (
        <pixiContainer x={width - 60} y={55}>
          <Button
            text={`${nextCost}`}
            width={48}
            height={24}
            variant={canUpgrade ? "primary" : "secondary"}
            fontSize={10}
            onClick={onUpgrade}
            disabled={!canUpgrade}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SHOP MODAL
// ============================================================================

export const ShopModal = ({
  isOpen,
  onClose,
  playerMeta,
  cubeBalance,
  screenWidth,
  screenHeight,
  onUpgradeStartingBonus,
  onUpgradeBagSize,
  onUpgradeBridging,
  onUnlockBonus,
}: ShopModalProps) => {
  const modalW = Math.min(380, screenWidth - 40);
  const contentW = modalW - 48;
  const cardW = (contentW - 12) / 2;
  const cardH = 100;

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shop"
      subtitle={`${cubeBalance} 🧊 available`}
      width={modalW}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      <pixiContainer x={24} y={0}>
        {/* Row 1: Hammer, Wave */}
        <UpgradeCard
          title="Hammer" icon="🔨"
          startingLevel={startingHammer} bagLevel={bagHammer}
          isUnlocked={true}
          x={0} y={0} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgradeStarting={() => onUpgradeStartingBonus?.(1)}
          onUpgradeBag={() => onUpgradeBagSize?.(1)}
        />
        <UpgradeCard
          title="Wave" icon="🌊"
          startingLevel={startingWave} bagLevel={bagWave}
          isUnlocked={true}
          x={cardW + 12} y={0} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgradeStarting={() => onUpgradeStartingBonus?.(3)}
          onUpgradeBag={() => onUpgradeBagSize?.(3)}
        />
        
        {/* Row 2: Totem, Shrink */}
        <UpgradeCard
          title="Totem" icon="🗿"
          startingLevel={startingTotem} bagLevel={bagTotem}
          isUnlocked={true}
          x={0} y={cardH + 8} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgradeStarting={() => onUpgradeStartingBonus?.(2)}
          onUpgradeBag={() => onUpgradeBagSize?.(2)}
        />
        <UpgradeCard
          title="Shrink" icon="🔻"
          startingLevel={startingShrink} bagLevel={bagShrink}
          isUnlocked={shrinkUnlocked}
          x={cardW + 12} y={cardH + 8} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgradeStarting={() => onUpgradeStartingBonus?.(4)}
          onUpgradeBag={() => onUpgradeBagSize?.(4)}
          onUnlock={() => onUnlockBonus?.(4)}
        />
        
        {/* Row 3: Shuffle, Bridging */}
        <UpgradeCard
          title="Shuffle" icon="🔀"
          startingLevel={startingShuffle} bagLevel={bagShuffle}
          isUnlocked={shuffleUnlocked}
          x={0} y={(cardH + 8) * 2} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgradeStarting={() => onUpgradeStartingBonus?.(5)}
          onUpgradeBag={() => onUpgradeBagSize?.(5)}
          onUnlock={() => onUnlockBonus?.(5)}
        />
        <BridgingCard
          rank={bridgingRank}
          x={cardW + 12} y={(cardH + 8) * 2} width={cardW} height={cardH}
          cubeBalance={cubeBalance}
          onUpgrade={onUpgradeBridging}
        />

        {/* Close Button */}
        <Button
          text="Close"
          x={0}
          y={(cardH + 8) * 3 + 16}
          width={contentW}
          height={44}
          variant="secondary"
          fontSize={16}
          onClick={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default ShopModal;
