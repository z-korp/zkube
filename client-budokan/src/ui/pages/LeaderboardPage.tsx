import { motion } from "motion/react";
import { useLeaderboardSlot } from "@/hooks/useLeaderboardSlot";
import useAccountCustom from "@/hooks/useAccountCustom";

const PODIUM_STYLES = [
  { bg: "bg-yellow-400/15", border: "border-yellow-400/40", text: "text-yellow-200", trophy: "/assets/trophies/gold.png" },
  { bg: "bg-slate-300/10", border: "border-slate-400/30", text: "text-slate-200", trophy: "/assets/trophies/silver.png" },
  { bg: "bg-amber-600/15", border: "border-amber-500/30", text: "text-amber-200", trophy: "/assets/trophies/bronze.png" },
];

const LeaderboardPage: React.FC = () => {
  const { games, loading } = useLeaderboardSlot();
  const { account } = useAccountCustom();

  const top3 = games.slice(0, 3);
  const rest = games.slice(3);

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4 pb-2">
        <h1 className="font-['Fredericka_the_Great'] text-xl text-white text-center">
          Leaderboard
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="text-slate-400 text-sm text-center py-8">
            Loading...
          </div>
        ) : games.length === 0 ? (
          <div className="text-slate-400 text-sm text-center py-8">
            No entries yet. Finish a run to claim rank #1.
          </div>
        ) : (
          <div className="max-w-[500px] mx-auto">
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-2 mb-4 pt-2">
                {[1, 0, 2].map((podiumIdx) => {
                  const entry = top3[podiumIdx];
                  if (!entry) return <div key={podiumIdx} className="flex-1" />;
                  const rank = podiumIdx + 1;
                  const style = PODIUM_STYLES[podiumIdx];
                  const isFirst = podiumIdx === 0;

                  return (
                    <motion.div
                      key={entry.token_id.toString()}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: podiumIdx * 0.1 }}
                      className={`flex-1 flex flex-col items-center rounded-xl border p-3 ${style.bg} ${style.border} ${isFirst ? "pb-5" : "pb-3"}`}
                    >
                      <img
                        src={style.trophy}
                        alt={`#${rank}`}
                        className={`${isFirst ? "h-12 w-12" : "h-9 w-9"} object-contain mb-1.5`}
                      />
                      <span className={`font-['Fredericka_the_Great'] text-lg ${style.text}`}>
                        #{rank}
                      </span>
                      <span className="text-xs text-white truncate w-full text-center mt-0.5">
                        {entry.player_name || `Game #${entry.token_id}`}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-['Fredericka_the_Great'] text-sm text-cyan-200">
                          Lv.{entry.level}
                        </span>
                        <span className="text-slate-500 text-[10px]">·</span>
                        <span className="font-['Fredericka_the_Great'] text-sm text-amber-200">
                          {entry.score}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {rest.length > 0 && (
              <div className="rounded-xl bg-slate-900/80 border border-white/10 overflow-hidden">
                {rest.map((entry, index) => {
                  const rank = index + 4;
                  return (
                    <motion.div
                      key={entry.token_id.toString()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/30 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-['Fredericka_the_Great'] text-sm text-slate-400 w-7">
                          #{rank}
                        </span>
                        <span className="text-sm text-white truncate max-w-[160px]">
                          {entry.player_name || `Game #${entry.token_id}`}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-['Fredericka_the_Great'] text-sm text-cyan-200">
                          {entry.level}
                        </span>
                        <span className="font-['Fredericka_the_Great'] text-sm text-amber-200">
                          {entry.score}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
