import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Circle,
  CircleCheck,
  Clock3,
  Gamepad2,
  ListOrdered,
  Loader2,
  Lock,
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
  const nextUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  );
  return Math.max(0, Math.floor((nextUtcMidnight - now.getTime()) / 1000));
};

const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  const s = safe % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
};

// ─── Reward badge ───────────────────────────────────────────────────────────

const CubeReward: React.FC<{
  amount: number;
  claimed?: boolean;
  size?: "sm" | "md" | "lg";
}> = ({ amount, claimed = false, size = "md" }) => {
  const sizeClasses = {
    sm: "w-10 h-12",
    md: "w-12 h-14",
    lg: "w-14 h-16",
  };
  return (
    <div
      className={`${sizeClasses[size]} flex flex-col items-center justify-center gap-0.5 flex-shrink-0`}
    >
      {claimed ? (
        <Check size={18} className="text-green-400" />
      ) : (
        <span className={size === "lg" ? "text-2xl" : "text-lg"}>🧊</span>
      )}
      <span
        className={`font-['Fredericka_the_Great'] leading-none tracking-wide ${
          claimed
            ? "text-sm text-slate-500"
            : "text-sm text-yellow-200"
        }`}
      >
        {amount}
      </span>
    </div>
  );
};

// ─── Countdown pill ─────────────────────────────────────────────────────────

const CountdownPill: React.FC = () => {
  const [sec, setSec] = useState(secondsUntilNextUtcMidnight);

  useEffect(() => {
    const id = window.setInterval(() => setSec(secondsUntilNextUtcMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-black/30 px-2.5 py-1.5 border border-white/10">
      <Clock3 size={14} className="text-cyan-300" />
      <span className="font-['Fredericka_the_Great'] text-base leading-none tracking-wide text-cyan-100">
        {formatCountdown(sec)}
      </span>
    </div>
  );
};

// ─── Tier row (compact) ─────────────────────────────────────────────────────

const TierRow: React.FC<{ tier: QuestTier; isActive: boolean }> = memo(
  ({ tier, isActive }) => {
    let icon: React.ReactNode;
    let textClass: string;

    if (tier.claimed) {
      icon = <CircleCheck size={12} className="text-green-400/60" />;
      textClass = "text-slate-500 line-through";
    } else if (tier.completed) {
      icon = <CircleCheck size={12} className="text-green-400" />;
      textClass = "text-green-300";
    } else if (tier.locked) {
      icon = <Lock size={12} className="text-slate-600" />;
      textClass = "text-slate-600";
    } else {
      icon = <Circle size={12} className="text-slate-400" />;
      textClass = "text-slate-300";
    }

    return (
      <div
        className={`flex items-center justify-between gap-2 py-1 px-2 rounded text-sm ${
          isActive ? "bg-white/5" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className={`truncate ${textClass}`}>
            {tier.description || tier.name}
          </span>
        </div>
        <span
          className={`font-['Fredericka_the_Great'] text-base leading-none tracking-wide flex-shrink-0 ${
            tier.claimed
              ? "text-slate-600"
              : tier.completed
                ? "text-yellow-300"
                : "text-slate-400"
          }`}
        >
          +{tier.reward}
        </span>
      </div>
    );
  },
);
TierRow.displayName = "TierRow";

// ─── Quest family card ──────────────────────────────────────────────────────

interface FamilyCardProps {
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const FamilyCard: React.FC<FamilyCardProps> = memo(
  ({ family, onClaim, claimingKey, disabled }) => {
    const Icon = iconMap[family.icon] ?? Gamepad2;

    const allCompleted = family.tiers.every((t) => t.completed);
    const allClaimed = family.tiers.every((t) => t.claimed);
    const claimableTier = family.claimableTier;
    const claimKey = claimableTier
      ? `${claimableTier.questId}:${claimableTier.intervalId}`
      : "";
    const isClaiming = claimableTier !== null && claimingKey === claimKey;

    const progressPercent =
      family.nextTarget > 0
        ? Math.min((family.progress / family.nextTarget) * 100, 100)
        : allCompleted
          ? 100
          : 0;

    // Card background varies by state
    const cardBg = allClaimed
      ? "bg-slate-900/40 border-green-400/10"
      : claimableTier
        ? "bg-indigo-900/50 border-green-400/20"
        : "bg-indigo-900/30 border-white/5";

    return (
      <motion.section variants={itemVariants} className={`rounded-2xl border p-4 ${cardBg}`}>
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`grid h-9 w-9 place-items-center rounded-xl flex-shrink-0 ${
                allClaimed
                  ? "bg-green-500/15 text-green-400/60"
                  : claimableTier
                    ? "bg-yellow-400/15 text-yellow-300"
                    : "bg-white/10 text-cyan-300"
              }`}
            >
              <Icon size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  className={`font-['Fredericka_the_Great'] text-lg leading-tight truncate ${
                    allClaimed ? "text-slate-400" : "text-white"
                  }`}
                >
                  {family.name}
                </h2>
                {allCompleted && !allClaimed && (
                  <span className="text-green-400 font-bold italic text-xs uppercase tracking-wide">
                    DONE!
                  </span>
                )}
                {allClaimed && (
                  <Check size={14} className="text-green-400/60 flex-shrink-0" />
                )}
              </div>
              {/* Current tier description */}
              {!allCompleted && family.currentTierIndex >= 0 && (
                <p className="text-xs text-slate-400 truncate">
                  {family.tiers[family.currentTierIndex]?.description ||
                    family.tiers[family.currentTierIndex]?.name}
                </p>
              )}
            </div>
          </div>

          {/* Reward badge */}
          <CubeReward
            amount={
              claimableTier
                ? claimableTier.reward
                : allCompleted
                  ? family.totalReward
                  : family.tiers[family.currentTierIndex >= 0 ? family.currentTierIndex : 0]
                      ?.reward ?? 0
            }
            claimed={allClaimed}
            size="md"
          />
        </div>

        {/* Progress bar (only when NOT all completed) */}
        {!allCompleted && (
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/30">
              <motion.div
                className={`h-full rounded-full ${
                  claimableTier
                    ? "bg-gradient-to-r from-green-400 to-emerald-500"
                    : "bg-gradient-to-r from-cyan-400 to-blue-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="font-['Fredericka_the_Great'] text-base leading-none tracking-wide text-cyan-100 min-w-fit">
              {family.progress}/{family.nextTarget}
            </span>
          </div>
        )}

        {/* Completed progress bar */}
        {allCompleted && !allClaimed && (
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/30">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <Check size={16} className="text-green-400" />
          </div>
        )}

        {/* Tier rows (collapsible detail) */}
        {family.totalTiers > 1 && (
          <div className="flex flex-col gap-0.5 mb-2 rounded-xl bg-black/15 p-1.5">
            {family.tiers.map((tier) => (
              <TierRow
                key={tier.questId}
                tier={tier}
                isActive={
                  family.currentTierIndex >= 0 &&
                  family.tiers[family.currentTierIndex]?.questId === tier.questId
                }
              />
            ))}
          </div>
        )}

        {/* Claim button */}
        {claimableTier && (
          <GameButton
            label={`CLAIM TIER ${claimableTier.tier}  +${claimableTier.reward} CUBE`}
            variant="primary"
            loading={isClaiming}
            disabled={disabled}
            onClick={() => onClaim(claimableTier.questId, claimableTier.intervalId)}
          />
        )}

        {/* All claimed footer */}
        {allClaimed && (
          <div className="text-center text-xs text-green-400/50 pt-1">
            +{family.claimedReward} CUBE claimed
          </div>
        )}
      </motion.section>
    );
  },
);
FamilyCard.displayName = "FamilyCard";

// ─── Daily Champion panel ───────────────────────────────────────────────────

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
      totalQuests > 0 ? Math.min((totalCompleted / totalQuests) * 100, 100) : 0;
    const claimKey = `${tier.questId}:${tier.intervalId}`;
    const canClaim = tier.completed && !tier.claimed;
    const isClaiming = claimingKey === claimKey;

    return (
      <motion.section
        variants={itemVariants}
        className={`rounded-2xl border p-4 ${
          tier.claimed
            ? "bg-yellow-900/10 border-yellow-400/10"
            : canClaim
              ? "bg-gradient-to-br from-yellow-800/25 via-amber-800/20 to-orange-800/15 border-yellow-400/25"
              : "bg-indigo-900/30 border-yellow-400/10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl flex-shrink-0 ${
                tier.claimed
                  ? "bg-yellow-500/10 text-yellow-400/50"
                  : canClaim
                    ? "bg-yellow-400/20 text-yellow-200"
                    : "bg-yellow-500/10 text-yellow-300"
              }`}
            >
              <Trophy size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`font-['Fredericka_the_Great'] text-xl leading-tight ${
                    tier.claimed ? "text-yellow-400/50" : "text-yellow-50"
                  }`}
                >
                  Daily Champion
                </h2>
                {canClaim && (
                  <span className="text-green-400 font-bold italic text-xs uppercase tracking-wide">
                    DONE!
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  tier.claimed ? "text-yellow-400/30" : "text-yellow-100/70"
                }`}
              >
                Complete all {totalQuests} quests
              </p>
            </div>
          </div>

          <CubeReward amount={tier.reward} claimed={tier.claimed} size="lg" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/25">
            <motion.div
              className={`h-full rounded-full ${
                tier.claimed
                  ? "bg-yellow-600/40"
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
              tier.claimed ? "text-yellow-400/40" : "text-yellow-50"
            }`}
          >
            {totalCompleted}/{totalQuests}
          </span>
        </div>

        {/* Claim */}
        {canClaim && (
          <GameButton
            label={`CLAIM CHAMPION  +${tier.reward} CUBE`}
            variant="primary"
            loading={isClaiming}
            disabled={disabled}
            onClick={() => onClaim(tier.questId, tier.intervalId)}
          />
        )}

        {/* Claimed */}
        {tier.claimed && (
          <div className="text-center text-xs text-yellow-400/40 pt-1">
            Champion reward claimed
          </div>
        )}
      </motion.section>
    );
  },
);
ChampionPanel.displayName = "ChampionPanel";

// ─── Main page ──────────────────────────────────────────────────────────────

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

  const claimableRewards = useMemo(
    () =>
      questFamilies.reduce(
        (sum, f) => sum + (f.claimableTier?.reward ?? 0),
        0,
      ),
    [questFamilies],
  );

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
          {/* ── Summary banner ─────────────────────────────────────── */}
          <motion.section
            variants={itemVariants}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-900/50 via-blue-900/40 to-indigo-900/50 px-4 py-3"
          >
            <div>
              <h1 className="font-['Fredericka_the_Great'] text-xl text-white leading-tight">
                Daily Summary
              </h1>
              <p className="text-xs text-cyan-100/80">
                {allClaimed
                  ? "All done! Come back after reset."
                  : "Complete quests to earn CUBE"}
              </p>
            </div>
            {claimableRewards > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-yellow-500/15 px-3 py-2 border border-yellow-400/20">
                <span className="text-lg">🧊</span>
                <span className="font-['Fredericka_the_Great'] text-xl leading-none tracking-wide text-yellow-200">
                  {claimableRewards}
                </span>
                <span className="text-xs text-yellow-300/80">to claim</span>
              </div>
            )}
          </motion.section>

          {/* ── Loading / error / empty ─────────────────────────── */}
          {status === "loading" && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-indigo-900/20 p-6 text-center"
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
              className="rounded-2xl border border-red-400/20 bg-red-900/20 p-4 text-sm text-red-200"
            >
              Failed to load quests. Reopen the page to retry.
            </motion.section>
          )}

          {status === "success" && questFamilies.length === 0 && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-indigo-900/20 p-4 text-sm text-slate-300"
            >
              No quests available yet.
            </motion.section>
          )}

          {/* ── Daily Champion (top, like meta-quests) ─────────── */}
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

          {/* ── Section label ──────────────────────────────────── */}
          {status === "success" && mainFamilies.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="text-xs uppercase tracking-[0.15em] text-slate-500 px-1"
            >
              Quest Families
            </motion.div>
          )}

          {/* ── Quest family cards ─────────────────────────────── */}
          {status === "success" &&
            mainFamilies.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                onClaim={handleClaim}
                claimingKey={claimingKey}
                disabled={!account}
              />
            ))}

          {/* ── All claimed message ────────────────────────────── */}
          {status === "success" && allClaimed && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-green-400/15 bg-green-900/15 px-4 py-3 text-center text-sm text-green-200/80"
            >
              All daily quests claimed. Come back after reset!
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuestsPage;
