import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

import { Has, getComponentValue, runQuery } from "@dojoengine/recs";

import { useDojo } from "@/dojo/useDojo";
import { DEFAULT_SETTINGS_ID } from "@/dojo/game/types/level";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { getThemeColors, loadThemeTemplate } from "@/config/themes";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
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

const toAddressBigInt = (address: string | undefined): bigint | null => {
  if (!address) return null;
  try {
    return BigInt(address);
  } catch {
    return null;
  }
};

const ZONE_CONFIG = [
  {
    zoneId: 1,
    settingsId: 0,
    themeId: "theme-1" as const,
    name: "Polynesian",
    emoji: "🌊",
  },
  {
    zoneId: 2,
    settingsId: 1,
    themeId: "theme-5" as const,
    name: "Feudal Japan",
    emoji: "⛩️",
  },
  {
    zoneId: 3,
    settingsId: 2,
    themeId: "theme-7" as const,
    name: "Ancient Persia",
    emoji: "🕌",
  },
] as const;

const EXTRA_LOCKED_ZONES = [
  { name: "Ancient Egypt", emoji: "🏛️" },
  { name: "Norse", emoji: "⚔️" },
  { name: "Ancient Greece", emoji: "🏺" },
  { name: "Ancient China", emoji: "🐉" },
  { name: "Mayan", emoji: "🌿" },
  { name: "Tribal", emoji: "🥁" },
  { name: "Inca", emoji: "⛰️" },
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
  const { themeTemplate, setThemeTemplate } = useTheme();
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
  const colors = getThemeColors(themeTemplate);

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



  const profileStars = Math.min(30, Math.max(0, (playerMeta?.bestLevel ?? 0) * 3));

  const unlockedZones = ZONE_CONFIG.map((z) => {
    const settingsMeta = mapMetadataById.get(z.settingsId);
    const isEnabled = settingsMeta?.enabled ?? true;
    const isFreeMap = settingsMeta?.is_free ?? z.settingsId === DEFAULT_SETTINGS_ID;
    const isOwned = mapEntitlements.has(z.settingsId);
    return {
      ...z,
      unlocked: isEnabled && (isFreeMap || isOwned),
      stars: profileStars,
    };
  });

  const zonesForDisplay = [
    ...unlockedZones,
    ...EXTRA_LOCKED_ZONES.map((zoneName, idx) => ({
      zoneId: idx + 4,
      settingsId: -1,
      themeId: "theme-1" as const,
      name: zoneName.name,
      emoji: zoneName.emoji,
      unlocked: false,
      stars: 0,
    })),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 pb-3 pt-6">
      <div className="mb-5 text-center">
        <h1
          className="font-display text-4xl font-black tracking-wider"
          style={{ color: colors.text, textShadow: colors.glow }}
        >
          zKube
        </h1>
        <p
          className="mt-1 text-[10px] uppercase tracking-[0.3em]"
          style={{ color: colors.accent }}
        >
          ON-CHAIN PUZZLE
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-1">
        {account ? (
          <div
            className="flex items-center justify-between rounded-xl border p-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-display text-sm font-black"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                  color: "#0a1628",
                }}
              >
                ZK
              </div>
              <div className="min-w-0">
                <p
                  className="truncate font-display text-[13px] font-bold"
                  style={{ color: colors.text }}
                >
                  {username || "Player"}
                </p>
                <p className="text-[10px]" style={{ color: colors.textMuted }}>
                  {profileStars} ★ collected
                </p>
              </div>
            </div>
            <span
              className="shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold tracking-[0.05em]"
              style={{
                color: colors.accent,
                backgroundColor: `${colors.accent}26`,
                border: `1px solid ${colors.accent}33`,
              }}
            >
              CONNECTED
            </span>
          </div>
        ) : (
          <div
            className="rounded-xl border p-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Connect />
          </div>
        )}

        <button
          type="button"
          onClick={() => navigate("daily")}
          className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left"
          style={{
            background: `linear-gradient(135deg, ${colors.accent}33, ${colors.accent2}26)`,
            borderColor: `${colors.accent}4D`,
          }}
        >
          <div>
            <p className="font-display text-xs font-bold tracking-[0.05em]" style={{ color: colors.accent2 }}>
              ⚡ DAILY CHALLENGE
            </p>
            <p className="mt-0.5 text-[10px]" style={{ color: colors.textMuted }}>
              24h remaining · {Math.max(42, (ownedGames?.length ?? 0) * 3)} players
            </p>
          </div>
          <span
            className="rounded-lg px-3 py-1 font-display text-[10px] font-bold"
            style={{ backgroundColor: colors.accent2, color: "#0a1628" }}
          >
            PLAY
          </span>
        </button>

        <div>
          <p
            className="mb-2 text-[11px] uppercase tracking-[0.15em]"
            style={{ color: colors.textMuted }}
          >
            Select Zone
          </p>

          <div className="space-y-2">
            {zonesForDisplay.map((z, idx) => {
              const isSelectable = z.unlocked;
              const isSelected = idx === activeZone && isSelectable;
              return (
                <button
                  key={`${z.zoneId}-${z.name}`}
                  type="button"
                  onClick={() => {
                    if (isSelectable) setActiveZone(idx);
                  }}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all"
                  style={{
                    backgroundColor: isSelectable ? colors.surface : "rgba(255,255,255,0.02)",
                    borderColor: isSelected ? colors.accent : isSelectable ? colors.border : "rgba(255,255,255,0.05)",
                    opacity: isSelectable ? 1 : 0.4,
                    boxShadow: isSelected ? colors.glow : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{z.emoji}</span>
                    <div>
                      <p className="font-display text-[13px] font-bold" style={{ color: colors.text }}>
                        {z.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <span
                            key={i}
                            className="text-[10px]"
                            style={{ color: z.stars > i * 10 ? colors.accent2 : colors.textMuted }}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-1 text-[9px]" style={{ color: colors.textMuted }}>
                          {z.stars}/30
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-base" style={{ color: isSelectable ? colors.accent : colors.textMuted }}>
                    {isSelectable ? "→" : "🔒"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ModePill selectedMode={selectedMode} onModeChange={setSelectedMode} />
      </div>

      {account && hasActiveRun ? (
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleContinue}
          className="mb-2 mt-3 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-display text-base font-bold tracking-[0.08em]"
          style={{
            backgroundColor: `${colors.accent2}26`,
            borderColor: `${colors.accent2}66`,
            color: colors.accent2,
          }}
        >
          <Play size={16} />
          CONTINUE
        </motion.button>
      ) : null}

      {account && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={isStartingGame}
          onClick={() => handleStartGame(zone.settingsId)}
          className="flex w-full items-center justify-center rounded-xl px-4 py-3 font-display text-base font-black tracking-[0.1em] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`,
            color: "#0a1628",
            boxShadow: colors.glow,
          }}
        >
          {isStartingGame ? "STARTING..." : "NEW GAME"}
        </motion.button>
      )}
    </div>
  );
};

export default HomePage;
