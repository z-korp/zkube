import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { motion } from "motion/react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Button } from "../elements/button";
import { Check, Star, Trophy } from "lucide-react";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { useMusicPlayer } from "@/contexts/hooks";
import ConfettiExplosion from "@/ui/components/ConfettiExplosion";
import type { ConfettiExplosionRef } from "@/ui/components/ConfettiExplosion";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";

interface LevelCompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  levelMoves: number;
  prevTotalScore: number;
  totalScore: number;
  gameLevel: GameLevelData | null;
  zoneId?: number;
  draftWillOpen?: boolean;
}

const LevelCompleteDialog: React.FC<LevelCompleteDialogProps> = ({
  isOpen,
  onClose,
  level,
  levelMoves,
  prevTotalScore,
  totalScore,
  gameLevel,
  zoneId = 1,
  draftWillOpen = false,
}) => {
  const guardian = getZoneGuardian(zoneId);
  const isBossLevel = level === 10;
  const [animationPhase, setAnimationPhase] = useState(0);
  const { playSfx } = useMusicPlayer();
  const confettiRef = useRef<ConfettiExplosionRef>(null);

  useEffect(() => {
    if (!isOpen) return;

    setAnimationPhase(0);
    const timer1 = setTimeout(() => {
      setAnimationPhase(1);
      playSfx("star");
    }, 180);
    const timer2 = setTimeout(() => {
      setAnimationPhase(2);
      playSfx("coin");
    }, 700);
    const timer3 = setTimeout(() => {
      setAnimationPhase(3);
      confettiRef.current?.triggerLineExplosion({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        range: 400,
      });
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, playSfx]);

  const pointsRequired = gameLevel?.pointsRequired ?? 0;
  const maxMoves = gameLevel?.maxMoves ?? 0;
  const threeStarThreshold = gameLevel?.cube3Threshold ?? 0;
  const twoStarThreshold = gameLevel?.cube2Threshold ?? 0;

  const constraints = useMemo<
    Array<{ type: ConstraintType; value: number; count: number }>
  >(() => {
    const result: Array<{ type: ConstraintType; value: number; count: number }> = [];

    if (!gameLevel) return result;

    if (gameLevel.constraintType !== ConstraintType.None) {
      result.push({
        type: gameLevel.constraintType,
        value: gameLevel.constraintValue,
        count: gameLevel.constraintCount,
      });
    }
    if (gameLevel.constraint2Type !== ConstraintType.None) {
      result.push({
        type: gameLevel.constraint2Type,
        value: gameLevel.constraint2Value,
        count: gameLevel.constraint2Count,
      });
    }
    if (gameLevel.constraint3Type !== ConstraintType.None) {
      result.push({
        type: gameLevel.constraint3Type,
        value: gameLevel.constraint3Value,
        count: gameLevel.constraint3Count,
      });
    }

    return result;
  }, [
    gameLevel?.constraintType,
    gameLevel?.constraintValue,
    gameLevel?.constraintCount,
    gameLevel?.constraint2Type,
    gameLevel?.constraint2Value,
    gameLevel?.constraint2Count,
    gameLevel?.constraint3Type,
    gameLevel?.constraint3Value,
    gameLevel?.constraint3Count,
  ]);

  const levelFinalScore = Math.max(0, totalScore - prevTotalScore);

  const movesRemaining = Math.max(maxMoves - levelMoves, 0);

  const starsEarned = useMemo(() => {
    if (movesRemaining >= threeStarThreshold) return 3;
    if (movesRemaining >= twoStarThreshold) return 2;
    return 1;
  }, [movesRemaining, threeStarThreshold, twoStarThreshold]);

  const isDraftLevel = draftWillOpen;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ConfettiExplosion
        ref={confettiRef}
        colorSet={["#4ade80", "#22c55e", "#facc15", "#38bdf8"]}
      />
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[420px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        {/* Guardian reaction */}
        <div className="mb-3 flex items-center gap-3">
          <img
            src={getGuardianPortrait(zoneId)}
            alt={guardian.name}
            className={`h-11 w-11 rounded-xl object-cover ${isBossLevel ? "ring-2 ring-yellow-500/50" : ""}`}
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <DialogTitle className={`text-left font-display text-2xl ${isBossLevel ? "text-yellow-300" : "text-green-400"}`}>
              {isBossLevel ? "Trial Passed!" : `Level ${level} Complete!`}
            </DialogTitle>
            <p className="font-sans text-[11px] italic text-white/50">
              "{isBossLevel ? guardian.respectLine : guardian.encouragement}"
            </p>
          </div>
        </div>

        <div className="mb-4 flex justify-center gap-3">
          {[1, 2, 3].map((star, index) => {
            const earned = star <= starsEarned;
            return (
              <motion.div
                key={star}
                initial={{ scale: 0, rotate: -120, opacity: 0 }}
                animate={
                  animationPhase >= 1
                    ? {
                        scale: earned ? 1.12 : 1,
                        rotate: 0,
                        opacity: earned ? 1 : 0.45,
                      }
                    : { scale: 0, rotate: -120, opacity: 0 }
                }
                transition={{
                  delay: index * 0.14,
                  type: "spring",
                  stiffness: 230,
                  damping: 16,
                }}
                className={earned ? "drop-shadow-[0_0_14px_rgba(250,204,21,0.35)]" : ""}
              >
                <Star
                  size={34}
                  className={earned ? "fill-yellow-300 text-yellow-300" : "fill-transparent text-slate-600"}
                />
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mb-5 rounded-lg border border-green-500/25 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300/80">
            Level Results
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Stars earned</span>
              <span className="font-semibold text-yellow-300">{starsEarned} / 3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Score earned</span>
              <span className="font-semibold text-emerald-300">+{levelFinalScore}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mb-5 space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={animationPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
            <span className="text-sm text-slate-300">Score</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-green-400">
              <Check size={16} className="text-green-400" />
              {levelFinalScore} / {pointsRequired}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
            <span className="text-sm text-slate-300">Moves</span>
            <span className="text-sm font-semibold text-white">
              {levelMoves}
              <span className="text-slate-400"> / {maxMoves}</span>
            </span>
          </div>

          {constraints.map((c, i) => (
            <motion.div
              key={`constraint-${i}`}
              className="flex items-center justify-between rounded-lg border border-green-500/30 bg-gradient-to-r from-green-900/30 to-emerald-900/30 px-3 py-2"
              initial={{ scale: 1 }}
              animate={
                animationPhase >= 2
                  ? {
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        "0 0 0 rgba(34, 197, 94, 0)",
                        "0 0 15px rgba(34, 197, 94, 0.3)",
                        "0 0 0 rgba(34, 197, 94, 0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
            >
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Trophy size={16} className="text-green-400" />
                {Constraint.fromContractValues(c.type, c.value, c.count).getDescription()}
              </span>
              <motion.span
                className="flex items-center gap-1 text-sm text-green-400"
                initial={{ scale: 0 }}
                animate={animationPhase >= 2 ? { scale: 1 } : { scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                  delay: 0.5 + i * 0.15,
                }}
              >
                <Check size={16} />
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {isDraftLevel && (
          <motion.div
            className="mb-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={animationPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
          >
            <span className="text-sm font-medium text-purple-400">
              Draft opens next - choose your run direction!
            </span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={animationPhase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-lg font-semibold hover:from-green-600 hover:to-emerald-700"
          >
            {isDraftLevel ? "Continue to Draft" : "Continue"}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteDialog;
