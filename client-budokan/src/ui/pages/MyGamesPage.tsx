import { useMemo, useState } from "react";
import { motion } from "motion/react";

import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useGameTokensSlot, type SlotGameTokenData } from "@/hooks/useGameTokensSlot";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useGame } from "@/hooks/useGame";
import { useNavigationStore } from "@/stores/navigationStore";
import GameCard from "@/ui/components/shared/GameCard";
import Connect from "@/ui/components/Connect";
import PageHeader from "@/ui/components/shared/PageHeader";
import { getThemeColors, getThemeImages, THEME_META, type ThemeId } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";

const normalizeAddress = (address: string | undefined): string | undefined => {
  if (!address) return undefined;
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`;
};

const getThemeId = (zoneId: number): ThemeId => {
  const normalized = Math.min(10, Math.max(1, zoneId || 1));
  return `theme-${normalized}` as ThemeId;
};

type GameTokenWithExtra = SlotGameTokenData & {
  run_data?: bigint;
};

const getStars = (game: GameTokenWithExtra, level: number, zoneCleared: boolean): number => {
  try {
    const parsed = JSON.parse(game.metadata || "{}") as {
      attributes?: Array<{ trait_type?: string; value?: string | number }>;
    };
    const starsValue = parsed.attributes?.find(
      (attr) => attr.trait_type?.toLowerCase() === "stars",
    )?.value;
    const parsedStars = Number(starsValue);
    if (Number.isFinite(parsedStars)) {
      return Math.max(0, Math.min(3, Math.floor(parsedStars)));
    }
  } catch {
  }

  if (zoneCleared) return 3;
  if (level >= 7) return 2;
  if (level >= 3) return 1;
  return 0;
};

const cardVariants: any = {
  hidden: { opacity: 0, x: 24 },
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: "easeOut", delay: index * 0.05 },
  }),
};

const MyGamesPage: React.FC = () => {
  const { themeTemplate } = useTheme();
  const colors = getThemeColors(themeTemplate);
  const { account } = useAccountCustom();
  const navigate = useNavigationStore((s) => s.navigate);
  const [showCompleted, setShowCompleted] = useState(false);

  const normalizedOwner = normalizeAddress(account?.address);
  const { games, loading } = useGameTokensSlot({
    owner: account ? normalizedOwner : undefined,
    limit: 100,
  });

  const activeStoryAttempt = useActiveStoryAttempt();
  const { game: activeStoryGame } = useGame({
    gameId: activeStoryAttempt?.gameId ?? 0n,
    shouldLog: false,
  });

  const { activeGames, completedGames } = useMemo(() => {
    const active: GameTokenWithExtra[] = [];
    const completed: GameTokenWithExtra[] = [];

    for (const game of games as GameTokenWithExtra[]) {
      if (game.game_over) {
        completed.push(game);
      } else {
        active.push(game);
      }
    }

    if (activeStoryGame && !activeStoryGame.over) {
      const storyToken: GameTokenWithExtra = {
        token_id: activeStoryGame.id,
        score: activeStoryGame.totalScore,
        game_over: false,
        metadata: "{}",
        gameMetadata: { name: "Story Run" },
        run_data: activeStoryGame.runDataRaw,
      };
      const alreadyListed = active.some(
        (g) => g.token_id === activeStoryGame.id,
      );
      if (!alreadyListed) {
        active.unshift(storyToken);
      }
    }

    return { activeGames: active, completedGames: completed };
  }, [games, activeStoryGame]);

  if (!account) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
        <PageHeader title="My Games" />
        <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 flex flex-col items-center justify-center text-center">
          <span className="text-6xl mb-4 opacity-50">🎮</span>
          <p className="mb-6 font-sans text-2xl font-semibold text-white/85">
            Connect to see your games
          </p>
          <div className="w-full max-w-[320px]">
            <Connect />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden pb-[100px] pt-12">
      <PageHeader title="My Games" />

      <div className="mx-4 mt-2 mb-4 flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {loading ? (
          <div className="flex flex-1 items-center justify-center h-full">
            <p className="font-sans text-sm text-white/60">
              Loading your runs...
            </p>
          </div>
        ) : games.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex flex-1 items-center justify-center px-6 text-center h-full"
          >
            <p className="font-sans text-2xl font-extrabold" style={{ color: colors.accent }}>
              Start your first game from Home!
            </p>
          </motion.div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <section className="min-h-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="mb-2 flex items-center justify-between rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 backdrop-blur-xl"
              >
                <p
                  className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/75"
                >
                  Active games
                </p>
                <span className="font-sans text-[11px] font-bold" style={{ color: colors.accent }}>
                  {activeGames.length}
                </span>
              </motion.div>

              {activeGames.length === 0 ? (
                <p className="font-sans text-xs text-white/60">
                  No active runs.
                </p>
              ) : (
                <motion.div initial="hidden" animate="visible" className="space-y-2">
                  {activeGames.map((rawGame, index) => {
                    const runData = unpackRunData(rawGame.run_data ?? 0n);
                    const modeLabel = runData.mode === 1 ? "Endless Mode" : "Map Mode";
                    const themeId = getThemeId(runData.zoneId || 1);
                    const stars = getStars(rawGame, runData.currentLevel, runData.zoneCleared);

                    return (
                      <motion.div key={rawGame.token_id.toString()} custom={index} variants={cardVariants as any}>
                        <GameCard variant="solid" className="rounded-2xl border border-white/[0.16] bg-white/[0.12] shadow-lg shadow-black/20 backdrop-blur-xl" padding="p-0">
                          <button
                            type="button"
                            onClick={() => navigate("map", rawGame.token_id)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-left"
                          >
                            <img
                              src={getThemeImages(themeId).themeIcon}
                              alt={THEME_META[themeId].name}
                              className="h-11 w-11 rounded-xl object-cover shadow-md"
                              draggable={false}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-sans text-[17px] font-extrabold leading-none text-white">
                                {THEME_META[themeId].name} · {modeLabel}
                              </p>
                              <p className="mt-1 font-sans text-[12px] font-semibold text-white/80">
                                Lv.{Math.max(1, runData.currentLevel)} · Score: {runData.totalScore.toLocaleString()}
                              </p>
                              <p className="mt-1 flex items-center gap-1 font-sans text-[11px] font-semibold text-white/75">
                                <span className="flex items-center">
                                  {Array.from({ length: 3 }).map((_, i) => {
                                    const isFilled = i < stars;
                                    return (
                                      <span
                                        key={i}
                                        className="text-[11px] transition-colors"
                                        style={{ 
                                          color: isFilled ? "#FACC15" : "rgba(255,255,255,0.6)",
                                          textShadow: isFilled ? "0 0 6px rgba(250,204,21,0.6)" : "none"
                                        }}
                                      >
                                        ★
                                      </span>
                                    );
                                  })}
                                </span>
                                · {runData.levelMoves} moves
                              </p>
                            </div>
                            <motion.span 
                              whileHover={{ x: 4 }}
                              className="font-sans text-[12px] font-extrabold uppercase tracking-[0.1em]" 
                              style={{ color: colors.accent }}
                            >
                              PLAY →
                            </motion.span>
                          </button>
                        </GameCard>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>

            <section className="min-h-0 flex-1 overflow-hidden">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                type="button"
                onClick={() => setShowCompleted((prev) => !prev)}
                className="mb-2 flex w-full items-center justify-between rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 backdrop-blur-xl"
              >
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
                  Completed games
                </p>
                <span className="font-sans text-[11px] font-bold" style={{ color: colors.accent }}>
                  {completedGames.length} {showCompleted ? "▾" : "▸"}
                </span>
              </motion.button>

              {showCompleted && (
                <motion.div initial="hidden" animate="visible" className="max-h-full space-y-2 overflow-y-auto pr-1">
                  {completedGames.map((rawGame, index) => {
                    const runData = unpackRunData(rawGame.run_data ?? 0n);
                    const modeLabel = runData.mode === 1 ? "Endless Mode" : "Map Mode";
                    const themeId = getThemeId(runData.zoneId || 1);
                    const stars = getStars(rawGame, runData.currentLevel, runData.zoneCleared);

                    return (
                      <motion.div
                        key={rawGame.token_id.toString()}
                        custom={index}
                        variants={cardVariants as any}
                        className="opacity-65"
                      >
                        <GameCard variant="solid" className="rounded-2xl border border-white/[0.16] bg-white/[0.12] shadow-lg shadow-black/20 backdrop-blur-xl grayscale" padding="p-0">
                          <div className="flex items-center gap-3 px-3 py-3">
                            <img
                              src={getThemeImages(themeId).themeIcon}
                              alt={THEME_META[themeId].name}
                              className="h-11 w-11 rounded-xl object-cover shadow-md"
                              draggable={false}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-sans text-[17px] font-extrabold leading-none text-white">
                                {THEME_META[themeId].name} · {modeLabel}
                              </p>
                              <p className="mt-1 font-sans text-[12px] font-semibold text-white/80">
                                Lv.{Math.max(1, runData.currentLevel)} · Score: {runData.totalScore.toLocaleString()}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 font-sans text-[10px] font-medium text-white/60">
                                <span className="flex items-center">
                                  {Array.from({ length: 3 }).map((_, i) => {
                                    const isFilled = i < stars;
                                    return (
                                      <span
                                        key={i}
                                        className="text-[11px] transition-colors"
                                        style={{ 
                                          color: isFilled ? "#FACC15" : "rgba(255,255,255,0.6)",
                                          textShadow: isFilled ? "0 0 6px rgba(250,204,21,0.6)" : "none"
                                        }}
                                      >
                                        ★
                                      </span>
                                    );
                                  })}
                                </span>
                              </p>
                            </div>
                            <span
                              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 font-sans text-[9px] font-bold tracking-[0.06em] shadow-sm backdrop-blur-md text-white/60"
                            >
                              GAME OVER
                            </span>
                          </div>
                        </GameCard>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyGamesPage;
