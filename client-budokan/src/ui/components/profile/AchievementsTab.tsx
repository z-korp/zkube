import { motion } from "motion/react";

import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import { ACHIEVEMENT_CATEGORIES, useAchievements } from "@/hooks/useAchievements";

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

const RARITY_BY_TIER = {
  1: "Common",
  2: "Rare",
  3: "Epic",
  4: "Legendary",
} as const;

const RARITY_COLORS = {
  Common: "rgba(255,255,255,0.7)",
  Rare: "#7FC3FF",
  Epic: "#B89BFF",
  Legendary: "#FFD86E",
} as const;

const AchievementsTab: React.FC<AchievementsTabProps> = ({ colors }) => {
  const { achievements } = useAchievements();

  const totalUnlocked = achievements.filter((achievement) => achievement.completed).length;
  const total = achievements.length;
  const completionRatio = total <= 0 ? 0 : totalUnlocked / total;
  const completionPercent = Math.round(completionRatio * 100);

  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - completionRatio);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5 pb-2">
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
            <p className="mt-0.5 font-sans text-[12px] font-semibold" style={{ color: colors.textMuted }}>
              Finish categories to level up your player title faster.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(RARITY_COLORS) as Array<keyof typeof RARITY_COLORS>).map((rarity) => {
            const count = achievements.filter(
              (achievement) => achievement.completed && RARITY_BY_TIER[achievement.tier] === rarity,
            ).length;

            return (
              <span
                key={rarity}
                className="rounded-full border px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.08em]"
                style={{ color: RARITY_COLORS[rarity], borderColor: `${RARITY_COLORS[rarity]}66`, background: `${RARITY_COLORS[rarity]}1A` }}
              >
                {rarity} {count}
              </span>
            );
          })}
        </div>
      </motion.section>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const categoryAchievements = achievements.filter((achievement) => achievement.category === category);
        const unlocked = categoryAchievements.filter((achievement) => achievement.completed).length;

        return (
          <motion.section
            variants={itemVariants}
            key={category}
            className="rounded-2xl border p-3 backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.12em]" style={{ color: colors.text }}>
                {category}
              </p>
              <p className="font-sans text-[11px] font-bold" style={{ color: colors.accent }}>
                {unlocked}/{categoryAchievements.length}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {categoryAchievements.map((achievement) => {
                const rarity = RARITY_BY_TIER[achievement.tier];
                const rarityColor = RARITY_COLORS[rarity];
                const progressValue = Math.min(achievement.progress, achievement.target);

                return (
                  <article
                    key={achievement.id}
                    className="rounded-2xl border px-3 py-3 backdrop-blur-xl"
                    style={{
                      background: achievement.completed
                        ? `${rarityColor}1A`
                        : "rgba(255,255,255,0.09)",
                      borderColor: achievement.completed ? `${rarityColor}66` : "rgba(255,255,255,0.14)",
                      boxShadow: achievement.completed ? `0 0 12px ${rarityColor}30` : "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl"
                        style={{
                          background: `${rarityColor}22`,
                          borderColor: `${rarityColor}55`,
                          filter: achievement.completed ? "none" : "grayscale(1)",
                          opacity: achievement.completed ? 1 : 0.65,
                        }}
                      >
                        {achievement.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-sans text-[14px] font-extrabold" style={{ color: achievement.completed ? colors.text : "rgba(255,255,255,0.78)" }}>
                              {achievement.name}
                            </p>
                            <p className="font-sans text-[12px] font-semibold" style={{ color: colors.textMuted }}>
                              {achievement.description}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className="inline-flex rounded-full border px-2 py-1 font-sans text-[10px] font-extrabold uppercase"
                              style={{ color: rarityColor, borderColor: `${rarityColor}66`, background: `${rarityColor}1A` }}
                            >
                              {rarity}
                            </span>
                            <p className="mt-1 font-sans text-[11px] font-bold" style={{ color: colors.accent }}>
                              +{achievement.xp} XP
                            </p>
                          </div>
                        </div>

                        {achievement.completed ? (
                          <p className="mt-2 inline-flex rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2 py-1 font-sans text-[10px] font-extrabold uppercase tracking-[0.08em] text-emerald-200">
                            Unlocked
                          </p>
                        ) : (
                          <div className="mt-2">
                            <ProgressBar value={progressValue} max={achievement.target} color={rarityColor} height={6} />
                            <div className="mt-1 flex items-center justify-between font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                              <span>{progressValue}/{achievement.target}</span>
                              <span>Locked</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
};

export default AchievementsTab;
