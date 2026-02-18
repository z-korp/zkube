import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCubeBalance } from "@/hooks/useCubeBalance";
import { usePlayerMeta, type PlayerMetaData } from "@/hooks/usePlayerMeta";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";

const STARTING_BONUS_COSTS = [100, 250, 500] as const;
const BAG_SIZE_COSTS = [100, 250, 500] as const;
const BRIDGING_COSTS = [200, 500, 1000] as const;
const UNLOCK_BONUS_COST = 200;

type NumericMetaField =
  | "startingCombo"
  | "startingScore"
  | "startingHarvest"
  | "startingWave"
  | "startingSupply"
  | "bagComboLevel"
  | "bagScoreLevel"
  | "bagHarvestLevel"
  | "bagWaveLevel"
  | "bagSupplyLevel"
  | "bridgingRank";

type BooleanMetaField = "shrinkUnlocked" | "shuffleUnlocked";

type OptimisticMeta = Partial<Pick<PlayerMetaData, NumericMetaField | BooleanMetaField>>;

type BonusCardConfig = {
  id: number;
  name: string;
  icon: string;
  description: string;
  startField: NumericMetaField;
  bagField: NumericMetaField;
  upgradeBonusType: number;
  unlockField?: BooleanMetaField;
  unlockBonusType?: number;
};

const getStartingBonusCost = (level: number): number | null =>
  level < 3 ? STARTING_BONUS_COSTS[level] : null;

const getBagSizeCost = (level: number): number | null =>
  level < 3 ? BAG_SIZE_COSTS[level] : null;

const getBridgingCost = (rank: number): number | null =>
  rank < 3 ? BRIDGING_COSTS[rank] : null;

const getMaxCubesToBring = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

const LevelPips = ({ current, max = 3 }: { current: number; max?: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: max }).map((_, index) => (
      <span
        key={`pip-${index}`}
        className={`h-2 w-2 rounded-full ${
          index < current ? "bg-yellow-300" : "bg-slate-500/70"
        }`}
      />
    ))}
  </div>
);

const ShopPage = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { account } = useAccountCustom();
  const { playSfx } = useMusicPlayer();
  const { playerMeta } = usePlayerMeta();
  const { cubeBalance, refetch: refetchCubeBalance } = useCubeBalance();
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const {
    setup: {
      systemCalls: {
        upgradeStartingBonus,
        upgradeBagSize,
        upgradeBridgingRank,
        unlockBonus,
      },
    },
  } = useDojo();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticMeta, setOptimisticMeta] = useState<OptimisticMeta>({});
  const [optimisticCubeSpent, setOptimisticCubeSpent] = useState(0);

  const mergedMeta = useMemo(() => {
    const chainMeta = playerMeta?.data;
    if (!chainMeta) return null;
    return { ...chainMeta, ...optimisticMeta };
  }, [playerMeta?.data, optimisticMeta]);

  useEffect(() => {
    setOptimisticMeta({});
    setOptimisticCubeSpent(0);
  }, [playerMeta?.data]);

  const cubeBalanceDisplay = Math.max(0, Number(cubeBalance) - optimisticCubeSpent);

  const bonusCards = useMemo<BonusCardConfig[]>(
    () => [
      {
        id: 0,
        name: "Combo",
        icon: imgAssets.combo,
        description: "Add combo to your next move.",
        startField: "startingCombo",
        bagField: "bagComboLevel",
        upgradeBonusType: 0,
      },
      {
        id: 1,
        name: "Score",
        icon: imgAssets.score,
        description: "Add instant score for clutch clears.",
        startField: "startingScore",
        bagField: "bagScoreLevel",
        upgradeBonusType: 1,
      },
      {
        id: 2,
        name: "Harvest",
        icon: imgAssets.harvest,
        description: "Clear one block size and mint more cubes.",
        startField: "startingHarvest",
        bagField: "bagHarvestLevel",
        upgradeBonusType: 2,
      },
      {
        id: 3,
        name: "Wave",
        icon: imgAssets.wave,
        description: "Wipe whole rows when your board gets messy.",
        startField: "startingWave",
        bagField: "bagWaveLevel",
        upgradeBonusType: 3,
        unlockField: "shrinkUnlocked",
        unlockBonusType: 4,
      },
      {
        id: 4,
        name: "Supply",
        icon: imgAssets.supply,
        description: "Add controlled pressure lines without spending moves.",
        startField: "startingSupply",
        bagField: "bagSupplyLevel",
        upgradeBonusType: 4,
        unlockField: "shuffleUnlocked",
        unlockBonusType: 5,
      },
    ],
    [imgAssets.combo, imgAssets.harvest, imgAssets.score, imgAssets.supply, imgAssets.wave],
  );

  const applyOptimisticNumber = useCallback(
    (field: NumericMetaField, value: number, cost: number) => {
      setOptimisticMeta((previous) => ({ ...previous, [field]: value }));
      setOptimisticCubeSpent((previous) => previous + cost);
    },
    [],
  );

  const applyOptimisticBoolean = useCallback(
    (field: BooleanMetaField, value: boolean, cost: number) => {
      setOptimisticMeta((previous) => ({ ...previous, [field]: value }));
      setOptimisticCubeSpent((previous) => previous + cost);
    },
    [],
  );

  const revertOptimistic = useCallback(
    (field: NumericMetaField | BooleanMetaField, cost: number) => {
      setOptimisticMeta((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
      setOptimisticCubeSpent((previous) => Math.max(0, previous - cost));
    },
    [],
  );

  const handleUpgradeStarting = useCallback(
    async (card: BonusCardConfig) => {
      if (!account || !mergedMeta) return;
      const currentLevel = mergedMeta[card.startField];
      const cost = getStartingBonusCost(currentLevel);
      if (cost === null || cubeBalanceDisplay < cost) return;

      applyOptimisticNumber(card.startField, currentLevel + 1, cost);
      setIsSubmitting(true);
      try {
        await upgradeStartingBonus({
          account,
          bonus_type: card.upgradeBonusType,
        });
        playSfx("shop-purchase");
        setOptimisticCubeSpent(0);
        await refetchCubeBalance();
      } catch (error) {
        console.error("Starting bonus upgrade failed:", error);
        revertOptimistic(card.startField, cost);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      account,
      applyOptimisticNumber,
      cubeBalanceDisplay,
      mergedMeta,
      refetchCubeBalance,
      revertOptimistic,
      playSfx,
      upgradeStartingBonus,
    ],
  );

  const handleUpgradeBag = useCallback(
    async (card: BonusCardConfig) => {
      if (!account || !mergedMeta) return;
      const currentLevel = mergedMeta[card.bagField];
      const cost = getBagSizeCost(currentLevel);
      if (cost === null || cubeBalanceDisplay < cost) return;

      applyOptimisticNumber(card.bagField, currentLevel + 1, cost);
      setIsSubmitting(true);
      try {
        await upgradeBagSize({
          account,
          bonus_type: card.upgradeBonusType,
        });
        playSfx("shop-purchase");
        setOptimisticCubeSpent(0);
        await refetchCubeBalance();
      } catch (error) {
        console.error("Bag size upgrade failed:", error);
        revertOptimistic(card.bagField, cost);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      account,
      applyOptimisticNumber,
      cubeBalanceDisplay,
      mergedMeta,
      refetchCubeBalance,
      revertOptimistic,
      playSfx,
      upgradeBagSize,
    ],
  );

  const handleUnlock = useCallback(
    async (card: BonusCardConfig) => {
      if (!account || !mergedMeta || !card.unlockField || !card.unlockBonusType) return;
      if (mergedMeta[card.unlockField] || cubeBalanceDisplay < UNLOCK_BONUS_COST) return;

      applyOptimisticBoolean(card.unlockField, true, UNLOCK_BONUS_COST);
      setIsSubmitting(true);
      try {
        await unlockBonus({
          account,
          bonus_type: card.unlockBonusType,
        });
        setOptimisticCubeSpent(0);
        await refetchCubeBalance();
      } catch (error) {
        console.error("Bonus unlock failed:", error);
        revertOptimistic(card.unlockField, UNLOCK_BONUS_COST);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      account,
      applyOptimisticBoolean,
      cubeBalanceDisplay,
      mergedMeta,
      refetchCubeBalance,
      revertOptimistic,
      unlockBonus,
    ],
  );

  const handleUpgradeBridging = useCallback(async () => {
    if (!account || !mergedMeta) return;
    const currentRank = mergedMeta.bridgingRank;
    const cost = getBridgingCost(currentRank);
    if (cost === null || cubeBalanceDisplay < cost) return;

    applyOptimisticNumber("bridgingRank", currentRank + 1, cost);
    setIsSubmitting(true);
    try {
      await upgradeBridgingRank({ account });
      setOptimisticCubeSpent(0);
      await refetchCubeBalance();
    } catch (error) {
      console.error("Bridging rank upgrade failed:", error);
      revertOptimistic("bridgingRank", cost);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    account,
    applyOptimisticNumber,
    cubeBalanceDisplay,
    mergedMeta,
    refetchCubeBalance,
    revertOptimistic,
    upgradeBridgingRank,
  ]);

  const bridgingRank = mergedMeta?.bridgingRank ?? 0;
  const bridgingCost = getBridgingCost(bridgingRank);
  const bridgingMaxed = bridgingCost === null;
  const canAffordBridging = !bridgingMaxed && cubeBalanceDisplay >= (bridgingCost ?? 0);

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <ThemeBackground />

      <PageTopBar title="SHOP" onBack={goBack} cubeBalance={BigInt(cubeBalanceDisplay)} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mx-auto flex max-w-[820px] flex-col gap-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-300/25 bg-black/40 px-4 py-3 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-['Fredericka_the_Great'] text-xl text-amber-100">
                  Permanent Upgrades
                </p>
                <p className="text-xs text-slate-300">
                  Improve starting charges, bag size, and bridging every run.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">Wallet</p>
                <p className="font-['Bangers'] text-3xl leading-none text-yellow-300">
                  {cubeBalanceDisplay}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bonusCards.map((card, index) => {
              const startLevel = mergedMeta?.[card.startField] ?? 0;
              const bagLevel = mergedMeta?.[card.bagField] ?? 0;
              const startCost = getStartingBonusCost(startLevel);
              const bagCost = getBagSizeCost(bagLevel);
              const startMaxed = startCost === null;
              const bagMaxed = bagCost === null;
              const isLocked = card.unlockField ? !mergedMeta?.[card.unlockField] : false;
              const canAffordStart = !isLocked && !startMaxed && cubeBalanceDisplay >= (startCost ?? 0);
              const canAffordBag = !isLocked && !bagMaxed && cubeBalanceDisplay >= (bagCost ?? 0);

              return (
                <motion.section
                  key={card.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border border-slate-300/15 bg-slate-900/65 p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)]"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <div className="rounded-xl border border-white/15 bg-white/10 p-2">
                      <img src={card.icon} alt={card.name} className="h-10 w-10" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-['Fredericka_the_Great'] text-xl leading-none text-white">
                        {card.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300">{card.description}</p>
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="space-y-2 rounded-xl border border-orange-300/30 bg-orange-900/20 p-3">
                      <p className="text-xs text-orange-100">Unlock this bonus first.</p>
                      <button
                        type="button"
                        disabled={isSubmitting || cubeBalanceDisplay < UNLOCK_BONUS_COST}
                        onClick={() => handleUnlock(card)}
                        className="w-full rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        UNLOCK {UNLOCK_BONUS_COST} 🧊
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-300">
                          <span>Starting Charges</span>
                          <LevelPips current={startLevel} />
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting || startMaxed || !canAffordStart}
                          onClick={() => handleUpgradeStarting(card)}
                          className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {startMaxed ? "MAX LEVEL" : `UPGRADE ${startCost} 🧊`}
                        </button>
                      </div>

                      <div className="rounded-xl bg-slate-800/80 p-3">
                        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-300">
                          <span>Bag Capacity</span>
                          <LevelPips current={bagLevel} />
                        </div>
                        <button
                          type="button"
                          disabled={isSubmitting || bagMaxed || !canAffordBag}
                          onClick={() => handleUpgradeBag(card)}
                          className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {bagMaxed ? "MAX LEVEL" : `UPGRADE ${bagCost} 🧊`}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.section>
              );
            })}

            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: bonusCards.length * 0.04 }}
              className="rounded-2xl border border-indigo-300/20 bg-indigo-950/45 p-4 shadow-[0_18px_40px_-28px_rgba(30,27,75,0.9)]"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="rounded-xl border border-indigo-200/30 bg-indigo-400/20 p-2">
                  <ArrowUpRight className="h-10 w-10 text-indigo-100" />
                </div>
                <div className="flex-1">
                  <h3 className="font-['Fredericka_the_Great'] text-xl leading-none text-indigo-50">
                    Bridging Rank
                  </h3>
                  <p className="mt-1 text-xs text-indigo-100/80">
                    Carry wallet cubes into runs for rest-stop purchases.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-100/80">Rank</span>
                  <LevelPips current={bridgingRank} />
                </div>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-indigo-100/75">Max cubes per run</p>
                    <p className="font-['Bangers'] text-3xl leading-none text-yellow-300">
                      {getMaxCubesToBring(bridgingRank)}
                    </p>
                  </div>
                  <Sparkles className="h-6 w-6 text-yellow-200/80" />
                </div>
                <button
                  type="button"
                  disabled={isSubmitting || bridgingMaxed || !canAffordBridging}
                  onClick={handleUpgradeBridging}
                  className="w-full rounded-lg bg-indigo-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bridgingMaxed ? "MAX RANK" : `UPGRADE ${bridgingCost} 🧊`}
                </button>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
