import React from "react";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface ActionBarProps {
  bonusSlots: {
    type: BonusType;
    count: number;
    icon: string;
    tooltip: string;
    onClick: () => void;
  }[];
  activeBonus: BonusType;
}

const ActionBar: React.FC<ActionBarProps> = ({
  bonusSlots,
  activeBonus,
}) => {
  return (
    <div className="flex items-center justify-center gap-1 md:gap-1.5">
      {bonusSlots.map((slot, index) => (
        <ActionButton
          key={`${slot.type}-${index}`}
          onClick={slot.onClick}
          image={slot.icon}
          count={slot.count}
          tooltip={slot.tooltip}
          isActive={activeBonus === slot.type}
        />
      ))}
    </div>
  );
};

// Bonus action button
interface ActionButtonProps {
  onClick: () => void;
  image?: string;
  icon?: string;
  count: number;
  tooltip: string;
  isActive: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  image,
  icon,
  count,
  tooltip,
  isActive,
}) => {
  const isDisabled = count === 0;

  const getBgClass = () => {
    if (isActive) return "bg-yellow-500/80 hover:bg-yellow-500/90";
    if (isDisabled) return "bg-slate-800/50 opacity-40";
    return "bg-slate-800/50 hover:bg-slate-700/50";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            disabled={isDisabled}
            className={`relative w-9 h-9 md:w-11 md:h-11 rounded flex items-center justify-center transition-colors ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${getBgClass()}`}
            whileHover={isDisabled ? {} : { scale: 1.05 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
          >
            {image ? (
              <img 
                src={image} 
                alt="bonus" 
                className={`w-5 h-5 md:w-7 md:h-7 object-contain ${isDisabled ? "grayscale opacity-60" : ""}`}
              />
            ) : (
              <span className={`text-base md:text-xl ${isDisabled ? "grayscale opacity-60" : ""}`}>{icon}</span>
            )}
            {/* Count badge */}
            <div className={`absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 text-[8px] md:text-[10px] font-bold rounded-full w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center
              ${isDisabled 
                ? "bg-slate-600 text-slate-400" 
                : "bg-yellow-500 text-white"}`}
            >
              {count}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 md:p-3">
          <div className="text-xs">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionBar;
