import { motion } from "motion/react";
import { Map, Flag, Settings, Volume2, VolumeX } from "lucide-react";
import { useMoveStore } from "@/stores/moveTxStore";
import { BonusType } from "@/dojo/game/types/bonus";
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
        <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-yellow-300">
          {bonusDescription}
        </div>
      )}
      <div className="max-w-[500px] mx-auto w-full flex items-center justify-center gap-[clamp(4px,1.5vw,10px)] bg-slate-900/90 backdrop-blur-sm border border-slate-500/50 rounded-lg px-[clamp(8px,2vw,14px)] py-[clamp(8px,2vw,14px)]">
        <motion.button
          onClick={onMap}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-[clamp(38px,10vw,48px)] h-[clamp(38px,10vw,48px)] rounded-full flex items-center justify-center bg-slate-700/30 hover:bg-slate-600/40 text-slate-400 hover:text-slate-300 transition-colors shrink-0"
        >
          <Map className="w-[clamp(18px,4.5vw,22px)] h-[clamp(18px,4.5vw,22px)]" />
        </motion.button>

        <div className="w-px h-[clamp(30px,7vw,38px)] bg-slate-700" />

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
                    className={`relative w-[clamp(48px,13vw,64px)] h-[clamp(48px,13vw,64px)] rounded-full overflow-visible flex items-center justify-center transition-all ${
                      isActive
                        ? "ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]"
                        : isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:ring-1 hover:ring-slate-500 cursor-pointer"
                    }`}
                  >
                    <img
                      src={slot.icon}
                      alt={slot.type}
                      className={`w-full h-full rounded-full object-cover ${
                        isDisabled ? "grayscale opacity-60" : ""
                      }`}
                    />
                    <span className="absolute -bottom-0.5 -left-0.5 text-[clamp(9px,2.2vw,12px)] font-bold rounded-full w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center bg-indigo-500 text-white z-10">
                      {slot.level + 1}
                    </span>
                    <span
                      className={`absolute -top-0.5 -right-0.5 text-[clamp(8px,2vw,11px)] font-bold rounded-full min-w-[clamp(20px,5vw,24px)] h-[clamp(20px,5vw,24px)] flex items-center justify-center px-0.5 ${
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

        <div className="w-px h-[clamp(30px,7vw,38px)] bg-slate-700" />

        {/* TX Queue indicator */}
        <TxQueueIndicator />

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

const TxQueueIndicator: React.FC = () => {
  const queue = useMoveStore((s) => s.queue);
  const lastError = useMoveStore((s) => s.lastFailedMoveError);
  const clearFailure = useMoveStore((s) => s.clearFailure);

  const pendingCount = queue.length;
  const submittingCount = queue.filter((m) => m.status === "submitting").length;
  const queuedCount = queue.filter((m) => m.status === "queued").length;

  if (pendingCount === 0 && !lastError) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex items-center justify-center w-[clamp(32px,8vw,40px)] h-[clamp(32px,8vw,40px)] shrink-0">
            {lastError ? (
              <button
                onClick={clearFailure}
                className="w-full h-full rounded-full flex items-center justify-center bg-red-900/50 text-red-400 animate-pulse"
              >
                <span className="text-xs font-bold">!</span>
              </button>
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center bg-blue-900/40 border border-blue-500/40">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              </div>
            )}
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 bg-blue-500 text-white">
                {pendingCount}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg max-w-[220px]"
        >
          {lastError ? (
            <div className="text-xs">
              <p className="font-semibold text-red-400 mb-1">TX Failed</p>
              <p className="text-slate-300 break-words">{lastError}</p>
            </div>
          ) : (
            <div className="text-xs space-y-1">
              {submittingCount > 0 && (
                <p className="text-blue-300">
                  ⏳ {submittingCount} submitting...
                </p>
              )}
              {queuedCount > 0 && (
                <p className="text-slate-300">
                  📋 {queuedCount} queued
                </p>
              )}
              {queue.map((m) => (
                <p
                  key={m.id}
                  className={`text-[10px] ${m.status === "submitting" ? "text-blue-300" : "text-slate-400"}`}
                >
                  Row {m.rowIndex}: {m.startIndex}→{m.finalIndex}{" "}
                  {m.status === "submitting" ? "⏳" : "⏸"}
                </p>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GameActionBar;
