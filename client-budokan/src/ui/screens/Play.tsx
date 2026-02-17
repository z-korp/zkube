import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { Surrender } from "../actions/Surrender";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import GameOverDialog from "../components/GameOverDialog";
import VictoryDialog from "../components/VictoryDialog";
import LevelCompleteDialog from "../components/LevelCompleteDialog";
import { LoadoutDialog, InGameShopDialog, PendingLevelUpDialog } from "../components/Shop";
import useViewport from "@/hooks/useViewport";
import { useGrid } from "@/hooks/useGrid";
import { useParams, Navigate } from "react-router-dom";
import { Header } from "@/ui/containers/Header";
import { useDojo } from "@/dojo/useDojo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import Connect from "../components/Connect";
import { isInGameShopAvailable } from "@/dojo/game/helpers/runDataPacking";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useCubeBalance } from "@/hooks/useCubeBalance";

// Type for storing level completion data
interface LevelCompletionData {
  level: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  prevCombo: number;
  prevScore: number;
  prevHarvest: number;
  prevWave: number;
  prevSupply: number;
  comboBonus: number;
  scoreBonus: number;
  harvest: number;
  wave: number;
  supply: number;
  prevTotalCubes: number;
  totalCubes: number;
  /** Total score before level completion (used to calculate level's final score) */
  prevTotalScore: number;
  /** Total score after level completion */
  totalScore: number;
}

export const Play = () => {
  useViewport();

  const {
    setup: {
      systemCalls: { create },
    },
  } = useDojo();
  const { gameId: gameIdParam } = useParams<{ gameId: string }>();
  const { account } = useAccountCustom();
  const { cubeBalance } = useCubeBalance();

  // Move all hook calls before any conditional returns
  // If no gameId is provided, default to 0
  const gameId = gameIdParam ? parseInt(gameIdParam, 10) : 0;

  const { game, seed } = useGame({
    gameId: gameId,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });
  const [animationDone, setAnimationDone] = useState(false);

  // Add loading state with 1000ms delay
  const [isGameLoading, setIsGameLoading] = useState(true);

  const { theme, themeTemplate } = useTheme();
  const { setMusicContext } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);
  const gameGrid = useRef<HTMLDivElement>(null);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isLevelCompleteOpen, setIsLevelCompleteOpen] = useState(false);
  const [isInGameShopOpen, setIsInGameShopOpen] = useState(false);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isPendingLevelUpOpen, setIsPendingLevelUpOpen] = useState(false);
  const [openShopAfterLevelUp, setOpenShopAfterLevelUp] = useState(false);
  const { playerMeta } = usePlayerMeta();
  const [levelCompletionData, setLevelCompletionData] = useState<LevelCompletionData | null>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  // Store complete previous game state for level completion detection
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    levelMoves: number;
    constraintProgress: number;
    bonusUsedThisLevel: boolean;
    comboBonus: number;
    scoreBonus: number;
    harvest: number;
    wave: number;
    supply: number;
    totalCubes: number;
    totalScore: number;
  } | null>(null);
  // Track the total score at the START of each level (updated only on level change)
  const levelStartTotalScoreRef = useRef<number>(0);
  const gameCreationAttemptedRef = useRef<boolean>(false);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

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
    // Only attempt to create a game if:
    // 1. We're not loading (5000ms has passed or game was found)
    // 2. Game doesn't exist OR exists but hasn't started (blocksRaw === 0)
    // 3. Account is connected
    // 4. We haven't already attempted creation
    const gameExists = game !== null && game !== undefined;
    const gameHasBlocks = gameExists && game.blocksRaw !== 0n;
    const gameNotStarted = !gameExists || game.blocksRaw === 0n;

    // Skip if game already has blocks (already started)
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

  useEffect(() => {
    const level = game?.level ?? 1;
    const isBossLevel = level > 0 && level % 10 === 0;
    setMusicContext(isBossLevel ? "boss" : "level");
  }, [game?.level, setMusicContext]);

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

  useEffect(() => {
    if (game?.over) {
      setIsGameOn("isOver");
    }
  }, [game?.over]);

  useEffect(() => {
    // Check if game is defined and not over
    // the !!game is important to not display the twitter screen
    if (!!game && !game.over) {
      setIsGameOn("isOn");
    } else {
      setIsGameOn("isOver");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.over]);

  const imageTotemTheme =
    theme === "dark" ? imgAssets.imageTotemDark : imgAssets.imageTotemLight;

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
      // Check if game.over transitioned from false to true
      if (!prevGameOverRef.current && game?.over) {
        // Check if this is a victory (level 50 completed) or regular game over
        if (game.runCompleted) {
          setIsVictoryOpen(true);
        } else {
          setIsGameOverOpen(true);
        }
      }
    }
    // Update the ref with the current value of game.over
    prevGameOverRef.current = game?.over;
  }, [game?.over, game?.runCompleted]);

  // Detect level completion by tracking previous game state
  // We store the ENTIRE previous state and compare when things change
  useEffect(() => {
    if (!game) return;

    const prevState = prevGameStateRef.current;
    const currentLevel = game.level;

    // Initialize levelStartTotalScoreRef on first render (level 1 starts at 0)
    if (prevState === null && currentLevel === 1) {
      levelStartTotalScoreRef.current = 0;
    }

    // If we have a previous state and level increased, show completion dialog
    if (prevState && currentLevel > prevState.level && !game.over) {
      // Calculate the score earned on the completed level
      // levelStartTotalScoreRef tracks the total score at the START of the completed level
      const levelScoreEarned = game.totalScore - levelStartTotalScoreRef.current;
      
      console.log("[LevelComplete] Level changed:", prevState.level, "->", currentLevel, 
        "levelStartTotalScore:", levelStartTotalScoreRef.current, 
        "totalScore:", game.totalScore, "levelScoreEarned:", levelScoreEarned,
        "game.cubesAvailable:", game.cubesAvailable, "game.totalCubes:", game.totalCubes);
      
      // Use the PREVIOUS state's stats (captured before the level changed)
      // BUT use calculated level score from total score difference
      setLevelCompletionData({
        level: prevState.level,
        levelScore: prevState.levelScore,
        levelMoves: prevState.levelMoves,
        constraintProgress: prevState.constraintProgress,
        bonusUsedThisLevel: prevState.bonusUsedThisLevel,
        prevCombo: prevState.comboBonus,
        prevScore: prevState.scoreBonus,
        prevHarvest: prevState.harvest,
        prevWave: prevState.wave,
        prevSupply: prevState.supply,
        comboBonus: game.comboBonus,
        scoreBonus: game.scoreBonus,
        harvest: game.harvest,
        wave: game.wave,
        supply: game.supply,
        prevTotalCubes: prevState.totalCubes,
        totalCubes: game.totalCubes,
        prevTotalScore: levelStartTotalScoreRef.current, // Score at START of the completed level
        totalScore: game.totalScore, // Score at END of the completed level
      });
      setIsLevelCompleteOpen(true);
      
      // Update levelStartTotalScoreRef for the new level
      levelStartTotalScoreRef.current = game.totalScore;
    }

    // Always store current state for next comparison
    // This captures the state BEFORE any level transition
    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      levelMoves: game.levelMoves,
      constraintProgress: game.constraintProgress,
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
    game?.level,
    game?.levelScore,
    game?.levelMoves,
    game?.constraintProgress,
    game?.bonusUsedThisLevel,
    game?.comboBonus,
    game?.scoreBonus,
    game?.harvest,
    game?.wave,
    game?.supply,
    game?.over,
    game?.totalCubes,
    game?.totalScore,
    game,
  ]);

  // Optional: Redirect to home if no gameId is provided
  // This conditional return comes AFTER all hook calls
  if (!gameIdParam) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen-viewport flex flex-col w-full" id="portal-root">
      <Header onStartTutorial={() => {}} showTutorial={false} />

      {/* Connect Wallet Dialog */}
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

      {/* Content Area */}
      <div className="flex flex-col flex-1 relative">
        {/* Main Content */}
        <BackGroundBoard imageBackground={imgAssets.imageBackground}>
          <BackGroundBoard
            imageBackground={imageTotemTheme}
            initial={{ scale: 1 }}
            animate={isMdOrLarger ? { scale: [1, 0.995, 1] } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <div className="relative flex flex-col gap-4 sm:gap-8 flex-grow items-center justify-start overflow-auto h-full">
              <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-4xl mt-2 sm:mt-4 p-2 md:p-0 h-full">
                <>
                  {game && (
                    <GameOverDialog
                      isOpen={isGameOverOpen}
                      onClose={() => setIsGameOverOpen(false)}
                      game={game}
                    />
                  )}

                  {/* Victory Dialog (shown when all 50 levels completed) */}
                  {game && (
                    <VictoryDialog
                      isOpen={isVictoryOpen}
                      onClose={() => setIsVictoryOpen(false)}
                      game={game}
                    />
                  )}

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
                        // Check if in-game shop should open (every 5 levels, has cubes to spend)
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
                      prevCombo={levelCompletionData.prevCombo}
                      prevScore={levelCompletionData.prevScore}
                      prevHarvest={levelCompletionData.prevHarvest}
                      prevWave={levelCompletionData.prevWave}
                      prevSupply={levelCompletionData.prevSupply}
                      comboBonus={levelCompletionData.comboBonus}
                      scoreBonus={levelCompletionData.scoreBonus}
                      harvest={levelCompletionData.harvest}
                      wave={levelCompletionData.wave}
                      supply={levelCompletionData.supply}
                      prevTotalCubes={levelCompletionData.prevTotalCubes}
                      totalCubes={levelCompletionData.totalCubes}
                      prevTotalScore={levelCompletionData.prevTotalScore}
                      totalScore={levelCompletionData.totalScore}
                    />
                  )}

                  {/* In-Game Shop Dialog (appears after level 5, 10, 15... or via shop button on level 6, 11, 16...) */}
                  {game && (
                    <InGameShopDialog
                      isOpen={isInGameShopOpen}
                      onClose={() => {
                        setIsInGameShopOpen(false);
                        setLevelCompletionData(null);
                      }}
                      gameId={game.id}
                      runData={game.runData}
                      bagSizes={playerMeta?.data ? {
                        combo: 1 + playerMeta.data.bagComboLevel,
                        score: 1 + playerMeta.data.bagScoreLevel,
                        harvest: 1 + playerMeta.data.bagHarvestLevel,
                        wave: 1 + playerMeta.data.bagWaveLevel,
                        supply: 1 + playerMeta.data.bagSupplyLevel,
                      } : undefined}
                    />
                  )}

                  {/* Pending Level Up Dialog (after boss levels) */}
                  {game && (
                    <PendingLevelUpDialog
                      isOpen={isPendingLevelUpOpen}
                      onClose={handlePendingLevelUpClose}
                      gameId={game.id}
                      runData={game.runData}
                    />
                  )}

                  {(isGameLoading || isGridLoading) && (
                    <div className="flex w-full flex-col items-center justify-center gap-4 py-12">
                      <div className="flex h-24 w-24 items-center justify-center">
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
                  )}

                  {!!game &&
                    (isGameOn === "isOn" || isGameOn === "isOver") &&
                    !isGridLoading &&
                    !isGameLoading && (
                    <div className={`relative w-full ${isGameOn === "isOver" ? "pointer-events-none opacity-50" : ""}`}>
                      <div
                        ref={gameGrid}
                        className="flex flex-col items-center game-container"
                      >
                          <GameBoard
                            initialGrid={grid}
                            nextLine={game.isOver() ? [] : game.next_row}
                            score={game.isOver() ? 0 : game.score}
                            combo={game.isOver() ? 0 : game.combo}
                            maxCombo={game.isOver() ? 0 : game.maxComboRun}
                            account={account}
                            game={game}
                            seed={seed}
                          />
                      </div>
                      {isMdOrLarger && !game.isOver() && (
                        <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                          <Surrender gameId={game.id} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              </div>
            </div>
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
          </BackGroundBoard>
        </BackGroundBoard>
      </div>
    </div>
  );
};
