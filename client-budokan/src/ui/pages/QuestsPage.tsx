import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Clock3,
  Gamepad2,
  ListOrdered,
  Loader2,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useQuests } from "@/contexts/quests";
import { useMusicPlayer } from "@/contexts/hooks";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import type { QuestFamily, QuestTier } from "@/types/questFamily";
import GameButton from "@/ui/components/shared/GameButton";
import PageTopBar from "@/ui/navigation/PageTopBar";
import { shortString } from "starknet";

// ─── Icon map ────────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
  "fa-gamepad": Gamepad2,
  "fa-bars-staggered": ListOrdered,
  "fa-bolt": Zap,
  "fa-arrow-trend-up": TrendingUp,
  "fa-trophy": Trophy,
};

// ─── Animation variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

// ─── Countdown helpers ──────────────────────────────────────────────────────

const secondsUntilNextUtcMidnight = (): number => {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  return Math.max(0, Math.floor((next - now.getTime()) / 1000));
};

const formatCountdown = (sec: number): string => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  const ss = s % 60;
  return `${m}m ${ss.toString().padStart(2, "0")}s`;
};

// ─── Countdown pill ─────────────────────────────────────────────────────────

const CountdownPill: React.FC = () => {
  const [sec, setSec] = useState(secondsUntilNextUtcMidnight);

  useEffect(() => {
    const id = window.setInterval(
      () => setSec(secondsUntilNextUtcMidnight()),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1.5 border border-white/10">
      <Clock3 size={14} className="text-cyan-300" />
      <span className="font-['Fredericka_the_Great'] text-base leading-none tracking-wide text-cyan-100">
        {formatCountdown(sec)}
      </span>
    </div>
  );
};

// ─── Inline cube ────────────────────────────────────────────────────────────

const InlineCube: React.FC<{
  amount: number;
  muted?: boolean;
  className?: string;
}> = ({ amount, muted = false, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 flex-shrink-0 ${
      muted ? "opacity-35" : ""
    } ${className}`}
  >
    <span className="text-sm">🧊</span>
    <span className="font-['Fredericka_the_Great'] text-base leading-none tracking-wide text-yellow-200">
      {amount}
    </span>
  </span>
);

// ─── Breakpoint Slider ──────────────────────────────────────────────────────
// For Player and Clearer families.
// Track from 0→max with breakpoint dots at each tier target.
// Claim happens via a bubble attached to the breakpoint.

interface BreakpointSliderProps {
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const BreakpointSlider: React.FC<BreakpointSliderProps> = memo(
  ({ family, onClaim, claimingKey, disabled }) => {
    const Icon = iconMap[family.icon] ?? Gamepad2;
    const allClaimed = family.tiers.every((t) => t.claimed);

    const maxTarget = family.tiers[family.tiers.length - 1]?.target ?? 1;
    const progress = Math.min(family.progress, maxTarget);
    const fillPercent = maxTarget > 0 ? (progress / maxTarget) * 100 : 0;

    const breakpoints = family.tiers.map((tier) => ({
      target: tier.target,
      reward: tier.reward,
      completed: tier.completed,
      claimed: tier.claimed,
      claimable: tier.completed && !tier.claimed,
      questId: tier.questId,
      intervalId: tier.intervalId,
      position: maxTarget > 0 ? (tier.target / maxTarget) * 100 : 0,
    }));

    const hasClaimable = breakpoints.some((bp) => bp.claimable);

    const cardBg = allClaimed
      ? "bg-slate-800 border-green-500/15"
      : hasClaimable
        ? "bg-indigo-950 border-green-500/30"
        : "bg-indigo-950 border-white/8";

    return (
      <motion.section
        variants={itemVariants}
        className={`rounded-2xl border p-4 ${cardBg}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid h-8 w-8 place-items-center rounded-lg flex-shrink-0 ${
                allClaimed
                  ? "bg-green-500/15 text-green-400/60"
                  : hasClaimable
                    ? "bg-yellow-400/15 text-yellow-300"
                    : "bg-white/8 text-cyan-300"
              }`}
            >
              <Icon size={16} />
            </div>
            <span
              className={`font-['Fredericka_the_Great'] text-lg leading-tight ${
                allClaimed ? "text-slate-400" : "text-white"
              }`}
            >
              {family.name}
            </span>
            {allClaimed && (
              <Check size={14} className="text-green-400/60" />
            )}
          </div>
          <InlineCube amount={family.totalReward} muted={allClaimed} />
        </div>

        {/* Slider track */}
        <div className="relative px-3 pt-9 pb-7">
          {/* Track bg */}
          <div className="relative h-2 bg-slate-700 rounded-full">
            {/* Fill */}
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full ${
                allClaimed
                  ? "bg-green-500/40"
                  : hasClaimable
                    ? "bg-gradient-to-r from-cyan-400 to-green-400"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${fillPercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />

            {/* Breakpoints */}
            {breakpoints.map((bp, i) => {
              const isClaimingThis =
                claimingKey === `${bp.questId}:${bp.intervalId}`;
              return (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                  style={{ left: `${bp.position}%` }}
                >
                  {/* Dot */}
                  <div
                    className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      bp.claimed
                        ? "bg-green-500 border-green-400 text-white"
                        : bp.claimable
                          ? "bg-yellow-400 border-yellow-300 text-slate-900"
                          : bp.completed
                            ? "bg-cyan-400 border-cyan-300 text-slate-900"
                            : "bg-slate-700 border-slate-500"
                    }`}
                  >
                    {bp.claimed && <Check size={10} strokeWidth={3} />}
                    {bp.claimable && (
                      <span className="block w-2 h-2 rounded-full bg-slate-900" />
                    )}
                  </div>

                  {/* Claim bubble above */}
                  {bp.claimable && (
                    <button
                      onClick={() => {
                        if (isClaimingThis || disabled) return;
                        onClaim(bp.questId, bp.intervalId);
                      }}
                      disabled={isClaimingThis || disabled}
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg shadow-green-500/40 disabled:opacity-50 transition-colors"
                    >
                      {isClaimingThis ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        "Claim"
                      )}
                    </button>
                  )}

                  {/* Labels below */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <span
                      className={`text-xs font-medium tabular-nums ${
                        bp.claimed
                          ? "text-green-400/50"
                          : bp.completed
                            ? "text-cyan-200"
                            : "text-slate-400"
                      }`}
                    >
                      {bp.target}
                    </span>
                    <span
                      className={`text-[10px] leading-tight ${
                        bp.claimed ? "text-slate-600" : "text-yellow-300/60"
                      }`}
                    >
                      🧊{bp.reward}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
    );
  },
);
BreakpointSlider.displayName = "BreakpointSlider";

// ─── Pill indicators ────────────────────────────────────────────────────────
// Capsule-shaped tier indicators (filled/empty)

const PillIndicators: React.FC<{
  tiers: QuestTier[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}> = ({ tiers, selectedIndex, onSelect }) => (
  <div className="flex items-center gap-1">
    {tiers.map((tier, i) => (
      <button
        key={tier.questId}
        onClick={() => onSelect(i)}
        className={`h-4 rounded-full transition-all ${
          i === selectedIndex ? "w-8" : "w-5"
        } ${
          tier.claimed
            ? "bg-green-500/60"
            : tier.completed
              ? "bg-yellow-400"
              : i === selectedIndex
                ? "bg-slate-500"
                : "bg-slate-700"
        }`}
      />
    ))}
  </div>
);

// ─── Tier Card View ─────────────────────────────────────────────────────────
// For Combo and Combo Streak. Shows one tier at a time with pill indicators.
// Auto-advances when claimed. User can tap pills to navigate.

interface TierCardViewProps {
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const TierCardView: React.FC<TierCardViewProps> = memo(
  ({ family, onClaim, claimingKey, disabled }) => {
    const Icon = iconMap[family.icon] ?? Gamepad2;
    const allClaimed = family.tiers.every((t) => t.claimed);

    // Auto-select first unclaimed tier
    const autoIndex = useMemo(() => {
      const idx = family.tiers.findIndex((t) => !t.claimed);
      return idx >= 0 ? idx : family.tiers.length - 1;
    }, [family.tiers]);

    const [selectedIndex, setSelectedIndex] = useState(autoIndex);

    useEffect(() => {
      setSelectedIndex(autoIndex);
    }, [autoIndex]);

    const tier = family.tiers[selectedIndex];
    if (!tier) return null;

    const claimable = tier.completed && !tier.claimed;
    const claimKey = `${tier.questId}:${tier.intervalId}`;
    const isClaiming = claimingKey === claimKey;

    const cardBg = allClaimed
      ? "bg-slate-800 border-green-500/15"
      : claimable
        ? "bg-indigo-950 border-green-500/30"
        : "bg-indigo-950 border-white/8";

    return (
      <motion.section
        variants={itemVariants}
        className={`rounded-2xl border p-4 ${cardBg}`}
      >
        {/* Header: icon + name + pills */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid h-8 w-8 place-items-center rounded-lg flex-shrink-0 ${
                allClaimed
                  ? "bg-green-500/15 text-green-400/60"
                  : claimable
                    ? "bg-yellow-400/15 text-yellow-300"
                    : "bg-white/8 text-cyan-300"
              }`}
            >
              <Icon size={16} />
            </div>
            <span
              className={`font-['Fredericka_the_Great'] text-lg leading-tight ${
                allClaimed ? "text-slate-400" : "text-white"
              }`}
            >
              {family.name}
            </span>
          </div>
          <PillIndicators
            tiers={family.tiers}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>

        {/* Active tier card */}
        <div
          className={`rounded-xl p-3 ${
            tier.claimed
              ? "bg-black/20"
              : claimable
                ? "bg-green-950/40 border border-green-500/15"
                : "bg-black/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                {tier.claimed && (
                  <Check
                    size={14}
                    className="text-green-400 flex-shrink-0"
                  />
                )}
                {claimable && (
                  <span className="text-green-400 font-bold italic text-xs uppercase tracking-wide flex-shrink-0">
                    DONE!
                  </span>
                )}
                <span
                  className={`text-sm truncate ${
                    tier.claimed
                      ? "text-slate-500 line-through"
                      : claimable
                        ? "text-green-200"
                        : "text-slate-200"
                  }`}
                >
                  {tier.description || tier.name}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Tier {tier.tier}/{family.totalTiers}
              </span>
            </div>
            <InlineCube amount={tier.reward} muted={tier.claimed} />
          </div>

          {/* Claim button */}
          {claimable && (
            <button
              onClick={() => onClaim(tier.questId, tier.intervalId)}
              disabled={isClaiming || disabled}
              className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isClaiming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>Claim 🧊 {tier.reward}</>
              )}
            </button>
          )}
        </div>
      </motion.section>
    );
  },
);
TierCardView.displayName = "TierCardView";

// ─── Daily Champion ─────────────────────────────────────────────────────────

interface ChampionPanelProps {
  family: QuestFamily;
  totalCompleted: number;
  totalQuests: number;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const ChampionPanel: React.FC<ChampionPanelProps> = memo(
  ({ family, totalCompleted, totalQuests, onClaim, claimingKey, disabled }) => {
    const tier = family.tiers[0];
    if (!tier) return null;

    const progressPercent =
      totalQuests > 0
        ? Math.min((totalCompleted / totalQuests) * 100, 100)
        : 0;
    const claimKey = `${tier.questId}:${tier.intervalId}`;
    const canClaim = tier.completed && !tier.claimed;
    const isClaiming = claimingKey === claimKey;

    return (
      <motion.section
        variants={itemVariants}
        className={`rounded-2xl border p-4 ${
          tier.claimed
            ? "bg-slate-800 border-yellow-500/10"
            : canClaim
              ? "bg-gradient-to-br from-yellow-950/80 via-amber-950/70 to-orange-950/60 border-yellow-400/30"
              : "bg-indigo-950 border-yellow-500/15"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`grid h-9 w-9 place-items-center rounded-lg flex-shrink-0 ${
                tier.claimed
                  ? "bg-yellow-500/10 text-yellow-400/40"
                  : canClaim
                    ? "bg-yellow-400/20 text-yellow-200"
                    : "bg-yellow-500/10 text-yellow-300"
              }`}
            >
              <Trophy size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-['Fredericka_the_Great'] text-lg leading-tight ${
                    tier.claimed ? "text-yellow-400/40" : "text-yellow-50"
                  }`}
                >
                  Daily Champion
                </span>
                {canClaim && (
                  <span className="text-green-400 font-bold italic text-xs uppercase tracking-wide">
                    DONE!
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  tier.claimed ? "text-yellow-400/25" : "text-yellow-100/60"
                }`}
              >
                Complete all {totalQuests} quests
              </p>
            </div>
          </div>
          <InlineCube amount={tier.reward} muted={tier.claimed} />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/30">
            <motion.div
              className={`h-full rounded-full ${
                tier.claimed
                  ? "bg-yellow-600/30"
                  : canClaim
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : "bg-gradient-to-r from-yellow-400 to-amber-300"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-lg leading-none tracking-wide min-w-fit ${
              tier.claimed ? "text-yellow-400/35" : "text-yellow-50"
            }`}
          >
            {totalCompleted}/{totalQuests}
          </span>
        </div>

        {/* Claim */}
        {canClaim && (
          <GameButton
            label={`CLAIM CHAMPION  🧊 ${tier.reward}`}
            variant="primary"
            loading={isClaiming}
            disabled={disabled}
            onClick={() => onClaim(tier.questId, tier.intervalId)}
          />
        )}

        {tier.claimed && (
          <div className="text-center text-xs text-yellow-400/35 pt-0.5">
            Champion reward claimed
          </div>
        )}
      </motion.section>
    );
  },
);
ChampionPanel.displayName = "ChampionPanel";

// ─── Main page ──────────────────────────────────────────────────────────────

const SLIDER_FAMILIES = new Set(["player", "clearer"]);

const QuestsPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const { playSfx } = useMusicPlayer();
  const { account } = useAccountCustom();
  const { questFamilies, status } = useQuests();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const { mainFamilies, finisherFamily } = useMemo(() => {
    const main = questFamilies.filter((f) => f.id !== "finisher");
    const finisher = questFamilies.find((f) => f.id === "finisher");
    return { mainFamilies: main, finisherFamily: finisher };
  }, [questFamilies]);

  const totals = useMemo(() => {
    const totalQuests = mainFamilies.reduce((s, f) => s + f.totalTiers, 0);
    const totalCompleted = mainFamilies.reduce(
      (s, f) => s + f.tiers.filter((t) => t.completed).length,
      0,
    );
    return { totalCompleted, totalQuests };
  }, [mainFamilies]);

  const handleClaim = useCallback(
    async (questId: string, intervalId: number) => {
      if (!account) return;
      const key = `${questId}:${intervalId}`;
      setClaimingKey(key);
      try {
        const questIdFelt = `0x${BigInt(shortString.encodeShortString(questId)).toString(16)}`;
        await systemCalls.claimQuest({
          account,
          quest_id: questIdFelt,
          interval_id: intervalId,
        });
        playSfx("claim");
      } finally {
        setClaimingKey(null);
      }
    },
    [account, playSfx, systemCalls],
  );

  const allClaimed =
    questFamilies.length > 0 &&
    questFamilies.every((f) => f.tiers.every((t) => t.claimed));

  const renderFamily = (family: QuestFamily) => {
    if (SLIDER_FAMILIES.has(family.id)) {
      return (
        <BreakpointSlider
          key={family.id}
          family={family}
          onClaim={handleClaim}
          claimingKey={claimingKey}
          disabled={!account}
        />
      );
    }
    return (
      <TierCardView
        key={family.id}
        family={family}
        onClaim={handleClaim}
        claimingKey={claimingKey}
        disabled={!account}
      />
    );
  };

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="DAILY QUESTS"
        onBack={goBack}
        rightSlot={<CountdownPill />}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-[680px] flex-col gap-3 pb-8"
        >
          {/* Loading / error / empty */}
          {status === "loading" && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/8 bg-indigo-950 p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-200">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading daily quests…</span>
              </div>
            </motion.section>
          )}

          {status === "error" && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-red-400/20 bg-red-950/80 p-4 text-sm text-red-200"
            >
              Failed to load quests. Reopen the page to retry.
            </motion.section>
          )}

          {status === "success" && questFamilies.length === 0 && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/8 bg-indigo-950 p-4 text-sm text-slate-300"
            >
              No quests available yet.
            </motion.section>
          )}

          {/* Daily Champion */}
          {status === "success" && finisherFamily && (
            <ChampionPanel
              family={finisherFamily}
              totalCompleted={totals.totalCompleted}
              totalQuests={totals.totalQuests}
              onClaim={handleClaim}
              claimingKey={claimingKey}
              disabled={!account}
            />
          )}

          {/* Quest families */}
          {status === "success" && mainFamilies.map(renderFamily)}

          {/* All claimed */}
          {status === "success" && allClaimed && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-green-500/15 bg-green-950/50 px-4 py-3 text-center text-sm text-green-200/70"
            >
              All daily quests claimed — come back after reset!
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuestsPage;
