import { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Loader2 } from "lucide-react";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

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
  const [activeTab, setActiveTab] = useState<"zone" | "endless" | "daily">("zone");

  const normalizedAccount = account?.address?.toLowerCase();
  const filteredGames = games.filter((game) =>
    activeTab === "zone" ? game.endlessDepth === 0 : game.endlessDepth > 0,
  );

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
      : filteredGames.slice(0, 30).map((entry, index) => {
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
    <div className="flex h-full flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="text-center font-sans text-xl font-bold tracking-wide text-white" 
        >
          Leaderboard
        </motion.h1>
        <div className="mt-2 flex">
          {([
            { id: "zone", label: "Zone" },
            { id: "endless", label: "Endless" },
            { id: "daily", label: "Daily" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 py-2 font-sans text-[11px]"
              style={{
                color: activeTab === tab.id ? colors.accent : colors.textMuted,
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="leaderboard-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: colors.accent }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-2 mt-1 mb-[72px] rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-sm p-3 overflow-y-auto flex-1 min-h-0">
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
            <p className="font-display text-lg mb-1" style={{ color: colors.text }}>No entries yet</p>
            <p className="font-sans text-sm">Finish a run to claim rank #1.</p>
          </motion.div>
        ) : (
          <motion.div 
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
                  backgroundColor: entry.isYou ? `${colors.accent}1F` : "rgba(255,255,255,0.04)",
                  borderColor: entry.isYou ? `${colors.accent}4D` : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex w-8 items-center justify-center text-center font-display text-base font-black" style={{ color: entry.rank <= 3 ? colors.accent2 : colors.textMuted }}>
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
                  <p className="truncate font-display text-xs font-bold" style={{ color: colors.text }}>
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

                <div className="font-display text-[14px] font-extrabold tracking-wide" style={{ color: colors.text }}>
                  {entry.score.toLocaleString()}
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
