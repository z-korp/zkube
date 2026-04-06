import { useState, useRef, useEffect, useCallback, useMemo, useSyncExternalStore } from "react";
import { Info } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getCommonAssetPath } from "@/config/themes";
import { getMutatorDef } from "@/config/mutatorConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/elements/tooltip";

interface GameHudProps {
  level: number;
  levelScore: number;
  targetScore: number;
  movesRemaining: number;
  totalCubes: number;
  combo: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
  maxMoves: number;
  activeMutatorId?: number;
  mode?: number;
  totalScore?: number;
  currentDifficulty?: number;
}

const RING_SIZE_MOBILE = 44;
const RING_SIZE_DESKTOP = 56;
const DESKTOP_BREAKPOINT = 640;

const ENDLESS_TIERS = [
  { name: "Very Easy", color: "#22c55e", emoji: "🟢", threshold: 0, multiplier: "×1.0" },
  { name: "Easy", color: "#84cc16", emoji: "🟡", threshold: 15, multiplier: "×1.2" },
  { name: "Medium", color: "#eab308", emoji: "🟠", threshold: 40, multiplier: "×1.4" },
  { name: "Medium Hard", color: "#f97316", emoji: "🔶", threshold: 80, multiplier: "×1.7" },
  { name: "Hard", color: "#ef4444", emoji: "🔴", threshold: 150, multiplier: "×2.0" },
  { name: "Very Hard", color: "#dc2626", emoji: "💀", threshold: 280, multiplier: "×2.5" },
  { name: "Expert", color: "#9333ea", emoji: "⚡", threshold: 500, multiplier: "×3.3" },
  { name: "Master", color: "#f59e0b", emoji: "👑", threshold: 900, multiplier: "×4.0" },
] as const;

const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const getIsDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

const CONSTRAINT_ICON_MAP: Record<ConstraintType, string | null> = {
  [ConstraintType.ComboLines]: getCommonAssetPath("constraints/constraint-clear-lines.png"),
  [ConstraintType.BreakBlocks]: getCommonAssetPath("constraints/constraint-break-blocks.png"),
  [ConstraintType.ComboStreak]: getCommonAssetPath("constraints/constraint-combo.png"),
  [ConstraintType.FillAndClear]: getCommonAssetPath("constraints/constraint-fill.png"),
  [ConstraintType.NoBonusUsed]: getCommonAssetPath("constraints/constraint-no-bonus.png"),
  [ConstraintType.KeepGridBelow]: getCommonAssetPath("constraints/constraint-keep-grid-below.png"),
  [ConstraintType.None]: null,
};

const getConstraintIcon = (type: ConstraintType) => {
  const src = CONSTRAINT_ICON_MAP[type];
  if (!src) return null;
  return <img src={src} alt="" className="w-full h-full rounded-full object-cover" />;
};

const getConstraintColor = (
  type: ConstraintType,
  progress: number,
  count: number,
  bonusUsed: boolean,
): "green" | "orange" | "red" | "blue" => {
  if (type === ConstraintType.NoBonusUsed) {
    return bonusUsed ? "red" : "green";
  }
  if (type === ConstraintType.KeepGridBelow) {
    return progress >= 1 ? "red" : "green";
  }
  if (progress >= count) return "green";
  if (progress > 0) return "orange";
  return "blue";
};

const getConstraintProgress = (
  type: ConstraintType,
  progress: number,
  count: number,
  bonusUsed: boolean,
): number => {
  if (type === ConstraintType.NoBonusUsed) {
    return bonusUsed ? 0 : 1;
  }
  if (type === ConstraintType.KeepGridBelow) {
    return progress >= 1 ? 0 : 1;
  }
  return count > 0 ? progress / count : 0;
};

/** Top-left badge: the constraint's "what" — value threshold or block size */
const getValueBadge = (
  type: ConstraintType,
  value: number,
): string | undefined => {
  switch (type) {
    case ConstraintType.ComboLines:
      return `${value}+`;
    case ConstraintType.BreakBlocks:
      return `${value}`;
    case ConstraintType.ComboStreak:
      return `${value}x`;
    case ConstraintType.FillAndClear:
      return `R${value}`;
    case ConstraintType.KeepGridBelow:
      return `<${value}`;
    default:
      return undefined;
  }
};

/** Bottom-right badge: progress toward completion */
const getProgressBadge = (
  type: ConstraintType,
  progress: number,
  count: number,
): string | undefined => {
  if (type === ConstraintType.NoBonusUsed || type === ConstraintType.KeepGridBelow) {
    return undefined;
  }
  return `${progress}/${count}`;
};

interface ConstraintData {
  type: ConstraintType;
  value: number;
  count: number;
  progress: number;
}

const GameHud: React.FC<GameHudProps> = ({
  level,
  levelScore,
  targetScore,
  movesRemaining,
  totalCubes,
  combo,
  constraintProgress,
  constraint2Progress,
  constraint3Progress,
  bonusUsedThisLevel,
  gameLevel,
  maxMoves,
  activeMutatorId = 0,
  mode = 0,
  totalScore = 0,
  currentDifficulty = 0,
}) => {
  const isDesktop = useSyncExternalStore(subscribeResize, getIsDesktop, () => false);
  const ringSize = isDesktop ? RING_SIZE_DESKTOP : RING_SIZE_MOBILE;
  const isEndless = mode === 1;

  const mutator = getMutatorDef(activeMutatorId);

  const [movesInfoOpen, setMovesInfoOpen] = useState(false);
  const movesInfoRef = useRef<HTMLDivElement>(null);
  const [prevDifficulty, setPrevDifficulty] = useState<number | undefined>(currentDifficulty);
  const [showDifficultyUp, setShowDifficultyUp] = useState(false);

  const closeMovesInfo = useCallback(() => setMovesInfoOpen(false), []);

  useEffect(() => {
    if (!movesInfoOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (movesInfoRef.current && !movesInfoRef.current.contains(e.target as Node)) {
        closeMovesInfo();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [movesInfoOpen, closeMovesInfo]);

  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;
  const animatedTotalScore = useLerpNumber(totalScore, { duration: 300, integer: true }) ?? 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;

  const scoreProgress = targetScore > 0 ? Math.min(1, animatedScore / targetScore) : 0;
  const movesProgress = maxMoves > 0 ? movesRemaining / maxMoves : 0;

  const movesBarColor = movesRemaining >= cube3Threshold
    ? "bg-green-500"
    : movesRemaining >= cube2Threshold
      ? "bg-yellow-500"
      : "bg-red-500";

  const movesTextColor = movesRemaining >= cube3Threshold
    ? "text-green-400"
    : movesRemaining >= cube2Threshold
      ? "text-yellow-400"
      : "text-red-400";

  const cube3MarkerPos = maxMoves > 0 ? (cube3Threshold / maxMoves) * 100 : 0;
  const cube2MarkerPos = maxMoves > 0 ? (cube2Threshold / maxMoves) * 100 : 0;

  // Contract Difficulty enum: None=0, Increasing=1, VeryEasy=2..Master=9
  // ENDLESS_TIERS indices:   VeryEasy=0..Master=7
  // Offset = 2
  const tierIndex = Math.max(0, Math.min(currentDifficulty - 2, ENDLESS_TIERS.length - 1));

  // Derive tier from totalScore directly for progress bar consistency
  // (contract uses ramped score for difficulty, which can differ from stored totalScore)
  let scoreTierIndex = 0;
  for (let i = ENDLESS_TIERS.length - 1; i >= 0; i--) {
    if (animatedTotalScore >= ENDLESS_TIERS[i].threshold) {
      scoreTierIndex = i;
      break;
    }
  }

  // Use whichever is higher (contract may be ahead due to ramp multiplier)
  const effectiveTierIndex = Math.max(tierIndex, scoreTierIndex);
  const currentTier = ENDLESS_TIERS[effectiveTierIndex] ?? ENDLESS_TIERS[0];
  const nextTier = ENDLESS_TIERS[effectiveTierIndex + 1] ?? null;
  const endlessTierProgress = nextTier
    ? Math.max(
      0,
      Math.min(
        1,
        (animatedTotalScore - currentTier.threshold) / (nextTier.threshold - currentTier.threshold),
      ),
    )
    : 1;

  useEffect(() => {
    if (currentDifficulty !== undefined && prevDifficulty !== undefined && currentDifficulty > prevDifficulty) {
      setShowDifficultyUp(true);
      const timer = setTimeout(() => setShowDifficultyUp(false), 2000);
      setPrevDifficulty(currentDifficulty);
      return () => clearTimeout(timer);
    }
    setPrevDifficulty(currentDifficulty);
  }, [currentDifficulty, prevDifficulty]);

  const constraints = useMemo<ConstraintData[]>(() => {
    const result: ConstraintData[] = [];
    if (gameLevel) {
      if (gameLevel.constraintType !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraintType,
          value: gameLevel.constraintValue,
          count: gameLevel.constraintCount,
          progress: constraintProgress,
        });
      }
      if (gameLevel.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint2Type,
          value: gameLevel.constraint2Value,
          count: gameLevel.constraint2Count,
          progress: constraint2Progress,
        });
      }
      if (gameLevel.constraint3Type !== undefined && gameLevel.constraint3Type !== ConstraintType.None) {
        result.push({
          type: gameLevel.constraint3Type,
          value: gameLevel.constraint3Value,
          count: gameLevel.constraint3Count,
          progress: constraint3Progress,
        });
      }
    }
    return result;
  }, [
    gameLevel?.constraintType, gameLevel?.constraintValue, gameLevel?.constraintCount, constraintProgress,
    gameLevel?.constraint2Type, gameLevel?.constraint2Value, gameLevel?.constraint2Count, constraint2Progress,
    gameLevel?.constraint3Type, gameLevel?.constraint3Value, gameLevel?.constraint3Count, constraint3Progress,
  ]);

  const potentialCubes = movesRemaining >= cube3Threshold ? 3
    : movesRemaining >= cube2Threshold ? 2 : 1;
  const hasConstraints = constraints.length > 0;
  const comboTextColor = combo > 0 ? "text-white" : "text-slate-500";

  return (
    <div className="w-full shrink-0 px-2 pt-2">
      <div className="relative mx-auto w-full max-w-[500px] rounded-xl border border-slate-500/50 bg-slate-900/90 px-3 py-2.5 backdrop-blur-sm">
        <AnimatePresence>
          {isEndless && showDifficultyUp && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-x-0 -top-10 z-50 flex justify-center"
            >
              <div
                className="rounded-full px-4 py-1.5 font-display text-sm font-bold text-white shadow-lg"
                style={{ background: currentTier.color, boxShadow: `0 0 20px ${currentTier.color}80` }}
              >
                DIFFICULTY UP! → {currentTier.name}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isEndless ? (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1.5">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
                  style={{ borderColor: `${currentTier.color}80`, backgroundColor: `${currentTier.color}22` }}
                >
                  <span className="text-sm leading-none">{currentTier.emoji}</span>
                  <span className="font-display text-xs text-white">{currentTier.name}</span>
                  <span className="font-display text-xs" style={{ color: currentTier.color }}>{currentTier.multiplier}</span>
                </div>

                {activeMutatorId > 0 && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                    <span className="text-xs">{mutator.icon}</span>
                    <span className="font-sans text-[10px] font-medium text-white/80">{mutator.name}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-right">
                <div className="font-display text-[10px] uppercase tracking-wide text-slate-200">Moves</div>
                <div className="font-sans text-2xl font-bold leading-none tabular-nums text-emerald-300">
                  {movesRemaining}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-[10px] uppercase tracking-wide text-slate-300">Score</div>
                <div className="font-sans text-xl font-semibold tabular-nums text-cyan-300">{animatedTotalScore}</div>
              </div>

              <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1">
                <span className="text-xs">🔥</span>
                <span className={`font-sans text-sm font-semibold tabular-nums ${comboTextColor}`}>{combo}x</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${endlessTierProgress * 100}%`, backgroundColor: currentTier.color }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-sans tabular-nums">
                  {nextTier
                    ? `${Math.min(animatedTotalScore, nextTier.threshold)}/${nextTier.threshold} → ${nextTier.name}`
                    : `${animatedTotalScore} • MAX TIER`}
                </span>
                <span className="font-sans text-slate-400">Multiplier {currentTier.multiplier}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/60 bg-yellow-500/10 px-2 py-1">
                  <span className="font-display text-sm tracking-wide text-yellow-300">Level</span>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-yellow-500 bg-slate-900 px-1 font-sans text-sm font-bold leading-none text-yellow-300 tabular-nums">
                    {level}
                  </span>
                </div>

                {activeMutatorId > 0 && (
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                    <span className="text-xs">{mutator.icon}</span>
                    <span className="font-sans text-[10px] font-medium text-white/80">{mutator.name}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-right">
                <div className="font-display text-[10px] uppercase tracking-wide text-slate-200">Moves</div>
                <div className={`font-sans text-2xl font-bold leading-none tabular-nums ${movesTextColor}`}>
                  {movesRemaining}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-xs text-slate-300">Score</span>
                <span className="font-sans text-sm tabular-nums text-cyan-300">
                  {animatedScore}<span className="text-slate-400">/{targetScore}</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
                <div
                  className="h-full rounded-full bg-cyan-500 transition-all duration-300 ease-out"
                  style={{ width: `${scoreProgress * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <div className="relative inline-flex items-center gap-1" ref={movesInfoRef}>
                  <span className="font-display text-xs text-slate-300">Star Thresholds</span>
                  <button
                    type="button"
                    onClick={() => setMovesInfoOpen((v) => !v)}
                    onMouseEnter={() => setMovesInfoOpen(true)}
                    onMouseLeave={() => setMovesInfoOpen(false)}
                    className="inline-flex items-center justify-center text-slate-400 transition-colors hover:text-slate-200 active:text-white"
                    aria-label="Star reward thresholds"
                  >
                    <Info size={11} />
                  </button>
                  {movesInfoOpen && (
                    <div className="absolute left-0 top-full z-[200] mt-1.5 whitespace-nowrap rounded-md border border-slate-500 bg-slate-900 px-3 py-2 shadow-lg">
                      <div className="flex flex-col gap-1 font-sans text-xs text-white">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex gap-0.5"><span className="text-yellow-400">★</span><span className="text-yellow-400">★</span><span className="text-yellow-400">★</span></span>
                          <span>≥ {cube3Threshold} moves left</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex gap-0.5"><span className="text-yellow-400">★</span><span className="text-yellow-400">★</span></span>
                          <span>≥ {cube2Threshold} moves left</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">★</span>
                          <span>Complete level</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <span className={`font-sans text-sm tabular-nums ${movesTextColor}`}>
                  {movesRemaining}<span className="text-slate-400">/{maxMoves}</span>
                </span>
              </div>

              <div className="relative h-2 overflow-hidden rounded-full bg-slate-700/80">
                <div
                  className={`h-full rounded-full transition-all duration-300 ease-out ${movesBarColor}`}
                  style={{ width: `${movesProgress * 100}%` }}
                />
                {cube3Threshold > 0 && cube3Threshold < maxMoves && (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/40"
                    style={{ left: `${cube3MarkerPos}%` }}
                  />
                )}
                {cube2Threshold > 0 && cube2Threshold < maxMoves && (
                  <div
                    className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/25"
                    style={{ left: `${cube2MarkerPos}%` }}
                  />
                )}
              </div>
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-h-[44px] min-w-0 flex-1">
                {hasConstraints ? (
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {constraints.map((c, i) => {
                        const description = Constraint.fromContractValues(
                          c.type, c.value, c.count,
                        ).getDescription();
                        return (
                          <Tooltip key={`constraint-${i}`}>
                            <TooltipTrigger asChild>
                              <div>
                                <ProgressRing
                                  progress={getConstraintProgress(c.type, c.progress, c.count, bonusUsedThisLevel)}
                                  size={ringSize}
                                  color={getConstraintColor(c.type, c.progress, c.count, bonusUsedThisLevel)}
                                  icon={getConstraintIcon(c.type)}
                                  badgeTopLeft={getValueBadge(c.type, c.value)}
                                  badgeBottomRight={getProgressBadge(c.type, c.progress, c.count)}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="border border-slate-500 bg-slate-900 px-2 py-1 text-xs text-white"
                            >
                              {description}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                ) : (
                  <div className="flex h-full items-center font-display text-xs uppercase tracking-wide text-slate-500">
                    No constraints this level
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1">
                  <span className="text-xs">🔥</span>
                  <span className={`font-sans text-sm font-semibold tabular-nums ${comboTextColor}`}>{combo}x</span>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1">
                  <span className="text-xs text-yellow-400">★</span>
                  <span className={`font-sans text-sm font-semibold tabular-nums ${
                    potentialCubes >= 3 ? "text-green-400" : potentialCubes >= 2 ? "text-yellow-400" : "text-red-400"
                  }`}>+{potentialCubes}</span>
                  {totalCubes > 0 && (
                    <span className="font-sans text-[11px] text-blue-300 tabular-nums">• {totalCubes}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHud;
