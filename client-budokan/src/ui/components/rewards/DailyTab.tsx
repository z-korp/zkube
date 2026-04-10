import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

import type { ThemeColors } from "@/config/themes";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
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

  if (sec <= 0) return <span className="font-sans text-sm font-bold text-red-400">ENDED</span>;

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return (
    <span className="font-sans text-sm font-bold tabular-nums" style={{ color: colors.accent }}>
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

  const normalizedAccount = account?.address?.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const hasEnded = challenge ? now >= challenge.end_time : false;
  const isSettled = challenge?.settled ?? false;

  const zoneName = challenge?.zone_id ? (ZONE_NAMES[challenge.zone_id] ?? `Zone ${challenge.zone_id}`) : null;
  const activeMutator = challenge?.active_mutator_id ? getMutatorDef(challenge.active_mutator_id) : null;
  const passiveMutator = challenge?.passive_mutator_id ? getMutatorDef(challenge.passive_mutator_id) : null;

  const myEntry = useMemo(() => {
    if (!normalizedAccount || !entries.length) return null;
    return entries.find((e) => e.player.toLowerCase() === normalizedAccount) ?? null;
  }, [entries, normalizedAccount]);

  const myReward = myEntry ? computeDailyReward(myEntry.rank, entries.length) : 0;

  const tierEntries = useMemo(() =>
    entries.map((e) => ({ rank: e.rank, score: e.totalStars ?? 0, name: e.playerName ?? e.player.slice(0, 8) })),
    [entries],
  );

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

  if (challengeLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: colors.textMuted }}>
        <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: colors.accent }} />
        <p className="font-sans text-sm font-medium">Loading daily challenge...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" style={{ color: colors.textMuted }}>
        <span className="mb-4 text-4xl">📅</span>
        <p className="font-sans text-lg font-semibold" style={{ color: colors.text }}>No daily challenge yet</p>
        <p className="mt-1 font-sans text-sm">Play a daily game to generate today's challenge.</p>
      </div>
    );
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="flex flex-col gap-3">
      <motion.section
        variants={itemVariants}
        className="rounded-2xl border px-4 py-3.5 backdrop-blur-xl"
        style={{ background: "rgba(255,255,255,0.11)", borderColor: "rgba(255,255,255,0.18)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
              Today's Challenge
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {zoneName && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-white/80">
                  {zoneName}
                </span>
              )}
              {activeMutator && (
                <span className="rounded-full bg-orange-500/15 px-2 py-0.5 font-sans text-[11px] font-semibold text-orange-300">
                  {activeMutator.icon} {activeMutator.name}
                </span>
              )}
              {passiveMutator && (
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 font-sans text-[11px] font-semibold text-purple-300">
                  {passiveMutator.icon} {passiveMutator.name}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            {hasEnded ? (
              <span className="font-sans text-sm font-bold text-red-400">ENDED</span>
            ) : (
              <Countdown endTime={challenge.end_time} colors={colors} />
            )}
            <p className="font-sans text-[10px]" style={{ color: colors.textMuted }}>
              {challenge.total_entries} player{challenge.total_entries !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </motion.section>

      {myEntry && (
        <motion.section
          variants={itemVariants}
          className="rounded-2xl border px-4 py-3 backdrop-blur-xl"
          style={{
            background: `${colors.accent}15`,
            borderColor: `${colors.accent}40`,
          }}
        >
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: colors.textMuted }}>
            Your Result
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-sans text-2xl font-black" style={{ color: colors.accent }}>
                #{myEntry.rank}
              </span>
              <div>
                <p className="font-sans text-sm font-bold text-white">{myEntry.totalStars ?? 0}/30 ★ · {myEntry.highestCleared ?? 0}/10 levels</p>
              </div>
            </div>
            {(isSettled && myEntry.rank <= entries.length) ? (
              <div className="rounded-full bg-green-500/20 px-2.5 py-1 font-sans text-[11px] font-bold text-green-300">
                Earned +{myReward}★
              </div>
            ) : myReward > 0 ? (
              <div className="rounded-full bg-yellow-500/20 px-2.5 py-1 font-sans text-[11px] font-bold text-yellow-300">
                Projected +{myReward}★
              </div>
            ) : null}
          </div>
        </motion.section>
      )}

      {hasEnded && !isSettled && entries.length > 0 && (
        <motion.section variants={itemVariants}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSettle}
            disabled={settling || !account}
            className="w-full rounded-2xl border border-yellow-500/40 bg-yellow-500/15 px-4 py-3.5 font-sans text-sm font-extrabold uppercase tracking-wide text-yellow-300 disabled:opacity-50"
            style={{ boxShadow: "0 0 20px rgba(234,179,8,0.15)" }}
          >
            {settling ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Settling...
              </span>
            ) : (
              "Settle Daily Challenge"
            )}
          </motion.button>
        </motion.section>
      )}

      {isSettled && (
        <motion.section variants={itemVariants} className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5">
          <p className="text-center font-sans text-sm font-bold text-green-300">Settled — rewards distributed</p>
        </motion.section>
      )}

      {myEntry && (
        <motion.section variants={itemVariants}>
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
    </motion.div>
  );
};

export default DailyTab;
