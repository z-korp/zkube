import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useDojo } from "@/dojo/useDojo";
import { useMusicPlayer } from "@/contexts/hooks";
import useAccountCustom from "@/hooks/useAccountCustom";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import {
  getCubesAvailable,
  getSelectedBonusName,
  getBonusInventoryCount,
  getBonusChargeCost,
  type RunData,
  ConsumableType,
  LEVEL_UP_COST,
  SWAP_BONUS_COST,
} from "@/dojo/game/helpers/runDataPacking";
import { bonusTypeFromContractValue, BonusType, Bonus } from "@/dojo/game/types/bonus";

interface InGameShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  runData: RunData;
  bagSizes?: {
    combo: number;
    score: number;
    harvest: number;
    wave: number;
    supply: number;
  };
}

const InGameShopDialog: React.FC<InGameShopDialogProps> = ({
  isOpen,
  onClose,
  gameId,
  runData,
  bagSizes = { combo: 1, score: 1, harvest: 1, wave: 1, supply: 1 },
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const { account } = useAccountCustom();
  const { playSfx } = useMusicPlayer();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [swapSlot, setSwapSlot] = useState<number | null>(null);

  const cubesAvailable = useMemo(() => getCubesAvailable(runData), [runData]);
  const chargeCost = useMemo(() => getBonusChargeCost(runData.shopPurchases), [runData.shopPurchases]);

  const getBagSizeForBonus = (bonusType: BonusType): number => {
    switch (bonusType) {
      case BonusType.Combo: return bagSizes.combo;
      case BonusType.Score: return bagSizes.score;
      case BonusType.Harvest: return bagSizes.harvest;
      case BonusType.Wave: return bagSizes.wave;
      case BonusType.Supply: return bagSizes.supply;
      default: return 0;
    }
  };

  const getBonusIcon = (bonusType: BonusType): string => {
    switch (bonusType) {
      case BonusType.Combo: return imgAssets.combo;
      case BonusType.Score: return imgAssets.score;
      case BonusType.Harvest: return imgAssets.harvest;
      case BonusType.Wave: return imgAssets.wave;
      case BonusType.Supply: return imgAssets.supply;
      default: return "";
    }
  };

  const handleBuyCharge = async () => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.purchaseConsumable({
        account,
        game_id: gameId,
        consumable_type: ConsumableType.BonusCharge,
        bonus_slot: 0,
      });
      playSfx("shop-purchase");
    } catch (error) {
      console.error("Buy charge failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleAllocateCharge = async (bonusSlot: number) => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.allocateCharge({
        account,
        game_id: gameId,
        bonus_slot: bonusSlot,
      });
    } catch (error) {
      console.error("Allocate charge failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleLevelUp = async (bonusSlot: number) => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.purchaseConsumable({
        account,
        game_id: gameId,
        consumable_type: ConsumableType.LevelUp,
        bonus_slot: bonusSlot,
      });
      playSfx("shop-purchase");
    } catch (error) {
      console.error("Level up failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSwapBonus = async (bonusSlot: number, newBonusType: number) => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.swapBonus({
        account,
        game_id: gameId,
        bonus_slot: bonusSlot,
        new_bonus_type: newBonusType,
      });
      setSwapSlot(null);
    } catch (error) {
      console.error("Swap bonus failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const selectedBonusValues = [runData.selectedBonus1, runData.selectedBonus2, runData.selectedBonus3];

  const selectedBonuses = useMemo(
    () => [
      { slot: 0, value: runData.selectedBonus1, level: runData.bonus1Level },
      { slot: 1, value: runData.selectedBonus2, level: runData.bonus2Level },
      { slot: 2, value: runData.selectedBonus3, level: runData.bonus3Level },
    ],
    [runData]
  );

  const activeBonuses = selectedBonuses.filter(
    (item) => bonusTypeFromContractValue(item.value) !== BonusType.None
  );

  const unselectedBonuses = Bonus.getAllBonuses()
    .filter((b) => !selectedBonusValues.includes(b.into()))
    .filter((b) => !b.isNone());

  const canAffordCharge = cubesAvailable >= chargeCost;
  const canAffordLevelUp = cubesAvailable >= LEVEL_UP_COST;
  const canAffordSwap = cubesAvailable >= SWAP_BONUS_COST;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4 py-5"
      >
        <DialogTitle className="text-xl text-center mb-2 text-purple-400">
          In-Game Shop
        </DialogTitle>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 bg-slate-800/50 py-2 rounded-lg"
        >
          <div className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span>🧊</span>
            {cubesAvailable}
            <span className="text-xs font-normal text-slate-400">available</span>
          </div>
        </motion.div>

        {cubesAvailable === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-400 mb-2 text-sm">No cubes available!</p>
            <p className="text-xs text-slate-500">Earn cubes by completing levels.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
              <div>
                <div className="text-sm font-medium">Buy Charge</div>
                <div className="text-[10px] text-slate-400">Add to unallocated pool</div>
              </div>
              <Button
                size="sm"
                disabled={isPurchasing || !canAffordCharge}
                onClick={handleBuyCharge}
                className="text-[10px] h-7 px-3"
              >
                +1 {chargeCost}🧊
              </Button>
            </div>

            {activeBonuses.map((item, index) => {
              const bonusType = bonusTypeFromContractValue(item.value);
              const bonusName = getSelectedBonusName(item.value);
              const icon = getBonusIcon(bonusType);
              const currentCount = getBonusInventoryCount(runData, item.value);
              const maxCount = getBagSizeForBonus(bonusType);
              const isFull = currentCount >= maxCount;
              const currentLevel = item.level + 1;
              const isMaxLevel = item.level >= 2;

              return (
                <motion.div
                  key={`bonus-${item.slot}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-3"
                >
                  <img src={icon} alt={bonusName} className="w-10 h-10 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{bonusName}</div>
                    <div className="text-[10px] text-slate-400">
                      {currentCount}/{maxCount} in bag · Lv{currentLevel}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      disabled={isPurchasing || isFull}
                      onClick={() => handleAllocateCharge(item.slot)}
                      className="text-[10px] h-6 px-2 min-w-[70px]"
                    >
                      {isFull ? "Full" : "Assign"}
                    </Button>

                    <Button
                      size="sm"
                      disabled={isPurchasing || !canAffordLevelUp || isMaxLevel}
                      onClick={() => handleLevelUp(item.slot)}
                      className="text-[10px] h-6 px-2 min-w-[70px]"
                      variant="secondary"
                    >
                      {isMaxLevel ? "Max Lv" : `Lv↑ ${LEVEL_UP_COST}🧊`}
                    </Button>

                    {swapSlot === item.slot ? (
                      <div className="flex flex-col gap-1">
                        {unselectedBonuses.map((b) => (
                          <Button
                            key={b.getName()}
                            size="sm"
                            disabled={isPurchasing}
                            onClick={() => handleSwapBonus(item.slot, b.into())}
                            className="text-[10px] h-6 px-2 min-w-[70px]"
                            variant="outline"
                          >
                            → {b.getName()}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          onClick={() => setSwapSlot(null)}
                          className="text-[10px] h-6 px-2 min-w-[70px]"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isPurchasing || !canAffordSwap}
                        onClick={() => setSwapSlot(item.slot)}
                        className="text-[10px] h-6 px-2 min-w-[70px]"
                        variant="outline"
                      >
                        Swap {SWAP_BONUS_COST}🧊
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full py-2 text-sm"
        >
          {cubesAvailable > 0 ? "Done" : "Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default InGameShopDialog;
