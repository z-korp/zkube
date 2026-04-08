import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";

import type { ThemeColors } from "@/config/themes";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import { ZONE_NAMES } from "@/config/profileData";

const SECONDS_PER_WEEK = 604800;

const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

function currentWeekId(): number {
  return Math.floor(Date.now() / 1000 / SECONDS_PER_WEEK);
}

function weekEndTimestamp(weekId: number): number {
  return (weekId + 1) * SECONDS_PER_WEEK;
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
  { label: "Top 1%", reward: 30 },
  { label: "Top 5%", reward: 20 },
  { label: "Top 10%", reward: 15 },
  { label: "Top 25%", reward: 10 },
  { label: "Top 50%", reward: 3 },
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

  // Check settlement status for previous week
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

      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {ZONES.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-sans text-[11px] font-semibold transition-colors ${
              selectedZone === zone.id
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-white/40 border border-transparent hover:text-white/60"
            }`}
          >
            {zone.name}
          </button>
        ))}
      </div>

      {myRank && (
        <motion.section
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border px-4 py-3 backdrop-blur-xl"
          style={{ background: `${colors.accent}15`, borderColor: `${colors.accent}40` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-sans text-2xl font-black" style={{ color: colors.accent }}>
                #{myRank}
              </span>
              <div>
                <p className="font-sans text-sm font-bold text-white">
                  {games[myRank - 1]?.score.toLocaleString()} pts
                </p>
                <p className="font-sans text-[11px] text-white/50">
                  {games.length} participant{games.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {myReward > 0 && (
              <div className="rounded-full bg-yellow-500/20 px-2.5 py-1 font-sans text-[11px] font-bold text-yellow-300">
                Projected +{myReward}★
              </div>
            )}
          </div>
        </motion.section>
      )}

      {!isPrevWeekSettled && games.length > 0 && (
        <motion.section variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSettle}
            disabled={settling || !account}
            className="w-full rounded-2xl border border-purple-500/40 bg-purple-500/15 px-4 py-3.5 font-sans text-sm font-extrabold uppercase tracking-wide text-purple-300 disabled:opacity-50"
            style={{ boxShadow: "0 0 20px rgba(147,51,234,0.15)" }}
          >
            {settling ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Settling...
              </span>
            ) : (
              `Settle Last Week — ${ZONE_NAMES[selectedZone]}`
            )}
          </motion.button>
        </motion.section>
      )}

      {isPrevWeekSettled && (
        <motion.section
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5"
        >
          <p className="text-center font-sans text-sm font-bold text-green-300">
            Last week settled — rewards distributed
          </p>
        </motion.section>
      )}

      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}
      >
        <p className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
          Top Players — {ZONE_NAMES[selectedZone]}
        </p>
        {games.length === 0 ? (
          <p className="py-4 text-center font-sans text-sm text-white/50">No entries for this zone</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {games.slice(0, 5).map((entry, i) => (
              <div key={entry.token_id.toString()} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 font-sans text-xs font-black" style={{ color: i < 3 ? colors.accent2 : colors.textMuted }}>
                    {i + 1}
                  </span>
                  <span className="font-sans text-xs font-semibold text-white/80">
                    {entry.player_name ?? "Anonymous"}
                  </span>
                </div>
                <span className="font-sans text-xs font-bold text-white/60">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="rounded-2xl border px-4 py-3 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.10)" }}
      >
        <p className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
          Weekly Reward Tiers
        </p>
        <div className="flex flex-wrap gap-2">
          {REWARD_TIERS.map((tier) => (
            <div key={tier.label} className="rounded-lg bg-white/5 px-2.5 py-1.5">
              <span className="font-sans text-[11px] font-semibold text-white/50">{tier.label}: </span>
              <span className="font-sans text-[11px] font-bold text-yellow-300">+{tier.reward}★</span>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default WeeklyTab;
