import { useMemo } from "react";
import { motion } from "motion/react";

import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import { ACHIEVEMENT_CATEGORIES, useAchievements, type AchievementStatus } from "@/hooks/useAchievements";

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

interface AchievementsTabProps {
  colors: ThemeColors;
}

const TIER_LABELS = ["I", "II", "III", "IV"] as const;

const RARITY_BY_TIER = {
  1: "Common",
  2: "Rare",
  3: "Epic",
  4: "Legendary",
} as const;

const RARITY_COLORS = {
  Common: "#B0B8C4",
  Rare: "#7FC3FF",
  Epic: "#B89BFF",
  Legendary: "#FFD86E",
} as const;

const AchievementsTab: React.FC<AchievementsTabProps> = ({ colors }) => {
  const { achievements } = useAchievements();

  const totalUnlocked = achievements.filter((a) => a.completed).length;
  const total = achievements.length;
  const completionRatio = total <= 0 ? 0 : totalUnlocked / total;
  const completionPercent = Math.round(completionRatio * 100);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - completionRatio);

  // Group achievements by category, sorted by tier
  const grouped = useMemo(() => {
    return ACHIEVEMENT_CATEGORIES.map((category) => {
      const tiers = achievements
        .filter((a) => a.category === category)
        .sort((a, b) => a.tier - b.tier);
      // Current tier = first non-completed, or last if all done
      const currentIdx = tiers.findIndex((a) => !a.completed);
      const activeTier = currentIdx >= 0 ? currentIdx : tiers.length - 1;
      return { category, tiers, activeTier };
    });
  }, [achievements]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5 pb-2">
      {/* Summary ring */}
      <motion.section
        variants={itemVariants}
        className="rounded-2xl border px-4 py-3.5 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.18)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 84 84" aria-hidden>
              <circle cx="42" cy="42" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="8" />
              <circle
                cx="42"
                cy="42"
                r={radius}
                fill="none"
                stroke={colors.accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-sans text-[20px] font-black leading-none" style={{ color: colors.text }}>
                {completionPercent}%
              </p>
              <p className="font-sans text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                complete
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-sans text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
              Achievement Vault
            </p>
            <p className="mt-1 font-sans text-[20px] font-extrabold leading-tight" style={{ color: colors.text }}>
              {totalUnlocked}/{total} unlocked
            </p>
          </div>
        </div>
      </motion.section>

      {/* Category rows */}
      {grouped.map(({ category, tiers, activeTier }) => {
        const active = tiers[activeTier];
        if (!active) return null;
        const allDone = tiers.every((t) => t.completed);

        return (
          <motion.section
            variants={itemVariants}
            key={category}
            className="rounded-2xl border p-3 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}
          >
            {/* Header: icon + name + tier pills */}
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{active.icon}</span>
              <p className="font-sans text-[13px] font-extrabold" style={{ color: colors.text }}>
                {category}
              </p>
              <div className="ml-auto flex gap-1">
                {tiers.map((tier, i) => {
                  const rarity = RARITY_BY_TIER[tier.tier];
                  const rc = RARITY_COLORS[rarity];
                  const done = tier.completed;
                  const isCurrent = i === activeTier && !allDone;
                  return (
                    <span
                      key={tier.tier}
                      className="flex h-[22px] min-w-[26px] items-center justify-center rounded-full px-1.5 font-sans text-[10px] font-extrabold"
                      style={{
                        background: done ? `${rc}30` : isCurrent ? `${rc}18` : "rgba(255,255,255,0.06)",
                        border: `1.5px solid ${done ? rc : isCurrent ? `${rc}60` : "rgba(255,255,255,0.12)"}`,
                        color: done ? rc : isCurrent ? `${rc}BB` : "rgba(255,255,255,0.25)",
                      }}
                    >
                      {TIER_LABELS[i]}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Active tier details */}
            {allDone ? (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase tracking-[0.08em] text-emerald-200">
                  All tiers complete
                </span>
                <span className="font-sans text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                  +{tiers.reduce((s, t) => s + t.xp, 0)} XP earned
                </span>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-baseline justify-between">
                  <p className="font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                    {active.description}
                  </p>
                  <p className="font-sans text-[11px] font-bold tabular-nums" style={{ color: colors.textMuted }}>
                    {Math.min(active.progress, active.target)}/{active.target}
                  </p>
                </div>
                <div className="mt-1">
                  <ProgressBar
                    value={Math.min(active.progress, active.target)}
                    max={active.target}
                    color={RARITY_COLORS[RARITY_BY_TIER[active.tier]]}
                    height={5}
                  />
                </div>
              </div>
            )}
          </motion.section>
        );
      })}
    </motion.div>
  );
};

export default AchievementsTab;
