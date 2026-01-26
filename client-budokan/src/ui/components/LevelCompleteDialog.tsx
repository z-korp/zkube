import React, { useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheck,
  faTimes,
  faGift,
  faHammer,
} from "@fortawesome/free-solid-svg-icons";
import { faWaveSquare } from "@fortawesome/free-solid-svg-icons";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
import { Button } from "../elements/button";

// Totem icon component (reusing existing pattern)
const TotemIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    width="1em"
    height="1em"
  >
    <path d="M12 2L8 6v4l-4 4v6h4v-4h8v4h4v-6l-4-4V6l-4-4zm0 2.83L14 7v3h2l2 2v4h-2v-2H8v2H6v-4l2-2h2V7l2-2.17z" />
  </svg>
);

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
  constraintProgress,
  bonusUsedThisLevel,
  prevHammer,
  prevWave,
  prevTotem,
  hammer,
  wave,
  totem,
}) => {
  // Generate level config to get objectives
  const levelConfig = useMemo(() => {
    return generateLevelConfig(seed, level);
  }, [seed, level]);

  // Calculate stars earned
  const starsEarned = levelConfig.calculateStars(levelMoves);

  // Calculate bonuses earned
  const bonusesEarned = useMemo(() => {
    const hammerGained = hammer - prevHammer;
    const waveGained = wave - prevWave;
    const totemGained = totem - prevTotem;
    return {
      hammer: hammerGained,
      wave: waveGained,
      totem: totemGained,
      total: hammerGained + waveGained + totemGained,
    };
  }, [hammer, wave, totem, prevHammer, prevWave, prevTotem]);

  // Check if constraint was satisfied
  const constraintSatisfied = levelConfig.constraint.isSatisfied(
    constraintProgress,
    bonusUsedThisLevel
  );

  // Play sound effect on open
  useEffect(() => {
    if (isOpen) {
      // Could add a celebration sound here
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[400px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <DialogTitle className="text-3xl text-center mb-4 text-green-400">
          Level {level} Complete!
        </DialogTitle>

        {/* Stars Display */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((star) => (
            <FontAwesomeIcon
              key={star}
              icon={faStar}
              className={`text-4xl transition-all duration-300 ${
                star <= starsEarned
                  ? "text-yellow-400 scale-110"
                  : "text-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Stats Summary */}
        <div className="space-y-3 mb-6">
          {/* Score */}
          <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
            <span className="text-slate-300">Score</span>
            <span className="text-white font-semibold">
              {levelScore}{" "}
              <span className="text-slate-400">/ {levelConfig.pointsRequired}</span>
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

          {/* Star Thresholds */}
          <div className="bg-slate-800/30 px-4 py-2 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Star Thresholds</div>
            <div className="flex justify-between text-sm">
              <span className={levelMoves <= levelConfig.star3Threshold ? "text-yellow-400" : "text-slate-500"}>
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                ≤{levelConfig.star3Threshold}
              </span>
              <span className={levelMoves <= levelConfig.star2Threshold && levelMoves > levelConfig.star3Threshold ? "text-yellow-400" : "text-slate-500"}>
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                ≤{levelConfig.star2Threshold}
              </span>
              <span className={levelMoves > levelConfig.star2Threshold ? "text-yellow-400" : "text-slate-500"}>
                <FontAwesomeIcon icon={faStar} className="mr-1" />
                any
              </span>
            </div>
          </div>

          {/* Constraint (if any) */}
          {levelConfig.constraint.constraintType !== ConstraintType.None && (
            <div className="flex justify-between items-center bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-slate-300">
                {levelConfig.constraint.getDescription()}
              </span>
              <span
                className={`flex items-center gap-1 ${
                  constraintSatisfied ? "text-green-400" : "text-red-400"
                }`}
              >
                <FontAwesomeIcon icon={constraintSatisfied ? faCheck : faTimes} />
                {constraintSatisfied ? "Complete" : "Failed"}
              </span>
            </div>
          )}
        </div>

        {/* Bonuses Earned */}
        {bonusesEarned.total > 0 ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 justify-center mb-3">
              <FontAwesomeIcon icon={faGift} className="text-purple-400" />
              <span className="text-lg font-semibold text-purple-400">
                Bonuses Earned!
              </span>
            </div>
            <div className="flex justify-center gap-4">
              {bonusesEarned.hammer > 0 && (
                <div className="flex items-center gap-1 bg-red-500/20 px-3 py-2 rounded-lg">
                  <FontAwesomeIcon icon={faHammer} className="text-red-400" />
                  <span className="text-white font-semibold">
                    +{bonusesEarned.hammer}
                  </span>
                </div>
              )}
              {bonusesEarned.wave > 0 && (
                <div className="flex items-center gap-1 bg-blue-500/20 px-3 py-2 rounded-lg">
                  <FontAwesomeIcon icon={faWaveSquare} className="text-blue-400" />
                  <span className="text-white font-semibold">
                    +{bonusesEarned.wave}
                  </span>
                </div>
              )}
              {bonusesEarned.totem > 0 && (
                <div className="flex items-center gap-1 bg-green-500/20 px-3 py-2 rounded-lg">
                  <TotemIcon className="text-green-400" />
                  <span className="text-white font-semibold">
                    +{bonusesEarned.totem}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center text-xs text-slate-400 mt-2">
              {starsEarned === 3
                ? "3 Stars = 2 Bonuses"
                : starsEarned === 2
                ? "2 Stars = 1 Bonus"
                : "1 Star = No Bonus"}
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <span className="text-slate-400 text-sm">
              Complete with 2+ stars to earn bonuses!
            </span>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={onClose}
          className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
        >
          Continue to Level {level + 1}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default LevelCompleteDialog;
