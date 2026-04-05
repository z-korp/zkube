import { motion } from "motion/react";
import { X } from "lucide-react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import type { MapNodeData } from "@/hooks/useMapData";
import type { Game } from "@/dojo/game/models/game";
import type { GameLevelData } from "@/hooks/useGameLevel";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";
import CubeIcon from "@/ui/components/CubeIcon";

export interface LevelPreviewProps {
  node: MapNodeData;
  game: Game | null;
  gameLevel: GameLevelData | null;
  gameId: bigint | null;
  levelStars?: number[];
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

const DIFFICULTY_LABELS: Record<string, string> = {
  VeryEasy: "Very Easy",
  Easy: "Easy",
  Medium: "Medium",
  MediumHard: "Medium Hard",
  Hard: "Hard",
  VeryHard: "Very Hard",
  Expert: "Expert",
  Master: "Master",
};

export const LevelPreview: React.FC<LevelPreviewProps> = ({
  node,
  game,
  gameLevel,
  gameId,
  levelStars,
  onPlay,
  onClose,
}) => {
  const stars =
    node.contractLevel
      ? levelStars?.[node.contractLevel - 1] ?? game?.getLevelStars(node.contractLevel) ?? 0
      : 0;

  const useContractData = gameLevel && node.contractLevel === gameLevel.level;

  const difficulty = useContractData
    ? Difficulty.from(gameLevel.difficulty).value
    : (node.levelConfig?.difficulty.value ?? "Unknown");

  const pointsRequired = useContractData
    ? gameLevel.pointsRequired
    : (node.levelConfig?.pointsRequired ?? 0);

  const maxMoves = useContractData
    ? gameLevel.maxMoves
    : (node.levelConfig?.maxMoves ?? 0);

  const cube3Threshold = useContractData
    ? gameLevel.cube3Threshold
    : (node.levelConfig?.cube3Threshold ?? 0);

  const cube2Threshold = useContractData
    ? gameLevel.cube2Threshold
    : (node.levelConfig?.cube2Threshold ?? 0);

  const constraints: string[] = [];
  if (useContractData) {
    [
      {
        type: gameLevel.constraintType,
        value: gameLevel.constraintValue,
        count: gameLevel.constraintCount,
      },
      {
        type: gameLevel.constraint2Type,
        value: gameLevel.constraint2Value,
        count: gameLevel.constraint2Count,
      },
      {
        type: gameLevel.constraint3Type,
        value: gameLevel.constraint3Value,
        count: gameLevel.constraint3Count,
      },
    ].forEach(({ type, value, count }) => {
      if (type !== ConstraintType.None) {
        constraints.push(
          Constraint.fromContractValues(type, value, count).getDescription(),
        );
      }
    });
  } else if (node.levelConfig) {
    [node.levelConfig.constraint, node.levelConfig.constraint2]
      .filter((c) => c.constraintType !== ConstraintType.None)
      .forEach((c) => constraints.push(c.getDescription()));
  }

  const canPlay =
    node.type !== "draft" &&
    (node.state === "current" || node.state === "available" || node.state === "playing");

  const difficultyLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-white/20 bg-slate-950/90 p-5 shadow-2xl backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <X size={18} />
        </button>

        <h3 className="pr-8 font-display text-2xl text-white">
          {node.type === "draft"
            ? `Zone ${node.zone} Draft`
            : node.type === "boss"
              ? `Boss Level ${node.contractLevel}`
              : `Level ${node.contractLevel}`}
        </h3>

        {node.type === "draft" ? (
          <p className="mt-4 text-sm text-slate-200/90">
            Draft event: choose your run direction before pushing to the boss.
          </p>
        ) : node.state === "cleared" || node.state === "visited" ? (
          <div className="mt-4 space-y-3 text-sm font-sans">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Difficulty</span>
              <span
                className={`text-lg ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}
              >
                {difficultyLabel}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/15 px-3 py-2.5">
              <span className="text-emerald-200">✓ Cleared</span>
              <span className="text-lg">
                {Array.from({ length: stars }).map((_, i) => <CubeIcon key={i} size="sm" />)}
                {stars === 0 && (
                  <span className="text-slate-500 text-sm">—</span>
                )}
              </span>
            </div>

            {constraints.length > 0 && (
              <div>
                <p className="mb-1 text-slate-400">Constraints</p>
                <div className="space-y-1">
                  {constraints.map((c) => (
                    <p
                      key={c}
                      className="rounded-md bg-slate-800/80 px-2 py-1 text-slate-100"
                    >
                      {c}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm font-sans">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Difficulty</span>
              <span
                className={`text-lg ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}
              >
                {difficultyLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Score</span>
              <span className="text-lg text-white">
                {String(pointsRequired)}
              </span>
            </div>

            <div>
              <p className="mb-1 text-slate-400">Constraints</p>
              {constraints.length > 0 ? (
                <div className="space-y-1">
                  {constraints.map((constraint) => (
                    <p
                      key={constraint}
                      className="rounded-md bg-slate-800/80 px-2 py-1 text-slate-100"
                    >
                      {constraint}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-slate-800/60 px-2 py-1 text-slate-300">
                  No constraint
                </p>
              )}
            </div>

            {maxMoves > 0 && (
              <div className="space-y-2 pt-1">
                <p className="mb-1 text-slate-400">Star Goals</p>
                {[
                  { stars: 3, threshold: cube3Threshold },
                  { stars: 2, threshold: cube2Threshold },
                  { stars: 1, threshold: maxMoves },
                ].map(({ stars, threshold }) => (
                  <div
                    key={stars}
                    className="flex items-center justify-between rounded-md bg-slate-800/60 px-2.5 py-1.5 text-slate-200"
                  >
                    <span className="inline-flex items-center gap-0.5 text-yellow-300">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={i < stars ? "opacity-100" : "opacity-25"}>
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="font-semibold">Finish in {threshold} moves</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {canPlay && (
          <div className="mt-5">
            <ArcadeButton onClick={onPlay}>Play</ArcadeButton>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LevelPreview;
