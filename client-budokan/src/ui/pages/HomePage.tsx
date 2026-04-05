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
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[72px] pt-8">
      <img
        src={getThemeImages(getThemeId(zones[activeZone]?.zoneId ?? 1)).background}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
        draggable={false}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(5, 10, 18, 0.55) 0%, rgba(5, 10, 18, 0.2) 35%, rgba(5, 10, 18, 0.6) 100%)`,
        }}
      />

      <div className="relative z-10 mb-6 text-center">
        <motion.img
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          src={getThemeImages(getThemeId(zone?.zoneId ?? 1)).logo}
          alt="zKube"
          className="mx-auto h-28 md:h-32 drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]"
          draggable={false}
        />
      </div>

      <div className="mx-2 mt-1 rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-sm p-3 overflow-y-auto flex-1 min-h-0">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 space-y-4 pb-2 hide-scrollbar"
        >
          <motion.div variants={itemVariants}>
            {account ? (
              <div
                className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 shadow-lg shadow-black/20 backdrop-blur-xl ring-1 ring-white/[0.06]"
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
              <div
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 shadow-lg shadow-black/20 backdrop-blur-xl"
              >
                <Connect />
              </div>
            )}
          </motion.div>

          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => navigate("daily")}
              className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-lg shadow-black/20"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}26, ${colors.accent}1A)`,
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
            <p
              className="mb-2.5 ml-1 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-white/60"
            >
              Select Zone
            </p>

            <div className="space-y-2.5">
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
                    className="flex w-full items-center justify-between rounded-2xl border px-3.5 py-3.5 text-left transition-all duration-300"
                    style={{
                      backgroundColor: isSelectable ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                      borderColor: isSelected ? colors.accent : isSelectable ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                      opacity: isSelectable ? 1 : 0.5,
                      boxShadow: isSelected ? `0 0 20px ${colors.accent}33, inset 0 0 10px ${colors.accent}1A` : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <img
                          src={getThemeImages(getThemeId(z.zoneId)).themeIcon}
                          alt={z.name}
                          className="h-10 w-10 rounded-xl object-cover shadow-md"
                          draggable={false}
                        />
                        {isSelected && (
                          <div className="absolute inset-0 rounded-xl ring-2 ring-inset" style={{ borderColor: colors.accent }} />
                        )}
                      </div>
                      <div>
                        <p className="font-display text-[14px] font-bold tracking-wide text-white">
                          {z.name}
                        </p>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 3 }).map((_, i) => {
                            const isFilled = z.stars > i * 10;
                            return (
                              <span
                                key={i}
                                className="text-[11px] transition-colors"
                                style={{ 
                                  color: isFilled ? "#FACC15" : "rgba(255,255,255,0.6)",
                                  textShadow: isFilled ? "0 0 6px rgba(250,204,21,0.6)" : "none"
                                }}
                              >
                                ★
                              </span>
                            );
                          })}
                          <span className="ml-1.5 font-sans text-[10px] font-medium text-white/60">
                            {z.stars}/30
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-lg transition-transform" style={{ 
                      color: isSelectable ? colors.accent : "rgba(255,255,255,0.6)",
                      transform: isSelected ? "translateX(2px)" : "none"
                    }}>
                      {isSelectable ? "→" : "🔒"}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />
          </motion.div>
        </motion.div>
      </div>

      <div className="relative z-20 mt-2 flex flex-col gap-2.5 px-4">
        {account && hasActiveRun ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 font-display text-[15px] font-bold tracking-[0.1em] shadow-lg shadow-black/20 backdrop-blur-md"
            style={{
              backgroundColor: `${colors.accent}1A`,
              borderColor: `${colors.accent}4D`,
              color: colors.accent,
            }}
          >
            <Play size={16} strokeWidth={2.5} />
            CONTINUE
          </motion.button>
        ) : null}

        {account && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={isStartingGame || !zone}
            onClick={() => zone && handleStartGame(zone.settingsId)}
            className="flex w-full items-center justify-center rounded-2xl px-4 py-4 font-display text-[17px] font-black tracking-[0.12em] shadow-xl disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}E6)`,
              color: "#0a1628",
              boxShadow: `0 8px 20px -4px ${colors.accent}66, inset 0 2px 0 rgba(255,255,255,0.4)`,
            }}
          >
            {isStartingGame ? "STARTING..." : "NEW GAME"}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default HomePage;
