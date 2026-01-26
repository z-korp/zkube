import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faFire, faCircleInfo, faCheck, faBan } from "@fortawesome/free-solid-svg-icons";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import { generateLevelConfig } from "@/dojo/game/types/level";
import { ConstraintType } from "@/dojo/game/types/constraint";
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
  totalStars: number;
  totalScore: number;
  combo: number;
  seed?: bigint;
  isMdOrLarger: boolean;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
}

const LevelHeader: React.FC<LevelHeaderProps> = ({
  level,
  levelScore,
  levelMoves,
  totalStars,
  totalScore,
  combo,
  seed = BigInt(0),
  isMdOrLarger,
  constraintProgress,
  bonusUsedThisLevel,
}) => {
  // Generate level config for display
  const levelConfig = React.useMemo(() => {
    const config = generateLevelConfig(seed, level);
    console.log("[LevelHeader] Generated config:", {
      seed: seed.toString(),
      level,
      pointsRequired: config.pointsRequired,
      maxMoves: config.maxMoves,
      star3Threshold: config.star3Threshold,
      star2Threshold: config.star2Threshold,
      constraint: config.constraint.getLabel(),
    });
    return config;
  }, [seed, level]);

  // Log current game state from contract
  React.useEffect(() => {
    console.log("[LevelHeader] Contract state:", {
      levelScore,
      levelMoves,
      totalStars,
      totalScore,
      combo,
      movesRemaining: levelConfig.maxMoves - levelMoves,
      scoreProgress: `${levelScore}/${levelConfig.pointsRequired}`,
      isComplete: levelScore >= levelConfig.pointsRequired,
    });
  }, [levelScore, levelMoves, totalStars, totalScore, combo, levelConfig]);

  const displayScore = useLerpNumber(levelScore, { integer: true });
  const displayTotalStars = useLerpNumber(totalStars, { integer: true });
  const displayTotalScore = useLerpNumber(totalScore, { integer: true });
  const displayCombo = useLerpNumber(combo, { integer: true });

  // Calculate progress
  const scoreProgress = Math.min(100, (levelScore / levelConfig.pointsRequired) * 100);
  const movesRemaining = Math.max(0, levelConfig.maxMoves - levelMoves);
  
  // Calculate potential stars based on current moves
  const potentialStars = levelConfig.potentialStars(levelMoves);

  // Get efficiency message
  const getEfficiencyMessage = () => {
    if (potentialStars === 3) return { text: "Perfect pace!", color: "text-green-400" };
    if (potentialStars === 2) return { text: "Good pace", color: "text-yellow-400" };
    return { text: "Finish strong!", color: "text-orange-400" };
  };
  const efficiency = getEfficiencyMessage();

  return (
    <div className="w-full mb-3">
      {/* Row 1: Level title + Total score + Total stars */}
      <div className="flex items-center justify-between mb-2">
        <div className={`font-bold ${isMdOrLarger ? "text-2xl" : "text-xl"} text-white`}>
          Level {level}
        </div>
        <div className="flex items-center gap-3">
          {/* Total Score */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
            <span className={`${isMdOrLarger ? "text-sm" : "text-xs"} text-slate-400`}>Score:</span>
            <span className={`${isMdOrLarger ? "text-lg" : "text-base"} font-semibold text-blue-400`}>
              {displayTotalScore}
            </span>
          </div>
          {/* Total Stars */}
          <div className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
            <span className={`${isMdOrLarger ? "text-lg" : "text-base"} font-semibold text-yellow-400`}>
              {displayTotalStars}
            </span>
            <FontAwesomeIcon
              icon={faStar}
              className="text-yellow-400"
              width={isMdOrLarger ? 16 : 14}
              height={isMdOrLarger ? 16 : 14}
            />
          </div>
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
                <div className="flex items-center gap-1.5 min-w-[120px] cursor-help">
                  <span className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} text-orange-400 whitespace-nowrap`}>
                    {levelConfig.constraint.value}+
                  </span>
                  <div className="flex-1 min-w-[40px]">
                    <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ease-out ${
                          constraintProgress >= levelConfig.constraint.requiredCount
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-orange-500 to-amber-500"
                        }`}
                        style={{ 
                          width: `${Math.min(100, (constraintProgress / levelConfig.constraint.requiredCount) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                  <div className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} whitespace-nowrap flex items-center gap-0.5`}>
                    <span className={`font-semibold ${constraintProgress >= levelConfig.constraint.requiredCount ? "text-green-400" : "text-orange-400"}`}>
                      {constraintProgress}/{levelConfig.constraint.requiredCount}
                    </span>
                    {constraintProgress >= levelConfig.constraint.requiredCount && (
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
                <div className={`${isMdOrLarger ? "text-[10px]" : "text-[9px]"} flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap cursor-help ${
                  bonusUsedThisLevel 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                    : "bg-green-500/20 text-green-400 border border-green-500/30"
                }`}>
                  {bonusUsedThisLevel ? (
                    <>
                      <FontAwesomeIcon icon={faBan} width={8} height={8} />
                      <span>Bonus used</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} width={8} height={8} />
                      <span>No Bonus</span>
                    </>
                  )}
                </div>
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
      </div>

      {/* Row 3: Stars + Moves + Combo */}
      <div className="flex items-center justify-between">
        {/* Star rating with info tooltip on the left */}
        <div className="flex items-center gap-1">
          {/* Info icon with tooltip - on the left of stars */}
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
                  <div className="text-xs font-semibold text-white mb-2">Star Thresholds</div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">
                      <FontAwesomeIcon icon={faStar} className="mr-0.5" />
                      <FontAwesomeIcon icon={faStar} className="mr-0.5" />
                      <FontAwesomeIcon icon={faStar} />
                    </span>
                    <span className="text-slate-300">≤ {levelConfig.star3Threshold} moves</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">
                      <FontAwesomeIcon icon={faStar} className="mr-0.5" />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} className="text-slate-600 ml-0.5" />
                    </span>
                    <span className="text-slate-300">≤ {levelConfig.star2Threshold} moves</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-4">
                    <span className="text-yellow-400">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} className="text-slate-600 ml-0.5" />
                      <FontAwesomeIcon icon={faStar} className="text-slate-600 ml-0.5" />
                    </span>
                    <span className="text-slate-300">any moves</span>
                  </div>
                  <div className="border-t border-slate-600 pt-1.5 mt-1.5">
                    <div className="text-xs text-slate-400">
                      <span className="text-yellow-400">3★</span> = 2 bonuses
                    </div>
                    <div className="text-xs text-slate-400">
                      <span className="text-yellow-400">2★</span> = 1 bonus
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Stars */}
          {[1, 2, 3].map((star) => (
            <FontAwesomeIcon
              key={star}
              icon={faStar}
              className={`transition-colors duration-200 ${
                star <= potentialStars ? "text-yellow-400" : "text-slate-600"
              }`}
              width={isMdOrLarger ? 18 : 16}
              height={isMdOrLarger ? 18 : 16}
            />
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
