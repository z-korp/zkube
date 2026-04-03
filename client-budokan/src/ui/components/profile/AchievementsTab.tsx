import type { ThemeColors } from "@/config/themes";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import { ACHIEVEMENT_CATEGORIES, useAchievements } from "@/hooks/useAchievements";
import { motion } from "motion/react";

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
  Common: "rgba(255,255,255,0.5)",
  Rare: "#4DA6FF",
  Epic: "#A78BFA",
  Legendary: "#FFD93D",
} as const;

const AchievementsTab: React.FC<AchievementsTabProps> = ({ colors }) => {
  const { achievements } = useAchievements();
  const totalUnlocked = achievements.filter((achievement) => achievement.completed).length;
  const total = achievements.length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3.5 pb-2">
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div>
          <p className="font-display text-[20px] font-black" style={{ color: colors.text }}>
            {totalUnlocked}/{total}
          </p>
          <p className="font-['DM_Sans'] text-[9px]" style={{ color: colors.textMuted }}>
            Achievements unlocked
          </p>
        </div>

        <div className="flex gap-2">
          {(Object.keys(RARITY_COLORS) as Array<keyof typeof RARITY_COLORS>).map((rarity) => {
            const count = achievements.filter(
              (achievement) => achievement.completed && RARITY_BY_TIER[achievement.tier] === rarity,
            ).length;

            return (
              <div key={rarity} className="text-center">
                <p className="font-display text-[13px] font-extrabold" style={{ color: RARITY_COLORS[rarity] }}>
                  {count}
                </p>
                <p className="font-['DM_Sans'] text-[7px]" style={{ color: `${RARITY_COLORS[rarity]}99` }}>
                  {rarity}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const categoryAchievements = achievements.filter((achievement) => achievement.category === category);
        const unlocked = categoryAchievements.filter((achievement) => achievement.completed).length;

        return (
          <motion.section variants={itemVariants} key={category}>
            <div className="mb-2 flex items-center justify-between">
              <p
                className="font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: colors.textMuted }}
              >
                {category}
              </p>
                <p className="font-display text-[10px] font-bold" style={{ color: colors.accent }}>
                {unlocked}/{categoryAchievements.length}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
              {categoryAchievements.map((achievement) => {
                const rarity = RARITY_BY_TIER[achievement.tier];
                const rarityColor = RARITY_COLORS[rarity];

                return (
                  <div
                    key={achievement.id}
                    className="relative overflow-hidden rounded-[10px] px-2 py-2"
                    style={{
                      background: achievement.completed
                        ? `${rarityColor}14`
                        : "rgba(255,255,255,0.015)",
                      border: `1px solid ${achievement.completed ? `${rarityColor}33` : "rgba(255,255,255,0.05)"}`,
                      opacity: achievement.completed ? 1 : 0.4,
                    }}
                  >
                    {achievement.completed && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: 32,
                          height: 32,
                          background: `radial-gradient(circle at top right, ${rarityColor}26, transparent)`,
                        }}
                      />
                    )}

                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-base" style={{ filter: achievement.completed ? "none" : "grayscale(1)" }}>
                        {achievement.icon}
                      </span>
                      <span
                        className="font-['DM_Sans'] text-[5.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: rarityColor }}
                      >
                        {rarity}
                      </span>
                    </div>

                    <p
                      className="font-display text-[9px] font-bold leading-[1.2]"
                      style={{ color: achievement.completed ? colors.text : colors.textMuted }}
                    >
                      {achievement.name}
                    </p>
                    <p className="mt-0.5 font-['DM_Sans'] text-[7.5px] leading-[1.3]" style={{ color: colors.textMuted }}>
                      {achievement.description}
                    </p>
                    {!achievement.completed && (
                      <div className="mt-1">
                        <ProgressBar value={achievement.progress} max={achievement.target} color={rarityColor} height={3} />
                      </div>
                    )}
                  </div>
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
