import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";

import { getThemeImages, type ThemeColors, type ThemeId } from "@/config/themes";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useUnsettledRewards } from "@/hooks/useUnsettledRewards";
import { ZONE_NAMES } from "@/config/profileData";
import TierContext from "@/ui/components/rewards/TierContext";

const SECONDS_PER_WEEK = 604800;
const MONDAY_OFFSET = 345600; // Unix epoch was Thursday; +4 days = Monday

const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

function currentWeekId(): number {
  return Math.floor((Date.now() / 1000 - MONDAY_OFFSET) / SECONDS_PER_WEEK);
}

function weekEndTimestamp(weekId: number): number {
  return (weekId + 1) * SECONDS_PER_WEEK + MONDAY_OFFSET;
}

function computeWeeklyReward(rank1Based: number, total: number): number {
  if (total === 0) return 0;
  const rank = rank1Based - 1;
  const pct = (rank * 100) / total;
  if (pct < 2) return 30;
  if (pct < 5) return 20;
  if (pct < 10) return 15;
  if (pct < 25) return 10;
  if (pct < 50) return 3;
  return 0;
}

const ZONES = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: ZONE_NAMES[i + 1] ?? `Zone ${i + 1}`,
  endlessSettingsId: i * 2 + 1,
}));

const REWARD_TIERS = [
  { pct: 2, label: "Top 1%", reward: 30 },
  { pct: 5, label: "Top 5%", reward: 20 },
  { pct: 10, label: "Top 10%", reward: 15 },
  { pct: 25, label: "Top 25%", reward: 10 },
  { pct: 50, label: "Top 50%", reward: 3 },
];

interface WeeklyTabProps {
  colors: ThemeColors;
}

const WeeklyTab: React.FC<WeeklyTabProps> = ({ colors }) => {
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls,
      contractComponents: { WeeklyEndless },
    },
  } = useDojo();
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones: zoneProgress } = useZoneProgress(account?.address, zStarBalance);
  const { unsettledWeeklyZones } = useUnsettledRewards();

  const unlockedZones = useMemo(
    () => ZONES.filter((zone) => zoneProgress.some((z) => z.zoneId === zone.id && z.unlocked)),
    [zoneProgress],
  );

  const [selectedZone, setSelectedZone] = useState(1);
  const [settling, setSettling] = useState(false);

  const endlessSettingsId = (selectedZone - 1) * 2 + 1;
  const { games } = useLeaderboardSlot(endlessSettingsId);

  const weekId = currentWeekId();
  const prevWeekId = weekId - 1;
  const weekEnd = weekEndTimestamp(weekId);
  const [sec, setSec] = useState(() => Math.max(0, weekEnd - Math.floor(Date.now() / 1000)));

  useState(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, weekEnd - Math.floor(Date.now() / 1000));
      setSec(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  });

  // Check settlement status for previous week (per selected zone)
  const settlementKey = prevWeekId * 1000 + endlessSettingsId;
  const settlementEntityKey = useMemo(() => {
    const rawKey = getEntityIdFromKeys([BigInt(settlementKey)]);
    return normalizeEntityId(rawKey);
  }, [settlementKey]);
  const weeklyMeta = useComponentValue(WeeklyEndless, settlementEntityKey);
  const isPrevWeekSettled = weeklyMeta?.settled ?? false;

  const normalizedAccount = account?.address?.toLowerCase();
  const myRank = useMemo(() => {
    if (!normalizedAccount) return null;
    const idx = games.findIndex(
      (g) => g.player_address?.toLowerCase() === normalizedAccount,
    );
    return idx >= 0 ? idx + 1 : null;
  }, [games, normalizedAccount]);

  const myReward = myRank ? computeWeeklyReward(myRank, games.length) : 0;

  const tierEntries = useMemo(() =>
    games.map((g, i) => ({ rank: i + 1, score: g.score, name: g.player_name || "Anonymous" })),
    [games],
  );

  const handleSettle = useCallback(async () => {
    if (!account || settling || games.length === 0) return;
    setSettling(true);
    try {
      const rankedPlayers = games.map((g) => g.player_address!).filter(Boolean);
      await systemCalls.settleWeeklyEndless({
        account,
        week_id: prevWeekId,
        settings_id: endlessSettingsId,
        ranked_players: rankedPlayers,
      });
    } catch (error) {
      console.error("Failed to settle weekly:", error);
    } finally {
      setSettling(false);
    }
  }, [account, settling, games, prevWeekId, endlessSettingsId, systemCalls]);

  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-3"
    >
      {/* Header with countdown */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="rounded-2xl border px-4 py-3.5 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.11)", borderColor: "rgba(255,255,255,0.18)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
              Weekly Endless
            </p>
            <p className="mt-0.5 font-sans text-sm font-bold text-white">
              Best all-time scores per zone
            </p>
          </div>
          <div className="text-right">
            <span className="font-sans text-sm font-bold tabular-nums" style={{ color: colors.accent }}>
              {days}d {String(hours).padStart(2, "0")}h {String(mins).padStart(2, "0")}m
            </span>
            <p className="font-sans text-[10px]" style={{ color: colors.textMuted }}>until week ends</p>
          </div>
        </div>
      </motion.section>

      {/* Zone selector */}
      <div className="flex justify-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {unlockedZones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`relative shrink-0 rounded-lg p-0.5 transition-all ${
              selectedZone === zone.id
                ? "border-2 border-white/60 shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                : "border-2 border-transparent hover:border-white/20"
            }`}
          >
            <img
              src={getThemeImages(`theme-${zone.id}` as ThemeId).themeIcon}
              alt={zone.name}
              className="h-7 w-7 rounded-lg object-cover"
              draggable={false}
            />
            {unsettledWeeklyZones.has(zone.id) && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
            )}
          </button>
        ))}
      </div>

      {/* ── Last week claim panel (below zone selector) ── */}
      {games.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border px-4 py-3 backdrop-blur-xl"
          style={{
            background: isPrevWeekSettled ? "rgba(34,197,94,0.08)" : "rgba(234,179,8,0.08)",
            borderColor: isPrevWeekSettled ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)",
          }}
        >
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
            Last Week — {ZONE_NAMES[selectedZone]}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <div>
              {myRank ? (
                <p className="font-sans text-sm font-bold text-white">
                  #{myRank} · {games[myRank - 1]?.score.toLocaleString()} pts
                </p>
              ) : (
                <p className="font-sans text-sm font-bold text-white/50">
                  Not ranked
                </p>
              )}
            </div>

            {isPrevWeekSettled ? (
              myReward > 0 ? (
                <div className="rounded-full bg-green-500/25 px-3 py-1.5 font-sans text-xs font-bold text-green-300">
                  Earned +{myReward}★
                </div>
              ) : (
                <div className="rounded-full bg-white/10 px-3 py-1.5 font-sans text-xs font-bold text-white/40">
                  Settled
                </div>
              )
            ) : weeklyMeta || games.length > 0 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSettle}
                disabled={settling || !account}
                className="rounded-full border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 font-sans text-xs font-bold text-purple-300 disabled:opacity-50"
                style={{ boxShadow: "0 0 12px rgba(147,51,234,0.15)" }}
              >
                {settling ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Settling...
                  </span>
                ) : (
                  `Settle${myReward > 0 ? ` +${myReward}★` : ""}`
                )}
              </motion.button>
            ) : null}
          </div>
        </motion.section>
      )}

      {myRank && (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <TierContext
            colors={colors}
            myRank={myRank}
            myScore={games[myRank - 1]?.score ?? 0}
            totalEntries={games.length}
            tiers={REWARD_TIERS}
            entries={tierEntries}
            scoreLabel=" pts"
          />
        </motion.section>
      )}

      {/* Reward tiers — compact horizontal */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {REWARD_TIERS.map((tier) => {
          const isMyTier = myRank && games.length > 0 && myReward === tier.reward;
          return (
            <span
              key={tier.pct}
              className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold ${
                isMyTier
                  ? "border border-yellow-400/60 bg-yellow-500/25 text-white"
                  : "border border-white/10 bg-white/[0.06] text-white/50"
              }`}
            >
              {tier.label} <span className={`font-bold ${isMyTier ? "text-yellow-300" : "text-yellow-300/70"}`}>+{tier.reward}★</span>
            </span>
          );
        })}
        <span
          className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-semibold ${
            myRank && games.length > 0 && myReward === 0
              ? "border border-white/30 bg-white/15 text-white"
              : "border border-white/10 bg-white/[0.06] text-white/50"
          }`}
        >
          No rewards
        </span>
      </motion.section>
    </motion.div>
  );
};

export default WeeklyTab;
