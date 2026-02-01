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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-4 py-5"
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
          /* 2x2 Grid: 3 bonus cards + 1 refill card */
          <div className="grid grid-cols-2 gap-2 mb-4">
            {selectedBonuses.map((item, index) => {
              const bonusType = bonusTypeFromContractValue(item.value);
              const bonusName = getSelectedBonusName(item.value);
              const icon = getBonusIcon(bonusType);
              const currentCount = getBonusInventoryCount(runData, item.value);
              const maxCount = getBagSizeForBonus(bonusType);
              const isFull = currentCount >= maxCount;
              const canAffordBuy = cubesAvailable >= CONSUMABLE_COSTS.BONUS;
              const canBuy = canAffordBuy && !isFull && !item.bought && bonusType !== BonusType.None;
              
              const currentLevel = item.level + 1;
              const isMaxLevel = item.level >= 2;
              const canAffordLevel = cubesAvailable >= CONSUMABLE_COSTS.LEVEL_UP;
              const canLevel = canAffordLevel && !isMaxLevel && bonusType !== BonusType.None;

              if (bonusType === BonusType.None) return null;

              return (
                <motion.div
                  key={`bonus-${item.slot}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <img src={icon} alt={bonusName} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{bonusName}</div>
                      <div className="text-[10px] text-slate-400">
                        {currentCount}/{maxCount} • Lv{currentLevel}
                      </div>
                    </div>
                  </div>

                  {/* Buy + Level buttons */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canBuy}
                      onClick={() => handlePurchase(item.consumableType)}
                      className="flex-1 text-[10px] h-6 px-1"
                    >
                      {item.bought ? "Bought" : isFull ? "Full" : `+1 ${CONSUMABLE_COSTS.BONUS}🧊`}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canLevel}
                      onClick={() => handlePurchase(ConsumableType.LevelUp, item.slot)}
                      className="flex-1 text-[10px] h-6 px-1"
                    >
                      {isMaxLevel ? "Max" : `Lv↑ ${CONSUMABLE_COSTS.LEVEL_UP}🧊`}
                    </Button>
                  </div>
                </motion.div>
              );
            })}

            {/* Refill Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-lg">
                  🔄
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Refill</div>
                  <div className="text-[10px] text-slate-400">
                    Reset purchases
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                disabled={isPurchasing || cubesAvailable < refillCost}
                onClick={() => handlePurchase(ConsumableType.Refill)}
                className="w-full text-[10px] h-6"
              >
                {refillCost} 🧊
              </Button>
            </motion.div>
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
