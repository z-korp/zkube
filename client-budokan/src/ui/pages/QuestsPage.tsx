import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Circle,
  CircleCheck,
  Clock3,
  Gamepad2,
  ListOrdered,
  Loader2,
  Lock,
  ScrollText,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useQuests } from "@/contexts/quests";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import type { QuestFamily, QuestTier } from "@/types/questFamily";
import GameButton from "@/ui/components/shared/GameButton";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import PageTopBar from "@/ui/navigation/PageTopBar";
import { shortString } from "starknet";

const iconMap: Record<string, LucideIcon> = {
  "fa-gamepad": Gamepad2,
  "fa-bars-staggered": ListOrdered,
  "fa-bolt": Zap,
  "fa-trophy": Trophy,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

const secondsUntilNextUtcMidnight = (): number => {
  const now = new Date();
  const nextUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(0, Math.floor((nextUtcMidnight - now.getTime()) / 1000));
};

const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${secs}`;
};

interface TierRowProps {
  tier: QuestTier;
}

const TierRow: React.FC<TierRowProps> = ({ tier }) => {
  let icon: React.ReactNode = <Circle size={13} className="text-slate-400" />;
  let textClass = "text-slate-200";

  if (tier.claimed) {
    icon = <CircleCheck size={13} className="text-emerald-400" />;
    textClass = "text-slate-400 line-through";
  } else if (tier.completed) {
    icon = <CircleCheck size={13} className="text-emerald-400" />;
    textClass = "text-emerald-300";
  } else if (tier.locked) {
    icon = <Lock size={13} className="text-slate-500" />;
    textClass = "text-slate-500";
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <span className={`truncate text-sm ${textClass}`}>
          Tier {tier.tier}: {tier.description || tier.name}
        </span>
      </div>
      <span className="font-['Bangers'] text-lg leading-none tracking-wide text-yellow-300">
        +{tier.reward}
      </span>
    </div>
  );
};

interface QuestFamilyPanelProps {
  family: QuestFamily;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const QuestFamilyPanel: React.FC<QuestFamilyPanelProps> = ({
  family,
  onClaim,
  claimingKey,
  disabled,
}) => {
  const Icon = iconMap[family.icon] ?? ScrollText;
  const completedTiers = family.tiers.filter((tier) => tier.completed).length;
  const tierProgress =
    family.totalTiers > 0 ? (completedTiers / family.totalTiers) * 100 : 0;
  const progressPercent =
    family.nextTarget > 0
      ? Math.min((family.progress / family.nextTarget) * 100, 100)
      : 100;

  const claimableTier = family.claimableTier;
  const claimKey = claimableTier
    ? `${claimableTier.questId}:${claimableTier.intervalId}`
    : "";
  const isClaiming = claimableTier !== null && claimingKey === claimKey;

  return (
    <motion.section
      variants={itemVariants}
      className="rounded-2xl border border-white/10 bg-slate-900/65 p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-yellow-300">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-['Fredericka_the_Great'] text-xl text-white">
              {family.name}
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300/80">
              Tier {Math.min(family.currentTierIndex + 1, family.totalTiers)} / {family.totalTiers}
            </p>
          </div>
        </div>
        <span className="font-['Bangers'] text-2xl leading-none tracking-wide text-cyan-200">
          {completedTiers}/{family.totalTiers}
        </span>
      </div>

      <div className="mb-3 space-y-2">
        {family.tiers.map((tier) => (
          <TierRow key={tier.questId} tier={tier} />
        ))}
      </div>

      <div className="mb-2 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-700/80">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-300"
            initial={{ width: 0 }}
            animate={{ width: `${tierProgress}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
        <span className="font-['Bangers'] text-xl leading-none tracking-wide text-cyan-100">
          {Math.round(tierProgress)}%
        </span>
      </div>

      {family.nextTarget > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-300"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.06 }}
            />
          </div>
          <span className="font-['Bangers'] text-lg leading-none tracking-wide text-yellow-200">
            {family.progress}/{family.nextTarget}
          </span>
        </div>
      )}

      {claimableTier ? (
        <GameButton
          label={`CLAIM TIER ${claimableTier.tier}  +${claimableTier.reward} CUBE`}
          variant="primary"
          loading={isClaiming}
          disabled={disabled}
          onClick={() => onClaim(claimableTier.questId, claimableTier.intervalId)}
        />
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-center text-sm text-slate-300">
          {family.tiers.every((tier) => tier.claimed)
            ? "All rewards claimed"
            : "Complete the next tier to unlock reward"}
        </div>
      )}
    </motion.section>
  );
};

interface ChampionPanelProps {
  family: QuestFamily;
  totalCompleted: number;
  totalQuests: number;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  claimingKey: string | null;
  disabled: boolean;
}

const ChampionPanel: React.FC<ChampionPanelProps> = ({
  family,
  totalCompleted,
  totalQuests,
  onClaim,
  claimingKey,
  disabled,
}) => {
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
      className="rounded-2xl border border-yellow-300/30 bg-gradient-to-br from-yellow-700/20 via-amber-700/15 to-orange-700/20 p-4 backdrop-blur-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-yellow-200/20 text-yellow-200">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="font-['Fredericka_the_Great'] text-xl text-yellow-50">
              Daily Champion
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] text-yellow-100/80">
              Complete all 9 quests
            </p>
          </div>
        </div>
        <span className="font-['Bangers'] text-2xl leading-none tracking-wide text-yellow-100">
          +{tier.reward}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/25">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-100"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        </div>
        <span className="font-['Bangers'] text-xl leading-none tracking-wide text-yellow-50">
          {totalCompleted}/{totalQuests}
        </span>
      </div>

      {canClaim ? (
        <GameButton
          label={`CLAIM CHAMPION  +${tier.reward} CUBE`}
          variant="primary"
          loading={isClaiming}
          disabled={disabled}
          onClick={() => onClaim(tier.questId, tier.intervalId)}
        />
      ) : (
        <div className="rounded-xl border border-yellow-100/20 bg-black/20 px-4 py-3 text-center text-sm text-yellow-50/90">
          {tier.claimed ? "Champion reward claimed" : "Finish all family tiers to unlock"}
        </div>
      )}
    </motion.section>
  );
};

const QuestsPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const { account } = useAccountCustom();
  const { questFamilies, status } = useQuests();
  const {
    setup: { systemCalls },
  } = useDojo();

  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [resetInSeconds, setResetInSeconds] = useState<number>(() =>
    secondsUntilNextUtcMidnight(),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setResetInSeconds(secondsUntilNextUtcMidnight());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const { mainFamilies, finisherFamily } = useMemo(() => {
    const main = questFamilies.filter((family) => family.id !== "finisher");
    const finisher = questFamilies.find((family) => family.id === "finisher");
    return { mainFamilies: main, finisherFamily: finisher };
  }, [questFamilies]);

  const claimableRewards = useMemo(
    () =>
      questFamilies.reduce(
        (sum, family) => sum + (family.claimableTier?.reward ?? 0),
        0,
      ),
    [questFamilies],
  );

  const totals = useMemo(() => {
    const totalQuests = mainFamilies.reduce(
      (sum, family) => sum + family.totalTiers,
      0,
    );
    const totalCompleted = mainFamilies.reduce(
      (sum, family) => sum + family.tiers.filter((tier) => tier.completed).length,
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
      } finally {
        setClaimingKey(null);
      }
    },
    [account, systemCalls],
  );

  const allClaimed =
    questFamilies.length > 0 &&
    questFamilies.every((family) => family.tiers.every((tier) => tier.claimed));

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <PageTopBar title="DAILY QUESTS" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-[680px] flex-col gap-4 pb-8"
        >
          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-900/45 via-blue-900/35 to-slate-900/65 p-4 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="font-['Fredericka_the_Great'] text-2xl text-white">
                  Daily Summary
                </h1>
                <p className="text-sm text-cyan-100/90">
                  Claim rewards before reset.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/85">
                  Claimable
                </p>
                <p className="font-['Bangers'] text-3xl leading-none tracking-wide text-yellow-200">
                  {claimableRewards} CUBE
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-cyan-50/95">
              <Clock3 size={15} className="text-cyan-200" />
              <span>Resets at midnight UTC:</span>
              <span className="font-['Bangers'] text-xl leading-none tracking-wide text-cyan-100">
                {formatCountdown(resetInSeconds)}
              </span>
            </div>
          </motion.section>

          {status === "loading" && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center"
            >
              <div className="mb-2 flex items-center justify-center gap-2 text-slate-100">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading daily quests...</span>
              </div>
            </motion.section>
          )}

          {status === "error" && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-red-300/30 bg-red-900/20 p-4 text-sm text-red-100"
            >
              Failed to load quests. Reopen the page to retry.
            </motion.section>
          )}

          {status === "success" && questFamilies.length === 0 && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200"
            >
              No quests available yet.
            </motion.section>
          )}

          {status === "success" &&
            mainFamilies.map((family) => (
              <QuestFamilyPanel
                key={family.id}
                family={family}
                onClaim={handleClaim}
                claimingKey={claimingKey}
                disabled={!account}
              />
            ))}

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

          {status === "success" && allClaimed && (
            <motion.section
              variants={itemVariants}
              className="rounded-2xl border border-emerald-300/25 bg-emerald-900/20 p-4 text-center text-emerald-100"
            >
              All daily quests claimed. Come back after reset.
            </motion.section>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default QuestsPage;
