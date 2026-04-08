import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";

import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerBestRun } from "@/hooks/usePlayerBestRun";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { ZONE_NAMES, getLevelFromXp, getTitleForLevel, type ZoneProgressData } from "@/config/profileData";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import { BookOpen, Infinity as InfinityIcon, Zap } from "lucide-react";
import Connect from "@/ui/components/Connect";
import ModePill from "@/ui/components/shared/ModePill";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";
import UnlockModal from "@/ui/components/profile/UnlockModal";

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const getThemeId = (zoneId: number): ThemeId => {
  const normalized = Math.min(10, Math.max(1, zoneId));
  return `theme-${normalized}` as ThemeId;
};

const useDailyCountdown = (endTime: number | undefined) => {
  const [remaining, setRemaining] = useState(() =>
    endTime ? Math.max(0, endTime - Math.floor(Date.now() / 1000)) : 0,
  );

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setRemaining(Math.max(0, endTime - Math.floor(Date.now() / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endTime]);

  if (!endTime || remaining <= 0) return null;
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  return `${h}h ${m}m remaining`;
};

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const HomePage: React.FC = () => {
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { freeMint, create, startRun },
    },
  } = useDojo();
  const { username } = useControllerUsername();
  const { themeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const setMapZoneId = useNavigationStore((s) => s.setMapZoneId);
  const selectedMode = useNavigationStore((s) => s.selectedMode);
  const setSelectedMode = useNavigationStore((s) => s.setSelectedMode);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeZone, setActiveZone] = useState(0);
  const [unlockZone, setUnlockZone] = useState<ZoneProgressData | null>(null);
  const { playerMeta } = usePlayerMeta(account?.address);
  const playerLevel = getLevelFromXp(playerMeta?.lifetimeXp ?? 0);
  const playerTitle = getTitleForLevel(playerLevel);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones, totalStars } = useZoneProgress(account?.address, zStarBalance);
  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entry: dailyEntry, isRegistered: hasPlayedDaily } = usePlayerEntry(
    challenge?.challenge_id,
    account?.address,
  );
  const dailyCountdown = useDailyCountdown(challenge?.end_time);
  const dailyZoneName = challenge?.zone_id ? (ZONE_NAMES[challenge.zone_id] ?? null) : null;

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);
  const activeStoryRun = useActiveStoryAttempt();

  const { games: ownedGames } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
  });

  const activeGames = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.filter((g) => !g.game_over);
  }, [ownedGames]);

  const { bestRuns } = usePlayerBestRun(account?.address);

  const activeStoryAttemptId = activeStoryRun?.gameId ?? null;
  const activeEndlessGameId = activeGames[0]?.token_id ?? null;
  const endlessZoneOneUnlocked = Boolean(zones.find((zoneData) => zoneData.zoneId === 1)?.bossCleared);

  const isZoneSelectable = useCallback(
    (zoneData: (typeof zones)[number] | undefined) => {
      if (!zoneData) return false;
      if (selectedMode === 0) return zoneData.unlocked;
      return zoneData.unlocked && zoneData.zoneId === 1 && endlessZoneOneUnlocked;
    },
    [endlessZoneOneUnlocked, selectedMode],
  );

  useEffect(() => {
    if (!zones.length) return;
    if (isZoneSelectable(zones[activeZone])) return;
    const firstSelectableIndex = zones.findIndex((zoneData) => isZoneSelectable(zoneData));
    setActiveZone(firstSelectableIndex >= 0 ? firstSelectableIndex : 0);
  }, [activeZone, isZoneSelectable, zones]);

  const zone = zones[activeZone] ?? zones[0];
  const colors = getThemeColors(themeTemplate);

  const handleStartGame = useCallback(
    async (settingsId: number) => {
      if (!account || isStartingGame) return;

      const selectedZone = zones.find((zoneData) => zoneData.settingsId === settingsId);
      if (!selectedZone) {
        showToast({ message: "Zone data is still loading.", type: "error" });
        return;
      }

      if (!selectedZone.unlocked) {
        showToast({ message: "This zone is locked.", type: "error" });
        return;
      }

        setIsStartingGame(true);
        try {
          if (selectedMode === 1) {
            if (selectedZone.zoneId !== 1) {
              showToast({
                message: "Only Endless Zone 1 is enabled in the MVP.",
                type: "error",
              });
              return;
            }

            if (!selectedZone.bossCleared) {
              showToast({
                message: "Beat Story Zone 1 boss to unlock Endless.",
                type: "error",
              });
              return;
            }

            // Endless settings are odd IDs (zone1 -> 1, zone2 -> 3, ...)
            const endlessSettingsId = selectedZone.zoneId * 2 - 1;
            const mintResult = await freeMint({ account, name: username ?? "", settingsId: endlessSettingsId });
            const gameId = mintResult.game_id;
            if (gameId === 0n) throw new Error("Failed to extract game_id from mint");
            await create({ account, token_id: gameId, run_type: selectedMode });
            showToast({ message: "Game started!", type: "success" });
            navigate("mutator", gameId);
            return;
          }

          // Story mode: resume existing active story game instead of failing on start_story_attempt.
          if (activeStoryAttemptId) {
            showToast({ message: "Resuming active story run.", type: "success" });
            setMapZoneId(selectedZone.zoneId);
            navigate("map", activeStoryAttemptId);
            return;
          }

          const result = await startRun({ account, zone_id: selectedZone.zoneId });
          const gameId = result.game_id;
          if (gameId === 0n) throw new Error("Failed to start story run");
          showToast({ message: "Story run started.", type: "success" });
          navigate("play", gameId);
        } catch (error) {
        console.error("Error starting game:", error);
        showToast({
          message: "Failed to start game.",
          type: "error",
        });
      } finally {
        setIsStartingGame(false);
      }
    },
    [
      account,
      create,
      freeMint,
      startRun,
      isStartingGame,
      navigate,
      setMapZoneId,
      selectedMode,
      zones,
      username,
      activeStoryAttemptId,
    ],
  );

  const hasActiveStoryRun = activeStoryAttemptId !== null;
  const hasActiveEndlessRun = activeEndlessGameId !== null;
  const selectedZonePlayable = isZoneSelectable(zone);

  const handlePrimaryAction = useCallback(() => {
    if (!account) return;

    // Daily mode
    if (selectedMode === 2) {
      navigate("daily");
      return;
    }

    if (!zone) return;

    // Story mode — always go to map
    if (selectedMode === 0) {
      setMapZoneId(zone.zoneId);
      if (activeStoryAttemptId !== null) {
        navigate("map", activeStoryAttemptId);
      } else {
        navigate("map");
      }
      return;
    }

    // Endless mode
    if (selectedMode === 1 && activeEndlessGameId !== null) {
      navigate("play", activeEndlessGameId);
      return;
    }

    handleStartGame(zone.settingsId);
  }, [
    account,
    activeEndlessGameId,
    activeStoryAttemptId,
    handleStartGame,
    navigate,
    setMapZoneId,
    selectedMode,
    zone,
  ]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,18,0.12)_0%,rgba(5,10,18,0.05)_45%,rgba(5,10,18,0.56)_100%)]" />

      <div className="relative z-10 mb-1 text-center">
        <motion.img
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          src={getThemeImages(themeTemplate).logo}
          alt="zKube"
          className="mx-auto h-32 md:h-44 drop-shadow-[0_0_28px_rgba(255,255,255,0.42)]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4">
        <motion.div
          key="home-container"
          variants={containerVariants}
          initial={false}
          animate="show"
          className="flex-1 space-y-3 overflow-y-auto pb-3"
        >
          {account ? (
            <>
              <motion.div variants={itemVariants} className="flex items-center justify-between rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3 py-1.5 backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-sans text-sm font-black"
                    style={{
                      background: `linear-gradient(145deg, ${colors.accent}, ${colors.accent2})`,
                      color: "#0a1628",
                    }}
                  >
                    {playerLevel}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[15px] font-bold text-white">{username || "Player"}</p>
                    <p className="font-sans text-[11px] font-semibold text-white/75">{playerTitle}</p>
                  </div>
                </div>
                <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: colors.accent, borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}22` }}>
                  Connected
                </span>
              </motion.div>

              <motion.div variants={itemVariants} className="my-1 flex items-center gap-2">
                <div className="flex-1 border-t border-white/[0.06]" />
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Choose Your Mode</span>
                <div className="flex-1 border-t border-white/[0.06]" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                {selectedMode === 2 ? (
                  <div className="rounded-2xl border border-white/[0.16] bg-white/[0.08] px-4 py-4 backdrop-blur-xl">
                    <p className="font-sans text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: colors.accent }}>
                      Today's Challenge{dailyZoneName && <span className="ml-1.5 text-[10px] font-bold text-white/60">· {dailyZoneName}</span>}
                    </p>
                    <p className="mt-1 font-sans text-xs font-semibold text-white/80">
                      {challengeLoading
                        ? "Loading..."
                        : !challenge
                          ? "Be the first to play today!"
                          : hasPlayedDaily && dailyEntry
                            ? `Your best: ${dailyEntry.best_score?.toLocaleString() ?? 0}${dailyEntry.rank > 0 ? ` · Rank #${dailyEntry.rank}` : ""}${dailyCountdown ? ` · ${dailyCountdown}` : ""}`
                            : `${dailyCountdown ?? "Challenge ended"} · ${challenge.total_entries ?? 0} player${(challenge.total_entries ?? 0) !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                ) : zones.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.14] bg-white/[0.12] p-4 text-center font-sans text-sm font-semibold text-white/80 backdrop-blur-xl">
                    Loading zones...
                  </div>
                ) : (
                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {zones.map((z, idx) => {
                      const isEndlessMode = selectedMode === 1;
                      const endlessSettingsId = z.zoneId * 2 - 1;
                      const endlessBestScore = bestRuns.get(`${endlessSettingsId}-1`)?.bestScore ?? 0;
                      const isSelectable = isEndlessMode
                        ? z.unlocked && z.zoneId === 1 && endlessZoneOneUnlocked
                        : z.unlocked;
                      const isSelected = idx === activeZone && isSelectable;
                      const cardAccent = isEndlessMode ? "#FFB86B" : colors.accent;

                      let statusText = `${z.stars}/${z.maxStars} ★`;
                      if (isEndlessMode) {
                        if (!z.unlocked) statusText = "Unlock Story";
                        else if (!z.bossCleared) statusText = "Beat Boss";
                        else statusText = `Best ${endlessBestScore.toLocaleString()}`;
                      } else if (!z.unlocked && !z.isFree) {
                        statusText = (z.starCost ?? 0) > 0
                          ? `${z.starCost} ★ to unlock`
                          : "Locked";
                      }

                      return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={z.settingsId}
                          type="button"
                          onClick={() => {
                            if (isSelectable) {
                              setActiveZone(idx);
                            } else if (!z.unlocked && !z.isFree && selectedMode === 0) {
                              setUnlockZone(z);
                            }
                          }}
                          className="relative flex h-[clamp(8rem,22vw,11rem)] w-[clamp(6.5rem,17vw,9rem)] shrink-0 snap-center flex-col items-start justify-end overflow-hidden rounded-2xl p-2 text-left"
                          style={{
                            border: isSelected ? `2px solid ${cardAccent}` : "1px solid rgba(255,255,255,0.18)",
                            opacity: isSelectable ? 1 : 0.58,
                            boxShadow: isSelected ? `0 0 16px ${cardAccent}66, 0 0 4px ${cardAccent}44` : "0 10px 18px -8px rgba(0,0,0,0.6)",
                          }}
                        >
                          <img
                            src={getThemeImages(getThemeId(z.zoneId)).themeIcon}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          {isEndlessMode ? <div className="absolute inset-0 bg-gradient-to-t from-[#2f1300]/90 via-[#341700]/45 to-transparent" /> : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="relative z-10 w-full">
                            <span
                              className="mb-1 inline-flex rounded-full px-2 py-0.5 font-sans text-[9px] font-extrabold uppercase tracking-[0.12em]"
                              style={{
                                color: isEndlessMode ? "#241100" : "#0a1628",
                                backgroundColor: isEndlessMode ? "#FFB86B" : colors.accent,
                              }}
                            >
                              {isEndlessMode ? "Endless" : "Story"}
                            </span>
                            <p className="font-sans text-base font-extrabold leading-tight text-white drop-shadow-md">{z.name}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="font-sans text-[11px] font-bold" style={{ color: isEndlessMode ? "#FFCF9D" : "#FACC15" }}>
                                {statusText}
                              </p>
                              {!isSelectable && <span className="text-sm">🔒</span>}
                            </div>
                            {!isEndlessMode && z.unlocked && z.maxStars > 0 && (
                              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${(z.stars / z.maxStars) * 100}%`, backgroundColor: colors.accent }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="my-1 flex items-center gap-2">
                <div className="flex-1 border-t border-white/[0.06]" />
                <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">Tournament</span>
                <div className="flex-1 border-t border-white/[0.06]" />
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-center backdrop-blur-xl">
                  <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">Coming Soon</p>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div variants={itemVariants} className="mx-auto mt-[16vh] max-w-[340px] rounded-2xl border border-white/[0.16] bg-white/[0.08] px-5 py-7 text-center backdrop-blur-xl">
              <p className="font-sans text-3xl font-black leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
                Match. Clear. Conquer.
              </p>
              <p className="mt-3 font-sans text-base font-semibold text-white/85">
                Master the grid, defeat the zone bosses, and survive the endless arena.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 text-left">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={16} className="shrink-0 text-white/50" />
                  <p className="font-sans text-[13px] font-semibold text-white/70">10 themed zones with boss battles</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <InfinityIcon size={16} className="shrink-0 text-white/50" />
                  <p className="font-sans text-[13px] font-semibold text-white/70">Endless mode with weekly leaderboards</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap size={16} className="shrink-0 text-white/50" />
                  <p className="font-sans text-[13px] font-semibold text-white/70">Daily challenges with star rewards</p>
                </div>
              </div>
              {challenge && (
                <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-center">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">Today's Daily</p>
                  <p className="mt-0.5 font-sans text-xs font-semibold text-white/60">
                    {challenge.total_entries} player{(challenge.total_entries ?? 0) !== 1 ? "s" : ""} competing
                  </p>
                </div>
              )}
              <div className="mt-6">
                <Connect ctaLabel="PLAY NOW" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="relative z-20 mt-auto flex flex-col gap-2.5 px-4 pb-3">
        {account ? (
          <>
            <ArcadeButton disabled={isStartingGame || (selectedMode === 2 ? (!challenge || challengeLoading) : !selectedZonePlayable)} onClick={handlePrimaryAction}>
              {isStartingGame
                ? "Starting..."
                : selectedMode === 2
                  ? "Go to Daily"
                  : selectedMode === 0
                    ? hasActiveStoryRun
                      ? "Resume Story"
                      : "Play Story"
                    : hasActiveEndlessRun
                      ? "Resume Endless"
                      : "Play Endless"}
            </ArcadeButton>

            {selectedMode === 1 && hasActiveEndlessRun ? (
              <button
                type="button"
                onClick={() => zone && handleStartGame(zone.settingsId)}
                disabled={isStartingGame || !selectedZonePlayable}
                className="w-full rounded-2xl border border-white/[0.16] bg-white/[0.08] px-4 py-2.5 font-sans text-xs font-extrabold uppercase tracking-[0.1em] text-white/90 backdrop-blur-xl disabled:cursor-not-allowed disabled:opacity-55"
              >
                Start New Endless
              </button>
            ) : null}

            {selectedMode === 1 && zones.length > 0 && !selectedZonePlayable && endlessZoneOneUnlocked ? (
              <p className="text-center font-sans text-[11px] font-semibold text-white/75">
                Only Endless Zone 1 is playable for now.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {unlockZone && <UnlockModal colors={colors} zone={unlockZone} onClose={() => setUnlockZone(null)} />}
    </div>
  );
};

export default HomePage;
