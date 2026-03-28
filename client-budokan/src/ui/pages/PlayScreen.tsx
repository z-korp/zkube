import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ChevronLeft, Settings, Volume2, VolumeX, Flag } from "lucide-react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useGame } from "@/hooks/useGame";
import { useGrid } from "@/hooks/useGrid";
import { useGameLevel, type GameLevelData } from "@/hooks/useGameLevel";
import useAccountCustom from "@/hooks/useAccountCustom";
import useViewport from "@/hooks/useViewport";
import { useDojo } from "@/dojo/useDojo";
import { isBossLevel as checkBossLevel } from "@/dojo/game/helpers/runDataPacking";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import GameHud from "@/ui/components/hud/GameHud";
import GameBoard from "@/ui/components/GameBoard";
import GameOverDialog from "@/ui/components/GameOverDialog";
import VictoryDialog from "@/ui/components/VictoryDialog";
import Connect from "@/ui/components/Connect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { Slider } from "@/ui/elements/slider";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { type ThemeId } from "@/config/themes";

const PlayScreen: React.FC = () => {
  useViewport();

  const {
    setup: {
      systemCalls: { surrender },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const gameId = useNavigationStore((s) => s.gameId);
  const navNavigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);
  const setPendingLevelCompletion = useNavigationStore(
    (s) => s.setPendingLevelCompletion,
  );
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicContext, setMusicPlaylist, playSfx, musicVolume, effectsVolume, setMusicVolume, setEffectsVolume, isPlaying, playTheme, stopTheme } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const { game, seed } = useGame({
    gameId: gameId ?? 0n,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0n, shouldLog: true });
  const gameLevel = useGameLevel({ gameId: game?.id });

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  // Tracks whether the Grid cascade animation has finished for the current move.
  // Level-complete detection is gated on this to prevent checking against a mid-cascade grid.
  const [cascadeComplete, setCascadeComplete] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    levelMoves: number;
    constraintProgress: number;
    totalScore: number;
    gameLevel: GameLevelData | null;
  } | null>(null);
  const levelStartTotalScoreRef = useRef<number>(0);
  const prevBossLevelRef = useRef<number | null>(null);

  useEffect(() => {
    const level = game?.level ?? 1;
    const isBossLevel = checkBossLevel(level);
    const wasBossLevel =
      prevBossLevelRef.current != null ? checkBossLevel(prevBossLevelRef.current) : false;

    if (isBossLevel && prevBossLevelRef.current !== level) {
      playSfx("boss-intro");
    }

    if (isBossLevel) {
      setMusicContext("boss");
    } else if (wasBossLevel && prevBossLevelRef.current !== level) {
      setMusicPlaylist(["main", "level"]);
    }

    prevBossLevelRef.current = level;
  }, [game?.level, playSfx, setMusicContext, setMusicPlaylist]);

  // GameSeed.seed is now stable (never overwritten). level_seed holds per-level VRF.

  const mapThemeId: ThemeId = "theme-1";

  useEffect(() => {
    if (seed === 0n || !game) return;
    setThemeTemplate(mapThemeId);
  }, [seed, game, mapThemeId, setThemeTemplate]);

  useEffect(() => {
    setIsGameLoading(true);
    const timer = setTimeout(() => setIsGameLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [gameId]);

  useEffect(() => {
    if (game && seed !== 0n) setIsGameLoading(false);
  }, [game, seed]);

  useEffect(() => {
    if (!account) setIsConnectDialogOpen(true);
    else setIsConnectDialogOpen(false);
  }, [account]);

  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        if (game.zoneCleared) {
          playSfx("victory");
          setIsVictoryOpen(true);
        } else {
          playSfx("over");
          setIsGameOverOpen(true);
        }
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game?.over, playSfx]);

  // Cascade-complete callback from Grid → GameBoard
  const handleCascadeComplete = useCallback(() => {
    setCascadeComplete(true);
  }, []);

  // Reset cascadeComplete whenever the grid changes (new move started or chain synced)
  useEffect(() => {
    setCascadeComplete(false);
  }, [grid]);

  useEffect(() => {
    if (!game) return;
    const prevState = prevGameStateRef.current;
    const currentLevel = game.level;

    if (prevState === null) {
      levelStartTotalScoreRef.current = game.totalScore - game.levelScore;
    }

    // Gate on cascadeComplete: don't detect level transition until the cascade
    // animation has fully finished. If level changed but cascade isn't done yet,
    // skip this run entirely (don't update prevState) so we re-detect on next run.
    if (prevState && currentLevel > prevState.level && !game.over) {
      if (!cascadeComplete) {
        // Cascade still running — preserve old prevState so we re-detect later
        return;
      }
      if (checkBossLevel(prevState.level)) {
        playSfx("boss-defeat");
      } else {
        playSfx("levelup");
      }
      setPendingLevelCompletion({
        level: prevState.level,
        levelMoves: prevState.levelMoves,
        prevTotalScore: levelStartTotalScoreRef.current,
        totalScore: game.totalScore,
        gameLevel: prevState.gameLevel,
      });
      levelStartTotalScoreRef.current = game.totalScore;

      navNavigate("map");
    }

    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      levelMoves: game.levelMoves,
      constraintProgress: game.constraintProgress,
      totalScore: game.totalScore,
      gameLevel,
    };
  }, [
    game?.level,
    game?.levelScore,
    game?.levelMoves,
    game?.constraintProgress,
    game?.over,
    game?.totalScore,
    game,
    playSfx,
    cascadeComplete,
  ]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    try {
      playSfx("click");
      setIsSettingsOpen(false);
      await surrender({ account, game_id: game.id });
    } catch (error) {
      console.error("Surrender failed:", error);
    }
  }, [account, game, playSfx, surrender]);

  const levelConfig = useMemo(() => {
    if (!game) return null;
    return generateLevelConfig(seed, game.level);
  }, [seed, game?.level, game]);

  const targetScore =
    gameLevel?.pointsRequired ?? levelConfig?.pointsRequired ?? 0;
  const maxMoves = gameLevel?.maxMoves ?? levelConfig?.maxMoves ?? 0;

  const isGridLoading =
    !!game && !game.isOver() && (!grid || grid.length === 0);

  const isGameOn = game && !game.over;

  return (
    <div className="h-screen-viewport flex flex-col">
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>Connect your wallet to play.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Connect />
          </div>
        </DialogContent>
      </Dialog>

      {game && (
        <GameOverDialog
          isOpen={isGameOverOpen}
          onClose={() => {
            setIsGameOverOpen(false);
            navNavigate("home");
          }}
          game={game}
        />
      )}

      {game && (
        <VictoryDialog
          isOpen={isVictoryOpen}
          onClose={() => {
            setIsVictoryOpen(false);
            navNavigate("home");
          }}
          game={game}
        />
      )}

      {/* ---- Top Bar (consistent with other pages) ---- */}
      <div className="flex items-center justify-between px-2 md:px-4 h-12 md:h-13 lg:h-14 bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="font-['Fredericka_the_Great'] text-cyan-200 text-base md:text-lg leading-tight">
            Level {game?.level ?? "..."}
          </span>
          {game && (
            <>
              <span className="text-slate-500 text-sm mx-0.5">·</span>
              <span className="font-['Fredericka_the_Great'] text-amber-200 text-base tabular-nums">
                {game.totalScore}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* ---- Settings Dialog (styled like LevelCompleteDialog) ---- */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8 font-['Fredericka_the_Great']"
        >
          <DialogTitle className="text-2xl text-center mb-4 text-slate-100">
            Settings
          </DialogTitle>

          {/* Sound controls */}
          <div className="space-y-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => (isPlaying ? stopTheme() : playTheme())}
                >
                  {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Music</span>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(value) => setMusicVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Effects</span>
                  <Slider
                    value={[effectsVolume]}
                    onValueChange={(value) => setEffectsVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(effectsVolume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Surrender button */}
          {game && !game.over && (
            <Button
              variant="destructive"
              className="w-full py-3 text-base flex items-center justify-center gap-2"
              onClick={handleSurrender}
            >
              <Flag className="h-4 w-4" />
              Surrender Run
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {game && !isGameLoading && !isGridLoading && (
        <GameHud
          levelScore={game.isOver() ? 0 : game.levelScore}
          targetScore={targetScore}
          movesRemaining={maxMoves - game.levelMoves}
          combo={game.isOver() ? 0 : game.combo}
          constraintProgress={game.constraintProgress}
          constraint2Progress={game.constraint2Progress}
          constraint3Progress={0}
          bonusUsedThisLevel={false}
          gameLevel={gameLevel}
          maxMoves={maxMoves}
        />
      )}


      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-2 py-1 overflow-hidden">
        {(isGameLoading || isGridLoading) && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <img
              src={imgAssets.loader}
              alt="Loading"
              className="h-16 w-16 animate-bounce drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
            />
            <p className="text-lg font-semibold uppercase tracking-[0.25em] text-slate-100">
              {isGameLoading ? "Preparing game" : "Loading grid"}
            </p>
          </div>
        )}

        {game && isGameOn && !isGridLoading && !isGameLoading && (
          <div className="flex w-full flex-col items-center min-h-0">
            <GameBoard
              initialGrid={grid}
              nextLine={game.isOver() ? [] : game.next_row}
              account={account}
              game={game}
              onCascadeComplete={handleCascadeComplete}
            />
          </div>
        )}

        {game && game.over && !isGridLoading && !isGameLoading && (
          <div className="flex w-full flex-col items-center min-h-0 opacity-50 pointer-events-none">
            <GameBoard
              initialGrid={grid}
              nextLine={[]}
              account={account}
              game={game}
              onCascadeComplete={handleCascadeComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayScreen;
