import { motion, AnimatePresence } from "motion/react";
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
      {/* Active bonus description — floats above buttons */}
      <AnimatePresence>
        {activeBonus !== BonusType.None && bonusDescription && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          >
            {bonusDescription}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus buttons in a slim pill-shaped panel */}
      <div className="max-w-[280px] mx-auto flex items-center justify-center gap-[clamp(6px,2vw,12px)] bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-full px-[clamp(10px,3vw,20px)] py-[clamp(4px,1vw,8px)]">
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
                    whileHover={isPassive || isDisabled ? undefined : { scale: 1.08 }}
                    whileTap={isPassive || isDisabled ? undefined : { scale: 0.92 }}
                    className={`relative w-[clamp(44px,12vw,60px)] h-[clamp(44px,12vw,60px)] rounded-full overflow-visible flex items-center justify-center transition-all ${
                      isPassive
                        ? 'cursor-default opacity-90'
                        : isActive
                          ? 'ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                          : isDisabled
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:ring-1 hover:ring-slate-400 cursor-pointer'
                    }`}
                    style={isPassive ? { boxShadow: `0 0 8px ${arcColor}30` } : undefined}
                  >
                    <img
                      src={slot.icon}
                      alt={slot.type}
                      className={`w-full h-full rounded-full object-cover ${
                        isDisabled && !isPassive ? 'grayscale opacity-60' : ''
                      }`}
                    />
                    {/* Level badge — bottom left */}
                    <span
                      className="absolute -bottom-0.5 -left-0.5 text-[clamp(8px,2vw,11px)] font-bold rounded-full w-[clamp(16px,4.5vw,22px)] h-[clamp(16px,4.5vw,22px)] flex items-center justify-center text-white z-10"
                      style={{ backgroundColor: isPassive ? arcColor : undefined }}
                    >
                      {isPassive ? (
                        <span className="text-[clamp(7px,1.6vw,9px)]">{slot.level}</span>
                      ) : (
                        <span className="bg-indigo-500 rounded-full w-full h-full flex items-center justify-center">{slot.level + 1}</span>
                      )}
                    </span>
                    {/* Charges badge — top right */}
                    {!isPassive && (
                      <span
                        className={`absolute -top-0.5 -right-0.5 text-[clamp(8px,2vw,10px)] font-bold rounded-full min-w-[clamp(16px,4.5vw,22px)] h-[clamp(16px,4.5vw,22px)] flex items-center justify-center px-0.5 ${
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
                  className="bg-slate-900 border border-slate-500 text-white px-2.5 py-1 shadow-lg"
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
