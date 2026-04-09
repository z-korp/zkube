import { motion } from "motion/react";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { getLevelRanges, type GameSettings } from "@/dojo/game/types/level";
import type { MapNodeData } from "@/hooks/useMapData";
import type { Game } from "@/dojo/game/models/game";
import type { GameLevelData } from "@/hooks/useGameLevel";
import type { ThemeColors } from "@/config/themes";
import { getZoneGuardian, getGuardianPortrait, getGuardianStarText } from "@/config/bossCharacters";
import ArcadeButton from "@/ui/components/shared/ArcadeButton";

export interface LevelPreviewProps {
  node: MapNodeData;
  game: Game | null;
  gameLevel: GameLevelData | null;
  gameId: bigint | null;
  zoneId: number;
  colors: ThemeColors;
  settings?: GameSettings;
  hasSeed: boolean;
  levelStars?: number[];
  onPlay: () => void;
  onClose: () => void;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  VeryEasy: "text-emerald-300", Easy: "text-emerald-400", Medium: "text-yellow-300",
  MediumHard: "text-orange-300", Hard: "text-orange-400", VeryHard: "text-red-400",
  Expert: "text-rose-400", Master: "text-red-500",
};
const DIFFICULTY_LABELS: Record<string, string> = {
  VeryEasy: "Very Easy", Easy: "Easy", Medium: "Medium", MediumHard: "Medium Hard",
  Hard: "Hard", VeryHard: "Very Hard", Expert: "Expert", Master: "Master",
};

export const LevelPreview: React.FC<LevelPreviewProps> = ({
  node, game, gameLevel, zoneId, colors, settings, hasSeed, levelStars, onPlay, onClose,
}) => {
  const guardian = getZoneGuardian(zoneId);
  const isBossLevel = node.type === "boss";
  const levelNum = node.contractLevel ?? 10;

  const stars = node.contractLevel
    ? levelStars?.[node.contractLevel - 1] ?? game?.getLevelStars(node.contractLevel) ?? 0
    : 0;

  const isCleared = node.state === "cleared" || node.state === "visited";

  // Contract data = authoritative for current playing level
  const useContractData = gameLevel && node.contractLevel === gameLevel.level;

  // Ranges from settings (always available)
  const ranges = getLevelRanges(levelNum, settings);

  // Exact values when we have contract data or seeded prediction
  // For cleared levels, replay gets a fresh seed — always show ranges
  const isReplayCandidate = isCleared && stars < 3;
  const showExact = !isReplayCandidate && (useContractData || (hasSeed && node.levelConfig != null));
  const exactMoves = useContractData ? gameLevel!.maxMoves : (node.levelConfig?.maxMoves ?? 0);
  const exactPoints = useContractData ? gameLevel!.pointsRequired : (node.levelConfig?.pointsRequired ?? 0);
  const exactCube3 = useContractData ? gameLevel!.cube3Threshold : (node.levelConfig?.cube3Threshold ?? 0);
  const exactCube2 = useContractData ? gameLevel!.cube2Threshold : (node.levelConfig?.cube2Threshold ?? 0);

  // Constraints — only from contract or seeded prediction
  const constraints: string[] = [];
  if (useContractData) {
    [
      { type: gameLevel!.constraintType, value: gameLevel!.constraintValue, count: gameLevel!.constraintCount },
      { type: gameLevel!.constraint2Type, value: gameLevel!.constraint2Value, count: gameLevel!.constraint2Count },
      { type: gameLevel!.constraint3Type, value: gameLevel!.constraint3Value, count: gameLevel!.constraint3Count },
    ].forEach(({ type, value, count }) => {
      if (type !== ConstraintType.None) constraints.push(Constraint.fromContractValues(type, value, count).getDescription());
    });
  } else if (hasSeed && node.levelConfig) {
    [node.levelConfig.constraint, node.levelConfig.constraint2]
      .filter((c) => c.constraintType !== ConstraintType.None)
      .forEach((c) => constraints.push(c.getDescription()));
  }

  const canPlay = node.type !== "draft" &&
    (node.state === "current" || node.state === "available" || node.state === "playing" || node.state === "cleared" || node.state === "visited");

  const guardianLine = isBossLevel
    ? isCleared ? guardian.respectLine : guardian.trialIntro
    : isCleared ? getGuardianStarText(guardian, stars) : guardian.encouragement;

  // Display helpers
  const fmtRange = (min: number, max: number) => min === max ? `${min}` : `${min}–${max}`;
  const movesText = showExact ? `${exactMoves}` : `~${fmtRange(ranges.movesMin, ranges.movesMax)}`;
  const pointsText = showExact ? `${exactPoints}` : `~${fmtRange(ranges.pointsMin, ranges.pointsMax)}`;

  const starRows = [
    { s: 3, min: showExact ? exactCube3 : ranges.star3MovesMin, max: showExact ? exactCube3 : ranges.star3MovesMax },
    { s: 2, min: showExact ? exactCube2 : ranges.star2MovesMin, max: showExact ? exactCube2 : ranges.star2MovesMax },
    { s: 1, min: showExact ? exactMoves : ranges.star1MovesMin, max: showExact ? exactMoves : ranges.star1MovesMax },
  ];

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      {/* Full-size guardian portrait */}
      <div className="relative flex flex-1 min-h-0 items-end justify-center overflow-hidden">
        <motion.div
          className="relative h-[70%] max-h-[420px]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
        >
          <img
            src={getGuardianPortrait(zoneId)}
            alt={guardian.name}
            className="h-full w-auto object-contain"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 95%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 15%, black 70%, transparent 95%), linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
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
        transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="mx-2 mb-3 rounded-2xl border-2 px-4 pb-4 pt-3"
          style={{
            background: `linear-gradient(180deg, ${colors.backgroundGradientStart ?? "#0a1628"}F5, ${colors.background ?? "#050a12"}FA)`,
            borderColor: isBossLevel ? "rgba(249,115,22,0.35)" : `${colors.accent}35`,
            boxShadow: isBossLevel ? "0 -4px 32px rgba(249,115,22,0.15)" : `0 -4px 32px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Title + difficulty */}
          <div className="flex items-center justify-between">
            <p className={`font-display text-xl font-black ${isBossLevel ? "text-orange-300" : "text-white"}`}>
              {isBossLevel ? `Trial of ${guardian.name}` : `Level ${node.contractLevel}`}
            </p>
            <span className={`font-sans text-base font-bold ${DIFFICULTY_STYLES[ranges.difficulty] ?? "text-white"}`}>
              {DIFFICULTY_LABELS[ranges.difficulty] ?? ranges.difficulty}
            </span>
          </div>

          {/* Guardian quote */}
          <p className="mt-1 font-sans text-[14px] italic text-white/60">"{guardianLine}"</p>

          {/* Cleared badge */}
          {isCleared && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2">
              <span className="font-sans text-sm font-bold text-emerald-300">Cleared</span>
              <span className="text-lg tracking-wider">
                {Array.from({ length: 3 }).map((_, i) => <span key={i} className={i < stars ? "text-yellow-300" : "text-white/20"}>★</span>)}
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2.5 text-center">
                <p className="font-sans text-lg font-bold text-white">{pointsText}</p>
                <p className="font-sans text-[10px] text-white/40">Target</p>
              </div>
              <div className="flex-1 rounded-xl bg-white/[0.05] px-3 py-2.5 text-center">
                <p className="font-sans text-lg font-bold text-white">{movesText}</p>
                <p className="font-sans text-[10px] text-white/40">Moves</p>
              </div>
            </div>

            {/* Star thresholds */}
            <div className="flex gap-1.5">
              {starRows.map(({ s, min, max }) => (
                <div key={s} className="flex-1 rounded-xl bg-white/[0.04] px-2 py-2 text-center">
                  <p className="text-sm">
                    {Array.from({ length: 3 }).map((_, i) => <span key={i} className={i < s ? "text-yellow-300" : "text-white/15"}>★</span>)}
                  </p>
                  <p className="font-sans text-[11px] font-semibold text-white/50">≤{fmtRange(min, max)} moves</p>
                </div>
              ))}
            </div>

            {/* Constraints */}
            {showExact && constraints.length > 0 ? (
              <div className="space-y-1">
                {constraints.map((c) => (
                  <p key={c} className="rounded-lg bg-white/[0.04] px-3 py-1.5 font-sans text-[12px] text-white/60">{c}</p>
                ))}
              </div>
            ) : !showExact && (ranges.constraintCountMin > 0 || isBossLevel) ? (
              <div className="space-y-1">
                {isBossLevel && ranges.bossConstraintTypes.length > 0 ? (
                  <>
                    {ranges.bossConstraintTypes.map((t) => (
                      <p key={t} className="rounded-lg bg-orange-500/8 px-3 py-1.5 font-sans text-[12px] text-orange-200/60">{t}</p>
                    ))}
                  </>
                ) : (
                  <p className="rounded-lg bg-white/[0.04] px-3 py-1.5 font-sans text-[12px] text-white/40">
                    {ranges.constraintCountMin === ranges.constraintCountMax
                      ? `${ranges.constraintCountMin} constraint${ranges.constraintCountMin !== 1 ? "s" : ""}`
                      : `${ranges.constraintCountMin}–${ranges.constraintCountMax} constraints`}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Action */}
          {canPlay && (
            <div className="mt-3">
              <ArcadeButton onClick={onPlay}>
                {isBossLevel ? `Face ${guardian.name}` : isCleared ? "Replay" : "Play"}
              </ArcadeButton>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LevelPreview;
