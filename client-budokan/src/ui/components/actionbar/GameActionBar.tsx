import { motion } from "motion/react";
import { Flag, Settings, Volume2, VolumeX, Info } from "lucide-react";
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
import { getBonusType } from "@/config/mutatorConfig";

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
    <div className="w-full px-2 pb-2 shrink-0">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-1 text-center font-sans text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-center gap-[clamp(4px,1.5vw,10px)] px-[clamp(8px,2vw,14px)] py-[clamp(8px,2vw,14px)]">
        {bonusSlots.map((slot, idx) => {
          const isSelected = slot.isActive && activeBonus === slot.type;
          const isUsable = slot.isActive && slot.charges > 0;
          const isInactive = !slot.isActive;

          return (
            <div key={`${slot.type}-${idx}`} className="relative">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={slot.isActive ? slot.onClick : undefined}
                      disabled={!slot.isActive || slot.charges === 0}
                      whileHover={isUsable ? { scale: 1.1 } : undefined}
                      whileTap={isUsable ? { scale: 0.9 } : undefined}
                      className={`relative w-[clamp(48px,13vw,64px)] h-[clamp(48px,13vw,64px)] rounded-full overflow-visible flex items-center justify-center transition-all ${
                        isInactive
                          ? "opacity-30 cursor-default grayscale"
                          : isSelected
                            ? "ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                            : !isUsable
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:ring-1 hover:ring-slate-500 cursor-pointer"
                      }`}
                    >
                      <img
                        src={slot.icon}
                        alt={slot.name}
                        className={`w-full h-full rounded-full object-cover ${
                          !isUsable && !isInactive ? "grayscale opacity-60" : ""
                        }`}
                      />
                      {/* Charges badge — bottom right */}
                      {slot.isActive && (
                        <span
                          className={`absolute -bottom-1 -right-1 font-sans text-[clamp(9px,2.2vw,12px)] font-bold rounded-full min-w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center px-1 z-10 ${
                            slot.charges > 0
                              ? "bg-yellow-500 text-white"
                              : "bg-slate-600 text-slate-400"
                          }`}
                        >
                          {slot.charges}
                        </span>
                      )}
                      {/* "Not rolled" indicator for inactive slots */}
                      {isInactive && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider"></span>
                        </span>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg max-w-[220px]"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-sans text-xs font-bold">
                        {slot.name}
                        {!slot.isActive && " (not rolled)"}
                      </span>
                      <span className="font-sans text-[11px] text-slate-300">
                        {slot.description}
                      </span>
                      {slot.triggerDescription && (
                        <span className="font-sans text-[10px] text-yellow-400/90 mt-0.5">
                          {slot.triggerDescription}
                        </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Info button — small, top-left corner of each slot */}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="absolute -top-1 -left-1 z-20 w-[18px] h-[18px] rounded-full bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center transition-colors">
                    <Info className="w-3 h-3 text-slate-300" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <img src={slot.icon} alt={slot.name} className="w-8 h-8 rounded-full" />
                      {slot.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-white/80 text-xs uppercase tracking-wider mb-1">Effect</p>
                      <p className="text-slate-300">{slot.description}</p>
                    </div>
                    {slot.triggerDescription && (
                      <div>
                        <p className="font-semibold text-white/80 text-xs uppercase tracking-wider mb-1">How to earn</p>
                        <p className="text-yellow-400/90">{slot.triggerDescription}</p>
                      </div>
                    )}
                    {!slot.isActive && (
                      <p className="text-slate-500 text-xs italic">
                        This bonus was not rolled for this run. A random bonus is selected at game start.
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          );
        })}

        {bonusSlots.length > 0 && (
          <div className="w-px h-[clamp(30px,7vw,38px)] bg-slate-700" />
        )}

        {/* Settings & Surrender combined dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-[clamp(38px,10vw,48px)] h-[clamp(38px,10vw,48px)] rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-colors"
            >
              <Settings className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)]" />
            </motion.button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Settings</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {/* Sound settings */}
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

              {/* Surrender */}
              <div className="rounded-lg border border-red-900/50 p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Your run will end and progress for this level will be lost.
                </p>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onSurrender}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Surrender
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};


export default GameActionBar;
