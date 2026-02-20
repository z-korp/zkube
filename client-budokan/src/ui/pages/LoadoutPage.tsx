import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useDojo } from "@/dojo/useDojo";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import useAccountCustom from "@/hooks/useAccountCustom";
import { BonusType, bonusTypeToContractValue } from "@/dojo/game/types/bonus";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { showToast } from "@/utils/toast";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import GameButton from "@/ui/components/shared/GameButton";
import { Slider } from "@/ui/elements/slider";
import useViewport from "@/hooks/useViewport";

const LOADOUT_STORAGE_KEY = "zkube_loadout";

interface LoadoutData {
  selectedBonuses: BonusType[];
  cubesToBring: number;
}

const loadSavedLoadout = (): LoadoutData | null => {
  try {
    const saved = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    /* noop */
  }
  return null;
};

const saveLoadout = (loadout: LoadoutData) => {
  try {
    localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  } catch {
    /* noop */
  }
};

const ALL_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Score,
  BonusType.Harvest,
  BonusType.Wave,
  BonusType.Supply,
];

const DEFAULT_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Harvest,
  BonusType.Score,
];

const getMaxCubesForRank = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

const LoadoutPage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const { themeTemplate } = useTheme();
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const { playerMeta } = usePlayerMeta();
  const { username } = useControllerUsername();
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);
  const imgAssets = ImageAssets(themeTemplate);

  const {
    setup: {
      systemCalls: { freeMint, create },
    },
  } = useDojo();

  const [selected, setSelected] = useState<BonusType[]>(DEFAULT_BONUSES);
  const [cubesToBring, setCubesToBring] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const autoStartTriggered = useRef(false);

  const playerMetaData = playerMeta?.data ?? null;
  const bridgingRank = playerMetaData?.bridgingRank ?? 0;
  const maxCubesAllowed = getMaxCubesForRank(bridgingRank);
  const cubeBalanceNum = Number(cubeBalance);
  const actualMaxCubes = Math.min(maxCubesAllowed, cubeBalanceNum);
  const canBringCubes = bridgingRank > 0 && cubeBalanceNum > 0;

  useEffect(() => {
    const saved = loadSavedLoadout();
    if (saved) {
      const validBonuses = saved.selectedBonuses.filter((b) => {
        if (b === BonusType.Wave) return playerMetaData?.shrinkUnlocked;
        if (b === BonusType.Supply) return playerMetaData?.shuffleUnlocked;
        return true;
      });
      setSelected(validBonuses.length === 3 ? validBonuses : DEFAULT_BONUSES);
      setCubesToBring(Math.min(saved.cubesToBring, actualMaxCubes));
    }
  }, [playerMetaData, actualMaxCubes]);

  const unlockedMap = useMemo(
    (): Record<BonusType, boolean> => ({
      [BonusType.None]: true,
      [BonusType.Combo]: true,
      [BonusType.Score]: true,
      [BonusType.Harvest]: true,
      [BonusType.Wave]: playerMetaData?.shrinkUnlocked ?? false,
      [BonusType.Supply]: playerMetaData?.shuffleUnlocked ?? false,
    }),
    [playerMetaData],
  );

  const unlockedBonuses = useMemo(
    () => ALL_BONUSES.filter((b) => unlockedMap[b]),
    [unlockedMap],
  );

  const getBonusIcon = (type: BonusType): string => {
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
  };

  const getBonusStats = (type: BonusType) => {
    if (!playerMetaData) return { bagSize: 0, startingCount: 0 };
    switch (type) {
      case BonusType.Combo:
        return {
          bagSize: playerMetaData.bagComboLevel,
          startingCount: playerMetaData.startingCombo,
        };
      case BonusType.Harvest:
        return {
          bagSize: playerMetaData.bagHarvestLevel,
          startingCount: playerMetaData.startingHarvest,
        };
      case BonusType.Score:
        return {
          bagSize: playerMetaData.bagScoreLevel,
          startingCount: playerMetaData.startingScore,
        };
      case BonusType.Wave:
        return {
          bagSize: playerMetaData.bagWaveLevel,
          startingCount: playerMetaData.startingWave,
        };
      case BonusType.Supply:
        return {
          bagSize: playerMetaData.bagSupplyLevel,
          startingCount: playerMetaData.startingSupply,
        };
      default:
        return { bagSize: 0, startingCount: 0 };
    }
  };

  const toggleBonus = (type: BonusType) => {
    if (!unlockedMap[type]) return;
    setSelected((prev) => {
      if (prev.includes(type)) return prev.filter((b) => b !== type);
      if (prev.length >= 3) return prev;
      return [...prev, type];
    });
  };

  const handleStartGame = useCallback(async (bonusOverride?: BonusType[]) => {
    const bonuses = bonusOverride ?? selected;
    if (!account || bonuses.length !== 3) return;

    if (cubesToBring > 0) {
      await refetchCubeBalance?.();
      const currentBalance = Number(cubeBalance);
      if (cubesToBring > currentBalance) {
        showToast({
          message: `Insufficient cubes. You have ${currentBalance} but tried to bring ${cubesToBring}.`,
          type: "error",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      saveLoadout({ selectedBonuses: bonuses, cubesToBring });

      const mintResult = await freeMint({
        account,
        name: username ?? "",
        settingsId: DEFAULT_SETTINGS_ID,
      });

      const gameId = mintResult.game_id;
      if (!gameId) throw new Error("Failed to extract game_id from mint");

      const selectedValues = bonuses.map((type) =>
        bonusTypeToContractValue(type),
      );
      await create({
        account,
        token_id: gameId,
        selected_bonuses: selectedValues,
        cubes_amount: cubesToBring,
      });

      showToast({
        message:
          cubesToBring > 0
            ? `Game #${gameId} started with ${cubesToBring} cubes!`
            : `Game #${gameId} started!`,
        type: "success",
      });

      navigate("play", gameId);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game. Check My Games if a token was minted.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    account,
    selected,
    cubesToBring,
    cubeBalance,
    refetchCubeBalance,
    username,
    freeMint,
    create,
    navigate,
  ]);

  // Auto-skip when only 3 bonuses are unlocked (no choice to make)
  useEffect(() => {
    if (autoStartTriggered.current) return;
    if (!playerMetaData || !account) return;
    if (unlockedBonuses.length !== 3) return;

    autoStartTriggered.current = true;
    handleStartGame(unlockedBonuses);
  }, [playerMetaData, account, unlockedBonuses, handleStartGame]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />
      <PageTopBar
        title="SELECT LOADOUT"
        onBack={goBack}
        cubeBalance={cubeBalance}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[520px] mx-auto flex flex-col gap-6 pb-8">
          <section className="bg-slate-900/80 rounded-xl border border-slate-600/60 p-4">
            <p className="text-center text-sm text-slate-400 mb-3">
              Select 3 Bonuses ({selected.length}/3)
            </p>

            {selected.length !== 3 && (
              <div className="text-center text-sm text-orange-400 mb-3 bg-orange-500/10 py-2 rounded-lg">
                You must select exactly 3 bonuses to start
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ALL_BONUSES.map((bonusType, index) => {
                const isSelected = selected.includes(bonusType);
                const isLocked = !unlockedMap[bonusType];
                const icon = getBonusIcon(bonusType);
                const stats = getBonusStats(bonusType);

                return (
                  <motion.button
                    key={bonusType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    whileTap={isLocked ? undefined : { scale: 0.95 }}
                    onClick={() => toggleBonus(bonusType)}
                    disabled={isLocked}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_12px_rgba(250,204,21,0.15)]"
                        : "border-slate-700 bg-slate-800/40"
                    } ${isLocked ? "opacity-40 cursor-not-allowed grayscale" : "hover:border-slate-500"}`}
                  >
                    <img
                      src={icon}
                      alt={bonusType}
                      className={`w-10 h-10 ${isLocked ? "grayscale" : ""}`}
                    />
                    <span
                      className={`text-xs font-semibold ${isLocked ? "text-slate-500" : "text-white"}`}
                    >
                      {bonusType}
                    </span>

                    {!isLocked && (
                      <div className="flex gap-1 mt-0.5">
                        {stats.startingCount > 0 && (
                          <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded">
                            +{stats.startingCount}
                          </span>
                        )}
                        {stats.bagSize > 0 && (
                          <span className="bg-blue-500/20 text-blue-400 text-[9px] px-1.5 py-0.5 rounded">
                            Bag {stats.bagSize}
                          </span>
                        )}
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute top-1.5 right-1.5">
                        <Lock size={12} className="text-red-400" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {canBringCubes && (
            <section className="bg-slate-900/80 rounded-xl border border-slate-600/60 p-4">
              <p className="text-center text-sm text-slate-400 mb-3">
                Bring Cubes (Max {maxCubesAllowed})
              </p>

              <div className="text-center mb-3 bg-slate-800/50 py-2 rounded-lg">
                <span className="text-sm font-semibold text-yellow-400">
                  Wallet: {cubeBalanceNum.toLocaleString()} 🧊
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">
                  Bridging Rank {bridgingRank}
                </span>
              </div>

              {actualMaxCubes > 0 && (
                <div className="px-2 mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-400">
                      Cubes to bring:
                    </span>
                    <span className="text-sm font-bold text-yellow-400">
                      {cubesToBring}
                    </span>
                  </div>
                  <Slider
                    value={[cubesToBring]}
                    onValueChange={(value) => setCubesToBring(value[0])}
                    min={0}
                    max={actualMaxCubes}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              {cubesToBring > 0 && (
                <p className="text-center text-[10px] text-orange-400">
                  Warning: Brought cubes are lost if you die!
                </p>
              )}
            </section>
          )}

          <div className="flex flex-col gap-3">
            <GameButton
              label={
                cubesToBring > 0
                  ? `START GAME WITH ${cubesToBring} CUBES`
                  : "START GAME"
              }
              variant="primary"
              disabled={selected.length !== 3}
              loading={isLoading}
              onClick={() => handleStartGame()}
            />
            <GameButton
              label="CANCEL"
              variant="secondary"
              onClick={goBack}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadoutPage;
