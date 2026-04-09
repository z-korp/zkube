import { motion } from "motion/react";
import { Flag, Settings, Volume2, VolumeX } from "lucide-react";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";

import { Slider } from "@/ui/elements/slider";
import { Button } from "@/ui/elements/button";
import { useMusicPlayer } from "@/contexts/hooks";


export interface BonusSlot {
  type: BonusType;
  charges: number;
  isActive: boolean; // This is the slot the game rolled
  icon: string;
  name: string;
  description: string;
  triggerDescription: string; // e.g. "Chain 4 combos"
  startingCharges: number;
  onClick: () => void;
}

interface GameActionBarProps {
  bonusSlots: BonusSlot[];
  activeBonus: BonusType; // Currently selected for use (toggled by player)
  bonusDescription: string;
  onSurrender: () => void;
  isGameOver: boolean;
}

const TRIGGER_TYPE_LABELS: Record<number, string> = {
  1: "combo",
  2: "lines cleared",
  3: "points scored",
};

export function buildTriggerDescription(
  triggerType: number,
  triggerThreshold: number,
  startingCharges: number,
): string {
  if (triggerType === 0 || triggerThreshold === 0) return "";
  const label = TRIGGER_TYPE_LABELS[triggerType] ?? "threshold";
  const parts: string[] = [];
  if (triggerType === 1) {
    parts.push(`Every ${triggerThreshold} ${label}`);
  } else {
    parts.push(`Every ${triggerThreshold} ${label}`);
  }
  if (startingCharges > 0) {
    parts.push(`Start with ${startingCharges}`);
  }
  return parts.join(" · ");
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  bonusSlots,
  activeBonus,
  bonusDescription,
  onSurrender,
  isGameOver,
}) => {
  const {
    musicVolume,
    effectsVolume,
    setMusicVolume,
    setEffectsVolume,
    isPlaying,
    playTheme,
    stopTheme,
  } = useMusicPlayer();

  if (isGameOver) return null;

  return (
    <div className="w-full shrink-0">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-1 text-center font-sans text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      {/* Action bar with chrome image — respect aspect ratio, centered */}
      <div className="relative mx-auto" style={{ maxWidth: 400 }}>
        <img
          src="/assets/common/ui/action-bar.png"
          alt=""
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Surrender — left socket */}
        <Dialog>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="absolute rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
              style={{ left: "12%", top: "18%", width: "14%", height: "64%" }}
            >
              <Flag className="w-[40%] h-[40%] drop-shadow-md" />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Surrender?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Your run will end and progress for this level will be lost.</p>
            <div className="flex gap-3">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" className="flex-1" onClick={onSurrender}>Surrender</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bonus — center socket */}
        <div
          className="absolute flex items-center justify-center"
          style={{ left: "38%", top: "12%", width: "24%", height: "76%" }}
        >
          {bonusSlots.map((slot, idx) => {
            const isSelected = activeBonus === slot.type;
            const isUsable = slot.charges > 0;

            return (
              <TooltipProvider key={`${slot.type}-${idx}`} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={slot.onClick}
                      disabled={!isUsable}
                      whileHover={isUsable ? { scale: 1.08 } : undefined}
                      whileTap={isUsable ? { scale: 0.92 } : undefined}
                      className={`relative w-full h-full overflow-visible flex items-center justify-center transition-all ${
                        isSelected
                          ? "drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                          : !isUsable
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer"
                      }`}
                    >
                      <img
                        src={slot.icon}
                        alt={slot.name}
                        className={`w-[60%] h-[60%] object-contain ${
                          !isUsable ? "grayscale opacity-60" : ""
                        }`}
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 font-sans text-[clamp(8px,2vw,11px)] font-bold rounded-full min-w-[clamp(16px,4vw,20px)] h-[clamp(16px,4vw,20px)] flex items-center justify-center px-0.5 z-10 ${
                          slot.charges > 0
                            ? "bg-yellow-500 text-white"
                            : "bg-slate-600 text-slate-400"
                        }`}
                      >
                        {slot.charges}
                      </span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg max-w-[220px]"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-xs font-bold">{slot.name}</span>
                      <span className="font-sans text-[11px] text-slate-300">{slot.description}</span>
                      {slot.triggerDescription && (
                        <span className="font-sans text-[10px] text-yellow-400/90 mt-0.5">{slot.triggerDescription}</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Settings — right socket */}
        <Dialog>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              className="absolute rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
              style={{ right: "12%", top: "18%", width: "14%", height: "64%" }}
            >
              <Settings className="w-[40%] h-[40%] drop-shadow-md" />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Sound Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => (isPlaying ? stopTheme() : playTheme())}
                >
                  {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Music</span>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(value) => setMusicVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Effects</span>
                  <Slider
                    value={[effectsVolume]}
                    onValueChange={(value) => setEffectsVolume(value[0])}
                    max={1}
                    step={0.05}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right shrink-0">
                  {Math.round(effectsVolume * 100)}%
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};


export default GameActionBar;
