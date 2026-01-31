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
  // Future bonuses (placeholders for now)
  bonus4Count?: number;
  bonus5Count?: number;
  onBonus4Click?: () => void;
  onBonus5Click?: () => void;
  // Passive power-ups (4 display-only)
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
    <div className="flex items-center justify-center gap-2">
      {/* Active Bonuses (5) - old design with gold circles */}
      <div className="flex items-center gap-1.5">
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
        {/* Placeholder bonus 4 */}
        <BonusButton
          onClick={onBonus4Click || (() => {})}
          icon="⚡"
          count={bonus4Count}
          tooltip="Bonus 4 (coming soon)"
          isActive={false}
        />
        {/* Placeholder bonus 5 */}
        <BonusButton
          onClick={onBonus5Click || (() => {})}
          icon="🔄"
          count={bonus5Count}
          tooltip="Bonus 5 (coming soon)"
          isActive={false}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-slate-600" />

      {/* Passive Power-ups (4) */}
      <div className="flex items-center gap-1">
        {defaultPassives.map((passive) => (
          <PassiveIndicator
            key={passive.id}
            icon={passive.icon}
            active={passive.active}
            tooltip={passive.tooltip}
          />
        ))}
      </div>
    </div>
  );
};

// Bonus button matching old design (gold circle with badge)
interface BonusButtonProps {
  onClick: () => void;
  image?: string;
  icon?: string;
  count: number;
  tooltip: string;
  isActive: boolean;
}

const BonusButton: React.FC<BonusButtonProps> = ({
  onClick,
  image,
  icon,
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
            className={`relative w-12 h-12 rounded flex items-center justify-center transition-colors
              ${isActive 
                ? "bg-yellow-500/80 hover:bg-yellow-500/90 shadow-lg shadow-yellow-500/40 ring-2 ring-yellow-300" 
                : isDisabled 
                  ? "bg-slate-800/50 opacity-40 cursor-not-allowed" 
                  : "bg-slate-800/50 hover:bg-slate-700/50"
              }`}
            whileHover={isDisabled ? {} : { scale: 1.05 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
          >
            {image ? (
              <img 
                src={image} 
                alt="bonus" 
                className={`w-8 h-8 object-contain ${isDisabled ? "grayscale opacity-60" : ""}`}
              />
            ) : (
              <span className={`text-xl ${isDisabled ? "grayscale opacity-60" : ""}`}>{icon}</span>
            )}
            {/* Count badge - gold circle in top right */}
            <div className={`absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center
              ${isDisabled 
                ? "bg-slate-600 text-slate-400" 
                : "bg-yellow-500 text-white"}`}
            >
              {count}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-3">
          <div className="text-xs">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Passive power-up indicator (display only)
interface PassiveIndicatorProps {
  icon: string;
  active: boolean;
  tooltip: string;
}

const PassiveIndicator: React.FC<PassiveIndicatorProps> = ({
  icon,
  active,
  tooltip,
}) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`w-8 h-8 rounded flex items-center justify-center text-base cursor-help transition-colors
              ${active 
                ? "bg-green-500/20 hover:bg-green-500/30" 
                : "bg-slate-800/50 hover:bg-slate-700/50 opacity-40"
              }`}
          >
            <span className={active ? "" : "grayscale"}>{icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-3">
          <div className="text-xs">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionBar;
