import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Calendar,
  Clock3,
  Loader2,
  Trophy,
  Users,
  Medal,
  Target,
} from "lucide-react";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import PageTopBar from "@/ui/navigation/PageTopBar";
import GameButton from "@/ui/components/shared/GameButton";

const RANKING_METRIC_LABELS: Record<number, string> = {
  0: "Score",
  1: "Level",
  2: "Cubes Earned",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

// Countdown until challenge end_time
const CountdownPill: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [sec, setSec] = useState(() =>
    Math.max(0, endTime - Math.floor(Date.now() / 1000)),
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      setSec(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTime]);

  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const formatted =
    h > 0
      ? `${h}h ${m.toString().padStart(2, "0")}m`
      : `${m}m ${s.toString().padStart(2, "0")}s`;

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2.5 py-1.5 border border-white/10">
      <Clock3 size={13} className="text-cyan-300" />
      <span className="font-['Fredericka_the_Great'] text-sm leading-none text-cyan-100">
        {sec > 0 ? formatted : "Ended"}
      </span>
    </div>
  );
};

const DailyChallengePage: React.FC = () => {
  const goBack = useNavigationStore((s) => s.goBack);
  const { account } = useAccountCustom();
  const {
    setup: { systemCalls },
  } = useDojo();

  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entry, isRegistered } = usePlayerEntry(
    challenge?.challenge_id,
    account?.address,
  );
  const { entries: leaderboard } = useDailyLeaderboard(
    challenge?.challenge_id,
  );

  const [registering, setRegistering] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const isActive =
    challenge &&
    !challenge.settled &&
    challenge.start_time <= now &&
    challenge.end_time > now;
  const isEnded =
    challenge && !challenge.settled && challenge.end_time <= now;
  const isSettled = challenge?.settled;

  const prizePool = challenge?.prize_pool
    ? BigInt(challenge.prize_pool)
    : BigInt(0);
  const playerPrize = entry?.prize_amount
    ? BigInt(entry.prize_amount)
    : BigInt(0);
  const canClaim =
    isSettled && isRegistered && playerPrize > 0n && !entry?.claimed;

  const handleRegister = useCallback(async () => {
    if (!account || !challenge || registering) return;
    setRegistering(true);
    try {
      await systemCalls.registerEntry({
        account,
        challenge_id: challenge.challenge_id,
      });
    } finally {
      setRegistering(false);
    }
  }, [account, challenge, registering, systemCalls]);

  const handleClaimPrize = useCallback(async () => {
    if (!account || !challenge || claiming) return;
    setClaiming(true);
    try {
      await systemCalls.claimPrize({
        account,
        challenge_id: challenge.challenge_id,
      });
    } finally {
      setClaiming(false);
    }
  }, [account, challenge, claiming, systemCalls]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="DAILY CHALLENGE"
        onBack={goBack}
        rightSlot={
          challenge && !challenge.settled ? (
            <CountdownPill endTime={challenge.end_time} />
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-[600px] flex-col gap-3 pb-8"
        >
          {/* Loading */}
          {challengeLoading && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900 p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Loading challenge...</span>
              </div>
            </motion.div>
          )}

          {/* No challenge */}
          {!challengeLoading && !challenge && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900/90 p-6 text-center border border-white/10"
            >
              <Calendar size={32} className="mx-auto text-slate-500 mb-3" />
              <p className="font-['Fredericka_the_Great'] text-white text-lg mb-1">
                No Active Challenge
              </p>
              <p className="text-sm text-slate-400">
                Check back later for the next daily challenge.
              </p>
            </motion.div>
          )}

          {/* Challenge Info Card */}
          {challenge && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900/90 p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/15 text-blue-300">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h2 className="font-['Fredericka_the_Great'] text-lg text-white">
                      Challenge #{challenge.challenge_id}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Settings #{challenge.settings_id}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-green-500/20 text-green-300"
                      : isEnded
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {isActive ? "ACTIVE" : isEnded ? "ENDED" : "SETTLED"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-black/30 p-2.5 text-center">
                  <Target size={14} className="mx-auto text-cyan-400 mb-1" />
                  <p className="text-xs text-slate-400">Metric</p>
                  <p className="font-['Fredericka_the_Great'] text-sm text-white">
                    {RANKING_METRIC_LABELS[challenge.ranking_metric] ?? "Score"}
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5 text-center">
                  <Users size={14} className="mx-auto text-purple-400 mb-1" />
                  <p className="text-xs text-slate-400">Entries</p>
                  <p className="font-['Fredericka_the_Great'] text-sm text-white">
                    {challenge.total_entries}
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5 text-center">
                  <Trophy size={14} className="mx-auto text-yellow-400" />
                  <p className="text-xs text-slate-400 mt-1">Prize Pool</p>
                  <p className="font-['Fredericka_the_Great'] text-sm text-yellow-200">
                    {prizePool.toString()}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Register Button */}
          {challenge && isActive && !isRegistered && account && (
            <motion.div variants={itemVariants}>
              <GameButton
                label={registering ? "REGISTERING..." : "REGISTER ENTRY"}
                variant="primary"
                loading={registering}
                disabled={registering}
                onClick={handleRegister}
              />
            </motion.div>
          )}

          {/* Player Entry Card */}
          {challenge && isRegistered && entry && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900/90 p-4 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Medal size={18} className="text-amber-300" />
                <h3 className="font-['Fredericka_the_Great'] text-base text-white">
                  Your Entry
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-black/30 p-2.5">
                  <p className="text-xs text-slate-400">Attempts</p>
                  <p className="font-['Fredericka_the_Great'] text-lg text-white">
                    {entry.attempts}
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5">
                  <p className="text-xs text-slate-400">Rank</p>
                  <p className="font-['Fredericka_the_Great'] text-lg text-white">
                    {entry.rank > 0 ? `#${entry.rank}` : "\u2014"}
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5">
                  <p className="text-xs text-slate-400">Best Score</p>
                  <p className="font-['Fredericka_the_Great'] text-lg text-white">
                    {entry.best_score}
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5">
                  <p className="text-xs text-slate-400">Best Level</p>
                  <p className="font-['Fredericka_the_Great'] text-lg text-white">
                    {entry.best_level}
                  </p>
                </div>
              </div>

              {canClaim && (
                <div className="mt-3">
                  <GameButton
                    label={
                      claiming
                        ? "CLAIMING..."
                        : `CLAIM PRIZE (${playerPrize.toString()} CUBES)`
                    }
                    variant="primary"
                    loading={claiming}
                    disabled={claiming}
                    onClick={handleClaimPrize}
                  />
                </div>
              )}

              {entry.claimed && (
                <p className="text-center text-xs text-green-400/70 mt-2">
                  Prize claimed
                </p>
              )}
            </motion.div>
          )}

          {/* Leaderboard */}
          {challenge && leaderboard.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-slate-900/90 p-4 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-yellow-400" />
                <h3 className="font-['Fredericka_the_Great'] text-base text-white">
                  Leaderboard
                </h3>
              </div>

              <div className="space-y-1">
                {leaderboard.slice(0, 25).map((le) => (
                  <div
                    key={le.rank}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      le.rank <= 3
                        ? "bg-yellow-500/10 border border-yellow-500/20"
                        : "bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-['Fredericka_the_Great'] text-sm w-7 ${
                          le.rank === 1
                            ? "text-yellow-300"
                            : le.rank === 2
                              ? "text-slate-300"
                              : le.rank === 3
                                ? "text-amber-600"
                                : "text-slate-500"
                        }`}
                      >
                        #{le.rank}
                      </span>
                      <span className="text-sm text-white truncate max-w-[160px]">
                        {le.playerName}
                      </span>
                    </div>
                    <span className="font-['Fredericka_the_Great'] text-sm text-cyan-200">
                      {le.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
