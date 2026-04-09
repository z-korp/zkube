import { motion } from "motion/react";
import { X } from "lucide-react";
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

  // Guardian contextual line
  const guardianLine = isBossLevel
    ? guardian.trialIntro
    : isCleared
      ? stars >= 3 ? "Masterful." : guardian.encouragement
      : guardian.encouragement;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm px-3 pb-4 md:justify-center md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Guardian portrait — floats above the card */}
      <motion.img
        src={getGuardianPortrait(zoneId)}
        alt={guardian.name}
        className="mb-2 h-20 w-20 rounded-2xl object-cover"
        style={{
          border: isBossLevel ? "2px solid rgba(249,115,22,0.5)" : "2px solid rgba(255,255,255,0.15)",
          boxShadow: isBossLevel ? "0 0 24px rgba(249,115,22,0.25)" : "0 0 16px rgba(0,0,0,0.5)",
          maskImage: "radial-gradient(circle, black 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle, black 60%, transparent 100%)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 25 }}
        draggable={false}
      />

      {/* Card */}
      <motion.div
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl ${isBossLevel ? "border-orange-500/25" : "border-white/15"}`}
        style={{ background: isBossLevel ? "linear-gradient(180deg, rgba(127,29,29,0.95), rgba(15,10,20,0.98))" : "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(10,15,30,0.98))" }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/50 hover:text-white/80"
        >
          <X size={14} />
        </button>

        <div className="px-4 pt-3 pb-4">
          {/* Title + guardian quote */}
          <div className="mb-3 text-center">
            <p className={`font-display text-xl font-black ${isBossLevel ? "text-orange-300" : "text-white"}`}>
              {isBossLevel ? `Trial of ${guardian.name}` : `Level ${node.contractLevel}`}
            </p>
            <p className="mt-1 font-sans text-[12px] italic text-white/50">"{guardianLine}"</p>
          </div>

          {/* Boss banner */}
          {isBossLevel && canPlay && !isCleared && (
            <motion.div
              className="mb-3 rounded-xl border border-orange-500/25 bg-orange-500/10 px-3 py-2 text-center"
              animate={{ boxShadow: ["0 0 0 rgba(249,115,22,0)", "0 0 16px rgba(249,115,22,0.12)", "0 0 0 rgba(249,115,22,0)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <p className="font-sans text-[11px] font-bold text-orange-200/70">Keep the grid under control to survive</p>
            </motion.div>
          )}

          {/* Cleared state */}
          {isCleared ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.05] px-3 py-2">
                <span className="font-sans text-[12px] text-white/50">Difficulty</span>
                <span className={`font-sans text-sm font-bold ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}>{difficultyLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
                <span className="font-sans text-[12px] text-emerald-300">Cleared</span>
                <span className="text-base">
                  {stars > 0 ? "★".repeat(stars) + "☆".repeat(3 - stars) : "—"}
                </span>
              </div>
              {constraints.length > 0 && (
                <div className="space-y-1">
                  {constraints.map((c) => (
                    <p key={c} className="rounded-xl bg-white/[0.04] px-3 py-1.5 font-sans text-[11px] text-white/70">{c}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/[0.05] px-3 py-2 text-center">
                  <p className={`font-sans text-sm font-bold ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}>{difficultyLabel}</p>
                  <p className="font-sans text-[10px] text-white/40">Difficulty</p>
                </div>
                <div className="rounded-xl bg-white/[0.05] px-3 py-2 text-center">
                  <p className="font-sans text-sm font-bold text-white">{pointsRequired}</p>
                  <p className="font-sans text-[10px] text-white/40">Target Score</p>
                </div>
              </div>

              {constraints.length > 0 && (
                <div className="space-y-1">
                  {constraints.map((c) => (
                    <p key={c} className="rounded-xl bg-white/[0.04] px-3 py-1.5 font-sans text-[11px] text-white/70">{c}</p>
                  ))}
                </div>
              )}

              {maxMoves > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { s: 3, t: cube3Threshold },
                    { s: 2, t: cube2Threshold },
                    { s: 1, t: maxMoves },
                  ].map(({ s, t }) => (
                    <div key={s} className="rounded-xl bg-white/[0.04] px-2 py-1.5 text-center">
                      <p className="font-sans text-xs text-yellow-300">{"★".repeat(s)}{"☆".repeat(3 - s)}</p>
                      <p className="font-sans text-[10px] text-white/50">≤{t} moves</p>
                    </div>
                  ))}
                </div>
              )}

              {!useContractData && (
                <p className="text-center font-sans text-[9px] text-white/25">Estimated values — actual may vary</p>
              )}
            </div>
          )}

          {canPlay && (
            <div className="mt-4">
              <ArcadeButton onClick={onPlay}>
                {isBossLevel
                  ? `Face ${guardian.name}`
                  : isCleared ? "Replay" : "Play"}
              </ArcadeButton>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LevelPreview;
