import { useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { Flame, Gem, Layers, RotateCw, Home, Trophy } from "lucide-react";
import { Game } from "@/dojo/game/models/game";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { BOSS_LEVELS, PRE_BOSS_LEVELS, LEVEL_CAP } from "@/dojo/game/constants";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const { playerMeta } = usePlayerMeta();

  const isNewBestLevel = useMemo(() => {
    if (!playerMeta) return false;
    return game.level >= playerMeta.bestLevel;
  }, [game.level, playerMeta]);

  const subtitle = useMemo(() => {
    if (isNewBestLevel && game.level > 1) return "New personal best!";
    if ((PRE_BOSS_LEVELS as readonly number[]).includes(game.level)) return "So close to the boss...";
    if (BOSS_LEVELS.includes(game.level as typeof BOSS_LEVELS[number]) && game.level < LEVEL_CAP) return "Fell to the boss...";
    if (game.level >= 40) return "Legendary run!";
    if (game.level >= 25) return "Incredible run!";
    if (game.level >= 10) return "Nice run!";
    if (game.level >= 5) return "Good effort!";
    return "Better luck next time";
  }, [game.level, isNewBestLevel]);

  const subtitleColor = useMemo(() => {
    if (isNewBestLevel && game.level > 1) return "text-yellow-400";
    if ((PRE_BOSS_LEVELS as readonly number[]).includes(game.level)) return "text-orange-400";
    if (BOSS_LEVELS.includes(game.level as typeof BOSS_LEVELS[number])) return "text-red-400";
    if (game.level >= 25) return "text-purple-400";
    if (game.level >= 10) return "text-cyan-400";
    if (game.level >= 5) return "text-slate-300";
    return "text-slate-400";
  }, [game.level, isNewBestLevel]);

  const tweetUrl = useMemo(() => {
    const level = game.level;
    const score = game.totalScore;
    const combo = game.maxComboRun;

    let opener: string;
    if (level >= 40) opener = `I just crushed Level ${level} on @zkube_game!`;
    else if (level >= 25) opener = `Level ${level} down on @zkube_game!`;
    else if (BOSS_LEVELS.includes(level as typeof BOSS_LEVELS[number])) opener = `Just beat the Level ${level} boss on @zkube_game!`;
    else if ((PRE_BOSS_LEVELS as readonly number[]).includes(level)) opener = `So close! Reached Level ${level} on @zkube_game`;
    else if (level >= 10) opener = `Made it to Level ${level} on @zkube_game!`;
    else opener = `Just played @zkube_game - reached Level ${level}`;

    const statsLine = `${score.toLocaleString()} pts | ${combo}x combo`;
    const challenge = level >= 30 ? "Think you can do better?" : level >= 15 ? "Can you beat my score?" : "Your turn!";

    const tweetMsg = `${opener}\n\n${statsLine}\n\n${challenge}\n\napp.zkube.xyz`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}`;
  }, [game.level, game.totalScore, game.maxComboRun]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-slate-900/98 border-t border-white/15 backdrop-blur-xl px-5 pb-8 pt-3 shadow-2xl max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-600" />

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4 max-w-[400px] mx-auto"
            >
              <motion.div variants={itemVariants} className="text-center">
                <h2 className="font-['Fredericka_the_Great'] text-3xl text-white mb-1">
                  Game Over
                </h2>
                <p className={`text-sm font-medium ${subtitleColor}`}>
                  {subtitle}
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center py-1">
                <div className="relative inline-block">
                  <div
                    className="font-['Fredericka_the_Great'] text-6xl text-white"
                    style={{
                      textShadow: isNewBestLevel
                        ? "0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(250,204,21,0.3)"
                        : "0 0 20px rgba(168,85,247,0.4)",
                    }}
                  >
                    {game.level}
                  </div>
                  {isNewBestLevel && game.level > 1 && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 } }}
                      className="absolute -top-1 -right-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    >
                      NEW!
                    </motion.span>
                  )}
                </div>
                <div className="text-sm text-slate-400 flex items-center justify-center gap-1.5 mt-1">
                  <Layers size={14} className="text-purple-400" />
                  Level reached
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-2">
                <div className="flex flex-col items-center gap-1 bg-black/30 rounded-xl px-4 py-3 flex-1">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <span className="font-['Fredericka_the_Great'] text-2xl">
                      {game.totalScore.toLocaleString()}
                    </span>
                    <Gem size={18} />
                  </div>
                  <span className="text-[10px] text-slate-400">Score</span>
                </div>
                <div className="flex flex-col items-center gap-1 bg-black/30 rounded-xl px-4 py-3 flex-1">
                  <div className="flex items-center gap-1.5 text-orange-400">
                    <span className="font-['Fredericka_the_Great'] text-2xl">
                      {game.maxComboRun}x
                    </span>
                    <Flame size={18} />
                  </div>
                  <span className="text-[10px] text-slate-400">Best Combo</span>
                </div>
              </motion.div>

              {playerMeta && playerMeta.bestLevel > 0 && !isNewBestLevel && (
                <motion.div variants={itemVariants} className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Trophy size={12} className="text-yellow-600" />
                  Your best: Level {playerMeta.bestLevel}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex gap-2 mt-1">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl px-4 py-3.5 transition-colors"
                >
                  <Home size={16} />
                  Home
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl px-4 py-3.5 transition-colors"
                >
                  <RotateCw size={16} />
                  Retry
                </button>
              </motion.div>

              <motion.a
                variants={itemVariants}
                href={tweetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                <span className="font-bold text-base">𝕏</span>
                Share your run
              </motion.a>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GameOverDialog;
