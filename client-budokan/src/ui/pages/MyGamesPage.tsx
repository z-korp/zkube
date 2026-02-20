import { useMemo } from "react";
import { motion } from "motion/react";
import { Box, Flag, Trophy } from "lucide-react";
import { useGameTokensSlot } from "@/hooks/useGameTokensSlot";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useNavigationStore } from "@/stores/navigationStore";
import ThemeBackground from "@/ui/components/shared/ThemeBackground";
import GameButton from "@/ui/components/shared/GameButton";
import PageTopBar from "@/ui/navigation/PageTopBar";

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

const MyGamesPage: React.FC = () => {
  const goBack = useNavigationStore((state) => state.goBack);
  const navigate = useNavigationStore((state) => state.navigate);
  const { account } = useAccountCustom();

  const { games, loading } = useGameTokensSlot({ owner: account?.address });

  const { activeGames, finishedGames } = useMemo(() => {
    const sorted = [...games].sort((left, right) => right.token_id - left.token_id);
    return {
      activeGames: sorted.filter((g) => !g.game_over),
      finishedGames: sorted.filter((g) => g.game_over),
    };
  }, [games]);

  return (
    <div className="h-screen-viewport flex flex-col">
      <ThemeBackground />

      <PageTopBar title="MY GAMES" onBack={goBack} />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-[760px] mx-auto flex flex-col gap-3 pb-8">
          {loading ? (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60 text-slate-200">
              Loading your runs...
            </div>
          ) : !account?.address ? (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60 text-slate-200">
              Connect your wallet to see your game tokens.
            </div>
          ) : activeGames.length === 0 && finishedGames.length === 0 ? (
            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60 text-slate-200">
              No games yet. Start a run and your games will appear here.
            </div>
          ) : (
            <>
              {activeGames.length > 0 && (
                <section>
                  <h3 className="font-['Fredericka_the_Great'] text-sm text-emerald-300 tracking-wide mb-2 px-1">
                    Active
                  </h3>
                  <div className="flex flex-col gap-3">
                    {activeGames.map((game, index) => {
                      const level = getAttributeNumber(game.metadata, "Level");
                      const score = getAttributeNumber(game.metadata, "Total Score") || game.score;
                      const cubes = getAttributeNumber(game.metadata, "Total Cubes");

                      return (
                        <motion.article
                          key={game.token_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="bg-slate-900/80 rounded-xl p-4 border border-emerald-500/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="font-['Fredericka_the_Great'] text-lg text-white leading-tight">
                                Game #{game.token_id}
                              </h2>
                              <div className="mt-2 flex items-center gap-4 text-sm text-slate-200">
                                <span className="inline-flex items-center gap-1.5">
                                  <Flag size={14} className="text-cyan-300" />
                                  Level
                                  <span className="font-['Bangers'] text-base tracking-wider text-cyan-200">
                                    {level}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Trophy size={14} className="text-amber-300" />
                                  Score
                                  <span className="font-['Bangers'] text-base tracking-wider text-amber-200">
                                    {score}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Box size={14} className="text-purple-300" />
                                  Cubes
                                  <span className="font-['Bangers'] text-base tracking-wider text-purple-200">
                                    {cubes}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <GameButton
                              label="RESUME"
                              variant="primary"
                              onClick={() => navigate("map", game.token_id)}
                            />
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </section>
              )}

              {finishedGames.length > 0 && (
                <section>
                  <h3 className="font-['Fredericka_the_Great'] text-sm text-slate-400 tracking-wide mb-2 px-1">
                    Finished
                  </h3>
                  <div className="flex flex-col gap-3">
                    {finishedGames.map((game, index) => {
                      const level = getAttributeNumber(game.metadata, "Level");
                      const score = getAttributeNumber(game.metadata, "Total Score") || game.score;
                      const cubes = getAttributeNumber(game.metadata, "Total Cubes");

                      return (
                        <motion.article
                          key={game.token_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="bg-slate-900/80 rounded-xl p-4 border border-slate-600/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h2 className="font-['Fredericka_the_Great'] text-lg text-white leading-tight">
                                Game #{game.token_id}
                              </h2>
                              <div className="mt-2 flex items-center gap-4 text-sm text-slate-200">
                                <span className="inline-flex items-center gap-1.5">
                                  <Flag size={14} className="text-cyan-300" />
                                  Level
                                  <span className="font-['Bangers'] text-base tracking-wider text-cyan-200">
                                    {level}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Trophy size={14} className="text-amber-300" />
                                  Score
                                  <span className="font-['Bangers'] text-base tracking-wider text-amber-200">
                                    {score}
                                  </span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Box size={14} className="text-purple-300" />
                                  Cubes
                                  <span className="font-['Bangers'] text-base tracking-wider text-purple-200">
                                    {cubes}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}


        </div>
      </div>
    </div>
  );
};

export default MyGamesPage;
