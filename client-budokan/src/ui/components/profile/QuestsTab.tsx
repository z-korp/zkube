import React, { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";

import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import { groupQuests, useQuests, type QuestStatus } from "@/hooks/useQuests";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

interface QuestsTabProps {
  colors: ThemeColors;
}

const QuestsTab: React.FC<QuestsTabProps> = ({ colors }) => {
  const { quests } = useQuests();
  const { daily, weekly, finisher } = groupQuests(quests);
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();
  const [claimingId, setClaimingId] = useState<bigint | null>(null);

  const activeDaily = daily.filter((quest) => quest.active);
  const activeWeekly = weekly.filter((quest) => quest.active);
  const activeFinisher = finisher.filter((quest) => quest.active);

  const handleClaim = useCallback(
    async (quest: QuestStatus) => {
      if (!account?.address || claimingId) return;
      setClaimingId(quest.id);
      try {
        await systemCalls.questClaim({
          account,
          player: account.address,
          quest_id: quest.id,
          interval_id: quest.intervalId,
        });
      } catch (error) {
        console.error("Failed to claim quest:", error);
      } finally {
        setClaimingId(null);
      }
    },
    [account, claimingId, systemCalls],
  );

  const getQuestColor = (quest: QuestStatus): string => {
    if (quest.type === "weekly") return "#B89BFF";
    if (quest.type === "finisher") return "#FF7CA8";
    return colors.accent;
  };

  const combinedDaily = useMemo(() => [...activeDaily, ...activeFinisher], [activeDaily, activeFinisher]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4 pb-2">
      <QuestSection
        colors={colors}
        title="Daily Quests"
        subtitle="Refreshes in a rotating cycle"
        badge="Daily"
        badgeColor={colors.accent}
        quests={combinedDaily}
        getQuestColor={getQuestColor}
        onClaim={handleClaim}
        claimingId={claimingId}
        finisherDividerIndex={activeDaily.length}
      />
      <QuestSection
        colors={colors}
        title="Weekly Quests"
        subtitle="Long-run objectives with bigger rewards"
        badge="Weekly"
        badgeColor="#B89BFF"
        quests={activeWeekly}
        getQuestColor={getQuestColor}
        onClaim={handleClaim}
        claimingId={claimingId}
      />
    </motion.div>
  );
};

interface QuestSectionProps {
  colors: ThemeColors;
  title: string;
  subtitle: string;
  quests: QuestStatus[];
  getQuestColor: (quest: QuestStatus) => string;
  badge: string;
  badgeColor: string;
  onClaim: (quest: QuestStatus) => void;
  claimingId: bigint | null;
  finisherDividerIndex?: number;
}

const QuestSection: React.FC<QuestSectionProps> = ({
  colors,
  title,
  subtitle,
  quests,
  getQuestColor,
  badge,
  badgeColor,
  onClaim,
  claimingId,
  finisherDividerIndex,
}) => {
  const sortedQuests = [...quests].sort((a, b) => {
    const aRank = a.claimed ? 2 : a.completed ? 0 : 1;
    const bRank = b.claimed ? 2 : b.completed ? 0 : 1;
    return aRank - bRank;
  });

  const hasFinisherQuests =
    finisherDividerIndex !== undefined &&
    finisherDividerIndex < quests.length;

  return (
    <motion.section variants={itemVariants} className="rounded-2xl border p-3 backdrop-blur-xl" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.12em]" style={{ color: colors.text }}>
            {title}
          </p>
          <p className="mt-0.5 font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
            {subtitle}
          </p>
        </div>

        <span
          className="rounded-full px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.08em]"
          style={{ color: badgeColor, background: `${badgeColor}22`, border: `1px solid ${badgeColor}55` }}
        >
          {badge}
        </span>
      </div>

      {sortedQuests.length === 0 ? (
        <p className="rounded-xl border border-white/[0.14] bg-white/[0.08] px-3 py-4 text-center font-sans text-sm font-semibold text-white/70">
          No active quests right now.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sortedQuests.map((quest, i) => (
            <React.Fragment key={quest.id}>
              {hasFinisherQuests && quest.type === "finisher" && i > 0 && sortedQuests[i - 1]?.type !== "finisher" && (
                <div className="flex items-center gap-2 py-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wide" style={{ color: "#FF7CA8" }}>
                    Daily Finisher
                  </span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              )}
              <QuestCard
                colors={colors}
                quest={quest}
                color={getQuestColor(quest)}
                onClaim={onClaim}
                claimingId={claimingId}
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </motion.section>
  );
};

interface QuestCardProps {
  colors: ThemeColors;
  quest: QuestStatus;
  color: string;
  onClaim: (quest: QuestStatus) => void;
  claimingId: bigint | null;
}

const QuestCard: React.FC<QuestCardProps> = ({ colors, quest, color, onClaim, claimingId }) => {
  const isClaiming = claimingId === quest.id;
  const progressValue = Math.min(quest.progress, quest.target);

  return (
    <div
      className="rounded-2xl border px-3 py-3 backdrop-blur-xl"
      style={{
        background: quest.claimed
          ? "rgba(255,255,255,0.06)"
          : quest.completed
            ? `${color}18`
            : "rgba(255,255,255,0.11)",
        borderColor: quest.completed ? `${color}4D` : "rgba(255,255,255,0.16)",
        opacity: quest.claimed ? 0.7 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{ background: `${color}22`, borderColor: `${color}55` }}
        >
          <span className="text-lg" style={{ filter: quest.claimed ? "grayscale(1)" : "none" }}>
            {quest.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-sans text-[14px] font-extrabold leading-tight" style={{ color: quest.completed ? color : colors.text }}>
              {quest.name}
            </p>

            {quest.claimed ? (
              <span className="rounded-full px-2 py-1 font-sans text-[10px] font-extrabold uppercase" style={{ color: colors.textMuted, background: "rgba(255,255,255,0.12)" }}>
                Claimed
              </span>
            ) : quest.completed ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => onClaim(quest)}
                disabled={isClaiming}
                className="rounded-full px-3 py-1.5 font-sans text-[10px] font-extrabold uppercase text-[#0a1628] disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  boxShadow: `0 0 12px ${colors.accent}55`,
                }}
              >
                {isClaiming ? "Claiming" : `Claim +${quest.reward}★`}
              </motion.button>
            ) : (
              <span className="font-sans text-[12px] font-extrabold" style={{ color }}>
                +{quest.reward}★
              </span>
            )}
          </div>

          <p className="mt-0.5 font-sans text-[12px] font-semibold" style={{ color: colors.textMuted }}>
            {quest.description}
          </p>

          {!quest.claimed ? (
            <div className="mt-2">
              <ProgressBar value={progressValue} max={quest.target} color={color} height={6} glow={quest.completed} />
              <div className="mt-1 flex items-center justify-between font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                <span>{progressValue}/{quest.target}</span>
                <span>{quest.completed ? "Ready to claim" : "In progress"}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default QuestsTab;
