import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faFire, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import { generateLevelConfig } from "@/dojo/game/types/level";
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

      {/* Row 2: Progress bar with score */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${scoreProgress}%` }}
              />
            </div>
          </div>
          <div className={`${isMdOrLarger ? "text-sm" : "text-xs"} text-slate-300 whitespace-nowrap min-w-[70px] text-right`}>
            <span className="font-semibold text-white">{displayScore}</span>
            <span className="text-slate-400"> / {levelConfig.pointsRequired}</span>
          </div>
        </div>
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

      {/* Row 4: Constraint (if any) */}
      {levelConfig.constraint.getLabel() && (
        <div className="mt-2 flex justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            {levelConfig.constraint.getLabel()}
          </span>
        </div>
      )}
    </div>
  );
};

export default LevelHeader;
