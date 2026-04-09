import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { hash } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { useActiveDailyAttempt } from "@/hooks/useActiveDailyAttempt";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { getMutatorDef } from "@/config/mutatorConfig";
import { ZONE_NAMES } from "@/config/profileData";
import { getZoneGuardian } from "@/config/bossCharacters";
import { motion } from "motion/react";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

const TROPHY_IMAGES: Record<number, string> = {
  1: "/assets/trophies/gold.png",
  2: "/assets/trophies/silver.png",
  3: "/assets/trophies/bronze.png",
};

const parseCompositeValue = (value: number): { stars: number; score: number } => {
  const stars = Math.floor(value / 0x100000000);
  const score = value % 0x100000000;
  return { stars, score };
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

const getThemeId = (zoneId: number): ThemeId => {
  const normalized = Math.min(10, Math.max(1, zoneId));
  return `theme-${normalized}` as ThemeId;
};

const CountdownPill: React.FC<{ endTime: number; accent: string }> = ({ endTime, accent }) => {
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

  return (
    <div
      className="rounded-full border px-3 py-1 font-sans text-xs font-bold tabular-nums"
      style={{ borderColor: `${accent}55`, backgroundColor: `${accent}18`, color: accent }}
    >
      {sec > 0 ? `${h}:${m}:${s}` : "ENDED"}
    </div>
  );
};

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
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
        <div className="mx-auto flex w-full max-w-[500px] flex-col gap-4">
          {challengeLoading && (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin" style={{ color: colors.accent }} />
            </div>
          )}

          {!challengeLoading && !challenge && (
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-6 text-center backdrop-blur-xl">
              <p className="mb-2 font-display text-xl text-white">No Challenge Yet</p>
              <p className="font-sans text-sm text-white/60">
                Be the first to play today! A new challenge will be generated automatically.
              </p>
            </div>
          )}

          {challenge && (
            <>
              {/* Zone hero */}
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.12]">
                <img
                  src={zoneImages.background}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
                <div className="relative z-10 flex items-end justify-between p-4">
                  <div>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: zoneColors.accent }}>
                      {new Date(challenge.start_time * 1000).toLocaleDateString(navigator.language, { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    <p className="font-display text-2xl font-black text-white">{zoneName}</p>
                    <p className="font-sans text-xs font-semibold text-white/60">
                      {challenge.total_entries} player{challenge.total_entries !== 1 ? "s" : ""} competing
                    </p>
                  </div>
                  {isActive && <CountdownPill endTime={challenge.end_time} accent={zoneColors.accent} />}
                </div>
              </div>

              {/* Guardian */}
              <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
                <p className="font-sans text-[12px] italic text-white/70 leading-relaxed">
                  "{guardian.greeting}"
                </p>
                <p className="mt-1 text-right font-sans text-[10px] font-bold" style={{ color: zoneColors.accent }}>
                  — {guardian.name}, {guardian.title}
                </p>
              </div>

              {/* Mutators */}
              {(activeMutator?.id || passiveMutator?.id) ? (
                <div className="space-y-2">
                  {activeMutator && activeMutator.id !== 0 && (
                    <div className="rounded-xl border border-orange-400/20 bg-orange-500/8 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{activeMutator.icon}</span>
                        <p className="font-sans text-sm font-bold text-orange-300">{activeMutator.name}</p>
                        <span className="rounded-full bg-orange-500/20 px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-orange-300/80">Active</span>
                      </div>
                      <p className="mt-1 font-sans text-xs text-white/60">{activeMutator.description}</p>
                      {activeMutator.effects.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {activeMutator.effects.map((e) => (
                            <span key={e} className="rounded-full bg-orange-500/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-orange-200/70">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {passiveMutator && passiveMutator.id !== 0 && (
                    <div className="rounded-xl border border-purple-400/20 bg-purple-500/8 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{passiveMutator.icon}</span>
                        <p className="font-sans text-sm font-bold text-purple-300">{passiveMutator.name}</p>
                        <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 font-sans text-[9px] font-bold uppercase text-purple-300/80">Passive</span>
                      </div>
                      <p className="mt-1 font-sans text-xs text-white/60">{passiveMutator.description}</p>
                      {passiveMutator.effects.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {passiveMutator.effects.map((e) => (
                            <span key={e} className="rounded-full bg-purple-500/10 px-2 py-0.5 font-sans text-[10px] font-semibold text-purple-200/70">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Player result */}
              {isRegistered && entry && (
                <div className="rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 backdrop-blur-xl">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Your Result</p>
                  <div className="mt-1 flex items-baseline justify-between">
                    <p className="font-sans text-lg font-bold" style={{ color: zoneColors.accent }}>
                      {entry.best_score?.toLocaleString() ?? 0}
                      <span className="ml-1.5 text-xs text-white/50">pts</span>
                    </p>
                    <div className="flex items-center gap-3">
                      {entry.best_stars > 0 && (
                        <span className="font-sans text-xs font-semibold text-yellow-300">
                          {"★".repeat(entry.best_stars)}
                        </span>
                      )}
                      <span className="rounded-full border px-2 py-0.5 font-sans text-xs font-bold" style={{ borderColor: `${zoneColors.accent}55`, color: zoneColors.accent }}>
                        {playerRank ? `#${playerRank.rank}` : entry.rank > 0 ? `#${entry.rank}` : "—"}
                      </span>
                    </div>
                  </div>
                  {entry.attempts > 1 && (
                    <p className="mt-0.5 font-sans text-[10px] text-white/40">{entry.attempts} attempts</p>
                  )}
                  {starReward > 0n && (
                    <p className="mt-1 font-sans text-xs font-semibold text-yellow-300">
                      Star Reward: {starReward.toString()}★
                    </p>
                  )}
                </div>
              )}

              {/* Leaderboard */}
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
                <p className="mb-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
                  Leaderboard
                </p>
                {leaderboard.length === 0 ? (
                  <p className="py-2 text-center font-sans text-xs text-white/40">No entries yet</p>
                ) : (
                  <div className="space-y-0">
                    {leaderboard.slice(0, 10).map((le, idx) => {
                      const isPlayer = account?.address && normalizeAddress(le.player) === normalizeAddress(account.address);
                      return (
                        <div
                          key={le.rank}
                          className="flex items-center justify-between py-1.5"
                          style={{
                            borderTop: idx > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                            backgroundColor: isPlayer ? `${zoneColors.accent}0D` : "transparent",
                            borderRadius: isPlayer ? 8 : 0,
                            padding: isPlayer ? "6px 8px" : undefined,
                            margin: isPlayer ? "2px -8px" : undefined,
                          }}
                        >
                          <span className="flex items-center gap-2 font-sans text-xs font-medium text-white">
                            {TROPHY_IMAGES[le.rank] ? (
                              <img src={TROPHY_IMAGES[le.rank]} alt="" className="h-5 w-5 drop-shadow-md" draggable={false} />
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center font-sans text-[10px] font-bold text-white/40">
                                {le.rank}
                              </span>
                            )}
                            <span style={{ color: isPlayer ? zoneColors.accent : undefined, fontWeight: isPlayer ? 700 : 500 }}>
                              {le.playerName}{isPlayer ? " (You)" : ""}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 font-sans text-xs font-bold tabular-nums" style={{ color: zoneColors.accent }}>
                            <span className="text-yellow-300">{"★".repeat(parseCompositeValue(le.value).stars)}</span>
                            <span>{parseCompositeValue(le.value).score.toLocaleString()}</span>
                          </span>
                        </div>
                      );
                    })}
                    {leaderboard.length > 10 && playerRank && playerRank.rank > 10 && (
                      <>
                        <div className="py-1 text-center font-sans text-[10px] text-white/30">···</div>
                        <div
                          className="flex items-center justify-between rounded-lg py-1.5 px-2"
                          style={{ backgroundColor: `${zoneColors.accent}0D` }}
                        >
                          <span className="flex items-center gap-2 font-sans text-xs font-bold" style={{ color: zoneColors.accent }}>
                            <span className="flex h-5 w-5 items-center justify-center font-sans text-[10px] font-bold">
                              {playerRank.rank}
                            </span>
                            {playerRank.playerName} (You)
                          </span>
                          <span className="font-sans text-xs font-bold tabular-nums" style={{ color: zoneColors.accent }}>
                            {playerRank.value.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Play button */}
      {account && !challengeLoading && (isActive || !challenge) && (
        <div className="relative z-20 mt-auto px-4 pb-3">
          <ArcadeButton disabled={starting} onClick={handlePlay}>
            {starting ? "Starting..." : isActiveDailyFromToday ? "Resume Daily" : "Play Daily"}
          </ArcadeButton>
        </div>
      )}
    </div>
  );
};

export default DailyChallengePage;
