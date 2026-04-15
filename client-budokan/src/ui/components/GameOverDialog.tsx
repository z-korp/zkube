import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { Flame, Gem, Layers, RotateCw, Trophy, Zap } from "lucide-react";
import { BOSS_LEVELS, PRE_BOSS_LEVELS, LEVEL_CAP } from "@/dojo/game/constants";

const ENDLESS_TIERS = [
  { name: "Very Easy", color: "#22c55e", emoji: "🟢" },
  { name: "Easy", color: "#84cc16", emoji: "🟡" },
  { name: "Medium", color: "#eab308", emoji: "🟠" },
  { name: "Medium Hard", color: "#f97316", emoji: "🔶" },
  { name: "Hard", color: "#ef4444", emoji: "🔴" },
  { name: "Very Hard", color: "#dc2626", emoji: "💀" },
  { name: "Expert", color: "#9333ea", emoji: "⚡" },
  { name: "Master", color: "#f59e0b", emoji: "👑" },
] as const;

const DEFAULT_MULTIPLIERS = [10, 15, 20, 30, 40, 60, 80, 100];

function getEndlessTier(difficulty: number) {
  const idx = Math.max(0, Math.min(difficulty - 2, ENDLESS_TIERS.length - 1));
  const tier = ENDLESS_TIERS[idx];
  const mult = DEFAULT_MULTIPLIERS[idx] ?? 10;
  return { ...tier, multiplier: `×${mult / 10}`, index: idx };
}

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
  const isEndless = game.mode === 1;

  const handleClose = () => {
    onClose();
  };

  const handlePlayAgain = () => {
    onClose();
  };

  // Endless tier info
  const endlessTier = useMemo(() => getEndlessTier(game.currentDifficulty), [game.currentDifficulty]);

  // Check if this is a new personal best
  const isNewBestLevel = useMemo(() => {
    if (!playerMeta) return false;
    return game.level >= playerMeta.bestLevel;
  }, [game.level, playerMeta]);

  // Contextual subtitle based on performance
  const subtitle = useMemo(() => {
    if (isEndless) {
      if (endlessTier.index >= 6) return "Legendary arena run!";
      if (endlessTier.index >= 4) return "Impressive endurance!";
      if (endlessTier.index >= 2) return "Solid arena run!";
      return "The arena awaits your return";
    }
    if (isNewBestLevel && game.level > 1) return "New personal best!";
    if ((PRE_BOSS_LEVELS as readonly number[]).includes(game.level)) return "So close to the guardian...";
    if (BOSS_LEVELS.includes(game.level as typeof BOSS_LEVELS[number]) && game.level < LEVEL_CAP) return "Fell to the guardian...";
    if (game.level >= 40) return "Legendary run!";
    if (game.level >= 25) return "Incredible run!";
    if (game.level >= 10) return "Nice run!";
    if (game.level >= 5) return "Good effort!";
    return "Better luck next time";
  }, [game.level, isNewBestLevel, isEndless, endlessTier]);

  // Subtitle color based on sentiment
  const subtitleColor = useMemo(() => {
    if (isEndless) return "";
    if (isNewBestLevel && game.level > 1) return "text-yellow-400";
    if ((PRE_BOSS_LEVELS as readonly number[]).includes(game.level)) return "text-orange-400";
    if (BOSS_LEVELS.includes(game.level as typeof BOSS_LEVELS[number])) return "text-red-400";
    if (game.level >= 25) return "text-purple-400";
    if (game.level >= 10) return "text-cyan-400";
    if (game.level >= 5) return "text-slate-300";
    return "text-slate-400";
  }, [game.level, isNewBestLevel, isEndless]);

  // Generate tweet text
  const tweetUrl = useMemo(() => {
    const score = game.totalScore;
    const combo = game.maxComboRun;

    if (isEndless) {
      const tweetMsg = `${endlessTier.emoji} Reached ${endlessTier.name} rank in @zkube_game Endless!

${score.toLocaleString()} pts | ${endlessTier.multiplier} multiplier | ${combo}x best combo

Can you beat my score?

app.zkube.xyz`;
      return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}`;
    }

    const level = game.level;

    let opener: string;
    if (level >= 40) {
      opener = `I just crushed Level ${level} on @zkube_game!`;
    } else if (level >= 25) {
      opener = `Level ${level} down on @zkube_game!`;
    } else if (BOSS_LEVELS.includes(level as typeof BOSS_LEVELS[number])) {
      opener = `Just beat the Level ${level} guardian on @zkube_game!`;
    } else if ((PRE_BOSS_LEVELS as readonly number[]).includes(level)) {
      opener = `So close! Reached Level ${level} on @zkube_game`;
    } else if (level >= 10) {
      opener = `Made it to Level ${level} on @zkube_game!`;
    } else {
      opener = `Just played @zkube_game - reached Level ${level}`;
    }

    const statsLine = `${score.toLocaleString()} pts | ${combo}x combo`;
    const challenge = level >= 30 ? "Think you can do better?" : level >= 15 ? "Can you beat my score?" : "Your turn!";

    const tweetMsg = `${opener}

${statsLine}

${challenge}

app.zkube.xyz`;

    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}`;
  }, [game.level, game.totalScore, game.maxComboRun, isEndless, endlessTier]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
  };

  const levelVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.34, 1.56, 0.64, 1],
      }
    },
  };

  const badgeVariants: Variants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        delay: 0.6,
      }
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[420px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
          {/* Title + Subtitle */}
          <motion.div variants={itemVariants} className="text-center">
            <DialogTitle className="text-4xl text-center mb-2">
              Game Over
            </DialogTitle>
            <p className={`text-lg font-medium ${subtitleColor}`} style={isEndless ? { color: endlessTier.color } : undefined}>
              {subtitle}
            </p>
          </motion.div>

          {isEndless ? (
            <>
              {/* Endless: Score as hero number */}
              <motion.div variants={levelVariants} className="text-center py-2">
                <div
                  className="text-6xl font-bold text-cyan-400 mb-1"
                  style={{ textShadow: "0 0 30px rgba(34, 211, 238, 0.4)" }}
                >
                  {game.totalScore.toLocaleString()}
                </div>
                <div className="text-lg text-slate-400 flex items-center justify-center gap-2">
                  <Gem size={16} className="text-cyan-400" />
                  <span>Total Score</span>
                </div>
              </motion.div>

              {/* Endless stats: Rank, Multiplier, Best Combo */}
              <motion.div variants={itemVariants} className="flex gap-3 justify-center items-stretch">
                {/* Rank reached */}
                <div className="flex flex-col items-center gap-1 bg-slate-800/60 px-4 py-3 rounded-lg flex-1" style={{ borderWidth: 1, borderColor: `${endlessTier.color}40` }}>
                  <div className="text-xl font-bold" style={{ color: endlessTier.color }}>
                    {endlessTier.name}
                  </div>
                  <div className="text-xs text-slate-400">Rank</div>
                </div>

                {/* Multiplier */}
                <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-3 rounded-lg flex-1">
                  <div className="text-2xl flex gap-1.5 items-center font-bold" style={{ color: endlessTier.color }}>
                    {endlessTier.multiplier}
                    <Zap size={20} />
                  </div>
                  <div className="text-xs text-slate-400">Multiplier</div>
                </div>

                {/* Combo Streak */}
                <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-3 rounded-lg flex-1">
                  <div className="text-2xl flex gap-1.5 items-center text-orange-500">
                    {game.combo}x
                    <Flame size={20} />
                  </div>
                  <div className="text-xs text-slate-400">Combo Streak</div>
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* Story: Level reached - prominent display with glow */}
              <motion.div variants={levelVariants} className="text-center py-2">
                <div className="relative inline-block">
                  <div
                    className="text-7xl font-bold text-white mb-1"
                    style={{
                      textShadow: isNewBestLevel
                        ? "0 0 30px rgba(250, 204, 21, 0.6), 0 0 60px rgba(250, 204, 21, 0.3)"
                        : "0 0 20px rgba(168, 85, 247, 0.4)",
                    }}
                  >
                    {game.level}
                  </div>
                  {isNewBestLevel && game.level > 1 && (
                    <motion.div
                      variants={badgeVariants}
                      className="absolute -top-2 -right-12 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ boxShadow: "0 0 10px rgba(250, 204, 21, 0.5)" }}
                    >
                      NEW!
                    </motion.div>
                  )}
                </div>
                <div className="text-lg text-slate-400 flex items-center justify-center gap-2">
                  <Layers size={16} className="text-purple-400" />
                  <span>Reached Level {game.level}</span>
                </div>
              </motion.div>

              {/* Story stats: Score, Combo */}
              <motion.div variants={itemVariants} className="flex gap-3 justify-center items-stretch">
                <div className="flex flex-col items-center gap-1 bg-slate-800/60 px-4 py-3 rounded-lg flex-1 border border-cyan-500/20">
                  <div className="text-3xl flex gap-2 items-center text-cyan-400 font-bold">
                    {game.totalScore.toLocaleString()}
                    <Gem size={24} />
                  </div>
                  <div className="text-xs text-slate-400">Score</div>
                </div>
                <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-3 rounded-lg flex-1">
                  <div className="text-2xl flex gap-1.5 items-center text-orange-500">
                    {game.maxComboRun}
                    <Flame size={20} />
                  </div>
                  <div className="text-xs text-slate-400">Best Combo</div>
                </div>
              </motion.div>

              {/* Previous best indicator */}
              {playerMeta && playerMeta.bestLevel > 0 && !isNewBestLevel && (
                <motion.div variants={itemVariants} className="text-center text-sm text-slate-500">
                  <Trophy size={16} className="text-yellow-600 mr-1.5" />
                  Your best: Level {playerMeta.bestLevel}
                </motion.div>
              )}
            </>
          )}

          {/* Action buttons */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 mt-1">
            {/* Primary CTA: Play Again */}
            <button
              onClick={handlePlayAgain}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg px-4 py-3.5 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              <RotateCw size={16} />
              <span>Play Again</span>
            </button>

            {/* Secondary: Share on X */}
            <a
              href={tweetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-transparent border border-slate-600 hover:border-slate-400 hover:bg-slate-800/50 text-slate-300 hover:text-white rounded-lg px-4 py-3 transition-all"
            >
              <span className="font-bold text-lg">𝕏</span>
              <span>Share your run</span>
            </a>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
