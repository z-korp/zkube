import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCircleInfo, faCheck, faBan } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { useMusicPlayer } from "@/contexts/hooks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface LevelHeaderProps {
  level: number;
  levelScore: number;
  levelMoves: number;
  totalCubes: number;
  totalScore: number;
  combo: number;
  seed?: bigint;
  isMdOrLarger: boolean;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  isShopLevel?: boolean;
  cubesAvailable?: number;
  cubesBrought?: number;
  cubesSpent?: number;
  onShopClick?: () => void;
}

// Boss levels occur at 10, 20, 30, 40, 50
const isBossLevel = (level: number): boolean => {
  return [10, 20, 30, 40, 50].includes(level);
};

const LevelHeader: React.FC<LevelHeaderProps> = ({
  level,
  levelScore,
  levelMoves,
  totalCubes,
  totalScore,
  combo,
  seed = BigInt(0),
  isMdOrLarger,
  constraintProgress,
  constraint2Progress,
  bonusUsedThisLevel,
  isShopLevel = false,
  cubesAvailable = 0,
  cubesBrought = 0,
  cubesSpent = 0,
  onShopClick,
}) => {
  const isBoss = isBossLevel(level);
  const { playSuccess } = useMusicPlayer(); // Use success sound for constraint satisfaction
  
  // Track previous constraint progress for animations
  const prevConstraintProgressRef = useRef(constraintProgress);
  const prevLevelRef = useRef(level);
  const [progressIncrement, setProgressIncrement] = useState<number | null>(null);
  const [justSatisfied, setJustSatisfied] = useState(false);

  // Generate level config for display
  const levelConfig = React.useMemo(() => {
    const config = generateLevelConfig(seed, level);
    console.log("[LevelHeader] Generated config:", {
      seed: seed.toString(),
      level,
      pointsRequired: config.pointsRequired,
      maxMoves: config.maxMoves,
      cube3Threshold: config.cube3Threshold,
      cube2Threshold: config.cube2Threshold,
      constraint: config.constraint.getLabel(),
    });
    return config;
  }, [seed, level]);

  // Check if constraint is satisfied
  const constraintSatisfied = React.useMemo(() => {
    if (levelConfig.constraint.constraintType === ConstraintType.None) return true;
    if (levelConfig.constraint.constraintType === ConstraintType.NoBonusUsed) return !bonusUsedThisLevel;
    return constraintProgress >= levelConfig.constraint.requiredCount;
  }, [levelConfig.constraint, constraintProgress, bonusUsedThisLevel]);

  // Check if constraint2 is satisfied (for boss levels with dual constraints)
  const constraint2Satisfied = React.useMemo(() => {
    if (levelConfig.constraint2.constraintType === ConstraintType.None) return true;
    if (levelConfig.constraint2.constraintType === ConstraintType.NoBonusUsed) return !bonusUsedThisLevel;
    return constraint2Progress >= levelConfig.constraint2.requiredCount;
  }, [levelConfig.constraint2, constraint2Progress, bonusUsedThisLevel]);

  // Check if we have a second constraint to display
  const hasConstraint2 = levelConfig.constraint2.constraintType !== ConstraintType.None;

  // Reset states when level changes
  useEffect(() => {
    if (level !== prevLevelRef.current) {
      prevLevelRef.current = level;
      prevConstraintProgressRef.current = 0;
      setJustSatisfied(false);
      setProgressIncrement(null);
    }
  }, [level]);

  // Detect constraint progress changes and trigger animations
  useEffect(() => {
    const prevProgress = prevConstraintProgressRef.current;
    const prevSatisfied = prevProgress >= levelConfig.constraint.requiredCount;
    
    // Check for progress increment (only for ClearLines constraints)
    if (
      levelConfig.constraint.constraintType === ConstraintType.ClearLines &&
      constraintProgress > prevProgress
    ) {
      const increment = constraintProgress - prevProgress;
      setProgressIncrement(increment);
      
      // Clear the increment popup after animation
      setTimeout(() => setProgressIncrement(null), 1000);
      
      // Check if we just satisfied the constraint
      if (!prevSatisfied && constraintSatisfied) {
        setJustSatisfied(true);
        playSuccess(); // Play sound for constraint satisfaction
        
        // Clear the satisfied animation after a delay
        setTimeout(() => setJustSatisfied(false), 2000);
      }
    }
    
    prevConstraintProgressRef.current = constraintProgress;
  }, [constraintProgress, levelConfig.constraint, constraintSatisfied, playSuccess]);

  // Log current game state from contract
  React.useEffect(() => {
    console.log("[LevelHeader] Contract state:", {
      levelScore,
      levelMoves,
      totalCubes,
      totalScore,
      combo,
      movesRemaining: levelConfig.maxMoves - levelMoves,
      scoreProgress: `${levelScore}/${levelConfig.pointsRequired}`,
      isComplete: levelScore >= levelConfig.pointsRequired,
    });
  }, [levelScore, levelMoves, totalCubes, totalScore, combo, levelConfig]);

  const displayScore = useLerpNumber(levelScore, { integer: true });
  const availableCubes = Math.max(0, totalCubes + cubesBrought - cubesSpent);
  const displayAvailableCubes = useLerpNumber(availableCubes, { integer: true });
  const displayTotalScore = useLerpNumber(totalScore, { integer: true });
  const displayCombo = useLerpNumber(combo, { integer: true });

  // Calculate progress
  const scoreProgress = Math.min(100, (levelScore / levelConfig.pointsRequired) * 100);
  const movesRemaining = Math.max(0, levelConfig.maxMoves - levelMoves);
  
  // Calculate potential cubes based on current moves
  const potentialCubes = levelConfig.potentialCubes(levelMoves);

  // Get efficiency message
  const getEfficiencyMessage = () => {
    if (potentialCubes === 3) return { text: "Perfect pace!", color: "text-green-400" };
    if (potentialCubes === 2) return { text: "Good pace", color: "text-yellow-400" };
    return { text: "Finish strong!", color: "text-orange-400" };
  };
  const efficiency = getEfficiencyMessage();

  return (
    <div className="w-full mb-3">
      {/* Row 1: Level title + Total score + Total stars */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-bold ${isMdOrLarger ? "text-2xl" : "text-xl"} text-white`}>
            Level {level}
          </span>
          {isBoss && (
            <span className={`${isMdOrLarger ? "text-xs" : "text-[10px]"} font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-red-600 to-orange-500 text-white uppercase tracking-wide`}>
              Boss
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Total Score */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
            <span className={`${isMdOrLarger ? "text-sm" : "text-xs"} text-slate-400`}>Score:</span>
            <span className={`${isMdOrLarger ? "text-lg" : "text-base"} font-semibold text-blue-400`}>
              {displayTotalScore}
            </span>
          </div>
          {/* Total Cubes with breakdown tooltip */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded cursor-help">
                  <span className={`${isMdOrLarger ? "text-lg" : "text-base"} font-semibold text-yellow-400`}>
                    {displayAvailableCubes}
                  </span>
                  <span className="text-yellow-400" style={{ fontSize: isMdOrLarger ? 16 : 14 }}>
                    🧊
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-slate-800 border border-slate-600 p-3 max-w-[200px]"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white mb-1.5">Cubes Breakdown</div>
                  <div className="flex justify-between text-xs gap-4">
                    <span className="text-slate-400">Earned</span>
                    <span className="text-yellow-400 font-medium">{totalCubes}</span>
                  </div>
                  {cubesBrought > 0 && (
                    <div className="flex justify-between text-xs gap-4">
                      <span className="text-slate-400">Brought</span>
                      <span className="text-blue-400 font-medium">{cubesBrought}</span>
                    </div>
                  )}
                  {cubesSpent > 0 && (
                    <div className="flex justify-between text-xs gap-4">
                      <span className="text-slate-400">Spent</span>
                      <span className="text-red-400 font-medium">-{cubesSpent}</span>
                    </div>
                  )}
                  {(cubesBrought > 0 || cubesSpent > 0) && (
                    <div className="flex justify-between text-xs gap-4 pt-1 border-t border-slate-600">
                      <span className="text-slate-300 font-medium">Available</span>
                      <span className="text-yellow-400 font-semibold">
                        {Math.max(0, totalCubes + cubesBrought - cubesSpent)}
                      </span>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Shop Button - visible on shop levels (6, 11, 16...) with cubes to spend */}
          {isShopLevel && cubesAvailable > 0 && onShopClick && (
            <motion.button
              onClick={onShopClick}
              className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 px-2.5 py-1 rounded text-white font-semibold transition-colors"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span style={{ fontSize: isMdOrLarger ? 14 : 12 }}>🛒</span>
              <span className={`${isMdOrLarger ? "text-sm" : "text-xs"}`}>Shop</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Row 2: Progress bars inline */}
      <div className="mb-2 flex items-center gap-3">
        {/* Score progress bar */}
        <div className="flex items-center gap-1.5 flex-1">
          <div className="flex-1">
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${scoreProgress}%` }}
              />
            </div>
          </div>
          <div className={`${isMdOrLarger ? "text-xs" : "text-[10px]"} text-slate-300 whitespace-nowrap`}>
            <span className="font-semibold text-white">{displayScore}</span>
            <span className="text-slate-400">/{levelConfig.pointsRequired}</span>
          </div>
        </div>

        {/* Constraint progress bar - ClearLines */}
        {levelConfig.constraint.constraintType === ConstraintType.ClearLines && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div 
                  className="flex items-center gap-1.5 min-w-[120px] cursor-help relative"
                  animate={justSatisfied ? {
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.5, times: [0, 0.3, 1] }
                  } : {}}
                >
                  <span className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} text-orange-400 whitespace-nowrap`}>
                    {levelConfig.constraint.value}+
                  </span>
                  <div className="flex-1 min-w-[40px]">
                    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          constraintSatisfied
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-orange-500 to-amber-500"
                        }`}
                        initial={false}
                        animate={{ 
                          width: `${Math.min(100, (constraintProgress / levelConfig.constraint.requiredCount) * 100)}%` 
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} whitespace-nowrap flex items-center gap-0.5`}>
                    <span className={`font-semibold ${constraintSatisfied ? "text-green-400" : "text-orange-400"}`}>
                      {constraintProgress}/{levelConfig.constraint.requiredCount}
                    </span>
                    {constraintSatisfied && (
                      <motion.div
                        initial={justSatisfied ? { scale: 0, rotate: -180 } : { scale: 1, rotate: 0 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      >
                        <FontAwesomeIcon icon={faCheck} className="text-green-400" width={8} height={8} />
                      </motion.div>
                    )}
                  </div>

                  {/* Progress increment popup */}
                  <AnimatePresence>
                    {progressIncrement !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: -15, scale: 1 }}
                        exit={{ opacity: 0, y: -25, scale: 0.8 }}
                        transition={{ duration: 0.4 }}
                        className="absolute -top-2 right-0 text-green-400 font-bold text-xs pointer-events-none"
                      >
                        +{progressIncrement}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Constraint satisfied celebration */}
                  <AnimatePresence>
                    {justSatisfied && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 rounded-lg border-2 border-green-400 pointer-events-none"
                        style={{ boxShadow: "0 0 15px rgba(34, 197, 94, 0.5)" }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border border-slate-600 p-3 max-w-[250px]"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-orange-400">Level Constraint</div>
                  <div className="text-xs text-slate-300">
                    {levelConfig.constraint.getDescription()}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-600">
                    Clear {levelConfig.constraint.value} or more lines in a single move, {levelConfig.constraint.requiredCount} time{levelConfig.constraint.requiredCount > 1 ? "s" : ""} to satisfy this constraint.
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Constraint indicator - No Bonus */}
        {levelConfig.constraint.constraintType === ConstraintType.NoBonusUsed && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div 
                  className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap cursor-help ${
                    bonusUsedThisLevel 
                      ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}
                  animate={bonusUsedThisLevel ? {
                    scale: [1, 1.1, 1],
                    transition: { duration: 0.3 }
                  } : {}}
                >
                  {bonusUsedThisLevel ? (
                    <>
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <FontAwesomeIcon icon={faBan} width={8} height={8} />
                      </motion.div>
                      <span>Bonus used</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} width={8} height={8} />
                      <span>No Bonus</span>
                    </>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border border-slate-600 p-3 max-w-[250px]"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-orange-400">Level Constraint</div>
                  <div className="text-xs text-slate-300">
                    {levelConfig.constraint.getDescription()}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-600">
                    {bonusUsedThisLevel 
                      ? "You used a bonus this level. The constraint is failed but you can still complete the level."
                      : "Complete this level without using any bonus (Hammer, Wave, or Totem) to satisfy this constraint."
                    }
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Second constraint - ClearLines (for boss levels with dual constraints) */}
        {hasConstraint2 && levelConfig.constraint2.constraintType === ConstraintType.ClearLines && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 min-w-[100px] cursor-help">
                  <span className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} text-purple-400 whitespace-nowrap`}>
                    {levelConfig.constraint2.value}+
                  </span>
                  <div className="flex-1 min-w-[30px]">
                    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          constraint2Satisfied
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-purple-500 to-pink-500"
                        }`}
                        initial={false}
                        animate={{ 
                          width: `${Math.min(100, (constraint2Progress / levelConfig.constraint2.requiredCount) * 100)}%` 
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} whitespace-nowrap flex items-center gap-0.5`}>
                    <span className={`font-semibold ${constraint2Satisfied ? "text-green-400" : "text-purple-400"}`}>
                      {constraint2Progress}/{levelConfig.constraint2.requiredCount}
                    </span>
                    {constraint2Satisfied && (
                      <FontAwesomeIcon icon={faCheck} className="text-green-400" width={8} height={8} />
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border border-slate-600 p-3 max-w-[250px]"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-purple-400">Boss Constraint #2</div>
                  <div className="text-xs text-slate-300">
                    {levelConfig.constraint2.getDescription()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Second constraint - NoBonusUsed (for boss levels) */}
        {hasConstraint2 && levelConfig.constraint2.constraintType === ConstraintType.NoBonusUsed && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap cursor-help ${
                    bonusUsedThisLevel 
                      ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}
                >
                  {bonusUsedThisLevel ? (
                    <>
                      <FontAwesomeIcon icon={faBan} width={8} height={8} />
                      <span>Bonus #2</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} width={8} height={8} />
                      <span>No Bonus #2</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border border-slate-600 p-3 max-w-[250px]"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-purple-400">Boss Constraint #2</div>
                  <div className="text-xs text-slate-300">
                    {levelConfig.constraint2.getDescription()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Row 3: Cubes + Moves + Combo */}
      <div className="flex items-center justify-between">
        {/* Cube rating with info tooltip on the left */}
        <div className="flex items-center gap-1">
          {/* Info icon with tooltip - on the left of cubes */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors cursor-help"
                >
                  <FontAwesomeIcon
                    icon={faCircleInfo}
                    className="text-slate-400 hover:text-slate-300"
                    width={14}
                    height={14}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                className="bg-slate-800 border border-slate-600 p-3 max-w-[220px]"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-white mb-2">Cube Thresholds</div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">🧊🧊🧊</span>
                    <span className="text-slate-300">≥ {levelConfig.maxMoves - levelConfig.cube3Threshold} moves left</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">🧊🧊</span>
                    <span className="text-slate-300">≥ {levelConfig.maxMoves - levelConfig.cube2Threshold} moves left</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">🧊</span>
                    <span className="text-slate-300">level clear</span>
                  </div>
                  <div className="border-t border-slate-600 pt-1.5 mt-1.5">
                    <div className="text-xs text-slate-400">
                      Spend cubes in the shop for bonuses
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Cubes */}
          {[1, 2, 3].map((cube) => (
            <span
              key={cube}
              className={`transition-opacity duration-200 ${
                cube <= potentialCubes ? "opacity-100" : "opacity-30"
              }`}
              style={{ fontSize: isMdOrLarger ? 18 : 16 }}
            >
              🧊
            </span>
          ))}

          {/* Efficiency text */}
          <span className={`text-xs ml-1 ${efficiency.color}`}>
            {efficiency.text}
          </span>
        </div>

        {/* Moves remaining */}
        <div className={`${isMdOrLarger ? "text-sm" : "text-xs"} text-slate-300`}>
          <span className="font-semibold text-white">{movesRemaining}</span>
          <span className="text-slate-400"> moves left</span>
        </div>

        {/* Combo indicator */}
        {combo > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-0.5 rounded">
            <span className={`${isMdOrLarger ? "text-sm" : "text-xs"} font-bold text-orange-400`}>
              {displayCombo}
            </span>
            <FontAwesomeIcon
              icon={faFire}
              className="text-orange-400"
              width={isMdOrLarger ? 14 : 12}
              height={isMdOrLarger ? 14 : 12}
            />
          </div>
        )}
      </div>


    </div>
  );
};

export default LevelHeader;
