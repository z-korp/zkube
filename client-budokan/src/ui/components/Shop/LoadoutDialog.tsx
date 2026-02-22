import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { motion } from "motion/react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { BonusType, bonusTypeToContractValue } from "@/dojo/game/types/bonus";
import { useMusicPlayer } from "@/contexts/hooks";
import type { PlayerMetaData } from "@/hooks/usePlayerMeta";

const LOADOUT_STORAGE_KEY = "zkube_loadout";

interface LoadoutData {
  selectedBonuses: BonusType[];
}

// Load saved loadout from localStorage
const loadSavedLoadout = (): LoadoutData | null => {
  try {
    const saved = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load loadout:", e);
  }
  return null;
};

// Save loadout to localStorage
const saveLoadout = (loadout: LoadoutData) => {
  try {
    localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  } catch (e) {
    console.warn("Failed to save loadout:", e);
  }
};

interface LoadoutDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onConfirm: (selectedBonuses: number[]) => void;
  playerMetaData: PlayerMetaData | null;
  cubeBalance: number;
  isLoading?: boolean;
}

const ALL_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Score,
  BonusType.Harvest,
  BonusType.Wave,
  BonusType.Supply,
];

const DEFAULT_BONUSES: BonusType[] = [
  BonusType.Combo,
  BonusType.Harvest,
  BonusType.Score,
];

export const getMaxCubesForRank = (_rank: number): number => 0;

const LoadoutDialog: React.FC<LoadoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playerMetaData,
  cubeBalance,
  isLoading = false,
}) => {
  const { themeTemplate } = useTheme();
  const { playSfx } = useMusicPlayer();
  const imgAssets = ImageAssets(themeTemplate);

  // Load saved loadout or use defaults
  const savedLoadout = useMemo(() => loadSavedLoadout(), []);

  const [selected, setSelected] = useState<BonusType[]>(
    savedLoadout?.selectedBonuses ?? DEFAULT_BONUSES,
  );
  void playerMetaData;
  void cubeBalance;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedLoadout();
      if (saved) {
        setSelected(
          saved.selectedBonuses.length === 3
            ? saved.selectedBonuses
            : DEFAULT_BONUSES,
        );
      } else {
        setSelected(DEFAULT_BONUSES);
      }
    }
  }, [isOpen]);

  const unlockedMap = useMemo(
    () => ({
      [BonusType.Combo]: true,
      [BonusType.Score]: true,
      [BonusType.Harvest]: true,
      [BonusType.Wave]: true,
      [BonusType.Supply]: true,
    }),
    [],
  );

  const getBonusIcon = (type: BonusType): string => {
    switch (type) {
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

  const getBonusStats = (type: BonusType) => {
    void type;
    return { bagSize: 0, startingCount: 0 };
  };

  const toggleBonus = (type: BonusType) => {
    if (!unlockedMap[type]) return;
    if (selected.includes(type)) {
      playSfx("unequip");
    } else if (selected.length < 3) {
      playSfx("equip");
    }
    setSelected((prev) => {
      if (prev.includes(type)) {
        return prev.filter((b) => b !== type);
      }
      if (prev.length >= 3) return prev;
      return [...prev, type];
    });
  };

  const handleConfirm = () => {
    if (selected.length !== 3) return;

    // Save loadout to localStorage
    saveLoadout({ selectedBonuses: selected });

    const selectedValues = selected.map((type) =>
      bonusTypeToContractValue(type),
    );
    onConfirm(selectedValues);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[520px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-6 max-h-[90vh] overflow-y-auto"
      >
        <DialogTitle className="text-2xl text-center mb-2 text-purple-400">
          Game Loadout
        </DialogTitle>

        {/* Bonus Selection Section */}
        <div className="mb-4">
          <div className="text-center text-sm text-slate-400 mb-3">
            Select 3 Bonuses ({selected.length}/3)
          </div>

          {/* Warning message if not 3 selected */}
          {selected.length !== 3 && (
            <div className="text-center text-sm text-orange-400 mb-3 bg-orange-500/10 py-2 rounded-lg">
              You must select exactly 3 bonuses to start the game
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALL_BONUSES.map((bonusType, index) => {
              const isSelected = selected.includes(bonusType);
              const isLocked = !unlockedMap[bonusType];
              const icon = getBonusIcon(bonusType);
              const stats = getBonusStats(bonusType);

              return (
                <motion.button
                  key={bonusType}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => toggleBonus(bonusType)}
                  disabled={isLocked}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-lg border transition-all
                    ${isSelected ? "border-yellow-400 bg-yellow-500/10" : "border-slate-700 bg-slate-800/30"}
                    ${isLocked ? "opacity-40 cursor-not-allowed grayscale bg-slate-900/50 border-slate-800" : "hover:border-slate-500"}`}
                >
                  <img
                    src={icon}
                    alt={bonusType}
                    className={`w-9 h-9 ${isLocked ? "grayscale" : ""}`}
                  />
                  <div
                    className={`text-xs font-semibold ${isLocked ? "text-slate-500" : ""}`}
                  >
                    {bonusType}
                  </div>

                  {/* Stats badges */}
                  {!isLocked && (
                    <div className="flex gap-1.5 mt-1">
                      {stats.startingCount > 0 && (
                        <div className="flex items-center gap-0.5 bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded">
                          <span>+{stats.startingCount}</span>
                        </div>
                      )}
                      {stats.bagSize > 0 && (
                        <div className="flex items-center gap-0.5 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded">
                          <span>Bag {stats.bagSize}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {isLocked && (
                    <div className="absolute top-1 right-1 text-[10px] bg-red-900/80 text-red-300 px-1.5 py-0.5 rounded">
                      Locked
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center mb-3">
          Bridging and permanent unlocks are disabled in Iteration 1.
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={selected.length !== 3 || isLoading}
          isLoading={isLoading}
          className="w-full py-3"
        >
          Start Game
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LoadoutDialog;
