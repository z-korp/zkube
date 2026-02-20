import { motion } from "motion/react";
import { Users } from "lucide-react";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import PageTopBar from "@/ui/navigation/PageTopBar";

const rankStyle = (rank: number): string => {
  if (rank === 1) return "bg-yellow-400/25 text-yellow-100 border border-yellow-300/50";
  if (rank === 2) return "bg-slate-300/20 text-slate-100 border border-slate-300/45";
  if (rank === 3) return "bg-amber-500/25 text-amber-100 border border-amber-400/45";
  return "bg-slate-800/90 text-slate-200 border border-slate-600/70";
};

const LeaderboardPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const { games, loading } = useLeaderboardSlot();

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <PageTopBar title="LEADERBOARD" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[860px] mx-auto pb-8">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 rounded-xl p-4 border border-slate-500/70"
          >
            <div className="flex items-center gap-2 mb-3">
              <Users size={17} className="text-cyan-300" />
              <h2 className="font-['Fredericka_the_Great'] text-lg text-white">
                Top Players
              </h2>
            </div>

            {loading ? (
              <div className="text-slate-200 text-sm">Loading leaderboard...</div>
            ) : games.length === 0 ? (
              <div className="text-slate-200 text-sm">
                No entries yet. Finish a run to claim rank #1.
              </div>
            ) : (
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="text-left text-slate-200 border-b border-slate-500/60">
                    <th className="py-2 px-2 w-16 font-['Fredericka_the_Great']">Rank</th>
                    <th className="py-2 px-2 font-['Fredericka_the_Great']">Player</th>
                    <th className="py-2 px-2 w-14 text-right font-['Fredericka_the_Great']">Lvl</th>
                    <th className="py-2 px-2 w-16 text-right font-['Fredericka_the_Great']">Score</th>
                    <th className="py-2 px-2 w-16 text-right font-['Fredericka_the_Great']">🧊</th>
                    <th className="py-2 px-2 w-20 text-right font-['Fredericka_the_Great']">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((entry, index) => {
                    const rank = index + 1;
                    const playerName = entry.player_name || `Game #${entry.token_id}`;

                    return (
                      <motion.tr
                        key={entry.token_id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`${rankStyle(rank)} border-b border-slate-700/40`}
                      >
                        <td className="py-2.5 px-2">
                          <span className="font-['Tilt_Prism'] text-lg tracking-wide">
                            #{rank}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-white truncate">
                          {playerName}
                        </td>
                        <td className="py-2.5 px-2 text-cyan-200 text-right">
                          <span className="font-['Tilt_Prism'] text-lg tracking-wide">
                            {entry.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-amber-200 text-right">
                          <span className="font-['Tilt_Prism'] text-lg tracking-wide">
                            {entry.score}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-blue-300 text-right">
                          <span className="font-['Tilt_Prism'] text-lg tracking-wide">
                            {entry.totalCubes}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-base">
                          {entry.gameOver ? "🏁" : "🟢"}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
