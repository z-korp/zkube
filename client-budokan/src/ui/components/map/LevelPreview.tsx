import { motion } from "motion/react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import type { MapNodeData } from "@/hooks/useMapData";
import type { Game } from "@/dojo/game/models/game";
import type { GameLevelData } from "@/hooks/useGameLevel";
import { getZoneGuardian, getGuardianPortrait } from "@/config/bossCharacters";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

export interface LevelPreviewProps {
  node: MapNodeData;
  game: Game | null;
  gameLevel: GameLevelData | null;
  gameId: bigint | null;
  zoneId: number;
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
  zoneId,
  levelStars,
  onPlay,
  onClose,
}) => {
  const guardian = getZoneGuardian(zoneId);
  const isBossLevel = node.type === "boss";

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
      { type: gameLevel.constraintType, value: gameLevel.constraintValue, count: gameLevel.constraintCount },
      { type: gameLevel.constraint2Type, value: gameLevel.constraint2Value, count: gameLevel.constraint2Count },
      { type: gameLevel.constraint3Type, value: gameLevel.constraint3Value, count: gameLevel.constraint3Count },
    ].forEach(({ type, value, count }) => {
      if (type !== ConstraintType.None) {
        constraints.push(Constraint.fromContractValues(type, value, count).getDescription());
      }
    });
  } else if (node.levelConfig) {
    [node.levelConfig.constraint, node.levelConfig.constraint2]
      .filter((c) => c.constraintType !== ConstraintType.None)
      .forEach((c) => constraints.push(c.getDescription()));
  }

  const canPlay =
    node.type !== "draft" &&
    (node.state === "current" || node.state === "available" || node.state === "playing" || node.state === "cleared" || node.state === "visited");

  const difficultyLabel = DIFFICULTY_LABELS[difficulty] ?? difficulty;
  const isCleared = node.state === "cleared" || node.state === "visited";

  const guardianLine = isBossLevel
    ? guardian.trialIntro
    : isCleared
      ? stars >= 3 ? "Masterful." : guardian.encouragement
      : guardian.encouragement;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Full-size guardian — Ace Attorney style */}
      <div className="relative flex flex-1 min-h-0 items-end justify-center overflow-hidden">
        <motion.div
          className="relative h-[55%] max-h-[320px]"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 20 }}
        >
          <img
            src={getGuardianPortrait(zoneId)}
            alt={guardian.name}
            className="h-full w-auto object-contain"
            style={{
              maskImage: "radial-gradient(ellipse 80% 85% at 50% 45%, black 40%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 85% at 50% 45%, black 40%, transparent 75%)",
            }}
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Dialog panel */}
      <motion.div
        className="shrink-0"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mx-2 mb-3 rounded-2xl border-2 px-4 pb-4 pt-3 ${isBossLevel ? "border-orange-500/30" : "border-white/15"}`}
          style={{
            background: isBossLevel
              ? "linear-gradient(180deg, rgba(127,29,29,0.95), rgba(15,10,20,0.98))"
              : "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(10,15,30,0.98))",
            boxShadow: isBossLevel
              ? "0 -4px 32px rgba(249,115,22,0.15)"
              : "0 -4px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Title + guardian quote */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <p className={`font-display text-lg font-black ${isBossLevel ? "text-orange-300" : "text-white"}`}>
                {isBossLevel ? `Trial of ${guardian.name}` : `Level ${node.contractLevel}`}
              </p>
              <span className={`font-sans text-sm font-bold ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}>
                {difficultyLabel}
              </span>
            </div>
            <p className="mt-0.5 font-sans text-[12px] italic text-white/50">"{guardianLine}"</p>
          </div>

          {/* Stats */}
          {isCleared ? (
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 mb-3">
              <span className="font-sans text-[12px] font-bold text-emerald-300">Cleared</span>
              <span className="text-base tracking-wider">
                {"★".repeat(stars)}{"☆".repeat(3 - stars)}
              </span>
            </div>
          ) : (
            <div className="mb-3 space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2 text-center">
                  <p className="font-sans text-sm font-bold text-white">{pointsRequired}</p>
                  <p className="font-sans text-[9px] text-white/40">Target</p>
                </div>
                {maxMoves > 0 && [
                  { s: 3, t: cube3Threshold },
                  { s: 2, t: cube2Threshold },
                  { s: 1, t: maxMoves },
                ].map(({ s, t }) => (
                  <div key={s} className="flex-1 rounded-xl bg-white/[0.04] px-2 py-2 text-center">
                    <p className="font-sans text-xs text-yellow-300">{"★".repeat(s)}</p>
                    <p className="font-sans text-[9px] text-white/40">≤{t} moves</p>
                  </div>
                ))}
              </div>

              {constraints.length > 0 && (
                <div className="space-y-1">
                  {constraints.map((c) => (
                    <p key={c} className="rounded-lg bg-white/[0.04] px-3 py-1.5 font-sans text-[11px] text-white/60">{c}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Boss banner */}
          {isBossLevel && canPlay && !isCleared && (
            <motion.p
              className="mb-3 text-center font-sans text-[11px] font-bold text-orange-200/60"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Keep the grid under control to survive
            </motion.p>
          )}

          {canPlay && (
            <ArcadeButton onClick={onPlay}>
              {isBossLevel
                ? `Face ${guardian.name}`
                : isCleared ? "Replay" : "Play"}
            </ArcadeButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LevelPreview;
