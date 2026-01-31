import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faBan } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
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
  seed?: bigint;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel?: GameLevelData | null;
  // Cube breakdown for tooltip
  cubesBrought?: number;
  cubesSpent?: number;
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
  seed = BigInt(0),
  constraintProgress,
  constraint2Progress,
  bonusUsedThisLevel,
  gameLevel,
  cubesBrought = 0,
  cubesSpent = 0,
}) => {
  const isBoss = isBossLevel(level);
  const { playSuccess } = useMusicPlayer();
  
  const prevConstraintProgressRef = useRef(constraintProgress);
  const prevLevelRef = useRef(level);
  const [justSatisfied, setJustSatisfied] = useState(false);

  // Build level config
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

  const hasConstraint = levelConfig.constraint.constraintType !== ConstraintType.None;
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

  const scoreProgress = Math.min(100, (levelScore / levelConfig.pointsRequired) * 100);
  const movesRemaining = Math.max(0, levelConfig.maxMoves - levelMoves);
  const availableCubes = Math.max(0, totalCubes + cubesBrought - cubesSpent);

  const potentialCubes = React.useMemo(() => {
    if ('potentialCubes' in levelConfig && typeof levelConfig.potentialCubes === 'function') {
      return levelConfig.potentialCubes(levelMoves);
    }
    if (levelMoves <= levelConfig.cube3Threshold) return 3;
    if (levelMoves <= levelConfig.cube2Threshold) return 2;
    return 1;
  }, [levelConfig, levelMoves]);

  // Compact constraint badge
  const ConstraintBadge = ({ 
    constraint, 
    progress, 
    satisfied,
    color = "orange"
  }: { 
    constraint: Constraint; 
    progress: number; 
    satisfied: boolean;
    color?: string;
  }) => {
    if (constraint.constraintType === ConstraintType.None) return null;

    if (constraint.constraintType === ConstraintType.NoBonusUsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`text-[9px] flex items-center gap-0.5 px-1 py-0.5 rounded cursor-help ${
                bonusUsedThisLevel 
                  ? "bg-red-500/30 text-red-400" 
                  : "bg-green-500/30 text-green-400"
              }`}>
                {bonusUsedThisLevel ? (
                  <FontAwesomeIcon icon={faBan} className="w-2 h-2" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="w-2 h-2" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 text-xs">
              No bonus allowed
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // ClearLines constraint
    const bgColor = satisfied ? "bg-green-500/30" : `bg-${color}-500/30`;
    const textColor = satisfied ? "text-green-400" : `text-${color}-400`;

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`text-[9px] flex items-center gap-0.5 px-1 py-0.5 rounded cursor-help ${
              satisfied ? "bg-green-500/30" : (color === "purple" ? "bg-purple-500/30" : "bg-orange-500/30")
            }`}>
              <span className={satisfied ? "text-green-400" : (color === "purple" ? "text-purple-400" : "text-orange-400")}>
                {constraint.value}+
              </span>
              <span className={`font-medium ${satisfied ? "text-green-400" : (color === "purple" ? "text-purple-400" : "text-orange-400")}`}>
                {progress}/{constraint.requiredCount}
              </span>
              {satisfied && <FontAwesomeIcon icon={faCheck} className="w-2 h-2 text-green-400" />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 text-xs">
            {constraint.getDescription()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full space-y-1">
      {/* Row 1: Level + Total Score + Cube Balance */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-white">Lv.{level}</span>
          {isBoss && (
            <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase">
              Boss
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-400 font-semibold">{displayTotalScore}</span>
          
          {/* Cube balance with tooltip */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 cursor-help">
                  <span className="text-xs text-yellow-400 font-semibold">{availableCubes}</span>
                  <span className="text-[10px]">🧊</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white mb-1">Cubes</div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-400">Earned</span>
                    <span className="text-yellow-400">{totalCubes}</span>
                  </div>
                  {cubesBrought > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Brought</span>
                      <span className="text-blue-400">+{cubesBrought}</span>
                    </div>
                  )}
                  {cubesSpent > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-400">Spent</span>
                      <span className="text-red-400">-{cubesSpent}</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 2: Progress | Constraints | Moves | Potential Cubes */}
      <div className="flex items-center gap-1.5">
        {/* Score progress bar with points */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={false}
              animate={{ width: `${scoreProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[9px] text-slate-300 whitespace-nowrap">
            <span className="text-white font-medium">{displayScore}</span>
            <span className="text-slate-500">/{levelConfig.pointsRequired}</span>
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-3 bg-slate-600" />

        {/* Constraints */}
        {hasConstraint && (
          <ConstraintBadge 
            constraint={levelConfig.constraint} 
            progress={constraintProgress} 
            satisfied={constraintSatisfied}
            color="orange"
          />
        )}
        {hasConstraint2 && (
          <ConstraintBadge 
            constraint={levelConfig.constraint2} 
            progress={constraint2Progress} 
            satisfied={constraint2Satisfied}
            color="purple"
          />
        )}

        {/* Divider */}
        <div className="w-px h-3 bg-slate-600" />

        {/* Moves remaining */}
        <div className="text-[10px] text-slate-300 whitespace-nowrap">
          <span className="font-bold text-white">{movesRemaining}</span>
          <span className="text-slate-500">▶</span>
        </div>

        {/* Divider */}
        <div className="w-px h-3 bg-slate-600" />

        {/* Potential cubes */}
        <div className="flex items-center">
          {[1, 2, 3].map((cube) => (
            <span
              key={cube}
              className={`transition-opacity duration-200 ${
                cube <= potentialCubes ? "opacity-100" : "opacity-20"
              }`}
              style={{ fontSize: 10 }}
            >
              🧊
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelHeaderCompact;
