import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/ui/elements/dialog";
import { Button } from "@/ui/elements/button";
import { Slider } from "@/ui/elements/slider";
import { motion } from "framer-motion";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import {
  BonusType,
  bonusTypeToContractValue,
} from "@/dojo/game/types/bonus";
import type { PlayerMetaData } from "@/hooks/usePlayerMeta";

const LOADOUT_STORAGE_KEY = "zkube_loadout";

interface LoadoutData {
  selectedBonuses: BonusType[];
  cubesToBring: number;
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
  onConfirm: (selectedBonuses: number[], cubesToBring: number) => void;
  playerMetaData: PlayerMetaData | null;
  cubeBalance: number;
  isLoading?: boolean;
}

const ALL_BONUSES: BonusType[] = [
  BonusType.Hammer,
  BonusType.Totem,
  BonusType.Wave,
  BonusType.Shrink,
  BonusType.Shuffle,
];

const DEFAULT_BONUSES: BonusType[] = [BonusType.Hammer, BonusType.Wave, BonusType.Totem];

// Calculate max cubes allowed based on bridging rank
export const getMaxCubesForRank = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

const LoadoutDialog: React.FC<LoadoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  playerMetaData,
  cubeBalance,
  isLoading = false,
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  // Load saved loadout or use defaults
  const savedLoadout = useMemo(() => loadSavedLoadout(), []);
  
  const [selected, setSelected] = useState<BonusType[]>(
    savedLoadout?.selectedBonuses ?? DEFAULT_BONUSES
  );
  const [cubesToBring, setCubesToBring] = useState(savedLoadout?.cubesToBring ?? 0);

  // Bridging rank and max cubes
  const bridgingRank = playerMetaData?.bridgingRank ?? 0;
  const maxCubesAllowed = getMaxCubesForRank(bridgingRank);
  const actualMaxCubes = Math.min(maxCubesAllowed, cubeBalance);
  const canBringCubes = bridgingRank > 0 && cubeBalance > 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      const saved = loadSavedLoadout();
      if (saved) {
        // Filter out any bonuses that are no longer unlocked
        const validBonuses = saved.selectedBonuses.filter(b => {
          if (b === BonusType.Shrink) return playerMetaData?.shrinkUnlocked;
          if (b === BonusType.Shuffle) return playerMetaData?.shuffleUnlocked;
          return true;
        });
        setSelected(validBonuses.length === 3 ? validBonuses : DEFAULT_BONUSES);
        setCubesToBring(Math.min(saved.cubesToBring, actualMaxCubes));
      } else {
        setSelected(DEFAULT_BONUSES);
        setCubesToBring(0);
      }
    }
  }, [isOpen, playerMetaData, actualMaxCubes]);

  const unlockedMap = useMemo(() => ({
    [BonusType.Hammer]: true,
    [BonusType.Totem]: true,
    [BonusType.Wave]: true,
    [BonusType.Shrink]: playerMetaData?.shrinkUnlocked ?? false,
    [BonusType.Shuffle]: playerMetaData?.shuffleUnlocked ?? false,
  }), [playerMetaData]);

  const getBonusIcon = (type: BonusType): string => {
    switch (type) {
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

  const getBonusStats = (type: BonusType) => {
    if (!playerMetaData) return { bagSize: 0, startingCount: 0 };
    
    switch (type) {
      case BonusType.Hammer:
        return { 
          bagSize: playerMetaData.bagHammerLevel, 
          startingCount: playerMetaData.startingHammer 
        };
      case BonusType.Wave:
        return { 
          bagSize: playerMetaData.bagWaveLevel, 
          startingCount: playerMetaData.startingWave 
        };
      case BonusType.Totem:
        return { 
          bagSize: playerMetaData.bagTotemLevel, 
          startingCount: playerMetaData.startingTotem 
        };
      case BonusType.Shrink:
        return { 
          bagSize: playerMetaData.bagShrinkLevel, 
          startingCount: playerMetaData.startingShrink 
        };
      case BonusType.Shuffle:
        return { 
          bagSize: playerMetaData.bagShuffleLevel, 
          startingCount: playerMetaData.startingShuffle 
        };
      default:
        return { bagSize: 0, startingCount: 0 };
    }
  };

  const toggleBonus = (type: BonusType) => {
    if (!unlockedMap[type]) return;
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
    saveLoadout({ selectedBonuses: selected, cubesToBring });
    
    const selectedValues = selected.map((type) => bonusTypeToContractValue(type));
    onConfirm(selectedValues, cubesToBring);
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
                    ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:border-slate-500"}`}
                >
                  <img src={icon} alt={bonusType} className="w-9 h-9" />
                  <div className="text-xs font-semibold">{bonusType}</div>
                  
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
                    <div className="absolute top-1 right-1 text-[10px] bg-slate-900/80 px-1.5 py-0.5 rounded">
                      Locked
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Cube Bringing Section */}
        {canBringCubes && (
          <div className="border-t border-slate-700 pt-4 mb-4">
            <div className="text-center text-sm text-slate-400 mb-3">
              Bring Cubes to Spend In-Game
            </div>

            {/* Wallet Balance */}
            <div className="text-center mb-3 bg-slate-800/50 py-2 rounded-lg">
              <div className="text-sm font-semibold text-yellow-400 flex items-center justify-center gap-2">
                <span>Wallet:</span>
                <span>{cubeBalance.toLocaleString()} cubes</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Max allowed: {maxCubesAllowed} (Bridging Rank {bridgingRank})
              </div>
            </div>

            {/* Slider */}
            {actualMaxCubes > 0 && (
              <div className="mb-3 px-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-400">Cubes to bring:</span>
                  <span className="text-sm font-bold text-yellow-400">{cubesToBring}</span>
                </div>
                <Slider
                  value={[cubesToBring]}
                  onValueChange={(value) => setCubesToBring(value[0])}
                  min={0}
                  max={actualMaxCubes}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-0.5 text-[10px] text-slate-500">
                  <span>0</span>
                  <span>{actualMaxCubes}</span>
                </div>
              </div>
            )}

            {/* Quick select buttons */}
            {actualMaxCubes > 0 && (
              <div className="flex gap-1.5 justify-center flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCubesToBring(0)}
                  className="min-w-[45px] h-7 text-xs"
                >
                  0
                </Button>
                {actualMaxCubes >= 5 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCubesToBring(Math.min(5, actualMaxCubes))}
                    className="min-w-[45px] h-7 text-xs"
                  >
                    5
                  </Button>
                )}
                {actualMaxCubes >= 10 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCubesToBring(Math.min(10, actualMaxCubes))}
                    className="min-w-[45px] h-7 text-xs"
                  >
                    10
                  </Button>
                )}
                {actualMaxCubes >= 20 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCubesToBring(Math.min(20, actualMaxCubes))}
                    className="min-w-[45px] h-7 text-xs"
                  >
                    20
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCubesToBring(actualMaxCubes)}
                  className="min-w-[45px] h-7 text-xs"
                >
                  Max
                </Button>
              </div>
            )}

            {cubesToBring > 0 && (
              <p className="text-center text-[10px] text-orange-400 mt-2">
                Warning: Brought cubes are lost if you die!
              </p>
            )}
          </div>
        )}

        {/* Info text */}
        <div className="text-[10px] text-slate-500 text-center mb-3">
          {!canBringCubes && bridgingRank === 0 && (
            <span>Unlock Bridging Rank in the shop to bring cubes into games.</span>
          )}
          {!playerMetaData?.shrinkUnlocked && !playerMetaData?.shuffleUnlocked && (
            <span> Unlock Shrink and Shuffle in the permanent shop.</span>
          )}
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={selected.length !== 3 || isLoading}
          isLoading={isLoading}
          className="w-full py-3"
        >
          {cubesToBring > 0 
            ? `Start Game with ${cubesToBring} Cubes` 
            : "Start Game"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LoadoutDialog;
