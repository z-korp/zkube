import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerBestRun } from "@/hooks/usePlayerBestRun";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import Connect from "@/ui/components/Connect";
import ModePill from "@/ui/components/shared/ModePill";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

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

const containerVariants: any = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: any = {
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
  const selectedMode = useNavigationStore((s) => s.selectedMode);
  const setSelectedMode = useNavigationStore((s) => s.setSelectedMode);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeZone, setActiveZone] = useState(0);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones, totalStars } = useZoneProgress(account?.address, zStarBalance);

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
    if (!zone || !account) return;

    if (selectedMode === 0 && activeStoryAttemptId !== null) {
      navigate("play", activeStoryAttemptId);
      return;
    }

    if (selectedMode === 1 && activeEndlessGameId !== null) {
      navigate("map", activeEndlessGameId);
      return;
    }

    handleStartGame(zone.settingsId);
  }, [
    account,
    activeEndlessGameId,
    activeStoryAttemptId,
    handleStartGame,
    navigate,
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
              <motion.div variants={itemVariants} className="flex items-center justify-between rounded-2xl border border-white/[0.16] bg-white/[0.08] px-3 py-2 backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-sans text-sm font-black"
                    style={{
                      background: `linear-gradient(145deg, ${colors.accent}, ${colors.accent2})`,
                      color: "#0a1628",
                    }}
                  >
                    {(username || "PL").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[15px] font-bold text-white">{username || "Player"}</p>
                    <p className="font-sans text-[11px] font-semibold text-white/75">★ {totalStars} collected</p>
                  </div>
                </div>
                <span className="rounded-full border px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: colors.accent, borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}22` }}>
                  Connected
                </span>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => navigate("daily")}
                className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-white/[0.16] bg-white/[0.08] px-4 py-3 text-left shadow-lg backdrop-blur-xl"
              >
                <div className="pointer-events-none absolute inset-[-100%_0] w-[300%] animate-shimmer bg-gradient-to-r from-transparent via-white/[0.09] to-transparent bg-[length:50%_100%]" />
                <div className="relative z-10">
                    <p className="font-sans text-[13px] font-extrabold uppercase tracking-[0.08em]" style={{ color: colors.accent }}>
                      ⚡ Daily Challenge
                    </p>
                  <p className="mt-0.5 font-sans text-xs font-semibold text-white/80">
                    24h remaining · {Math.max(42, (ownedGames?.length ?? 0) * 3)} players
                  </p>
                </div>
                <span className="relative z-10 rounded-full px-3 py-1.5 font-sans text-xs font-extrabold uppercase tracking-[0.08em]" style={{ backgroundColor: colors.accent, color: "#0a1628" }}>
                  Play
                </span>
              </motion.button>

              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="ml-1 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">Select Zone</p>
                  <div className="w-[56%] min-w-[176px] max-w-[208px]">
                    <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />
                  </div>
                </div>

                {zones.length === 0 ? (
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
                        if (z.zoneId !== 1) statusText = "MVP soon";
                        else if (!endlessZoneOneUnlocked) statusText = "Beat Story Boss";
                        else statusText = `Best ${endlessBestScore.toLocaleString()}`;
                      }

                      return (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={z.settingsId}
                          type="button"
                          onClick={() => {
                            if (isSelectable) setActiveZone(idx);
                          }}
                          className="relative flex h-44 w-36 shrink-0 snap-center flex-col items-start justify-end overflow-hidden rounded-3xl border p-3 text-left"
                          style={{
                            borderColor: isSelected ? cardAccent : "rgba(255,255,255,0.18)",
                            opacity: isSelectable ? 1 : 0.58,
                            boxShadow: isSelected ? `0 0 22px ${cardAccent}55, inset 0 0 10px ${cardAccent}2A` : "0 10px 18px -8px rgba(0,0,0,0.6)",
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
                            <p className="font-sans text-xl font-extrabold leading-tight text-white drop-shadow-md">{z.name}</p>
                            <div className="mt-1 flex items-center justify-between">
                              <p className="font-sans text-[11px] font-bold" style={{ color: isEndlessMode ? "#FFCF9D" : "#FACC15" }}>
                                {statusText}
                              </p>
                              {!isSelectable && <span className="text-sm">🔒</span>}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
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
              <div className="mt-8">
                <Connect ctaLabel="PLAY NOW" />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <div className="relative z-20 mt-auto flex flex-col gap-2.5 px-4">
        {account ? (
          <>
            <ArcadeButton disabled={isStartingGame || !selectedZonePlayable} onClick={handlePrimaryAction}>
              {isStartingGame
                ? "Starting..."
                : selectedMode === 0
                  ? hasActiveStoryRun
                    ? "Resume Story"
                    : "Start Story"
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

            {selectedMode === 1 && zones.length > 0 && !selectedZonePlayable ? (
              <p className="text-center font-sans text-[11px] font-semibold text-white/75">
                {zone?.zoneId === 1
                  ? "Defeat Zone 1 Story boss to unlock Endless."
                  : "Only Endless Zone 1 is playable in the MVP."}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default HomePage;
