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
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import { resolveAssetUrl } from '@/pixi/assets/resolver';
import { AssetId } from '@/pixi/assets/catalog';
import type { ThemeId } from '@/pixi/utils/colors';
import type { Block } from '@/types/types';
import type { InGameShopBonusItem } from '@/pixi/components/modals';
import { useMusicPlayer } from '@/contexts/hooks';
import { showToast } from '@/utils/toast';

// Type for storing level completion data
interface LevelCompletionData {
  level: number;
  levelScore: number;
  constraintProgress: number;
  constraint2Progress: number;
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
  const themeId = themeTemplate as ThemeId;
  const { setIsMenu, playStart, playOver } = useMusicPlayer();

  useEffect(() => {
    setIsMenu(false);
    return () => setIsMenu(true);
  }, [setIsMenu]);

  const hadAccountRef = useRef(!!account);
  useEffect(() => {
    if (hadAccountRef.current && !account) {
      showToast({ message: 'Wallet disconnected. Returning to home.', type: 'error', toastId: 'wallet-disconnect' });
      navigate('/');
    }
    hadAccountRef.current = !!account;
  }, [account, navigate]);

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
    constraint2Progress: number;
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
    gameId: game?.id ?? 0,
    account,
    score: game?.levelScore ?? 0,
    combo: game?.combo ?? 0,
    maxCombo: game?.maxComboRun ?? 0,
    setOptimisticScore,
    setOptimisticCombo,
    setOptimisticMaxCombo,
    setNextLineHasBeenConsumed,
  });

  // Handle game loading — wait for data from Torii, with a generous timeout
  const syncStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    setIsGameLoading(true);
    syncStartTimeRef.current = Date.now();
  }, [gameId]);

  useEffect(() => {
    if (game && game.blocksRaw !== 0n && seed !== 0n) {
      setIsGameLoading(false);
    }
  }, [game, seed]);

  // Only redirect if game truly doesn't exist after a generous sync window (20s)
  useEffect(() => {
    const gameReady = game && game.blocksRaw !== 0n;
    if (gameReady) return;

    // Poll every second to check if we've exceeded the sync timeout
    const interval = setInterval(() => {
      const elapsed = Date.now() - syncStartTimeRef.current;
      if (elapsed > 20_000 && !gameCreationAttemptedRef.current) {
        setIsGameLoading(false);
        navigate('/');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game, navigate]);

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
        constraint2Progress: prevState.constraint2Progress,
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
      constraint2Progress: game.constraint2Progress,
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
    game?.level, game?.levelScore, game?.constraintProgress, game?.constraint2Progress, game?.bonusUsedThisLevel,
    game?.hammer, game?.wave, game?.totem, game?.shrink, game?.shuffle,
    game?.over, game?.totalCubes, game?.totalScore, game,
  ]);

  useEffect(() => {
    if (game) {
      setOptimisticScore(game.levelScore);
      setOptimisticCombo(game.combo);
      setOptimisticMaxCombo(game.maxComboRun);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally sync only on level transitions
  }, [game?.level]);

  // Reset bonus when grid changes
  useEffect(() => {
    setBonus(BonusType.None);
    setBonusDescription('');
  }, [grid]);

  // Bonus helpers
  const getBonusIcon = useCallback((type: BonusType): string => {
    const assetMap: Partial<Record<BonusType, AssetId>> = {
      [BonusType.Hammer]: AssetId.BonusHammer,
      [BonusType.Wave]: AssetId.BonusWave,
      [BonusType.Totem]: AssetId.BonusTotem,
      [BonusType.Shrink]: AssetId.BonusShrink,
      [BonusType.Shuffle]: AssetId.BonusShuffle,
    };
    const assetId = assetMap[type];
    if (!assetId) return '';
    return resolveAssetUrl(themeId, assetId) ?? '';
  }, [themeId]);

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
      showToast({ message: 'Failed to apply bonus. Try again.', type: 'error', toastId: 'bonus-error' });
    }
  }, [account, applyBonus, game]);

  const handleBonusApply = useCallback(async (block: Block) => {
    if (isTxProcessing) return;
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
  }, [bonus, handleBonusTx, isTxProcessing]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    try {
      await surrender({ account: account as Account, game_id: game.id });
    } catch (error) {
      console.error('Surrender error:', error);
      showToast({ message: 'Surrender failed. Try again.', type: 'error', toastId: 'surrender-error' });
    }
  }, [account, game, surrender]);

  const handleGoHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handlePlayAgain = useCallback(() => {
    navigate('/', { state: { openLoadout: true } });
  }, [navigate]);

  const handleShare = useCallback(async () => {
    const text = `I completed all 50 levels of zKube! Score: ${game?.totalScore ?? 0}, Cubes: ${game?.totalCubes ?? 0}. Play at app.zkube.xyz`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard?.writeText(text);
      showToast({ message: 'Copied to clipboard!', type: 'success', toastId: 'share-copy' });
    }
  }, [game?.totalScore, game?.totalCubes]);

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
      showToast({ message: 'Purchase failed. Try again.', type: 'error', toastId: 'shop-error' });
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
      constraintMet={levelCompletionData ? (
        levelCompletionData.constraintProgress >= (gameLevel?.constraintCount ?? 0) &&
        (!gameLevel?.constraint2Count || levelCompletionData.constraint2Progress >= gameLevel.constraint2Count)
      ) : false}
      // Callbacks
      onMove={handleMove}
      onBonusApply={handleBonusApply}
      onSurrender={handleSurrender}
      onGoHome={handleGoHome}
      onPlayAgain={handlePlayAgain}
      onShare={handleShare}
      onLevelCompleteContinue={handleLevelCompleteContinue}
      onInGameShopClose={handleInGameShopClose}
    />
  );
};

export default PlayNew;
