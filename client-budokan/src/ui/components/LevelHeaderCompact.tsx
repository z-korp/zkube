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
  const prevConstraint2ProgressRef = useRef(constraint2Progress);
  const prevLevelRef = useRef(level);
  const [justSatisfied, setJustSatisfied] = useState(false);
  const [recentlyFilledDots, setRecentlyFilledDots] = useState<Set<string>>(new Set());
  const [recentlyFilledDots2, setRecentlyFilledDots2] = useState<Set<string>>(new Set());

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
      prevConstraint2ProgressRef.current = 0;
      setJustSatisfied(false);
      setRecentlyFilledDots(new Set());
      setRecentlyFilledDots2(new Set());
    }
  }, [level]);

  // Track constraint 1 progress and animate newly filled dots
  useEffect(() => {
    const prevProgress = prevConstraintProgressRef.current;
    const prevSatisfied = prevProgress >= levelConfig.constraint.requiredCount;
    
    // Track newly filled dots for animation
    if (constraintProgress > prevProgress) {
      const newDots = new Set<string>();
      for (let i = prevProgress; i < constraintProgress; i++) {
        newDots.add(`c1-${i}`);
      }
      setRecentlyFilledDots(newDots);
      // Clear after animation
      setTimeout(() => setRecentlyFilledDots(new Set()), 600);
    }
    
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

  // Track constraint 2 progress and animate newly filled dots
  useEffect(() => {
    const prevProgress = prevConstraint2ProgressRef.current;
    
    if (constraint2Progress > prevProgress) {
      const newDots = new Set<string>();
      for (let i = prevProgress; i < constraint2Progress; i++) {
        newDots.add(`c2-${i}`);
      }
      setRecentlyFilledDots2(newDots);
      // Clear after animation
      setTimeout(() => setRecentlyFilledDots2(new Set()), 600);
    }
    
    prevConstraint2ProgressRef.current = constraint2Progress;
  }, [constraint2Progress]);

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

  // Pace indicator
  const paceText = potentialCubes === 3 ? "Perfect pace!" : potentialCubes === 2 ? "Good pace" : "Hurry up!";
  const paceTextColor = potentialCubes === 3 ? "text-green-400" : potentialCubes === 2 ? "text-yellow-400" : "text-orange-400";
  
  // Moves danger indicator
  const movesInDanger = movesRemaining <= 10;
  const movesColor = movesInDanger ? "text-red-400" : "text-white";
  const movesGlow = movesInDanger ? "animate-pulse" : "";

  // Constraint badge with dot progress
  const ConstraintBadge = ({ 
    constraint, 
    progress, 
    satisfied,
    color = "orange",
    recentlyFilled
  }: { 
    constraint: Constraint; 
    progress: number; 
    satisfied: boolean;
    color?: string;
    recentlyFilled: Set<string>;
  }) => {
    if (constraint.constraintType === ConstraintType.None) return null;

    if (constraint.constraintType === ConstraintType.NoBonusUsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`text-[10px] md:text-xs flex items-center gap-0.5 md:gap-1 cursor-help transition-colors ${
                bonusUsedThisLevel 
                  ? "text-red-400" 
                  : "text-green-400"
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
    const constraintId = color === "purple" ? "c2" : "c1";
    const dots = [];
    for (let i = 0; i < constraint.requiredCount; i++) {
      const isFilled = i < progress;
      const dotKey = `${constraintId}-${i}`;
      const isJustFilled = recentlyFilled.has(dotKey);
      // Use a unique key when animating to force remount and trigger animation
      const uniqueKey = isJustFilled ? `${dotKey}-animating` : dotKey;
      dots.push(
        <motion.div
          key={uniqueKey}
          className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${
            isFilled 
              ? (satisfied ? "bg-green-400" : (color === "purple" ? "bg-purple-400" : "bg-orange-400"))
              : "bg-slate-600"
          }`}
          initial={isJustFilled ? { scale: 1 } : false}
          animate={isJustFilled ? { 
            scale: [1, 1.8, 1.2, 1],
          } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={isJustFilled ? {
            boxShadow: "0 0 12px 4px rgba(251, 146, 60, 0.8)"
          } : {}}
        />
      );
    }

    const textColorClass = satisfied ? "text-green-400" : (color === "purple" ? "text-purple-400" : "text-orange-400");

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className="flex items-center gap-1 cursor-help"
              animate={justSatisfied && satisfied ? {
                scale: [1, 1.05, 1],
                transition: { duration: 0.5 }
              } : {}}
            >
              <span className={`text-[10px] md:text-xs font-bold ${textColorClass}`}>
                {constraint.value}+
              </span>
              <div className="flex items-center gap-0.5">
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

      {/* Row 2: Score + Objectives + Moves */}
      <div className="flex items-center bg-slate-800/50 rounded overflow-hidden">
        {/* Score progress (leftmost) */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1 flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 cursor-help hover:bg-slate-700/50 transition-colors">
                <span className="text-[10px] md:text-xs text-slate-400">Score</span>
                <span className="text-[10px] md:text-xs text-blue-300">{displayScore}</span>
                <div className="flex-1 min-w-6 md:min-w-10 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-400"
                    initial={false}
                    animate={{ width: `${Math.min(100, (levelScore / levelConfig.pointsRequired) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[10px] md:text-xs text-blue-300">{levelConfig.pointsRequired}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-800 border-slate-600 p-2">
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-white">Level Score</div>
                <div className="text-slate-300">Reach {levelConfig.pointsRequired} points to complete the level</div>
                <div className="text-slate-400 text-[10px]">Clear lines to earn points</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Constraints */}
        {hasConstraint && (
          <div className="flex items-center justify-center px-1.5 md:px-2 py-0.5 md:py-1 border-l border-slate-700/50">
            <ConstraintBadge 
              constraint={levelConfig.constraint} 
              progress={constraintProgress} 
              satisfied={constraintSatisfied}
              color="orange"
              recentlyFilled={recentlyFilledDots}
            />
          </div>
        )}
        {hasConstraint2 && (
          <div className="flex items-center justify-center px-1.5 md:px-2 py-0.5 md:py-1 border-l border-slate-700/50">
            <ConstraintBadge 
              constraint={levelConfig.constraint2} 
              progress={constraint2Progress} 
              satisfied={constraint2Satisfied}
              color="purple"
              recentlyFilled={recentlyFilledDots2}
            />
          </div>
        )}

        {/* Moves pill - dramatic when low */}
        <div className={`flex items-center justify-end gap-1 px-1.5 md:px-2 py-0.5 md:py-1 border-l border-slate-700/50 ${movesGlow}`}>
          <span className={`text-sm md:text-sm font-bold ${movesColor}`}>{movesRemaining}</span>
          <span className="text-[10px] md:text-xs text-slate-400">moves</span>
        </div>
      </div>

      {/* Row 3: Tools + Pace + Potential Reward */}
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

        {/* Pace text + Potential cubes with info icon */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className={`text-[10px] md:text-xs font-medium ${paceTextColor}`}>{paceText}</span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 md:gap-1 bg-slate-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded cursor-help hover:bg-slate-700/50 transition-colors">
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 ${paceTextColor}`}
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
    </div>
  );
};

export default LevelHeaderCompact;
