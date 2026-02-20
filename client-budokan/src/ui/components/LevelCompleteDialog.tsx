import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { motion } from "motion/react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { isInGameShopAvailable } from "@/dojo/game/helpers/runDataPacking";
import { Button } from "../elements/button";
import { Check, Trophy } from "lucide-react";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { useMusicPlayer } from "@/contexts/hooks";

interface LevelCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  levelScore: number;
  levelMoves: number;
  seed: bigint;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  prevCombo: number;
  prevScore: number;
  prevHarvest: number;
  prevWave: number;
  prevSupply: number;
  comboBonus: number;
  scoreBonus: number;
  harvest: number;
  wave: number;
  supply: number;
  prevTotalCubes: number;
  totalCubes: number;
  prevTotalScore: number;
  totalScore: number;
  gameLevel: GameLevelData | null;
}

const LevelCompleteDialog: React.FC<LevelCompleteDialogProps> = ({
  isOpen,
  onClose,
  level,
  levelScore: _levelScore,
  levelMoves,
  seed: _seed,
  constraintProgress: _constraintProgress,
  bonusUsedThisLevel: _bonusUsedThisLevel,
  prevCombo,
  prevScore,
  prevHarvest,
  prevWave,
  prevSupply,
  comboBonus,
  scoreBonus,
  harvest,
  wave,
  supply,
  prevTotalCubes,
  totalCubes,
  prevTotalScore,
  totalScore,
  gameLevel,
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const { playSfx } = useMusicPlayer();

  useEffect(() => {
    if (isOpen) {
      setAnimationPhase(0);
      const timer1 = setTimeout(() => {
        setAnimationPhase(1);
        playSfx("coin");
      }, 200);
      const timer2 = setTimeout(() => {
        setAnimationPhase(2);
        playSfx("star");
      }, 800);
      const timer3 = setTimeout(() => setAnimationPhase(3), 1200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, playSfx]);

  const pointsRequired = gameLevel?.pointsRequired ?? 0;
  const maxMoves = gameLevel?.maxMoves ?? 0;
  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;

  const constraints: Array<{ type: ConstraintType; value: number; count: number }> = [];
  if (gameLevel) {
    if (gameLevel.constraintType !== ConstraintType.None) {
      constraints.push({ type: gameLevel.constraintType, value: gameLevel.constraintValue, count: gameLevel.constraintCount });
    }
    if (gameLevel.constraint2Type !== ConstraintType.None) {
      constraints.push({ type: gameLevel.constraint2Type, value: gameLevel.constraint2Value, count: gameLevel.constraint2Count });
    }
    if (gameLevel.constraint3Type !== ConstraintType.None) {
      constraints.push({ type: gameLevel.constraint3Type, value: gameLevel.constraint3Value, count: gameLevel.constraint3Count });
    }
  }

  const levelFinalScore = level === 1 
    ? totalScore 
    : totalScore - prevTotalScore;

  const getCubesFromMoves = (moves: number): number => {
    const remaining = maxMoves - moves;
    if (remaining >= cube3Threshold) return 3;
    if (remaining >= cube2Threshold) return 2;
    return 1;
  };
  const baseCubesEarned = getCubesFromMoves(levelMoves);
  
  // Total cubes earned this level (includes combo bonuses, boss bonuses from contract)
  const totalLevelCubes = totalCubes - prevTotalCubes;
  
  // Boss level bonus (levels 10, 20, 30, 40, 50)
  const isBossLevel = [10, 20, 30, 40, 50].includes(level);
  const bossBonus = isBossLevel ? level : 0; // Boss bonus = level number (10, 20, 30, 40, 50)
  
  // Extra cubes from combos (total minus base minus boss bonus)
  const comboCubes = Math.max(0, totalLevelCubes - baseCubesEarned - bossBonus);

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
                <Check size={16} className="text-green-400" />
                {levelFinalScore} / {pointsRequired}
              </span>
          </div>

          {/* Moves */}
          <div className="flex justify-between items-center bg-slate-800/50 px-3 py-2 rounded-lg">
            <span className="text-slate-300 text-sm">Moves</span>
            <span className="text-white font-semibold text-sm">
              {levelMoves}
              <span className="text-slate-400"> / {maxMoves}</span>
            </span>
          </div>

          {constraints.map((c, i) => (
            <motion.div 
              key={`constraint-${i}`}
              className="flex justify-between items-center bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-3 py-2 rounded-lg border border-green-500/30"
              initial={{ scale: 1 }}
              animate={animationPhase >= 2 ? { 
                scale: [1, 1.02, 1],
                boxShadow: ["0 0 0 rgba(34, 197, 94, 0)", "0 0 15px rgba(34, 197, 94, 0.3)", "0 0 0 rgba(34, 197, 94, 0)"]
              } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
            >
              <span className="text-slate-300 text-sm flex items-center gap-2">
                <Trophy size={16} className="text-green-400" />
                {Constraint.fromContractValues(c.type, c.value, c.count).getDescription()}
              </span>
              <motion.span
                className="flex items-center gap-1 text-green-400 text-sm"
                initial={{ scale: 0 }}
                animate={animationPhase >= 2 ? { scale: 1 } : { scale: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 + i * 0.15 }}
              >
                <Check size={16} />
              </motion.span>
            </motion.div>
          ))}
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
