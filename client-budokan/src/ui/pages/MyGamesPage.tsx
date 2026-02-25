import { useMemo } from "react";
import { motion } from "motion/react";
import { Play, Eye } from "lucide-react";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import CubeIcon from "@/ui/components/CubeIcon";

const getAttributeNumber = (
  metadata: string | undefined,
  traitType: string,
): number => {
  if (!metadata) return 0;

  try {
    const parsed = JSON.parse(metadata) as {
      attributes?: Array<{ trait_type?: string; value?: number | string }>;
    };
    const value = parsed.attributes?.find(
      (attribute) => attribute.trait_type === traitType,
    )?.value;
    const normalized = Number(value ?? 0);
    return Number.isFinite(normalized) ? normalized : 0;
  } catch {
    return 0;
  }
};

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const MyGamesPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const navigate = useNavigationStore((state) => state.navigate);
  const { account } = useAccountCustom();

  const { games, loading } = useGameTokensSlot({
    owner: normalizeAddress(account?.address),
  });

  const { activeGames, finishedGames } = useMemo(() => {
    const sorted = [...games].sort((left, right) => right.token_id - left.token_id);
    return {
      activeGames: sorted.filter((g) => !g.game_over),
      finishedGames: sorted.filter((g) => g.game_over),
    };
  }, [games]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar title="MY GAMES" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto flex flex-col gap-3 pb-8">
          {loading ? (
            <div className="bg-slate-900/90 rounded-xl p-4 border border-white/10 text-slate-300">
              Loading your runs...
            </div>
          ) : !account?.address ? (
            <div className="bg-slate-900/90 rounded-xl p-4 border border-white/10 text-slate-300">
              Connect your wallet to see your game tokens.
            </div>
          ) : activeGames.length === 0 && finishedGames.length === 0 ? (
            <div className="bg-slate-900/90 rounded-xl p-4 border border-white/10 text-slate-300">
              No games yet. Start a run and your games will appear here.
            </div>
          ) : (
            <>
              {activeGames.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/90 rounded-xl p-4 border border-emerald-500/30"
                >
                  <h3 className="font-['Fredericka_the_Great'] text-lg text-emerald-300 mb-3">
                    Active
                  </h3>
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="text-left text-slate-300 border-b border-slate-700/50">
                        <th className="py-2 px-2 font-['Fredericka_the_Great']">Game</th>
                        <th className="py-2 px-2 w-14 text-right font-['Fredericka_the_Great']">Lvl</th>
                        <th className="py-2 px-2 w-16 text-right font-['Fredericka_the_Great']">Score</th>
                        <th className="py-2 px-2 w-16 text-right"><CubeIcon size="sm" /></th>
                        <th className="py-2 px-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeGames.map((game, index) => {
                        const level = getAttributeNumber(game.metadata, "Level");
                        const score = getAttributeNumber(game.metadata, "Total Score") || game.score;
                        const cubes = getAttributeNumber(game.metadata, "Total Cubes");

                        return (
                          <motion.tr
                            key={game.token_id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-700/40"
                          >
                            <td className="py-2.5 px-2 text-white truncate">
                              #{game.token_id}
                            </td>
                            <td className="py-2.5 px-2 text-cyan-200 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {level}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-amber-200 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {score}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-blue-300 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {cubes}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => navigate("map", game.token_id)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-400"
                              >
                                <Play size={16} fill="currentColor" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.section>
              )}

              {finishedGames.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/90 rounded-xl p-4 border border-white/10"
                >
                  <h3 className="font-['Fredericka_the_Great'] text-lg text-slate-400 mb-3">
                    Finished
                  </h3>
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="text-left text-slate-300 border-b border-slate-700/50">
                        <th className="py-2 px-2 font-['Fredericka_the_Great']">Game</th>
                        <th className="py-2 px-2 w-14 text-right font-['Fredericka_the_Great']">Lvl</th>
                        <th className="py-2 px-2 w-16 text-right font-['Fredericka_the_Great']">Score</th>
                        <th className="py-2 px-2 w-16 text-right"><CubeIcon size="sm" /></th>
                        <th className="py-2 px-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {finishedGames.map((game, index) => {
                        const level = getAttributeNumber(game.metadata, "Level");
                        const score = getAttributeNumber(game.metadata, "Total Score") || game.score;
                        const cubes = getAttributeNumber(game.metadata, "Total Cubes");

                        return (
                          <motion.tr
                            key={game.token_id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-slate-700/40"
                          >
                            <td className="py-2.5 px-2 text-white truncate">
                              #{game.token_id}
                            </td>
                            <td className="py-2.5 px-2 text-cyan-200 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {level}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-amber-200 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {score}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-blue-300 text-right">
                              <span className="font-['Fredericka_the_Great'] text-lg tracking-wide">
                                {cubes}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right">
                              <button
                                type="button"
                                onClick={() => navigate("map", game.token_id)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-700 text-slate-300 transition hover:bg-slate-600"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.section>
              )}
            </>
          )}


        </div>
      </div>
    </div>
  );
};

export default MyGamesPage;
