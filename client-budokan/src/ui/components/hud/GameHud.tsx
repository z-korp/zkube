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
  // Socket positions as % of hud-bar.png (1024x336)
  // Left big socket (guardian): center ~10%, 50%
  // Small socket (level): center ~21%, 50%
  // Stars: ~44%, 50%, 56% at ~12%
  // Center bar: ~26% to ~78%, ~40% to ~72%
  // Right gear socket (moves): center ~90%, 50%

  return (
    <div className="w-full shrink-0">
      {/* ─── Main HUD bar ─── */}
      <div className="relative mx-auto w-full max-w-[500px]">
        {/* Chrome background — drives sizing */}
        <img
          src="/assets/common/ui/hud-bar.png"
          alt=""
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Back button — top-left, outside the frame */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute z-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-slate-300 hover:text-white transition-colors"
            style={{ top: "2%", left: "0%", width: "6%", paddingBottom: "6%" }}
          >
            <ArrowLeft className="absolute w-[50%] h-[50%]" />
          </button>
        )}

        {/* Guardian portrait — left shield socket */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className="absolute rounded-full overflow-hidden"
                style={{ left: "3.2%", top: "20%", width: "11%", paddingBottom: "11%" }}
                animate={isBoss ? {
                  boxShadow: [
                    "0 0 8px 2px rgba(239,68,68,0.3)",
                    "0 0 16px 4px rgba(239,68,68,0.6)",
                    "0 0 8px 2px rgba(239,68,68,0.3)",
                  ],
                } : {}}
                transition={isBoss ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                <img
                  src={portraitSrc}
                  alt={guardian.name}
                  className="absolute inset-0 w-full h-full rounded-full object-cover"
                />
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg">
              {avatarTooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Level number — small socket */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ left: "16%", top: "25%", width: "7%", height: "50%" }}
        >
          <span className={`font-display text-[clamp(6px,1.5vw,9px)] leading-none ${isBoss ? "text-red-400" : "text-slate-400"}`}>
            {isBoss ? "BOSS" : "Lv"}
          </span>
          <span className={`font-sans text-[clamp(12px,3vw,20px)] font-bold leading-none tabular-nums ${isBoss ? "text-red-300" : "text-yellow-300"}`}>
            {level}
          </span>
        </div>

        {/* Stars — top center over the 3 engraved notches */}
        <div
          className="absolute flex items-center justify-center gap-[3%]"
          style={{ left: "30%", top: "6%", width: "40%", height: "26%" }}
        >
          {[1, 2, 3].map((star) => (
            <span
              key={star}
              className={`text-[clamp(12px,3vw,18px)] transition-colors ${
                starsEarned >= star
                  ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]"
                  : "text-white/15"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Score bar — center recessed channel */}
        <div
          className="absolute flex items-center gap-[1.5%]"
          style={{ left: "25%", top: "38%", width: "50%", height: "22%" }}
        >
          <div className="flex-1 h-[clamp(6px,1.8vw,10px)] overflow-hidden rounded-full bg-black/50">
            <motion.div
              className={`h-full rounded-full ${isBoss ? "" : "bg-gradient-to-r from-cyan-600 to-cyan-400"}`}
              style={isBoss ? { background: "linear-gradient(90deg, #ef4444, #22c55e)" } : undefined}
              initial={false}
              animate={{ width: `${scoreProgress * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <span className={`font-sans text-[clamp(7px,1.8vw,11px)] font-bold tabular-nums shrink-0 ${
            isBoss ? "text-red-300" : "text-cyan-300"
          }`}>
            {animatedScore}<span className="text-slate-500">/{targetScore}</span>
          </span>
        </div>

        {/* Combo + mutator — below score bar */}
        <div
          className="absolute flex items-center justify-center gap-[1.5%]"
          style={{ left: "25%", top: "64%", width: "50%", height: "20%" }}
        >
          <div className="inline-flex items-center gap-0.5">
            <span className="text-[clamp(7px,1.8vw,10px)]">🔥</span>
            <motion.span
              key={combo}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`font-sans text-[clamp(8px,2vw,12px)] font-semibold tabular-nums ${comboTextColor}`}
            >
              {combo}x
            </motion.span>
          </div>
          {activeMutatorId > 0 && (
            <span className="text-[clamp(7px,1.8vw,10px)] text-white/40">{mutator.icon} {mutator.name}</span>
          )}
        </div>

        {/* Moves counter — right gear socket */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ right: "3%", top: "18%", width: "13%", height: "64%" }}
        >
          <span className="font-display text-[clamp(6px,1.5vw,9px)] leading-none text-slate-400">MOVES</span>
          <span className={`font-sans text-[clamp(16px,4vw,26px)] font-bold leading-none tabular-nums`} style={{ color: movesBarColor }}>
            {movesRemaining}
          </span>
        </div>
      </div>

      {/* ─── Constraint bar (only when constraints exist) ─── */}
      {hasConstraints && (
        <div className="relative mx-auto w-full max-w-[280px] -mt-1">
          <img
            src="/assets/common/ui/constraint-bar.png"
            alt=""
            className="w-full h-auto block"
            draggable={false}
          />
          {/* Constraint rings positioned over the two sockets */}
          <div className="absolute inset-0 flex items-center justify-center gap-[16%]">
            <TooltipProvider delayDuration={200}>
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
                    <TooltipContent side="bottom" className="border border-slate-500 bg-slate-900 px-2 py-1 text-xs text-white">
                      {description}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameHud;
