import { useMemo } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);
  const pendingLevelCompletion = useNavigationStore(
    (state) => state.pendingLevelCompletion,
  );
  const setPendingLevelCompletion = useNavigationStore(
    (state) => state.setPendingLevelCompletion,
  );
  const setPendingPreviewLevel = useNavigationStore(
    (state) => state.setPendingPreviewLevel,
  );

  const { game } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });

  const currentZone = game?.zoneId || 1;
  const baseLevel = (currentZone - 1) * 10;

  const levels = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const level = baseLevel + index + 1;
      const stars = game ? game.getLevelStars(level) : 0;
      const currentLevel = game?.level ?? 1;
      const isCurrent = level === currentLevel;
      const unlocked = level <= currentLevel;
      return { level, stars, isCurrent, unlocked };
    });
  }, [baseLevel, game]);

  const handlePlay = () => {
    if (gameId === null) return;
    navigate("play", gameId);
  };

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="WORLD MAP"
        subtitle={`Zone ${currentZone}`}
        onBack={goBack}
        rightSlot={null}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!game ? (
          <div className="text-slate-300 text-sm">No active run found.</div>
        ) : (
          <div className="max-w-[560px] mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            {levels.map((entry, index) => (
              <motion.button
                key={entry.level}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={handlePlay}
                disabled={!entry.unlocked}
                className={`rounded-xl border px-3 py-3 text-left ${
                  entry.unlocked
                    ? "bg-slate-900/80 border-slate-600/70"
                    : "bg-slate-900/40 border-slate-800/70 opacity-50"
                } ${entry.isCurrent ? "ring-2 ring-cyan-400/50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-['Fredericka_the_Great'] text-white text-lg">
                    Level {entry.level - baseLevel}
                  </p>
                  {entry.unlocked && <Play size={14} className="text-cyan-300" />}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {"★".repeat(entry.stars)}{"☆".repeat(3 - entry.stars)}
                </p>
              </motion.button>
            ))}
          </div>
        )}

        {pendingLevelCompletion && (
          <LevelCompleteDialog
            isOpen={true}
            onClose={() => {
              const completedLevel = pendingLevelCompletion.level;
              setPendingLevelCompletion(null);
              setPendingPreviewLevel(completedLevel + 1);
            }}
            level={pendingLevelCompletion.level}
            levelMoves={pendingLevelCompletion.levelMoves}
            prevTotalCubes={0}
            totalCubes={0}
            prevTotalScore={pendingLevelCompletion.prevTotalScore}
            totalScore={pendingLevelCompletion.totalScore}
            gameLevel={pendingLevelCompletion.gameLevel}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
