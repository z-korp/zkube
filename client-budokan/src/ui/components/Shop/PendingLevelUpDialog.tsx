import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { bonusTypeFromContractValue, BonusType } from "@/dojo/game/types/bonus";
import type { RunData } from "@/dojo/game/helpers/runDataPacking";

interface PendingLevelUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  runData: RunData;
}

const PendingLevelUpDialog: React.FC<PendingLevelUpDialogProps> = ({
  isOpen,
  onClose,
  gameId,
  runData,
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [isLeveling, setIsLeveling] = useState(false);

  const getBonusIcon = (bonusType: BonusType): string => {
    switch (bonusType) {
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

  const slots = useMemo(
    () => [
      { slot: 0, value: runData.selectedBonus1, level: runData.bonus1Level },
      { slot: 1, value: runData.selectedBonus2, level: runData.bonus2Level },
      { slot: 2, value: runData.selectedBonus3, level: runData.bonus3Level },
    ].map((item) => ({
      ...item,
      type: bonusTypeFromContractValue(item.value),
    })),
    [runData]
  );

  const handleLevelUp = async (slot: number) => {
    if (!account) return;
    setIsLeveling(true);
    try {
      await systemCalls.levelUpBonus({
        account,
        game_id: gameId,
        bonus_slot: slot,
      });
      onClose();
    } catch (error) {
      console.error("Level up failed:", error);
    } finally {
      setIsLeveling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[460px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-2xl text-center mb-2 text-emerald-400">
          Bonus Level Up!
        </DialogTitle>

        <div className="text-center text-sm text-slate-400 mb-6">
          Choose one bonus to level up.
        </div>

        <div className="space-y-3">
          {slots.map((item, index) => {
            const currentLevel = item.level + 1;
            const isMax = item.level >= 2;
            return (
              <motion.div
                key={`levelup-slot-${item.slot}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img src={getBonusIcon(item.type)} alt={item.type} className="w-10 h-10" />
                  <div>
                    <div className="font-medium">{item.type}</div>
                    <div className="text-xs text-slate-400">Level {currentLevel}/3</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={isLeveling || isMax}
                  onClick={() => handleLevelUp(item.slot)}
                  className="min-w-[120px]"
                >
                  {isMax ? "Max Level" : "Level Up"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PendingLevelUpDialog;
