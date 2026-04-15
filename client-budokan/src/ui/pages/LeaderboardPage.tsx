import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Trophy, Loader2 } from "lucide-react";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { usePlayerLeaderboard } from "@/hooks/usePlayerLeaderboard";
import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import PageHeader from "@/ui/components/shared/PageHeader";
import { getLevelFromXp, getTitleForLevel } from "@/config/profileData";

const TROPHY_IMAGES: Record<number, string> = {
  1: "/assets/common/trophies/gold.png",
  2: "/assets/common/trophies/silver.png",
  3: "/assets/common/trophies/bronze.png",
};

const rowVariants: any = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }
  })
};

function computeDailyReward(rank1Based: number, total: number): number {
  if (total === 0) return 0;
  const pct = ((rank1Based - 1) * 100) / total;
  if (pct < 2) return 10;
  if (pct < 5) return 7;
  if (pct < 10) return 5;
  if (pct < 25) return 3;
  if (pct < 50) return 1;
  return 0;
}

const LeaderboardPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { account } = useAccountCustom();
  const { challenge } = useCurrentChallenge();
  const { entries: dailyEntries, isLoading: dailyLoading } = useDailyLeaderboard(challenge?.challenge_id);
  const { entries: playerEntries, isLoading: playerLoading } = usePlayerLeaderboard();
  const [activeTab, setActiveTab] = useState<"daily" | "player">("daily");
  const navigate = useNavigationStore((s) => s.navigate);
  const setProfileAddress = useNavigationStore((s) => s.setProfileAddress);

  const normalizedAccount = account?.address?.toLowerCase();

  const handleRowClick = (playerAddress: string | undefined) => {
    if (!playerAddress) return;
    setProfileAddress(playerAddress);
    navigate("profile");
  };

  const rankRows = useMemo(() => {
    if (activeTab === "daily") {
      return dailyEntries.slice(0, 30).map((entry) => ({
        id: `daily-${entry.rank}`,
        rank: entry.rank,
        name: entry.playerName ?? entry.player,
        score: entry.totalStars ?? 0,
        playerAddress: entry.player,
        isYou: normalizedAccount === entry.player.toLowerCase(),
        subtitle: undefined as string | undefined,
      }));
    }
    return playerEntries.slice(0, 30).map((entry) => {
      const level = getLevelFromXp(entry.lifetimeXp);
      return {
        id: `player-${entry.rank}`,
        rank: entry.rank,
        name: entry.playerName ?? entry.player,
        score: entry.lifetimeXp,
        playerAddress: entry.player,
        isYou: normalizedAccount === entry.player.toLowerCase(),
        subtitle: `Lv.${level} · ${getTitleForLevel(level)}`,
      };
    });
  }, [activeTab, dailyEntries, playerEntries, normalizedAccount]);

  const myRank = useMemo(() => {
    if (!normalizedAccount) return null;
    if (activeTab === "daily") {
      const entry = dailyEntries.find((e) => e.player.toLowerCase() === normalizedAccount);
      return entry ? { rank: entry.rank, total: dailyEntries.length, score: entry.totalStars ?? 0, name: entry.playerName ?? "You" } : null;
    }
    const entry = playerEntries.find((e) => e.player.toLowerCase() === normalizedAccount);
    return entry ? { rank: entry.rank, total: playerEntries.length, score: entry.lifetimeXp, name: entry.playerName ?? "You" } : null;
  }, [activeTab, dailyEntries, playerEntries, normalizedAccount]);

  const isMyRankVisible = myRank ? rankRows.some((r) => r.isYou) : false;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <div className="shrink-0 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <PageHeader title="Leaderboard" />
        </motion.div>
        <div className="mx-6 mt-2 flex rounded-full border border-white/[0.16] bg-white/[0.1] p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {([
            { id: "daily", label: "Daily" },
            { id: "player", label: "Player" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 py-1.5 px-3 rounded-full text-[12px] font-bold transition-colors duration-200 z-10 font-sans tracking-wide uppercase ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="leaderboard-tab-indicator"
                  className="absolute inset-0 bg-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/[0.08]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-20 drop-shadow-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {(activeTab === "daily" ? dailyLoading : playerLoading) ? (
          <div className="flex flex-col items-center justify-center py-16" style={{ color: colors.textMuted }}>
            <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: colors.accent }} />
            <p className="font-sans text-sm font-medium">Loading rankings...</p>
          </div>
        ) : rankRows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
            style={{ color: colors.textMuted }}
          >
            <Trophy className="h-12 w-12 mb-4 opacity-50" />
            <p className="mb-1 font-sans text-xl font-semibold" style={{ color: colors.text }}>No entries yet</p>
            <p className="font-sans text-base">Finish a run to claim rank #1.</p>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-[640px] space-y-2"
          >
            {rankRows.map((entry, index) => {
              const reward = activeTab === "daily"
                ? computeDailyReward(entry.rank, dailyEntries.length)
                : 0;

              // Background per row: rank colors for top 3, neutral white otherwise.
              const baseBg =
                entry.rank === 1
                  ? "rgba(255,215,0,0.2)"
                  : entry.rank === 2
                    ? "rgba(192,192,192,0.18)"
                    : entry.rank === 3
                      ? "rgba(205,127,50,0.18)"
                      : "rgba(255,255,255,0.1)";
              // Pulse only fires for "you": gently brighten the row's base color.
              const pulseBright =
                entry.rank === 1
                  ? "rgba(255,215,0,0.32)"
                  : entry.rank === 2
                    ? "rgba(192,192,192,0.28)"
                    : entry.rank === 3
                      ? "rgba(205,127,50,0.28)"
                      : `${colors.accent}40`;
              const pulseBase = entry.rank <= 3 ? baseBg : `${colors.accent}20`;

              return (
                <motion.div
                  custom={index}
                  variants={rowVariants}
                  key={entry.id}
                  onClick={() => handleRowClick(entry.playerAddress)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all active:scale-[0.98] ${entry.isYou ? "leaderboard-pulse" : ""}`}
                  style={{
                    // For non-"you" rows: static rank-based background.
                    // For "you": CSS keyframe animates background-color between
                    // --pulse-base and --pulse-bright so the rank color itself
                    // shimmers (gold dims/brightens for #1, etc).
                    ...(entry.isYou
                      ? ({ "--pulse-base": pulseBase, "--pulse-bright": pulseBright } as React.CSSProperties)
                      : { backgroundColor: baseBg }),
                    borderColor: entry.isYou
                      ? `${colors.accent}AA`
                      : entry.rank <= 3
                        ? "rgba(255,255,255,0.3)"
                        : "rgba(255,255,255,0.14)",
                  }}
                >
                  <div className="flex w-8 items-center justify-center text-center font-sans text-base font-black" style={{ color: entry.rank <= 3 ? colors.accent2 : colors.textMuted }}>
                    {entry.rank <= 3 ? (
                      <img
                        src={TROPHY_IMAGES[entry.rank]}
                        alt={`Rank ${entry.rank}`}
                        className="h-6 w-6"
                        draggable={false}
                      />
                    ) : (
                      entry.rank
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-extrabold" style={{ color: entry.isYou ? colors.accent : colors.text }}>
                      {entry.name}
                    </p>
                    {entry.subtitle && (
                      <p className="truncate font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                        {entry.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="font-sans text-[16px] font-extrabold tracking-wide" style={{ color: colors.text }}>
                      {entry.score.toLocaleString()}{activeTab === "player" ? " XP" : activeTab === "daily" ? " ★" : ""}
                    </div>
                    {reward > 0 && (
                      <div className="shrink-0 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">
                        +{reward} ★
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* Show user's rank if not visible in top 30 */}
            {myRank && !isMyRankVisible && (
              <>
                <div className="py-1 text-center font-sans text-[10px] text-white/30">···</div>
                <motion.div
                  custom={rankRows.length}
                  variants={rowVariants}
                  className="leaderboard-pulse flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl"
                  style={{
                    ["--pulse-base" as any]: `${colors.accent}20`,
                    ["--pulse-bright" as any]: `${colors.accent}40`,
                    borderColor: `${colors.accent}AA`,
                  }}
                >
                  <div className="flex w-8 items-center justify-center text-center font-sans text-base font-black" style={{ color: colors.accent }}>
                    {myRank.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-sm font-extrabold" style={{ color: colors.accent }}>
                      {myRank.name}
                    </p>
                    {activeTab === "player" && (() => {
                      const lvl = getLevelFromXp(myRank.score);
                      return (
                        <p className="truncate font-sans text-[11px] font-semibold" style={{ color: colors.textMuted }}>
                          Lv.{lvl} · {getTitleForLevel(lvl)}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-sans text-[16px] font-extrabold tracking-wide" style={{ color: colors.text }}>
                      {myRank.score.toLocaleString()}{activeTab === "player" ? " XP" : activeTab === "daily" ? " ★" : ""}
                    </div>
                    {activeTab === "daily" && (() => {
                      const reward = computeDailyReward(myRank.rank, myRank.total);
                      return reward > 0 ? (
                        <div className="shrink-0 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">
                          +{reward} ★
                        </div>
                      ) : null;
                    })()}
                  </div>
                </motion.div>
              </>
            )}

            {/* Not ranked message */}
            {!myRank && normalizedAccount && rankRows.length > 0 && (
              <div className="mt-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-center">
                <p className="font-sans text-xs font-semibold text-white/50">
                  You're not ranked yet. Finish a run to appear here!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
