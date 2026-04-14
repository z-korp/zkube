import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { hash } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { useActiveDailyAttempt } from "@/hooks/useActiveDailyAttempt";
import { getThemeColors, getThemeId, getThemeImages } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { getMutatorDef } from "@/config/mutatorConfig";
import { ZONE_NAMES } from "@/config/profileData";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";
import { motion } from "motion/react";
import { normalizeAddress } from "@/hooks/useGetUsernames";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";
import TierContext from "@/ui/components/rewards/TierContext";
import { DAILY_DAILY_REWARD_TIERS } from "@/config/rewardTiers";

const TROPHY_IMAGES: Record<number, string> = {
  1: "/assets/common/trophies/gold.png",
  2: "/assets/common/trophies/silver.png",
  3: "/assets/common/trophies/bronze.png",
};

/** Compute today's daily zone from day_id — mirrors contract logic */
const computeDailyZoneId = (dayId: number): number => {
  const DAILY_CHALLENGE_FELT = BigInt(
    Array.from("DAILY_CHALLENGE").reduce((acc, c) => (acc << 8n) | BigInt(c.charCodeAt(0)), 0n),
  );
  const seed = BigInt(hash.computePoseidonHashOnElements([BigInt(dayId), DAILY_CHALLENGE_FELT]));
  const seedU256 = seed < 0n ? seed + (1n << 256n) : seed;
  return Number((seedU256 % 10n) + 1n);
};

const CountdownText: React.FC<{ endTime: number }> = ({ endTime }) => {
  const [sec, setSec] = useState(() =>
    Math.max(0, endTime - Math.floor(Date.now() / 1000)),
  );
  useEffect(() => {
    const id = window.setInterval(() => {
      setSec(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [endTime]);

  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");

  return <>{sec > 0 ? `${h}:${m}:${s}` : "ENDED"}</>;
};

const DailyChallengePage: React.FC = () => {
  const { account } = useAccountCustom();
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const setMapZoneId = useNavigationStore((state) => state.setMapZoneId);
  const setIsDailyMap = useNavigationStore((state) => state.setIsDailyMap);
  const {
    setup: { systemCalls },
  } = useDojo();
  const activeDailyRun = useActiveDailyAttempt();

  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entry, isRegistered } = usePlayerEntry(
    challenge?.challenge_id,
    account?.address,
  );
  const { entries: leaderboard } = useDailyLeaderboard(
    challenge?.challenge_id,
  );

  const [starting, setStarting] = useState(false);

  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const todayDayId = Math.floor(now / 86400);
  const isActiveDailyFromToday = activeDailyRun ? activeDailyRun.challengeId === todayDayId : false;
  const isActive =
    challenge &&
    !challenge.settled &&
    challenge.start_time <= now &&
    challenge.end_time > now;

  const zoneId = challenge?.zone_id ?? computeDailyZoneId(todayDayId);
  const zoneName = ZONE_NAMES[zoneId] ?? `Zone ${zoneId}`;
  const themeId = getThemeId(zoneId);
  const zoneImages = getThemeImages(themeId);
  const zoneColors = getThemeColors(themeId);
  const guardian = getZoneGuardian(zoneId);

  const activeMutator = challenge?.active_mutator_id
    ? getMutatorDef(challenge.active_mutator_id)
    : null;
  const passiveMutator = challenge?.passive_mutator_id
    ? getMutatorDef(challenge.passive_mutator_id)
    : null;

  const starReward = entry?.star_reward ? BigInt(entry.star_reward) : 0n;

  const playerRank = useMemo(() => {
    if (!account?.address || !leaderboard.length) return null;
    const normalized = normalizeAddress(account.address);
    return leaderboard.find((e) => normalizeAddress(e.player) === normalized) ?? null;
  }, [account?.address, leaderboard]);

  const handlePlay = useCallback(async () => {
    if (!account || starting) return;

    // If there's an active daily game from today, resume it
    if (activeDailyRun && isActiveDailyFromToday) {
      const dailyZone = challenge?.zone_id ?? computeDailyZoneId(todayDayId);
      setMapZoneId(dailyZone);
      setIsDailyMap(true);
      navigate("map", activeDailyRun.gameId);
      return;
    }

    setStarting(true);
    try {
      // If there's a stale daily run from a previous day, surrender it first
      if (activeDailyRun && !isActiveDailyFromToday) {
        await systemCalls.surrender({ account, game_id: activeDailyRun.gameId });
      }

      // Start a new daily game, then go to map
      const result = await systemCalls.startDailyGame({ account });
      if (result.game_id !== 0n) {
        // Use computed zone for today (contract may not be synced yet)
        const dailyZone = computeDailyZoneId(todayDayId);
        setMapZoneId(dailyZone);
        setIsDailyMap(true);
        // Brief wait for Torii to index the new game
        await new Promise((r) => setTimeout(r, 1500));
        navigate("map", result.game_id);
      }
    } finally {
      setStarting(false);
    }
  }, [account, starting, systemCalls, navigate, setMapZoneId, setIsDailyMap, zoneId, activeDailyRun, isActiveDailyFromToday]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,18,0.12)_0%,rgba(5,10,18,0.05)_45%,rgba(5,10,18,0.56)_100%)]" />

      <div className="relative z-10 flex min-h-10 items-center justify-center px-6 pb-2">
        <div className="absolute left-6 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center">
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] shadow-lg backdrop-blur-md transition-all hover:bg-white/[0.08] active:scale-95"
          >
            <ChevronLeft size={20} className="text-white/80" />
          </button>
        </div>
        <h1 className="text-center font-display text-2xl font-bold tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
          Daily Challenge
        </h1>
      </div>

      <div className="relative z-10 mx-4 mt-4 flex flex-1 min-h-0 flex-col overflow-y-auto hide-scrollbar pb-3">
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-4">
          {challengeLoading && (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: colors.accent }} />
            </div>
          )}

          {!challengeLoading && !challenge && (
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.06] p-6 text-center backdrop-blur-xl">
              <img
                src={getGuardianPortrait(zoneId)}
                alt={guardian.name}
                className="mx-auto mb-3 h-24 w-24 rounded-2xl object-cover"
                style={{ border: `2px solid ${zoneColors.accent}44`, boxShadow: `0 0 20px ${zoneColors.accent}22` }}
                draggable={false}
              />
              <p className="font-display text-xl font-black text-white">{guardian.name}</p>
              <p className="font-sans text-[11px] font-semibold" style={{ color: zoneColors.accent }}>{guardian.title}</p>
              <p className="mt-2 font-sans text-sm text-white/60">
                No challenge yet. Be the first to play today!
              </p>
            </div>
          )}

          {challenge && (
            <>
              {/* Guardian panel — portrait, greeting, mutators, countdown */}
              <div
                className="relative overflow-hidden rounded-2xl border-2"
                style={{
                  borderColor: `${zoneColors.accent}35`,
                  boxShadow: `0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 ${zoneColors.accent}15`,
                }}
              >
                <img src={zoneImages.background} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/85" />
              <div className="relative z-10 px-4 pb-4 pt-3">
                {/* Header — portrait + name + countdown */}
                <div className="flex items-center gap-3">
                  <img
                    src={getGuardianPortrait(zoneId)}
                    alt={guardian.name}
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    style={{ border: `2px solid ${zoneColors.accent}44`, boxShadow: `0 0 16px ${zoneColors.accent}22` }}
                    draggable={false}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-black text-white">{guardian.name}</span>
                      <span className="rounded-full px-2 py-0.5 font-sans text-[9px] font-bold uppercase" style={{ color: zoneColors.accent, background: `${zoneColors.accent}18` }}>
                        {guardian.title}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="font-sans text-[11px] font-semibold text-white/50">
                        {zoneName} · {challenge.total_entries} player{challenge.total_entries !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="shrink-0 rounded-full px-3 py-1.5 font-sans text-xs font-bold tabular-nums text-white" style={{ background: zoneColors.accent }}>
                      <CountdownText endTime={challenge.end_time} />
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-red-500 px-3 py-1.5 font-sans text-xs font-bold text-white">ENDED</span>
                  )}
                </div>

                {/* Greeting */}
                <p className="mt-2.5 font-sans text-[14px] italic text-white/60">"{guardian.dailyGreeting}"</p>

                {/* Mutators */}
                {(activeMutator || passiveMutator) && (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {activeMutator && activeMutator.id !== 0 && (
                      <p className="font-sans text-[14px] leading-relaxed text-white">
                        {activeMutator.icon} <span className="font-semibold" style={{ color: zoneColors.accent }}>{activeMutator.name}</span>{" "}
                        {activeMutator.description}
                      </p>
                    )}
                    {passiveMutator && passiveMutator.id !== 0 && (
                      <p className="font-sans text-[14px] leading-relaxed text-white">
                        {passiveMutator.icon} <span className="font-semibold" style={{ color: zoneColors.accent }}>{passiveMutator.name}</span>{" "}
                        {passiveMutator.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              </div>

              {/* Your Position — same as rewards tab */}
              {playerRank && (
                <TierContext
                  colors={zoneColors}
                  myRank={playerRank.rank}
                  myScore={playerRank.totalStars ?? 0}
                  myName={playerRank.playerName ?? "You"}
                  totalEntries={leaderboard.length}
                  tiers={DAILY_REWARD_TIERS}
                  entries={leaderboard.map((e) => ({ rank: e.rank, score: e.totalStars ?? 0, name: e.playerName ?? e.player.slice(0, 8) }))}
                  scoreLabel="★"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Play button */}
      {account && !challengeLoading && (isActive || !challenge) && (
        <div className="relative z-20 mt-auto px-4 pb-3">
          <ArcadeButton disabled={starting} onClick={handlePlay} accentOverride={zoneColors.accent}>
            {starting ? "Starting..." : isActiveDailyFromToday ? "Resume Daily" : "Play Daily"}
          </ArcadeButton>
        </div>
      )}
    </div>
  );
};

export default DailyChallengePage;
