import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";

import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { getThemeColors, getThemeImages, loadThemeTemplate, type ThemeId } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useZStarBalance } from "@/hooks/useZStarBalance";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import Connect from "@/ui/components/Connect";
import { Play } from "lucide-react";
import ModePill from "@/ui/components/shared/ModePill";

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
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const HomePage: React.FC = () => {
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { ActiveStoryGame },
      systemCalls: { freeMint, create, startRun },
    },
  } = useDojo();
  const { username } = useControllerUsername();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const selectedMode = useNavigationStore((s) => s.selectedMode);
  const setSelectedMode = useNavigationStore((s) => s.setSelectedMode);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeZone, setActiveZone] = useState(0);
  const { balance: zStarBalance } = useZStarBalance(account?.address);
  const { zones, totalStars } = useZoneProgress(account?.address, zStarBalance);

  useEffect(() => {
    setThemeTemplate(loadThemeTemplate(), false);
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist, setThemeTemplate]);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);
  const ownerBigInt = useMemo(() => {
    if (!account?.address) return null;
    try {
      return BigInt(account.address);
    } catch {
      return null;
    }
  }, [account?.address]);

  const { games: ownedGames } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
  });

  const activeGames = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.filter((g) => !g.game_over);
  }, [ownedGames]);

  const activeStoryGameEntityIds = useEntityQuery([Has(ActiveStoryGame)]);
  const activeStoryGameId = useMemo(() => {
    if (ownerBigInt === null) return null;
    for (const entity of activeStoryGameEntityIds) {
      const active = getComponentValue(ActiveStoryGame, entity);
      if (!active) continue;
      if (BigInt(active.player) !== ownerBigInt) continue;
      const gameId = BigInt(active.game_id ?? 0);
      if (gameId !== 0n) return gameId;
    }
    return null;
  }, [ownerBigInt, activeStoryGameEntityIds, ActiveStoryGame]);

  const zone = zones[activeZone] ?? zones[0];
  const colors = getThemeColors(themeTemplate);

  const hasActiveRun = useMemo(() => {
    if (selectedMode === 1) return activeGames.length > 0;
    return activeStoryGameId !== null;
  }, [activeGames, selectedMode, activeStoryGameId]);

  const activeRunTokenId = useMemo(() => {
    if (!activeGames.length) return null;
    return activeGames[0].token_id;
  }, [activeGames]);

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

            // Endless settings are odd IDs (zone1 -> 1, zone2 -> 3, ...)
            const endlessSettingsId = selectedZone.zoneId * 2 - 1;
            const mintResult = await freeMint({ account, name: username ?? "", settingsId: endlessSettingsId });
            const gameId = mintResult.game_id;
            if (gameId === 0n) throw new Error("Failed to extract game_id from mint");
            await create({ account, token_id: gameId, mode: selectedMode });
            showToast({ message: "Game started!", type: "success" });
            navigate("mutator", gameId);
            return;
          }

          // Story mode: resume existing active story game instead of failing on start_run.
          if (activeStoryGameId) {
            showToast({ message: "Resuming active story run.", type: "success" });
            navigate("map", activeStoryGameId);
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
      activeStoryGameId,
    ],
  );

  const handleContinue = useCallback(() => {
    if (selectedMode === 1 && activeRunTokenId) {
      navigate("map", activeRunTokenId);
      return;
    }
    if (selectedMode === 0 && activeStoryGameId) {
      navigate("map", activeStoryGameId);
    }
  }, [selectedMode, activeRunTokenId, activeStoryGameId, navigate]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <img
        src={getThemeImages(getThemeId(zones[activeZone]?.zoneId ?? 1)).background}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(5, 10, 18, 0.4) 0%, rgba(5, 10, 18, 0) 35%, rgba(5, 10, 18, 0.8) 100%)`,
        }}
      />

      <div className="relative z-10 mb-6 text-center">
        <motion.img
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          src={getThemeImages(getThemeId(zone?.zoneId ?? 1)).logo}
          alt="zKube"
          className="mx-auto h-32 md:h-40 drop-shadow-[0_0_32px_rgba(255,255,255,0.4)]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 flex flex-1 min-h-0 flex-col px-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 space-y-4 overflow-y-auto hide-scrollbar pb-4"
        >
          <motion.div variants={itemVariants}>
            {account ? (
              <div
                className="flex items-center justify-between rounded-2xl border border-white/[0.12] bg-black/40 p-3 shadow-lg backdrop-blur-xl"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-black shadow-inner"
                    style={{
                      background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent})`,
                      color: "#0a1628",
                    }}
                  >
                    {(username || "PL").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate font-sans text-[14px] font-bold tracking-wide text-white"
                    >
                      {username || "Player"}
                    </p>
                    <p className="font-sans text-[11px] font-medium text-white/60">
                      <span className="text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">★</span> {totalStars} collected
                    </p>
                  </div>
                </div>
                <span
                  className="shrink-0 rounded-lg px-2.5 py-1 font-sans text-[10px] font-bold tracking-wider"
                  style={{
                    color: colors.accent,
                    backgroundColor: `${colors.accent}1A`,
                    border: `1px solid ${colors.accent}33`,
                  }}
                >
                  CONNECTED
                </span>
              </div>
            ) : (
              <div className="mx-auto mt-[18vh] max-w-[280px] text-center">
                <p className="font-display text-2xl font-bold tracking-[0.08em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]">
                  Match. Clear. Conquer.
                </p>
                <p className="mt-3 font-sans text-sm text-white/70">
                  Connect your account to unlock Story Mode and daily challenges.
                </p>
              </div>
            )}
          </motion.div>

          {account && (
            <>
              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => navigate("daily")}
                  className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-lg shadow-black/20 backdrop-blur-xl"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderColor: `${colors.accent}4D`,
                  }}
                >
                  <div className="pointer-events-none absolute inset-[-100%_0] w-[300%] animate-shimmer bg-gradient-to-r from-transparent via-white/[0.07] to-transparent bg-[length:50%_100%]" />
                  <div className="relative z-10">
                    <p className="font-display text-[13px] font-bold tracking-[0.08em]" style={{ color: colors.accent }}>
                      <span className="mr-1 inline-block animate-pulse">⚡</span> DAILY CHALLENGE
                    </p>
                    <p className="mt-0.5 font-sans text-[11px] font-medium text-white/60">
                      24h remaining · {Math.max(42, (ownedGames?.length ?? 0) * 3)} players
                    </p>
                  </div>
                  <span
                    className="relative z-10 rounded-xl px-3.5 py-1.5 font-display text-[11px] font-bold tracking-wider shadow-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: colors.accent, color: "#0a1628" }}
                  >
                    PLAY
                  </span>
                </motion.button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <p className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Select Zone
                  </p>
                  <div className="w-1/2 max-w-[140px]">
                    <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />
                  </div>
                </div>

                <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {zones.map((z, idx) => {
                    const isSelectable = z.unlocked;
                    const isSelected = idx === activeZone && isSelectable;
                    return (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={z.settingsId}
                        type="button"
                        onClick={() => {
                          if (isSelectable) setActiveZone(idx);
                        }}
                        className="relative flex h-40 w-32 shrink-0 snap-center snap-always flex-col items-start justify-end overflow-hidden rounded-3xl border p-3 text-left shadow-xl transition-all duration-300"
                        style={{
                          borderColor: isSelected ? colors.accent : "rgba(255,255,255,0.1)",
                          opacity: isSelectable ? 1 : 0.6,
                          boxShadow: isSelected ? `0 0 24px ${colors.accent}40, inset 0 0 12px ${colors.accent}20` : "0 8px 16px -4px rgba(0,0,0,0.5)",
                        }}
                      >
                        <img
                          src={getThemeImages(getThemeId(z.zoneId)).themeIcon}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        
                        <div className="relative z-10 w-full">
                          <p className="font-display text-[15px] font-bold leading-tight tracking-wide text-white drop-shadow-md">
                            {z.name}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 3 }).map((_, i) => {
                                const isFilled = z.stars > i * 10;
                                return (
                                  <span
                                    key={i}
                                    className="text-[10px] drop-shadow-sm"
                                    style={{ color: isFilled ? "#FACC15" : "rgba(255,255,255,0.4)" }}
                                  >
                                    ★
                                  </span>
                                );
                              })}
                            </div>
                            {!isSelectable && <span className="text-xs">🔒</span>}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>

      <div className="relative z-20 mt-auto flex flex-col gap-3 px-4">
        {account && hasActiveRun ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-4 font-display text-[16px] font-bold tracking-[0.1em] shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: `${colors.accent}26`,
              borderColor: `${colors.accent}66`,
              color: colors.accent,
              boxShadow: `0 4px 20px ${colors.accent}33`,
            }}
          >
            <Play size={18} strokeWidth={2.5} />
            CONTINUE RUN
          </motion.button>
        ) : null}

        {account ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isStartingGame || !zone}
            onClick={() => zone && handleStartGame(zone.settingsId)}
            className="flex w-full items-center justify-center rounded-2xl px-4 py-[18px] font-display text-[18px] font-black tracking-[0.12em] shadow-xl disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}E6)`,
              color: "#0a1628",
              boxShadow: `0 8px 24px -4px ${colors.accent}80, inset 0 2px 0 rgba(255,255,255,0.4)`,
            }}
          >
            {isStartingGame ? "STARTING..." : "NEW GAME"}
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <Connect />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
