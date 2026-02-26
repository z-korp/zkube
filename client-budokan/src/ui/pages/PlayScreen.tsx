import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Account } from "starknet";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useGame } from "@/hooks/useGame";
import { useGrid } from "@/hooks/useGrid";
import { useGameLevel, type GameLevelData } from "@/hooks/useGameLevel";
import { useDraft } from "@/hooks/useDraft";
import useAccountCustom from "@/hooks/useAccountCustom";
import useViewport from "@/hooks/useViewport";
import { useDojo } from "@/dojo/useDojo";
import { isBonusSkill, isWorldEventSkill, isBossLevel as checkBossLevel } from "@/dojo/game/helpers/runDataPacking";
import {
  Bonus,
  BonusType,
  bonusTypeFromContractValue,
  bonusTypeToContractValue,
} from "@/dojo/game/types/bonus";
import { getSkillName, getSkillTier, SKILLS, getArchetypeForSkill } from "@/dojo/game/types/skillData";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets, { getSkillTierIconPath } from "@/ui/theme/ImageAssets";
import GameHud from "@/ui/components/hud/GameHud";
import GameActionBar from "@/ui/components/actionbar/GameActionBar";
import GameBoard from "@/ui/components/GameBoard";
import GameOverDialog from "@/ui/components/GameOverDialog";
import VictoryDialog from "@/ui/components/VictoryDialog";
import Connect from "@/ui/components/Connect";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import { getDraftEventForCompletedLevel } from "@/utils/draftEvents";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { deriveZoneThemes, getZone } from "@/hooks/useMapData";


const PlayScreen: React.FC = () => {
  useViewport();

  const {
    setup: {
      systemCalls: { surrender, startNextLevel, applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const gameId = useNavigationStore((s) => s.gameId);
  const navNavigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);
  const setPendingPreviewLevel = useNavigationStore(
    (s) => s.setPendingPreviewLevel,
  );
  const setPendingDraftEvent = useNavigationStore(
    (s) => s.setPendingDraftEvent,
  );
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicContext, setMusicPlaylist, playSfx } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const { game, seed } = useGame({
    gameId: gameId ?? 0,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });
  const gameLevel = useGameLevel({ gameId: game?.id });
  const draftState = useDraft({ gameId: gameId ?? undefined });

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [activeBonus, setActiveBonus] = useState<BonusType>(BonusType.None);
  const [bonusDescription, setBonusDescription] = useState("");
  const [isSupplyConfirmOpen, setIsSupplyConfirmOpen] = useState(false);
  const [isSupplyProcessing, setIsSupplyProcessing] = useState(false);
  // Tracks whether the Grid cascade animation has finished for the current move.
  // Level-complete detection is gated on this to prevent checking against a mid-cascade grid.
  const [cascadeComplete, setCascadeComplete] = useState(false);
  const [levelCompletionData, setLevelCompletionData] = useState<{
    level: number;
    levelMoves: number;
    prevTotalCubes: number;
    totalCubes: number;
    prevTotalScore: number;
    totalScore: number;
    gameLevel: GameLevelData | null;
  } | null>(null);
  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
  const prevGameStateRef = useRef<{
    level: number;
    levelScore: number;
    levelMoves: number;
    constraintProgress: number;
    bonusUsedThisLevel: boolean;
    totalCubes: number;
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

  useEffect(() => {
    if (seed === 0n || !game) return;
    const zoneThemes = deriveZoneThemes(seed);
    const zone = getZone(game.level);
    const zoneTheme = zoneThemes[zone - 1];
    if (zoneTheme) {
      setThemeTemplate(zoneTheme);
    }
  }, [seed, game?.level, setThemeTemplate]);

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

  // Redirect to draft page if a draft is active (e.g. zone 1 entry draft at game creation).
  // Skip if the level-complete dialog is showing — navigation happens from the dialog's onClose.
  useEffect(() => {
    if (!game || !account || game.over) return;
    if (!draftState?.active) return;
    if (gameId === null || gameId === undefined) return;
    if (levelCompletionData) return; // Don't redirect while showing level-complete dialog
    navNavigate("draft", gameId);
  }, [draftState?.active, game, account, gameId, navNavigate, levelCompletionData]);


  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        if (game.runCompleted) {
          playSfx("victory");
          setIsVictoryOpen(true);
        } else {
          playSfx("over");
          setIsGameOverOpen(true);
        }
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game?.over, game?.runCompleted, playSfx]);

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
      const completionData = {
        level: prevState.level,
        levelMoves: prevState.levelMoves,
        prevTotalCubes: prevState.totalCubes,
        totalCubes: game.totalCubes,
        prevTotalScore: levelStartTotalScoreRef.current,
        totalScore: game.totalScore,
        gameLevel: prevState.gameLevel,
      };
      setLevelCompletionData(completionData);
      levelStartTotalScoreRef.current = game.totalScore;

      // Fire startNextLevel in background so the next level grid is ready
      // by the time the player navigates from the map.
      if (account) {
        startNextLevel({
          account,
          game_id: game.id,
          current_level: game.level,
        }).catch((error: unknown) => {
          console.error("Background startNextLevel failed:", error);
        });
      }
    }

    prevGameStateRef.current = {
      level: game.level,
      levelScore: game.levelScore,
      levelMoves: game.levelMoves,
      constraintProgress: game.constraintProgress,
      bonusUsedThisLevel: game.bonusUsedThisLevel,
      totalCubes: game.totalCubes,
      totalScore: game.totalScore,
      gameLevel,
    };
  }, [
    game?.level,
    game?.levelScore,
    game?.levelMoves,
    game?.constraintProgress,
    game?.bonusUsedThisLevel,
    game?.over,
    game?.totalCubes,
    game?.totalScore,
    game,
    playSfx,
    cascadeComplete,
  ]);

  const completionDraftEvent = useMemo(() => {
    if (!levelCompletionData) return null;
    return getDraftEventForCompletedLevel(seed, levelCompletionData.level);
  }, [levelCompletionData, seed]);

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    try {
      playSfx("click");
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
    !!game && !game.isOver() && (!grid || grid.length === 0 || game.levelTransitionPending);

  const isGameOn = game && !game.over;

  const getBonusDescription = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Harvest:
        return "Select a block size to harvest";
      case BonusType.Score:
        return "Apply instant score bonus";
      case BonusType.Combo:
        return "Apply combo bonus";
      case BonusType.Wave:
        return "Select rows to clear";
      case BonusType.Supply:
        return "Add a new line for free";
      default:
        return "";
    }
  }, []);

  const getBonusTooltip = useCallback(
    (type: BonusType, level: number = 0): string => {
      return new Bonus(type).getEffect(level);
    },
    [],
  );

  const getBonusIcon = useCallback(
    (type: BonusType, level: number = 0): string => {
      const skillName = (() => {
        switch (type) {
          case BonusType.Combo: return "combo";
          case BonusType.Score: return "score";
          case BonusType.Harvest: return "harvest";
          case BonusType.Wave: return "wave";
          case BonusType.Supply: return "supply";
          default: return "";
        }
      })();
      if (!skillName) return "";
      const tier = getSkillTier(level);
      return getSkillTierIconPath(skillName, tier);
    },
    [],
  );

  const handleBonusSelect = useCallback(
    (type: BonusType) => {
      const skillId = bonusTypeToContractValue(type);
      const slot = game?.runData.slots.find((entry) => entry.skillId === skillId);
      const count = slot?.charges ?? 0;
      if (count === 0) return;

      // Supply fires directly with confirmation — no grid interaction needed
      if (type === BonusType.Supply) {
        playSfx("click");
        setIsSupplyConfirmOpen(true);
        return;
      }

      if (activeBonus === type) {
        playSfx("click");
        playSfx("unequip");
        setActiveBonus(BonusType.None);
        setBonusDescription("");
      } else {
        playSfx("click");
        playSfx("equip");
        setActiveBonus(type);
        setBonusDescription(`${getSkillName(skillId)}: ${getBonusDescription(type)}`);
      }
    },
    [activeBonus, game?.runData.slots, getBonusDescription, playSfx],
  );

  const selectedBonusSlots = useMemo(() => {
    if (!game) return [];

    return game.runData.slots
      .map((slot, index) => ({ ...slot, index }))
      .filter((slot) => isBonusSkill(slot.skillId) && slot.skillId > 0)
      .map((slot) => {
        const type = bonusTypeFromContractValue(slot.skillId);
        return {
          slot: slot.index,
          type,
          level: slot.level,
          count: slot.charges,
          bagSize: slot.charges,
          icon: getBonusIcon(type, slot.level),
          tooltip: `${getSkillName(slot.skillId)} - ${getBonusTooltip(type, slot.level)}`,
        };
      });
  }, [
    game,
    game?.runData.slots,
    getBonusIcon,
    getBonusTooltip,
  ]);

  const passiveSlots = useMemo(() => {
    if (!game) return [];
    return game.runData.slots
      .filter((slot) => isWorldEventSkill(slot.skillId) && slot.skillId > 0)
      .map((slot) => {
        const skill = SKILLS[slot.skillId];
        const archetype = getArchetypeForSkill(slot.skillId);
        const skillName = skill?.name?.toLowerCase() ?? '';
        const tier = getSkillTier(slot.level);
        return {
          type: BonusType.None,
          level: slot.level,
          count: 0,
          bagSize: 0,
          icon: getSkillTierIconPath(skillName, tier),
          tooltip: `${getSkillName(slot.skillId)} (Passive) - ${skill?.description ?? ''}`,
          isPassive: true as const,
          archetypeColor: archetype?.color ?? '#8b5cf6',
        };
      });
  }, [game?.runData.slots]);

  const activeBonusLevel = useMemo(() => {
    const slot = selectedBonusSlots.find((s) => s.type === activeBonus);
    return slot?.level ?? 0;
  }, [selectedBonusSlots, activeBonus]);

  useEffect(() => {
    setActiveBonus(BonusType.None);
    setBonusDescription("");
  }, [grid]);

  const supplyBonusLevel = useMemo(() => {
    const slot = selectedBonusSlots.find((s) => s.type === BonusType.Supply);
    return slot?.level ?? 0;
  }, [selectedBonusSlots]);

  const handleSupplyConfirm = useCallback(async () => {
    if (!account || !game) return;
    setIsSupplyProcessing(true);
    setIsSupplyConfirmOpen(false);
    try {
      await applyBonus({
        account: account as Account,
        game_id: game.id,
        bonus: new Bonus(BonusType.Supply).into(),
        row_index: 0,
        block_index: 0,
      });
      playSfx("bonus-activate");
    } finally {
      setIsSupplyProcessing(false);
    }
  }, [account, applyBonus, game, playSfx]);

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

      <Dialog open={isSupplyConfirmOpen} onOpenChange={setIsSupplyConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Use Supply?</DialogTitle>
            <DialogDescription>
              Add {supplyBonusLevel + 1} line{supplyBonusLevel > 0 ? "s" : ""} to the grid (no move cost).
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsSupplyConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={isSupplyProcessing}
              onClick={handleSupplyConfirm}
            >
              {isSupplyProcessing ? "Applying..." : "Confirm"}
            </Button>
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

      {levelCompletionData && (
        <LevelCompleteDialog
          isOpen={true}
          onClose={() => {
            const completedLevel = levelCompletionData.level;
            setLevelCompletionData(null);

            if (completionDraftEvent) {
              setPendingDraftEvent(completionDraftEvent);
              navNavigate("draft", gameId ?? undefined);
            } else {
              setPendingPreviewLevel(completedLevel + 1);
              navNavigate("map");
            }
          }}
          level={levelCompletionData.level}
          levelMoves={levelCompletionData.levelMoves}
          prevTotalCubes={levelCompletionData.prevTotalCubes}
          totalCubes={levelCompletionData.totalCubes}
          prevTotalScore={levelCompletionData.prevTotalScore}
          totalScore={levelCompletionData.totalScore}
          gameLevel={levelCompletionData.gameLevel}
          draftWillOpen={completionDraftEvent !== null}
        />
      )}

      {game && !isGameLoading && !isGridLoading && (
        <GameHud
          level={game.level}
          levelScore={game.isOver() ? 0 : game.levelScore}
          targetScore={targetScore}
          movesRemaining={maxMoves - game.levelMoves}
          totalCubes={game.cubesAvailable}
          combo={game.isOver() ? 0 : game.combo}
          constraintProgress={game.constraintProgress}
          constraint2Progress={game.constraint2Progress}
          constraint3Progress={game.runData.constraint3Progress}
          bonusUsedThisLevel={game.bonusUsedThisLevel}
          gameLevel={gameLevel}
          maxMoves={maxMoves}
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

        {game && isGameOn && !isGridLoading && !isGameLoading && (
          <div className="flex w-full flex-col items-center min-h-0">
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
          <div className="flex w-full flex-col items-center min-h-0 opacity-50 pointer-events-none">
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
          bonusSlots={[
            ...selectedBonusSlots.map((slot) => ({
              type: slot.type,
              count: slot.count,
              level: slot.level,
              bagSize: slot.bagSize,
              icon: slot.icon,
              tooltip: slot.tooltip,
              onClick: () => handleBonusSelect(slot.type),
            })),
            ...passiveSlots.map((slot) => ({
              ...slot,
              onClick: () => {},
            })),
          ]}
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
