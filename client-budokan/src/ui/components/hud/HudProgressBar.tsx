import { useMemo } from "react";
import type { GameLevelData } from "@/hooks/useGameLevel";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { Rows3, Grid3x3, Flame, ArrowDownUp, Ban, Trash2 } from "lucide-react";

interface HudProgressBarProps {
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves: number;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
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

const getCubesFromMoves = (moves: number, maxMoves: number, cube3: number, cube2: number): number => {
  const remaining = maxMoves - moves;
  if (remaining >= cube3) return 3;
  if (remaining >= cube2) return 2;
  return 1;
};

const HudProgressBar: React.FC<HudProgressBarProps> = ({
  levelScore,
  targetScore,
  moves,
  maxMoves,
  constraintProgress,
  constraint2Progress,
  bonusUsedThisLevel,
  gameLevel,
}) => {
  const scoreProgress = targetScore > 0 ? Math.min(1, levelScore / targetScore) : 0;
  const fillPercent = `${(scoreProgress * 100).toFixed(1)}%`;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;

  const cubeMarkers = useMemo(() => {
    if (!gameLevel || maxMoves === 0) return [];
    const markers: { position: number; label: string }[] = [];

    if (cube3Threshold > 0 && cube3Threshold <= maxMoves) {
      markers.push({
        position: ((maxMoves - cube3Threshold) / maxMoves) * 100,
        label: "3🧊",
      });
    }
    if (cube2Threshold > 0 && cube2Threshold <= maxMoves) {
      markers.push({
        position: ((maxMoves - cube2Threshold) / maxMoves) * 100,
        label: "2🧊",
      });
    }
    return markers;
  }, [gameLevel, maxMoves, cube3Threshold, cube2Threshold]);

  const constraint1 = gameLevel
    ? {
        type: gameLevel.constraintType,
        value: gameLevel.constraintValue,
        count: gameLevel.constraintCount,
      }
    : null;

  const constraint2 = gameLevel?.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None
    ? {
        type: gameLevel.constraint2Type,
        value: gameLevel.constraint2Value,
        count: gameLevel.constraint2Count,
      }
    : null;

  const potentialCubes = getCubesFromMoves(
    moves,
    maxMoves,
    cube3Threshold,
    cube2Threshold
  );

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex-1 relative h-4 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: fillPercent }}
        />

        {cubeMarkers.map((marker) => (
          <div
            key={marker.label}
            className="absolute top-0 bottom-0 w-px bg-yellow-400/60"
            style={{ left: `${marker.position}%` }}
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-yellow-400 whitespace-nowrap">
              {marker.label}
            </span>
          </div>
        ))}
      </div>

      {constraint1 && constraint1.type !== ConstraintType.None && (
        <ProgressRing
          progress={
            constraint1.type === ConstraintType.NoBonusUsed
              ? bonusUsedThisLevel ? 0 : 1
              : constraint1.count > 0 ? constraintProgress / constraint1.count : 0
          }
          size={28}
          color={getConstraintColor(
            constraint1.type,
            constraintProgress,
            constraint1.count,
            bonusUsedThisLevel,
          )}
          icon={getConstraintIcon(constraint1.type, 12)}
          badge={
            constraint1.type !== ConstraintType.NoBonusUsed && constraint1.count > 1
              ? `${constraintProgress}/${constraint1.count}`
              : undefined
          }
        />
      )}

      {constraint2 && (
        <ProgressRing
          progress={
            constraint2.type === ConstraintType.NoBonusUsed
              ? bonusUsedThisLevel ? 0 : 1
              : constraint2.count > 0 ? constraint2Progress / constraint2.count : 0
          }
          size={28}
          color={getConstraintColor(
            constraint2.type,
            constraint2Progress,
            constraint2.count,
            bonusUsedThisLevel,
          )}
          icon={getConstraintIcon(constraint2.type, 12)}
          badge={
            constraint2.type !== ConstraintType.NoBonusUsed && constraint2.count > 1
              ? `${constraint2Progress}/${constraint2.count}`
              : undefined
          }
        />
      )}

      <div className="flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`text-sm ${i <= potentialCubes ? "opacity-100" : "opacity-20"}`}
          >
            🧊
          </span>
        ))}
      </div>
    </div>
  );
};

export default HudProgressBar;
