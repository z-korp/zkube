import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, UserRound } from "lucide-react";
import { useDisconnect } from "@starknet-react/core";

import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useQuests } from "@/hooks/useQuests";

import ProgressBar from "@/ui/components/shared/ProgressBar";
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

const truncateAddress = (address: string): string => {
  if (address.length <= 14) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const ProfilePage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);

  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { account } = useAccountCustom();
  const { disconnect } = useDisconnect();
  const isConnected = Boolean(account);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones, totalStars } = useZoneProgress(account?.address, zStarBalance);
  const { quests } = useQuests();

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
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <h1 className="pt-4 pb-2 text-center font-sans text-xl font-bold tracking-wide text-white">Profile</h1>

      <div className="mx-2 mt-1 mb-[72px] rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-sm p-3 overflow-y-auto flex-1 min-h-0">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          <motion.section
            variants={itemVariants}
            className="rounded-2xl p-3 backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] shadow-lg shadow-black/20"
          >
            <div className="mb-2.5 flex items-center gap-2.5">
            <div className="relative">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[14px] font-display text-xl font-black"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  color: colors.background,
                  boxShadow: colors.glow,
                }}
              >
                {(username || "PL").slice(0, 2).toUpperCase()}
              </div>
              <div
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border-2 font-display text-[9px] font-black"
                style={{ background: colors.accent, color: colors.background, borderColor: colors.background }}
              >
                {level}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-extrabold" style={{ color: colors.text }}>
                {username ?? "Player"}
              </p>
              <p className="font-sans text-[9px]" style={{ color: colors.textMuted }}>
                Level {level} · {title}
              </p>
            </div>

            <div className="text-right">
              <p className="font-display text-lg font-black" style={{ color: colors.accent2 }}>
                ★ {zStarBalance}
              </p>
              <p className="font-sans text-[8px]" style={{ color: colors.textMuted }}>
                zStar balance
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="font-sans text-[8px]" style={{ color: colors.textMuted }}>
                Level {level}
              </p>
              <p className="font-display text-[8px] font-bold" style={{ color: colors.accent }}>
                {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </p>
            </div>
            <ProgressBar value={xp - levelStartXp} max={Math.max(nextLevelXp - levelStartXp, 1)} color={colors.accent} height={6} glow />
            <p className="mt-1 font-sans text-[7px]" style={{ color: colors.textMuted }}>
              {(nextLevelXp - xp).toLocaleString()} XP to Level {level + 1} · "{nextTitle}"
            </p>
          </div>
          </motion.section>

          <motion.div variants={itemVariants} className="flex">
          {TABS.map((tabName) => {
            const active = tab === tabName;
            return (
              <button
                key={tabName}
                type="button"
                onClick={() => setTab(tabName)}
                className="relative flex-1 py-2 text-center font-sans text-[11px] font-medium"
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
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: colors.accent }}
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

          <motion.section variants={itemVariants} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-lg shadow-black/20 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-bold text-white">
              <UserRound size={16} style={{ color: colors.accent }} /> Account
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <p className="font-sans text-[9px] font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>Username</p>
                <p className="font-sans text-sm font-semibold text-white">{username ?? "Controller User"}</p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans text-[9px] font-medium uppercase tracking-wider" style={{ color: colors.textMuted }}>Wallet Address</p>
                    <p className="font-sans text-xs text-white/80">{account?.address ? truncateAddress(account.address) : "Not connected"}</p>
                  </div>
                  <button onClick={handleCopyAddress} className="flex items-center gap-1 rounded-lg px-2 py-1 text-white/50 hover:text-white/80 transition-colors">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="font-sans text-[9px]">{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              </div>
              <button onClick={() => disconnect()} className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 font-sans text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
                Disconnect
              </button>
            </div>
          </motion.section>
        </motion.div>
      </div>

      {unlockZone && <UnlockModal colors={colors} zone={unlockZone} onClose={() => setUnlockZone(null)} />}

      {!isConnected && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1"
          style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${colors.border}` }}
        >
          <p className="font-sans text-[8px]" style={{ color: colors.textMuted }}>
            Connect to load your profile data
          </p>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
