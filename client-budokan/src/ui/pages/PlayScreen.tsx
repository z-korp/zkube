import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useGame } from "@/hooks/useGame";
import { useGrid } from "@/hooks/useGrid";
import { useGameLevel, type GameLevelData } from "@/hooks/useGameLevel";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import { isBossLevel as checkBossLevel } from "@/dojo/game/helpers/runDataPacking";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import GameHud from "@/ui/components/hud/GameHud";
import GameActionBar from "@/ui/components/actionbar/GameActionBar";
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
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { DifficultyType } from "@/dojo/game/types/difficulty";
import { getBonusType } from "@/config/mutatorConfig";

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
  const { themeTemplate } = useTheme();
  const { setMusicContext, setMusicPlaylist, playSfx } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const { game, seed } = useGame({
    gameId: gameId ?? 0n,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0n, shouldLog: true });
  const gameLevel = useGameLevel({ gameId: game?.id });

  const resolveCompletionGameLevel = useCallback(
    (levelNumber: number): GameLevelData => {
      if (gameLevel && gameLevel.level === levelNumber) {
        return gameLevel;
      }

      const fallback = generateLevelConfig(seed, levelNumber);
      const difficultyIndex = Math.max(
        0,
        Object.values(DifficultyType).indexOf(fallback.difficulty.value as DifficultyType),
      );

      return {
        gameId: game?.id ?? 0n,
        level: levelNumber,
        pointsRequired: fallback.pointsRequired,
        maxMoves: fallback.maxMoves,
        difficulty: difficultyIndex,
        constraintType: fallback.constraint.constraintType,
        constraintValue: fallback.constraint.value,
        constraintCount: fallback.constraint.requiredCount,
        constraint2Type: fallback.constraint2.constraintType,
        constraint2Value: fallback.constraint2.value,
        constraint2Count: fallback.constraint2.requiredCount,
        constraint3Type: ConstraintType.None,
        constraint3Value: 0,
        constraint3Count: 0,
        mutatorId: 0,
        cube3Threshold: fallback.cube3Threshold,
        cube2Threshold: fallback.cube2Threshold,
      };
    },
    [game?.id, gameLevel, seed],
  );

  const effectiveGameLevel = useMemo(() => {
    if (!game) return null;
    return resolveCompletionGameLevel(game.level);
  }, [game, resolveCompletionGameLevel]);

  const targetScore = effectiveGameLevel?.pointsRequired ?? 0;
  const maxMoves = effectiveGameLevel?.maxMoves ?? 0;

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [cascadeComplete, setCascadeComplete] = useState(false);
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

  const [activeBonus, setActiveBonus] = useState<BonusType>(BonusType.None);

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
        } else if (game.mode === 0 || game.mode === undefined) {
          // Story/daily mode: game.over without zoneCleared = run ended (fail/surrender)
          // Level completion is handled during gameplay (auto-advance, navigates to map)
          // If we reach here, the run failed — always show incomplete
          setPendingLevelCompletion({
            level: game.level,
            levelMoves: game.levelMoves,
            prevTotalScore: levelStartTotalScoreRef.current,
            totalScore: game.totalScore,
            gameLevel: resolveCompletionGameLevel(game.level),
            isIncomplete: true,
          });
          navNavigate("map");
        } else {
          // Endless mode: show game over
          playSfx("over");
          setIsGameOverOpen(true);
        }
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game, navNavigate, playSfx, resolveCompletionGameLevel, setPendingLevelCompletion, targetScore]);

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
        gameLevel: resolveCompletionGameLevel(prevState.level),
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
    gameLevel,
    navNavigate,
    setPendingLevelCompletion,
    resolveCompletionGameLevel,
  ]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    try {
      playSfx("click");
      await surrender({ account, game_id: game.id });
    } catch (error) {
      console.error("Surrender failed:", error);
    }
  }, [account, game, playSfx, surrender]);

  const isGridLoading =
    !!game && !game.isOver() && (!grid || grid.length === 0);

  const isGameOn = game && !game.over;

  const bonusType = game?.bonusType ?? 0;
  const bonusCharges = game?.bonusCharges ?? 0;
  const activeBonusLevel = Math.max(0, bonusCharges - 1);

  const bonusSlots = useMemo(() => {
    if (bonusType <= 0) return [];
    const mapped = bonusType as BonusType;
    const bonusInfo = getBonusType(bonusType);
    return [
      {
        type: mapped,
        count: bonusCharges,
        level: activeBonusLevel,
        bagSize: bonusCharges,
        icon: bonusInfo.icon,
        tooltip: `${bonusInfo.name}: ${bonusInfo.description} (${bonusCharges} charges)`,
        onClick: () => {
          if (bonusCharges <= 0) return;
          setActiveBonus((prev) => (prev === mapped ? BonusType.None : mapped));
        },
      },
    ];
  }, [bonusType, bonusCharges, activeBonusLevel]);

  const bonusInfo = getBonusType(bonusType);
  const bonusDescription =
    activeBonus !== BonusType.None && bonusCharges > 0
      ? `TAP A BLOCK TO USE ${bonusInfo.name.toUpperCase()}`
      : "";

  useEffect(() => {
    setActiveBonus(BonusType.None);
  }, [game?.id, game?.bonusCharges, game?.bonusType]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      style={{
        backgroundImage: `var(--theme-grid-bg-image, none)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: `var(--theme-grid-bg, #10172A)`,
      }}
    >
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Account</DialogTitle>
            <DialogDescription>Connect your account to play.</DialogDescription>
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

      {game && !isGameLoading && !isGridLoading && (
        <GameHud
          level={game.level}
          levelScore={game.isOver() ? 0 : game.levelScore}
          targetScore={targetScore}
          movesRemaining={game?.mode === 1 ? game.levelMoves : maxMoves - game.levelMoves}
          combo={game.isOver() ? 0 : game.combo}
          constraintProgress={game.constraintProgress}
          constraint2Progress={game.constraint2Progress}
          constraint3Progress={0}
          bonusUsedThisLevel={false}
          gameLevel={effectiveGameLevel}
          activeMutatorId={game.activeMutatorId}
          mode={game?.mode ?? 0}
          totalScore={game?.totalScore ?? 0}
          currentDifficulty={game?.currentDifficulty ?? 0}
          zoneId={game?.zoneId ?? 1}
        />
      )}

      <div className="flex-1 flex flex-col items-center justify-end min-h-0 px-2 py-1 overflow-hidden">
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

        {!isGameLoading && !game && (
          <div className="mx-auto mt-8 w-full max-w-[340px] rounded-2xl border border-white/20 bg-black/35 px-5 py-6 text-center backdrop-blur-xl">
            <p className="font-sans text-lg font-bold text-white">Unable to load this run</p>
            <p className="mt-2 font-sans text-sm text-white/75">
              The game state was not found yet. Try going back to Home and resuming story again.
            </p>
            <button
              type="button"
              onClick={() => navNavigate("home")}
              className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 py-2 font-sans text-sm font-semibold text-white/90"
            >
              Back to Home
            </button>
          </div>
        )}

        {game && isGameOn && !isGridLoading && !isGameLoading && (
          <div className="flex h-full w-full flex-col items-center min-h-0">
            <GameBoard
              initialGrid={grid}
              nextLine={game.isOver() ? [] : game.next_row}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
              activeBonusLevel={activeBonusLevel}
              onCascadeComplete={handleCascadeComplete}
            />
          </div>
        )}

        {game && game.over && !isGridLoading && !isGameLoading && (
          <div className="flex h-full w-full flex-col items-center min-h-0 opacity-50 pointer-events-none">
            <GameBoard
              initialGrid={grid}
              nextLine={[]}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
              activeBonusLevel={activeBonusLevel}
              onCascadeComplete={handleCascadeComplete}
            />
          </div>
        )}
      </div>

      {game && !game.over && !isGameLoading && !isGridLoading && (
        <GameActionBar
          bonusSlots={bonusSlots}
          activeBonus={activeBonus}
          bonusDescription={bonusDescription}
          onSurrender={handleSurrender}
          onMap={goBack}
          isGameOver={game.over}
        />
      )}
    </div>
  );
};

export default PlayScreen;
