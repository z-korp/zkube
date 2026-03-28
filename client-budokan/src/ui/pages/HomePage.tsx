import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useAccount } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { THEME_META, loadThemeTemplate } from "@/config/themes";
import { ChevronLeft, ChevronRight, Gamepad2, Calendar, Trophy } from "lucide-react";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import ImageAssets from "@/ui/theme/ImageAssets";
import TopBar from "@/ui/navigation/TopBar";
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

const MAP_CARD_CONFIG = [
  {
    settingsId: 0,
    label: "FREE",
    themeName: THEME_META["theme-1"].name,
  },
  {
    settingsId: 1,
    label: "PAID",
    themeName: THEME_META["theme-5"].name,
  },
  {
    settingsId: 2,
    label: "PAID",
    themeName: THEME_META["theme-7"].name,
  },
] as const;

const MAP_THEME_IDS = [1, 5, 7] as const;

function getMapStatus(
  map: typeof MAP_CARD_CONFIG[number],
  metadataById: Map<number, { is_free: boolean; enabled: boolean; price: bigint }>,
  entitlements: Set<number>,
): string {
  const metadata = metadataById.get(map.settingsId);
  const isFree = metadata?.is_free ?? map.settingsId === DEFAULT_SETTINGS_ID;
  const isEnabled = metadata?.enabled ?? true;
  const isOwned = entitlements.has(map.settingsId);
  if (!isEnabled) return "DISABLED";
  if (isFree) return "FREE";
  if (isOwned) return "PLAY";
  return "LOCKED";
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    FREE: "bg-emerald-500/80 text-white border-emerald-400/50",
    PLAY: "bg-emerald-500/80 text-white border-emerald-400/50",
    LOCKED: "bg-slate-600/80 text-white/80 border-slate-500/50",
    DISABLED: "bg-red-800/80 text-white/60 border-red-700/50",
  }[status] ?? "bg-slate-600/80 text-white/80 border-slate-500/50";

  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wider border ${styles}`}>
      {status === "LOCKED" ? "🔒 LOCKED" : status}
    </span>
  );
};

const PlayButton: React.FC<{
  status: string;
  isStarting: boolean;
  onClick: () => void;
}> = ({ status, isStarting, onClick }) => {
  const isPlayable = status === "FREE" || status === "PLAY";
  const label = isStarting ? "STARTING..." : isPlayable ? "▶  PLAY" : "🔒  UNLOCK";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={isStarting}
      onClick={onClick}
      className={`w-full py-3 rounded-xl font-['Fredericka_the_Great'] text-lg tracking-wide transition-colors ${
        isPlayable
          ? "bg-emerald-500 hover:bg-emerald-400 text-white"
          : "bg-slate-700 hover:bg-slate-600 text-white/80"
      } disabled:opacity-50`}
    >
      {label}
    </motion.button>
  );
};

const CompactActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
}> = ({ icon, label, onClick, badge }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="relative flex-1 flex flex-col items-center gap-1 py-3 rounded-xl bg-slate-800/70 backdrop-blur border border-slate-700/50 text-slate-200 hover:text-white hover:bg-slate-700/70 transition-colors"
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-md">
        {badge}
      </span>
    )}
  </motion.button>
);

const HomePage: React.FC = () => {
  useViewport();

  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { MapEntitlement, GameSettingsMetadata },
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { connector } = useAccount();
  const { username } = useControllerUsername();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const imgAssets = ImageAssets(themeTemplate);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [activeMapIndex, setActiveMapIndex] = useState(0);

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
    if (!GameSettingsMetadata) {
      return new Map<
        number,
        {
          is_free: boolean;
          enabled: boolean;
          price: bigint;
        }
      >();
    }

    try {
      const entities = Array.from(runQuery([Has(GameSettingsMetadata)]));
      const metadataMap = new Map<
        number,
        {
          is_free: boolean;
          enabled: boolean;
          price: bigint;
        }
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
      return new Map<
        number,
        {
          is_free: boolean;
          enabled: boolean;
          price: bigint;
        }
      >();
    }
  }, [GameSettingsMetadata]);

  const handleProfile = useCallback(() => {
    if (!account) return;
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile();
    }
  }, [account, connector]);

  const handleTrophies = useCallback(() => {
    if (!account) return;
    const controllerConnector = connector as ControllerConnector;
    if (controllerConnector?.controller?.openProfile) {
      controllerConnector.controller.openProfile("trophies");
    }
  }, [account, connector]);

  const handleStartGame = useCallback(async (settingsId: number) => {
    if (!account || isStartingGame) return;

    const settingsMeta = mapMetadataById.get(settingsId);
    const isFreeMap = settingsMeta?.is_free ?? settingsId === DEFAULT_SETTINGS_ID;
    const isEnabled = settingsMeta?.enabled ?? true;
    const isOwned = mapEntitlements.has(settingsId);

    if (!isEnabled) {
      showToast({ message: "This map is currently disabled.", type: "error" });
      return;
    }

    if (!isFreeMap && !isOwned) {
      const price = settingsMeta?.price ?? 0n;
      const priceLabel = price > 0n ? ` (${price.toString()} CUBE)` : "";
      window.alert(`Map is locked${priceLabel}. Purchase flow UI coming soon.`);
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

      await create({
        account,
        token_id: gameId,
      });

      showToast({
        message: `Game #${gameId} started!`,
        type: "success",
      });

      navigate("map", gameId);
    } catch (error) {
      console.error("Error starting game:", error);
      showToast({
        message: "Failed to start game. Check My Games if a token was minted.",
        type: "error",
      });
    } finally {
      setIsStartingGame(false);
    }
  }, [
    account,
    create,
    freeMint,
    isStartingGame,
    mapEntitlements,
    mapMetadataById,
    navigate,
    username,
  ]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <TopBar
        onTutorial={() => navigate("tutorial")}
        onTrophies={handleTrophies}
        onSettings={() => navigate("settings")}
        onProfile={handleProfile}
        username={username}
      />

      <div className="flex-1 min-h-0 flex flex-col pt-2 pb-3">
        <div className="flex items-center justify-center mb-2">
          {imgAssets.logo && (
            <motion.img
              src={imgAssets.logo}
              alt="zKube"
              draggable={false}
              className="w-28 md:w-36 drop-shadow-2xl opacity-95"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        {!account ? (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="relative mx-4 my-3 h-[68vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <img
                src={`/assets/theme-${MAP_THEME_IDS[0]}/background.png`}
                alt={MAP_CARD_CONFIG[0].themeName}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-5">
                  <div className="flex items-center justify-between mb-3 gap-4">
                    <div>
                      <p className="font-['Fredericka_the_Great'] text-2xl md:text-3xl text-white">
                        {MAP_CARD_CONFIG[0].themeName}
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {THEME_META["theme-1"].description.slice(0, 60)}...
                      </p>
                    </div>
                    <StatusBadge status="FREE" />
                  </div>
                  <Connect />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative mx-4 my-3 h-[68vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <motion.div
                className="flex h-full"
                style={{ width: `${MAP_CARD_CONFIG.length * 100}%` }}
                animate={{ x: `${-activeMapIndex * (100 / MAP_CARD_CONFIG.length)}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="x"
                dragElastic={0.2}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) {
                    setActiveMapIndex((prev) => Math.min(prev + 1, MAP_CARD_CONFIG.length - 1));
                  } else if (info.offset.x > 50) {
                    setActiveMapIndex((prev) => Math.max(prev - 1, 0));
                  }
                }}
              >
                {MAP_CARD_CONFIG.map((map, index) => {
                  const themeId = MAP_THEME_IDS[index];
                  const themeKey = `theme-${themeId}` as const;
                  const themeMeta = THEME_META[themeKey];
                  const status = getMapStatus(map, mapMetadataById, mapEntitlements);

                  return (
                    <div
                      key={map.settingsId}
                      className="relative h-full"
                      style={{ width: `${100 / MAP_CARD_CONFIG.length}%` }}
                    >
                      <img
                        src={`/assets/theme-${themeId}/background.png`}
                        alt={map.themeName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-5">
                          <div className="flex items-center justify-between mb-3 gap-4">
                            <div className="min-w-0">
                              <p className="font-['Fredericka_the_Great'] text-2xl md:text-3xl text-white truncate">
                                {map.themeName}
                              </p>
                              <p className="text-sm text-white/70 mt-1 line-clamp-1 md:line-clamp-none">
                                {themeMeta.description.slice(0, 60)}...
                              </p>
                            </div>
                            <StatusBadge status={status} />
                          </div>

                          <PlayButton
                            status={status}
                            isStarting={isStartingGame}
                            onClick={() => handleStartGame(map.settingsId)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {activeMapIndex > 0 && (
                <button
                  className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70"
                  onClick={() => setActiveMapIndex((prev) => Math.max(prev - 1, 0))}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {activeMapIndex < MAP_CARD_CONFIG.length - 1 && (
                <button
                  className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70"
                  onClick={() => setActiveMapIndex((prev) => Math.min(prev + 1, MAP_CARD_CONFIG.length - 1))}
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>

            <div className="flex justify-center gap-2 py-2">
              {MAP_CARD_CONFIG.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMapIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === activeMapIndex ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 px-4 pb-1">
              <CompactActionButton
                icon={<Gamepad2 size={18} />}
                label="My Games"
                onClick={() => navigate("mygames")}
                badge={activeGames.length > 0 ? activeGames.length : undefined}
              />
              <CompactActionButton
                icon={<Calendar size={18} />}
                label="Daily"
                onClick={() => navigate("dailychallenge")}
              />
              <CompactActionButton
                icon={<Trophy size={18} />}
                label="Leaderboard"
                onClick={() => navigate("leaderboard")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
