import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Has, getComponentValue, runQuery } from "@dojoengine/recs";

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
      <AnimatePresence mode="wait">
        <motion.div
          key={zone.themeId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={`/assets/${zone.themeId}/background.png`}
            alt={zone.name}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-1 flex-col min-h-0">
        <div className="flex items-center justify-center pt-4 shrink-0">
          <motion.img
            src={ImageAssets(zone.themeId).logo}
            alt="zKube"
            draggable={false}
            className="h-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="flex-1 min-h-0" />

        <div className="shrink-0 px-4 pb-2 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => swipeZone(-1)}
              disabled={activeZone === 0}
              className="w-10 h-10 flex items-center justify-center disabled:opacity-0 transition-opacity"
            >
              <img
                src="/assets/common/icons/icon-close.png"
                alt="prev"
                className="h-5 w-5 rotate-90 brightness-200"
                draggable={false}
              />
            </button>
            <div className="flex gap-2.5">
              {ZONE_CONFIG.map((z, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveZone(idx)}
                  className="transition-all"
                >
                  <img
                    src={ImageAssets(z.themeId).themeIcon}
                    alt={z.name}
                    className={`rounded-lg border-2 transition-all ${
                      idx === activeZone
                        ? "w-10 h-10 border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                        : "w-8 h-8 border-white/20 opacity-50 saturate-50"
                    }`}
                    draggable={false}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => swipeZone(1)}
              disabled={activeZone === ZONE_CONFIG.length - 1}
              className="w-10 h-10 flex items-center justify-center disabled:opacity-0 transition-opacity"
            >
              <img
                src="/assets/common/icons/icon-close.png"
                alt="next"
                className="h-5 w-5 -rotate-90 brightness-200"
                draggable={false}
              />
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: "url(/assets/common/panels/panel-glass.png)",
                backgroundSize: "100% 100%",
              }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" />
            <div className="relative z-10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="font-['Fredericka_the_Great'] text-2xl text-white drop-shadow-lg">
                  {zone.name}
                </h1>
                <img
                  src={`/assets/${zone.themeId}/theme-icon.png`}
                  alt=""
                  className="h-9 w-9 rounded-lg border border-white/30 shadow-lg"
                  draggable={false}
                />
              </div>

              {!account ? (
                <Connect />
              ) : hasActiveRun ? (
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleContinue}
                    className="flex-1 relative h-14 flex items-center justify-center overflow-hidden rounded-lg"
                  >
                    <img
                      src="/assets/common/buttons/btn-orange.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill"
                      draggable={false}
                    />
                    <span className="relative z-10 font-['Fredericka_the_Great'] text-lg text-white drop-shadow-md tracking-wide">
                      CONTINUE
                    </span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={isStartingGame}
                    onClick={() => handleStartGame(zone.settingsId)}
                    className="relative h-14 w-20 flex items-center justify-center overflow-hidden rounded-lg disabled:opacity-50"
                  >
                    <img
                      src="/assets/common/buttons/btn-green.png"
                      alt=""
                      className="absolute inset-0 w-full h-full object-fill"
                      draggable={false}
                    />
                    <span className="relative z-10 font-['Fredericka_the_Great'] text-sm text-white drop-shadow-md">
                      NEW
                    </span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  disabled={isStartingGame}
                  onClick={() => handleStartGame(zone.settingsId)}
                  className="relative w-full h-14 flex items-center justify-center overflow-hidden rounded-lg disabled:opacity-50"
                >
                  <img
                    src="/assets/common/buttons/btn-green.png"
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill"
                    draggable={false}
                  />
                  <span className="relative z-10 font-['Fredericka_the_Great'] text-xl text-white drop-shadow-md tracking-wider">
                    {isStartingGame ? "STARTING..." : "▶  PLAY"}
                  </span>
                </motion.button>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("daily")}
            className="relative rounded-lg overflow-hidden flex items-center justify-between"
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: "url(/assets/common/panels/panel-dark.png)",
                backgroundSize: "100% 100%",
              }}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative z-10 flex items-center gap-3 p-3 w-full">
              <img
                src="/assets/common/icons/icon-star-filled.png"
                alt=""
                className="h-7 w-7 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]"
                draggable={false}
              />
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-white leading-tight">Daily Challenge</p>
                <p className="text-[11px] text-white/50">Compete for stars</p>
              </div>
              <img
                src="/assets/common/icons/icon-score.png"
                alt=""
                className="h-5 w-5 opacity-40"
                draggable={false}
              />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
