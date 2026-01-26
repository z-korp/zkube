import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { Surrender } from "../actions/Surrender";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMediaQuery } from "react-responsive";
import GameOverDialog from "../components/GameOverDialog";
import LevelCompleteDialog from "../components/LevelCompleteDialog";
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
  hammer: number;
  wave: number;
  totem: number;
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
  const imgAssets = ImageAssets(themeTemplate);
  const gameGrid = useRef<HTMLDivElement>(null);
  const [isGameOn, setIsGameOn] = useState<"idle" | "isOn" | "isOver">("idle");
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isLevelCompleteOpen, setIsLevelCompleteOpen] = useState(false);
  const [levelCompletionData, setLevelCompletionData] = useState<LevelCompletionData | null>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  // Store complete previous game state for level completion detection
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    levelMoves: number;
    constraintProgress: number;
    bonusUsedThisLevel: boolean;
    hammer: number;
    wave: number;
    totem: number;
  } | null>(null);
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
      gameCreationAttemptedRef.current = true;
      const createGame = async () => {
        try {
          await create({ account, token_id: gameId });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          // If the game already started, it means Torii hasn't synced yet
          // Don't reset the flag - just wait for sync
          if (errorMessage.includes("already started")) {
            return;
          }
          console.error("Failed to create game:", error);
          // Reset the flag on other errors so user can retry
          gameCreationAttemptedRef.current = false;
        }
      };
      createGame();
    }
  }, [isGameLoading, game, account, create, gameId]);

  // Reset the creation flag when gameId changes
  useEffect(() => {
    gameCreationAttemptedRef.current = false;
  }, [gameId]);

  // Show connect dialog when there's no account
  useEffect(() => {
    if (!account) {
      setIsConnectDialogOpen(true);
    } else {
      setIsConnectDialogOpen(false);
    }
  }, [account]);

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
        setIsGameOverOpen(true);
      }
    }
    // Update the ref with the current value of game.over
    prevGameOverRef.current = game?.over;
  }, [game?.over]);

  // Detect level completion by tracking previous game state
  // We store the ENTIRE previous state and compare when things change
  useEffect(() => {
    if (!game) return;

    const prevState = prevGameStateRef.current;
    const currentLevel = game.level;

    // If we have a previous state and level increased, show completion dialog
    if (prevState && currentLevel > prevState.level && !game.over) {
      // Use the PREVIOUS state's stats (captured before the level changed)
      setLevelCompletionData({
        level: prevState.level,
        levelScore: prevState.levelScore,
        levelMoves: prevState.levelMoves,
        constraintProgress: prevState.constraintProgress,
        bonusUsedThisLevel: prevState.bonusUsedThisLevel,
        prevHammer: prevState.hammer,
        prevWave: prevState.wave,
        prevTotem: prevState.totem,
        hammer: game.hammer,
        wave: game.wave,
        totem: game.totem,
      });
      setIsLevelCompleteOpen(true);
    }

    // Always store current state for next comparison
    // This captures the state BEFORE any level transition
    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      levelMoves: game.levelMoves,
      constraintProgress: game.constraintProgress,
      bonusUsedThisLevel: game.bonusUsedThisLevel,
      hammer: game.hammer,
      wave: game.wave,
      totem: game.totem,
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
    game?.over,
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

                  {/* Level Complete Dialog */}
                  {levelCompletionData && (
                    <LevelCompleteDialog
                      isOpen={isLevelCompleteOpen}
                      onClose={() => {
                        setIsLevelCompleteOpen(false);
                        setLevelCompletionData(null);
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
                      hammer={levelCompletionData.hammer}
                      wave={levelCompletionData.wave}
                      totem={levelCompletionData.totem}
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
                    isGameOn === "isOn" &&
                    !isGridLoading &&
                    !isGameLoading && (
                    <div className="relative w-full">
                      <div
                        ref={gameGrid}
                        className="flex flex-col items-center game-container"
                      >
                        <GameBoard
                          // Check if game is over because otherwise we can display
                          // previous game data on the board while the new game is starting
                          // and torii indexing
                          initialGrid={grid}
                          nextLine={game.isOver() ? [] : game.next_row}
                          score={game.isOver() ? 0 : game.score}
                          combo={game.isOver() ? 0 : game.combo}
                          maxCombo={game.isOver() ? 0 : game.max_combo}
                          hammerCount={game.isOver() ? 0 : game.hammer}
                          totemCount={game.isOver() ? 0 : game.totem}
                          waveCount={game.isOver() ? 0 : game.wave}
                          account={account}
                          game={game}
                          seed={seed}
                        />
                      </div>
                      {isMdOrLarger && (
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
