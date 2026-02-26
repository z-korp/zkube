import { motion } from "motion/react";
import { BonusType } from "@/dojo/game/types/bonus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface BonusSlot {
  type: BonusType;
  count: number;
  level: number;
  bagSize: number;
  icon: string;
  tooltip: string;
  onClick: () => void;
  isPassive?: boolean;
  archetypeColor?: string;
}

interface GameActionBarProps {
  bonusSlots: BonusSlot[];
  activeBonus: BonusType;
  bonusDescription: string;
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  bonusSlots,
  activeBonus,
  bonusDescription,
}) => {
  return (
    <div className="w-full px-2 pb-2 shrink-0">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-center gap-[clamp(4px,1.5vw,10px)] bg-slate-900/90 backdrop-blur-sm border border-slate-500/50 rounded-lg px-[clamp(8px,2vw,14px)] py-[clamp(8px,2vw,14px)]">
        {bonusSlots.map((slot, idx) => {
          const isPassive = slot.isPassive ?? false;
          const isActive = !isPassive && activeBonus === slot.type;
          const isDisabled = !isPassive && slot.count === 0;
          const arcColor = slot.archetypeColor ?? '#8b5cf6';

          return (
            <TooltipProvider key={`${slot.type}-${idx}`} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={isPassive ? undefined : slot.onClick}
                    disabled={isPassive || isDisabled}
                    whileHover={isPassive || isDisabled ? undefined : { scale: 1.1 }}
                    whileTap={isPassive || isDisabled ? undefined : { scale: 0.9 }}
                    className={`relative w-[clamp(48px,13vw,64px)] h-[clamp(48px,13vw,64px)] rounded-full overflow-visible flex items-center justify-center transition-all ${
                      isPassive
                        ? 'cursor-default opacity-90'
                        : isActive
                          ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                          : isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:ring-1 hover:ring-slate-500 cursor-pointer'
                    }`}
                    style={isPassive ? { boxShadow: `0 0 10px ${arcColor}30` } : undefined}
                  >
                    <img
                      src={slot.icon}
                      alt={slot.type}
                      className={`w-full h-full rounded-full object-cover ${
                        isDisabled && !isPassive ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    <span
                      className="absolute -bottom-0.5 -left-0.5 text-[clamp(9px,2.2vw,12px)] font-bold rounded-full w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center text-white z-10"
                      style={{ backgroundColor: isPassive ? arcColor : undefined }}
                    >
                      {isPassive ? (
                        <span className="text-[clamp(7px,1.8vw,9px)]">{slot.level}</span>
                      ) : (
                        <span className="bg-indigo-500 rounded-full w-full h-full flex items-center justify-center">{slot.level + 1}</span>
                      )}
                    </span>
                    {!isPassive && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 text-[clamp(8px,2vw,11px)] font-bold rounded-full min-w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center px-0.5 ${
                          isDisabled
                            ? 'bg-slate-600 text-slate-400'
                            : 'bg-yellow-500 text-white'
                        }`}
                      >
                        {slot.count}/{slot.bagSize}
                      </span>
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-900 border border-slate-500 text-white px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium">{slot.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default GameActionBar;
