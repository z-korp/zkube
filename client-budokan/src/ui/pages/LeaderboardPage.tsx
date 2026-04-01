import { useState } from "react";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useCurrentChallenge } from "@/hooks/useCurrentChallenge";
import { useDailyLeaderboard } from "@/hooks/useDailyLeaderboard";
import { getThemeColors } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

const MEDALS = ["🥇", "🥈", "🥉"];

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
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-display text-[18px] font-extrabold text-center" style={{ color: colors.text }}>
          Leaderboard
        </h1>
        <div className="mt-2 flex">
          {([
            { id: "zone", label: "Zone" },
            { id: "endless", label: "Endless" },
            { id: "daily", label: "Daily" },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 border-b-2 py-2 text-[11px]"
              style={{
                color: activeTab === tab.id ? colors.accent : colors.textMuted,
                borderBottomColor: activeTab === tab.id ? colors.accent : "transparent",
                fontWeight: activeTab === tab.id ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: colors.textMuted }}>
            Loading...
          </div>
        ) : rankRows.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: colors.textMuted }}>
            No entries yet. Finish a run to claim rank #1.
          </div>
        ) : (
          <div className="mx-auto max-w-[500px] space-y-1.5">
            {rankRows.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-[10px] border px-3 py-2.5"
                style={{
                  backgroundColor: entry.isYou ? `${colors.accent}1F` : colors.surface,
                  borderColor: entry.isYou ? `${colors.accent}4D` : colors.border,
                }}
              >
                <div className="w-8 text-center font-display text-base font-black" style={{ color: entry.rank <= 3 ? colors.accent2 : colors.textMuted }}>
                  {entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}
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

                <div className="font-display text-[13px] font-extrabold" style={{ color: colors.text }}>
                  {entry.score.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
