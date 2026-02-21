import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUp, RefreshCcw } from "lucide-react";
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
        consumable_type: ConsumableType.BonusCharge,
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

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[860px] flex-col gap-4 pb-10">
          {/* Header */}
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
              {/* Buy Charge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 }}
              >
                <button
                  type="button"
                  disabled={isSubmitting || cubesAvailable < chargeCost}
                  onClick={handleBuyCharge}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  BUY +1 CHARGE ({chargeCost} 🧊)
                </button>
              </motion.div>

              {/* Bonus Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {selectedBonuses.map((bonus, index) => {
                  const bonusObj = Bonus.fromContractValue(bonus.value);
                  const bagMax = bonusBagSizes[bonus.value as keyof typeof bonusBagSizes] ?? 0;
                  const isBagFull = bonus.count >= bagMax;
                  const isMaxLevel = bonus.level >= 2;
                  const upgradePreview = bonusObj.getUpgradePreview(bonus.level);

                  return (
                    <motion.section
                      key={`bonus-card-${bonus.slot}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 + index * 0.05 }}
                      className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-md"
                    >
                      {/* Card Header: Icon + Name + Level */}
                      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10">
                          <img
                            src={getIcon(bonus.value)}
                            alt={getSelectedBonusName(bonus.value)}
                            className="h-8 w-8"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-['Fredericka_the_Great'] text-xl text-white">
                            {getSelectedBonusName(bonus.value)}
                          </p>
                          <p className="text-xs text-cyan-200/80">
                            {bonusObj.getEffect(bonus.level)}
                          </p>
                        </div>
                        <div className="flex flex-col items-center rounded-lg bg-white/10 px-2.5 py-1">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Lv</span>
                          <span className="font-['Fredericka_the_Great'] text-lg leading-none text-white">
                            {bonus.level + 1}
                          </span>
                        </div>
                      </div>

                      {/* Card Body: Actions */}
                      <div className="flex flex-1 flex-col gap-3 p-4">
                        {/* Charges */}
                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Charges</span>
                            <span className="font-['Fredericka_the_Great'] text-lg leading-none text-emerald-300">
                              {bonus.count}/{bagMax}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isSubmitting || isBagFull}
                            onClick={() => handleAllocate(bonus.slot as BonusSlot)}
                            className="w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBagFull ? "BAG FULL" : "ALLOCATE"}
                          </button>
                        </div>

                        {/* Level Up */}
                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Level Up</span>
                            {!isMaxLevel && (
                              <span className="text-[11px] text-violet-300">
                                {LEVEL_UP_COST} 🧊
                              </span>
                            )}
                          </div>
                          {upgradePreview && (
                            <p className="mb-2 flex items-center gap-1 text-xs text-violet-200/80">
                              <ArrowUp className="h-3 w-3" />
                              {upgradePreview}
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={isSubmitting || isMaxLevel || cubesAvailable < LEVEL_UP_COST}
                            onClick={() => handleLevelUp(bonus.slot as BonusSlot)}
                            className="w-full rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isMaxLevel ? "MAX LEVEL" : "LEVEL UP"}
                          </button>
                        </div>

                        {/* Swap */}
                        <div className="rounded-xl bg-black/40 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Swap</span>
                            <span className="text-[11px] text-amber-300">
                              {SWAP_BONUS_COST} 🧊
                            </span>
                          </div>
                          {swapSlot === bonus.slot ? (
                            <div className="space-y-1.5">
                              {swapTargets.map((target) => (
                                <button
                                  key={`swap-target-${bonus.slot}-${target.into()}`}
                                  type="button"
                                  disabled={isSubmitting || cubesAvailable < SWAP_BONUS_COST}
                                  onClick={() => handleSwap(bonus.slot as BonusSlot, target.into())}
                                  className="w-full rounded-lg bg-amber-500 px-2 py-1.5 text-xs font-bold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  → {target.getName()}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setSwapSlot(null)}
                                className="w-full rounded-lg border border-white/15 bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting || cubesAvailable < SWAP_BONUS_COST}
                              onClick={() => setSwapSlot(bonus.slot as BonusSlot)}
                              className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="flex items-center justify-center gap-1.5">
                                <RefreshCcw className="h-3.5 w-3.5" />
                                SWAP
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  );
                })}
              </div>
            </>
          )}

          {/* Continue */}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InGameShopPage;
