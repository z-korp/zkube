import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import ProgressRing from "@/ui/components/shared/ProgressRing";
import { useLerpNumber } from "@/hooks/useLerpNumber";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getCommonAssetPath, getThemeImages } from "@/config/themes";
import type { ThemeId } from "@/config/themes";
import { HudBarSvg, HUD_BAR, circleToPercent, rectToPercent } from "@/ui/components/chrome";
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
  bonusUsedThisLevel: boolean;
  gameLevel: GameLevelData | null;
  activeMutatorId?: number;
  mode?: number;
  totalScore?: number;
  currentDifficulty?: number;
  zoneId?: number;
  onBack?: () => void;
}

const DESKTOP_BREAKPOINT = 640;

/** Ring size based on effective container width */
const getRingSize = () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const containerW = vw >= 768 ? Math.min(vw * 0.9, vh * 0.55, 680) : vw;
  return Math.round(Math.min(80, Math.max(44, containerW * 0.13)));
};

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
    default:
      return undefined;
  }
};

const getProgressBadge = (
  type: ConstraintType,
  progress: number,
  count: number,
): string | undefined => {
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
  const ringSize = useSyncExternalStore(subscribeResize, getRingSize, () => 44);
  const isEndless = mode === 1;
  const isBoss = isBossLevel(level);

  const settingsId = Math.max(0, (zoneId - 1) * 2);
  const { settings } = useSettings(settingsId);
  const ENDLESS_TIERS = useMemo(
    () => buildEndlessTiers(settings.endlessDifficultyThresholds, settings.endlessScoreMultipliers),
    [settings.endlessDifficultyThresholds, settings.endlessScoreMultipliers],
  );

  const { data: onChainMutator } = useMutatorDef(activeMutatorId);
  const mutator = getMutatorDef(activeMutatorId);

  const guardian = useMemo(() => getZoneGuardian(zoneId), [zoneId]);
  const portraitSrc = useMemo(() => getGuardianPortrait(zoneId), [zoneId]);

  const [prevDifficulty, setPrevDifficulty] = useState<number | undefined>(currentDifficulty);
  const [showDifficultyUp, setShowDifficultyUp] = useState(false);

  const animatedScore = useLerpNumber(levelScore, { duration: 300, integer: true }) ?? 0;
  const animatedTotalScore = useLerpNumber(totalScore, { duration: 300, integer: true }) ?? 0;

  // Contract thresholds are moves-USED caps; convert to moves-REMAINING floors
  const maxMoves = gameLevel?.maxMoves ?? 0;
  const star3UsedCap = gameLevel?.star3Threshold ?? 0;   // moves used <= this → 3 stars
  const star2UsedCap = gameLevel?.star2Threshold ?? 0;   // moves used <= this → 2 stars
  const movesUsed = maxMoves - movesRemaining;

  const scoreProgress = targetScore > 0 ? Math.min(1, animatedScore / targetScore) : 0;

  const starsEarned = movesUsed <= star3UsedCap ? 3 : movesUsed <= star2UsedCap ? 2 : 1;
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
    }
    return result;
  }, [
    gameLevel?.constraintType, gameLevel?.constraintValue, gameLevel?.constraintCount, constraintProgress,
    gameLevel?.constraint2Type, gameLevel?.constraint2Value, gameLevel?.constraint2Count, constraint2Progress,
  ]);

  const comboTextColor = combo > 0 ? "text-white" : "text-slate-500";

  // ─── Tooltip content for the guardian avatar ───
  const avatarTooltipContent = (
    <div className="flex flex-col gap-1.5 max-w-[200px]">
      <div className="font-sans text-xs font-bold">{guardian.name} · {guardian.title}</div>
      {isBoss ? (
        <div className="font-sans text-[11px] text-red-400">{guardian.trialIntro}</div>
      ) : (
        <div className="font-sans text-[11px] text-slate-300">
          Lv.{level} · {guardian.encouragement}
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
        <div className="relative mx-auto w-full max-w-full px-3 py-2.5">
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
  const guardianPos = circleToPercent(HUD_BAR.sockets.guardian, HUD_BAR.viewBox);
  const scorePos = rectToPercent(HUD_BAR.sockets.scoreBar, HUD_BAR.viewBox);
  const comboPos = rectToPercent(HUD_BAR.sockets.combo, HUD_BAR.viewBox);
  const movesPos = circleToPercent(HUD_BAR.sockets.moves, HUD_BAR.viewBox);
  // Constraints use center-point positioning so ProgressRing can size itself freely
  const c1Pos = {
    left: `${(HUD_BAR.sockets.constraint1.cx / HUD_BAR.viewBox.width) * 100}%`,
    top: `${(HUD_BAR.sockets.constraint1.cy / HUD_BAR.viewBox.height) * 100}%`,
    transform: "translate(-50%, -50%)",
  };
  const c2Pos = {
    left: `${(HUD_BAR.sockets.constraint2.cx / HUD_BAR.viewBox.width) * 100}%`,
    top: `${(HUD_BAR.sockets.constraint2.cy / HUD_BAR.viewBox.height) * 100}%`,
    transform: "translate(-50%, -50%)",
  };

  // Theme image for regular levels, guardian portrait for boss only
  const themeId = `theme-${Math.min(10, Math.max(1, zoneId))}` as ThemeId;
  const leftSocketSrc = isBoss ? portraitSrc : getThemeImages(themeId).themeIcon;

  const regularTooltip = !isBoss && activeMutatorId > 0 ? (
    <div className="flex flex-col gap-1 max-w-[200px]">
      <div className="font-sans text-xs font-bold">{mutator.icon} {mutator.name}</div>
      <div className="font-sans text-[11px] text-slate-300">{mutator.description}</div>
    </div>
  ) : (
    <div className="flex flex-col gap-1 max-w-[200px]">
      <div className="font-sans text-xs font-bold">{guardian.name} · {guardian.title}</div>
      <div className={`font-sans text-[11px] ${isBoss ? "text-red-400" : "text-slate-300"}`}>
        {isBoss ? guardian.trialIntro : `Lv.${level} · ${guardian.encouragement}`}
      </div>
    </div>
  );

  return (
    <div className="w-full shrink-0 px-[clamp(0px,1vw,8px)] pt-[clamp(0px,0.5vh,6px)]">
      <div className="relative z-10 mx-auto w-full max-w-full">
        <HudBarSvg starsEarned={starsEarned} />

        <div className="absolute inset-0">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="absolute z-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-slate-300 hover:text-white transition-colors"
              style={{
                top: `${((HUD_BAR.sockets.guardian.cy - HUD_BAR.sockets.guardian.r) / HUD_BAR.viewBox.height) * 100}%`,
                left: "0%",
                width: "6%",
                aspectRatio: "1",
              }}
            >
              <ArrowLeft className="w-[50%] h-[50%]" />
            </button>
          )}

          {/* Portrait + level badge */}
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="absolute rounded-full"
                  style={guardianPos}
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
                    src={leftSocketSrc}
                    alt={isBoss ? guardian.name : "Zone"}
                    className="absolute inset-0 w-full h-full rounded-full object-cover overflow-hidden"
                  />
                  {/* Level badge — bottom-right, outside portrait circle */}
                  <div className={`absolute -bottom-2 -right-2 rounded-full min-w-[clamp(20px,6vw,32px)] h-[clamp(20px,6vw,32px)] flex items-center justify-center px-0.5 font-sans text-[clamp(10px,3vw,16px)] font-bold z-10 shadow-[0_0_4px_rgba(0,0,0,0.5)] ${
                    isBoss ? "bg-red-600 border border-red-400/50 text-white" : "bg-slate-800 border border-yellow-500/70 text-yellow-300"
                  }`}>
                    {level}
                  </div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-slate-900 border border-slate-500 text-white px-3 py-2 shadow-lg">
                {regularTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Score bar — text centered inside */}
          <div className="absolute" style={scorePos}>
            <div className="relative w-full h-full flex items-center">
              <div className="w-full h-[clamp(8px,2.5vw,16px)] overflow-hidden rounded-full bg-black/50">
                <motion.div
                  className={`h-full rounded-full ${isBoss ? "" : "bg-gradient-to-r from-cyan-600 to-cyan-400"}`}
                  style={isBoss ? { background: "linear-gradient(90deg, #ef4444, #22c55e)" } : undefined}
                  initial={false}
                  animate={{ width: `${scoreProgress * 100}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              {/* Centered score text inside the bar */}
              <span className={`absolute inset-0 flex items-center justify-center font-sans text-[clamp(8px,2.2vw,14px)] font-bold tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                isBoss ? "text-red-200" : "text-white"
              }`}>
                {animatedScore}/{targetScore}
              </span>
            </div>
          </div>

          {/* Combo streak — fire badge */}
          <div
            className="absolute flex items-center justify-center"
            style={comboPos}
          >
            <motion.div
              key={combo}
              animate={combo > 0 ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`flex items-center gap-[2px] rounded-full px-[clamp(6px,1.8vw,10px)] h-full font-sans text-[clamp(10px,3vw,16px)] font-bold tabular-nums ${
                combo >= 3
                  ? "bg-gradient-to-r from-orange-600 to-yellow-500 text-white shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                  : combo > 0
                    ? "bg-gradient-to-r from-orange-800/80 to-red-700/80 text-orange-200"
                    : "bg-slate-800/60 text-slate-500"
              }`}
            >
              <span className="text-[clamp(10px,2.8vw,15px)] leading-none">🔥</span>
              <span>{combo > 0 ? `${combo}x` : "–"}</span>
            </motion.div>
          </div>

          {/* Moves counter */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={movesPos}
          >
            <span className="font-sans text-[clamp(7px,2vw,12px)] font-semibold uppercase tracking-wider leading-none text-slate-400">MOVES</span>
            <span className={`font-sans text-[clamp(18px,5.5vw,32px)] font-bold leading-none tabular-nums`} style={{ color: movesBarColor }}>
              {movesRemaining}
            </span>
          </div>

          {/* Constraints — below combo, centered */}
          {constraints.length > 0 && (
            <TooltipProvider delayDuration={200}>
              {constraints.map((c, i) => {
                const pos = i === 0 ? c1Pos : c2Pos;
                const description = Constraint.fromContractValues(c.type, c.value, c.count).getDescription();
                return (
                  <Tooltip key={`constraint-${i}`}>
                    <TooltipTrigger asChild>
                      <div className="absolute flex items-center justify-center" style={pos}>
                        <ProgressRing
                          progress={getConstraintProgress(c.type, c.progress, c.count, bonusUsedThisLevel)}
                          size={ringSize}
                          color={getConstraintColor(c.type, c.progress, c.count, bonusUsedThisLevel)}
                          icon={getConstraintIcon(c.type)}
                          badgeBottomLeft={getValueBadge(c.type, c.value)}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default GameHud;
