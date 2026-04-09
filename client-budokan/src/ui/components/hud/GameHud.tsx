import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getCommonAssetPath } from "@/config/themes";
import { getMutatorDef } from "@/config/mutatorConfig";
import { useSettings } from "@/hooks/useSettings";
import { useMutatorDef } from "@/hooks/useMutatorDef";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";
import { isBossLevel } from "@/dojo/game/helpers/runDataPacking";
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
  combo: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
  activeMutatorId?: number;
  mode?: number;
  totalScore?: number;
  currentDifficulty?: number;
  zoneId?: number;
  onBack?: () => void;
}

const RING_SIZE_MOBILE = 44;
const RING_SIZE_DESKTOP = 56;
const DESKTOP_BREAKPOINT = 640;

const TIER_DISPLAY = [
  { name: "Very Easy", color: "#22c55e", emoji: "🟢" },
  { name: "Easy", color: "#84cc16", emoji: "🟡" },
  { name: "Medium", color: "#eab308", emoji: "🟠" },
  { name: "Medium Hard", color: "#f97316", emoji: "🔶" },
  { name: "Hard", color: "#ef4444", emoji: "🔴" },
  { name: "Very Hard", color: "#dc2626", emoji: "💀" },
  { name: "Expert", color: "#9333ea", emoji: "⚡" },
  { name: "Master", color: "#f59e0b", emoji: "👑" },
] as const;

function buildEndlessTiers(
  thresholds: number[],
  multipliers: number[],
) {
  return TIER_DISPLAY.map((display, i) => ({
    ...display,
    threshold: thresholds[i] ?? 0,
    multiplier: `×${(multipliers[i] ?? 10) / 10}`,
  }));
}

const subscribeResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const getIsDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

const CONSTRAINT_ICON_MAP: Record<ConstraintType, string | null> = {
  [ConstraintType.ComboLines]: getCommonAssetPath("constraints/constraint-clear-lines.png"),
  [ConstraintType.BreakBlocks]: getCommonAssetPath("constraints/constraint-break-blocks.png"),
  [ConstraintType.ComboStreak]: getCommonAssetPath("constraints/constraint-combo.png"),
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
  _bonusUsed: boolean,
): "green" | "orange" | "red" | "blue" => {
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
  _bonusUsed: boolean,
): number => {
  if (type === ConstraintType.KeepGridBelow) {
    return progress >= 1 ? 0 : 1;
  }
  return count > 0 ? progress / count : 0;
};

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
    case ConstraintType.KeepGridBelow:
      return `<${value}`;
    default:
      return undefined;
  }
};

const getProgressBadge = (
  type: ConstraintType,
  progress: number,
  count: number,
): string | undefined => {
  if (type === ConstraintType.KeepGridBelow) {
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
  combo,
  constraintProgress,
  constraint2Progress,
  constraint3Progress,
  bonusUsedThisLevel,
  gameLevel,
  activeMutatorId = 0,
  mode = 0,
  totalScore = 0,
  currentDifficulty = 0,
  zoneId = 1,
  onBack,
}) => {
  const isDesktop = useSyncExternalStore(subscribeResize, getIsDesktop, () => false);
  const ringSize = isDesktop ? RING_SIZE_DESKTOP : RING_SIZE_MOBILE;
  const isEndless = mode === 1;
  const isBoss = isBossLevel(level);

  const settingsId = Math.max(0, (zoneId - 1) * 2);
  const { settings } = useSettings(settingsId);
  const ENDLESS_TIERS = useMemo(
    () => buildEndlessTiers(settings.endlessDifficultyThresholds, settings.endlessScoreMultipliers),
    [settings.endlessDifficultyThresholds, settings.endlessScoreMultipliers],
  );

  const { data: onChainMutator } = useMutatorDef(activeMutatorId);
  const mutator = getMutatorDef(activeMutatorId, onChainMutator?.name);

  const guardian = useMemo(() => getZoneGuardian(zoneId), [zoneId]);
  const portraitSrc = useMemo(() => getGuardianPortrait(zoneId), [zoneId]);

  const [prevDifficulty, setPrevDifficulty] = useState<number | undefined>(currentDifficulty);
  const [showDifficultyUp, setShowDifficultyUp] = useState(false);

  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;
  const animatedTotalScore = useLerpNumber(totalScore, { duration: 300, integer: true }) ?? 0;

  const cube3Threshold = gameLevel?.cube3Threshold ?? 0;
  const cube2Threshold = gameLevel?.cube2Threshold ?? 0;
  const maxMoves = gameLevel?.maxMoves ?? 1;

  const scoreProgress = targetScore > 0 ? Math.min(1, animatedScore / targetScore) : 0;

  // Star thresholds as percentage of maxMoves bar
  const cube3Pct = maxMoves > 0 ? (cube3Threshold / maxMoves) * 100 : 0;
  const cube2Pct = maxMoves > 0 ? (cube2Threshold / maxMoves) * 100 : 0;
  const movesPct = maxMoves > 0 ? Math.min(1, movesRemaining / maxMoves) * 100 : 0;

  const starsEarned = movesRemaining >= cube3Threshold ? 3 : movesRemaining >= cube2Threshold ? 2 : 1;
  const movesBarColor = starsEarned === 3 ? "#22c55e" : starsEarned === 2 ? "#eab308" : "#ef4444";

  const tierIndex = Math.max(0, Math.min(currentDifficulty - 2, ENDLESS_TIERS.length - 1));
  let scoreTierIndex = 0;
  for (let i = ENDLESS_TIERS.length - 1; i >= 0; i--) {
    if (animatedTotalScore >= ENDLESS_TIERS[i].threshold) {
      scoreTierIndex = i;
      break;
    }
  }
  const effectiveTierIndex = Math.max(tierIndex, scoreTierIndex);
  const currentTier = ENDLESS_TIERS[effectiveTierIndex] ?? ENDLESS_TIERS[0];
  const nextTier = ENDLESS_TIERS[effectiveTierIndex + 1] ?? null;
  const endlessTierProgress = nextTier
    ? Math.max(0, Math.min(1, (animatedTotalScore - currentTier.threshold) / (nextTier.threshold - currentTier.threshold)))
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
        result.push({ type: gameLevel.constraintType, value: gameLevel.constraintValue, count: gameLevel.constraintCount, progress: constraintProgress });
      }
      if (gameLevel.constraint2Type !== undefined && gameLevel.constraint2Type !== ConstraintType.None) {
        result.push({ type: gameLevel.constraint2Type, value: gameLevel.constraint2Value, count: gameLevel.constraint2Count, progress: constraint2Progress });
      }
      if (gameLevel.constraint3Type !== undefined && gameLevel.constraint3Type !== ConstraintType.None) {
        result.push({ type: gameLevel.constraint3Type, value: gameLevel.constraint3Value, count: gameLevel.constraint3Count, progress: constraint3Progress });
      }
    }
    return result;
  }, [
    gameLevel?.constraintType, gameLevel?.constraintValue, gameLevel?.constraintCount, constraintProgress,
    gameLevel?.constraint2Type, gameLevel?.constraint2Value, gameLevel?.constraint2Count, constraint2Progress,
    gameLevel?.constraint3Type, gameLevel?.constraint3Value, gameLevel?.constraint3Count, constraint3Progress,
  ]);

  const hasConstraints = constraints.length > 0;
  const comboTextColor = combo > 0 ? "text-white" : "text-slate-500";

  // ─── Tooltip content for the guardian avatar ───
  const avatarTooltipContent = (
    <div className="flex flex-col gap-1.5 max-w-[200px]">
      <div className="font-sans text-xs font-bold">{guardian.name} — {guardian.title}</div>
      {isBoss ? (
        <div className="font-sans text-[11px] text-red-400">Boss Trial — {guardian.trialIntro}</div>
      ) : (
        <div className="font-sans text-[11px] text-slate-300">
          Lv.{level} — {guardian.encouragement}
        </div>
      )}
      {activeMutatorId > 0 && (
        <div className="font-sans text-[10px] text-yellow-400/90">
          {mutator.icon} {mutator.name}: {mutator.description}
        </div>
      )}
    </div>
  );

  if (isEndless) {
    return (
      <div className="w-full shrink-0 px-2 pt-2">
        <div className="relative mx-auto w-full max-w-[500px] px-3 py-2.5">
          <AnimatePresence>
            {showDifficultyUp && (
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

          <div className="space-y-2.5">
            {/* Top row: back + avatar + tier + moves */}
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative w-10 h-10 shrink-0">
                      <img src={portraitSrc} alt={guardian.name} className="w-full h-full rounded-full object-cover border-2 border-white/20" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg">
                    {avatarTooltipContent}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <div
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5"
                    style={{ borderColor: `${currentTier.color}80`, backgroundColor: `${currentTier.color}22` }}
                  >
                    <span className="text-xs leading-none">{currentTier.emoji}</span>
                    <span className="font-display text-[10px] text-white">{currentTier.name}</span>
                    <span className="font-display text-[10px]" style={{ color: currentTier.color }}>{currentTier.multiplier}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5">
                    <span className="text-[10px]">🔥</span>
                    <motion.span
                      key={combo}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`font-sans text-xs font-semibold tabular-nums ${comboTextColor}`}
                    >
                      {combo}x
                    </motion.span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-display text-[9px] uppercase tracking-wide text-slate-400">Moves</div>
                <div className="font-sans text-lg font-bold leading-none tabular-nums text-emerald-300">{movesRemaining}</div>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-semibold tabular-nums text-cyan-300">{animatedTotalScore}</span>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-slate-700/80">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${endlessTierProgress * 100}%`, backgroundColor: currentTier.color }}
                />
              </div>
              <span className="font-sans text-[10px] tabular-nums text-slate-400 shrink-0">
                {nextTier ? nextTier.threshold : "MAX"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STORY MODE HUD ───
  const hudBarBg = isBoss
    ? "linear-gradient(180deg, rgba(127,29,29,0.85) 0%, rgba(30,10,10,0.9) 100%)"
    : undefined;

  return (
    <div className="w-full shrink-0">
      <div
        className={`relative mx-auto w-full max-w-[500px] px-3 py-2 ${
          isBoss ? "boss-hud-bar" : ""
        }`}
        style={{
          backgroundImage: hudBarBg ?? `url(/assets/common/ui/action-bar.png)`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="space-y-1.5">
          {/* Row 1: Back + Avatar + Level + Combo + Constraints */}
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-slate-300 hover:text-white transition-colors shrink-0">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Guardian avatar */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className="relative shrink-0"
                    animate={isBoss ? {
                      boxShadow: [
                        "0 0 8px 2px rgba(239,68,68,0.3)",
                        "0 0 20px 6px rgba(239,68,68,0.6)",
                        "0 0 8px 2px rgba(239,68,68,0.3)",
                      ],
                    } : {}}
                    transition={isBoss ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                    style={{
                      borderRadius: "9999px",
                      width: isBoss ? 48 : 40,
                      height: isBoss ? 48 : 40,
                    }}
                  >
                    <img
                      src={portraitSrc}
                      alt={guardian.name}
                      className={`w-full h-full rounded-full object-cover border-2 ${
                        isBoss ? "border-red-500" : "border-white/30"
                      }`}
                    />
                    {isBoss && (
                      <motion.span
                        className="absolute -bottom-1 -right-1 text-[11px] bg-red-600 rounded-full w-5 h-5 flex items-center justify-center shadow-lg shadow-red-900/50"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ⚔
                      </motion.span>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg">
                  {avatarTooltipContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Level + mutator + combo */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                  isBoss ? "border-red-500/60 bg-red-500/20" : "border-yellow-500/60 bg-yellow-500/10"
                }`}>
                  <span className={`font-display text-[11px] tracking-wide ${isBoss ? "text-red-300" : "text-yellow-300"}`}>
                    {isBoss ? "BOSS" : "Lv"}
                  </span>
                  <span className={`font-sans text-xs font-bold leading-none tabular-nums ${isBoss ? "text-red-300" : "text-yellow-300"}`}>
                    {level}
                  </span>
                </div>
                {activeMutatorId > 0 && (
                  <span className="text-[10px] text-white/50">{mutator.icon}</span>
                )}
                <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/20 px-1.5 py-0.5">
                  <span className="text-[10px]">🔥</span>
                  <motion.span
                    key={combo}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`font-sans text-xs font-semibold tabular-nums ${comboTextColor}`}
                  >
                    {combo}x
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Constraints — right side */}
            {hasConstraints && (
              <TooltipProvider delayDuration={200}>
                <div className="flex items-center gap-1 shrink-0">
                  {constraints.map((c, i) => {
                    const description = Constraint.fromContractValues(c.type, c.value, c.count).getDescription();
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
                        <TooltipContent side="top" className="border border-slate-500 bg-slate-900 px-2 py-1 text-xs text-white">
                          {description}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            )}
          </div>

          {/* Row 2: Score progress bar */}
          <div className="flex items-center gap-2">
            <span className={`font-display text-[9px] uppercase tracking-wide w-8 shrink-0 ${
              isBoss ? "text-red-400" : "text-slate-400"
            }`}>{isBoss ? guardian.name : "Score"}</span>
            <div className={`flex-1 h-2 overflow-hidden rounded-full ${isBoss ? "bg-red-950/60" : "bg-slate-700/60"}`}>
              <motion.div
                className={`h-full rounded-full ${isBoss ? "" : "bg-cyan-500"}`}
                style={isBoss ? {
                  background: `linear-gradient(90deg, #ef4444 0%, #22c55e ${Math.max(scoreProgress * 100, 10)}%)`,
                } : undefined}
                initial={false}
                animate={{ width: `${scoreProgress * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className={`font-sans text-[11px] font-semibold tabular-nums shrink-0 ${
              isBoss ? "text-red-300" : "text-cyan-300"
            }`}>
              {animatedScore}<span className="text-slate-500">/{targetScore}</span>
            </span>
          </div>

          {/* Row 3: Moves progress bar with star thresholds */}
          <div className="flex items-center gap-2">
            <span className="font-display text-[9px] uppercase tracking-wide text-slate-400 w-8 shrink-0">Moves</span>
            <div className="relative flex-1 h-2 overflow-visible">
              {/* Bar background */}
              <div className="absolute inset-0 rounded-full bg-slate-700/60" />
              {/* Filled portion */}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: movesBarColor }}
                initial={false}
                animate={{ width: `${movesPct}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
              {/* 3-star threshold marker */}
              {cube3Pct > 0 && cube3Pct < 100 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-yellow-400/70 rounded-full"
                  style={{ left: `${cube3Pct}%` }}
                  title={`3★ — ${cube3Threshold} moves left`}
                />
              )}
              {/* 2-star threshold marker */}
              {cube2Pct > 0 && cube2Pct < 100 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-yellow-400/40 rounded-full"
                  style={{ left: `${cube2Pct}%` }}
                  title={`2★ — ${cube2Threshold} moves left`}
                />
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <span className="font-sans text-[11px] font-bold tabular-nums" style={{ color: movesBarColor }}>
                {movesRemaining}
              </span>
              <div className="flex items-center ml-0.5">
                {[1, 2, 3].map((star) => {
                  const lit = starsEarned >= star;
                  return (
                    <span
                      key={star}
                      className={`text-[10px] transition-colors ${lit ? "text-yellow-400" : "text-white/15"}`}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHud;
