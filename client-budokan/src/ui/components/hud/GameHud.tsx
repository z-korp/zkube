import { Map, Rows3, Grid3x3, Flame, ArrowDownUp, Ban, Trash2 } from "lucide-react";
import LevelBadge from "@/ui/components/shared/LevelBadge";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { ConstraintType } from "@/dojo/game/types/constraint";

interface GameHudProps {
  level: number;
  levelScore: number;
  targetScore: number;
  movesRemaining: number;
  totalCubes: number;
  combo: number;
  onHome: () => void;
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
  onHome,
  constraintProgress,
  constraint2Progress,
  constraint3Progress,
  bonusUsedThisLevel,
  gameLevel,
  moves,
  maxMoves,
}) => {
  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;
  const isDanger = movesRemaining <= 3 && movesRemaining > 0;
  const isOut = movesRemaining <= 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;
  const potentialCubes = getCubesFromMoves(moves, maxMoves, cube3Threshold, cube2Threshold);

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
    <div className="max-w-2xl mx-auto w-full px-2 pt-2 shrink-0">
      <div className="flex items-center gap-1.5 md:gap-2 px-2 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-lg">
        {/* Left: Map + Level */}
        <button
          onClick={onHome}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
        >
          <Map size={14} />
        </button>

        <LevelBadge level={level} size="sm" />

        {/* Center: Score + Moves + Combo */}
        <div className="flex items-center gap-1 min-w-0 ml-1">
          <span className="font-['Bangers'] text-sm text-cyan-400 tabular-nums">
            {animatedScore}
          </span>
          <span className="text-slate-500 text-[10px]">/</span>
          <span className="font-['Bangers'] text-sm text-slate-400 tabular-nums">
            {targetScore}
          </span>
        </div>

        <div className="flex items-center min-w-0">
          <span
            className={`font-['Bangers'] text-sm tabular-nums ${
              isOut
                ? "text-red-500"
                : isDanger
                  ? "text-orange-400"
                  : "text-white"
            }`}
          >
            {movesRemaining}
          </span>
          <span className="text-slate-500 text-[10px] ml-0.5">mv</span>
        </div>

        {combo > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-orange-400 text-[10px]">🔥</span>
            <span className="font-['Bangers'] text-sm text-orange-400 tabular-nums">
              {combo}x
            </span>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right: Constraints + Cubes */}
        {constraints.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {constraints.map((c, i) => (
              <ProgressRing
                key={`constraint-${i}`}
                progress={getConstraintProgress(c.type, c.progress, c.count, bonusUsedThisLevel)}
                size={ringSize}
                color={getConstraintColor(c.type, c.progress, c.count, bonusUsedThisLevel)}
                icon={getConstraintIcon(c.type, iconSize)}
                badge={getConstraintBadge(c.type, c.progress, c.count)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`text-xs ${i <= potentialCubes ? "opacity-100" : "opacity-20"}`}
            >
              🧊
            </span>
          ))}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-xs">🧊</span>
          <span className="font-['Bangers'] text-sm text-yellow-400 tabular-nums">
            {totalCubes}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameHud;
