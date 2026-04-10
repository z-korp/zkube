import { useMemo } from "react";
import ProgressBar from "@/ui/components/shared/ProgressBar";
import { getThemeImages, type ThemeColors, type ThemeId } from "@/config/themes";
import type { ZoneProgressData } from "@/config/profileData";
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

const THEME_BY_ZONE: Record<number, ThemeId> = {
  1: "theme-1", 2: "theme-2", 3: "theme-3", 4: "theme-4", 5: "theme-5",
  6: "theme-6", 7: "theme-7", 8: "theme-8", 9: "theme-9", 10: "theme-10",
};

interface ZoneProgressTabProps {
  colors: ThemeColors;
  zones: ZoneProgressData[];
  totalStars: number;
  onUnlock: (zone: ZoneProgressData) => void;
}

const ZoneProgressTab: React.FC<ZoneProgressTabProps> = ({ colors, zones, totalStars, onUnlock }) => {
  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)),
    [zones],
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-3 pb-2">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
          Zone Progress
        </p>
        <p className="font-sans text-[12px] font-black" style={{ color: colors.accent2 }}>
          ★ {totalStars} total
        </p>
      </motion.div>

      {sortedZones.map((zone) => (
        <motion.button
          variants={itemVariants}
          key={zone.zoneId}
          type="button"
          onClick={() => !zone.unlocked && onUnlock(zone)}
          disabled={zone.unlocked}
          className="w-full rounded-2xl px-2.5 py-3 text-left backdrop-blur-xl"
          style={{
            background: zone.unlocked ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${zone.unlocked ? colors.border : "rgba(255,255,255,0.08)"}`,
            opacity: zone.unlocked ? 1 : 0.7,
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
              <div className="flex items-center gap-1.5">
                {zone.perfectionClaimed && (
                  <span className="rounded px-1 py-[1px] font-sans text-[8px] font-bold tracking-[0.06em] text-pink-300" style={{ background: "rgba(236,72,153,0.2)" }}>
                    PERFECT
                  </span>
                )}
                <span className="font-sans text-[13px] font-extrabold" style={{ color: colors.accent2 }}>
                  {zone.stars}/{zone.maxStars}
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 font-sans text-[11px] font-semibold text-white/40">
                🔒 {(zone.starCost ?? 0) > 0 ? `${zone.starCost}★` : ""}
              </span>
            )}
          </div>

          {zone.unlocked && (
            <div className="mt-1.5">
              <ProgressBar value={zone.stars} max={zone.maxStars} color={zone.perfectionClaimed ? "#ec4899" : colors.accent} height={6} />
              {zone.stars >= zone.maxStars && !zone.perfectionClaimed && (
                <p className="mt-1 font-sans text-[10px] font-semibold text-pink-300/80">
                  30/30 ★ — Claim +20★ perfection bonus!
                </p>
              )}
            </div>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
};

export default ZoneProgressTab;
