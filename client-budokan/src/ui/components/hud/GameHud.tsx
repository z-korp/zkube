import { useState, useRef, useEffect, useCallback, useSyncExternalStore } from "react";
import { Info } from "lucide-react";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getCommonAssetPath } from "@/config/themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface GameHudProps {
  level: number;
  levelScore: number;
  targetScore: number;
  movesRemaining: number;
  totalCubes: number;
  combo: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
  maxMoves: number;
}

const RING_SIZE_MOBILE = 44;
const RING_SIZE_DESKTOP = 56;
const DESKTOP_BREAKPOINT = 640;

const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const getIsDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

const CONSTRAINT_ICON_MAP: Record<ConstraintType, string | null> = {
  [ConstraintType.ClearLines]: getCommonAssetPath("constraints/constraint-clear-lines.png"),
  [ConstraintType.BreakBlocks]: getCommonAssetPath("constraints/constraint-break-blocks.png"),
  [ConstraintType.AchieveCombo]: getCommonAssetPath("constraints/constraint-combo.png"),
  [ConstraintType.FillAndClear]: getCommonAssetPath("constraints/constraint-fill.png"),
  [ConstraintType.NoBonusUsed]: getCommonAssetPath("constraints/constraint-no-bonus.png"),
  [ConstraintType.ClearGrid]: getCommonAssetPath("constraints/constraint-clear-grid.png"),
  [ConstraintType.None]: null,
};

const getConstraintIcon = (type: ConstraintType) => {
  const src = CONSTRAINT_ICON_MAP[type];
  if (!src) return null;
  return <img src={src} alt="" className="w-full h-full rounded-full object-cover" />;
};

const getConstraintColor = (
  type: ConstraintType,
  progress: number,
  count: number,
  bonusUsed: boolean,
): "green" | "orange" | "red" | "blue" => {
  if (type === ConstraintType.NoBonusUsed) {
    return bonusUsed ? "red" : "green";
  }
  if (progress >= count) return "green";
  if (progress > 0) return "orange";
  return "blue";
};

const getConstraintProgress = (
  type: ConstraintType,
  progress: number,
  count: number,
  bonusUsed: boolean,
): number => {
  if (type === ConstraintType.NoBonusUsed) {
    return bonusUsed ? 0 : 1;
  }
  return count > 0 ? progress / count : 0;
};

/** Top-left badge: the constraint's "what" — value threshold or block size */
const getValueBadge = (
  type: ConstraintType,
  value: number,
): string | undefined => {
  switch (type) {
    case ConstraintType.ClearLines:
      return `${value}+`;
    case ConstraintType.BreakBlocks:
      return `${value}`;
    case ConstraintType.AchieveCombo:
      return `${value}x`;
    case ConstraintType.FillAndClear:
      return `R${value}`;
    default:
      return undefined;
  }
};

/** Bottom-right badge: progress toward completion */
const getProgressBadge = (
  type: ConstraintType,
  progress: number,
  count: number,
): string | undefined => {
  if (type === ConstraintType.NoBonusUsed || type === ConstraintType.ClearGrid) {
    return undefined;
  }
  return `${progress}/${count}`;
};

interface ConstraintData {
  type: ConstraintType;
  value: number;
  count: number;
  progress: number;
}

const GameHud: React.FC<GameHudProps> = ({
  level,
  levelScore,
  targetScore,
  movesRemaining,
  totalCubes,
  combo,
  constraintProgress,
  constraint2Progress,
  constraint3Progress,
  bonusUsedThisLevel,
  gameLevel,
  maxMoves,
}) => {
  const isDesktop = useSyncExternalStore(subscribeResize, getIsDesktop, () => false);
  const ringSize = isDesktop ? RING_SIZE_DESKTOP : RING_SIZE_MOBILE;

  const [movesInfoOpen, setMovesInfoOpen] = useState(false);
  const movesInfoRef = useRef<HTMLDivElement>(null);

  const closeMovesInfo = useCallback(() => setMovesInfoOpen(false), []);

  useEffect(() => {
    if (!movesInfoOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (movesInfoRef.current && !movesInfoRef.current.contains(e.target as Node)) {
        closeMovesInfo();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [movesInfoOpen, closeMovesInfo]);

  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;

  const scoreProgress = targetScore > 0 ? Math.min(1, animatedScore / targetScore) : 0;
  const movesProgress = maxMoves > 0 ? movesRemaining / maxMoves : 0;

  const movesBarColor = movesRemaining >= cube3Threshold
    ? "bg-green-500"
    : movesRemaining >= cube2Threshold
      ? "bg-yellow-500"
      : "bg-red-500";

  const movesTextColor = movesRemaining >= cube3Threshold
    ? "text-green-400"
    : movesRemaining >= cube2Threshold
      ? "text-yellow-400"
      : "text-red-400";

  const cube3MarkerPos = maxMoves > 0 ? (cube3Threshold / maxMoves) * 100 : 0;
  const cube2MarkerPos = maxMoves > 0 ? (cube2Threshold / maxMoves) * 100 : 0;

  const constraints: ConstraintData[] = [];
  if (gameLevel) {
    if (gameLevel.constraintType !== ConstraintType.None) {
      constraints.push({
        type: gameLevel.constraintType,
        value: gameLevel.constraintValue,
        count: gameLevel.constraintCount,
        progress: constraintProgress,
      });
    }
    if (gameLevel.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None) {
      constraints.push({
        type: gameLevel.constraint2Type,
        value: gameLevel.constraint2Value,
        count: gameLevel.constraint2Count,
        progress: constraint2Progress,
      });
    }
    if (gameLevel.constraint3Type !== undefined && gameLevel.constraint3Type !== ConstraintType.None) {
      constraints.push({
        type: gameLevel.constraint3Type,
        value: gameLevel.constraint3Value,
        count: gameLevel.constraint3Count,
        progress: constraint3Progress,
      });
    }
  }

  const potentialCubes = movesRemaining >= cube3Threshold ? 3
    : movesRemaining >= cube2Threshold ? 2 : 1;

  const potentialCubes = movesRemaining >= cube3Threshold ? 3
    : movesRemaining >= cube2Threshold ? 2 : 1;

  const leftColWidth = 3 * ringSize + 2 * 6;

  return (
    <div className="w-full px-2 pt-2 shrink-0">
      <div
        className="max-w-[500px] mx-auto w-full bg-slate-900/90 backdrop-blur-sm border border-slate-500/50 rounded-lg px-3 py-2 grid items-center gap-x-2 gap-y-1.5"
        style={{ gridTemplateColumns: `${leftColWidth}px 1fr auto` }}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-['Tilt_Prism'] text-base text-yellow-400 tracking-wide">Level</span>
          <div className="w-8 h-8 rounded-full border-2 border-yellow-500 bg-slate-900 flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,0.3)]">
            <span className="font-['Tilt_Prism'] text-base text-yellow-400 leading-none">{level}</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-0.5">
            <span className="font-['Tilt_Prism'] text-xs text-slate-300">Score</span>
            <span className="font-['Tilt_Prism'] text-xs text-cyan-300 tabular-nums">
              {animatedScore}<span className="text-slate-400">/{targetScore}</span>
            </span>
          </div>
          <div className="h-2 bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${scoreProgress * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-['Tilt_Prism'] text-sm tabular-nums ${combo > 0 ? "text-white" : "text-slate-500"}`}>
            🔥{combo}x
          </span>
          <span className="text-xs">🧊</span>
          <span className="font-['Tilt_Prism'] text-sm text-blue-300 tabular-nums">{totalCubes}</span>
        </div>

        <div className="flex items-center gap-1.5" style={{ width: leftColWidth }}>
          <TooltipProvider delayDuration={200}>
            {constraints.map((c, i) => {
              const description = Constraint.fromContractValues(
                c.type, c.value, c.count,
              ).getDescription();
              return (
                <Tooltip key={`constraint-${i}`}>
                  <TooltipTrigger asChild>
                    <div>
                      <ProgressRing
                        progress={getConstraintProgress(c.type, c.progress, c.count, bonusUsedThisLevel)}
                        size={ringSize}
                        color={getConstraintColor(c.type, c.progress, c.count, bonusUsedThisLevel)}
                        icon={getConstraintIcon(c.type)}
                        badgeTopLeft={getValueBadge(c.type, c.value)}
                        badgeBottomRight={getProgressBadge(c.type, c.progress, c.count)}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-slate-900 border border-slate-500 text-white text-xs px-2 py-1"
                  >
                    {description}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-0.5">
            <div className="relative inline-flex items-center gap-1" ref={movesInfoRef}>
              <span className="font-['Tilt_Prism'] text-xs text-slate-300">Moves</span>
              <button
                type="button"
                onClick={() => setMovesInfoOpen((v) => !v)}
                className="inline-flex items-center justify-center text-slate-400 hover:text-slate-200 active:text-white transition-colors"
                aria-label="Cube reward thresholds"
              >
                <Info size={11} />
              </button>
              {movesInfoOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 z-50 bg-slate-900 border border-slate-500 rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
                  <div className="flex flex-col gap-1 text-xs text-white">
                    <div className="flex items-center gap-2">
                      <span>🧊🧊🧊</span>
                      <span>≥ {cube3Threshold} moves left</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🧊🧊</span>
                      <span>≥ {cube2Threshold} moves left</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🧊</span>
                      <span>Complete level</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className={`font-['Tilt_Prism'] text-xs tabular-nums ${movesTextColor}`}>
              {movesRemaining}<span className="text-slate-400">/{maxMoves}</span>
            </span>
          </div>
          <div className="relative h-2 bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${movesBarColor}`}
              style={{ width: `${movesProgress * 100}%` }}
            />
            {cube3Threshold > 0 && cube3Threshold < maxMoves && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/40 z-10"
                style={{ left: `${cube3MarkerPos}%` }}
              />
            )}
            {cube2Threshold > 0 && cube2Threshold < maxMoves && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/25 z-10"
                style={{ left: `${cube2MarkerPos}%` }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <span className="text-xs">🧊</span>
          <span className={`font-['Tilt_Prism'] text-sm tabular-nums ${
            potentialCubes >= 3 ? "text-green-400" : potentialCubes >= 2 ? "text-yellow-400" : "text-red-400"
          }`}>+{potentialCubes}</span>
        </div>
      </div>
    </div>
  );
};

export default GameHud;
