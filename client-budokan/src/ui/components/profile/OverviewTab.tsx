import ProgressBar from "@/ui/components/shared/ProgressBar";
import { getThemeImages, type ThemeColors, type ThemeId } from "@/config/themes";
import type { ZoneProgressData } from "@/config/profileData";
import { motion } from "motion/react";
import { formatUsdcAmount } from "@/utils/payment";

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

const formatPrice = (price: bigint | undefined): string => {
  if (price === undefined) return "0.00";
  return formatUsdcAmount(price);
};

const THEME_BY_ZONE: Record<number, ThemeId> = {
  1: "theme-1",
  2: "theme-2",
  3: "theme-3",
  4: "theme-4",
  5: "theme-5",
  6: "theme-6",
  7: "theme-7",
  8: "theme-8",
  9: "theme-9",
  10: "theme-10",
};

interface OverviewTabProps {
  colors: ThemeColors;
  zones: ZoneProgressData[];
  totalStars: number;
  totalGames: number;
  bestCombo: string;
  onUnlock: (zone: ZoneProgressData) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  colors,
  zones,
  totalStars,
  totalGames,
  bestCombo,
  onUnlock,
}) => {
  const stats = [
    { label: "Games", value: String(totalGames) },
    { label: "Best Combo", value: bestCombo },
    { label: "Lines", value: "--" },
    { label: "Bosses", value: "--" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4 pb-2">
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((stat) => (
          <motion.div
            variants={itemVariants}
            key={stat.label}
            className="rounded-2xl px-3 py-3 text-center backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${colors.border}` }}
          >
            <p className="font-sans text-2xl font-black" style={{ color: colors.text }}>
              {stat.value}
            </p>
            <p className="font-sans text-xs font-semibold" style={{ color: colors.textMuted }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      <section>
        <motion.div variants={itemVariants} className="mb-2 flex items-center justify-between">
          <p
              className="font-sans text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: colors.textMuted }}
            >
              Zone Progress
            </p>
            <p className="font-sans text-[12px] font-black" style={{ color: colors.accent2 }}>
              ★ {totalStars} total
            </p>
          </motion.div>

        <div className="flex flex-col gap-2.5">
          {zones.map((zone) => {
            const discount = zone.starCost
              ? Math.min(100, Math.floor(((zone.currentStars ?? 0) / zone.starCost) * 100))
              : 0;

            return (
              <motion.button
                variants={itemVariants}
                key={zone.zoneId}
                type="button"
                onClick={() => !zone.unlocked && onUnlock(zone)}
                className="w-full rounded-2xl px-2.5 py-3 text-left backdrop-blur-xl"
                style={{
                  background: zone.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${zone.unlocked ? colors.border : "rgba(255,255,255,0.12)"}`,
                  opacity: zone.unlocked ? 1 : 0.85,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={getThemeImages(THEME_BY_ZONE[zone.zoneId] ?? "theme-1").themeIcon}
                      alt={zone.name}
                      className="h-8 w-8 rounded-lg"
                      draggable={false}
                    />
                    <p className="font-sans text-[14px] font-extrabold leading-none" style={{ color: colors.text }}>
                      {zone.name}
                    </p>

                    {zone.cleared && (
                      <span
                        className="rounded px-1 py-[1px] font-sans text-[8px] font-bold tracking-[0.06em]"
                        style={{ color: colors.accent, background: `${colors.accent}20` }}
                      >
                        CLEARED
                      </span>
                    )}

                    {zone.isFree && (
                      <span
                        className="rounded px-1 py-[1px] font-sans text-[8px] font-bold tracking-[0.06em]"
                        style={{ color: colors.accent2, background: `${colors.accent2}20` }}
                      >
                        FREE
                      </span>
                    )}
                  </div>

                  {zone.unlocked ? (
                      <span className="font-sans text-[13px] font-extrabold" style={{ color: colors.accent2 }}>
                        {zone.stars}/{zone.maxStars}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="font-sans text-[12px] font-extrabold" style={{ color: colors.accent2 }}>
                          {zone.starCost}★
                        </span>
                        <span className="font-sans text-[9px] font-semibold" style={{ color: colors.textMuted }}>
                          or
                        </span>
                        <span className="font-sans text-[12px] font-extrabold" style={{ color: colors.accent }}>
                          {formatPrice(zone.price)} USDC
                        </span>
                      </div>
                  )}
                </div>

                {zone.unlocked ? (
                  <div className="mt-1.5">
                    <ProgressBar value={zone.stars} max={zone.maxStars} color={colors.accent} height={6} />
                  </div>
                ) : (
                  <div className="mt-1.5">
                    <ProgressBar
                      value={zone.currentStars ?? 0}
                      max={zone.starCost ?? 1}
                      color={colors.accent2}
                      height={4}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-sans text-[10px] font-semibold" style={{ color: colors.textMuted }}>
                        {zone.currentStars}/{zone.starCost}★ · {discount}% discount available
                      </span>
                      <span className="font-sans text-[10px] font-bold" style={{ color: colors.accent }}>
                        Tap to unlock →
                      </span>
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

    </motion.div>
  );
};

export default OverviewTab;
