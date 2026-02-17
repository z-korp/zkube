import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Account } from 'starknet';

import { useGame } from '@/hooks/useGame';
import { useGrid } from '@/hooks/useGrid';
import { useGameLevel } from '@/hooks/useGameLevel';
import { usePlayerMeta } from '@/hooks/usePlayerMeta';
import { useCubeBalance } from '@/hooks/useCubeBalance';
import useAccountCustom from '@/hooks/useAccountCustom';
import { useDojo } from '@/dojo/useDojo';
import { useGameStateMachine } from './useGameStateMachine';
import { transformDataContractIntoBlock } from '@/utils/gridUtils';
import { Bonus, BonusType, bonusTypeFromContractValue } from '@/dojo/game/types/bonus';
import { ConstraintType } from '@/dojo/game/types/constraint';
import {
  getBonusInventoryCount,
  isInGameShopAvailable,
  getBonusChargeCost,
  ConsumableType,
} from '@/dojo/game/helpers/runDataPacking';
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import { resolveAssetUrl } from '@/pixi/assets/resolver';
import { AssetId } from '@/pixi/assets/catalog';
import type { ThemeId } from '@/pixi/utils/colors';
import { getZone } from '@/pixi/utils/mapLayout';
import { getZoneTheme } from '@/pixi/utils/zoneThemes';
import type { Block } from '@/types/types';
import type { ConstraintData } from '@/pixi/components/hud';
import { useMusicPlayer } from '@/contexts/hooks';
import { showToast } from '@/utils/toast';

const ROWS = 10;
const COLS = 8;

function calculateStarRating(score: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = score / target;
  if (ratio >= 1) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.5) return 1;
  return 0;
}

interface LevelCompletionData {
  level: number;
  levelScore: number;
  targetScore: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;
  prevCombo: number;
  prevScore: number;
  prevHarvest: number;
  prevWave: number;
  prevSupply: number;
  combo: number;
  score: number;
  harvest: number;
  wave: number;
  supply: number;
  prevTotalCubes: number;
  totalCubes: number;
  prevTotalScore: number;
  totalScore: number;
}

export interface BonusSlotData {
  type: number;
  bonusType: BonusType;
  level: number;
  count: number;
  icon: string;
  tooltip?: string;
  onClick: () => void;
}

export interface SelectedBonusData {
  slot: number;
  name: string;
  icon: string;
  level: number;
  inventory: number;
  bagSize: number;
  bonusType: BonusType;
  contractValue: number;
}

export interface UnselectedBonusData {
  name: string;
  icon: string;
  contractValue: number;
}

export interface UsePlayGameResult {
  blocks: Block[];
  explodingRows: number[];
  nextLine: Block[];
  nextLineConsumed: boolean;
  level: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves: number;
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  constraint3?: ConstraintData;
  combo: number;
  maxCombo: number;
  stars: number;
  bonusSlots: BonusSlotData[];
  selectedBonus: BonusType;
  bonusDescription: string;
  cubeBalance: number;
  totalCubes: number;
  totalScore: number;
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
  isLoading: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  isLevelComplete: boolean;
  isInGameShopOpen: boolean;
  shopCubesAvailable: number;
  shopUnallocatedCharges: number;
  shopChargeCost: number;
  shopSwapBought: boolean;
  shopLevelUpBought: boolean;
  shopSelectedBonuses: SelectedBonusData[];
  shopUnselectedBonuses: UnselectedBonusData[];
  isShopPurchasing: boolean;
  onBuyCharge: () => Promise<void>;
  onAllocateCharge: (bonusSlot: number) => Promise<void>;
  onLevelUpBonus: (bonusSlot: number) => Promise<void>;
  onSwapBonus: (bonusSlot: number, newBonusType: number) => Promise<void>;
  levelCompleteLevel: number;
  levelCompleteLevelScore: number;
  levelCompleteTargetScore: number;
  levelCompleteStars: number;
  levelCompleteCubes: number;
  levelCompleteBonusAwarded: { type: string; icon: string } | null;
  handleMove: (rowIndex: number, startX: number, finalX: number) => void;
  handleBonusApply: (block: Block) => Promise<void>;
  handleSurrender: () => Promise<void>;
  handleLevelCompleteContinue: () => void;
  handleInGameShopClose: () => void;
  handleShare: () => Promise<void>;
  walletDisconnected: boolean;
  seed: bigint;
  showMapView: boolean;
  handleMapContinue: () => void;
  levelStarsFn?: (level: number) => number;
}

export function usePlayGame(
  gameId: number,
): UsePlayGameResult {
  const { account } = useAccountCustom();
  const { cubeBalance } = useCubeBalance();
  const { playerMeta } = usePlayerMeta();
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;
  const { setMusicContext } = useMusicPlayer();

  const hadAccountRef = useRef(!!account);
  const [walletDisconnected, setWalletDisconnected] = useState(false);
  useEffect(() => {
    if (hadAccountRef.current && !account) {
      showToast({ message: 'Wallet disconnected. Returning to home.', type: 'error', toastId: 'wallet-disconnect' });
      setWalletDisconnected(true);
    }
    hadAccountRef.current = !!account;
  }, [account]);

  const {
    setup: {
      systemCalls: { applyBonus, surrender, purchaseConsumable, allocateCharge, swapBonus },
    },
  } = useDojo();

  const { game, seed } = useGame({ gameId, shouldLog: false });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: false });
  const gameLevel = useGameLevel({ gameId: game?.id ?? 0 });

  useEffect(() => {
    if (seed === 0n) return;
    const level = game?.level ?? 1;
    const isBoss = level % 10 === 0;
    const zone = getZone(level);
    const zoneTheme = getZoneTheme(seed, zone);
    setMusicContext(isBoss ? 'boss' : 'level', zoneTheme);
    return () => setMusicContext('main');
  }, [game?.level, seed, setMusicContext]);
  const targetScore = useMemo(() => {
    if (gameLevel) return gameLevel.pointsRequired;
    return 20 + (game?.level ?? 1) * 5;
  }, [gameLevel, game?.level]);

  const [isGameLoading, setIsGameLoading] = useState(true);
  const [bonus, setBonus] = useState<BonusType>(BonusType.None);
  const [bonusDescription, setBonusDescription] = useState('');
  const [optimisticScore, setOptimisticScore] = useState(0);
  const [optimisticCombo, setOptimisticCombo] = useState(0);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(0);
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [isInGameShopOpen, setIsInGameShopOpen] = useState(false);
  const [isShopPurchasing, setIsShopPurchasing] = useState(false);
  const [levelCompletionData, setLevelCompletionData] = useState<LevelCompletionData | null>(null);
  const [showMapView, setShowMapView] = useState(false);
  const pendingShopRef = useRef(false);

  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    targetScore: number;
    constraintProgress: number;
    constraint2Progress: number;
    constraint3Progress: number;
    bonusUsedThisLevel: boolean;
    comboBonus: number;
    scoreBonus: number;
    harvest: number;
    wave: number;
    supply: number;
    totalCubes: number;
    totalScore: number;
  } | null>(null);
  const levelStartTotalScoreRef = useRef<number>(0);
  const syncStartTimeRef = useRef<number>(Date.now());
  const gameCreationAttemptedRef = useRef<boolean>(false);

  const initialBlocks = useMemo(() => {
    return transformDataContractIntoBlock(grid || []);
  }, [grid]);

  const nextLineBlocks = useMemo(() => {
    if (!game || game.isOver()) return [];
    return transformDataContractIntoBlock([game.next_row]);
  }, [game]);

  const {
    blocks,
    explodingRows,
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

  // Loading
  useEffect(() => {
    setIsGameLoading(true);
    syncStartTimeRef.current = Date.now();
  }, [gameId]);

  useEffect(() => {
    if (game && game.blocksRaw !== 0n && seed !== 0n) {
      setIsGameLoading(false);
    }
  }, [game, seed]);

  useEffect(() => {
    const gameReady = game && game.blocksRaw !== 0n;
    if (gameReady) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - syncStartTimeRef.current;
      if (elapsed > 20_000 && !gameCreationAttemptedRef.current) {
        setIsGameLoading(false);
        showToast({
          message: 'Game sync is taking too long. Returning to home.',
          type: 'error',
          toastId: 'play-sync-timeout',
        });
        setWalletDisconnected(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game]);

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
        targetScore: prevState.targetScore,
        constraintProgress: prevState.constraintProgress,
        constraint2Progress: prevState.constraint2Progress,
        constraint3Progress: prevState.constraint3Progress,
        bonusUsedThisLevel: prevState.bonusUsedThisLevel,
        prevCombo: prevState.comboBonus,
        prevScore: prevState.scoreBonus,
        prevHarvest: prevState.harvest,
        prevWave: prevState.wave,
        prevSupply: prevState.supply,
        combo: game.comboBonus,
        score: game.scoreBonus,
        harvest: game.harvest,
        wave: game.wave,
        supply: game.supply,
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
      targetScore,
      constraintProgress: game.constraintProgress,
      constraint2Progress: game.constraint2Progress,
      constraint3Progress: game.constraint3Progress,
      bonusUsedThisLevel: game.bonusUsedThisLevel,
      comboBonus: game.comboBonus,
      scoreBonus: game.scoreBonus,
      harvest: game.harvest,
      wave: game.wave,
      supply: game.supply,
      totalCubes: game.totalCubes,
      totalScore: game.totalScore,
    };
  }, [
    game?.level, game?.levelScore, game?.constraintProgress, game?.constraint2Progress, game?.constraint3Progress, game?.bonusUsedThisLevel,
    game?.comboBonus, game?.scoreBonus, game?.harvest, game?.wave, game?.supply,
    game?.over, game?.totalCubes, game?.totalScore, game, targetScore,
  ]);

  useEffect(() => {
    if (game) {
      setOptimisticScore(game.levelScore);
      setOptimisticCombo(game.combo);
      setOptimisticMaxCombo(game.maxComboRun);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.level]);

  useEffect(() => {
    setBonus(BonusType.None);
    setBonusDescription('');
  }, [grid]);

  // Bonus helpers
  const getBonusIcon = useCallback((type: BonusType): string => {
    const assetMap: Partial<Record<BonusType, AssetId>> = {
      [BonusType.Combo]: AssetId.BonusCombo,
      [BonusType.Score]: AssetId.BonusScore,
      [BonusType.Harvest]: AssetId.BonusHarvest,
      [BonusType.Wave]: AssetId.BonusWave,
      [BonusType.Supply]: AssetId.BonusSupply,
    };
    const assetId = assetMap[type];
    if (!assetId) return '';
    return resolveAssetUrl(themeId, assetId) ?? '';
  }, [themeId]);

  const getBonusTooltip = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Combo: return 'Add combo to your next move';
      case BonusType.Score: return 'Instantly gain bonus score';
      case BonusType.Harvest: return 'Destroy all blocks of a size, earn CUBEs';
      case BonusType.Wave: return 'Clear entire horizontal rows';
      case BonusType.Supply: return 'Add new lines at no move cost';
      default: return '';
    }
  }, []);

  const getBonusDescription = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Combo: return 'Adds combo to your next move';
      case BonusType.Score: return 'Instantly adds bonus score';
      case BonusType.Harvest: return 'Select a block size to destroy all matching blocks';
      case BonusType.Wave: return 'Select a row to clear';
      case BonusType.Supply: return 'Adds new lines to the grid';
      default: return '';
    }
  }, []);

  const getBonusName = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Combo: return 'Combo';
      case BonusType.Score: return 'Score';
      case BonusType.Harvest: return 'Harvest';
      case BonusType.Wave: return 'Wave';
      case BonusType.Supply: return 'Supply';
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
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'bonus-game-not-ready' });
      return;
    }
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
    if (isTxProcessing) return;
    if (bonus === BonusType.Combo) {
      handleBonusTx(BonusType.Combo, 0, 0);
    } else if (bonus === BonusType.Score) {
      handleBonusTx(BonusType.Score, 0, 0);
    } else if (bonus === BonusType.Harvest) {
      handleBonusTx(BonusType.Harvest, block.y, block.x);
    } else if (bonus === BonusType.Wave) {
      handleBonusTx(BonusType.Wave, block.y, 0);
    } else if (bonus === BonusType.Supply) {
      handleBonusTx(BonusType.Supply, 0, 0);
    }
    setBonus(BonusType.None);
    setBonusDescription('');
  }, [bonus, handleBonusTx, isTxProcessing]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'surrender-game-not-ready' });
      return;
    }
    try {
      await surrender({ account: account as Account, game_id: game.id });
    } catch (error) {
      console.error('Surrender error:', error);
    }
  }, [account, game, surrender]);

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
      case BonusType.Combo: return Math.max(1, meta.bagComboLevel);
      case BonusType.Score: return Math.max(1, meta.bagScoreLevel);
      case BonusType.Harvest: return Math.max(1, meta.bagHarvestLevel);
      case BonusType.Wave: return Math.max(1, meta.bagWaveLevel);
      case BonusType.Supply: return Math.max(1, meta.bagSupplyLevel);
      default: return 1;
    }
  }, [playerMeta]);

  // -- In-game shop handlers --

  const handleBuyCharge = useCallback(async () => {
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'shop-game-not-ready' });
      return;
    }
    setIsShopPurchasing(true);
    try {
      await purchaseConsumable({
        account: account as Account,
        game_id: game.id,
        consumable_type: ConsumableType.BonusCharge,
        bonus_slot: 0,
      });
    } catch (error) {
      console.error('Buy charge failed:', error);
    } finally {
      setIsShopPurchasing(false);
    }
  }, [account, game, purchaseConsumable]);

  const handleAllocateCharge = useCallback(async (bonusSlot: number) => {
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'shop-game-not-ready' });
      return;
    }
    setIsShopPurchasing(true);
    try {
      await allocateCharge({
        account: account as Account,
        game_id: game.id,
        bonus_slot: bonusSlot,
      });
    } catch (error) {
      console.error('Allocate charge failed:', error);
    } finally {
      setIsShopPurchasing(false);
    }
  }, [account, game, allocateCharge]);

  const handleShopLevelUp = useCallback(async (bonusSlot: number) => {
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'shop-game-not-ready' });
      return;
    }
    setIsShopPurchasing(true);
    try {
      await purchaseConsumable({
        account: account as Account,
        game_id: game.id,
        consumable_type: ConsumableType.LevelUp,
        bonus_slot: bonusSlot,
      });
    } catch (error) {
      console.error('Level up failed:', error);
    } finally {
      setIsShopPurchasing(false);
    }
  }, [account, game, purchaseConsumable]);

  const handleSwapBonus = useCallback(async (bonusSlot: number, newBonusType: number) => {
    if (!account || !game) {
      showToast({ message: 'Game is not ready yet. Try again in a moment.', type: 'info', toastId: 'shop-game-not-ready' });
      return;
    }
    setIsShopPurchasing(true);
    try {
      await swapBonus({
        account: account as Account,
        game_id: game.id,
        bonus_slot: bonusSlot,
        new_bonus_type: newBonusType,
      });
    } catch (error) {
      console.error('Swap bonus failed:', error);
    } finally {
      setIsShopPurchasing(false);
    }
  }, [account, game, swapBonus]);

  const getBonusEmoji = useCallback((bonusType: BonusType): string => {
    switch (bonusType) {
      case BonusType.Combo: return '\u26A1';
      case BonusType.Score: return '\uD83C\uDFAF';
      case BonusType.Harvest: return '\uD83C\uDF3E';
      case BonusType.Wave: return '\uD83C\uDF0A';
      case BonusType.Supply: return '\uD83D\uDCE6';
      default: return '';
    }
  }, []);

  // -- Shop computed data --

  const shopSelectedBonuses: SelectedBonusData[] = useMemo(() => {
    if (!game) return [];
    const slots = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level },
    ];
    const selected: SelectedBonusData[] = [];
    for (const item of slots) {
      const bonusType = bonusTypeFromContractValue(item.value);
      if (bonusType === BonusType.None) continue;
      selected.push({
        slot: item.slot,
        name: getBonusName(bonusType),
        icon: getBonusEmoji(bonusType),
        level: item.level + 1,
        inventory: getBonusInventoryCount(game.runData, item.value),
        bagSize: getBagSizeForBonus(bonusType),
        bonusType,
        contractValue: item.value,
      });
    }
    return selected;
  }, [game, getBonusName, getBonusEmoji, getBagSizeForBonus]);

  const shopUnselectedBonuses: UnselectedBonusData[] = useMemo(() => {
    if (!game) return [];
    const selectedValues = new Set([game.selectedBonus1, game.selectedBonus2, game.selectedBonus3]);
    const meta = playerMeta?.data;
    const allBonusValues = [1, 2, 3, 4, 5]; // Combo, Score, Harvest, Wave, Supply
    return allBonusValues
      .filter((v) => {
        if (selectedValues.has(v)) return false;
        // Wave (4) and Supply (5) require unlock
        if (v === 4 && (!meta || !meta.waveUnlocked)) return false;
        if (v === 5 && (!meta || !meta.supplyUnlocked)) return false;
        return true;
      })
      .map((v) => {
        const bonusType = bonusTypeFromContractValue(v);
        return {
          name: getBonusName(bonusType),
          icon: getBonusEmoji(bonusType),
          contractValue: v,
        };
      });
  }, [game, playerMeta, getBonusName, getBonusEmoji]);

  const shopChargeCost = useMemo(() => {
    return game ? getBonusChargeCost(game.shopPurchases) : 5;
  }, [game]);

  const handleInGameShopClose = useCallback(() => {
    if (!isShopPurchasing) setIsInGameShopOpen(false);
  }, [isShopPurchasing]);

  const handleLevelCompleteContinue = useCallback(() => {
    const shouldShowShop = levelCompletionData && isInGameShopAvailable(levelCompletionData.level) && !game?.over;
    pendingShopRef.current = !!shouldShowShop;
    setIsLevelComplete(false);
    setLevelCompletionData(null);
    setShowMapView(true);
  }, [levelCompletionData, game?.over]);

  const handleMapContinue = useCallback(() => {
    setShowMapView(false);
    if (pendingShopRef.current) {
      pendingShopRef.current = false;
      setIsInGameShopOpen(true);
    }
  }, []);

  const bonusSlots: BonusSlotData[] = useMemo(() => {
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

  const constraint3: ConstraintData | undefined = useMemo(() => {
    if (!gameLevel || gameLevel.constraint3Type === ConstraintType.None) return undefined;
    return {
      type: gameLevel.constraint3Type,
      value: gameLevel.constraint3Value,
      count: gameLevel.constraint3Count,
      progress: game?.constraint3Progress ?? 0,
      bonusUsed: game?.bonusUsedThisLevel ?? false,
    };
  }, [gameLevel, game?.constraint3Progress, game?.bonusUsedThisLevel]);

  const maxMoves = gameLevel?.maxMoves ?? 30;
  const movesRemaining = Math.max(0, maxMoves - (game?.levelMoves ?? 0));

  const stars = useMemo(() => calculateStarRating(optimisticScore, targetScore), [optimisticScore, targetScore]);

  const bonusAwarded = useMemo(() => {
    if (!levelCompletionData) return null;
    const { prevCombo, combo, prevScore, score, prevHarvest, harvest, prevWave, wave, prevSupply, supply } = levelCompletionData;
    if (combo > prevCombo) return { type: 'Combo', icon: '\u26A1' };
    if (score > prevScore) return { type: 'Score', icon: '\uD83C\uDFAF' };
    if (harvest > prevHarvest) return { type: 'Harvest', icon: '\uD83C\uDF3E' };
    if (wave > prevWave) return { type: 'Wave', icon: '\uD83C\uDF0A' };
    if (supply > prevSupply) return { type: 'Supply', icon: '\uD83D\uDCE6' };
    return null;
  }, [levelCompletionData]);

  const isGridLoading = !!game && !game.isOver() && (!grid || grid.length === 0);

  return {
    blocks,
    explodingRows,
    nextLine: nextLineBlocks,
    nextLineConsumed: nextLineHasBeenConsumed,
    level: game?.level ?? 1,
    levelScore: optimisticScore,
    targetScore,
    moves: movesRemaining,
    maxMoves,
    constraint1,
    constraint2,
    constraint3,
    combo: optimisticCombo,
    maxCombo: optimisticMaxCombo,
    stars,
    bonusSlots,
    selectedBonus: bonus,
    bonusDescription,
    cubeBalance: Number(cubeBalance),
    totalCubes: game?.totalCubes ?? 0,
    totalScore: game?.totalScore ?? 0,
    isTxProcessing,
    isPlayerInDanger,
    isLoading: isGameLoading || isGridLoading || !game || blocks.length === 0,
    isGameOver,
    isVictory,
    isLevelComplete,
    isInGameShopOpen,
    shopCubesAvailable: game?.cubesAvailable ?? 0,
    shopUnallocatedCharges: game?.unallocatedCharges ?? 0,
    shopChargeCost,
    shopSwapBought: game?.shopSwapBought ?? false,
    shopLevelUpBought: game?.shopLevelUpBought ?? false,
    shopSelectedBonuses,
    shopUnselectedBonuses,
    isShopPurchasing,
    onBuyCharge: handleBuyCharge,
    onAllocateCharge: handleAllocateCharge,
    onLevelUpBonus: handleShopLevelUp,
    onSwapBonus: handleSwapBonus,
    levelCompleteLevel: levelCompletionData?.level ?? 1,
    levelCompleteLevelScore: levelCompletionData?.levelScore ?? 0,
    levelCompleteTargetScore: levelCompletionData?.targetScore ?? 0,
    levelCompleteStars: Math.min(Math.max(levelCompletionData ? levelCompletionData.totalCubes - levelCompletionData.prevTotalCubes : 0, 0), 3),
    levelCompleteCubes: levelCompletionData ? levelCompletionData.totalCubes - levelCompletionData.prevTotalCubes : 0,
    levelCompleteBonusAwarded: bonusAwarded,
    handleMove,
    handleBonusApply,
    handleSurrender,
    handleLevelCompleteContinue,
    handleInGameShopClose,
    handleShare,
    walletDisconnected,
    seed,
    showMapView,
    handleMapContinue,
    levelStarsFn: game ? (level: number) => game.getLevelStars(level) : undefined,
  };
}
