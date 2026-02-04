import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { motion } from "framer-motion";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import {
  getCubesAvailable,
  getRefillCost,
  getSelectedBonusName,
  getBonusInventoryCount,
  type RunData,
  ConsumableType,
  CONSUMABLE_COSTS,
} from "@/dojo/game/helpers/runDataPacking";
import { bonusTypeFromContractValue, BonusType } from "@/dojo/game/types/bonus";

interface InGameShopDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  runData: RunData;
  bagSizes?: {
    hammer: number;
    wave: number;
    totem: number;
    shrink: number;
    shuffle: number;
  };
}

const InGameShopDialog: React.FC<InGameShopDialogProps> = ({
  isOpen,
  onClose,
  gameId,
  runData,
  bagSizes = { hammer: 1, wave: 1, totem: 1, shrink: 1, shuffle: 1 },
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [isPurchasing, setIsPurchasing] = useState(false);

  const cubesAvailable = useMemo(() => getCubesAvailable(runData), [runData]);
  const refillCost = useMemo(() => getRefillCost(runData.shopRefills), [runData.shopRefills]);

  const getBagSizeForBonus = (bonusType: BonusType): number => {
    switch (bonusType) {
      case BonusType.Hammer:
        return bagSizes.hammer;
      case BonusType.Wave:
        return bagSizes.wave;
      case BonusType.Totem:
        return bagSizes.totem;
      case BonusType.Shrink:
        return bagSizes.shrink;
      case BonusType.Shuffle:
        return bagSizes.shuffle;
      default:
        return 0;
    }
  };

  const getBonusIcon = (bonusType: BonusType): string => {
    switch (bonusType) {
      case BonusType.Hammer:
        return imgAssets.hammer;
      case BonusType.Wave:
        return imgAssets.wave;
      case BonusType.Totem:
        return imgAssets.tiki;
      case BonusType.Shrink:
        return imgAssets.shrink;
      case BonusType.Shuffle:
        return imgAssets.shuffle;
      default:
        return "";
    }
  };

  const handlePurchase = async (consumableType: ConsumableType, bonusSlot: number = 0) => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.purchaseConsumable({
        account,
        game_id: gameId,
        consumable_type: consumableType,
        bonus_slot: bonusSlot,
      });
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const selectedBonuses = useMemo(
    () => [
      {
        slot: 0,
        value: runData.selectedBonus1,
        bought: runData.shopBonus1Bought,
        level: runData.bonus1Level,
        consumableType: ConsumableType.Bonus1,
      },
      {
        slot: 1,
        value: runData.selectedBonus2,
        bought: runData.shopBonus2Bought,
        level: runData.bonus2Level,
        consumableType: ConsumableType.Bonus2,
      },
      {
        slot: 2,
        value: runData.selectedBonus3,
        bought: runData.shopBonus3Bought,
        level: runData.bonus3Level,
        consumableType: ConsumableType.Bonus3,
      },
    ],
    [runData]
  );

  // Filter out empty bonus slots
  const activeBonuses = selectedBonuses.filter(
    (item) => bonusTypeFromContractValue(item.value) !== BonusType.None
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[360px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4 py-5"
      >
        <DialogTitle className="text-xl text-center mb-2 text-purple-400">
          In-Game Shop
        </DialogTitle>

        {/* Available Cubes */}
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
            <p className="text-xs text-slate-500">
              Earn cubes by completing levels.
            </p>
          </div>
        ) : (
          /* 3 bonus cards in a column */
          <div className="flex flex-col gap-2 mb-4">
            {activeBonuses.map((item, index) => {
              const bonusType = bonusTypeFromContractValue(item.value);
              const bonusName = getSelectedBonusName(item.value);
              const icon = getBonusIcon(bonusType);
              const currentCount = getBonusInventoryCount(runData, item.value);
              const maxCount = getBagSizeForBonus(bonusType);
              const isFull = currentCount >= maxCount;
              const canAffordBuy = cubesAvailable >= CONSUMABLE_COSTS.BONUS;
              const canAffordRefill = cubesAvailable >= refillCost;
              const canBuy = canAffordBuy && !isFull && !item.bought;
              
              const currentLevel = item.level + 1;
              const isMaxLevel = item.level >= 2;
              const canAffordLevel = cubesAvailable >= CONSUMABLE_COSTS.LEVEL_UP;
              const canLevel = canAffordLevel && !isMaxLevel;

              return (
                <motion.div
                  key={`bonus-${item.slot}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 flex items-center gap-3"
                >
                  {/* Icon */}
                  <img src={icon} alt={bonusName} className="w-10 h-10 flex-shrink-0" />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{bonusName}</div>
                    <div className="text-[10px] text-slate-400">
                      {currentCount}/{maxCount} in bag • Lv{currentLevel}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {/* Buy or Refill button */}
                    {item.bought ? (
                      <Button
                        size="sm"
                        disabled={isPurchasing || !canAffordRefill}
                        onClick={() => handlePurchase(ConsumableType.Refill, item.slot)}
                        className="text-[10px] h-6 px-2 min-w-[70px]"
                        variant="outline"
                      >
                        {isFull ? "Full" : `Refill ${refillCost}🧊`}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isPurchasing || !canBuy}
                        onClick={() => handlePurchase(item.consumableType)}
                        className="text-[10px] h-6 px-2 min-w-[70px]"
                      >
                        {isFull ? "Full" : `+1 ${CONSUMABLE_COSTS.BONUS}🧊`}
                      </Button>
                    )}
                    
                    {/* Level up button */}
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canLevel}
                      onClick={() => handlePurchase(ConsumableType.LevelUp, item.slot)}
                      className="text-[10px] h-6 px-2 min-w-[70px]"
                      variant="secondary"
                    >
                      {isMaxLevel ? "Max Lv" : `Lv↑ ${CONSUMABLE_COSTS.LEVEL_UP}🧊`}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Close Button */}
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
