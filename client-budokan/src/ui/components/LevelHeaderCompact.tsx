import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faBan } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import { generateLevelConfig } from "@/dojo/game/types/level";
import type { LevelConfig } from "@/dojo/game/types/level";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import { useMusicPlayer } from "@/contexts/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";
import type { GameLevelData } from "@/hooks/useGameLevel";

interface LevelHeaderCompactProps {
  level: number;
  levelScore: number;
  levelMoves: number;
  totalCubes: number;
  totalScore: number;
  combo: number;
  seed?: bigint;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel?: GameLevelData | null;
}

const isBossLevel = (level: number): boolean => {
  return [10, 20, 30, 40, 50].includes(level);
};

const LevelHeaderCompact: React.FC<LevelHeaderCompactProps> = ({
  level,
  levelScore,
  levelMoves,
  totalCubes,
  totalScore,
  combo,
  seed = BigInt(0),
  constraintProgress,
  constraint2Progress,
  bonusUsedThisLevel,
  gameLevel,
}) => {
  const isBoss = isBossLevel(level);
  const { playSuccess } = useMusicPlayer();
  
  const prevConstraintProgressRef = useRef(constraintProgress);
  const prevLevelRef = useRef(level);
  const [justSatisfied, setJustSatisfied] = useState(false);

  // Build level config from GameLevel model or fallback
  const levelConfig = React.useMemo((): LevelConfig => {
    if (gameLevel && gameLevel.level === level) {
      const constraint = new Constraint(
        gameLevel.constraintType,
        gameLevel.constraintValue,
        gameLevel.constraintCount
      );
      const constraint2 = new Constraint(
        gameLevel.constraint2Type,
        gameLevel.constraint2Value,
        gameLevel.constraint2Count
      );
      return {
        level: gameLevel.level,
        pointsRequired: gameLevel.pointsRequired,
        maxMoves: gameLevel.maxMoves,
        difficulty: Difficulty.from(gameLevel.difficulty),
        constraint,
        constraint2,
        cube3Threshold: gameLevel.cube3Threshold,
        cube2Threshold: gameLevel.cube2Threshold,
      };
    }
    return generateLevelConfig(seed, level);
  }, [gameLevel, level, seed]);

  const constraintSatisfied = React.useMemo(() => {
    if (levelConfig.constraint.constraintType === ConstraintType.None) return true;
    if (levelConfig.constraint.constraintType === ConstraintType.NoBonusUsed) return !bonusUsedThisLevel;
    return constraintProgress >= levelConfig.constraint.requiredCount;
  }, [levelConfig.constraint, constraintProgress, bonusUsedThisLevel]);

  const constraint2Satisfied = React.useMemo(() => {
    if (levelConfig.constraint2.constraintType === ConstraintType.None) return true;
    if (levelConfig.constraint2.constraintType === ConstraintType.NoBonusUsed) return !bonusUsedThisLevel;
    return constraint2Progress >= levelConfig.constraint2.requiredCount;
  }, [levelConfig.constraint2, constraint2Progress, bonusUsedThisLevel]);

  const hasConstraint2 = levelConfig.constraint2.constraintType !== ConstraintType.None;

  useEffect(() => {
    if (level !== prevLevelRef.current) {
      prevLevelRef.current = level;
      prevConstraintProgressRef.current = 0;
      setJustSatisfied(false);
    }
  }, [level]);

  useEffect(() => {
    const prevProgress = prevConstraintProgressRef.current;
    const prevSatisfied = prevProgress >= levelConfig.constraint.requiredCount;
    
    if (
      levelConfig.constraint.constraintType === ConstraintType.ClearLines &&
      constraintProgress > prevProgress &&
      !prevSatisfied && constraintSatisfied
    ) {
      setJustSatisfied(true);
      playSuccess();
      setTimeout(() => setJustSatisfied(false), 2000);
    }
    
    prevConstraintProgressRef.current = constraintProgress;
  }, [constraintProgress, levelConfig.constraint, constraintSatisfied, playSuccess]);

  const displayScore = useLerpNumber(levelScore, { integer: true });
  const displayTotalScore = useLerpNumber(totalScore, { integer: true });
  const displayCombo = useLerpNumber(combo, { integer: true });

  const scoreProgress = Math.min(100, (levelScore / levelConfig.pointsRequired) * 100);
  const movesRemaining = Math.max(0, levelConfig.maxMoves - levelMoves);

  const potentialCubes = React.useMemo(() => {
    if ('potentialCubes' in levelConfig && typeof levelConfig.potentialCubes === 'function') {
      return levelConfig.potentialCubes(levelMoves);
    }
    if (levelMoves <= levelConfig.cube3Threshold) return 3;
    if (levelMoves <= levelConfig.cube2Threshold) return 2;
    return 1;
  }, [levelConfig, levelMoves]);

  // Compact constraint display
  const renderConstraint = (
    constraint: Constraint,
    progress: number,
    satisfied: boolean,
    colorClass: string = "orange"
  ) => {
    if (constraint.constraintType === ConstraintType.None) return null;

    if (constraint.constraintType === ConstraintType.NoBonusUsed) {
      return (
        <div className={`text-[9px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full whitespace-nowrap ${
          bonusUsedThisLevel 
            ? "bg-red-500/20 text-red-400" 
            : `bg-${colorClass}-500/20 text-${colorClass}-400`
        }`}>
          {bonusUsedThisLevel ? (
            <FontAwesomeIcon icon={faBan} width={8} height={8} />
          ) : (
            <FontAwesomeIcon icon={faCheck} width={8} height={8} />
          )}
        </div>
      );
    }

    // ClearLines constraint - show as compact badge
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded cursor-help ${
              satisfied ? "bg-green-500/20" : `bg-${colorClass}-500/20`
            }`}>
              <span className={satisfied ? "text-green-400" : `text-${colorClass}-400`}>
                {constraint.value}+
              </span>
              <span className={`font-semibold ${satisfied ? "text-green-400" : `text-${colorClass}-400`}`}>
                {progress}/{constraint.requiredCount}
              </span>
              {satisfied && <FontAwesomeIcon icon={faCheck} className="text-green-400" width={7} height={7} />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border border-slate-600 p-2 max-w-[200px]">
            <div className="text-xs text-slate-300">{constraint.getDescription()}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full space-y-1.5">
      {/* Row 1: Level + Progress bar + Moves */}
      <div className="flex items-center gap-2">
        {/* Level + Boss badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-base text-white">Lv.{level}</span>
          {isBoss && (
            <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase">
              Boss
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-1.5">
          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={false}
              animate={{ width: `${scoreProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] text-slate-300 whitespace-nowrap">
            <span className="font-semibold text-white">{displayScore}</span>
            <span className="text-slate-500">/{levelConfig.pointsRequired}</span>
          </span>
        </div>

        {/* Moves remaining */}
        <div className="text-xs text-slate-300 shrink-0">
          <span className="font-bold text-white">{movesRemaining}</span>
          <span className="text-slate-500">▶</span>
        </div>
      </div>

      {/* Row 2: Constraints + Cubes + Score + Combo */}
      <div className="flex items-center justify-between gap-2">
        {/* Constraints */}
        <div className="flex items-center gap-1">
          {renderConstraint(levelConfig.constraint, constraintProgress, constraintSatisfied, "orange")}
          {hasConstraint2 && renderConstraint(levelConfig.constraint2, constraint2Progress, constraint2Satisfied, "purple")}
        </div>

        {/* Cube pace indicators */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map((cube) => (
            <span
              key={cube}
              className={`transition-opacity duration-200 ${
                cube <= potentialCubes ? "opacity-100" : "opacity-30"
              }`}
              style={{ fontSize: 14 }}
            >
              🧊
            </span>
          ))}
        </div>

        {/* Score + Cubes */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-blue-400 font-semibold">{displayTotalScore}</span>
          <span className="text-yellow-400 font-semibold">{totalCubes}🧊</span>
        </div>

        {/* Combo */}
        {combo > 0 && (
          <div className="flex items-center gap-0.5 bg-orange-500/20 px-1.5 py-0.5 rounded text-xs">
            <span className="font-bold text-orange-400">{displayCombo}</span>
            <span className="text-orange-400">🔥</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelHeaderCompact;
