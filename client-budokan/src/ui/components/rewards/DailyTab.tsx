import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

import type { ThemeColors } from "@/config/themes";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePreviousChallenge } from "@/hooks/usePreviousChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { ZONE_NAMES } from "@/config/profileData";
import { getMutatorDef } from "@/config/mutatorConfig";
import TierContext from "@/ui/components/rewards/TierContext";

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function computeDailyReward(rank: number, total: number): number {
  if (total === 0) return 0;
  const pct = ((rank - 1) * 100) / total;
  if (pct < 2) return 10;
  if (pct < 5) return 7;
  if (pct < 10) return 5;
  if (pct < 25) return 3;
  if (pct < 50) return 1;
  return 0;
}

interface CountdownProps {
  endTime: number;
  colors: ThemeColors;
}

const Countdown: React.FC<CountdownProps> = ({ endTime, colors }) => {
  const [sec, setSec] = useState(() =>
    Math.max(0, endTime - Math.floor(Date.now() / 1000)),
  );

  useState(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, endTime - Math.floor(Date.now() / 1000));
      setSec(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  });

  if (sec <= 0) return <span className="rounded-full bg-red-500 px-3 py-1.5 font-sans text-xs font-bold text-white">ENDED</span>;

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <span className="rounded-full px-3 py-1.5 font-sans text-xs font-bold tabular-nums text-white" style={{ background: colors.accent }}>
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
};

interface DailyTabProps {
  colors: ThemeColors;
}

const REWARD_TIERS = [
  { pct: 1, label: "Top 1%", reward: 10 },
  { pct: 5, label: "Top 5%", reward: 7 },
  { pct: 10, label: "Top 10%", reward: 5 },
  { pct: 25, label: "Top 25%", reward: 3 },
  { pct: 50, label: "Top 50%", reward: 1 },
];

const DailyTab: React.FC<DailyTabProps> = ({ colors }) => {
  const { account } = useAccountCustom();
  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entries } = useDailyLeaderboard(challenge?.challenge_id);
  const {
    setup: { systemCalls },
  } = useDojo();
  const [settling, setSettling] = useState(false);

  // Previous (ended) daily challenge
  const { challenge: prevChallenge } = usePreviousChallenge();
  const { entries: prevEntries } = useDailyLeaderboard(prevChallenge?.challenge_id);
  const { entry: prevPlayerEntry } = usePlayerEntry(prevChallenge?.challenge_id, account?.address);
  const [settlingPrev, setSettlingPrev] = useState(false);

  const normalizedAccount = account?.address?.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const hasEnded = challenge ? now >= challenge.end_time : false;
  const isSettled = challenge?.settled ?? false;

  const zoneId = challenge?.zone_id ?? 1;
  const zoneName = challenge?.zone_id ? (ZONE_NAMES[challenge.zone_id] ?? `Zone ${challenge.zone_id}`) : null;
  const activeMutator = challenge?.active_mutator_id ? getMutatorDef(challenge.active_mutator_id) : null;
  const passiveMutator = challenge?.passive_mutator_id ? getMutatorDef(challenge.passive_mutator_id) : null;
  const zoneThemeId = `theme-${Math.min(10, Math.max(1, zoneId))}` as ThemeId;
  const zoneColors = getThemeColors(zoneThemeId);
  const zoneImages = getThemeImages(zoneThemeId);
  const guardian = getZoneGuardian(zoneId);

  const myEntry = useMemo(() => {
    if (!normalizedAccount || !entries.length) return null;
    return entries.find((e) => e.player.toLowerCase() === normalizedAccount) ?? null;
  }, [entries, normalizedAccount]);

  const myReward = myEntry ? computeDailyReward(myEntry.rank, entries.length) : 0;

  const tierEntries = useMemo(() =>
    entries.map((e) => ({ rank: e.rank, score: e.totalStars ?? 0, name: e.playerName ?? e.player.slice(0, 8) })),
    [entries],
  );

  // Previous challenge derived data
  const prevIsSettled = prevChallenge?.settled ?? false;
  const prevZoneId = prevChallenge?.zone_id ?? 1;
  const prevZoneName = prevChallenge?.zone_id ? (ZONE_NAMES[prevChallenge.zone_id] ?? `Zone ${prevChallenge.zone_id}`) : null;
  const prevZoneThemeId = `theme-${Math.min(10, Math.max(1, prevZoneId))}` as ThemeId;
  const prevZoneColors = getThemeColors(prevZoneThemeId);
  const prevZoneImages = getThemeImages(prevZoneThemeId);

  const prevMyRank = useMemo(() => {
    if (!normalizedAccount || !prevEntries.length) return null;
    const found = prevEntries.find((e) => e.player.toLowerCase() === normalizedAccount);
    return found?.rank ?? null;
  }, [prevEntries, normalizedAccount]);

  const prevMyReward = prevMyRank ? computeDailyReward(prevMyRank, prevEntries.length) : 0;
  const prevSettledReward = prevPlayerEntry ? Number(prevPlayerEntry.star_reward ?? 0) : 0;
  const prevShowPanel = prevChallenge && prevPlayerEntry;

  console.log("[DailyTab] prev panel debug:", {
    prevChallenge: prevChallenge ? { id: prevChallenge.challenge_id, settled: prevChallenge.settled, zone: prevChallenge.zone_id } : null,
    prevEntries: prevEntries.length,
    prevPlayerEntry: prevPlayerEntry ? { stars: prevPlayerEntry.total_stars, rank: prevPlayerEntry.rank, reward: prevPlayerEntry.star_reward } : null,
    prevMyRank,
    prevShowPanel: !!prevShowPanel,
    account: account?.address,
  });

  const handleSettle = useCallback(async () => {
    if (!account || !challenge || settling) return;
    setSettling(true);
    try {
      const rankedPlayers = entries.map((e) => e.player);
      await systemCalls.settleChallenge({
        account,
        challenge_id: challenge.challenge_id,
        ranked_players: rankedPlayers,
      });
    } catch (error) {
      console.error("Failed to settle challenge:", error);
    } finally {
      setSettling(false);
    }
  }, [account, challenge, entries, settling, systemCalls]);

  const handleSettlePrev = useCallback(async () => {
    if (!account || !prevChallenge || settlingPrev) return;
    setSettlingPrev(true);
    try {
      const rankedPlayers = prevEntries.map((e) => e.player);
      await systemCalls.settleChallenge({
        account,
        challenge_id: prevChallenge.challenge_id,
        ranked_players: rankedPlayers,
      });
    } catch (error) {
      console.error("Failed to settle previous challenge:", error);
    } finally {
      setSettlingPrev(false);
    }
  }, [account, prevChallenge, prevEntries, settlingPrev, systemCalls]);

  if (challengeLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: colors.textMuted }}>
        <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: colors.accent }} />
        <p className="font-sans text-sm font-medium">Loading daily challenge...</p>
      </div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="flex flex-col gap-3">

      {/* ── Previous daily claim panel ── */}
      {prevShowPanel && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative overflow-hidden rounded-2xl border"
          style={{ borderColor: prevIsSettled ? "rgba(34,197,94,0.35)" : "rgba(234,179,8,0.35)" }}
        >
          <img src={prevZoneImages.background} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
          <div className="relative z-10 px-4 py-3">
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: prevZoneColors.accent }}>
              {new Date(prevChallenge.start_time * 1000).toLocaleDateString(navigator.language, { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="font-sans text-sm font-bold text-white">
                  {prevZoneName}
                </p>
                <p className="font-sans text-[11px] text-white/60">
                  #{prevMyRank ?? "—"} · {Number(prevPlayerEntry.total_stars ?? 0)}/30 ★ · {Number(prevPlayerEntry.highest_cleared ?? 0)}/10 levels
                </p>
              </div>

              {prevIsSettled ? (
                prevSettledReward > 0 ? (
                  <div className="rounded-full bg-green-500 px-3 py-1.5 font-sans text-xs font-bold text-white">
                    Earned +{prevSettledReward}★
                  </div>
                ) : (
                  <div className="rounded-full bg-white/60 px-3 py-1.5 font-sans text-xs font-bold text-black">
                    No rewards
                  </div>
                )
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSettlePrev}
                  disabled={settlingPrev || !account || prevEntries.length === 0}
                  className="rounded-full bg-yellow-500 px-3 py-1.5 font-sans text-xs font-bold text-black disabled:opacity-50"
                >
                  {settlingPrev ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Settling...
                    </span>
                  ) : (
                    `Settle${prevMyReward > 0 ? ` +${prevMyReward}★` : ""}`
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Current daily ── */}
      {!challenge ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: colors.textMuted }}>
          <span className="mb-4 text-4xl">📅</span>
          <p className="font-sans text-lg font-semibold" style={{ color: colors.text }}>No daily challenge yet</p>
          <p className="mt-1 font-sans text-sm">Play a daily game to generate today's challenge.</p>
        </div>
      ) : (
        <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative overflow-hidden rounded-2xl border"
            style={{ borderColor: `${zoneColors.accent}35` }}
          >
            <img src={zoneImages.background} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
            <div className="relative z-10 px-4 py-3">
              <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: zoneColors.accent }}>
                {new Date(challenge.start_time * 1000).toLocaleDateString(navigator.language, { weekday: "long", month: "short", day: "numeric" })}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="font-sans text-sm font-bold text-white">
                    {zoneName}
                  </p>
                  {myEntry ? (
                    <p className="font-sans text-[11px] text-white/60">
                      #{myEntry.rank} · {myEntry.totalStars ?? 0}/30 ★ · {myEntry.highestCleared ?? 0}/10 levels
                    </p>
                  ) : (
                    <p className="font-sans text-[11px] text-white/60">
                      {challenge.total_entries} player{challenge.total_entries !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {hasEnded ? (
                  isSettled ? (
                    <div className="rounded-full bg-green-500 px-3 py-1.5 font-sans text-xs font-bold text-white">
                      Settled
                    </div>
                  ) : entries.length > 0 ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSettle}
                      disabled={settling || !account}
                      className="rounded-full border border-yellow-500/60 bg-yellow-500/40 px-3 py-1.5 font-sans text-xs font-bold text-yellow-300 disabled:opacity-50"
                      style={{ boxShadow: "0 0 12px rgba(234,179,8,0.25)" }}
                    >
                      {settling ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> Settling...
                        </span>
                      ) : (
                        `Settle${myReward > 0 ? ` +${myReward}★` : ""}`
                      )}
                    </motion.button>
                  ) : (
                    <span className="rounded-full border px-2 py-0.5 font-sans text-[10px] font-bold text-red-400" style={{ borderColor: "rgba(248,113,113,0.3)", backgroundColor: "rgba(248,113,113,0.1)" }}>
                      ENDED
                    </span>
                  )
                ) : (
                  <Countdown endTime={challenge.end_time} colors={zoneColors} />
                )}
              </div>
            </div>
          </motion.section>

          {myEntry && (
            <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <TierContext
                colors={colors}
                myRank={myEntry.rank}
                myScore={myEntry.totalStars ?? 0}
                myName={myEntry.playerName ?? "You"}
                totalEntries={entries.length}
                tiers={REWARD_TIERS}
                entries={tierEntries}
                scoreLabel="★"
              />
            </motion.section>
          )}
        </>
      )}

      {/* Reward tiers — compact horizontal */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap justify-center gap-1.5"
      >
        {REWARD_TIERS.map((tier) => {
          const isMyTier = myEntry && entries.length > 0 && myReward === tier.reward;
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
            myEntry && entries.length > 0 && myReward === 0
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

export default DailyTab;
