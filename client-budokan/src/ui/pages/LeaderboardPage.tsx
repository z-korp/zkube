import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Loader2 } from "lucide-react";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { usePlayerLeaderboard } from "@/hooks/usePlayerLeaderboard";
import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import PageHeader from "@/ui/components/shared/PageHeader";

const TROPHY_IMAGES: Record<number, string> = {
  1: "/assets/trophies/gold.png",
  2: "/assets/trophies/silver.png",
  3: "/assets/trophies/bronze.png",
};

const rowVariants: any = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }
  })
};

const LeaderboardPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { account } = useAccountCustom();
  const { games, loading } = useLeaderboardSlot();
  const { challenge } = useCurrentChallenge();
  const { entries: dailyEntries } = useDailyLeaderboard(challenge?.challenge_id);
  const { entries: playerEntries } = usePlayerLeaderboard();
  const [activeTab, setActiveTab] = useState<"daily" | "endless" | "player">("endless");

  const normalizedAccount = account?.address?.toLowerCase();

  const rankRows =
    activeTab === "daily"
      ? dailyEntries.slice(0, 30).map((entry) => ({
          id: `daily-${entry.rank}`,
          rank: entry.rank,
          name: entry.playerName ?? entry.player,
          score: entry.value,
          stars: 0,
          isYou: normalizedAccount === entry.player.toLowerCase(),
        }))
      : activeTab === "player"
        ? playerEntries.slice(0, 30).map((entry) => ({
            id: `player-${entry.rank}`,
            rank: entry.rank,
            name: entry.playerName ?? entry.player,
            score: entry.lifetimeXp,
            stars: 0,
            isYou: normalizedAccount === entry.player.toLowerCase(),
          }))
        : games.slice(0, 30).map((entry, index) => {
            const starCount = Math.min(30, Math.max(0, entry.level * 3));
            return {
              id: entry.token_id.toString(),
              rank: index + 1,
              name: entry.player_name || "Anonymous",
              score: entry.score,
              stars: starCount,
              isYou:
                !!normalizedAccount &&
                !!entry.player_address &&
                entry.player_address.toLowerCase() === normalizedAccount,
            };
          });

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <div className="pb-2">
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
            { id: "endless", label: "Endless" },
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
        {loading ? (
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
            className="mx-auto max-w-[500px] space-y-2"
          >
            {rankRows.map((entry, index) => (
              <motion.div
                custom={index}
                variants={rowVariants}
                key={entry.id}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-lg shadow-black/20"
                style={{
                  backgroundColor:
                    entry.rank === 1
                      ? "rgba(255,215,0,0.2)"
                      : entry.rank === 2
                        ? "rgba(192,192,192,0.18)"
                        : entry.rank === 3
                          ? "rgba(205,127,50,0.18)"
                          : entry.isYou
                            ? `${colors.accent}2A`
                            : "rgba(255,255,255,0.1)",
                  borderColor:
                    entry.rank <= 3
                      ? "rgba(255,255,255,0.3)"
                      : entry.isYou
                        ? `${colors.accent}75`
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
                  <p className="truncate font-sans text-sm font-extrabold" style={{ color: colors.text }}>
                    {entry.name} {entry.isYou ? "(You)" : ""}
                  </p>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className="text-[9px]" style={{ color: entry.stars >= (i + 1) * 10 ? colors.accent2 : colors.textMuted }}>
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-[8px]" style={{ color: colors.textMuted }}>
                      {entry.stars}
                    </span>
                  </div>
                </div>

                <div className="font-sans text-[16px] font-extrabold tracking-wide" style={{ color: colors.text }}>
                  {entry.score.toLocaleString()}{activeTab === "player" ? " XP" : ""}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
