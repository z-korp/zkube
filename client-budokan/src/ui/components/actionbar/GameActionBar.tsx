import { motion } from "motion/react";
import { Map, Flag, Settings, Volume2, VolumeX } from "lucide-react";
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
  onSurrender: () => void;
  onMap: () => void;
  isGameOver: boolean;
}

const GameActionBar: React.FC<GameActionBarProps> = ({
  bonusSlots,
  activeBonus,
  bonusDescription,
  onSurrender,
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
    <div className="w-full px-2 pb-2 shrink-0">
      {activeBonus !== BonusType.None && bonusDescription && (
        <div className="mb-1 text-center font-sans text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-center gap-[clamp(4px,1.5vw,10px)] px-[clamp(8px,2vw,14px)] py-[clamp(8px,2vw,14px)]">
        <motion.button
          onClick={onMap}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-[clamp(38px,10vw,48px)] h-[clamp(38px,10vw,48px)] rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-colors shrink-0"
        >
          <Map className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)]" />
        </motion.button>

        <div className="w-px h-[clamp(30px,7vw,38px)] bg-slate-700" />

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
                      className="absolute -bottom-0.5 -left-0.5 font-sans text-[clamp(9px,2.2vw,12px)] font-bold rounded-full w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center text-white z-10"
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
                        className={`absolute -top-0.5 -right-0.5 font-sans text-[clamp(8px,2vw,11px)] font-bold rounded-full min-w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center px-0.5 ${
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
                  <span className="font-sans text-xs font-medium">{slot.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}

        <div className="w-px h-[clamp(30px,7vw,38px)] bg-slate-700" />


        <Dialog>
          <DialogTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-[clamp(38px,10vw,48px)] h-[clamp(38px,10vw,48px)] rounded-full flex items-center justify-center bg-red-900/30 hover:bg-red-800/40 text-red-400 hover:text-red-300 transition-colors"
            >
              <Flag className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)]" />
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

        <Dialog>
          <DialogTrigger asChild>
            <button className="w-[clamp(38px,10vw,48px)] h-[clamp(38px,10vw,48px)] rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-all hover:scale-110 active:scale-90">
              <Settings className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)]" />
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
