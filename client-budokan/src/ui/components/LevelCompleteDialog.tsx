import React, { useMemo, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faGift,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { Button } from "../elements/button";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import ImageAssets from "@/ui/theme/ImageAssets";

interface LevelCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  levelScore: number;
  levelMoves: number;
  seed: bigint;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  /** Previous bonus counts (before level completion) */
  prevHammer: number;
  prevWave: number;
  prevTotem: number;
  /** Current bonus counts (after level completion) */
  hammer: number;
  wave: number;
  totem: number;
}

const LevelCompleteDialog: React.FC<LevelCompleteDialogProps> = ({
  isOpen,
  onClose,
  level,
  levelScore,
  levelMoves,
  seed,
  constraintProgress: _constraintProgress, // Unused - constraint is always satisfied when level completes
  bonusUsedThisLevel: _bonusUsedThisLevel, // Unused - constraint is always satisfied when level completes
  prevHammer,
  prevWave,
  prevTotem,
  hammer,
  wave,
  totem,
}) => {
  const { themeTemplate } = useTheme();
  const imgAssets = ImageAssets(themeTemplate);
  
  // Animation state for staggered reveals
  const [animationPhase, setAnimationPhase] = useState(0);

  // Reset and start animation when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAnimationPhase(0);
      // Stagger the animation phases
      const timer1 = setTimeout(() => setAnimationPhase(1), 200); // Cubes
      const timer2 = setTimeout(() => setAnimationPhase(2), 800); // Stats
      const timer3 = setTimeout(() => setAnimationPhase(3), 1200); // Bonuses
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  // Generate level config to get objectives
  const levelConfig = useMemo(() => {
    return generateLevelConfig(seed, level);
  }, [seed, level]);

  // Calculate cubes earned
  const cubesEarned = levelConfig.calculateCubes(levelMoves);

  // Calculate expected bonuses from cubes (matches contract logic)
  // 3 cubes = 2 bonuses, 2 cubes = 1 bonus, 1 cube = 0 bonuses
  const expectedBonusCount = useMemo(() => {
    if (cubesEarned >= 3) return 2;
    if (cubesEarned >= 2) return 1;
    return 0;
  }, [cubesEarned]);

  // Calculate bonuses earned - only count positive gains (ignores used bonuses)
  // When a bonus is used to complete a level, the count decreases then increases
  // We only want to show what was gained, not what was used
  const bonusesEarned = useMemo(() => {
    // Only count increases (positive diff means we earned that type)
    const hammerGained = Math.max(0, hammer - prevHammer);
    const waveGained = Math.max(0, wave - prevWave);
    const totemGained = Math.max(0, totem - prevTotem);
    const observedTotal = hammerGained + waveGained + totemGained;
    
    // If we can't observe specific gains but expected bonuses from stars,
    // it means bonuses were earned but offset by usage (e.g., used 1, earned 1 of same type)
    // In this case, just show the expected count without specific types
    const total = Math.max(observedTotal, expectedBonusCount);
    
    return {
      hammer: hammerGained,
      wave: waveGained,
      totem: totemGained,
      total,
      // Flag if we couldn't observe specific types (earned same type as used)
      showGeneric: observedTotal < expectedBonusCount && expectedBonusCount > 0,
    };
  }, [hammer, wave, totem, prevHammer, prevWave, prevTotem, expectedBonusCount]);

  // If the level completed, the constraint was satisfied by definition
  // (the contract requires both score AND constraint to be satisfied for level completion)
  // We can't rely on constraintProgress from prevState since it was captured before the final move
  // Note: constraintSatisfied is always true since the dialog only shows on level completion

  // Display score - use levelScore if available, otherwise show required
  const displayScore = Math.max(levelScore, levelConfig.pointsRequired);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-3xl text-center mb-4 text-green-400">
          Level {level} Complete!
        </DialogTitle>

        {/* Cubes Display with staggered animation */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((cube, index) => (
            <motion.div
              key={cube}
              initial={{ scale: 0, rotate: -180 }}
              animate={animationPhase >= 1 ? { 
                scale: cube <= cubesEarned ? 1.1 : 1, 
                rotate: 0 
              } : { scale: 0, rotate: -180 }}
              transition={{ 
                delay: index * 0.15,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <span
                className={`text-4xl ${
                  cube <= cubesEarned
                    ? "opacity-100"
                    : "opacity-30"
                }`}
              >
                🧊
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats Summary with animation */}
        <motion.div 
          className="space-y-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={animationPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          {/* Score - show at least the required score since level was completed */}
          <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
            <span className="text-slate-300">Score</span>
            <span className="text-green-400 font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} className="text-green-400" />
              {displayScore} / {levelConfig.pointsRequired}
            </span>
          </div>

          {/* Moves */}
          <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
            <span className="text-slate-300">Moves Used</span>
            <span className="text-white font-semibold">
              {levelMoves}{" "}
              <span className="text-slate-400">/ {levelConfig.maxMoves}</span>
            </span>
          </div>

          {/* Cube Thresholds */}
          <div className="bg-slate-800/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Cube Thresholds</div>
            <div className="flex justify-between text-sm">
              <span className={levelMoves <= levelConfig.cube3Threshold ? "text-yellow-400" : "text-slate-500"}>
                🧊🧊🧊
                ≥{levelConfig.maxMoves - levelConfig.cube3Threshold} left
              </span>
              <span className={levelMoves <= levelConfig.cube2Threshold && levelMoves > levelConfig.cube3Threshold ? "text-yellow-400" : "text-slate-500"}>
                🧊🧊
                ≥{levelConfig.maxMoves - levelConfig.cube2Threshold} left
              </span>
              <span className={levelMoves > levelConfig.cube2Threshold ? "text-yellow-400" : "text-slate-500"}>
                🧊
                level clear
              </span>
            </div>
          </div>

          {/* Constraint (if any) - with celebration animation */}
          {levelConfig.constraint.constraintType !== ConstraintType.None && (
            <motion.div 
              className="flex justify-between items-center bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-4 py-2 rounded-lg border border-green-500/30"
              initial={{ scale: 1 }}
              animate={animationPhase >= 2 ? { 
                scale: [1, 1.02, 1],
                boxShadow: ["0 0 0 rgba(34, 197, 94, 0)", "0 0 15px rgba(34, 197, 94, 0.3)", "0 0 0 rgba(34, 197, 94, 0)"]
              } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="text-slate-300 flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-green-400" />
                {levelConfig.constraint.getDescription()}
              </span>
              <motion.span
                className="flex items-center gap-1 text-green-400"
                initial={{ scale: 0 }}
                animate={animationPhase >= 2 ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
              >
                <FontAwesomeIcon icon={faCheck} />
                Complete
              </motion.span>
            </motion.div>
          )}
        </motion.div>

        {/* Bonuses Earned with animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={animationPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4 }}
        >
          {bonusesEarned.total > 0 ? (
            <div className="mb-6">
              <motion.div 
                className="flex items-center gap-2 justify-center mb-3"
                initial={{ y: -10 }}
                animate={animationPhase >= 3 ? { y: 0 } : { y: -10 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <motion.div
                  animate={animationPhase >= 3 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <FontAwesomeIcon icon={faGift} className="text-purple-400 text-xl" />
                </motion.div>
                <span className="text-lg font-semibold text-purple-400">
                  {bonusesEarned.total} Bonus{bonusesEarned.total > 1 ? "es" : ""} Earned!
                </span>
              </motion.div>
              <div className="flex justify-center gap-4">
                {/* Show specific bonus types if we can observe them */}
                {bonusesEarned.hammer > 0 && (
                  <motion.div 
                    className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/50"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={animationPhase >= 3 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  >
                    <img src={imgAssets.hammer} alt="Hammer" className="w-8 h-8" />
                    <span className="text-white font-bold text-lg">
                      +{bonusesEarned.hammer}
                    </span>
                  </motion.div>
                )}
                {bonusesEarned.wave > 0 && (
                  <motion.div 
                    className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/50"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={animationPhase >= 3 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <img src={imgAssets.wave} alt="Wave" className="w-8 h-8" />
                    <span className="text-white font-bold text-lg">
                      +{bonusesEarned.wave}
                    </span>
                  </motion.div>
                )}
                {bonusesEarned.totem > 0 && (
                  <motion.div 
                    className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/50"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={animationPhase >= 3 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  >
                    <img src={imgAssets.tiki} alt="Totem" className="w-8 h-8" />
                    <span className="text-white font-bold text-lg">
                      +{bonusesEarned.totem}
                    </span>
                  </motion.div>
                )}
                {/* Show generic bonus display if earned same type as used */}
                {bonusesEarned.showGeneric && (
                  <motion.div 
                    className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/50"
                    initial={{ scale: 0 }}
                    animate={animationPhase >= 3 ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  >
                    <span className="text-purple-300 font-bold text-lg">
                      +{expectedBonusCount} Random
                    </span>
                  </motion.div>
                )}
              </div>
              <div className="text-center text-xs text-slate-400 mt-2">
                {cubesEarned === 3
                  ? "3 Cubes = 2 Bonuses"
                  : cubesEarned === 2
                  ? "2 Cubes = 1 Bonus"
                  : "1 Cube = No Bonus"}
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center">
              <span className="text-slate-400 text-sm">
                Complete with 2+ cubes to earn bonuses!
              </span>
            </div>
          )}
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={animationPhase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            onClick={onClose}
            className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          >
            Continue to Level {level + 1}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteDialog;
