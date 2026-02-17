import { Game } from "@/dojo/game/models/game";
import { Dialog, DialogContent, DialogTitle } from "../elements/dialog";
import { useNavigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Gem, Star, Trophy } from "lucide-react";

interface VictoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

const VictoryDialog: React.FC<VictoryDialogProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState(0);

  // Reset and start animation when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAnimationPhase(0);
      const timer1 = setTimeout(() => setAnimationPhase(1), 300);
      const timer2 = setTimeout(() => setAnimationPhase(2), 800);
      const timer3 = setTimeout(() => setAnimationPhase(3), 1300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    navigate("/");
  };

  // Generate tweet URL for victory
  const tweetUrl = useMemo(() => {
    const cubesDisplay = "🧊".repeat(Math.min(game.totalCubes, 10)) + (game.totalCubes > 10 ? `+${game.totalCubes - 10}` : "");
    const tweetMsg = `🏆 I BEAT zKube! All 50 levels COMPLETE!
${cubesDisplay} ${game.totalCubes} cubes earned
💎 ${game.totalScore.toLocaleString()} total points
🔥 ${game.maxComboRun} max combo
Can you beat all 50 levels? 😎
Play now: app.zkube.xyz
@zkorp_ @zkube_game`;
    return `https://x.com/intent/tweet?text=${encodeURIComponent(tweetMsg)}&url=app.zkube.xyz`;
  }, [game.totalCubes, game.totalScore, game.maxComboRun]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[450px] w-[95%] flex flex-col mx-auto justify-start rounded-lg px-6 py-8 bg-gradient-to-b from-yellow-900/30 to-slate-900 border-2 border-yellow-500/50"
      >
        {/* Animated Trophy */}
        <motion.div
          className="flex justify-center mb-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={animationPhase >= 1 ? { scale: 1, rotate: 0 } : {}}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="relative">
            <Trophy
              size={72}
              className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]"
            />
            {/* Sparkles around trophy */}
            <AnimatePresence>
              {animationPhase >= 1 && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [-30, -40], y: [-10, -20] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                    className="absolute top-0 left-0"
                  >
                    <Star size={20} className="text-yellow-300" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], x: [30, 40], y: [-5, -15] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.7 }}
                    className="absolute top-0 right-0"
                  >
                    <Star size={20} className="text-yellow-300" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], y: [20, 30] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.9 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2"
                  >
                    <Star size={20} className="text-yellow-300" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={animationPhase >= 1 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <DialogTitle className="text-4xl text-center mb-2 text-yellow-400 font-bold">
            VICTORY!
          </DialogTitle>
          <p className="text-center text-lg text-yellow-200/80 mb-4">
            You conquered all 50 levels!
          </p>
        </motion.div>

        <div className="flex flex-col gap-5">
          {/* Level display */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={animationPhase >= 2 ? { opacity: 1, scale: 1 } : {}}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div className="text-6xl font-bold text-white mb-1">50</div>
            <div className="text-lg text-yellow-400 flex items-center justify-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              All Levels Complete
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div 
            className="flex gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={animationPhase >= 2 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Total Cubes */}
            <div className="flex flex-col items-center gap-1 bg-yellow-900/30 px-4 py-3 rounded-lg flex-1 border border-yellow-500/30">
              <div className="text-3xl flex gap-2 items-center text-yellow-400">
                {game.totalCubes}
                <span>🧊</span>
              </div>
              <div className="text-xs text-yellow-400/80">Cubes</div>
            </div>

            {/* Total Score */}
            <div className="flex flex-col items-center gap-1 bg-cyan-900/30 px-4 py-3 rounded-lg flex-1 border border-cyan-500/30">
              <div className="text-3xl flex gap-2 items-center text-cyan-400">
                {game.totalScore.toLocaleString()}
                <Gem size={16} />
              </div>
              <div className="text-xs text-cyan-400/80">Score</div>
            </div>

            {/* Max Combo */}
            <div className="flex flex-col items-center gap-1 bg-orange-900/30 px-4 py-3 rounded-lg flex-1 border border-orange-500/30">
              <div className="text-3xl flex gap-2 items-center text-orange-500">
                {game.maxComboRun}
                <Flame size={16} />
              </div>
              <div className="text-xs text-orange-400/80">Best Combo</div>
            </div>
          </motion.div>

          {/* Share on X button */}
          <motion.a
            href={tweetUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-lg px-4 py-3 transition-colors font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={animationPhase >= 3 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3 }}
          >
            <span className="font-bold text-lg">🏆</span>
            <span>Share Victory on X</span>
          </motion.a>

          {/* Return home button */}
          <motion.button
            onClick={handleClose}
            className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-2 transition-colors text-sm"
            initial={{ opacity: 0 }}
            animate={animationPhase >= 3 ? { opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            Return to Home
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VictoryDialog;
