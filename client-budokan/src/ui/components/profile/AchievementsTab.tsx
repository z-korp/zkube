import type { ThemeColors } from "@/config/themes";
import { ACHIEVEMENT_DEFS, RARITY_COLORS, type AchievementDef } from "@/config/profileData";

interface AchievementsTabProps {
  colors: ThemeColors;
}

const CATEGORIES: AchievementDef["category"][] = ["Combat", "Mastery", "Explorer"];

const AchievementsTab: React.FC<AchievementsTabProps> = ({ colors }) => {
  const totalUnlocked = ACHIEVEMENT_DEFS.filter((achievement) => achievement.unlocked).length;
  const total = ACHIEVEMENT_DEFS.length;

  return (
    <div className="flex flex-col gap-3.5 pb-2">
      <div
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
            const count = ACHIEVEMENT_DEFS.filter(
              (achievement) => achievement.unlocked && achievement.rarity === rarity,
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
      </div>

      {CATEGORIES.map((category) => {
        const achievements = ACHIEVEMENT_DEFS.filter((achievement) => achievement.category === category);
        const unlocked = achievements.filter((achievement) => achievement.unlocked).length;

        return (
          <section key={category}>
            <div className="mb-2 flex items-center justify-between">
              <p
                className="font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.15em]"
                style={{ color: colors.textMuted }}
              >
                {category}
              </p>
              <p className="font-display text-[10px] font-bold" style={{ color: colors.accent }}>
                {unlocked}/{achievements.length}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {achievements.map((achievement) => {
                const rarityColor = RARITY_COLORS[achievement.rarity];

                return (
                  <div
                    key={achievement.id}
                    className="relative overflow-hidden rounded-[10px] px-2 py-2"
                    style={{
                      background: achievement.unlocked
                        ? `${rarityColor}14`
                        : "rgba(255,255,255,0.015)",
                      border: `1px solid ${achievement.unlocked ? `${rarityColor}33` : "rgba(255,255,255,0.05)"}`,
                      opacity: achievement.unlocked ? 1 : 0.4,
                    }}
                  >
                    {achievement.unlocked && (
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
                      <span className="text-base" style={{ filter: achievement.unlocked ? "none" : "grayscale(1)" }}>
                        {achievement.icon}
                      </span>
                      <span
                        className="font-['DM_Sans'] text-[5.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ color: rarityColor }}
                      >
                        {achievement.rarity}
                      </span>
                    </div>

                    <p
                      className="font-display text-[9px] font-bold leading-[1.2]"
                      style={{ color: achievement.unlocked ? colors.text : colors.textMuted }}
                    >
                      {achievement.name}
                    </p>
                    <p className="mt-0.5 font-['DM_Sans'] text-[7.5px] leading-[1.3]" style={{ color: colors.textMuted }}>
                      {achievement.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default AchievementsTab;
