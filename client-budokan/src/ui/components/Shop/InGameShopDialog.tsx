import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { motion } from "framer-motion";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { getCubesAvailable, type RunData } from "@/dojo/game/helpers/runDataPacking";

// Consumable costs matching the contract
const CONSUMABLE_COSTS = {
  HAMMER: 5,
  WAVE: 5,
  TOTEM: 5,
};

// Consumable types (matching contract enum)
enum ConsumableType {
  Hammer = 0,
  Wave = 1,
  Totem = 2,
}

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
  };
}

const InGameShopDialog: React.FC<InGameShopDialogProps> = ({
  isOpen,
  onClose,
  gameId,
  runData,
  bagSizes = { hammer: 1, wave: 1, totem: 1 }, // Default bag sizes
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [isPurchasing, setIsPurchasing] = useState(false);

  // Calculate available cubes
  const cubesAvailable = useMemo(() => getCubesAvailable(runData), [runData]);

  // Check if bag is full for each type
  const isBagFull = useMemo(() => ({
    hammer: runData.hammerCount >= bagSizes.hammer,
    wave: runData.waveCount >= bagSizes.wave,
    totem: runData.totemCount >= bagSizes.totem,
  }), [runData, bagSizes]);

  const handlePurchase = async (consumableType: ConsumableType) => {
    if (!account) return;
    setIsPurchasing(true);
    try {
      await systemCalls.purchaseConsumable({
        account,
        game_id: gameId,
        consumable_type: consumableType,
      });
    } catch (error) {
      console.error("Purchase failed:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const consumables = [
    {
      type: ConsumableType.Hammer,
      name: "Hammer",
      cost: CONSUMABLE_COSTS.HAMMER,
      icon: imgAssets.hammer,
      currentCount: runData.hammerCount,
      maxCount: bagSizes.hammer,
      isFull: isBagFull.hammer,
    },
    {
      type: ConsumableType.Wave,
      name: "Wave",
      cost: CONSUMABLE_COSTS.WAVE,
      icon: imgAssets.wave,
      currentCount: runData.waveCount,
      maxCount: bagSizes.wave,
      isFull: isBagFull.wave,
    },
    {
      type: ConsumableType.Totem,
      name: "Totem",
      cost: CONSUMABLE_COSTS.TOTEM,
      icon: imgAssets.tiki,
      currentCount: runData.totemCount,
      maxCount: bagSizes.totem,
      isFull: isBagFull.totem,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
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
            {/* Consumables for sale */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Buy Bonuses</h3>
              {consumables.map((item, index) => {
                const canAfford = cubesAvailable >= item.cost;
                const canBuy = canAfford && !item.isFull;

                return (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img src={item.icon} alt={item.name} className="w-10 h-10" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          {item.currentCount}/{item.maxCount} in bag
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isPurchasing || !canBuy}
                      onClick={() => handlePurchase(item.type)}
                      className="min-w-[90px]"
                    >
                      {item.isFull ? (
                        <span className="text-slate-400">Full</span>
                      ) : (
                        <span className={!canAfford ? "text-red-400" : ""}>
                          {item.cost} 🧊
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
