import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import {
  QUEST_DEFS,
  type QuestDef,
  type ZoneProgressData,
} from "@/config/profileData";

interface QuestsTabProps {
  colors: ThemeColors;
  nextLockedZone: ZoneProgressData | null;
  onUnlock: (zone: ZoneProgressData) => void;
}

const formatPrice = (price: bigint | undefined): number => {
  if (price === undefined) return 0;
  return Number(price) / 1e18;
};

const QuestsTab: React.FC<QuestsTabProps> = ({ colors, nextLockedZone, onUnlock }) => {
  const daily = QUEST_DEFS.filter((quest) => quest.category === "daily");
  const weekly = QUEST_DEFS.filter((quest) => quest.category === "weekly");
  const milestones = QUEST_DEFS.filter((quest) => quest.category === "milestone");

  const getQuestColor = (quest: QuestDef): string => {
    if (quest.color === "accent2") return colors.accent2;
    if (quest.color === "accent3") return "#FF6B8A";
    if (quest.color === "accent4") return "#A78BFA";
    return colors.accent;
  };

  const discount = nextLockedZone?.starCost
    ? Math.min(100, Math.floor(((nextLockedZone.currentStars ?? 0) / nextLockedZone.starCost) * 100))
    : 0;
  const basePrice = formatPrice(nextLockedZone?.price);
  const discountedPrice = basePrice
    ? (basePrice * (1 - discount / 100)).toFixed(4)
    : "0.0000";

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      {nextLockedZone && (
        <button
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
                className="font-['DM_Sans'] text-[8px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: colors.accent2 }}
              >
                Next Unlock
              </p>
              <p className="font-display text-[13px] font-extrabold" style={{ color: colors.text }}>
                {nextLockedZone.name}
              </p>
            </div>
          </div>

          <div className="mb-2 flex gap-1.5">
            <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: `${colors.accent2}1A` }}>
              <p className="font-['DM_Sans'] text-[7px] font-semibold" style={{ color: colors.accent2 }}>
                ★ EARN IT
              </p>
              <ProgressBar
                value={nextLockedZone.currentStars ?? 0}
                max={nextLockedZone.starCost ?? 1}
                color={colors.accent2}
                height={4}
                glow
              />
              <p className="mt-0.5 font-display text-[8px] font-bold" style={{ color: colors.text }}>
                {nextLockedZone.currentStars}/{nextLockedZone.starCost}★
              </p>
              <p className="font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
                {(nextLockedZone.starCost ?? 0) - (nextLockedZone.currentStars ?? 0)} stars to go
              </p>
            </div>

            <div className="flex-1 rounded-lg px-2 py-1.5" style={{ background: `${colors.accent}1A` }}>
              <p className="font-['DM_Sans'] text-[7px] font-semibold" style={{ color: colors.accent }}>
                ◆ SKIP AHEAD
              </p>
              <p className="font-display text-[13px] font-black" style={{ color: colors.accent }}>
                {discountedPrice} ETH
              </p>
              {discount > 0 && (
                <div className="mt-0.5 flex items-center gap-1">
                  <span
                    className="font-display text-[8px]"
                    style={{ color: colors.textMuted, textDecoration: "line-through" }}
                  >
                    {basePrice.toFixed(4)}
                  </span>
                  <span
                    className="rounded px-1 py-[1px] font-display text-[7px] font-bold"
                    style={{ color: "#FF6B8A", background: "rgba(255,107,138,0.2)" }}
                  >
                    {discount}% OFF
                  </span>
                </div>
              )}
              <p className="font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
                Stars lower the price
              </p>
            </div>
          </div>

          <p className="text-center font-['DM_Sans'] text-[8px] font-semibold" style={{ color: colors.accent }}>
            Tap for details →
          </p>
        </button>
      )}

      <QuestSection colors={colors} title="Daily Quests" badge="Resets in 14:23" badgeColor={colors.accent} quests={daily} getQuestColor={getQuestColor} compact />
      <QuestSection colors={colors} title="Weekly Quests" badge="4 days left" badgeColor="#A78BFA" quests={weekly} getQuestColor={getQuestColor} compact />
      <QuestSection colors={colors} title="Milestones" quests={milestones} getQuestColor={getQuestColor} />
    </div>
  );
};

interface QuestSectionProps {
  colors: ThemeColors;
  title: string;
  quests: QuestDef[];
  getQuestColor: (quest: QuestDef) => string;
  badge?: string;
  badgeColor?: string;
  compact?: boolean;
}

const QuestSection: React.FC<QuestSectionProps> = ({
  colors,
  title,
  quests,
  getQuestColor,
  badge,
  badgeColor,
  compact = false,
}) => (
  <section>
    <div className="mb-2 flex items-center justify-between">
      <p
        className="font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.15em]"
        style={{ color: colors.textMuted }}
      >
        {title}
      </p>
      {badge && (
        <span
          className="rounded px-1.5 py-0.5 font-['DM_Sans'] text-[8px] font-semibold"
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
        <QuestCard key={quest.id} colors={colors} quest={quest} color={getQuestColor(quest)} compact={compact} />
      ))}
    </div>
  </section>
);

interface QuestCardProps {
  colors: ThemeColors;
  quest: QuestDef;
  color: string;
  compact: boolean;
}

const QuestCard: React.FC<QuestCardProps> = ({ colors, quest, color, compact }) => (
  <div
    className="rounded-[10px]"
    style={{
      background: quest.done ? `${color}14` : colors.surface,
      border: `1px solid ${quest.done ? `${color}40` : colors.border}`,
      padding: compact ? "8px 10px" : "10px 12px",
      opacity: quest.done ? 0.72 : 1,
    }}
  >
    <div className="flex items-start gap-2">
      <span className={compact ? "text-base" : "text-lg"}>{quest.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p
            className="font-display text-[11px] font-bold"
            style={{ color: quest.done ? color : colors.text, textDecoration: quest.done ? "line-through" : "none" }}
          >
            {quest.title}
          </p>
          {quest.done ? (
            <span
              className="rounded px-1.5 py-[1px] font-['DM_Sans'] text-[8px] font-bold"
              style={{ color: colors.accent, background: `${colors.accent}20` }}
            >
              CLAIMED
            </span>
          ) : (
            <span className="font-display text-[9px] font-bold" style={{ color: colors.accent2 }}>
              +{quest.reward}★
            </span>
          )}
        </div>
        <p className="mb-1 mt-0.5 font-['DM_Sans'] text-[9px]" style={{ color: colors.textMuted }}>
          {quest.desc}
        </p>
        {!quest.done && <ProgressBar value={quest.progress} max={quest.max} color={color} height={4} showLabel />}
      </div>
    </div>
  </div>
);

export default QuestsTab;
