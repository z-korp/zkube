import React, { useEffect, useRef, useState, useMemo, useCallback, Suspense } from "react";
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
import { useReceiptGameStore } from "@/stores/receiptGameStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import GameHud from "@/ui/components/hud/GameHud";
import GameActionBar from "@/ui/components/actionbar/GameActionBar";
import { buildTriggerDescription } from "@/ui/components/actionbar/GameActionBar";
import type { BonusSlot } from "@/ui/components/actionbar/GameActionBar";
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
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { DifficultyType } from "@/dojo/game/types/difficulty";
import { getBonusType } from "@/config/mutatorConfig";
import { useMutatorDef } from "@/hooks/useMutatorDef";
import { useSettings } from "@/hooks/useSettings";
import { useTokenSettingsId } from "@/hooks/useTokenSettingsId";
import { getThemeId } from "@/config/themes";
import { showToast, deriveUserFacingErrorMessage } from "@/utils/toast";

const EndlessGreetingOverlay = React.lazy(() =>
  import("@/ui/components/map/GuardianGreeting").then((mod) =>
    import("@/config/bossCharacters").then((bossMod) =>
      import("@/config/themes").then((themesMod) => ({
        default: ({ zoneId, activeMutatorId, onClose }: { zoneId: number; activeMutatorId: number; onClose: () => void }) => {
          const guardian = bossMod.getZoneGuardian(zoneId);
          const colors = themesMod.getThemeColors(themesMod.getThemeId(zoneId));
          return <mod.default colors={colors} guardian={guardian} mode="endless" activeMutatorId={activeMutatorId} onClose={onClose} />;
        },
      }))
    )
  )
);

const PlayScreen: React.FC = () => {
  const {
    setup: {
      systemCalls: { surrender, create },
      client: { game: gameClient },
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
  const { setMusicContext, setMusicPlaylist, playSfx } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const { game: toriiGame, seed } = useGame({
    gameId: gameId ?? 0n,
    shouldLog: false,
  });
  // Receipt game overrides Torii for instant HUD updates after move/bonus.
  // Receipt is authoritative — Torii never overwrites it. Only cleared on game change.
  const receiptGame = useReceiptGameStore((s) => s.game);
  const game = useMemo(() => {
    if (!toriiGame) return toriiGame; // preserve null (same type as useGame returns)
    if (receiptGame && receiptGame.id === toriiGame.id) return receiptGame;
    return toriiGame;
  }, [toriiGame, receiptGame]);

  // Clear receipt game when switching to a different game (navigation)
  useEffect(() => {
    useReceiptGameStore.getState().setGame(null);
  }, [gameId]);

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
        mutatorId: 0,
        star3Threshold: fallback.star3Threshold,
        star2Threshold: fallback.star2Threshold,
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
  const showEndlessGreeting = useNavigationStore((s) => s.showEndlessGreeting);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [surrendering, setSurrendering] = useState(false);
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
    // 30s is the worst-case budget for a Budokan-deep-link landing where we
    // also need create_run to confirm before Torii indexes the new Game model.
    const timer = setTimeout(() => setIsGameLoading(false), 30000);
    return () => clearTimeout(timer);
  }, [gameId]);

  useEffect(() => {
    if (game && seed !== 0n) setIsGameLoading(false);
  }, [game, seed]);

  // Deep-link (Budokan) entry: the user landed on /play/{tokenId} from outside
  // the app. Denshokan has already minted the token; we now need to call
  // create_run(token_id, 1) so the game state is initialized. If the game
  // already exists (refresh/return visit) we just clear the flag.
  const pendingDeepLinkStart = useNavigationStore((s) => s.pendingDeepLinkStart);
  const deepLinkAttemptRef = useRef(false);

  useEffect(() => {
    if (!pendingDeepLinkStart) return;
    if (!account || !gameId) return;
    if (deepLinkAttemptRef.current) return;

    const setPending = useNavigationStore.getState().setPendingDeepLinkStart;

    // Fast path: if Torii has already indexed the Game model, no create_run needed.
    if (toriiGame) {
      deepLinkAttemptRef.current = true;
      setPending(false);
      return;
    }

    // Slow path: Torii may be lagging. Ask the chain directly (via game_system's
    // get_game_data view call) whether the Game model has been initialized.
    // This avoids the arbitrary "wait N seconds" heuristic — the chain is
    // authoritative and the answer is immediate.
    let cancelled = false;
    deepLinkAttemptRef.current = true;
    (async () => {
      try {
        const alreadyInitialized = await gameClient.isGameInitialized({ account, game_id: gameId });
        if (cancelled) return;
        if (alreadyInitialized) return;
        await create({ account, token_id: gameId, run_type: 1 });
        if (cancelled) return;
        showToast({ message: "Tournament started!", type: "success" });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        // "already" reverts are benign races (Torii lagged but chain had the game).
        if (message.toLowerCase().includes("already")) return;
        console.error("[deep-link] create_run failed", err);
        showToast({ message: deriveUserFacingErrorMessage(err, "Failed to start game."), type: "error" });
      } finally {
        if (!cancelled) setPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingDeepLinkStart, account, gameId, toriiGame, create, gameClient]);

  useEffect(() => {
    if (!account) setIsConnectDialogOpen(true);
    else setIsConnectDialogOpen(false);
  }, [account]);

  // Game-over detection uses toriiGame (not receipt game) so Torii has synced
  // all progression data (StoryZoneProgress, etc.) before we navigate to map.
  // Receipt game gives instant HUD updates; Torii gates navigation.
  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && toriiGame?.over) {
        setSurrendering(false);
        const pending = useNavigationStore.getState().pendingLevelCompletion;
        if (toriiGame.zoneCleared) {
          playSfx("victory");
          setIsVictoryOpen(true);
        } else if (toriiGame.mode === 0 || toriiGame.mode === undefined) {
          if (!pending) {
            // Check if the level was actually completed (score + constraints)
            const maxMoves = effectiveGameLevel?.maxMoves ?? 0;
            const scoreMet = targetScore > 0 && toriiGame.levelScore >= targetScore && toriiGame.levelMoves < maxMoves;
            const c1 = Constraint.fromContractValues(
              effectiveGameLevel?.constraintType ?? ConstraintType.None,
              effectiveGameLevel?.constraintValue ?? 0,
              effectiveGameLevel?.constraintCount ?? 0,
            );
            const c2 = Constraint.fromContractValues(
              effectiveGameLevel?.constraint2Type ?? ConstraintType.None,
              effectiveGameLevel?.constraint2Value ?? 0,
              effectiveGameLevel?.constraint2Count ?? 0,
            );
            const constraintsMet = c1.isSatisfied(toriiGame.constraintProgress, false) && c2.isSatisfied(toriiGame.constraint2Progress, false);
            const levelCompleted = scoreMet && constraintsMet;
            setPendingLevelCompletion({
              level: toriiGame.level,
              levelMoves: toriiGame.levelMoves,
              prevTotalScore: levelStartTotalScoreRef.current,
              totalScore: toriiGame.totalScore,
              gameLevel: resolveCompletionGameLevel(toriiGame.level),
              isIncomplete: !levelCompleted,
            });
            navNavigate("map");
          }
        } else {
          playSfx("over");
          setIsGameOverOpen(true);
        }
      }
    }
    prevGameOverRef.current = toriiGame?.over;
  }, [toriiGame, navNavigate, playSfx, resolveCompletionGameLevel, setPendingLevelCompletion, targetScore, effectiveGameLevel]);

  const handleCascadeComplete = useCallback(() => {
    setCascadeComplete(true);
  }, []);

  useEffect(() => {
    setCascadeComplete(false);
  }, [grid]);

  // Level advancement also uses toriiGame so Torii has synced before map navigation.
  useEffect(() => {
    if (!toriiGame) return;
    const prevState = prevGameStateRef.current;
    const currentLevel = toriiGame.level;

    if (prevState === null) {
      levelStartTotalScoreRef.current = toriiGame.totalScore - toriiGame.levelScore;
    }

    if (prevState && currentLevel > prevState.level) {
      if (!cascadeComplete) return;
      // Level advanced — this is a completion even if game.over is also true
      if (checkBossLevel(prevState.level)) {
        playSfx("boss-defeat");
      } else {
        playSfx("levelup");
      }
      setPendingLevelCompletion({
        level: prevState.level,
        levelMoves: prevState.levelMoves,
        prevTotalScore: levelStartTotalScoreRef.current,
        totalScore: toriiGame.totalScore,
        gameLevel: resolveCompletionGameLevel(prevState.level),
      });
      levelStartTotalScoreRef.current = toriiGame.totalScore;
      navNavigate("map");
    }

    prevGameStateRef.current = {
      level: toriiGame.level,
      levelScore: toriiGame.levelScore,
      levelMoves: toriiGame.levelMoves,
      constraintProgress: toriiGame.constraintProgress,
      totalScore: toriiGame.totalScore,
      gameLevel,
    };
  }, [
    toriiGame?.level,
    toriiGame?.levelScore,
    toriiGame?.levelMoves,
    toriiGame?.constraintProgress,
    toriiGame?.over,
    toriiGame?.totalScore,
    toriiGame,
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
      setSurrendering(true);
      await surrender({ account, game_id: game.id });
    } catch (error) {
      console.error("Surrender failed:", error);
      setSurrendering(false);
    }
  }, [account, game, playSfx, surrender]);

  const isGridLoading =
    !!game && !game.isOver() && (!grid || grid.length === 0);

  // Use toriiGame.over for display switching — keeps grid + HUD visible
  // while waiting for Torii to sync after receipt detects game over.
  const isGameOn = game && !toriiGame?.over;

  const bonusType = game?.bonusType ?? 0;
  const bonusCharges = game?.bonusCharges ?? 0;
  const gameBonusTriggerType = game?.bonusTriggerType ?? 0;

  // run_data stores the passive mutator; the active mutator (bonus source) comes from GameSettings.
  // Tournaments have arbitrary settings ids — use Denshokan's TokenMetadata to resolve the real
  // settings, falling back to the zone map formula while loading.
  const zoneId = game?.zoneId ?? 1;
  const formulaSettingsId = Math.max(0, (zoneId - 1) * 2);
  const { settingsId: resolvedSettingsId } = useTokenSettingsId(gameId);
  const settingsId = resolvedSettingsId ?? formulaSettingsId;

  // Sync theme to the game's zone so blocks/background match. Tournaments with
  // `zone_id=0` clamp to zone 1 (Tiki) inside getThemeId.
  useEffect(() => {
    if (!game) return;
    const gameThemeId = getThemeId(game.zoneId);
    if (gameThemeId !== themeTemplate) {
      setThemeTemplate(gameThemeId);
    }
  }, [game?.zoneId]);
  const { settings: zoneSettings } = useSettings(settingsId);
  const bonusMutatorId = zoneSettings.activeMutatorId;

  const { data: mutatorDef } = useMutatorDef(bonusMutatorId);

  const bonusSlots = useMemo((): BonusSlot[] => {
    if (!mutatorDef) {
      // Fallback: show just the active bonus if no mutator data
      if (bonusType <= 0) return [];
      const info = getBonusType(bonusType);
      return [{
        type: bonusType as BonusType,
        charges: bonusCharges,
        isActive: true,
        icon: info.icon,
        name: info.name,
        description: info.description,
        triggerDescription: "",
        startingCharges: 0,
        onClick: () => {
          if (bonusCharges <= 0) return;
          setActiveBonus((prev) => (prev === (bonusType as BonusType) ? BonusType.None : bonusType as BonusType));
        },
      }];
    }

    // Resolve the rolled trigger's threshold. trigger_type: 1=Combo, 2=Lines, 3=Score.
    const rolledThreshold =
      gameBonusTriggerType === 1
        ? mutatorDef.comboTriggerThreshold
        : gameBonusTriggerType === 2
        ? mutatorDef.linesTriggerThreshold
        : gameBonusTriggerType === 3
        ? mutatorDef.scoreTriggerThreshold
        : 0;

    if (mutatorDef.bonusType === 0 || gameBonusTriggerType === 0 || rolledThreshold === 0) {
      // Fallback: no valid slot found, show from game data
      if (bonusType <= 0) return [];
      const info = getBonusType(bonusType);
      return [{
        type: bonusType as BonusType,
        charges: bonusCharges,
        isActive: true,
        icon: info.icon,
        name: info.name,
        description: info.description,
        triggerDescription: "",
        startingCharges: 0,
        onClick: () => {
          if (bonusCharges <= 0) return;
          setActiveBonus((prev) => (prev === (bonusType as BonusType) ? BonusType.None : bonusType as BonusType));
        },
      }];
    }

    const info = getBonusType(mutatorDef.bonusType);
    const mapped = mutatorDef.bonusType as BonusType;
    return [{
      type: mapped,
      charges: bonusCharges,
      isActive: true,
      icon: info.icon,
      name: info.name,
      description: info.description,
      triggerDescription: buildTriggerDescription(gameBonusTriggerType, rolledThreshold, mutatorDef.startingCharges),
      startingCharges: mutatorDef.startingCharges,
      onClick: () => {
        if (bonusCharges <= 0) return;
        setActiveBonus((prev) => (prev === mapped ? BonusType.None : mapped));
      },
    }];
  }, [mutatorDef, bonusType, bonusCharges, gameBonusTriggerType]);

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

      {/* Endless greeting overlay */}
      {game && game.mode === 1 && showEndlessGreeting && (
        <Suspense fallback={null}>
          <EndlessGreetingOverlay
            zoneId={game.zoneId}
            activeMutatorId={game.activeMutatorId}
            onClose={() => useNavigationStore.setState({ showEndlessGreeting: false })}
          />
        </Suspense>
      )}

      {game && !isGameLoading && !isGridLoading && (
        <GameHud
          level={game.level}
          levelScore={toriiGame?.isOver() ? 0 : game.levelScore}
          targetScore={targetScore}
          movesRemaining={game?.mode === 1 ? game.levelMoves : maxMoves - game.levelMoves}
          combo={toriiGame?.isOver() ? 0 : game.combo}
          constraintProgress={game.constraintProgress}
          constraint2Progress={game.constraint2Progress}
          bonusUsedThisLevel={false}
          gameLevel={effectiveGameLevel}
          activeMutatorId={game.activeMutatorId}
          mode={game?.mode ?? 0}
          totalScore={game?.totalScore ?? 0}
          currentDifficulty={game?.currentDifficulty ?? 0}
          zoneId={game?.zoneId ?? 1}
          onBack={game?.mode === 1 ? () => navNavigate("home") : goBack}
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
          <div className={`flex h-full w-full flex-col items-center min-h-0 ${checkBossLevel(game.level) ? "boss-grid" : ""}`}>
            <GameBoard
              initialGrid={grid}
              nextLine={game.isOver() ? [] : game.next_row}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
              onCascadeComplete={handleCascadeComplete}
              forceTxProcessing={surrendering}
            />
          </div>
        )}

        {game && toriiGame?.over && !isGridLoading && !isGameLoading && (
          <div className="flex h-full w-full flex-col items-center min-h-0 opacity-50 pointer-events-none">
            <GameBoard
              initialGrid={grid}
              nextLine={[]}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
              onCascadeComplete={handleCascadeComplete}
              forceTxProcessing={surrendering}
            />
          </div>
        )}
      </div>

      {game && !toriiGame?.over && !isGameLoading && !isGridLoading && (
        <GameActionBar
          bonusSlots={bonusSlots}
          activeBonus={activeBonus}
          bonusDescription={bonusDescription}
          onSurrender={handleSurrender}
          isGameOver={!!toriiGame?.over}
          mode={game?.mode ?? 0}
          zoneId={game?.zoneId ?? 1}
          activeMutatorId={game?.activeMutatorId ?? 0}
        />
      )}
    </div>
  );
};

export default PlayScreen;
