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
    <div className="shrink-0 px-4 pb-4 pt-2">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="mx-auto flex w-fit items-center gap-3 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-full px-5 py-3">
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
                    className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
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
                      className={`w-7 h-7 md:w-8 md:h-8 object-contain ${
                        isDisabled ? "grayscale opacity-60" : ""
                      }`}
                    />
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center ${
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
                  className="bg-slate-900 border border-slate-500 text-white px-3 py-1.5 shadow-lg"
                >
                  <span className="text-xs font-medium">{slot.tooltip}</span>
                </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

        <div className="w-px h-8 bg-slate-700 mx-1" />

        <motion.button
          onClick={onSurrender}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-red-900/30 hover:bg-red-800/40 text-red-400 hover:text-red-300 transition-colors"
        >
          <Flag size={16} />
        </motion.button>
      </div>
    </div>
  );
};

export default GameActionBar;
