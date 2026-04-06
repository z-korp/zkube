import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import { useMusicPlayer } from "@/contexts/hooks";

const MAX_LOADOUT_SLOTS = 3;

interface BonusSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedBonuses: number[]) => void;
  shrinkUnlocked: boolean;
  shuffleUnlocked: boolean;
  initialSelection?: BonusType[];
}

const ALL_BONUSES: BonusType[] = [
  BonusType.Hammer,
  BonusType.Totem,
  BonusType.Wave,
];

const BonusSelectionDialog: React.FC<BonusSelectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [BonusType.Hammer, BonusType.Totem, BonusType.Wave],
}) => {
  const { themeTemplate } = useTheme();
  const { playSfx } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  const [selected, setSelected] = useState<BonusType[]>(initialSelection);

  useEffect(() => {
    if (isOpen) {
      setSelected(initialSelection);
    }
  }, [isOpen, initialSelection]);

  const getBonusIcon = (type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return imgAssets.combo;
      case BonusType.Totem:
        return imgAssets.harvest;
      case BonusType.Wave:
        return imgAssets.wave;
      default:
        return "";
    }
  };

  const getBonusLabel = (type: BonusType): string => {
    switch (type) {
      case BonusType.Hammer:
        return "Hammer";
      case BonusType.Totem:
        return "Totem";
      case BonusType.Wave:
        return "Wave";
      default:
        return "";
    }
  };

  const toggleBonus = (type: BonusType) => {
    if (selected.includes(type)) {
      playSfx("unequip");
    } else if (selected.length < 3) {
      playSfx("equip");
    }
    setSelected((prev) => {
      if (prev.includes(type)) {
        return prev.filter((b) => b !== type);
      }
      if (prev.length >= MAX_LOADOUT_SLOTS) return prev;
      return [...prev, type];
    });
  };

  const handleConfirm = () => {
    if (selected.length !== MAX_LOADOUT_SLOTS) return;
    const selectedValues = selected.map((type) => type as number);
    onConfirm(selectedValues);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[520px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-2xl text-center mb-2 text-purple-400">
          Choose Your 3 Bonuses
        </DialogTitle>

        <div className="text-center text-sm text-slate-400 mb-6">
          Selected {selected.length}/3
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {ALL_BONUSES.map((bonusType, index) => {
            const isSelected = selected.includes(bonusType);
            const icon = getBonusIcon(bonusType);

            return (
              <motion.button
                key={bonusType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleBonus(bonusType)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                  ${isSelected ? "border-yellow-400 bg-yellow-500/10" : "border-slate-700 bg-slate-800/30"}
                  hover:border-slate-500`}
              >
                <img src={icon} alt={getBonusLabel(bonusType)} className="w-10 h-10" />
                <div className="text-sm font-semibold">{getBonusLabel(bonusType)}</div>
              </motion.button>
            );
          })}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={selected.length !== MAX_LOADOUT_SLOTS}
          className="w-full py-3"
        >
          Confirm Selection
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BonusSelectionDialog;
