import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";

import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { getThemeColors, getThemeId, getThemeImages, type ThemeId } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { usePlayerEntry } from "@/hooks/usePlayerEntry";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { ZONE_NAMES, getLevelFromXp, getTitleForLevel, type ZoneProgressData } from "@/config/profileData";
import { ZONE_GUARDIANS, getGuardianPortrait } from "@/config/bossCharacters";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import Connect from "@/ui/components/Connect";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";
import UnlockModal from "@/ui/components/profile/UnlockModal";

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
  const s = remaining % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

// Block cell size — total grid is 8 cells wide
const CELLS = 8;

// Generate a random line that sums to 8 cells
function generateLine(): number[] {
  const blocks: number[] = [];
  let remaining = CELLS;
  while (remaining > 0) {
    const maxSize = Math.min(4, remaining);
    const size = Math.floor(Math.random() * maxSize) + 1;
    blocks.push(size);
    remaining -= size;
  }
  return blocks;
}


const CtaGuardian: React.FC = () => {
  const guardianIds = Object.keys(ZONE_GUARDIANS).map(Number);
  const randomIdx = Math.floor(Date.now() / 60000) % guardianIds.length;
  const gZoneId = guardianIds[randomIdx];
  const g = ZONE_GUARDIANS[gZoneId];
  const gThemeId = `theme-${gZoneId}` as ThemeId;
  const gImages = getThemeImages(gThemeId);
  const gColors = getThemeColors(gThemeId);

  const blockSrcs: Record<number, string> = {
    1: gImages.block1, 2: gImages.block2, 3: gImages.block3, 4: gImages.block4,
  };

  // Generate lines of blocks — each line sums to 8 cells
  const fallingLines = useMemo(() => {
    const slotCount = 6;   // rhythm slots per cycle
    const lineCount = 5;   // skip the t=0 slot so no block flashes at its start position on first paint
    const lineDuration = 5;
    const lineSpacing = 2.2; // spaced so fastest block clears before slowest of next arrives
    const totalCycle = slotCount * lineSpacing;
    return Array.from({ length: lineCount }).map((_, lineIdx) => {
      const sizes = generateLine();
      let cellOffset = 0;
      // Speed tiers — shuffled per line, bounded range so lines don't collide
      const speedPool = [0.85, 0.95, 1.0, 1.1, 1.2, 1.3, 1.15, 1.05];
      const blocks = sizes.map((size, bi) => {
        const x = cellOffset;
        cellOffset += size;
        return { size, cellX: x, speed: speedPool[(bi + lineIdx * 3) % speedPool.length] };
      });
      return {
        blocks,
        delay: (lineIdx + 1) * lineSpacing,
        duration: lineDuration,
        totalCycle,
      };
    });
  }, [gZoneId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      variants={itemVariants}
      className="relative mx-auto mt-2 flex max-w-[360px] flex-col items-center gap-4"
    >
      {/* Guardian portrait in a circle */}
      <div
        className="relative h-36 w-36 overflow-hidden rounded-full guardian-pulse"
        style={{
          border: `3px solid ${gColors.accent}44`,
          boxShadow: `0 0 30px ${gColors.accent}22`,
        }}
      >
        <img
          src={getGuardianPortrait(gZoneId)}
          alt={g.name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Catchphrase */}
      <p className="text-center font-sans text-[14px] italic text-white/50">
        "{g.greeting}"
      </p>

      {/* Falling lines — full rows that break apart with gravity */}
      <div
        className="relative w-full flex-1 min-h-[140px] overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      >
        {fallingLines.map((line, li) =>
          line.blocks.map((b, bi) => {
            const cellPct = 100 / CELLS;
            return (
              <img
                key={`${li}-${bi}`}
                src={blockSrcs[b.size]}
                alt=""
                className="absolute top-0"
                style={{
                  left: `${b.cellX * cellPct}%`,
                  width: `${b.size * cellPct}%`,
                  aspectRatio: `${b.size} / 1`,
                  // `backwards` fill-mode keeps the block in its 0% keyframe
                  // state (translateY(-20px); opacity 0) during the delay,
                  // otherwise it flashes at its static top position on first paint.
                  animation: `fallingBlock ${line.totalCycle / b.speed}s ease-in ${line.delay}s infinite backwards`,
                }}
                draggable={false}
              />
            );
          }),
        )}
      </div>
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { startRun },
    },
  } = useDojo();
  const { username } = useControllerUsername();
  const { themeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const mapZoneId = useNavigationStore((s) => s.mapZoneId);
  const setMapZoneId = useNavigationStore((s) => s.setMapZoneId);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isDailySelected, setIsDailySelected] = useState(false);
  const [unlockZone, setUnlockZone] = useState<ZoneProgressData | null>(null);
  const { playerMeta } = usePlayerMeta(account?.address);
  const playerLevel = getLevelFromXp(playerMeta?.lifetimeXp ?? 0);
  const playerTitle = getTitleForLevel(playerLevel);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones: rawZones, totalStars, isLoading: zonesLoading } = useZoneProgress(account?.address, zStarBalance);
  const zones = useMemo(() =>
    [...rawZones].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.zoneId - b.zoneId; // stable tiebreaker
    }),
    [rawZones],
  );
  const activeZone = useMemo(() => {
    const idx = zones.findIndex((z) => z.zoneId === mapZoneId);
    return idx >= 0 ? idx : 0;
  }, [zones, mapZoneId]);
  const setActiveZone = useCallback((idx: number) => {
    const z = zones[idx];
    if (z) setMapZoneId(z.zoneId);
    setIsDailySelected(false);
  }, [zones, setMapZoneId]);
  const { challenge, isLoading: challengeLoading } = useCurrentChallenge();
  const { entry: dailyEntry, isRegistered: hasPlayedDaily } = usePlayerEntry(
    challenge?.challenge_id,
    account?.address,
  );
  const { entries: dailyEntries } = useDailyLeaderboard(challenge?.challenge_id);
  const dailyCountdown = useDailyCountdown(challenge?.end_time);
  const dailyZoneName = challenge?.zone_id ? (ZONE_NAMES[challenge.zone_id] ?? null) : null;
  const dailyMyRank = useMemo(() => {
    if (!account?.address || !dailyEntries.length) return null;
    const norm = account.address.toLowerCase();
    const found = dailyEntries.find((e) => e.player.toLowerCase() === norm);
    return found?.rank ?? null;
  }, [dailyEntries, account?.address]);
  const dailyMyReward = useMemo(() => {
    if (!dailyMyRank || !dailyEntries.length) return 0;
    const pct = ((dailyMyRank - 1) * 100) / dailyEntries.length;
    if (pct < 2) return 10;
    if (pct < 5) return 7;
    if (pct < 10) return 5;
    if (pct < 25) return 3;
    if (pct < 50) return 1;
    return 0;
  }, [dailyMyRank, dailyEntries.length]);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  const activeStoryRun = useActiveStoryAttempt();

  const activeStoryAttemptId = activeStoryRun?.gameId ?? null;

  const isZoneSelectable = useCallback(
    (zoneData: (typeof zones)[number] | undefined) => {
      if (!zoneData) return false;
      return zoneData.unlocked;
    },
    [],
  );

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
      startRun,
      isStartingGame,
      navigate,
      setMapZoneId,
      zones,
      activeStoryAttemptId,
    ],
  );

  const hasActiveStoryRun = activeStoryAttemptId !== null;
  const selectedZonePlayable = isZoneSelectable(zone);

  const handlePrimaryAction = useCallback(() => {
    if (!account || !zone) return;

    if (activeStoryAttemptId !== null) {
      // Use the active run's zone, not the selected zone card
      setMapZoneId(activeStoryRun!.zoneId);
      navigate("play", activeStoryAttemptId);
    } else {
      setMapZoneId(zone.zoneId);
      navigate("map");
    }
  }, [
    account,
    activeStoryAttemptId,
    activeStoryRun,
    navigate,
    setMapZoneId,
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

              <motion.div variants={itemVariants} className="space-y-2">
                {zonesLoading || zones.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.14] bg-white/[0.12] p-4 text-center font-sans text-sm font-semibold text-white/80 backdrop-blur-xl">
                    Loading zones...
                  </div>
                ) : (
                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 hide-scrollbar">
                    {zones.map((z, idx) => {
                      const isSelectable = z.unlocked;
                      const isSelected = !isDailySelected && idx === activeZone && isSelectable;

                      const statusText = !z.unlocked && !z.isFree
                        ? (z.starCost ?? 0) > 0
                          ? `${z.starCost} ★ to unlock`
                          : "Locked"
                        : `${z.stars}/${z.maxStars} ★`;

                      return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          key={z.settingsId}
                          type="button"
                          onClick={() => {
                            if (isSelectable) {
                              setActiveZone(idx);
                            } else if (!z.unlocked && !z.isFree) {
                              setUnlockZone(z);
                            }
                          }}
                          className="relative flex h-[clamp(8rem,22vw,11rem)] w-[clamp(6.5rem,17vw,9rem)] shrink-0 snap-center flex-col items-start justify-end overflow-hidden rounded-2xl p-2 text-left"
                          style={{
                            border: isSelected ? `2px solid ${colors.accent}` : "1px solid rgba(255,255,255,0.18)",
                            opacity: isSelectable ? 1 : 0.58,
                            boxShadow: isSelected ? `0 0 16px ${colors.accent}66, 0 0 4px ${colors.accent}44` : "0 10px 18px -8px rgba(0,0,0,0.6)",
                          }}
                        >
                          <img
                            src={getThemeImages(getThemeId(z.zoneId)).themeIcon}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                          <div className="relative z-10 w-full">
                            <span
                              className="mb-1 inline-flex rounded-full px-2 py-0.5 font-sans text-[9px] font-extrabold uppercase tracking-[0.12em]"
                              style={{
                                color: "#0a1628",
                                backgroundColor: colors.accent,
                              }}
                            >
                              Story
                            </span>
                            <p className="font-sans text-base font-extrabold leading-tight text-white drop-shadow-md">{z.name}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="font-sans text-[11px] font-bold" style={{ color: "#FACC15" }}>
                                {statusText}
                              </p>
                              {!isSelectable && <span className="text-sm">🔒</span>}
                            </div>
                            {z.unlocked && z.maxStars > 0 && (
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
                <button
                  type="button"
                  onClick={() => setIsDailySelected((prev) => !prev)}
                  className="relative w-full overflow-hidden rounded-2xl text-left transition-all"
                  style={{
                    border: isDailySelected
                      ? `2px solid ${challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : colors.accent}`
                      : "1px solid rgba(255,255,255,0.16)",
                    boxShadow: isDailySelected
                      ? `0 0 16px ${challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : colors.accent}66, 0 0 4px ${challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : colors.accent}44`
                      : "none",
                  }}
                >
                  {challenge?.zone_id ? (
                    <img
                      src={getThemeImages(getThemeId(challenge.zone_id)).background}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${colors.accent}33, ${colors.accent2}22)` }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
                  <div className="relative z-10 px-4 py-3">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : colors.accent }}>
                      Daily Challenge
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <div>
                        <p className="font-sans text-sm font-bold text-white">
                          {dailyZoneName ?? "Daily Challenge"}
                        </p>
                        <p className="font-sans text-[11px] text-white/60">
                          {challengeLoading
                            ? "Loading..."
                            : !challenge
                              ? "Be the first to play today!"
                              : hasPlayedDaily && dailyMyRank
                                ? `#${dailyMyRank}/${dailyEntries.length}${dailyMyReward > 0 ? ` · Projected +${dailyMyReward}★` : ""}`
                                : `${challenge.total_entries ?? 0} player${(challenge.total_entries ?? 0) !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      {dailyCountdown ? (
                        <span className="rounded-full px-3 py-1.5 font-sans text-xs font-bold tabular-nums text-white" style={{ background: challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : colors.accent }}>
                          {dailyCountdown}
                        </span>
                      ) : challenge ? (
                        <span className="rounded-full bg-red-500 px-3 py-1.5 font-sans text-xs font-bold text-white">ENDED</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </motion.div>
            </>
          ) : (
            <CtaGuardian />
          )}
        </motion.div>
      </div>

      <div className="relative z-20 mt-auto flex flex-col gap-2.5 px-4 pb-3">
        {!account ? (
          <Connect ctaLabel="PLAY NOW" />
        ) : (
          <>
            {isDailySelected ? (
              <ArcadeButton
                onClick={() => navigate("daily")}
                accentOverride={challenge?.zone_id ? getThemeColors(getThemeId(challenge.zone_id)).accent : undefined}
              >
                Go to Daily
              </ArcadeButton>
            ) : (
              <ArcadeButton disabled={isStartingGame || !selectedZonePlayable} onClick={handlePrimaryAction} accentOverride={
                hasActiveStoryRun && activeStoryRun
                  ? getThemeColors(getThemeId(activeStoryRun.zoneId)).accent
                  : zone ? getThemeColors(getThemeId(zone.zoneId)).accent : undefined
              }>
                {isStartingGame
                  ? "Starting..."
                  : hasActiveStoryRun
                    ? "Resume Story"
                    : "Play Story"}
              </ArcadeButton>
            )}
          </>
        )}
      </div>

      {unlockZone && <UnlockModal colors={colors} zone={unlockZone} onClose={() => setUnlockZone(null)} />}
    </div>
  );
};

export default HomePage;
