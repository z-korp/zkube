/**
 * PlayNew - New 100% PixiJS play screen
 * 
 * Uses the new PlayScreen component that matches the landing page visual style.
 * All game logic from PlayFullscreen, but with PixiJS modals instead of HTML.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Account } from 'starknet';
import { useAccount } from '@starknet-react/core';
import ControllerConnector from '@cartridge/connector/controller';

import { PlayScreen, type PlayBonusSlotData } from '@/pixi/components/pages';
import type { ConstraintData } from '@/pixi/components/hud';
import { useGame } from '@/hooks/useGame';
import { useGrid } from '@/hooks/useGrid';
import { useGameLevel } from '@/hooks/useGameLevel';
import { usePlayerMeta } from '@/hooks/usePlayerMeta';
import { useCubeBalance } from '@/hooks/useCubeBalance';
import useAccountCustom from '@/hooks/useAccountCustom';
import { useDojo } from '@/dojo/useDojo';
import { useGameStateMachine } from '@/pixi/hooks/useGameStateMachine';
import { transformDataContractIntoBlock } from '@/utils/gridUtils';
import { Bonus, BonusType, bonusTypeFromContractValue } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import {
  getBonusInventoryCount,
  isInGameShopAvailable,
  getRefillCost,
  CONSUMABLE_COSTS,
  ConsumableType,
} from '@/dojo/game/helpers/runDataPacking';
import ImageAssets from '@/ui/theme/ImageAssets';
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import type { Block } from '@/types/types';
import type { InGameShopBonusItem } from '@/pixi/components/modals';

// Type for storing level completion data
interface LevelCompletionData {
  level: number;
  levelScore: number;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  prevHammer: number;
  prevWave: number;
  prevTotem: number;
  prevShrink: number;
  prevShuffle: number;
  hammer: number;
  wave: number;
  totem: number;
  shrink: number;
  shuffle: number;
  prevTotalCubes: number;
  totalCubes: number;
  prevTotalScore: number;
  totalScore: number;
}

function calculateStarRating(score: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = score / target;
  if (ratio >= 1) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

export const PlayNew = () => {
  const navigate = useNavigate();
  const { gameId: gameIdParam } = useParams<{ gameId: string }>();
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { cubeBalance } = useCubeBalance();
  const { playerMeta } = usePlayerMeta();
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const {
    setup: {
      systemCalls: { applyBonus, surrender, purchaseConsumable },
    },
  } = useDojo();

  const ROWS = 10;
  const COLS = 8;

  // If no gameId is provided, default to 0
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 0;

  const { game, seed } = useGame({ gameId, shouldLog: false });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: false });
  const gameLevel = useGameLevel({ gameId: game?.id ?? 0 });

  // Loading states
  const [isGameLoading, setIsGameLoading] = useState(true);

  // Bonus state
  const [bonus, setBonus] = useState<BonusType>(BonusType.None);
  const [bonusDescription, setBonusDescription] = useState('');

  // Optimistic data
  const [optimisticScore, setOptimisticScore] = useState(0);
  const [optimisticCombo, setOptimisticCombo] = useState(0);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(0);
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);

  // Dialog states (now controlled by PlayScreen)
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isInGameShopOpen, setIsInGameShopOpen] = useState(false);
  const [isShopPurchasing, setIsShopPurchasing] = useState(false);

  // Level completion data
  const [levelCompletionData, setLevelCompletionData] = useState<LevelCompletionData | null>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    constraintProgress: number;
    bonusUsedThisLevel: boolean;
    hammer: number;
    wave: number;
    totem: number;
    shrink: number;
    shuffle: number;
    totalCubes: number;
    totalScore: number;
  } | null>(null);
  const levelStartTotalScoreRef = useRef<number>(0);
  const gameCreationAttemptedRef = useRef<boolean>(false);

  // Transform grid data
  const initialBlocks = useMemo(() => {
    return transformDataContractIntoBlock(grid || []);
  }, [grid]);

  const nextLineBlocks = useMemo(() => {
    if (!game || game.isOver()) return [];
    return transformDataContractIntoBlock([game.next_row]);
  }, [game]);

  // Use state machine for game logic
  const {
    blocks,
    isTxProcessing,
    isPlayerInDanger,
    handleMove,
  } = useGameStateMachine({
    initialBlocks,
    nextLineBlocks,
    gridWidth: COLS,
    gridHeight: ROWS,
    game: game!,
    account,
    score: game?.levelScore ?? 0,
    combo: game?.combo ?? 0,
    maxCombo: game?.maxComboRun ?? 0,
    setOptimisticScore,
    setOptimisticCombo,
    setOptimisticMaxCombo,
    setNextLineHasBeenConsumed,
  });

  // Handle game loading
  useEffect(() => {
    setIsGameLoading(true);
    const timer = setTimeout(() => setIsGameLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [gameId]);

  useEffect(() => {
    if (game && seed !== 0n) {
      setIsGameLoading(false);
    }
  }, [game, seed]);

  // Auto-open loadout if game not started
  useEffect(() => {
    const gameExists = game !== null && game !== undefined;
    const gameHasBlocks = gameExists && game.blocksRaw !== 0n;
    const gameNotStarted = !gameExists || game.blocksRaw === 0n;

    if (gameHasBlocks) return;

    if (!isGameLoading && gameNotStarted && account && !gameCreationAttemptedRef.current) {
      // Navigate back to home to show loadout
      navigate('/');
    }
  }, [isGameLoading, game, account, navigate]);

  useEffect(() => {
    gameCreationAttemptedRef.current = false;
  }, [gameId]);

  // Detect game over
  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        if (game.runCompleted) {
          setIsVictory(true);
        } else {
          setIsGameOver(true);
        }
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game?.over, game?.runCompleted]);

  // Detect level completion
  useEffect(() => {
    if (!game) return;

    const prevState = prevGameStateRef.current;
    const currentLevel = game.level;

    if (prevState === null && currentLevel === 1) {
      levelStartTotalScoreRef.current = 0;
    }

    if (prevState && currentLevel > prevState.level && !game.over) {
      setLevelCompletionData({
        level: prevState.level,
        levelScore: prevState.levelScore,
        constraintProgress: prevState.constraintProgress,
        bonusUsedThisLevel: prevState.bonusUsedThisLevel,
        prevHammer: prevState.hammer,
        prevWave: prevState.wave,
        prevTotem: prevState.totem,
        prevShrink: prevState.shrink,
        prevShuffle: prevState.shuffle,
        hammer: game.hammer,
        wave: game.wave,
        totem: game.totem,
        shrink: game.shrink,
        shuffle: game.shuffle,
        prevTotalCubes: prevState.totalCubes,
        totalCubes: game.totalCubes,
        prevTotalScore: levelStartTotalScoreRef.current,
        totalScore: game.totalScore,
      });
      setIsLevelComplete(true);
      levelStartTotalScoreRef.current = game.totalScore;
    }

    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      constraintProgress: game.constraintProgress,
      bonusUsedThisLevel: game.bonusUsedThisLevel,
      hammer: game.hammer,
      wave: game.wave,
      totem: game.totem,
      shrink: game.shrink,
      shuffle: game.shuffle,
      totalCubes: game.totalCubes,
      totalScore: game.totalScore,
    };
  }, [
    game?.level, game?.levelScore, game?.constraintProgress, game?.bonusUsedThisLevel,
    game?.hammer, game?.wave, game?.totem, game?.shrink, game?.shuffle,
    game?.over, game?.totalCubes, game?.totalScore, game,
  ]);

  // Reset bonus when grid changes
  useEffect(() => {
    setBonus(BonusType.None);
    setBonusDescription('');
  }, [grid]);

  // Bonus helpers
  const getBonusIcon = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer: return imgAssets.hammer;
      case BonusType.Wave: return imgAssets.wave;
      case BonusType.Totem: return imgAssets.tiki;
      case BonusType.Shrink: return imgAssets.shrink;
      case BonusType.Shuffle: return imgAssets.shuffle;
      default: return '';
    }
  }, [imgAssets]);

  const getBonusTooltip = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer: return 'Destroy connected same-size blocks';
      case BonusType.Wave: return 'Destroy an entire line';
      case BonusType.Totem: return 'Destroy all same-size blocks';
      case BonusType.Shrink: return 'Shrink a block by one size';
      case BonusType.Shuffle: return 'Shuffle a row';
      default: return '';
    }
  }, []);

  const getBonusDescription = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Wave: return 'Select the line to destroy';
      case BonusType.Totem: return 'Select a block type to destroy';
      case BonusType.Hammer: return 'Select a block to destroy';
      case BonusType.Shrink: return 'Select a block to shrink';
      case BonusType.Shuffle: return 'Select a row to shuffle';
      default: return '';
    }
  }, []);

  const getBonusName = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer: return 'Hammer';
      case BonusType.Wave: return 'Wave';
      case BonusType.Totem: return 'Totem';
      case BonusType.Shrink: return 'Shrink';
      case BonusType.Shuffle: return 'Shuffle';
      default: return 'Bonus';
    }
  }, []);

  const handleBonusSelect = useCallback((type: BonusType, count: number) => {
    if (count === 0) return;
    if (bonus === type) {
      setBonus(BonusType.None);
      setBonusDescription('');
    } else {
      setBonus(type);
      setBonusDescription(getBonusDescription(type));
    }
  }, [bonus, getBonusDescription]);

  const handleBonusTx = useCallback(async (bonusType: BonusType, rowIndex: number, colIndex: number) => {
    if (!account || !game) return;
    try {
      await applyBonus({
        account: account as Account,
        game_id: game.id,
        bonus: new Bonus(bonusType).into(),
        row_index: ROWS - rowIndex - 1,
        block_index: colIndex,
      });
    } catch (error) {
      console.error('Bonus apply error:', error);
    }
  }, [account, applyBonus, game]);

  const handleBonusApply = useCallback(async (block: Block) => {
    if (bonus === BonusType.Wave) {
      handleBonusTx(BonusType.Wave, block.y, 0);
    } else if (bonus === BonusType.Totem) {
      handleBonusTx(BonusType.Totem, block.y, block.x);
    } else if (bonus === BonusType.Hammer) {
      handleBonusTx(BonusType.Hammer, block.y, block.x);
    } else if (bonus === BonusType.Shrink) {
      handleBonusTx(BonusType.Shrink, block.y, block.x);
    } else if (bonus === BonusType.Shuffle) {
      handleBonusTx(BonusType.Shuffle, block.y, block.x);
    }
    setBonus(BonusType.None);
    setBonusDescription('');
  }, [bonus, handleBonusTx]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    await surrender({ account: account as Account, game_id: game.id });
  }, [account, game, surrender]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const getBagSizeForBonus = useCallback((bonusType: BonusType): number => {
    const meta = playerMeta?.data;
    if (!meta) return 1;

    switch (bonusType) {
      case BonusType.Hammer: return Math.max(1, meta.bagHammerLevel);
      case BonusType.Wave: return Math.max(1, meta.bagWaveLevel);
      case BonusType.Totem: return Math.max(1, meta.bagTotemLevel);
      case BonusType.Shrink: return Math.max(1, meta.bagShrinkLevel);
      case BonusType.Shuffle: return Math.max(1, meta.bagShuffleLevel);
      default: return 1;
    }
  }, [playerMeta]);

  const handleShopPurchase = useCallback(async (consumableType: number, bonusSlot: number) => {
    if (!account || !game) return;

    setIsShopPurchasing(true);
    try {
      await purchaseConsumable({
        account: account as Account,
        game_id: game.id,
        consumable_type: consumableType,
        bonus_slot: bonusSlot,
      });
    } catch (error) {
      console.error('In-game shop purchase failed:', error);
    } finally {
      setIsShopPurchasing(false);
    }
  }, [account, game, purchaseConsumable]);

  const shopItems: InGameShopBonusItem[] = useMemo(() => {
    if (!game) return [];

    const selected = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level, bought: game.shopBonus1Bought, consumableType: ConsumableType.Bonus1 },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level, bought: game.shopBonus2Bought, consumableType: ConsumableType.Bonus2 },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level, bought: game.shopBonus3Bought, consumableType: ConsumableType.Bonus3 },
    ];

    const cubesAvailable = game.cubesAvailable;
    const refillCost = getRefillCost(game.shopRefills);

    return selected
      .map((item) => {
        const bonusType = bonusTypeFromContractValue(item.value);
        if (bonusType === BonusType.None) return null;

        const bagSize = getBagSizeForBonus(bonusType);
        const inventory = getBonusInventoryCount(game.runData, item.value);
        const isFull = inventory >= bagSize;

        const primaryCost = item.bought ? refillCost : CONSUMABLE_COSTS.BONUS;
        const canPrimary = cubesAvailable >= primaryCost && !isFull;
        const isMaxLevel = item.level >= 2;
        const canLevelUp = cubesAvailable >= CONSUMABLE_COSTS.LEVEL_UP && !isMaxLevel;

        return {
          slot: item.slot,
          name: getBonusName(bonusType),
          icon: bonusType === BonusType.Hammer
            ? '🔨'
            : bonusType === BonusType.Wave
              ? '🌊'
              : bonusType === BonusType.Totem
                ? '🗿'
                : bonusType === BonusType.Shrink
                  ? '🔻'
                  : '🔀',
          inventory,
          bagSize,
          level: item.level + 1,
          bought: item.bought,
          isFull,
          primaryCost,
          canPrimary,
          canLevelUp,
          isMaxLevel,
          onPrimary: () => handleShopPurchase(item.bought ? ConsumableType.Refill : item.consumableType, item.slot),
          onLevelUp: () => handleShopPurchase(ConsumableType.LevelUp, item.slot),
        } satisfies InGameShopBonusItem;
      })
      .filter((item): item is InGameShopBonusItem => item !== null);
  }, [game, getBagSizeForBonus, getBonusName, handleShopPurchase]);

  const handleInGameShopClose = useCallback(() => {
    if (!isShopPurchasing) {
      setIsInGameShopOpen(false);
    }
  }, [isShopPurchasing]);

  const handleLevelCompleteContinue = useCallback(() => {
    if (
      levelCompletionData &&
      isInGameShopAvailable(levelCompletionData.level) &&
      !game?.over
    ) {
      setIsLevelComplete(false);
      setLevelCompletionData(null);
      setIsInGameShopOpen(true);
      return;
    }

    setIsLevelComplete(false);
    setLevelCompletionData(null);
  }, [levelCompletionData, game?.over]);

  // Build bonus slots
  const bonusSlots: PlayBonusSlotData[] = useMemo(() => {
    if (!game) return [];
    
    const slots = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level },
    ];

    return slots.map((slot) => {
      const bonusType = bonusTypeFromContractValue(slot.value);
      const count = getBonusInventoryCount(game.runData, slot.value);
      return {
        type: slot.value,
        bonusType,
        level: slot.level,
        count,
        icon: getBonusIcon(bonusType),
        tooltip: getBonusTooltip(bonusType),
        onClick: () => handleBonusSelect(bonusType, count),
      };
    });
  }, [game, getBonusIcon, getBonusTooltip, handleBonusSelect]);

  // Build constraint data
  const constraint1: ConstraintData | undefined = useMemo(() => {
    if (!gameLevel || gameLevel.constraintType === ConstraintType.None) return undefined;
    return {
      type: gameLevel.constraintType,
      value: gameLevel.constraintValue,
      count: gameLevel.constraintCount,
      progress: game?.constraintProgress ?? 0,
      bonusUsed: game?.bonusUsedThisLevel ?? false,
    };
  }, [gameLevel, game?.constraintProgress, game?.bonusUsedThisLevel]);

  const constraint2: ConstraintData | undefined = useMemo(() => {
    if (!gameLevel || gameLevel.constraint2Type === ConstraintType.None) return undefined;
    return {
      type: gameLevel.constraint2Type,
      value: gameLevel.constraint2Value,
      count: gameLevel.constraint2Count,
      progress: game?.constraint2Progress ?? 0,
      bonusUsed: game?.bonusUsedThisLevel ?? false,
    };
  }, [gameLevel, game?.constraint2Progress, game?.bonusUsedThisLevel]);

  // Calculate target score and stars
  const targetScore = useMemo(() => {
    if (gameLevel) return gameLevel.pointsRequired;
    return 20 + (game?.level ?? 1) * 5;
  }, [gameLevel, game?.level]);

  const maxMoves = gameLevel?.maxMoves ?? 30;
  const movesRemaining = Math.max(0, maxMoves - (game?.levelMoves ?? 0));

  const stars = useMemo(() => {
    return calculateStarRating(optimisticScore, targetScore);
  }, [optimisticScore, targetScore]);

  // Determine bonus awarded (simplified - just show if any bonus count increased)
  const bonusAwarded = useMemo(() => {
    if (!levelCompletionData) return null;
    const { prevHammer, hammer, prevWave, wave, prevTotem, totem, prevShrink, shrink, prevShuffle, shuffle } = levelCompletionData;
    if (hammer > prevHammer) return { type: 'Hammer', icon: '\u{1F528}' };
    if (wave > prevWave) return { type: 'Wave', icon: '\u{1F30A}' };
    if (totem > prevTotem) return { type: 'Totem', icon: '\u{1F5FF}' };
    if (shrink > prevShrink) return { type: 'Shrink', icon: '\u{1F53B}' };
    if (shuffle > prevShuffle) return { type: 'Shuffle', icon: '\u{1F500}' };
    return null;
  }, [levelCompletionData]);

  // Redirect if no gameId
  if (!gameIdParam) {
    return <Navigate to="/" replace />;
  }

  const isGridLoading = !!game && !game.isOver() && (!grid || grid.length === 0);

  return (
    <PlayScreen
      // Grid data
      blocks={blocks}
      nextLine={nextLineBlocks}
      nextLineConsumed={nextLineHasBeenConsumed}
      // Level info
      level={game?.level ?? 1}
      levelScore={optimisticScore}
      targetScore={targetScore}
      moves={movesRemaining}
      maxMoves={maxMoves}
      // Constraints
      constraint1={constraint1}
      constraint2={constraint2}
      // Combo and stars
      combo={optimisticCombo}
      maxCombo={optimisticMaxCombo}
      stars={stars}
      // Bonus system
      bonusSlots={bonusSlots}
      selectedBonus={bonus}
      bonusDescription={bonusDescription}
      // Player info
      cubeBalance={Number(cubeBalance)}
      totalCubes={game?.totalCubes ?? 0}
      totalScore={game?.totalScore ?? 0}
      // State
      isTxProcessing={isTxProcessing}
      isPlayerInDanger={isPlayerInDanger}
      isLoading={isGameLoading || isGridLoading || !game || blocks.length === 0}
      // Game state
      isGameOver={isGameOver}
      isVictory={isVictory}
      isLevelComplete={isLevelComplete}
      isInGameShopOpen={isInGameShopOpen}
      shopCubesAvailable={game?.cubesAvailable ?? 0}
      shopItems={shopItems}
      isShopPurchasing={isShopPurchasing}
      // Level complete data
      levelCompleteCubes={levelCompletionData ? levelCompletionData.totalCubes - levelCompletionData.prevTotalCubes : 0}
      levelCompleteBonusAwarded={bonusAwarded}
      constraintMet={levelCompletionData ? levelCompletionData.constraintProgress >= (gameLevel?.constraintCount ?? 0) : false}
      // Callbacks
      onMove={handleMove}
      onBonusApply={handleBonusApply}
      onSurrender={handleSurrender}
      onGoHome={handleGoHome}
      onLevelCompleteContinue={handleLevelCompleteContinue}
      onInGameShopClose={handleInGameShopClose}
    />
  );
};

export default PlayNew;
