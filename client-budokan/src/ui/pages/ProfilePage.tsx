import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";

import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors } from "@/config/themes";
import { useNavigationStore } from "@/stores/navigationStore";
import { useControllerUsername } from "@/hooks/useControllerUsername";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import { useDojo } from "@/dojo/useDojo";

import ProgressBar from "@/ui/components/shared/ProgressBar";
import OverviewTab from "@/ui/components/profile/OverviewTab";
import QuestsTab from "@/ui/components/profile/QuestsTab";
import AchievementsTab from "@/ui/components/profile/AchievementsTab";
import UnlockModal from "@/ui/components/profile/UnlockModal";

import {
  XP_PER_STAR,
  LEVEL_THRESHOLDS,
  PLAYER_TITLES,
  ZONE_EMOJIS,
  ZONE_NAMES,
  ZONE_UNLOCK_PRICES,
  QUEST_DEFS,
  type ZoneProgressData,
} from "@/config/profileData";

const TABS = ["Overview", "Quests", "Achievements"] as const;

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

const getLevelFromXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
};

const getTitleForLevel = (level: number): string => {
  const unlockLevels = Object.keys(PLAYER_TITLES)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((l) => l <= level);
  const key = unlockLevels[unlockLevels.length - 1] ?? 1;
  return PLAYER_TITLES[key] ?? "Novice";
};

const ProfilePage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const navigate = useNavigationStore((s) => s.navigate);

  const { username } = useControllerUsername();
  const { playerMeta } = usePlayerMeta();
  const { account } = useAccountCustom();
  const isConnected = Boolean(account);

  const {
    setup: {
      contractComponents: { MapEntitlement },
    },
  } = useDojo();

  const owner = normalizeAddress(account?.address);
  const { games } = useGameTokensSlot({ owner: isConnected ? owner : undefined, limit: isConnected ? 100 : 0 });

  const ownerAddressAsBigInt = useMemo(() => toAddressBigInt(account?.address), [account?.address]);

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

  const zoneStars = useMemo(() => {
    const bestLevel = playerMeta?.bestLevel ?? 0;
    return Math.min(bestLevel, 10) * 3;
  }, [playerMeta?.bestLevel]);

  const zones = useMemo<ZoneProgressData[]>(() => {
    const totalStarsProxy = zoneStars;

    return Array.from({ length: 10 }).map((_, index) => {
      const zoneId = index + 1;
      const unlocked = zoneId === 1 || mapEntitlements.has(zoneId - 1) || mapEntitlements.has(zoneId);
      const isFree = zoneId === 1;
      const stars = zoneId === 1 ? zoneStars : 0;
      const pricing = ZONE_UNLOCK_PRICES[zoneId];

      return {
        zoneId,
        name: ZONE_NAMES[zoneId],
        emoji: ZONE_EMOJIS[zoneId],
        stars,
        maxStars: 30,
        unlocked,
        cleared: stars >= 30,
        isFree,
        starCost: pricing?.starCost,
        ethPrice: pricing?.ethPrice,
        currentStars: pricing ? totalStarsProxy : undefined,
      };
    });
  }, [mapEntitlements, zoneStars]);

  const totalStars = zones.reduce((sum, zone) => sum + zone.stars, 0);
  const xp = totalStars * XP_PER_STAR;
  const level = getLevelFromXp(xp);
  const levelStartXp = LEVEL_THRESHOLDS[Math.max(level - 1, 0)] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? levelStartXp + 5000;
  const title = getTitleForLevel(level);
  const nextTitle = getTitleForLevel(level + 1);
  const questsPendingCount = QUEST_DEFS.filter((quest) => !quest.done).length;
  const nextLockedZone = zones.find((zone) => !zone.unlocked && zone.starCost && zone.ethPrice) ?? null;

  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [unlockZone, setUnlockZone] = useState<ZoneProgressData | null>(null);

  return (
    <div className="relative flex h-full min-h-0 flex-col px-4 pb-2 pt-2">
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate("home")}
          className="flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ color: colors.accent }}
        >
          <ChevronLeft size={20} />
        </button>
        <p className="font-display text-base font-extrabold" style={{ color: colors.text }}>
          Profile
        </p>
      </div>

      <section
        className="mb-2 rounded-[14px] p-3"
        style={{
          background: `linear-gradient(135deg, ${colors.accent}1A, ${colors.accent2}14)`,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div className="mb-2.5 flex items-center gap-2.5">
          <div className="relative">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px] font-display text-xl font-black"
              style={{
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent2})`,
                color: colors.background,
                boxShadow: colors.glow,
              }}
            >
              ZK
            </div>
            <div
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border-2 font-display text-[9px] font-black"
              style={{ background: colors.accent, color: colors.background, borderColor: colors.background }}
            >
              {level}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-extrabold" style={{ color: colors.text }}>
              {username ?? "Player"}
            </p>
            <p className="font-['DM_Sans'] text-[9px]" style={{ color: colors.textMuted }}>
              Level {level} · {title}
            </p>
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-black" style={{ color: colors.accent2 }}>
              ★ {totalStars}
            </p>
            <p className="font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
              total stars
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
              Level {level}
            </p>
            <p className="font-display text-[8px] font-bold" style={{ color: colors.accent }}>
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </p>
          </div>
          <ProgressBar value={xp - levelStartXp} max={Math.max(nextLevelXp - levelStartXp, 1)} color={colors.accent} height={6} glow />
          <p className="mt-1 font-['DM_Sans'] text-[7px]" style={{ color: colors.textMuted }}>
            {(nextLevelXp - xp).toLocaleString()} XP to Level {level + 1} · "{nextTitle}"
          </p>
        </div>
      </section>

      <div className="mb-1 flex">
        {TABS.map((tabName) => {
          const active = tab === tabName;
          return (
            <button
              key={tabName}
              type="button"
              onClick={() => setTab(tabName)}
              className="flex-1 border-b-2 py-2 text-center font-['DM_Sans'] text-[11px] font-medium"
              style={{
                color: active ? colors.accent : colors.textMuted,
                borderBottomColor: active ? colors.accent : "transparent",
              }}
            >
              {tabName}
              {tabName === "Quests" && (
                <span
                  className="ml-1 rounded px-1 py-[1px] align-middle font-display text-[8px] font-bold"
                  style={{ color: colors.background, background: "#FF6B8A" }}
                >
                  {questsPendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-0.5">
        {tab === "Overview" && (
          <OverviewTab
            colors={colors}
            zones={zones}
            totalStars={totalStars}
            totalGames={games.length}
            bestCombo="--"
            onUnlock={setUnlockZone}
          />
        )}

        {tab === "Quests" && (
          <QuestsTab colors={colors} nextLockedZone={nextLockedZone} onUnlock={setUnlockZone} />
        )}

        {tab === "Achievements" && <AchievementsTab colors={colors} />}
      </div>

      {unlockZone && <UnlockModal colors={colors} zone={unlockZone} onClose={() => setUnlockZone(null)} />}

      {!isConnected && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1"
          style={{ background: "rgba(0,0,0,0.45)", border: `1px solid ${colors.border}` }}
        >
          <p className="font-['DM_Sans'] text-[8px]" style={{ color: colors.textMuted }}>
            Connect to load your profile data
          </p>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
