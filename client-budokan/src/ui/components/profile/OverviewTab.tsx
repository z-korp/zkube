import ProgressBar from "@/ui/components/shared/ProgressBar";
import { getThemeImages, type ThemeColors, type ThemeId } from "@/config/themes";
import type { ZoneProgressData } from "@/config/profileData";
import { RECENT_ACTIVITY } from "@/config/profileData";

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
    <div className="flex flex-col gap-3.5 pb-2">
      <div className="grid grid-cols-4 gap-1.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] px-1 py-2 text-center"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <p className="font-display text-[15px] font-extrabold" style={{ color: colors.text }}>
              {stat.value}
            </p>
            <p className="font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p
            className="font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: colors.textMuted }}
          >
            Zone Progress
          </p>
          <p className="font-display text-[10px] font-bold" style={{ color: colors.accent2 }}>
            ★ {totalStars} total
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {zones.map((zone) => {
            const discount = zone.starCost
              ? Math.floor(((zone.currentStars ?? 0) / zone.starCost) * 100)
              : 0;

            return (
              <button
                key={zone.zoneId}
                type="button"
                onClick={() => !zone.unlocked && onUnlock(zone)}
                className="w-full rounded-[10px] px-2.5 py-2 text-left"
                style={{
                  background: zone.unlocked ? colors.surface : "rgba(255,255,255,0.02)",
                  border: `1px solid ${zone.unlocked ? colors.border : "rgba(255,255,255,0.05)"}`,
                  opacity: zone.unlocked ? 1 : 0.75,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={getThemeImages(THEME_BY_ZONE[zone.zoneId] ?? "theme-1").themeIcon}
                      alt={zone.name}
                      className="h-6 w-6 rounded-md"
                      draggable={false}
                    />
                    <p className="font-display text-[11px] font-bold" style={{ color: colors.text }}>
                      {zone.name}
                    </p>

                    {zone.cleared && (
                      <span
                        className="rounded px-1 py-[1px] font-['DM_Sans'] text-[7px] font-bold tracking-[0.06em]"
                        style={{ color: colors.accent, background: `${colors.accent}20` }}
                      >
                        CLEARED
                      </span>
                    )}

                    {zone.isFree && (
                      <span
                        className="rounded px-1 py-[1px] font-['DM_Sans'] text-[7px] font-bold tracking-[0.06em]"
                        style={{ color: colors.accent2, background: `${colors.accent2}20` }}
                      >
                        FREE
                      </span>
                    )}
                  </div>

                  {zone.unlocked ? (
                    <span className="font-display text-[9px] font-bold" style={{ color: colors.accent2 }}>
                      {zone.stars}/{zone.maxStars}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-display text-[8px] font-bold" style={{ color: colors.accent2 }}>
                        {zone.starCost}★
                      </span>
                      <span className="font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
                        or
                      </span>
                      <span className="font-display text-[8px] font-bold" style={{ color: colors.accent }}>
                        {zone.ethPrice} ETH
                      </span>
                    </div>
                  )}
                </div>

                {zone.unlocked ? (
                  <div className="mt-1.5">
                    <ProgressBar value={zone.stars} max={zone.maxStars} color={colors.accent} height={4} />
                  </div>
                ) : (
                  <div className="mt-1.5">
                    <ProgressBar
                      value={zone.currentStars ?? 0}
                      max={zone.starCost ?? 1}
                      color={colors.accent2}
                      height={3}
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
                        {zone.currentStars}/{zone.starCost}★ · {discount}% discount available
                      </span>
                      <span className="font-['DM_Sans'] text-[7px] font-semibold" style={{ color: colors.accent }}>
                        Tap to unlock →
                      </span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p
          className="mb-2 font-['DM_Sans'] text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: colors.textMuted }}
        >
          Recent Activity
        </p>

        <div className="flex flex-col">
          {RECENT_ACTIVITY.map((item, index) => (
            <div
              key={`${item.text}-${item.time}`}
              className="flex items-center gap-2 py-1.5"
              style={{
                borderBottom: index < RECENT_ACTIVITY.length - 1 ? `1px solid ${colors.border}` : "none",
              }}
            >
              <span className="w-5 text-center text-sm">{item.icon}</span>
              <p className="flex-1 font-['DM_Sans'] text-[10px] font-medium" style={{ color: colors.text }}>
                {item.text}
              </p>
              <span className="font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default OverviewTab;
