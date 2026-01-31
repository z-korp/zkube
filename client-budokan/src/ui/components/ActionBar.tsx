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
  // Bonus handlers (5 active)
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
    { id: "p1", icon: "🛡️", active: false, tooltip: "Shield (inactive)" },
    { id: "p2", icon: "❄️", active: false, tooltip: "Freeze (inactive)" },
    { id: "p3", icon: "🔥", active: true, tooltip: "Fire (active)" },
    { id: "p4", icon: "⭐", active: false, tooltip: "Star (inactive)" },
  ];

  return (
    <div className="flex items-center justify-center gap-1">
      {/* Active Bonuses (5) */}
      <div className="flex items-center gap-0.5">
        <CompactBonusButton
          onClick={onBonusHammerClick}
          image={imgAssets.hammer}
          count={hammerCount}
          tooltip="Destroy a block"
          isActive={activeBonus === BonusType.Hammer}
        />
        <CompactBonusButton
          onClick={onBonusWaveClick}
          image={imgAssets.wave}
          count={waveCount}
          tooltip="Destroy a line"
          isActive={activeBonus === BonusType.Wave}
        />
        <CompactBonusButton
          onClick={onBonusTotemClick}
          image={imgAssets.tiki}
          count={totemCount}
          tooltip="Destroy same-size blocks"
          isActive={activeBonus === BonusType.Totem}
        />
        {/* Placeholder bonus 4 */}
        <CompactBonusButton
          onClick={onBonus4Click || (() => {})}
          icon="⚡"
          count={bonus4Count}
          tooltip="Bonus 4 (coming soon)"
          isActive={false}
        />
        {/* Placeholder bonus 5 */}
        <CompactBonusButton
          onClick={onBonus5Click || (() => {})}
          icon="💫"
          count={bonus5Count}
          tooltip="Bonus 5 (coming soon)"
          isActive={false}
        />
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-slate-600 mx-1" />

      {/* Passive Power-ups (4) */}
      <div className="flex items-center gap-0.5">
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

// Ultra-compact bonus button
interface CompactBonusButtonProps {
  onClick: () => void;
  image?: string;
  icon?: string;
  count: number;
  tooltip: string;
  isActive: boolean;
}

const CompactBonusButton: React.FC<CompactBonusButtonProps> = ({
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
            className={`relative w-8 h-8 rounded border flex items-center justify-center transition-all
              ${isActive 
                ? "bg-yellow-500/80 border-yellow-400 shadow-lg shadow-yellow-500/30" 
                : isDisabled 
                  ? "bg-slate-800/50 border-slate-700 opacity-40 cursor-not-allowed" 
                  : "bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 hover:border-slate-500"
              }`}
            whileHover={isDisabled ? {} : { scale: 1.05 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
          >
            {image ? (
              <img 
                src={image} 
                alt="bonus" 
                className={`w-5 h-5 ${isDisabled ? "grayscale" : ""}`}
              />
            ) : (
              <span className={`text-sm ${isDisabled ? "grayscale" : ""}`}>{icon}</span>
            )}
            {/* Count badge */}
            <div className={`absolute -top-1 -right-1 text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center
              ${isDisabled ? "bg-slate-600 text-slate-400" : "bg-yellow-500 text-white"}`}
            >
              {count}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-1.5 text-xs">
          {tooltip}
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
            className={`w-6 h-6 rounded flex items-center justify-center text-xs cursor-help transition-all
              ${active 
                ? "bg-green-500/30 border border-green-500/50" 
                : "bg-slate-800/50 border border-slate-700 opacity-40"
              }`}
          >
            <span className={active ? "" : "grayscale"}>{icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-1.5 text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ActionBar;
