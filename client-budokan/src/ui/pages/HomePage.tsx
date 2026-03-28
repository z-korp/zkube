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
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import ImageAssets from "@/ui/theme/ImageAssets";
import TopBar from "@/ui/navigation/TopBar";
import NavButton from "@/ui/components/shared/NavButton";
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
    accentClass: "border-emerald-400/60",
    themeName: THEME_META["theme-1"].name,
  },
  {
    settingsId: 1,
    label: "PAID",
    accentClass: "border-red-400/60",
    themeName: THEME_META["theme-5"].name,
  },
  {
    settingsId: 2,
    label: "PAID",
    accentClass: "border-blue-400/60",
    themeName: THEME_META["theme-7"].name,
  },
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
  const { connector } = useAccount();
  const { username } = useControllerUsername();
  const { themeTemplate, setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const imgAssets = ImageAssets(themeTemplate);
  const [isStartingGame, setIsStartingGame] = useState(false);

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

      <div className="flex-1 flex flex-col items-center justify-start px-6 gap-3 pt-4">
        {imgAssets.logo && (
          <motion.img
            src={imgAssets.logo}
            alt="zKube"
            draggable={false}
            className="w-48 md:w-64 lg:w-80 max-w-[340px] drop-shadow-2xl"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div className="flex flex-col items-center gap-3 w-full mt-2">
          {!account ? (
            <Connect />
          ) : (
            <>
              <div className="w-full max-w-[420px] flex flex-col gap-2">
                {MAP_CARD_CONFIG.map((map, index) => {
                  const metadata = mapMetadataById.get(map.settingsId);
                  const isFree = metadata?.is_free ?? map.settingsId === DEFAULT_SETTINGS_ID;
                  const isOwned = mapEntitlements.has(map.settingsId);
                  const isEnabled = metadata?.enabled ?? true;
                  const status = !isEnabled
                    ? "DISABLED"
                    : isFree
                      ? "FREE"
                      : isOwned
                        ? "PLAY"
                        : "LOCKED";

                  return (
                    <motion.button
                      key={map.settingsId}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.06 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      disabled={isStartingGame}
                      onClick={() => handleStartGame(map.settingsId)}
                      className={`w-full rounded-xl border ${map.accentClass} bg-black/35 backdrop-blur px-4 py-3 text-left disabled:opacity-70`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                            {map.label}
                          </p>
                          <p className="font-['Fredericka_the_Great'] text-lg leading-tight text-white truncate">
                            {map.themeName}
                          </p>
                        </div>
                        <span
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide ${status === "PLAY" || status === "FREE" ? "border-emerald-300/50 text-emerald-200" : "border-white/20 text-white/75"}`}
                        >
                          {isStartingGame ? "STARTING..." : status}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <NavButton
                label="MY GAMES"
                variant="purple"
                onClick={() => navigate("mygames")}
                badge={activeGames.length > 0 ? activeGames.length : undefined}
              />

              <NavButton
                label="DAILY CHALLENGE"
                variant="blue"
                onClick={() => navigate("dailychallenge")}
              />

              <NavButton
                label="LEADERBOARD"
                variant="purple"
                onClick={() => navigate("leaderboard")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
