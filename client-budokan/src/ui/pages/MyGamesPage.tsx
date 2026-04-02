import { useMemo, useState } from "react";
import { motion } from "motion/react";

import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";
import useAccountCustom from "@/hooks/useAccountCustom";
import { useGameTokensSlot, type SlotGameTokenData } from "@/hooks/useGameTokensSlot";
import { useNavigationStore } from "@/stores/navigationStore";
import GameCard from "@/ui/components/shared/GameCard";
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
  settings_id?: number;
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

const cardVariants = {
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

    return { activeGames: active, completedGames: completed };
  }, [games]);

  if (!account) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="font-display text-lg" style={{ color: colors.textMuted }}>
          Connect to see your games
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-4 pb-4 pt-4">
      <h1 className="mb-3 text-center font-display text-[24px] font-black" style={{ color: colors.text }}>
        My Games
      </h1>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Loading your runs...
          </p>
        </div>
      ) : games.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="font-display text-base" style={{ color: colors.textMuted }}>
            Start your first game from Home!
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <section className="min-h-0">
            <div className="mb-2 flex items-center justify-between">
              <p
                className="text-[11px] uppercase tracking-[0.15em]"
                style={{ color: colors.textMuted }}
              >
                Active games
              </p>
              <span className="text-[11px]" style={{ color: colors.accent }}>
                {activeGames.length}
              </span>
            </div>

            {activeGames.length === 0 ? (
              <p className="text-xs" style={{ color: colors.textMuted }}>
                No active runs.
              </p>
            ) : (
              <motion.div initial="hidden" animate="visible" className="space-y-2">
                {activeGames.map((rawGame, index) => {
                  const runData = unpackRunData(rawGame.run_data ?? 0n);
                  const modeLabel = runData.mode === 1 ? "Endless Mode" : "Map Mode";
                  const themeId = getThemeId(runData.zoneId || rawGame.settings_id || 1);
                  const stars = getStars(rawGame, runData.currentLevel, runData.zoneCleared);

                  return (
                    <motion.div key={rawGame.token_id.toString()} custom={index} variants={cardVariants}>
                      <GameCard variant="solid" className="border-white/15" padding="p-0">
                        <button
                          type="button"
                          onClick={() => navigate("map", rawGame.token_id)}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left"
                        >
                          <img
                            src={getThemeImages(themeId).themeIcon}
                            alt={THEME_META[themeId].name}
                            className="h-11 w-11 rounded-md"
                            draggable={false}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-[13px] font-bold" style={{ color: colors.text }}>
                              {THEME_META[themeId].name} · {modeLabel}
                            </p>
                            <p className="mt-0.5 text-[11px]" style={{ color: colors.textMuted }}>
                              Lv.{Math.max(1, runData.currentLevel)} · Score: {runData.totalScore.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[10px]" style={{ color: colors.textMuted }}>
                              {"★".repeat(stars)}{"☆".repeat(3 - stars)} · {runData.levelMoves} moves
                            </p>
                          </div>
                          <span className="font-display text-xs font-black" style={{ color: colors.accent2 }}>
                            PLAY →
                          </span>
                        </button>
                      </GameCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </section>

          <section className="min-h-0 flex-1 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCompleted((prev) => !prev)}
              className="mb-2 flex w-full items-center justify-between"
            >
              <p className="text-[11px] uppercase tracking-[0.15em]" style={{ color: colors.textMuted }}>
                Completed games
              </p>
              <span className="text-[11px]" style={{ color: colors.accent }}>
                {completedGames.length} {showCompleted ? "▾" : "▸"}
              </span>
            </button>

            {showCompleted && (
              <motion.div initial="hidden" animate="visible" className="max-h-full space-y-2 overflow-y-auto pr-1">
                {completedGames.map((rawGame, index) => {
                  const runData = unpackRunData(rawGame.run_data ?? 0n);
                  const modeLabel = runData.mode === 1 ? "Endless Mode" : "Map Mode";
                  const themeId = getThemeId(runData.zoneId || rawGame.settings_id || 1);
                  const stars = getStars(rawGame, runData.currentLevel, runData.zoneCleared);

                  return (
                    <motion.div
                      key={rawGame.token_id.toString()}
                      custom={index}
                      variants={cardVariants}
                      className="opacity-65"
                    >
                      <GameCard variant="solid" className="border-white/10 grayscale" padding="p-0">
                        <div className="flex items-center gap-3 px-3 py-3">
                          <img
                            src={getThemeImages(themeId).themeIcon}
                            alt={THEME_META[themeId].name}
                            className="h-11 w-11 rounded-md"
                            draggable={false}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-[13px] font-bold" style={{ color: colors.text }}>
                              {THEME_META[themeId].name} · {modeLabel}
                            </p>
                            <p className="mt-0.5 text-[11px]" style={{ color: colors.textMuted }}>
                              Lv.{Math.max(1, runData.currentLevel)} · Score: {runData.totalScore.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[10px]" style={{ color: colors.textMuted }}>
                              {"★".repeat(stars)}{"☆".repeat(3 - stars)}
                            </p>
                          </div>
                          <span
                            className="rounded-md border px-2 py-1 text-[9px] font-bold tracking-[0.06em]"
                            style={{
                              color: colors.textMuted,
                              borderColor: `${colors.textMuted}44`,
                              backgroundColor: `${colors.textMuted}1A`,
                            }}
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
  );
};

export default MyGamesPage;
