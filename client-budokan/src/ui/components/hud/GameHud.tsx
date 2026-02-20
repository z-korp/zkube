import { Rows3, Grid3x3, Flame, ArrowDownUp, Ban, Trash2 } from "lucide-react";
import LevelBadge from "@/ui/components/shared/LevelBadge";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
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
  moves: number;
  maxMoves: number;
}

const getConstraintIcon = (type: ConstraintType, size: number) => {
  switch (type) {
    case ConstraintType.ClearLines:
      return <Rows3 size={size} />;
    case ConstraintType.BreakBlocks:
      return <Grid3x3 size={size} />;
    case ConstraintType.AchieveCombo:
      return <Flame size={size} />;
    case ConstraintType.FillAndClear:
      return <ArrowDownUp size={size} />;
    case ConstraintType.NoBonusUsed:
      return <Ban size={size} />;
    case ConstraintType.ClearGrid:
      return <Trash2 size={size} />;
    default:
      return null;
  }
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

const getConstraintBadge = (
  type: ConstraintType,
  progress: number,
  count: number,
): string | undefined => {
  if (type === ConstraintType.NoBonusUsed || type === ConstraintType.ClearGrid) {
    return undefined;
  }
  if (count > 1) {
    return `${progress}/${count}`;
  }
  return undefined;
};

const getCubesFromMoves = (
  moves: number,
  maxMoves: number,
  cube3: number,
  cube2: number,
): number => {
  const remaining = maxMoves - moves;
  if (remaining >= cube3) return 3;
  if (remaining >= cube2) return 2;
  return 1;
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
  moves,
  maxMoves,
}) => {
  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;
  const potentialCubes = getCubesFromMoves(moves, maxMoves, cube3Threshold, cube2Threshold);

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

  const ringSize = 26;
  const iconSize = 11;

  return (
    <div className="w-full px-2 pt-2 shrink-0">
      <div className="max-w-[500px] mx-auto w-full bg-slate-900/60 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold shrink-0">Level</span>
          <LevelBadge level={level} size="sm" />

          {combo > 0 && (
            <div className="flex items-center gap-0.5 ml-1 shrink-0">
              <span className="font-['Bangers'] text-sm text-orange-400">
                🔥{combo}x
              </span>
            </div>
          )}

          <div className="flex-1" />

          {constraints.length > 0 && (
            <TooltipProvider delayDuration={200}>
              <div className="flex items-center gap-1 shrink-0">
                {constraints.map((c, i) => {
                  const description = Constraint.fromContractValues(
                    c.type,
                    c.value,
                    c.count,
                  ).getDescription();
                  return (
                    <Tooltip key={`constraint-${i}`}>
                      <TooltipTrigger asChild>
                        <div>
                          <ProgressRing
                            progress={getConstraintProgress(c.type, c.progress, c.count, bonusUsedThisLevel)}
                            size={ringSize}
                            color={getConstraintColor(c.type, c.progress, c.count, bonusUsedThisLevel)}
                            icon={getConstraintIcon(c.type, iconSize)}
                            badge={getConstraintBadge(c.type, c.progress, c.count)}
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
              </div>
            </TooltipProvider>
          )}

          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-xs">🧊</span>
            <span className="font-['Bangers'] text-sm text-blue-300 tabular-nums">
              {totalCubes}
            </span>
          </div>
        </div>

        {/* Line 2: Score bar | Moves bar with threshold markers | Potential cubes */}
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-0.5">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Score</span>
              <span className="font-['Bangers'] text-xs text-cyan-300 tabular-nums">
                {animatedScore}
                <span className="text-slate-400">/{targetScore}</span>
              </span>
            </div>
            <div className="h-2 bg-slate-700/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${scoreProgress * 100}%` }}
              />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-0.5">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Moves</span>
              <span className={`font-['Bangers'] text-xs tabular-nums ${movesTextColor}`}>
                {movesRemaining}
                <span className="text-slate-400">/{maxMoves}</span>
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

          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`text-xs ${i <= potentialCubes ? "opacity-100" : "opacity-20"}`}
              >
                🧊
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHud;
