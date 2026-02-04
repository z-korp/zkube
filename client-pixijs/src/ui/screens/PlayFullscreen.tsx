import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import useAccountCustom from "@/hooks/useAccountCustom";
import GameOverDialog from "../components/GameOverDialog";
import VictoryDialog from "../components/VictoryDialog";
import LevelCompleteDialog from "../components/LevelCompleteDialog";
import { LoadoutDialog, InGameShopDialog, PendingLevelUpDialog, ShopDialog } from "../components/Shop";
import { QuestsDialog } from "../components/Quest";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import useViewport from "@/hooks/useViewport";
import { useGrid } from "@/hooks/useGrid";
import { useParams, Navigate } from "react-router-dom";
import { useDojo } from "@/dojo/useDojo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import Connect from "../components/Connect";
import { isInGameShopAvailable, getBonusInventoryCount } from "@/dojo/game/helpers/runDataPacking";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { FullscreenGame } from "@/pixi/components/game";
import type { BonusSlotData } from "@/pixi/components/game";
import type { ConstraintData } from "@/pixi/components/hud";
import { Bonus, BonusType, bonusTypeFromContractValue } from "@/dojo/game/types/bonus";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { useGameLevel } from "@/hooks/useGameLevel";
import { useGameStateMachine } from "@/pixi/hooks/useGameStateMachine";
import { useKeyboardShortcuts } from "@/pixi/hooks/useKeyboardShortcuts";
import { transformDataContractIntoBlock } from "@/utils/gridUtils";
import type { Block } from "@/types/types";
import { Account } from "starknet";

// Type for storing level completion data
interface LevelCompletionData {
  level: number;
  levelScore: number;
  levelMoves: number;
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

export const PlayFullscreen = () => {
  useViewport();

  const {
    setup: {
      systemCalls: { create, applyBonus, surrender },
    },
  } = useDojo();
  const { gameId: gameIdParam } = useParams<{ gameId: string }>();
  const { account } = useAccountCustom();
  const { connector } = useAccount();
  const { cubeBalance } = useCubeBalance();

  const ROWS = 10;
  const COLS = 8;

  // If no gameId is provided, default to 0
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 0;

  const { game, seed } = useGame({
    gameId: gameId,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });
  const gameLevel = useGameLevel({ gameId: game?.id ?? 0 });
  const [animationDone, setAnimationDone] = useState(false);

  // Add loading state with 5000ms delay
  const [isGameLoading, setIsGameLoading] = useState(true);

  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  // Bonus state (local to this component)
  const [bonus, setBonus] = useState<BonusType>(BonusType.None);
  const [bonusDescription, setBonusDescription] = useState("");
  
  // Optimistic data
  const [optimisticScore, setOptimisticScore] = useState(0);
  const [optimisticCombo, setOptimisticCombo] = useState(0);
  const [optimisticMaxCombo, setOptimisticMaxCombo] = useState(0);
  const [nextLineHasBeenConsumed, setNextLineHasBeenConsumed] = useState(false);
  
  // Dialog states
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isLevelCompleteOpen, setIsLevelCompleteOpen] = useState(false);
  const [isInGameShopOpen, setIsInGameShopOpen] = useState(false);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isPendingLevelUpOpen, setIsPendingLevelUpOpen] = useState(false);
  const [openShopAfterLevelUp, setOpenShopAfterLevelUp] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  const { playerMeta } = usePlayerMeta();
  const [levelCompletionData, setLevelCompletionData] = useState<LevelCompletionData | null>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    levelMoves: number;
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

  // Transform grid data for state machine
  const initialBlocks = useMemo(() => {
    return transformDataContractIntoBlock(grid || []);
  }, [grid]);

  const nextLineBlocks = useMemo(() => {
    if (!game || game.isOver()) return [];
    return transformDataContractIntoBlock([game.next_row]);
  }, [game]);

  // Use state machine for game logic (only when game exists)
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

  // Handle game loading with 5000ms delay
  useEffect(() => {
    setIsGameLoading(true);
    const timer = setTimeout(() => {
      setIsGameLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [gameId]);

  // Stop loading early if game AND seed are found
  useEffect(() => {
    if (game && seed !== 0n) {
      setIsGameLoading(false);
    }
  }, [game, seed]);

  useEffect(() => {
    const gameExists = game !== null && game !== undefined;
    const gameHasBlocks = gameExists && game.blocksRaw !== 0n;
    const gameNotStarted = !gameExists || game.blocksRaw === 0n;

    if (gameHasBlocks) {
      return;
    }

    if (
      !isGameLoading &&
      gameNotStarted &&
      account &&
      !gameCreationAttemptedRef.current
    ) {
      if (!isLoadoutOpen) {
        setIsLoadoutOpen(true);
      }
    }
  }, [isGameLoading, game, account, gameId, isLoadoutOpen]);

  useEffect(() => {
    gameCreationAttemptedRef.current = false;
  }, [gameId]);

  const handleLoadoutConfirm = async (selectedBonuses: number[], cubesToBring: number) => {
    if (!account) return;
    gameCreationAttemptedRef.current = true;
    try {
      await create({
        account,
        token_id: gameId,
        selected_bonuses: selectedBonuses,
        cubes_amount: cubesToBring,
      });
      setIsLoadoutOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("already started")) {
        return;
      }
      console.error("Failed to create game:", error);
      gameCreationAttemptedRef.current = false;
    }
  };

  const handleLoadoutClose = (open: boolean) => {
    if (!open) {
      handleLoadoutConfirm([1, 3, 2], 0);
    }
  };

  const handlePendingLevelUpClose = () => {
    setIsPendingLevelUpOpen(false);
    if (openShopAfterLevelUp && game && game.cubesAvailable > 0) {
      setIsInGameShopOpen(true);
    }
    setOpenShopAfterLevelUp(false);
  };

  // Show connect dialog when there's no account
  useEffect(() => {
    if (!account) {
      setIsConnectDialogOpen(true);
    } else {
      setIsConnectDialogOpen(false);
    }
  }, [account]);

  useEffect(() => {
    if (
      game?.pendingLevelUp &&
      !isPendingLevelUpOpen &&
      !isLevelCompleteOpen &&
      !isInGameShopOpen
    ) {
      setIsPendingLevelUpOpen(true);
    }
  }, [game?.pendingLevelUp, isPendingLevelUpOpen, isLevelCompleteOpen, isInGameShopOpen]);

  const isGridLoading =
    !!game && !game.isOver() && (!grid || grid.length === 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        if (game.runCompleted) {
          setIsVictoryOpen(true);
        } else {
          setIsGameOverOpen(true);
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
        levelMoves: prevState.levelMoves,
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
      setIsLevelCompleteOpen(true);
      levelStartTotalScoreRef.current = game.totalScore;
    }

    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      levelMoves: game.levelMoves,
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
    game?.level,
    game?.levelScore,
    game?.levelMoves,
    game?.constraintProgress,
    game?.bonusUsedThisLevel,
    game?.hammer,
    game?.wave,
    game?.totem,
    game?.shrink,
    game?.shuffle,
    game?.over,
    game?.totalCubes,
    game?.totalScore,
    game,
  ]);

  // Reset bonus when grid changes
  useEffect(() => {
    setBonus(BonusType.None);
    setBonusDescription("");
  }, [grid]);

  // Bonus helpers
  const getBonusIcon = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return imgAssets.hammer;
      case BonusType.Wave:
        return imgAssets.wave;
      case BonusType.Totem:
        return imgAssets.tiki;
      case BonusType.Shrink:
        return imgAssets.shrink;
      case BonusType.Shuffle:
        return imgAssets.shuffle;
      default:
        return "";
    }
  }, [imgAssets]);

  const getBonusTooltip = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return "Destroy a block and connected same-size blocks";
      case BonusType.Wave:
        return "Destroy an entire horizontal line";
      case BonusType.Totem:
        return "Destroy all blocks of the same size";
      case BonusType.Shrink:
        return "Shrink a block by one size";
      case BonusType.Shuffle:
        return "Shuffle a row of blocks";
      default:
        return "";
    }
  }, []);

  const getBonusDescription = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Wave:
        return "Select the line you want to destroy";
      case BonusType.Totem:
        return "Select the block type you want to destroy";
      case BonusType.Hammer:
        return "Select the block you want to destroy";
      case BonusType.Shrink:
        return "Select the block you want to shrink";
      case BonusType.Shuffle:
        return "Select a row to shuffle";
      default:
        return "";
    }
  }, []);

  const handleBonusSelect = useCallback((type: BonusType, count: number) => {
    if (count === 0) return;
    if (bonus === type) {
      setBonus(BonusType.None);
      setBonusDescription("");
    } else {
      setBonus(type);
      setBonusDescription(getBonusDescription(type));
    }
  }, [bonus, getBonusDescription]);

  // Open Cartridge Controller profile at trophies tab
  const handleTrophyClick = useCallback(() => {
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile("trophies");
    }
  }, [connector]);

  // Handle surrender (called from PixiJS MenuModal)
  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    await surrender({
      account: account as Account,
      game_id: game.id,
    });
  }, [account, game, surrender]);

  const handleBonusTx = useCallback(
    async (bonusType: BonusType, rowIndex: number, colIndex: number) => {
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
        console.error("Bonus apply error:", error);
      }
    },
    [account, applyBonus, game]
  );

  const handleBonusApply = useCallback(
    async (block: Block) => {
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
      setBonusDescription("");
    },
    [bonus, handleBonusTx]
  );

  // Build bonus slots
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

  // Build constraint data
  const constraint1: ConstraintData | undefined = useMemo(() => {
    if (!gameLevel || gameLevel.constraintType === ConstraintType.None) {
      return undefined;
    }
    return {
      type: gameLevel.constraintType,
      value: gameLevel.constraintValue,
      count: gameLevel.constraintCount,
      progress: game?.constraintProgress ?? 0,
      bonusUsed: game?.bonusUsedThisLevel ?? false,
    };
  }, [gameLevel, game?.constraintProgress, game?.bonusUsedThisLevel]);

  const constraint2: ConstraintData | undefined = useMemo(() => {
    if (!gameLevel || gameLevel.constraint2Type === ConstraintType.None) {
      return undefined;
    }
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
    if (gameLevel) {
      return gameLevel.pointsRequired;
    }
    return 20 + (game?.level ?? 1) * 5;
  }, [gameLevel, game?.level]);

  const maxMoves = gameLevel?.maxMoves ?? 30;
  const movesRemaining = Math.max(0, maxMoves - (game?.levelMoves ?? 0));

  const stars = useMemo(() => {
    return calculateStarRating(optimisticScore, targetScore);
  }, [optimisticScore, targetScore]);

  // Check if any dialog is open (disable shortcuts when dialogs are open)
  // Note: Menu modal is now handled in PixiJS, so we don't track isMenuOpen here
  const isAnyDialogOpen = isQuestsOpen || isShopOpen || 
    isGameOverOpen || isVictoryOpen || isLevelCompleteOpen || isInGameShopOpen || 
    isLoadoutOpen || isPendingLevelUpOpen || isConnectDialogOpen;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onBonus1: () => {
      if (bonusSlots[0]) {
        handleBonusSelect(bonusSlots[0].bonusType, bonusSlots[0].count);
      }
    },
    onBonus2: () => {
      if (bonusSlots[1]) {
        handleBonusSelect(bonusSlots[1].bonusType, bonusSlots[1].count);
      }
    },
    onBonus3: () => {
      if (bonusSlots[2]) {
        handleBonusSelect(bonusSlots[2].bonusType, bonusSlots[2].count);
      }
    },
    onMenu: () => setIsMenuOpen(true),
    onCancel: () => {
      setBonus(BonusType.None);
      setBonusDescription("");
    },
    enabled: !isAnyDialogOpen && !isGameLoading && !isGridLoading && !!game,
    isBonusSelected: bonus !== BonusType.None,
  });

  // Redirect if no gameId
  if (!gameIdParam) {
    return <Navigate to="/" replace />;
  }

  // Show loading screen
  if (isGameLoading || isGridLoading || !game || blocks.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-24 w-24 flex items-center justify-center">
            <img
              src={imgAssets.loader}
              alt="Loading cube"
              className="h-16 w-16 animate-bounce drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
            />
          </div>
          <p className="text-lg font-semibold uppercase tracking-[0.25em] text-slate-100">
            {isGameLoading ? "Preparing game" : "Loading grid"}
          </p>
          <p className="text-sm text-slate-300">
            Hang tight, the blocks are assembling.
          </p>
        </div>

        {/* Connect Dialog */}
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect for playing your game</DialogTitle>
              <DialogDescription>
                You need to connect your wallet to start playing the game.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-4">
              <Connect />
            </div>
          </DialogContent>
        </Dialog>

        {/* Loadout Dialog */}
        <LoadoutDialog
          isOpen={isLoadoutOpen}
          onClose={handleLoadoutClose}
          onConfirm={handleLoadoutConfirm}
          playerMetaData={playerMeta?.data ?? null}
          cubeBalance={Number(cubeBalance)}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0" id="portal-root">
      {/* Fullscreen PixiJS Game Canvas */}
      <FullscreenGame
        blocks={blocks}
        nextLine={nextLineBlocks}
        nextLineConsumed={nextLineHasBeenConsumed}
        level={game.level}
        levelScore={optimisticScore}
        targetScore={targetScore}
        moves={movesRemaining}
        maxMoves={maxMoves}
        constraint1={constraint1}
        constraint2={constraint2}
        combo={optimisticCombo}
        maxCombo={optimisticMaxCombo}
        stars={stars}
        bonusSlots={bonusSlots}
        selectedBonus={bonus}
        cubeBalance={Number(cubeBalance)}
        totalCubes={game.totalCubes}
        isTxProcessing={isTxProcessing}
        isPlayerInDanger={isPlayerInDanger}
        onMove={handleMove}
        onBonusApply={handleBonusApply}
        onQuestsClick={() => setIsQuestsOpen(true)}
        onTrophyClick={handleTrophyClick}
        onShopClick={() => setIsShopOpen(true)}
        onSurrender={handleSurrender}
      />

      {/* Bonus description overlay */}
      {bonus !== BonusType.None && (
        <div className="fixed inset-x-0 top-1/3 flex justify-center pointer-events-none z-50">
          <div className="text-yellow-500 px-4 py-2 rounded-lg font-bold text-lg bg-black/80 whitespace-nowrap">
            {bonusDescription}
          </div>
        </div>
      )}

      {/* All React Dialogs (rendered on top of canvas) */}
      
      {/* Connect Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect for playing your game</DialogTitle>
            <DialogDescription>
              You need to connect your wallet to start playing the game.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Connect />
          </div>
        </DialogContent>
      </Dialog>

      {/* Game Over Dialog */}
      <GameOverDialog
        isOpen={isGameOverOpen}
        onClose={() => setIsGameOverOpen(false)}
        game={game}
      />

      {/* Victory Dialog */}
      <VictoryDialog
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        game={game}
      />

      {/* Loadout Dialog */}
      <LoadoutDialog
        isOpen={isLoadoutOpen}
        onClose={handleLoadoutClose}
        onConfirm={handleLoadoutConfirm}
        playerMetaData={playerMeta?.data ?? null}
        cubeBalance={Number(cubeBalance)}
      />

      {/* Level Complete Dialog */}
      {levelCompletionData && (
        <LevelCompleteDialog
          isOpen={isLevelCompleteOpen}
          onClose={() => {
            setIsLevelCompleteOpen(false);
            const completedLevel = levelCompletionData.level;
            const hasCubesToSpend = game && game.cubesAvailable > 0;
            const shopAvailable = isInGameShopAvailable(completedLevel);
            const shouldOpenShop = !!shopAvailable && !!hasCubesToSpend;

            if (game?.pendingLevelUp) {
              setOpenShopAfterLevelUp(shouldOpenShop);
              setIsPendingLevelUpOpen(true);
              setLevelCompletionData(null);
              return;
            }

            if (shouldOpenShop) {
              setIsInGameShopOpen(true);
            } else {
              setLevelCompletionData(null);
            }
          }}
          level={levelCompletionData.level}
          levelScore={levelCompletionData.levelScore}
          levelMoves={levelCompletionData.levelMoves}
          seed={seed}
          constraintProgress={levelCompletionData.constraintProgress}
          bonusUsedThisLevel={levelCompletionData.bonusUsedThisLevel}
          prevHammer={levelCompletionData.prevHammer}
          prevWave={levelCompletionData.prevWave}
          prevTotem={levelCompletionData.prevTotem}
          prevShrink={levelCompletionData.prevShrink}
          prevShuffle={levelCompletionData.prevShuffle}
          hammer={levelCompletionData.hammer}
          wave={levelCompletionData.wave}
          totem={levelCompletionData.totem}
          shrink={levelCompletionData.shrink}
          shuffle={levelCompletionData.shuffle}
          prevTotalCubes={levelCompletionData.prevTotalCubes}
          totalCubes={levelCompletionData.totalCubes}
          prevTotalScore={levelCompletionData.prevTotalScore}
          totalScore={levelCompletionData.totalScore}
        />
      )}

      {/* In-Game Shop Dialog */}
      <InGameShopDialog
        isOpen={isInGameShopOpen}
        onClose={() => {
          setIsInGameShopOpen(false);
          setLevelCompletionData(null);
        }}
        gameId={game.id}
        runData={game.runData}
        bagSizes={playerMeta?.data ? {
          hammer: 1 + playerMeta.data.bagHammerLevel,
          wave: 1 + playerMeta.data.bagWaveLevel,
          totem: 1 + playerMeta.data.bagTotemLevel,
          shrink: 1 + playerMeta.data.bagShrinkLevel,
          shuffle: 1 + playerMeta.data.bagShuffleLevel,
        } : undefined}
      />

      {/* Pending Level Up Dialog */}
      <PendingLevelUpDialog
        isOpen={isPendingLevelUpOpen}
        onClose={handlePendingLevelUpClose}
        gameId={game.id}
        runData={game.runData}
      />

      {/* Menu is now handled in PixiJS - see MenuModal in FullscreenGame */}

      {/* Quests Dialog */}
      <QuestsDialog 
        isOpen={isQuestsOpen} 
        onClose={() => setIsQuestsOpen(false)} 
      />

      {/* Shop Dialog (Permanent Shop) */}
      <ShopDialog 
        isOpen={isShopOpen} 
        onClose={() => setIsShopOpen(false)} 
      />

      {/* Palm tree animations */}
      <AnimatePresence>
        {!animationDone && (
          <>
            <PalmTree
              image={imgAssets.palmRight}
              initial="visibleRight"
              animate="hiddenRight"
              duration={3}
              position="right"
            />
            <PalmTree
              image={imgAssets.palmLeft}
              initial="visibleLeft"
              animate="hiddenLeft"
              duration={3}
              position="left"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlayFullscreen;
