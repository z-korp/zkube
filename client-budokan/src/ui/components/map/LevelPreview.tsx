import { motion } from "motion/react";
import { X } from "lucide-react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import type { MapNodeData } from "@/hooks/useMapData";
import type { Game } from "@/dojo/game/models/game";
import type { GameLevelData } from "@/hooks/useGameLevel";
import GameButton from "@/ui/components/shared/GameButton";
import CubeIcon from "@/ui/components/CubeIcon";

export interface LevelPreviewProps {
  node: MapNodeData;
  game: Game | null;
  gameLevel: GameLevelData | null;
  gameId: bigint | null;
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
  game,
  gameLevel,
  gameId,
  onPlay,
  onClose,
}) => {
  const stars =
    game && node.contractLevel ? game.getLevelStars(node.contractLevel) : 0;

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
    gameId !== null &&
    (node.state === "current" || node.state === "available");

  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-sky-300/25 bg-slate-900/95 p-5 shadow-2xl"
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

        <h3 className="pr-8 font-['Fredericka_the_Great'] text-xl text-white">
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
          <div className="mt-4 space-y-3 text-sm font-['Fredericka_the_Great']">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Difficulty</span>
              <span
                className={`text-lg ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}
              >
                {difficulty}
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
          <div className="mt-4 space-y-3 text-sm font-['Fredericka_the_Great']">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Difficulty</span>
              <span
                className={`text-lg ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}
              >
                {difficulty}
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
              <div className="space-y-1 pt-1">
                <p className="mb-1 text-slate-400">Moves</p>
                {[
                  { cubes: 5, threshold: cube3Threshold },
                  { cubes: 3, threshold: cube2Threshold },
                  { cubes: 1, threshold: maxMoves },
                ].map(({ cubes, threshold }) => (
                  <div
                    key={cubes}
                    className="flex items-center justify-between rounded-md bg-slate-800/60 px-2 py-1 text-slate-300"
                  >
                    <span className="inline-flex">{Array.from({ length: cubes }).map((_, i) => <CubeIcon key={i} size="sm" />)}</span>
                    <span className="text-lg">≤ {threshold}</span>
                  </div>
                ))}
              </div>
            )}
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
