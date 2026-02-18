import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useGame } from "@/hooks/useGame";
import { useGrid } from "@/hooks/useGrid";
import { useGameLevel, type GameLevelData } from "@/hooks/useGameLevel";
import useAccountCustom from "@/hooks/useAccountCustom";
import useViewport from "@/hooks/useViewport";
import { useDojo } from "@/dojo/useDojo";
import {
  getBonusInventoryCount,
  isInGameShopAvailable,
} from "@/dojo/game/helpers/runDataPacking";
import { BonusType, bonusTypeFromContractValue } from "@/dojo/game/types/bonus";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import GameHud from "@/ui/components/hud/GameHud";
import GameActionBar from "@/ui/components/actionbar/GameActionBar";
import GameBoard from "@/ui/components/GameBoard";
import GameOverDialog from "@/ui/components/GameOverDialog";
import VictoryDialog from "@/ui/components/VictoryDialog";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import { PendingLevelUpDialog } from "@/ui/components/Shop";
import Connect from "@/ui/components/Connect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/elements/dialog";
import { generateLevelConfig } from "@/dojo/game/types/level";

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
  prevTotalScore: number;
  totalScore: number;
  gameLevel: GameLevelData | null;
}

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
  const { themeTemplate } = useTheme();
  const { setMusicContext } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const { game, seed } = useGame({
    gameId: gameId ?? 0,
    shouldLog: false,
  });
  const grid = useGrid({ gameId: game?.id ?? 0, shouldLog: true });
  const gameLevel = useGameLevel({ gameId: game?.id });

  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isLevelCompleteOpen, setIsLevelCompleteOpen] = useState(false);
  const [isPendingLevelUpOpen, setIsPendingLevelUpOpen] = useState(false);
  const [openShopAfterLevelUp, setOpenShopAfterLevelUp] = useState(false);
  const [levelCompletionData, setLevelCompletionData] =
    useState<LevelCompletionData | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [activeBonus, setActiveBonus] = useState<BonusType>(BonusType.None);
  const [bonusDescription, setBonusDescription] = useState("");

  const prevGameOverRef = useRef<boolean | undefined>(game?.over);
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
    gameLevel: GameLevelData | null;
  } | null>(null);
  const levelStartTotalScoreRef = useRef<number>(0);

  useEffect(() => {
    const level = game?.level ?? 1;
    const isBossLevel = level > 0 && level % 10 === 0;
    setMusicContext(isBossLevel ? "boss" : "level");
  }, [game?.level, setMusicContext]);

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
    if (
      game?.bossLevelUpPending &&
      !isPendingLevelUpOpen &&
      !isLevelCompleteOpen
    ) {
      setIsPendingLevelUpOpen(true);
    }
  }, [
    game?.bossLevelUpPending,
    isPendingLevelUpOpen,
    isLevelCompleteOpen,
  ]);

  useEffect(() => {
    if (prevGameOverRef.current !== undefined) {
      if (!prevGameOverRef.current && game?.over) {
        if (game.runCompleted) setIsVictoryOpen(true);
        else setIsGameOverOpen(true);
      }
    }
    prevGameOverRef.current = game?.over;
  }, [game?.over, game?.runCompleted]);

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
        prevTotalScore: levelStartTotalScoreRef.current,
        totalScore: game.totalScore,
        gameLevel: prevState.gameLevel,
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
      comboBonus: game.comboBonus,
      scoreBonus: game.scoreBonus,
      harvest: game.harvest,
      wave: game.wave,
      supply: game.supply,
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

  const handlePendingLevelUpClose = () => {
    setIsPendingLevelUpOpen(false);
    if (openShopAfterLevelUp && game && game.cubesAvailable > 0) {
      navNavigate("ingameshop");
    }
    setOpenShopAfterLevelUp(false);
  };

  const handleSurrender = useCallback(async () => {
    if (!account || !game) return;
    try {
      await surrender({ account, game_id: game.id });
    } catch (error) {
      console.error("Surrender failed:", error);
    }
  }, [account, game, surrender]);

  const levelConfig = useMemo(() => {
    if (!game) return null;
    return generateLevelConfig(seed, game.level);
  }, [seed, game?.level, game]);

  const targetScore = gameLevel?.pointsRequired ?? levelConfig?.pointsRequired ?? 0;
  const maxMoves = gameLevel?.maxMoves ?? levelConfig?.maxMoves ?? 0;

  const isGridLoading =
    !!game && !game.isOver() && (!grid || grid.length === 0);

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

  const getBonusTooltip = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Combo:
        return "Add combo to next move";
      case BonusType.Score:
        return "Add bonus score";
      case BonusType.Harvest:
        return "Destroy all blocks of chosen size";
      case BonusType.Wave:
        return "Clear horizontal rows";
      case BonusType.Supply:
        return "Add new lines at no move cost";
      default:
        return "";
    }
  }, []);

  const getBonusIcon = useCallback((type: BonusType): string => {
    switch (type) {
      case BonusType.Combo:
        return imgAssets.combo;
      case BonusType.Score:
        return imgAssets.score;
      case BonusType.Harvest:
        return imgAssets.harvest;
      case BonusType.Wave:
        return imgAssets.wave;
      case BonusType.Supply:
        return imgAssets.supply;
      default:
        return "";
    }
  }, [imgAssets.combo, imgAssets.harvest, imgAssets.score, imgAssets.supply, imgAssets.wave]);

  const bonusCounts = useMemo<Record<BonusType, number>>(
    () => ({
      [BonusType.None]: 0,
      [BonusType.Combo]: game?.comboBonus ?? 0,
      [BonusType.Score]: game?.scoreBonus ?? 0,
      [BonusType.Harvest]: game?.harvest ?? 0,
      [BonusType.Wave]: game?.wave ?? 0,
      [BonusType.Supply]: game?.supply ?? 0,
    }),
    [game?.comboBonus, game?.scoreBonus, game?.harvest, game?.wave, game?.supply]
  );

  const handleBonusSelect = useCallback(
    (type: BonusType) => {
      const count = bonusCounts[type as keyof typeof bonusCounts] ?? 0;
      if (count === 0) return;
      if (activeBonus === type) {
        setActiveBonus(BonusType.None);
        setBonusDescription("");
      } else {
        setActiveBonus(type);
        setBonusDescription(getBonusDescription(type));
      }
    },
    [activeBonus, bonusCounts, getBonusDescription]
  );

  const selectedBonusSlots = useMemo(() => {
    if (!game) return [];

    const slots = [
      { slot: 0, value: game.selectedBonus1, level: game.bonus1Level },
      { slot: 1, value: game.selectedBonus2, level: game.bonus2Level },
      { slot: 2, value: game.selectedBonus3, level: game.bonus3Level },
    ];

    return slots.map((slot) => {
      const type = bonusTypeFromContractValue(slot.value);
      return {
        slot: slot.slot,
        type,
        level: slot.level,
        count: getBonusInventoryCount(game.runData, slot.value),
        icon: getBonusIcon(type),
        tooltip: getBonusTooltip(type),
      };
    });
  }, [
    game,
    game?.runData,
    game?.selectedBonus1,
    game?.selectedBonus2,
    game?.selectedBonus3,
    game?.bonus1Level,
    game?.bonus2Level,
    game?.bonus3Level,
    getBonusIcon,
    getBonusTooltip,
  ]);

  useEffect(() => {
    setActiveBonus(BonusType.None);
    setBonusDescription("");
  }, [grid]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Connect your wallet to play.
            </DialogDescription>
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

      {levelCompletionData && (
        <LevelCompleteDialog
          isOpen={isLevelCompleteOpen}
          onClose={() => {
            setIsLevelCompleteOpen(false);
            const completedLevel = levelCompletionData.level;
            const hasCubesToSpend = game && game.cubesAvailable > 0;
            const shopAvailable = isInGameShopAvailable(completedLevel);
            const shouldOpenShop = !!shopAvailable && !!hasCubesToSpend;

            if (game?.bossLevelUpPending) {
              setOpenShopAfterLevelUp(shouldOpenShop);
              setIsPendingLevelUpOpen(true);
              setLevelCompletionData(null);
              return;
            }

            if (shouldOpenShop) {
              setLevelCompletionData(null);
              navNavigate("ingameshop");
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
          gameLevel={levelCompletionData.gameLevel}
        />
      )}

      {game && (
        <PendingLevelUpDialog
          isOpen={isPendingLevelUpOpen}
          onClose={handlePendingLevelUpClose}
          gameId={game.id}
          runData={game.runData}
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
          onHome={goBack}
          constraintProgress={game.constraintProgress}
          constraint2Progress={game.constraint2Progress}
          constraint3Progress={game.runData.constraint3Progress}
          bonusUsedThisLevel={game.bonusUsedThisLevel}
          gameLevel={gameLevel}
          moves={game.levelMoves}
          maxMoves={maxMoves}
        />
      )}

      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-2 py-1">
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
              score={game.isOver() ? 0 : game.score}
              combo={game.isOver() ? 0 : game.combo}
              maxCombo={game.isOver() ? 0 : game.maxComboRun}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
            />
          </div>
        )}

        {game && game.over && !isGridLoading && !isGameLoading && (
          <div className="flex w-full flex-col items-center min-h-0 opacity-50 pointer-events-none">
            <GameBoard
              initialGrid={grid}
              nextLine={[]}
              score={0}
              combo={0}
              maxCombo={0}
              account={account}
              game={game}
              activeBonus={activeBonus}
              bonusDescription={bonusDescription}
            />
          </div>
        )}
      </div>

      {game && !game.over && !isGameLoading && !isGridLoading && (
        <GameActionBar
          bonusSlots={selectedBonusSlots.map((slot) => ({
            type: slot.type,
            count: slot.count,
            icon: slot.icon,
            tooltip: slot.tooltip,
            onClick: () => handleBonusSelect(slot.type),
          }))}
          activeBonus={activeBonus}
          bonusDescription={bonusDescription}
          onSurrender={handleSurrender}
          isGameOver={game.over}
        />
      )}
    </div>
  );
};

export default PlayScreen;
