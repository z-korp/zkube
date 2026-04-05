import { useState, useCallback } from "react";
import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import type { ZoneProgressData } from "@/config/profileData";
import { groupQuests, useQuests, type QuestStatus } from "@/hooks/useQuests";
import { motion } from "motion/react";
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
  nextLockedZone: ZoneProgressData | null;
  onUnlock: (zone: ZoneProgressData) => void;
}

const formatPrice = (price: bigint | undefined): number => {
  if (price === undefined) return 0;
  return Number(price) / 1e6;
};

const QuestsTab: React.FC<QuestsTabProps> = ({ colors, nextLockedZone, onUnlock }) => {
  const { quests } = useQuests();
  const { daily, weekly, finisher } = groupQuests(quests);
  const activeDaily = daily.filter((quest) => quest.active);
  const activeWeekly = weekly.filter((quest) => quest.active);
  const { account } = useAccountCustom();
  const { setup: { systemCalls } } = useDojo();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = useCallback(async (quest: QuestStatus) => {
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
  }, [account, systemCalls, claimingId]);

  const getQuestColor = (quest: QuestStatus): string => {
    if (quest.type === "weekly") return "#A78BFA";
    if (quest.type === "finisher") return "#FF6B8A";
    return colors.accent;
  };

  const discount = nextLockedZone?.starCost
    ? Math.min(100, Math.floor(((nextLockedZone.currentStars ?? 0) / nextLockedZone.starCost) * 100))
    : 0;
  const basePrice = formatPrice(nextLockedZone?.price);
  const discountedPrice = basePrice
    ? (basePrice * (1 - discount / 100)).toFixed(2)
    : "0.00";

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5 pb-2">
      {nextLockedZone && (
        <motion.button
          variants={itemVariants}
          type="button"
          onClick={() => onUnlock(nextLockedZone)}
          className="w-full rounded-[14px] border px-3 py-3 text-left"
          style={{
            background: `linear-gradient(135deg, ${colors.accent2}14, ${colors.accent}10)`,
            borderColor: `${colors.accent2}44`,
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[22px]">{nextLockedZone.emoji}</span>
            <div className="flex-1">
              <p
                className="font-sans text-[8px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: colors.accent2 }}
              >
                Next Unlock
              </p>
              <p className="font-sans text-[15px] font-extrabold" style={{ color: colors.text }}>
                {nextLockedZone.name}
              </p>
            </div>
          </div>

          <div className="mb-2 flex gap-1.5">
            <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: `${colors.accent2}1A` }}>
              <p className="font-sans text-[7px] font-semibold" style={{ color: colors.accent2 }}>
                ★ EARN IT
              </p>
              <ProgressBar
                value={nextLockedZone.currentStars ?? 0}
                max={nextLockedZone.starCost ?? 1}
                color={colors.accent2}
                height={4}
                glow
              />
              <p className="mt-0.5 font-sans text-[10px] font-bold" style={{ color: colors.text }}>
                {nextLockedZone.currentStars}/{nextLockedZone.starCost}★
              </p>
              <p className="font-sans text-[7px]" style={{ color: colors.textMuted }}>
                {(nextLockedZone.starCost ?? 0) - (nextLockedZone.currentStars ?? 0)} stars to go
              </p>
            </div>

            <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: `${colors.accent}1A` }}>
              <p className="font-sans text-[7px] font-semibold" style={{ color: colors.accent }}>
                ◆ SKIP AHEAD
              </p>
              <p className="font-sans text-[15px] font-black" style={{ color: colors.accent }}>
                {discountedPrice} USDC
              </p>
              {discount > 0 && (
                <div className="mt-0.5 flex items-center gap-1">
                  <span
                    className="font-sans text-[10px] font-semibold"
                    style={{ color: colors.textMuted, textDecoration: "line-through" }}
                  >
                    {basePrice.toFixed(2)}
                  </span>
                  <span className="rounded px-1 py-[1px] font-sans text-[8px] font-bold" style={{ color: "#FF6B8A", background: "rgba(255,107,138,0.2)" }}>
                    {discount}% OFF
                  </span>
                </div>
              )}
              <p className="font-sans text-[7px]" style={{ color: colors.textMuted }}>
                Stars lower the price
              </p>
            </div>
          </div>

          <p className="text-center font-sans text-[10px] font-bold" style={{ color: colors.accent }}>
            Tap for details →
          </p>
        </motion.button>
      )}

        <QuestSection colors={colors} title="Daily Quests" badge="Rotating" badgeColor={colors.accent} quests={activeDaily} getQuestColor={getQuestColor} compact onClaim={handleClaim} claimingId={claimingId} />
        <QuestSection colors={colors} title="Weekly Quests" badge="Weekly" badgeColor="#A78BFA" quests={activeWeekly} getQuestColor={getQuestColor} compact onClaim={handleClaim} claimingId={claimingId} />
        <QuestSection colors={colors} title="Daily Finisher" quests={finisher} getQuestColor={getQuestColor} onClaim={handleClaim} claimingId={claimingId} />
    </motion.div>
  );
};

interface QuestSectionProps {
  colors: ThemeColors;
  title: string;
  quests: QuestStatus[];
  getQuestColor: (quest: QuestStatus) => string;
  badge?: string;
  badgeColor?: string;
  compact?: boolean;
  onClaim?: (quest: QuestStatus) => void;
  claimingId?: string | null;
}

const QuestSection: React.FC<QuestSectionProps> = ({
  colors,
  title,
  quests,
  getQuestColor,
  badge,
  badgeColor,
  compact = false,
  onClaim,
  claimingId,
}) => (
  <motion.section variants={itemVariants}>
    <div className="mb-2 flex items-center justify-between">
      <p
        className="font-sans text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: colors.textMuted }}
      >
        {title}
      </p>
      {badge && (
        <span
          className="rounded px-1.5 py-0.5 font-sans text-[8px] font-semibold"
          style={{
            color: badgeColor,
            background: `${badgeColor}1A`,
            border: `1px solid ${badgeColor}33`,
          }}
        >
          {badge}
        </span>
      )}
    </div>

    <div className="flex flex-col gap-1.5">
      {quests.map((quest) => (
        <QuestCard key={quest.id} colors={colors} quest={quest} color={getQuestColor(quest)} compact={compact} onClaim={onClaim} claimingId={claimingId} />
      ))}
    </div>
  </motion.section>
);

interface QuestCardProps {
  colors: ThemeColors;
  quest: QuestStatus;
  color: string;
  compact: boolean;
  onClaim?: (quest: QuestStatus) => void;
  claimingId?: string | null;
}

const QuestCard: React.FC<QuestCardProps> = ({ colors, quest, color, compact, onClaim, claimingId }) => {
  const isClaiming = claimingId === quest.id;

  return (
    <div
      className="rounded-[10px]"
      style={{
        background: quest.completed ? `${color}14` : colors.surface,
        border: `1px solid ${quest.completed ? `${color}40` : colors.border}`,
        padding: compact ? "8px 10px" : "10px 12px",
        opacity: quest.claimed ? 0.72 : 1,
      }}
    >
      <div className="flex items-start gap-2">
        <span className={compact ? "text-base" : "text-lg"}>{quest.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p
              className="font-sans text-[12px] font-bold"
              style={{ color: quest.completed ? color : colors.text, textDecoration: quest.claimed ? "line-through" : "none" }}
            >
              {quest.name}
            </p>
            {quest.claimed ? (
              <span
                className="rounded px-1.5 py-[1px] font-sans text-[8px] font-bold"
                style={{ color: colors.accent, background: `${colors.accent}20` }}
              >
                CLAIMED
              </span>
            ) : quest.completed && onClaim ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onClaim(quest)}
                disabled={isClaiming}
                className="rounded-md px-2.5 py-1 font-sans text-[10px] font-bold text-white disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  boxShadow: `0 0 8px ${colors.accent}40`,
                }}
              >
                {isClaiming ? "..." : `CLAIM +${quest.reward}★`}
              </motion.button>
            ) : (
              <span className="font-sans text-[10px] font-bold" style={{ color: colors.accent2 }}>
                +{quest.reward}★
              </span>
            )}
          </div>
          <p className="mb-1 mt-0.5 font-sans text-[9px]" style={{ color: colors.textMuted }}>
            {quest.description}
          </p>
          {!quest.claimed && <ProgressBar value={quest.progress} max={quest.target} color={color} height={4} showLabel />}
        </div>
      </div>
    </div>
  );
};

export default QuestsTab;
