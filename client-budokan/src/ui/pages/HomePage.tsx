import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { THEME_META, loadThemeTemplate } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import ImageAssets from "@/ui/theme/ImageAssets";
import Connect from "@/ui/components/Connect";
import useViewport from "@/hooks/useViewport";

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const toAddressBigInt = (address: string | undefined): bigint | null => {
  if (!address) return null;
  try {
    return BigInt(address);
  } catch {
    return null;
  }
};

const ZONE_CONFIG = [
  { zoneId: 1, settingsId: 0, themeId: "theme-1" as const, name: "Polynesian" },
  { zoneId: 2, settingsId: 1, themeId: "theme-5" as const, name: "Feudal Japan" },
  { zoneId: 3, settingsId: 2, themeId: "theme-7" as const, name: "Ancient Persia" },
] as const;

const HomePage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { MapEntitlement, GameSettingsMetadata },
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { username } = useControllerUsername();
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeZone, setActiveZone] = useState(0);

  useEffect(() => {
    setThemeTemplate(loadThemeTemplate(), false);
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist, setThemeTemplate]);

  const shouldFetchMyGames = Boolean(account?.address);
  const normalizedOwner = normalizeAddress(account?.address);

  const { games: ownedGames } = useGameTokensSlot({
    owner: shouldFetchMyGames ? normalizedOwner : undefined,
    limit: shouldFetchMyGames ? 100 : 0,
  });

  const activeGames = useMemo(() => {
    if (!ownedGames?.length) return [];
    return ownedGames.filter((g) => !g.game_over);
  }, [ownedGames]);

  const ownerAddressAsBigInt = useMemo(
    () => toAddressBigInt(account?.address),
    [account?.address],
  );

  const mapEntitlements = useMemo(() => {
    if (!MapEntitlement || ownerAddressAsBigInt === null) return new Set<number>();
    try {
      const entities = Array.from(runQuery([Has(MapEntitlement)]));
      const owned = new Set<number>();
      for (const entity of entities) {
        const entitlement = getComponentValue(MapEntitlement, entity);
        if (!entitlement) continue;
        if (BigInt(entitlement.player) === ownerAddressAsBigInt) {
          owned.add(entitlement.settings_id);
        }
      }
      return owned;
    } catch {
      return new Set<number>();
    }
  }, [MapEntitlement, ownerAddressAsBigInt]);

  const mapMetadataById = useMemo(() => {
    if (!GameSettingsMetadata)
      return new Map<number, { is_free: boolean; enabled: boolean; price: bigint }>();
    try {
      const entities = Array.from(runQuery([Has(GameSettingsMetadata)]));
      const metadataMap = new Map<
        number,
        { is_free: boolean; enabled: boolean; price: bigint }
      >();
      for (const entity of entities) {
        const metadata = getComponentValue(GameSettingsMetadata, entity);
        if (!metadata) continue;
        metadataMap.set(metadata.settings_id, {
          is_free: metadata.is_free,
          enabled: metadata.enabled,
          price: BigInt(metadata.price),
        });
      }
      return metadataMap;
    } catch {
      return new Map<number, { is_free: boolean; enabled: boolean; price: bigint }>();
    }
  }, [GameSettingsMetadata]);

  const zone = ZONE_CONFIG[activeZone];
  const themeMeta = THEME_META[zone.themeId];

  const hasActiveRun = useMemo(() => {
    return activeGames.length > 0;
  }, [activeGames]);

  const activeRunTokenId = useMemo(() => {
    if (!activeGames.length) return null;
    return activeGames[0].token_id;
  }, [activeGames]);

  const handleStartGame = useCallback(
    async (settingsId: number) => {
      if (!account || isStartingGame) return;

      const settingsMeta = mapMetadataById.get(settingsId);
      const isFreeMap = settingsMeta?.is_free ?? settingsId === DEFAULT_SETTINGS_ID;
      const isEnabled = settingsMeta?.enabled ?? true;
      const isOwned = mapEntitlements.has(settingsId);

      if (!isEnabled) {
        showToast({ message: "This zone is currently disabled.", type: "error" });
        return;
      }

      if (!isFreeMap && !isOwned) {
        showToast({ message: "This zone is locked.", type: "error" });
        return;
      }

      setIsStartingGame(true);
      try {
        const mintResult = await freeMint({
          account,
          name: username ?? "",
          settingsId,
        });

        const gameId = mintResult.game_id;
        if (gameId === 0n) throw new Error("Failed to extract game_id from mint");

        await create({ account, token_id: gameId });

        showToast({ message: `Game started!`, type: "success" });
        navigate("map", gameId);
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
    [account, create, freeMint, isStartingGame, mapEntitlements, mapMetadataById, navigate, username],
  );

  const handleContinue = useCallback(() => {
    if (activeRunTokenId) {
      navigate("map", activeRunTokenId);
    }
  }, [activeRunTokenId, navigate]);

  const swipeZone = useCallback(
    (direction: number) => {
      setActiveZone((prev) =>
        Math.max(0, Math.min(ZONE_CONFIG.length - 1, prev + direction)),
      );
    },
    [],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={zone.themeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <img
              src={`/assets/${zone.themeId}/background.png`}
              alt={zone.name}
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 flex flex-1 flex-col">
          <div className="flex items-center justify-center pt-6 pb-2">
            <motion.img
              src={ImageAssets(zone.themeId).logo}
              alt="zKube"
              draggable={false}
              className="h-12 md:h-14 drop-shadow-2xl"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col justify-end px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => swipeZone(-1)}
                disabled={activeZone === 0}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/15 text-white disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex gap-2">
                {ZONE_CONFIG.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveZone(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activeZone ? "w-6 bg-white" : "w-2 bg-white/40"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => swipeZone(1)}
                disabled={activeZone === ZONE_CONFIG.length - 1}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 border border-white/15 text-white disabled:opacity-20 transition-opacity"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <motion.div
              layout
              className="backdrop-blur-xl bg-white/8 rounded-2xl border border-white/15 p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h1 className="font-['Fredericka_the_Great'] text-3xl text-white leading-tight">
                    {zone.name}
                  </h1>
                  <p className="text-sm text-white/60 mt-1 line-clamp-1">
                    {themeMeta.description.slice(0, 70)}
                  </p>
                </div>
                <span className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold tracking-wider bg-emerald-500/80 text-white border border-emerald-400/50">
                  FREE
                </span>
              </div>

              {!account ? (
                <Connect />
              ) : hasActiveRun ? (
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    className="flex-1 py-3.5 rounded-xl font-['Fredericka_the_Great'] text-lg tracking-wide bg-amber-500 hover:bg-amber-400 text-white transition-colors"
                  >
                    ▶ CONTINUE
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isStartingGame}
                    onClick={() => handleStartGame(zone.settingsId)}
                    className="px-5 py-3.5 rounded-xl font-['Fredericka_the_Great'] text-lg tracking-wide bg-slate-700 hover:bg-slate-600 text-white/80 transition-colors disabled:opacity-50"
                  >
                    NEW
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isStartingGame}
                  onClick={() => handleStartGame(zone.settingsId)}
                  className="w-full py-3.5 rounded-xl font-['Fredericka_the_Great'] text-lg tracking-wide bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50"
                >
                  {isStartingGame ? "STARTING..." : "▶  PLAY"}
                </motion.button>
              )}
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate("daily")}
              className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-md bg-white/6 border border-white/10 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20">
                  <Clock3 size={16} className="text-cyan-300" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">Daily Challenge</p>
                  <p className="text-xs text-white/50">Compete for stars</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-white/40" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
