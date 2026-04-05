import { useState } from "react";
import { motion } from "motion/react";
import { Settings } from "lucide-react";

import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useQuests } from "@/hooks/useQuests";
import { useNavigationStore } from "@/stores/navigationStore";

import ProgressBar from "@/ui/components/shared/ProgressBar";
import PageHeader from "@/ui/components/shared/PageHeader";
import OverviewTab from "@/ui/components/profile/OverviewTab";
import QuestsTab from "@/ui/components/profile/QuestsTab";
import AchievementsTab from "@/ui/components/profile/AchievementsTab";
import UnlockModal from "@/ui/components/profile/UnlockModal";

import {
  LEVEL_THRESHOLDS,
  PLAYER_TITLES,
  type ZoneProgressData,
} from "@/config/profileData";

const TABS = ["Overview", "Quests", "Achievements"] as const;

const containerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const getLevelFromXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
};

const getTitleForLevel = (level: number): string => {
  const unlockLevels = Object.keys(PLAYER_TITLES)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((l) => l <= level);
  const key = unlockLevels[unlockLevels.length - 1] ?? 1;
  return PLAYER_TITLES[key] ?? "Novice";
};

const ProfilePage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);

  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { account } = useAccountCustom();
  const isConnected = Boolean(account);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones, totalStars } = useZoneProgress(account?.address, zStarBalance);
  const { quests } = useQuests();
  const navigate = useNavigationStore((s) => s.navigate);

  const xp = playerMeta?.lifetimeXp ?? 0;
  const level = getLevelFromXp(xp);
  const levelStartXp = LEVEL_THRESHOLDS[Math.max(level - 1, 0)] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? levelStartXp + 5000;
  const title = getTitleForLevel(level);
  const nextTitle = getTitleForLevel(level + 1);
  const questsPendingCount = quests.filter((quest) => quest.active && !quest.claimed).length;
  const nextLockedZone = zones.find((zone) => !zone.unlocked && zone.starCost && zone.price !== undefined) ?? null;

  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [unlockZone, setUnlockZone] = useState<ZoneProgressData | null>(null);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <PageHeader
        title="Profile"
        rightSlot={
          <button
            onClick={() => navigate("settings")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-lg backdrop-blur-md transition-all hover:bg-white/[0.08] active:scale-95"
            aria-label="Settings"
          >
            <Settings size={20} className="text-white/80" />
          </button>
        }
      />

      <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          <motion.section
            variants={itemVariants}
            className="rounded-3xl border border-white/[0.16] bg-white/[0.12] p-4 backdrop-blur-2xl shadow-lg shadow-black/20"
          >
            <div className="mb-3 flex items-center gap-3">
            <div className="relative">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl font-sans text-2xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  color: colors.background,
                  boxShadow: colors.glow,
                }}
              >
                {(username || "PL").slice(0, 2).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 font-sans text-[11px] font-black"
                style={{ background: colors.accent, color: colors.background, borderColor: colors.background }}
              >
                {level}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-sans text-2xl font-extrabold" style={{ color: colors.text }}>
                {username ?? "Player"}
              </p>
              <p className="font-sans text-sm font-semibold" style={{ color: colors.textMuted }}>
                Level {level} · {title}
              </p>
            </div>

            <div className="text-right">
              <p className="font-sans text-3xl font-black leading-none" style={{ color: colors.accent2 }}>
                ★ {zStarBalance}
              </p>
              <p className="font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                zStar balance
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="font-sans text-xs font-semibold" style={{ color: colors.textMuted }}>
                Level {level}
              </p>
              <p className="font-sans text-xs font-extrabold" style={{ color: colors.accent }}>
                {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </p>
            </div>
            <ProgressBar value={xp - levelStartXp} max={Math.max(nextLevelXp - levelStartXp, 1)} color={colors.accent} height={8} glow />
            <p className="mt-1 font-sans text-xs" style={{ color: colors.textMuted }}>
              {(nextLevelXp - xp).toLocaleString()} XP to Level {level + 1} · "{nextTitle}"
            </p>
          </div>
          </motion.section>

          <motion.div variants={itemVariants} className="flex rounded-full border border-white/[0.12] bg-white/[0.06] p-1 backdrop-blur-xl">
          {TABS.map((tabName) => {
            const active = tab === tabName;
            return (
              <button
                key={tabName}
                type="button"
                onClick={() => setTab(tabName)}
                className="relative flex-1 rounded-full py-2 text-center font-sans text-[12px] font-bold"
                style={{
                  color: active ? colors.accent : colors.textMuted,
                }}
              >
                {tabName}
                {tabName === "Quests" && (
                  <span
                    className="ml-1 rounded px-1 py-[1px] align-middle font-display text-[8px] font-bold"
                    style={{ color: colors.background, background: "#FF6B8A" }}
                  >
                    {questsPendingCount}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="profile-tab-indicator"
                    className="absolute inset-0 rounded-full border"
                    style={{ backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}55` }}
                  />
                )}
              </button>
            );
          })}
          </motion.div>

          <motion.div variants={itemVariants} className="px-0.5">
          {tab === "Overview" && (
            <OverviewTab
              colors={colors}
              zones={zones}
              totalStars={totalStars}
              totalGames={playerMeta?.totalRuns ?? 0}
              bestCombo="--"
              onUnlock={setUnlockZone}
            />
          )}

          {tab === "Quests" && (
            <QuestsTab colors={colors} nextLockedZone={nextLockedZone} onUnlock={setUnlockZone} />
          )}

          {tab === "Achievements" && <AchievementsTab colors={colors} />}
          </motion.div>

        </motion.div>
      </div>

      {unlockZone && <UnlockModal colors={colors} zone={unlockZone} onClose={() => setUnlockZone(null)} />}

      {!isConnected && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1"
          style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${colors.border}` }}
        >
          <p className="font-sans text-[10px] font-semibold" style={{ color: colors.textMuted }}>
            Connect to sync your profile and progress
          </p>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
