import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Has, getComponentValue, runQuery } from "@dojoengine/recs";

import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { loadThemeTemplate } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { useNavigationStore } from "@/stores/navigationStore";
import { showToast } from "@/utils/toast";
import ImageAssets from "@/ui/theme/ImageAssets";
import Connect from "@/ui/components/Connect";
import { Play, Plus, Star, User } from "lucide-react";
import ModePill from "@/ui/components/shared/ModePill";
import GameCard from "@/ui/components/shared/GameCard";

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
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { MapEntitlement, GameSettingsMetadata },
      systemCalls: { freeMint, create },
    },
  } = useDojo();
  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();
  const navigate = useNavigationStore((s) => s.navigate);
  const selectedMode = useNavigationStore((s) => s.selectedMode);
  const setSelectedMode = useNavigationStore((s) => s.setSelectedMode);
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

        await create({ account, token_id: gameId, mode: selectedMode });

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
    [
      account,
      create,
      freeMint,
      isStartingGame,
      mapEntitlements,
      mapMetadataById,
      navigate,
      selectedMode,
      username,
    ],
  );

  const handleContinue = useCallback(() => {
    if (activeRunTokenId) {
      navigate("map", activeRunTokenId);
    }
  }, [activeRunTokenId, navigate]);



  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex flex-1 min-h-0 flex-col">
        <div className="pointer-events-none flex flex-1 items-center justify-center">
          <motion.img
            src={ImageAssets(zone.themeId).logo}
            alt="zKube"
            draggable={false}
            className="h-24 drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="mt-auto flex flex-col gap-3 px-4 pb-3">
          {account && (
            <GameCard variant="glass" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-600/20">
                <User size={20} className="text-emerald-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-white">{username || "Player"}</p>
                  <span className="shrink-0 text-xs font-semibold text-white/55">
                    Lv.{playerMeta?.bestLevel ?? 0}
                  </span>
                </div>
                <p className="text-xs text-white/45">
                  🎮 {ownedGames?.length ?? 0} runs · ⭐ {activeGames.length} active
                </p>
              </div>
              {hasActiveRun && (
                <div className="shrink-0 flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/15 px-2.5 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] font-semibold text-amber-300">LIVE</span>
                </div>
              )}
            </GameCard>
          )}

          <div className="flex flex-col items-center gap-2">
            <div className="flex justify-center gap-3">
            {ZONE_CONFIG.map((z, idx) => {
              const active = idx === activeZone;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveZone(idx)}
                  className={`transition-all ${
                    active ? "" : "opacity-40 hover:opacity-60"
                  }`}
                >
                  <img
                    src={ImageAssets(z.themeId).themeIcon}
                    alt={z.name}
                    className={`rounded-xl transition-all ${
                      active
                        ? "h-16 w-16 border-2 border-white/80 shadow-[0_0_18px_rgba(255,255,255,0.35)]"
                        : "h-14 w-14 border border-white/20 opacity-60"
                    }`}
                    draggable={false}
                  />
                </button>
              );
            })}
            </div>
            <p className="font-['Fredericka_the_Great'] text-sm text-white/80">{zone.name}</p>
          </div>

          <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />

          {!account ? (
            <Connect />
          ) : hasActiveRun ? (
            <>
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={isStartingGame}
                onClick={handleContinue}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 shadow-lg shadow-amber-900/30 transition-colors hover:bg-amber-500 active:bg-amber-700 disabled:opacity-50"
              >
                <Play size={20} fill="white" className="text-white" />
                <span className="font-['Fredericka_the_Great'] text-xl tracking-wider text-white">
                  CONTINUE
                </span>
              </motion.button>
              <button
                type="button"
                disabled={isStartingGame}
                onClick={() => handleStartGame(zone.settingsId)}
                className="mx-auto flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/65 transition-colors hover:text-white disabled:opacity-40"
              >
                <Plus size={13} />
                {isStartingGame ? "STARTING..." : "New Game"}
              </button>
            </>
          ) : (
            <motion.div whileTap={{ scale: 0.96 }}>
              <motion.button
                disabled={isStartingGame}
                onClick={() => handleStartGame(zone.settingsId)}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50"
              >
                <Play size={20} fill="white" className="text-white" />
                <span className="font-['Fredericka_the_Great'] text-xl text-white tracking-wider">
                  {isStartingGame ? "STARTING..." : "PLAY"}
                </span>
              </motion.button>
            </motion.div>
          )}

          <button
            onClick={() => navigate("daily")}
            className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3 transition-colors active:bg-white/10"
          >
            <Star size={24} fill="#fbbf24" className="shrink-0 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Daily Challenge</p>
              <p className="text-[11px] text-white/40">Compete for stars</p>
            </div>
            <span className="shrink-0 text-lg font-bold leading-none text-white/50">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
