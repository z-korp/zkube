import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faBan, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
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

  // Get efficiency message
  const getEfficiencyMessage = () => {
    if (potentialCubes === 3) return { text: "Perfect pace!", color: "text-green-400" };
    if (potentialCubes === 2) return { text: "Good pace", color: "text-yellow-400" };
    return { text: "Finish strong!", color: "text-orange-400" };
  };
  const efficiency = getEfficiencyMessage();

  // Constraint badge with dot progress (old design style)
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
              <div className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md cursor-help border ${
                bonusUsedThisLevel 
                  ? "bg-red-500/20 text-red-400 border-red-500/30" 
                  : "bg-green-500/20 text-green-400 border-green-500/30"
              }`}>
                {bonusUsedThisLevel ? (
                  <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                )}
                <span className="font-medium">No Bonus</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 text-xs">
              No bonus allowed this level
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // ClearLines constraint with dots (old design)
    const dots = [];
    for (let i = 0; i < constraint.requiredCount; i++) {
      const isFilled = i < progress;
      dots.push(
        <motion.div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            isFilled 
              ? (satisfied ? "bg-green-400" : (color === "purple" ? "bg-purple-400" : "bg-orange-400"))
              : "bg-slate-600"
          }`}
          initial={false}
          animate={isFilled ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        />
      );
    }

    const textColorClass = satisfied ? "text-green-400" : (color === "purple" ? "text-purple-400" : "text-orange-400");
    const bgColorClass = satisfied ? "bg-green-500/10 border-green-500/30" : (color === "purple" ? "bg-purple-500/10 border-purple-500/30" : "bg-orange-500/10 border-orange-500/30");

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-help border ${bgColorClass}`}
              animate={justSatisfied && satisfied ? {
                scale: [1, 1.05, 1],
                transition: { duration: 0.5 }
              } : {}}
            >
              <span className={`text-sm font-bold ${textColorClass}`}>
                {constraint.value}+
              </span>
              <span className={`text-xs ${textColorClass}`}>
                {progress}/{constraint.requiredCount}
              </span>
              <div className="flex items-center gap-1">
                {dots}
              </div>
              {satisfied && <FontAwesomeIcon icon={faCheck} className={`w-3 h-3 ${textColorClass}`} />}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 text-xs max-w-[200px]">
            <div className="space-y-1">
              <div className="font-semibold">{constraint.getLabel()}</div>
              <div className="text-slate-400">{constraint.getDescription()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full space-y-2">
      {/* Row 1: Level + Score + Cubes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-white">Level {level}</span>
          {isBoss && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase tracking-wide">
              Boss
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Total Score */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
            <span className="text-xs text-slate-400">Score:</span>
            <span className="text-base font-semibold text-blue-400">{displayTotalScore}</span>
          </div>
          
          {/* Cube balance with tooltip */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded cursor-help hover:bg-slate-700/50 transition-colors">
                  <span className="text-base text-yellow-400 font-semibold">{availableCubes}</span>
                  <span className="text-base">🧊</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-3">
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-white mb-2">Cubes Breakdown</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Earned</span>
                    <span className="text-yellow-400 font-medium">{totalCubes}</span>
                  </div>
                  {cubesBrought > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Brought</span>
                      <span className="text-blue-400 font-medium">+{cubesBrought}</span>
                    </div>
                  )}
                  {cubesSpent > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400">Spent</span>
                      <span className="text-red-400 font-medium">-{cubesSpent}</span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 2: Score progress bar (smaller) */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={false}
            animate={{ width: `${scoreProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-slate-300 whitespace-nowrap min-w-[60px]">
          <span className="text-white font-medium">{displayScore}</span>
          <span className="text-slate-500">/{levelConfig.pointsRequired}</span>
        </span>
      </div>

      {/* Row 3: Constraints + Moves + Potential Cubes (all on one line) */}
      <div className="flex items-center justify-between">
        {/* Constraints */}
        <div className="flex items-center gap-2">
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
        </div>

        {/* Right side: Moves + Potential cubes */}
        <div className="flex items-center gap-3">
          {/* Moves remaining */}
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white">{movesRemaining}</span>
            <span className="text-slate-400"> moves left</span>
          </div>

          {/* Potential cubes with hover effect */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center cursor-help">
                  {[1, 2, 3].map((cube) => (
                    <motion.span
                      key={cube}
                      className={`transition-opacity duration-200 ${
                        cube <= potentialCubes ? "opacity-100" : "opacity-20"
                      }`}
                      style={{ fontSize: 18 }}
                      whileHover={cube <= potentialCubes ? { scale: 1.15 } : {}}
                    >
                      🧊
                    </motion.span>
                  ))}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border-slate-600 p-3 max-w-[220px]"
              >
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-white mb-2">Cube Thresholds</div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-yellow-400">🧊🧊🧊</span>
                    <span className="text-slate-300">≤ {levelConfig.cube3Threshold} moves</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-yellow-400">🧊🧊</span>
                    <span className="text-slate-300">≤ {levelConfig.cube2Threshold} moves</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-yellow-400">🧊</span>
                    <span className="text-slate-300">level clear</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Row 4: Cube info + Efficiency */}
      <div className="flex items-center gap-1.5">
        {/* Info icon */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="p-0.5 hover:bg-slate-700/50 rounded transition-colors cursor-help"
              >
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className="text-slate-400 hover:text-slate-300"
                  width={12}
                  height={12}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-slate-800 border-slate-600 p-3 max-w-[220px]"
            >
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-white mb-2">Cube Thresholds</div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-yellow-400">🧊🧊🧊</span>
                  <span className="text-slate-300">≤ {levelConfig.cube3Threshold} moves</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-yellow-400">🧊🧊</span>
                  <span className="text-slate-300">≤ {levelConfig.cube2Threshold} moves</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-yellow-400">🧊</span>
                  <span className="text-slate-300">level clear</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Cubes with hover effect */}
        {[1, 2, 3].map((cube) => (
          <motion.span
            key={cube}
            className={`cursor-default transition-all ${
              cube <= potentialCubes ? "opacity-100" : "opacity-30"
            }`}
            style={{ fontSize: 18 }}
            whileHover={cube <= potentialCubes ? { scale: 1.2 } : {}}
          >
            🧊
          </motion.span>
        ))}

        {/* Efficiency text */}
        <span className={`text-sm ml-1 font-medium ${efficiency.color}`}>
          {efficiency.text}
        </span>
      </div>
    </div>
  );
};

export default LevelHeaderCompact;
