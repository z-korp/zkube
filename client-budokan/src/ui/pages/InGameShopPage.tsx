import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { RefreshCcw, WandSparkles } from "lucide-react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useDojo } from "@/dojo/useDojo";
import {
  getBonusChargeCost,
  getBonusInventoryCount,
  getCubesAvailable,
  getSelectedBonusName,
  LEVEL_UP_COST,
  SWAP_BONUS_COST,
  ConsumableType,
} from "@/dojo/game/helpers/runDataPacking";
import { Bonus } from "@/dojo/game/types/bonus";
import { useGame } from "@/hooks/useGame";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import ImageAssets from "@/ui/theme/ImageAssets";
import PageTopBar from "@/ui/navigation/PageTopBar";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import GameButton from "@/ui/components/shared/GameButton";

type BonusSlot = 0 | 1 | 2;
type SlotRecord = Record<BonusSlot, number>;

const ALL_SLOTS: BonusSlot[] = [0, 1, 2];

const InGameShopPage = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const navigate = useNavigationStore((s) => s.navigate);
  const gameId = useNavigationStore((s) => s.gameId);

  const { account } = useAccountCustom();
  const { playSfx } = useMusicPlayer();
  const { playerMeta } = usePlayerMeta();
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  const {
    setup: {
      systemCalls: { purchaseConsumable, allocateCharge, levelUpBonus, swapBonus },
    },
  } = useDojo();

  const { game } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });

  const runData = game?.runData;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [swapSlot, setSwapSlot] = useState<BonusSlot | null>(null);
  const [optimisticSpent, setOptimisticSpent] = useState(0);
  const [optimisticShopPurchases, setOptimisticShopPurchases] = useState(0);
  const [optimisticCounts, setOptimisticCounts] = useState<Partial<SlotRecord>>({});
  const [optimisticLevels, setOptimisticLevels] = useState<Partial<SlotRecord>>({});
  const [optimisticSelections, setOptimisticSelections] = useState<Partial<SlotRecord>>({});

  useEffect(() => {
    setSwapSlot(null);
    setOptimisticSpent(0);
    setOptimisticShopPurchases(0);
    setOptimisticCounts({});
    setOptimisticLevels({});
    setOptimisticSelections({});
  }, [game?.id, runData?.shopPurchases]);

  const bonusBagSizes = useMemo(() => {
    const meta = playerMeta?.data;
    return {
      1: 1 + (meta?.bagComboLevel ?? 0),
      2: 1 + (meta?.bagScoreLevel ?? 0),
      3: 1 + (meta?.bagHarvestLevel ?? 0),
      4: 1 + (meta?.bagWaveLevel ?? 0),
      5: 1 + (meta?.bagSupplyLevel ?? 0),
    };
  }, [playerMeta?.data]);

  const selectedBonuses = useMemo(() => {
    if (!runData) return [];

    const base: SlotRecord = {
      0: runData.selectedBonus1,
      1: runData.selectedBonus2,
      2: runData.selectedBonus3,
    };
    const baseLevels: SlotRecord = {
      0: runData.bonus1Level,
      1: runData.bonus2Level,
      2: runData.bonus3Level,
    };

    return ALL_SLOTS.map((slot) => {
      const value = optimisticSelections[slot] ?? base[slot];
      const level = optimisticLevels[slot] ?? baseLevels[slot];
      const countBase = getBonusInventoryCount(runData, value);
      const count = optimisticCounts[slot] ?? countBase;

      return {
        slot,
        value,
        level,
        count,
      };
    }).filter((item) => item.value !== 0);
  }, [optimisticCounts, optimisticLevels, optimisticSelections, runData]);

  const selectedValues = selectedBonuses.map((item) => item.value);
  const swapTargets = Bonus.getAllBonuses().filter(
    (bonus) => !selectedValues.includes(bonus.into()),
  );

  const baseCubesAvailable = runData ? getCubesAvailable(runData) : 0;
  const cubesAvailable = Math.max(0, baseCubesAvailable - optimisticSpent);
  const chargeCost = runData
    ? getBonusChargeCost(runData.shopPurchases + optimisticShopPurchases)
    : 0;

  const getIcon = useCallback(
    (selectedBonusValue: number): string => {
      switch (selectedBonusValue) {
        case 1:
          return imgAssets.combo;
        case 2:
          return imgAssets.score;
        case 3:
          return imgAssets.harvest;
        case 4:
          return imgAssets.wave;
        case 5:
          return imgAssets.supply;
        default:
          return "";
      }
    },
    [imgAssets.combo, imgAssets.harvest, imgAssets.score, imgAssets.supply, imgAssets.wave],
  );

  const handleBuyCharge = useCallback(async () => {
    if (!account || !gameId || !runData || cubesAvailable < chargeCost) return;

    setOptimisticSpent((previous) => previous + chargeCost);
    setOptimisticShopPurchases((previous) => previous + 1);
    setIsSubmitting(true);

    try {
      await purchaseConsumable({
        account,
        game_id: gameId,
        consumable_type: ConsumableType.Refill,
        bonus_slot: 0,
      });
      playSfx("shop-purchase");
    } catch (error) {
      console.error("Buy charge failed:", error);
      setOptimisticSpent((previous) => Math.max(0, previous - chargeCost));
      setOptimisticShopPurchases((previous) => Math.max(0, previous - 1));
    } finally {
      setIsSubmitting(false);
    }
  }, [account, chargeCost, cubesAvailable, gameId, playSfx, purchaseConsumable, runData]);

  const handleAllocate = useCallback(
    async (slot: BonusSlot) => {
      if (!account || !gameId || !runData) return;

      const bonus = selectedBonuses.find((item) => item.slot === slot);
      if (!bonus) return;
      const bagMax = bonusBagSizes[bonus.value as keyof typeof bonusBagSizes] ?? 0;
      if (bonus.count >= bagMax) return;

      setOptimisticCounts((previous) => ({
        ...previous,
        [slot]: (previous[slot] ?? bonus.count) + 1,
      }));
      setIsSubmitting(true);

      try {
        await allocateCharge({
          account,
          game_id: gameId,
          bonus_slot: slot,
        });
      } catch (error) {
        console.error("Allocate charge failed:", error);
        setOptimisticCounts((previous) => {
          const next = { ...previous };
          delete next[slot];
          return next;
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, allocateCharge, bonusBagSizes, gameId, runData, selectedBonuses],
  );

  const handleLevelUp = useCallback(
    async (slot: BonusSlot) => {
      if (!account || !gameId || !runData || cubesAvailable < LEVEL_UP_COST) return;

      const bonus = selectedBonuses.find((item) => item.slot === slot);
      if (!bonus || bonus.level >= 2) return;

      setOptimisticSpent((previous) => previous + LEVEL_UP_COST);
      setOptimisticLevels((previous) => ({
        ...previous,
        [slot]: (previous[slot] ?? bonus.level) + 1,
      }));
      setIsSubmitting(true);

      try {
        await levelUpBonus({
          account,
          game_id: gameId,
          bonus_slot: slot,
        });
      } catch (error) {
        console.error("Level up failed:", error);
        setOptimisticSpent((previous) => Math.max(0, previous - LEVEL_UP_COST));
        setOptimisticLevels((previous) => {
          const next = { ...previous };
          delete next[slot];
          return next;
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, cubesAvailable, gameId, levelUpBonus, runData, selectedBonuses],
  );

  const handleSwap = useCallback(
    async (slot: BonusSlot, newBonusType: number) => {
      if (!account || !gameId || !runData || cubesAvailable < SWAP_BONUS_COST) return;

      const bonus = selectedBonuses.find((item) => item.slot === slot);
      if (!bonus) return;

      setOptimisticSpent((previous) => previous + SWAP_BONUS_COST);
      setOptimisticSelections((previous) => ({
        ...previous,
        [slot]: newBonusType,
      }));
      setSwapSlot(null);
      setIsSubmitting(true);

      try {
        await swapBonus({
          account,
          game_id: gameId,
          bonus_slot: slot,
          new_bonus_type: newBonusType,
        });
      } catch (error) {
        console.error("Swap bonus failed:", error);
        setOptimisticSpent((previous) => Math.max(0, previous - SWAP_BONUS_COST));
        setOptimisticSelections((previous) => {
          const next = { ...previous };
          delete next[slot];
          return next;
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, cubesAvailable, gameId, runData, selectedBonuses, swapBonus],
  );

  const handleContinue = useCallback(() => {
    if (gameId !== null) {
      navigate("play", gameId);
      return;
    }
    navigate("play");
  }, [gameId, navigate]);

  const missingGame = !gameId || !game || !runData;

  return (
    <div className="h-screen-viewport flex flex-col text-white">
      <ThemeBackground />

      <PageTopBar title="SHOP" onBack={goBack} cubeBalance={BigInt(cubesAvailable)} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="mx-auto flex max-w-[860px] flex-col gap-4 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-cyan-300/30 bg-slate-900/90 px-4 py-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-['Fredericka_the_Great'] text-xl text-cyan-50">Shop</p>
                <p className="text-xs text-cyan-100/80">Spend run cubes before diving back in.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/75">Available</p>
                <p className="font-['Fredericka_the_Great'] text-4xl leading-none text-yellow-300">{cubesAvailable}</p>
              </div>
            </div>
          </motion.div>

          {missingGame ? (
            <div className="rounded-2xl border border-slate-300/20 bg-slate-900/90 px-5 py-8 text-center backdrop-blur-md">
              <p className="font-['Fredericka_the_Great'] text-2xl text-white">Run not found</p>
              <p className="mt-2 text-sm text-slate-300">Open this page from an active game shop.</p>
            </div>
          ) : (
            <>
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
                className="rounded-2xl border border-emerald-400/30 bg-slate-900/90 p-4 backdrop-blur-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-['Fredericka_the_Great'] text-xl text-emerald-50">CHARGES</h2>
                  <span className="font-['Fredericka_the_Great'] text-2xl text-emerald-200">{chargeCost} 🧊</span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting || cubesAvailable < chargeCost}
                  onClick={handleBuyCharge}
                  className="mb-4 w-full rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  BUY +1 CHARGE ({chargeCost} 🧊)
                </button>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {selectedBonuses.map((bonus, index) => {
                    const bagMax = bonusBagSizes[bonus.value as keyof typeof bonusBagSizes] ?? 0;
                    const isBagFull = bonus.count >= bagMax;
                    const currentLevel = bonus.level + 1;

                    return (
                      <motion.div
                        key={`charge-slot-${bonus.slot}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 + index * 0.04 }}
                        className="rounded-xl border border-emerald-300/25 bg-black/50 p-3"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <img src={getIcon(bonus.value)} alt={getSelectedBonusName(bonus.value)} className="h-9 w-9" />
                          <div>
                            <p className="text-sm font-semibold text-white">{getSelectedBonusName(bonus.value)}</p>
                            <p className="font-['Fredericka_the_Great'] text-xl leading-none text-emerald-200">
                              {bonus.count}/{bagMax} · Lv{currentLevel}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSubmitting || isBagFull}
                          onClick={() => handleAllocate(bonus.slot as BonusSlot)}
                          className="w-full rounded-lg bg-emerald-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBagFull ? "BAG FULL" : "ALLOCATE CHARGE"}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-2xl border border-violet-400/30 bg-slate-900/90 p-4 backdrop-blur-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-['Fredericka_the_Great'] text-xl text-violet-50">LEVEL UP</h2>
                  <span className="font-['Fredericka_the_Great'] text-2xl text-violet-100">{LEVEL_UP_COST} 🧊</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {selectedBonuses.map((bonus, index) => {
                    const isMax = bonus.level >= 2;
                    return (
                      <motion.div
                        key={`level-slot-${bonus.slot}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.04 }}
                        className="rounded-xl border border-violet-300/25 bg-black/50 p-3"
                      >
                        <p className="mb-2 text-sm font-semibold text-white">{getSelectedBonusName(bonus.value)}</p>
                        <p className="mb-2 font-['Fredericka_the_Great'] text-2xl leading-none text-violet-100">
                          LEVEL {bonus.level + 1}/3
                        </p>
                        <button
                          type="button"
                          disabled={isSubmitting || isMax || cubesAvailable < LEVEL_UP_COST}
                          onClick={() => handleLevelUp(bonus.slot as BonusSlot)}
                          className="w-full rounded-lg bg-violet-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isMax ? "MAX LEVEL" : `LEVEL UP (${LEVEL_UP_COST} 🧊)`}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="rounded-2xl border border-amber-400/30 bg-slate-900/90 p-4 backdrop-blur-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-['Fredericka_the_Great'] text-xl text-amber-50">SWAP BONUS</h2>
                  <span className="font-['Fredericka_the_Great'] text-2xl text-amber-100">{SWAP_BONUS_COST} 🧊</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {selectedBonuses.map((bonus, index) => (
                    <motion.div
                      key={`swap-slot-${bonus.slot}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.14 + index * 0.04 }}
                      className="rounded-xl border border-amber-300/25 bg-black/50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{getSelectedBonusName(bonus.value)}</p>
                        <RefreshCcw className="h-4 w-4 text-amber-100/70" />
                      </div>

                      {swapSlot === bonus.slot ? (
                        <div className="space-y-1.5">
                          {swapTargets.map((target) => (
                            <button
                              key={`swap-target-${bonus.slot}-${target.into()}`}
                              type="button"
                              disabled={isSubmitting || cubesAvailable < SWAP_BONUS_COST}
                              onClick={() => handleSwap(bonus.slot as BonusSlot, target.into())}
                              className="w-full rounded-lg bg-amber-300 px-2 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              → {target.getName()}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSwapSlot(null)}
                            className="w-full rounded-lg border border-amber-100/35 bg-transparent px-2 py-1.5 text-xs font-semibold text-amber-50 transition hover:bg-amber-100/10"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting || cubesAvailable < SWAP_BONUS_COST}
                          onClick={() => setSwapSlot(bonus.slot as BonusSlot)}
                          className="w-full rounded-lg bg-amber-300 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          SWAP ({SWAP_BONUS_COST} 🧊)
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="pt-2"
          >
            <GameButton
              label="CONTINUE RUN"
              variant="primary"
              loading={false}
              disabled={false}
              onClick={handleContinue}
            />
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-300">
              <WandSparkles className="h-3.5 w-3.5" />
              Actions apply immediately on-chain.
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InGameShopPage;
