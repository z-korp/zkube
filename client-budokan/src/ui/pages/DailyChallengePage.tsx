import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
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
import GameButton from "@/ui/components/shared/GameButton";

const RANKING_METRIC_LABELS: Record<number, string> = {
  0: "Score",
  1: "Level",
  2: "Cubes Earned",
};

const CountdownRing: React.FC<{ endTime: number }> = ({ endTime }) => {
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

  const dayTotal = 24 * 3600;
  const progress = sec / dayTotal;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="88" height="88" className="-rotate-90">
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-['Chakra_Petch'] text-lg text-cyan-200 leading-none">
          {sec > 0 ? formatted : "Ended"}
        </span>
        <span className="text-[10px] text-slate-400 mt-0.5">remaining</span>
      </div>
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          onClick={goBack}
          className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-['Chakra_Petch'] text-lg text-white">
          Daily Challenge
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex w-full max-w-[500px] flex-col gap-3">
          {challengeLoading && (
            <div className="rounded-xl bg-slate-900/80 p-8 text-center border border-white/10">
              <Loader2 size={24} className="animate-spin text-slate-400 mx-auto" />
            </div>
          )}

          {!challengeLoading && !challenge && (
            <div className="rounded-xl bg-slate-900/80 p-8 text-center border border-white/10">
              <Clock3 size={32} className="mx-auto text-slate-500 mb-3" />
              <p className="font-['Chakra_Petch'] text-white text-lg mb-1">
                No Active Challenge
              </p>
              <p className="text-sm text-slate-400">
                Check back later for the next daily challenge.
              </p>
            </div>
          )}

          {challenge && (
            <>
              <div className="rounded-xl bg-slate-900/80 border border-white/10 p-5 flex flex-col items-center">
                {isActive && <CountdownRing endTime={challenge.end_time} />}

                <div className="grid grid-cols-3 gap-3 w-full mt-4">
                  <div className="rounded-lg bg-black/30 p-2.5 text-center">
                    <Target size={14} className="mx-auto text-cyan-400 mb-1" />
                    <p className="text-[10px] text-slate-400">Metric</p>
                    <p className="font-['Chakra_Petch'] text-sm text-white">
                      {RANKING_METRIC_LABELS[challenge.ranking_metric] ?? "Score"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/30 p-2.5 text-center">
                    <Users size={14} className="mx-auto text-purple-400 mb-1" />
                    <p className="text-[10px] text-slate-400">Entries</p>
                    <p className="font-['Chakra_Petch'] text-sm text-white">
                      {challenge.total_entries}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/30 p-2.5 text-center">
                    <Trophy size={14} className="mx-auto text-yellow-400" />
                    <p className="text-[10px] text-slate-400 mt-1">Prize</p>
                    <p className="font-['Chakra_Petch'] text-sm text-yellow-200">
                      {prizePool.toString()}
                    </p>
                  </div>
                </div>
              </div>

              {isActive && !isRegistered && account && (
                <GameButton
                  label={registering ? "REGISTERING..." : "PLAY DAILY"}
                  variant="primary"
                  loading={registering}
                  disabled={registering}
                  onClick={handleRegister}
                />
              )}

              {isRegistered && entry && (
                <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Medal size={16} className="text-amber-300" />
                    <span className="font-['Chakra_Petch'] text-sm text-white">
                      Your Entry
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-black/30 p-2.5">
                      <p className="text-[10px] text-slate-400">Attempts</p>
                      <p className="font-['Chakra_Petch'] text-lg text-white">
                        {entry.attempts}
                      </p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2.5">
                      <p className="text-[10px] text-slate-400">Rank</p>
                      <p className="font-['Chakra_Petch'] text-lg text-white">
                        {entry.rank > 0 ? `#${entry.rank}` : "\u2014"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2.5">
                      <p className="text-[10px] text-slate-400">Best Score</p>
                      <p className="font-['Chakra_Petch'] text-lg text-white">
                        {entry.best_score}
                      </p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2.5">
                      <p className="text-[10px] text-slate-400">Best Level</p>
                      <p className="font-['Chakra_Petch'] text-lg text-white">
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
                            : `CLAIM PRIZE (${playerPrize.toString()})`
                        }
                        variant="primary"
                        loading={claiming}
                        disabled={claiming}
                        onClick={handleClaimPrize}
                      />
                    </div>
                  )}
                </div>
              )}

              {leaderboard.length > 0 && (
                <div className="rounded-xl bg-slate-900/80 border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} className="text-yellow-400" />
                    <span className="font-['Chakra_Petch'] text-sm text-white">
                      Top 10
                    </span>
                  </div>
                  <div className="space-y-1">
                    {leaderboard.slice(0, 10).map((le) => (
                      <div
                        key={le.rank}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                          le.rank <= 3
                            ? "bg-yellow-500/10 border border-yellow-500/15"
                            : "bg-black/15"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-['Chakra_Petch'] text-sm w-7 ${
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
                          <span className="text-sm text-white truncate max-w-[140px]">
                            {le.playerName}
                          </span>
                        </div>
                        <span className="font-['Chakra_Petch'] text-sm text-cyan-200">
                          {le.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyChallengePage;
