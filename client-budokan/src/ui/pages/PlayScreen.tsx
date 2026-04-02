import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ChevronLeft, Flag } from "lucide-react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useGame } from "@/hooks/useGame";
import { useGrid } from "@/hooks/useGrid";
import { useGameLevel, type GameLevelData } from "@/hooks/useGameLevel";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import { isBossLevel as checkBossLevel } from "@/dojo/game/helpers/runDataPacking";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import GameHud from "@/ui/components/hud/GameHud";
import GameBoard from "@/ui/components/GameBoard";
import GameActionBar from "@/ui/components/actionbar/GameActionBar";
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
import { generateLevelConfig } from "@/dojo/game/types/level";
import { getBlockColors, getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";

const PlayScreen: React.FC = () => {
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
  const {
    setMusicContext,
    setMusicPlaylist,
    playSfx,
  } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);
  const colors = getThemeColors(themeTemplate);

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
  const [cascadeComplete, setCascadeComplete] = useState(false);
  const [isSurrenderDialogOpen, setIsSurrenderDialogOpen] = useState(false);
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
      prevBossLevelRef.current != null
        ? checkBossLevel(prevBossLevelRef.current)
        : false;

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

  const mapThemeId: ThemeId = useMemo(() => {
    if (!game) return "theme-1" as ThemeId;
    const zoneThemes: Record<number, ThemeId> = { 1: "theme-1", 2: "theme-5", 3: "theme-7" };
    return zoneThemes[game.zoneId] ?? "theme-1";
  }, [game?.zoneId, game]);
  const mapThemeImages = useMemo(() => getThemeImages(mapThemeId), [mapThemeId]);

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

  const handleCascadeComplete = useCallback(() => {
    setCascadeComplete(true);
  }, []);

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

    if (prevState && currentLevel > prevState.level && !game.over) {
      if (!cascadeComplete) return;
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
      setIsSurrenderDialogOpen(false);
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
  const nextRowBlocks = game?.next_row ?? [];

  return (
    <div className="h-dvh flex flex-col">
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
          onRetry={() => {
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

      <div
        className="flex h-10 shrink-0 items-center border-b px-2"
        style={{ borderColor: colors.border, backgroundColor: colors.surface }}
      >
        <div className="flex items-center gap-1.5">
          <button
            onClick={goBack}
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors"
            style={{ color: colors.textMuted }}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-display text-sm leading-tight" style={{ color: colors.text }}>
            Lv.{game?.level ?? "..."}
          </span>
          {game && (
            <>
              <span className="text-xs" style={{ color: colors.textMuted }}>·</span>
              <span className="text-[11px] uppercase tracking-[0.08em]" style={{ color: colors.textMuted }}>
                Score
              </span>
              <span className="font-display text-sm tabular-nums" style={{ color: colors.accent2 }}>
                {game.totalScore.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      <Dialog open={isSurrenderDialogOpen} onOpenChange={setIsSurrenderDialogOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="sm:max-w-[380px] w-[94%] flex flex-col mx-auto rounded-lg px-6 py-6"
        >
          <DialogTitle className="text-xl text-center mb-2 text-slate-100">
            Surrender Run?
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300 mb-5">
            This will end your current run immediately.
          </DialogDescription>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsSurrenderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={handleSurrender}
            >
              <Flag className="h-4 w-4" />
              Surrender
            </Button>
          </div>
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {(isGameLoading || isGridLoading) && (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-1 py-12">
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
          <div
            className="flex min-h-0 flex-1 w-full flex-col items-center overflow-hidden rounded-xl bg-center bg-cover px-1 py-1"
            style={{ backgroundImage: `url(${mapThemeImages.gridBg})` }}
          >
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

        {game && isGameOn && !isGridLoading && !isGameLoading && (
          <>
            <div className="shrink-0 px-2 pb-1 pt-1.5">
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <span className="mr-1 text-[9px]" style={{ color: colors.textMuted }}>
                  NEXT
                </span>
                {nextRowBlocks.map((block, idx) => {
                  const validBlock = block >= 1 && block <= 4;
                  const blockColor = validBlock
                    ? getBlockColors(themeTemplate, block as 1 | 2 | 3 | 4).fill
                    : "transparent";
                  return (
                    <div
                      key={`next-preview-${idx}`}
                      className="h-3.5 w-3.5 rounded-[3px] border"
                      style={{
                        borderColor: validBlock ? `${blockColor}66` : colors.border,
                        backgroundColor: validBlock ? `${blockColor}CC` : `${colors.textMuted}1A`,
                      }}
                    />
                  );
                })}
              </div>

              <p className="mt-1.5 text-center text-[10px]" style={{ color: colors.textMuted }}>
                ← Swipe rows to align blocks →
              </p>
            </div>

            <GameActionBar
              onMap={() => navNavigate("map", gameId ?? undefined)}
              onSurrender={() => setIsSurrenderDialogOpen(true)}
              bonusType={game?.bonusType ?? 0}
              bonusCharges={game?.bonusCharges ?? 0}
              bonusSlot={game?.bonusSlot ?? 0}
              onBonusActivate={() => undefined}
              disabled={!isGameOn}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PlayScreen;
