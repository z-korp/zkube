import { motion } from "motion/react";
import { X } from "lucide-react";
import { ConstraintType } from "@/dojo/game/types/constraint";
import type { MapNodeData } from "@/hooks/useMapData";
import GameButton from "@/ui/components/shared/GameButton";
import StarRating from "@/ui/components/shared/StarRating";

export interface LevelPreviewProps {
  node: MapNodeData;
  gameId: number | null;
  onPlay: () => void;
  onClose: () => void;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  VeryEasy: "text-emerald-300",
  Easy: "text-emerald-400",
  Medium: "text-yellow-300",
  MediumHard: "text-orange-300",
  Hard: "text-orange-400",
  VeryHard: "text-red-400",
  Expert: "text-rose-400",
  Master: "text-red-500",
};

export const LevelPreview: React.FC<LevelPreviewProps> = ({
  node,
  gameId,
  onPlay,
  onClose,
}) => {
  const levelConfig = node.levelConfig;

  const difficulty = levelConfig?.difficulty.value ?? "Unknown";
  const constraints = levelConfig
    ? [levelConfig.constraint, levelConfig.constraint2]
        .filter((c) => c.constraintType !== ConstraintType.None)
        .map((c) => c.getLabel())
    : [];

  const canPlay =
    node.type !== "shop" &&
    gameId !== null &&
    (node.state === "current" || node.state === "available");

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-sky-300/25 bg-slate-900/95 p-5 shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <X size={18} />
        </button>

        <h3 className="pr-8 font-['Fredericka_the_Great'] text-xl text-white">
          {node.type === "shop"
            ? `Zone ${node.zone} Shop`
            : node.type === "boss"
              ? `Boss Level ${node.contractLevel}`
              : `Level ${node.contractLevel}`}
        </h3>

        {node.type === "shop" ? (
          <p className="mt-4 text-sm text-slate-200/90">
            Spend cubes on consumables before the boss encounter.
          </p>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Difficulty</span>
              <span
                className={`font-['Bangers'] text-lg tracking-wide ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}
              >
                {difficulty}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Score</span>
              <span className="font-['Bangers'] text-lg tracking-wide text-white">
                {String(levelConfig?.pointsRequired ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Max Moves</span>
              <span className="font-['Bangers'] text-lg tracking-wide text-white">
                {String(levelConfig?.maxMoves ?? 0)}
              </span>
            </div>

            <div>
              <p className="mb-1 text-slate-400">Constraints</p>
              {node.state === "cleared" && constraints.length > 0 ? (
                <div className="space-y-1">
                  {constraints.map((constraint) => (
                    <p key={constraint} className="rounded-md bg-slate-800/80 px-2 py-1 text-slate-100">
                      {constraint}
                    </p>
                  ))}
                </div>
              ) : node.state === "cleared" ? (
                <p className="rounded-md bg-slate-800/60 px-2 py-1 text-slate-300">No constraint</p>
              ) : (
                <p className="rounded-md bg-slate-800/60 px-2 py-1 text-slate-400 italic text-xs">
                  Revealed when level starts
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Stars</span>
              <StarRating stars={node.state === "cleared" ? Math.max(1, node.stars) : 0} />
            </div>
          </div>
        )}

        {canPlay && (
          <div className="mt-5">
            <GameButton label="PLAY" variant="primary" onClick={onPlay} />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LevelPreview;
