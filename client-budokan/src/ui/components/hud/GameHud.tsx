import { useMemo, useSyncExternalStore } from "react";
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
  levelScore: number;
  targetScore: number;
  movesRemaining: number;
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
  [ConstraintType.ComboLines]: getCommonAssetPath("constraints/constraint-clear-lines.png"),
  [ConstraintType.BreakBlocks]: getCommonAssetPath("constraints/constraint-break-blocks.png"),
  [ConstraintType.ComboStreak]: getCommonAssetPath("constraints/constraint-combo.png"),
  [ConstraintType.FillAndClear]: getCommonAssetPath("constraints/constraint-fill.png"),
  [ConstraintType.NoBonusUsed]: getCommonAssetPath("constraints/constraint-no-bonus.png"),
  [ConstraintType.KeepGridBelow]: getCommonAssetPath("constraints/constraint-keep-grid-below.png"),
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
  if (type === ConstraintType.KeepGridBelow) {
    return progress >= 1 ? "red" : "green";
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
  if (type === ConstraintType.KeepGridBelow) {
    return progress >= 1 ? 0 : 1;
  }
  return count > 0 ? progress / count : 0;
};

/** Top-left badge: the constraint's "what" — value threshold or block size */
const getValueBadge = (
  type: ConstraintType,
  value: number,
): string | undefined => {
  switch (type) {
    case ConstraintType.ComboLines:
      return `${value}+`;
    case ConstraintType.BreakBlocks:
      return `${value}`;
    case ConstraintType.ComboStreak:
      return `${value}x`;
    case ConstraintType.FillAndClear:
      return `R${value}`;
    case ConstraintType.KeepGridBelow:
      return `<${value}`;
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
  if (type === ConstraintType.NoBonusUsed || type === ConstraintType.KeepGridBelow) {
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
  levelScore,
  targetScore,
  movesRemaining,
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

  const constraints = useMemo<ConstraintData[]>(() => {
    const result: ConstraintData[] = [];
    if (gameLevel) {
      if (gameLevel.constraintType !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraintType,
          value: gameLevel.constraintValue,
          count: gameLevel.constraintCount,
          progress: constraintProgress,
        });
      }
      if (gameLevel.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint2Type,
          value: gameLevel.constraint2Value,
          count: gameLevel.constraint2Count,
          progress: constraint2Progress,
        });
      }
      if (gameLevel.constraint3Type !== undefined && gameLevel.constraint3Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint3Type,
          value: gameLevel.constraint3Value,
          count: gameLevel.constraint3Count,
          progress: constraint3Progress,
        });
      }
    }
    return result;
  }, [
    gameLevel?.constraintType, gameLevel?.constraintValue, gameLevel?.constraintCount, constraintProgress,
    gameLevel?.constraint2Type, gameLevel?.constraint2Value, gameLevel?.constraint2Count, constraint2Progress,
    gameLevel?.constraint3Type, gameLevel?.constraint3Value, gameLevel?.constraint3Count, constraint3Progress,
  ]);

  return (
    <div className="w-full px-2 pt-2 shrink-0">
      <div
        className="max-w-[500px] mx-auto w-full bg-slate-900/90 backdrop-blur-sm border border-slate-500/50 rounded-lg px-3 py-2 grid items-center gap-x-2 gap-y-1.5"
        style={{ gridTemplateColumns: `auto 1fr auto` }}
      >
        {/* Constraints — left column, spanning both rows */}
        <div className="flex items-center gap-1.5 row-span-2">
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

        {/* Row 1 right: Score bar */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-0.5">
            <span className="font-['Chakra_Petch'] text-xs text-slate-300">Score</span>
            <span className="font-['Chakra_Petch'] text-xs text-cyan-300 tabular-nums">
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

        {/* Row 1 far right: Combo */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <span className={`font-['Chakra_Petch'] text-sm tabular-nums ${combo > 0 ? "text-white" : "text-slate-500"}`}>
                  🔥{combo}x
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 border border-slate-500 text-white text-xs px-2 py-1 z-[200]"
            >
              Combo streak — consecutive moves clearing lines
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Row 2 right: Moves bar */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-0.5">
            <span className="font-['Chakra_Petch'] text-xs text-slate-300">Moves</span>
            <span className={`font-['Chakra_Petch'] text-xs tabular-nums ${movesTextColor}`}>
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

        <div className="w-8" />
      </div>
    </div>
  );
};

export default GameHud;
