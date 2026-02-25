import { useCallback, useEffect, useMemo, useState } from "react";
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
import CubeIcon from "@/ui/components/CubeIcon";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import type { QuestFamily, QuestTier } from "@/types/questFamily";
import PageTopBar from "@/ui/navigation/PageTopBar";
import { shortString } from "starknet";

// ─── Constants ──────────────────────────────────────────────────────────────

const CUMULATIVE_FAMILIES = new Set(["player", "clearer"]);

const iconMap: Record<string, LucideIcon> = {
  "fa-gamepad": Gamepad2,
  "fa-bars-staggered": ListOrdered,
  "fa-bolt": Zap,
  "fa-arrow-trend-up": TrendingUp,
  "fa-trophy": Trophy,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// ─── Countdown ──────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/10">
      <Clock3 size={13} className="text-cyan-300" />
      <span className="font-['Fredericka_the_Great'] text-sm leading-none text-cyan-100">
        {formatCountdown(sec)}
      </span>
    </div>
  );
};

// ─── Tier Dots ──────────────────────────────────────────────────────────────
// Small ● ● ○ showing progression through tiers

const TierDots: React.FC<{ tiers: QuestTier[] }> = ({ tiers }) => (
  <div className="flex items-center gap-1">
    {tiers.map((tier) => (
      <div
        key={tier.questId}
        className={`w-2 h-2 rounded-full transition-colors ${
          tier.claimed
            ? "bg-green-400"
            : tier.completed
              ? "bg-yellow-400"
              : "bg-slate-600"
        }`}
      />
    ))}
  </div>
);

// ─── Quest Card ─────────────────────────────────────────────────────────────
// Unified card for ALL quest families. Shows current active tier.
// Cumulative families (player, clearer) get a progress bar.
// Binary families (combo, streak) get a status indicator.

const QuestCard: React.FC<{
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, onClaim, claimingKey, disabled }) => {
  const Icon = iconMap[family.icon] ?? Gamepad2;
  const allClaimed = family.tiers.every((t) => t.claimed);
  const claimable = family.claimableTier;
  const isCumulative = CUMULATIVE_FAMILIES.has(family.id);

  // Show claimable tier if exists, otherwise current active tier
  const activeTierIndex = family.currentTierIndex >= 0
    ? family.currentTierIndex
    : family.tiers.length - 1;
  const activeTier = claimable ?? family.tiers[activeTierIndex];
  if (!activeTier) return null;

  const claimKey = claimable
    ? `${claimable.questId}:${claimable.intervalId}`
    : "";
  const isClaiming = claimable !== null && claimingKey === claimKey;

  // Progress for cumulative families
  const progressPercent =
    isCumulative && family.nextTarget > 0
      ? Math.min((family.progress / family.nextTarget) * 100, 100)
      : 0;

  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-xl p-4 transition-colors ${
        allClaimed
          ? "bg-slate-900/50"
          : claimable
            ? "bg-slate-900 ring-1 ring-green-500/30"
            : "bg-slate-900"
      }`}
    >
      {/* Header: icon, name, tier dots, reward */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`grid h-8 w-8 place-items-center rounded-lg flex-shrink-0 ${
              allClaimed
                ? "bg-green-500/10 text-green-400/50"
                : claimable
                  ? "bg-green-500/15 text-green-300"
                  : "bg-white/8 text-cyan-300"
            }`}
          >
            {allClaimed ? <Check size={16} /> : <Icon size={16} />}
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-base leading-tight truncate ${
              allClaimed ? "text-slate-500" : "text-white"
            }`}
          >
            {family.name}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <TierDots tiers={family.tiers} />
          <span
            className={`inline-flex items-center gap-0.5 ${
              allClaimed ? "opacity-35" : ""
            }`}
          >
            <CubeIcon size="xs" />
            <span className="font-['Fredericka_the_Great'] text-sm text-yellow-200">
              {activeTier.reward}
            </span>
          </span>
        </div>
      </div>

      {/* Description */}
      {!allClaimed && (
        <p
          className={`text-sm mb-2.5 ${
            claimable ? "text-green-200" : "text-slate-400"
          }`}
        >
          {activeTier.description || activeTier.name}
        </p>
      )}

      {/* Progress / status */}
      {allClaimed ? (
        <p className="text-xs text-green-400/50">All tiers completed</p>
      ) : isCumulative ? (
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                claimable
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : "bg-gradient-to-r from-cyan-400 to-blue-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span
            className={`font-['Fredericka_the_Great'] text-sm leading-none min-w-fit ${
              claimable ? "text-green-200" : "text-slate-300"
            }`}
          >
            {family.progress}/{family.nextTarget}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {activeTier.completed ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-sm text-green-300">Achieved!</span>
            </>
          ) : (
            <span className="text-sm text-slate-500">Not yet achieved</span>
          )}
        </div>
      )}

      {/* Claim button */}
      {claimable && (
        <button
          onClick={() => onClaim(claimable.questId, claimable.intervalId)}
          disabled={isClaiming || disabled}
          className="w-full mt-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 active:from-green-600 active:to-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isClaiming ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>Claim <CubeIcon size="xs" /> {claimable.reward}</>
          )}
        </button>
      )}
    </motion.div>
  );
};

// ─── Champion Card ──────────────────────────────────────────────────────────
// Special treatment for the "complete all quests" finisher family.

const ChampionCard: React.FC<{
  family: QuestFamily;
  totalCompleted: number;
  totalQuests: number;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}> = ({ family, totalCompleted, totalQuests, onClaim, claimingKey, disabled }) => {
  const tier = family.tiers[0];
  if (!tier) return null;

  const progressPercent =
    totalQuests > 0
      ? Math.min((totalCompleted / totalQuests) * 100, 100)
      : 0;
  const canClaim = tier.completed && !tier.claimed;
  const claimKey = `${tier.questId}:${tier.intervalId}`;
  const isClaiming = claimingKey === claimKey;

  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-xl p-4 ${
        tier.claimed
          ? "bg-slate-900/50"
          : canClaim
            ? "bg-gradient-to-br from-yellow-950/60 to-amber-950/40 ring-1 ring-yellow-500/25"
            : "bg-slate-900 ring-1 ring-yellow-500/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
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
            <Trophy size={18} />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-['Fredericka_the_Great'] text-lg leading-tight block ${
                tier.claimed ? "text-yellow-400/40" : "text-yellow-50"
              }`}
            >
              Daily Champion
            </span>
            <span
              className={`text-xs ${
                tier.claimed ? "text-slate-600" : "text-slate-400"
              }`}
            >
              Complete all {totalQuests} quests
            </span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-0.5 flex-shrink-0 ${
            tier.claimed ? "opacity-35" : ""
          }`}
        >
          <CubeIcon size="sm" />
          <span className="font-['Fredericka_the_Great'] text-base text-yellow-200">
            {tier.reward}
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2.5">
        <div className="h-2 flex-1 rounded-full bg-black/30 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              tier.claimed
                ? "bg-yellow-600/30"
                : canClaim
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : "bg-gradient-to-r from-yellow-400 to-amber-300"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span
          className={`font-['Fredericka_the_Great'] text-base leading-none min-w-fit ${
            tier.claimed ? "text-yellow-400/35" : "text-yellow-50"
          }`}
        >
          {totalCompleted}/{totalQuests}
        </span>
      </div>

      {/* Claim */}
      {canClaim && (
        <button
          onClick={() => onClaim(tier.questId, tier.intervalId)}
          disabled={isClaiming || disabled}
          className="w-full mt-3 py-2.5 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isClaiming ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>CLAIM CHAMPION <CubeIcon size="xs" /> {tier.reward}</>
          )}
        </button>
      )}

      {tier.claimed && (
        <p className="text-center text-xs text-yellow-400/35 mt-2">
          Champion reward claimed ✓
        </p>
      )}
    </motion.div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

const QuestsPage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
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

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="DAILY QUESTS"
        onBack={goBack}
        rightSlot={<CountdownPill />}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-[600px] flex-col gap-3 pb-8"
        >
          {/* Loading */}
          {status === "loading" && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900 p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading daily quests…</span>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {status === "error" && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-red-950/60 border border-red-400/20 p-4 text-sm text-red-200"
            >
              Failed to load quests. Reopen the page to retry.
            </motion.div>
          )}

          {/* Empty */}
          {status === "success" && questFamilies.length === 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900 p-4 text-sm text-slate-400 text-center"
            >
              No quests available yet.
            </motion.div>
          )}

          {/* Champion */}
          {status === "success" && finisherFamily && (
            <ChampionCard
              family={finisherFamily}
              totalCompleted={totals.totalCompleted}
              totalQuests={totals.totalQuests}
              onClaim={handleClaim}
              claimingKey={claimingKey}
              disabled={!account}
            />
          )}

          {/* Quest families */}
          {status === "success" &&
            mainFamilies.map((family) => (
              <QuestCard
                key={family.id}
                family={family}
                onClaim={handleClaim}
                claimingKey={claimingKey}
                disabled={!account}
              />
            ))}

          {/* All done */}
          {status === "success" && allClaimed && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-green-950/40 ring-1 ring-green-500/15 px-4 py-3 text-center text-sm text-green-300/70"
            >
              All daily quests claimed — come back after reset!
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuestsPage;
