import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faBan, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
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
  cubesBrought?: number;
  cubesSpent?: number;
  // Bonus props for inline display
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  activeBonus: number; // BonusType
  onBonusHammerClick: () => void;
  onBonusWaveClick: () => void;
  onBonusTotemClick: () => void;
  bonusImages: {
    hammer: string;
    wave: string;
    tiki: string;
  };
}

const isBossLevel = (level: number): boolean => {
  return [10, 20, 30, 40, 50].includes(level);
};

// Inline bonus button component
const BonusButton: React.FC<{
  onClick: () => void;
  image: string;
  count: number;
  tooltip: string;
  isActive: boolean;
}> = ({ onClick, image, count, tooltip, isActive }) => {
  const isDisabled = count === 0;

  const getBgClass = () => {
    if (isActive) return "bg-yellow-500/80 hover:bg-yellow-500/90";
    if (isDisabled) return "bg-slate-800/50 opacity-40";
    return "bg-slate-800/50 hover:bg-slate-700/50";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            disabled={isDisabled}
            className={`relative w-9 h-9 md:w-11 md:h-11 rounded flex items-center justify-center transition-colors ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${getBgClass()}`}
            whileHover={isDisabled ? {} : { scale: 1.05 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
          >
            <img 
              src={image} 
              alt="bonus" 
              className={`w-5 h-5 md:w-7 md:h-7 object-contain ${isDisabled ? "grayscale opacity-60" : ""}`}
            />
            <div className={`absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 text-[8px] md:text-[10px] font-bold rounded-full w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center
              ${isDisabled ? "bg-slate-600 text-slate-400" : "bg-yellow-500 text-white"}`}
            >
              {count}
            </div>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 md:p-3">
          <div className="text-xs">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
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
  hammerCount,
  waveCount,
  totemCount,
  activeBonus,
  onBonusHammerClick,
  onBonusWaveClick,
  onBonusTotemClick,
  bonusImages,
}) => {
  const isBoss = isBossLevel(level);
  const { playSuccess } = useMusicPlayer();
  
  const prevConstraintProgressRef = useRef(constraintProgress);
  const prevLevelRef = useRef(level);
  const [justSatisfied, setJustSatisfied] = useState(false);

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

  // Pace indicator background color (green = good pace, yellow = ok, orange = slow)
  const paceBgColor = potentialCubes === 3 ? "bg-green-500/20" : potentialCubes === 2 ? "bg-yellow-500/20" : "bg-orange-500/20";

  // Constraint badge with dot progress
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
              <div className={`text-[10px] md:text-xs flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded cursor-help transition-colors ${
                bonusUsedThisLevel 
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}>
                {bonusUsedThisLevel ? (
                  <FontAwesomeIcon icon={faBan} className="w-2.5 h-2.5 md:w-3 md:h-3" />
                ) : (
                  <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5 md:w-3 md:h-3" />
                )}
                <span className="font-medium">No Bonus</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2">
              <div className="text-xs">No bonus allowed this level</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // ClearLines constraint with dots
    const dots = [];
    for (let i = 0; i < constraint.requiredCount; i++) {
      const isFilled = i < progress;
      dots.push(
        <motion.div
          key={i}
          className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
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
    const bgColorClass = satisfied 
      ? "bg-green-500/20 hover:bg-green-500/30" 
      : (color === "purple" ? "bg-purple-500/20 hover:bg-purple-500/30" : "bg-orange-500/20 hover:bg-orange-500/30");

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={`flex items-center gap-1 md:gap-2 px-1.5 md:px-2 py-0.5 md:py-1 rounded cursor-help transition-colors ${bgColorClass}`}
              animate={justSatisfied && satisfied ? {
                scale: [1, 1.05, 1],
                transition: { duration: 0.5 }
              } : {}}
            >
              <span className={`text-xs md:text-sm font-bold ${textColorClass}`}>
                {constraint.value}+
              </span>
              <span className={`text-[10px] md:text-xs ${textColorClass}`}>
                {progress}/{constraint.requiredCount}
              </span>
              <div className="flex items-center gap-0.5 md:gap-1">
                {dots}
              </div>
              {satisfied && <FontAwesomeIcon icon={faCheck} className={`w-2.5 h-2.5 md:w-3 md:h-3 ${textColorClass}`} />}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2">
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-white">{constraint.getLabel()}</div>
              <div className="text-slate-400">{constraint.getDescription()}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="w-full space-y-1 md:space-y-2">
      {/* Row 1: Level + Score + Cubes (original design) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="font-bold text-base md:text-lg text-white">Level {level}</span>
          {isBoss && (
            <span className="text-[8px] md:text-[10px] font-bold px-1 md:px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase">
              Boss
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Score */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
            <span className="text-[10px] md:text-xs text-slate-400">Score:</span>
            <span className="text-sm md:text-base font-semibold text-blue-400">{displayTotalScore}</span>
          </div>
          
          {/* Cube balance */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 md:gap-1 bg-slate-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded cursor-help hover:bg-slate-700/50 transition-colors">
                  <span className="text-sm md:text-base text-yellow-400 font-semibold">{availableCubes}</span>
                  <span className="text-sm md:text-base">🧊</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 md:p-3">
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-white">Cubes</div>
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

      {/* Row 2: Objectives + Progress + Moves */}
      <div className="flex items-center gap-1.5 md:gap-2">
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
        
        {/* Score progress */}
        <div className="flex items-center gap-1 bg-slate-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          <span className="text-[10px] md:text-xs text-blue-400 font-medium">{displayScore}</span>
          <div className="w-8 md:w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={false}
              animate={{ width: `${Math.min(100, (levelScore / levelConfig.pointsRequired) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-[10px] md:text-xs text-slate-500">{levelConfig.pointsRequired}</span>
        </div>

        {/* Moves pill */}
        <div className="flex items-center gap-1 bg-slate-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          <span className="text-sm md:text-base font-bold text-white">{movesRemaining}</span>
          <span className="text-[10px] md:text-xs text-slate-400">moves</span>
        </div>
      </div>

      {/* Row 3: Tools + Potential Reward */}
      <div className="flex items-center justify-between">
        {/* Bonus buttons */}
        <div className="flex items-center gap-1 md:gap-1.5">
          <BonusButton
            onClick={onBonusHammerClick}
            image={bonusImages.hammer}
            count={hammerCount}
            tooltip="Destroy a block and connected same-size blocks"
            isActive={activeBonus === 1}
          />
          <BonusButton
            onClick={onBonusWaveClick}
            image={bonusImages.wave}
            count={waveCount}
            tooltip="Destroy an entire horizontal line"
            isActive={activeBonus === 2}
          />
          <BonusButton
            onClick={onBonusTotemClick}
            image={bonusImages.tiki}
            count={totemCount}
            tooltip="Destroy all blocks of the same size"
            isActive={activeBonus === 3}
          />
        </div>

        {/* Potential cubes with info icon */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded cursor-help hover:bg-slate-700/50 transition-colors ${paceBgColor}`}>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 ${potentialCubes === 3 ? "text-green-400" : potentialCubes === 2 ? "text-yellow-400" : "text-orange-400"}`}
                />
                {[1, 2, 3].map((cube) => (
                  <span
                    key={cube}
                    className={`transition-opacity duration-200 text-sm md:text-base ${
                      cube <= potentialCubes ? "opacity-100" : "opacity-20"
                    }`}
                  >
                    🧊
                  </span>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2 md:p-3">
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-white">Potential Reward</div>
                <div className="flex items-center justify-between gap-3">
                  <span>🧊🧊🧊</span>
                  <span className="text-slate-300">≤ {levelConfig.cube3Threshold} moves used</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>🧊🧊</span>
                  <span className="text-slate-300">≤ {levelConfig.cube2Threshold} moves used</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>🧊</span>
                  <span className="text-slate-300">level clear</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default LevelHeaderCompact;
