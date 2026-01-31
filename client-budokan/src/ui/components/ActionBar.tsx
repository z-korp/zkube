import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";
import { BonusType } from "@/dojo/game/types/bonus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface ActionBarProps {
  // Bonus handlers (3 active)
  onBonusHammerClick: () => void;
  onBonusWaveClick: () => void;
  onBonusTotemClick: () => void;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  activeBonus: BonusType;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onBonusHammerClick,
  onBonusWaveClick,
  onBonusTotemClick,
  hammerCount,
  waveCount,
  totemCount,
  activeBonus,
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Active Bonuses (3) - old design with gold circles */}
      <BonusButton
        onClick={onBonusHammerClick}
        image={imgAssets.hammer}
        count={hammerCount}
        tooltip="Destroy a block and connected same-size blocks"
        isActive={activeBonus === BonusType.Hammer}
      />
      <BonusButton
        onClick={onBonusWaveClick}
        image={imgAssets.wave}
        count={waveCount}
        tooltip="Destroy an entire horizontal line"
        isActive={activeBonus === BonusType.Wave}
      />
      <BonusButton
        onClick={onBonusTotemClick}
        image={imgAssets.tiki}
        count={totemCount}
        tooltip="Destroy all blocks of the same size"
        isActive={activeBonus === BonusType.Totem}
      />
    </div>
  );
};

// Bonus button matching old design (gold circle with badge)
interface BonusButtonProps {
  onClick: () => void;
  image: string;
  count: number;
  tooltip: string;
  isActive: boolean;
}

const BonusButton: React.FC<BonusButtonProps> = ({
  onClick,
  image,
  count,
  tooltip,
  isActive,
}) => {
  const isDisabled = count === 0;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            disabled={isDisabled}
            className={`relative w-12 h-12 rounded-lg flex items-center justify-center transition-all
              ${isActive 
                ? "bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-300" 
                : isDisabled 
                  ? "bg-slate-700/50 opacity-40 cursor-not-allowed" 
                  : "bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-md"
              }`}
            whileHover={isDisabled ? {} : { scale: 1.08 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
          >
            <img 
              src={image} 
              alt="bonus" 
              className={`w-8 h-8 object-contain ${isDisabled ? "grayscale opacity-60" : ""}`}
            />
            {/* Count badge - gold circle in top right */}
            <div className={`absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm
              ${isDisabled 
                ? "bg-slate-600 text-slate-400 border border-slate-500" 
                : "bg-gradient-to-b from-yellow-400 to-yellow-500 text-white border border-yellow-300"}`}
            >
              {count}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 text-sm">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionBar;
