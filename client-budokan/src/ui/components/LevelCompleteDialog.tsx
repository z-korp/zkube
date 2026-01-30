import React, { useMemo, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { isInGameShopAvailable } from "@/dojo/game/helpers/runDataPacking";
import { Button } from "../elements/button";

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
  /** Total cubes before level completion */
  prevTotalCubes: number;
  /** Total cubes after level completion */
  totalCubes: number;
  /** Total score before level completion (cumulative from previous levels) */
  prevTotalScore: number;
  /** Total score after level completion (includes this level's score) */
  totalScore: number;
}

const LevelCompleteDialog: React.FC<LevelCompleteDialogProps> = ({
  isOpen,
  onClose,
  level,
  levelScore: _levelScore, // Unused - we calculate from totalScore instead
  levelMoves,
  seed,
  constraintProgress: _constraintProgress, // Unused - constraint is always satisfied when level completes
  bonusUsedThisLevel: _bonusUsedThisLevel, // Unused - constraint is always satisfied when level completes
  prevHammer: _prevHammer,
  prevWave: _prevWave,
  prevTotem: _prevTotem,
  hammer: _hammer,
  wave: _wave,
  totem: _totem,
  prevTotalCubes,
  totalCubes,
  prevTotalScore,
  totalScore,
}) => {
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

  // Calculate the actual score achieved on this level
  // For level 1, totalScore IS the level score
  // For level 2+, it's the difference from the previous total
  const levelFinalScore = level === 1 
    ? totalScore 
    : totalScore - prevTotalScore;

  // Calculate cubes earned from move efficiency (1-3)
  const baseCubesEarned = levelConfig.calculateCubes(levelMoves);
  
  // Total cubes earned this level (includes combo bonuses, boss bonuses from contract)
  const totalLevelCubes = totalCubes - prevTotalCubes;
  
  // Boss level bonus (levels 10, 20, 30, 40, 50)
  const isBossLevel = [10, 20, 30, 40, 50].includes(level);
  const bossBonus = isBossLevel ? level : 0; // Boss bonus = level number (10, 20, 30, 40, 50)
  
  // Extra cubes from combos (total minus base minus boss bonus)
  const comboCubes = Math.max(0, totalLevelCubes - baseCubesEarned - bossBonus);
  
  // Check if shop opens after this level
  const isShopLevel = isInGameShopAvailable(level);

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
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((cube, index) => (
            <motion.div
              key={cube}
              initial={{ scale: 0, rotate: -180 }}
              animate={animationPhase >= 1 ? { 
                scale: cube <= baseCubesEarned ? 1.1 : 1, 
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
                  cube <= baseCubesEarned
                    ? "opacity-100"
                    : "opacity-30"
                }`}
              >
                🧊
              </span>
            </motion.div>
          ))}
        </div>

        {/* Cubes Earned Breakdown */}
        <motion.div
          className="mb-5 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg p-3 border border-yellow-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="text-xs text-yellow-400/80 mb-2 font-medium">Cubes Earned</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-300">Level clear</span>
              <span className="text-yellow-400 font-semibold">+{baseCubesEarned}</span>
            </div>
            {comboCubes > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Combo bonus</span>
                <span className="text-yellow-400 font-semibold">+{comboCubes}</span>
              </div>
            )}
            {isBossLevel && bossBonus > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-300">Boss Level {level} bonus</span>
                <span className="text-yellow-400 font-semibold">+{bossBonus}</span>
              </div>
            )}
            {totalLevelCubes > baseCubesEarned && (
              <div className="flex justify-between pt-1 border-t border-yellow-500/20">
                <span className="text-slate-200 font-medium">Total</span>
                <span className="text-yellow-400 font-bold">+{totalLevelCubes} 🧊</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Summary with animation */}
        <motion.div 
          className="space-y-2 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={animationPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          {/* Score */}
          <div className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg">
            <span className="text-slate-300 text-sm">Score</span>
            <span className="text-green-400 font-semibold text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faCheck} className="text-green-400" />
              {levelFinalScore} / {levelConfig.pointsRequired}
            </span>
          </div>

          {/* Moves */}
          <div className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg">
            <span className="text-slate-300 text-sm">Moves</span>
            <span className="text-white font-semibold text-sm">
              {levelMoves}
              <span className="text-slate-400"> / {levelConfig.maxMoves}</span>
            </span>
          </div>

          {/* Constraint (if any) */}
          {levelConfig.constraint.constraintType !== ConstraintType.None && (
            <motion.div 
              className="flex justify-between items-center bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-3 py-2 rounded-lg border border-green-500/30"
              initial={{ scale: 1 }}
              animate={animationPhase >= 2 ? { 
                scale: [1, 1.02, 1],
                boxShadow: ["0 0 0 rgba(34, 197, 94, 0)", "0 0 15px rgba(34, 197, 94, 0.3)", "0 0 0 rgba(34, 197, 94, 0)"]
              } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="text-slate-300 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faTrophy} className="text-green-400" />
                {levelConfig.constraint.getDescription()}
              </span>
              <motion.span
                className="flex items-center gap-1 text-green-400 text-sm"
                initial={{ scale: 0 }}
                animate={animationPhase >= 2 ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
              >
                <FontAwesomeIcon icon={faCheck} />
              </motion.span>
            </motion.div>
          )}
        </motion.div>

        {/* Shop info - only show when shop opens after this level */}
        {isShopLevel && (
          <motion.div
            className="mb-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={animationPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-purple-400 text-sm font-medium">
              🛒 Shop opens next — spend your cubes!
            </span>
          </motion.div>
        )}

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
            {isShopLevel ? "Continue to Shop" : `Continue to Level ${level + 1}`}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteDialog;
