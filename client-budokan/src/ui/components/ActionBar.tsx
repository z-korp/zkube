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
  onBonusHammerClick: () => void;
  onBonusWaveClick: () => void;
  onBonusTotemClick: () => void;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  activeBonus: BonusType;
  bonus4Count?: number;
  bonus5Count?: number;
  onBonus4Click?: () => void;
  onBonus5Click?: () => void;
  passives?: {
    id: string;
    icon: string;
    active: boolean;
    tooltip: string;
  }[];
}

const ActionBar: React.FC<ActionBarProps> = ({
  onBonusHammerClick,
  onBonusWaveClick,
  onBonusTotemClick,
  hammerCount,
  waveCount,
  totemCount,
  activeBonus,
  bonus4Count = 0,
  bonus5Count = 0,
  onBonus4Click,
  onBonus5Click,
  passives = [],
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);

  // Default passives for design (replace with real data later)
  const defaultPassives = passives.length > 0 ? passives : [
    { id: "p1", icon: "🛡️", active: false, tooltip: "Shield (coming soon)" },
    { id: "p2", icon: "❄️", active: false, tooltip: "Freeze (coming soon)" },
    { id: "p3", icon: "🔥", active: true, tooltip: "Fire (active)" },
    { id: "p4", icon: "⭐", active: false, tooltip: "Star (coming soon)" },
  ];

  return (
    <div className="flex items-center justify-center gap-0.5 md:gap-1">
      {/* Active Bonuses (5) */}
      <div className="flex items-center gap-0.5 md:gap-1">
        <ActionButton
          onClick={onBonusHammerClick}
          image={imgAssets.hammer}
          count={hammerCount}
          tooltip="Destroy a block and connected same-size blocks"
          isActive={activeBonus === BonusType.Hammer}
        />
        <ActionButton
          onClick={onBonusWaveClick}
          image={imgAssets.wave}
          count={waveCount}
          tooltip="Destroy an entire horizontal line"
          isActive={activeBonus === BonusType.Wave}
        />
        <ActionButton
          onClick={onBonusTotemClick}
          image={imgAssets.tiki}
          count={totemCount}
          tooltip="Destroy all blocks of the same size"
          isActive={activeBonus === BonusType.Totem}
        />
        <ActionButton
          onClick={onBonus4Click || (() => {})}
          icon="⚡"
          count={bonus4Count}
          tooltip="Bonus 4 (coming soon)"
          isActive={false}
        />
        <ActionButton
          onClick={onBonus5Click || (() => {})}
          icon="🔄"
          count={bonus5Count}
          tooltip="Bonus 5 (coming soon)"
          isActive={false}
        />
      </div>

      {/* Passive Power-ups (4) - same size as bonuses */}
      <div className="flex items-center gap-0.5 md:gap-1">
        {defaultPassives.map((passive) => (
          <ActionButton
            key={passive.id}
            onClick={() => {}}
            icon={passive.icon}
            count={-1} // -1 means don't show count badge
            tooltip={passive.tooltip}
            isActive={passive.active}
            isPassive={true}
          />
        ))}
      </div>
    </div>
  );
};

// Unified action button for both bonuses and passives
interface ActionButtonProps {
  onClick: () => void;
  image?: string;
  icon?: string;
  count: number;
  tooltip: string;
  isActive: boolean;
  isPassive?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  image,
  icon,
  count,
  tooltip,
  isActive,
  isPassive = false,
}) => {
  const isDisabled = !isPassive && count === 0;
  const showBadge = count >= 0;

  // Determine background style
  const getBgClass = () => {
    if (isActive && !isPassive) {
      return "bg-yellow-500/80 hover:bg-yellow-500/90";
    }
    if (isActive && isPassive) {
      return "bg-green-500/20 hover:bg-green-500/30";
    }
    if (isDisabled) {
      return "bg-slate-800/50 opacity-40";
    }
    return "bg-slate-800/50 hover:bg-slate-700/50";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            disabled={isDisabled}
            className={`relative w-9 h-9 md:w-11 md:h-11 rounded flex items-center justify-center transition-colors cursor-${isDisabled ? 'not-allowed' : isPassive ? 'help' : 'pointer'} ${getBgClass()}`}
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
              <span className={`text-base md:text-xl ${isDisabled || (isPassive && !isActive) ? "grayscale opacity-60" : ""}`}>{icon}</span>
            )}
            {/* Count badge */}
            {showBadge && (
              <div className={`absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 text-[8px] md:text-[10px] font-bold rounded-full w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center
                ${isDisabled 
                  ? "bg-slate-600 text-slate-400" 
                  : "bg-yellow-500 text-white"}`}
              >
                {count}
              </div>
            )}
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
