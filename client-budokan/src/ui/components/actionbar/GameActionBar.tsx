import { motion } from "motion/react";
import { Flag } from "lucide-react";
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
  icon: string;
  tooltip: string;
  onClick: () => void;
}

interface GameActionBarProps {
  bonusSlots: BonusSlot[];
  activeBonus: BonusType;
  bonusDescription: string;
  onSurrender: () => void;
  isGameOver: boolean;
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  bonusSlots,
  activeBonus,
  bonusDescription,
  onSurrender,
  isGameOver,
}) => {
  if (isGameOver) return null;

  return (
    <div className="shrink-0 px-4 py-2">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="mx-auto flex w-fit items-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-full px-4 py-2">
        {bonusSlots.map((slot) => {
          const isActive = activeBonus === slot.type;
          const isDisabled = slot.count === 0;

          return (
            <TooltipProvider key={slot.type} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={slot.onClick}
                    disabled={isDisabled}
                    whileHover={isDisabled ? undefined : { scale: 1.1 }}
                    whileTap={isDisabled ? undefined : { scale: 0.9 }}
                    className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-yellow-500/30 ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                        : isDisabled
                          ? "bg-slate-800/30 opacity-40 cursor-not-allowed"
                          : "bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                    }`}
                  >
                    <img
                      src={slot.icon}
                      alt={slot.type}
                      className={`w-6 h-6 md:w-7 md:h-7 object-contain ${
                        isDisabled ? "grayscale opacity-60" : ""
                      }`}
                    />
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${
                        isDisabled
                          ? "bg-slate-600 text-slate-400"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {slot.count}
                    </span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-800 border-slate-600 px-2 py-1"
                >
                  <span className="text-xs">{slot.tooltip}</span>
                </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <motion.button
          onClick={onSurrender}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-red-900/30 hover:bg-red-800/40 text-red-400 hover:text-red-300 transition-colors"
        >
          <Flag size={14} />
        </motion.button>
      </div>
    </div>
  );
};

export default GameActionBar;
