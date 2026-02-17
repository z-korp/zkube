import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { motion } from "motion/react";
import { usePlayerMeta } from "@/hooks/usePlayerMeta";
import { Flame, Gem, Layers, RotateCw, Trophy } from "lucide-react";

interface GameOverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

const BOSS_LEVELS = [10, 20, 30, 40, 50];

const GameOverDialog: React.FC<GameOverDialogProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const navigate = useNavigate();
  const { playerMeta } = usePlayerMeta();
  
  const handleClose = () => {
    onClose();
    navigate("/");
  };

  const handlePlayAgain = () => {
    onClose();
    navigate("/");
  };

  // Check if this is a new personal best
  const isNewBestLevel = useMemo(() => {
    if (!playerMeta) return false;
    return game.level >= playerMeta.bestLevel;
  }, [game.level, playerMeta]);

  // Contextual subtitle based on performance
  const subtitle = useMemo(() => {
    if (isNewBestLevel && game.level > 1) return "New personal best!";
    if ([9, 19, 29, 39, 49].includes(game.level)) return "So close to the boss...";
    if (BOSS_LEVELS.includes(game.level) && game.level < 50) return "Boss defeated!";
    if (game.level >= 40) return "Legendary run!";
    if (game.level >= 25) return "Incredible run!";
    if (game.level >= 10) return "Nice run!";
    if (game.level >= 5) return "Good effort!";
    return "Better luck next time";
  }, [game.level, isNewBestLevel]);

  // Subtitle color based on sentiment
  const subtitleColor = useMemo(() => {
    if (isNewBestLevel && game.level > 1) return "text-yellow-400";
    if ([9, 19, 29, 39, 49].includes(game.level)) return "text-orange-400";
    if (BOSS_LEVELS.includes(game.level)) return "text-green-400";
    if (game.level >= 25) return "text-purple-400";
    if (game.level >= 10) return "text-cyan-400";
    if (game.level >= 5) return "text-slate-300";
    return "text-slate-400";
  }, [game.level, isNewBestLevel]);

  // Generate epic tweet text
  const tweetUrl = useMemo(() => {
    const level = game.level;
    const score = game.totalScore;
    const cubes = game.totalCubes;
    const combo = game.maxComboRun;
    
    // Dynamic opener based on performance
    let opener: string;
    if (level >= 40) {
      opener = `I just crushed Level ${level} on @zkube_game!`;
    } else if (level >= 25) {
      opener = `Level ${level} down on @zkube_game!`;
    } else if (BOSS_LEVELS.includes(level)) {
      opener = `Just beat the Level ${level} boss on @zkube_game!`;
    } else if ([9, 19, 29, 39, 49].includes(level)) {
      opener = `So close! Reached Level ${level} on @zkube_game`;
    } else if (level >= 10) {
      opener = `Made it to Level ${level} on @zkube_game!`;
    } else {
      opener = `Just played @zkube_game - reached Level ${level}`;
    }

    // Build stats line with emojis
    const statsLine = `${score.toLocaleString()} pts | ${cubes} cubes | ${combo}x combo`;
    
    // Dynamic challenge based on level
    let challenge: string;
    if (level >= 30) {
      challenge = "Think you can do better?";
    } else if (level >= 15) {
      challenge = "Can you beat my score?";
    } else {
      challenge = "Your turn!";
    }

    const tweetMsg = `${opener}

${statsLine}

${challenge}

app.zkube.xyz`;

    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}`;
  }, [game.level, game.totalCubes, game.totalScore, game.maxComboRun]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
  };

  const levelVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5, 
        ease: [0.34, 1.56, 0.64, 1], // Spring-like overshoot
      }
    },
  };

  const badgeVariants = {
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
            <p className={`text-lg font-medium ${subtitleColor}`}>
              {subtitle}
            </p>
          </motion.div>

          {/* Level reached - prominent display with glow */}
          <motion.div 
            variants={levelVariants}
            className="text-center py-2"
          >
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
                  style={{
                    boxShadow: "0 0 10px rgba(250, 204, 21, 0.5)",
                  }}
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

          {/* Stats row: Score (prominent), Cubes, Combo */}
          <motion.div 
            variants={itemVariants}
            className="flex gap-3 justify-center items-stretch"
          >
            {/* Total Score - Primary stat */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/60 px-4 py-3 rounded-lg flex-1 border border-cyan-500/20">
              <div className="text-3xl flex gap-2 items-center text-cyan-400 font-bold">
                {game.totalScore.toLocaleString()}
                <Gem size={24} className="text-2xl" />
              </div>
              <div className="text-xs text-slate-400">Score</div>
            </div>

            {/* Total Cubes */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-3 rounded-lg flex-1">
              <div className="text-2xl flex gap-1.5 items-center text-yellow-400">
                {game.totalCubes}
                <span className="text-xl">🧊</span>
              </div>
              <div className="text-xs text-slate-400">Cubes</div>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col items-center gap-1 bg-slate-800/50 px-3 py-3 rounded-lg flex-1">
              <div className="text-2xl flex gap-1.5 items-center text-orange-500">
                {game.maxComboRun}
                <Flame size={20} className="text-xl" />
              </div>
              <div className="text-xs text-slate-400">Best Combo</div>
            </div>
          </motion.div>

          {/* Previous best indicator */}
          {playerMeta && playerMeta.bestLevel > 0 && !isNewBestLevel && (
            <motion.div 
              variants={itemVariants}
              className="text-center text-sm text-slate-500"
            >
              <Trophy size={16} className="text-yellow-600 mr-1.5" />
              Your best: Level {playerMeta.bestLevel}
            </motion.div>
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
