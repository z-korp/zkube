import { motion } from "motion/react";
import { Home, Map, Flag, Settings, Volume2, VolumeX } from "lucide-react";
import { BonusType } from "@/dojo/game/types/bonus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/elements/dialog";
import { Slider } from "@/ui/elements/slider";
import { Button } from "@/ui/elements/button";
import { useMusicPlayer } from "@/contexts/hooks";

interface BonusSlot {
  type: BonusType;
  count: number;
  level: number;
  bagSize: number;
  icon: string;
  tooltip: string;
  onClick: () => void;
}

interface GameActionBarProps {
  bonusSlots: BonusSlot[];
  activeBonus: BonusType;
  bonusDescription: string;
  onSurrender: () => void;
  onHome: () => void;
  onMap: () => void;
  isGameOver: boolean;
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  bonusSlots,
  activeBonus,
  bonusDescription,
  onSurrender,
  onHome,
  onMap,
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
    <div className="w-full px-2 pb-3 pt-1 shrink-0">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-3">
        <motion.button
          onClick={onHome}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-colors shrink-0"
        >
          <Home size={15} />
        </motion.button>
        <motion.button
          onClick={onMap}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-colors shrink-0"
        >
          <Map size={15} />
        </motion.button>

        <div className="w-px h-8 bg-slate-700 mx-1" />

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
                    <span className="absolute -top-0.5 -left-0.5 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center bg-indigo-500 text-white z-10">
                      {slot.level + 1}
                    </span>
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-0.5 ${
                        isDisabled
                          ? "bg-slate-600 text-slate-400"
                          : "bg-yellow-500 text-white"
                      }`}
                    >
                      {slot.count}/{slot.bagSize}
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
          className="w-9 h-9 rounded-full flex items-center justify-center bg-red-900/30 hover:bg-red-800/40 text-red-400 hover:text-red-300 transition-colors"
        >
          <Flag size={15} />
        </motion.button>

        <Dialog>
          <DialogTrigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-all hover:scale-110 active:scale-90">
              <Settings size={15} />
            </button>
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
