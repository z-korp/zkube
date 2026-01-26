import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCheck,
  faTimes,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
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

  // Generate level config to get objectives
  const levelConfig = useMemo(() => {
    return generateLevelConfig(seed, level);
  }, [seed, level]);

  // Calculate stars earned
  const starsEarned = levelConfig.calculateStars(levelMoves);

  // Calculate expected bonuses from stars (matches contract logic)
  // 3 stars = 2 bonuses, 2 stars = 1 bonus, 1 star = 0 bonuses
  const expectedBonusCount = useMemo(() => {
    if (starsEarned >= 3) return 2;
    if (starsEarned >= 2) return 1;
    return 0;
  }, [starsEarned]);

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
  const constraintSatisfied = true;

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
                {bonusesEarned.total} Bonus{bonusesEarned.total > 1 ? "es" : ""} Earned!
              </span>
            </div>
            <div className="flex justify-center gap-4">
              {/* Show specific bonus types if we can observe them */}
              {bonusesEarned.hammer > 0 && (
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-600">
                  <img src={imgAssets.hammer} alt="Hammer" className="w-8 h-8" />
                  <span className="text-white font-bold text-lg">
                    +{bonusesEarned.hammer}
                  </span>
                </div>
              )}
              {bonusesEarned.wave > 0 && (
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-600">
                  <img src={imgAssets.wave} alt="Wave" className="w-8 h-8" />
                  <span className="text-white font-bold text-lg">
                    +{bonusesEarned.wave}
                  </span>
                </div>
              )}
              {bonusesEarned.totem > 0 && (
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-600">
                  <img src={imgAssets.tiki} alt="Totem" className="w-8 h-8" />
                  <span className="text-white font-bold text-lg">
                    +{bonusesEarned.totem}
                  </span>
                </div>
              )}
              {/* Show generic bonus display if earned same type as used */}
              {bonusesEarned.showGeneric && (
                <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-3 rounded-lg border border-purple-500/50">
                  <span className="text-purple-300 font-bold text-lg">
                    +{expectedBonusCount} Random
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
