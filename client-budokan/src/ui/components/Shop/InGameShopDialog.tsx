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
  /** Bag size limits from player meta */
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
        className="sm:max-w-[460px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-2xl text-center mb-2 text-purple-400">
          In-Game Shop
        </DialogTitle>

        {/* Available Cubes */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 bg-slate-800/50 py-3 rounded-lg"
        >
          <div className="text-sm text-slate-400 mb-1">Available to Spend</div>
          <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <span>🧊</span>
            {cubesAvailable}
            <span className="text-sm font-normal text-slate-400">cubes</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 space-x-2">
            {runData.cubesBrought > 0 && (
              <span>Brought: {runData.cubesBrought}</span>
            )}
            <span>Earned: {runData.totalCubes}</span>
            {runData.cubesSpent > 0 && (
              <span>Spent: {runData.cubesSpent}</span>
            )}
          </div>
        </motion.div>

        {cubesAvailable === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-2">No cubes available to spend!</p>
            <p className="text-xs text-slate-500">
              Earn cubes by completing levels, or bring cubes using Bridging Rank.
            </p>
          </div>
        ) : (
          <>
            {/* Buy Selected Bonuses */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Buy Selected Bonuses</h3>
              {selectedBonuses.map((item, index) => {
                const bonusType = bonusTypeFromContractValue(item.value);
                const bonusName = getSelectedBonusName(item.value);
                const icon = getBonusIcon(bonusType);
                const currentCount = getBonusInventoryCount(runData, item.value);
                const maxCount = getBagSizeForBonus(bonusType);
                const isFull = currentCount >= maxCount;
                const canAfford = cubesAvailable >= CONSUMABLE_COSTS.BONUS;
                const canBuy = canAfford && !isFull && !item.bought && bonusType !== BonusType.None;

                return (
                  <motion.div
                    key={`bonus-${item.slot}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {icon ? (
                        <img src={icon} alt={bonusName} className="w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-xs text-slate-400">
                          N/A
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{bonusName}</div>
                        <div className="text-xs text-slate-400">
                          {currentCount}/{maxCount} in bag
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canBuy}
                      onClick={() => handlePurchase(item.consumableType)}
                      className="min-w-[100px]"
                    >
                      {bonusType === BonusType.None ? (
                        <span className="text-slate-400">Empty</span>
                      ) : item.bought ? (
                        <span className="text-slate-400">Bought</span>
                      ) : isFull ? (
                        <span className="text-slate-400">Full</span>
                      ) : (
                        <span className={!canAfford ? "text-red-400" : ""}>
                          {CONSUMABLE_COSTS.BONUS} 🧊
                        </span>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            {/* Refill */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Refill</h3>
              <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                <div>
                  <div className="font-medium">Reset Bonus Purchases</div>
                  <div className="text-xs text-slate-400">
                    Refills bought: {runData.shopRefills}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={isPurchasing || cubesAvailable < refillCost}
                  onClick={() => handlePurchase(ConsumableType.Refill)}
                  className="min-w-[100px]"
                >
                  <span className={cubesAvailable < refillCost ? "text-red-400" : ""}>
                    {refillCost} 🧊
                  </span>
                </Button>
              </div>
            </div>

            {/* Level Up */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Level Up Bonuses</h3>
              {selectedBonuses.map((item, index) => {
                const bonusType = bonusTypeFromContractValue(item.value);
                const bonusName = getSelectedBonusName(item.value);
                const icon = getBonusIcon(bonusType);
                const currentLevel = item.level + 1;
                const isMax = item.level >= 2;
                const canAfford = cubesAvailable >= CONSUMABLE_COSTS.LEVEL_UP;
                const canLevel = canAfford && !isMax && bonusType !== BonusType.None;

                return (
                  <motion.div
                    key={`levelup-${item.slot}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {icon ? (
                        <img src={icon} alt={bonusName} className="w-10 h-10" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-xs text-slate-400">
                          N/A
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{bonusName}</div>
                        <div className="text-xs text-slate-400">Level {currentLevel}/3</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canLevel}
                      onClick={() => handlePurchase(ConsumableType.LevelUp, item.slot)}
                      className="min-w-[100px]"
                    >
                      {bonusType === BonusType.None ? (
                        <span className="text-slate-400">Empty</span>
                      ) : isMax ? (
                        <span className="text-slate-400">Max</span>
                      ) : (
                        <span className={!canAfford ? "text-red-400" : ""}>
                          {CONSUMABLE_COSTS.LEVEL_UP} 🧊
                        </span>
                      )}
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Close Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full py-3"
          >
            {cubesAvailable > 0 ? "Done Shopping" : "Continue"}
          </Button>
        </motion.div>

        <p className="text-xs text-slate-500 text-center mt-3">
          Spending uses brought cubes first, then earned cubes.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default InGameShopDialog;
