import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, X, Play } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import {
  TOTAL_LEVELS,
  useMapData,
  type MapNodeData,
  type NodeState,
} from "@/hooks/useMapData";
import { useMapLayout } from "@/hooks/useMapLayout";
import {
  getThemeImages,
  getThemeColors,
  THEME_META,
  type ThemeColors,
  type ThemeId,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";


const VB_W = 60;
const VB_H = 100;

const getPathType = (
  fromState: NodeState,
  toState: NodeState,
): "cleared" | "active" | "locked" => {
  if (fromState === "cleared" && (toState === "cleared" || toState === "visited"))
    return "cleared";
  if (fromState === "cleared" && (toState === "current" || toState === "available"))
    return "active";
  return "locked";
};

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((s) => s.navigate);
  const goBack = useNavigationStore((s) => s.goBack);
  const gameId = useNavigationStore((s) => s.gameId);
  const previousPage = useNavigationStore((s) => s.previousPage);
  const pendingPreviewLevel = useNavigationStore((s) => s.pendingPreviewLevel);
  const setPendingPreviewLevel = useNavigationStore((s) => s.setPendingPreviewLevel);
  const pendingLevelCompletion = useNavigationStore((s) => s.pendingLevelCompletion);
  const setPendingLevelCompletion = useNavigationStore((s) => s.setPendingLevelCompletion);
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();

  const { game, seed } = useGame({ gameId: gameId ?? undefined, shouldLog: false });
  const gameLevel = useGameLevel({ gameId: game?.id });

  const currentLevel = game?.level ?? 1;
  const mapData = useMapData({ seed, currentLevel });
  const layout = useMapLayout({ seed, nodesPerZone: TOTAL_LEVELS });

  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const zoneThemes: Record<number, ThemeId> = { 1: "theme-1", 2: "theme-5", 3: "theme-7" };
  const themeId: ThemeId = game ? (zoneThemes[game.zoneId] ?? "theme-1") : "theme-1";
  const colors = getThemeColors(themeId);
  const zoneName = THEME_META[themeId].name;
  const themeImages = getThemeImages(themeId);
  const earnedStars = game
    ? (() => {
        let total = 0;
        for (let level = 1; level <= TOTAL_LEVELS; level++) {
          total += game.getLevelStars(level);
        }
        return total;
      })()
    : 0;

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  useEffect(() => {
    setThemeTemplate(themeId);
  }, [setThemeTemplate, themeId]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) => n.contractLevel === pendingPreviewLevel && n.state !== "locked",
    );
    if (node) setSelectedNode(node);
    setPendingPreviewLevel(null);
  }, [pendingPreviewLevel, mapData.nodes, setPendingPreviewLevel]);

  useEffect(() => {
    if (!scrollRef.current || !layout.points.length) return;
    const currentIdx = mapData.nodes.findIndex((n) => n.state === "current");
    if (currentIdx < 0) return;
    const pt = layout.points[currentIdx];
    if (!pt) return;
    const container = scrollRef.current;
    const scrollTarget = container.scrollHeight * (1 - pt.y) - container.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
  }, [layout.points, mapData.nodes]);

  const handlePlay = () => {
    if (gameId === null) return;
    setSelectedNode(null);
    navigate("play", gameId);
  };

  const handleBack = () => {
    if (previousPage === "play" && gameId !== null) {
      navigate("play", gameId);
      return;
    }
    goBack();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 h-11 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: colors.textMuted }}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-display text-base font-extrabold" style={{ color: colors.text }}>
            <span className="inline-flex items-center gap-2">
              <img
                src={themeImages.themeIcon}
                alt={zoneName}
                className="h-7 w-7 rounded-md"
                draggable={false}
              />
              {zoneName}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ color: colors.accent2 }}>★</span>
          <span className="text-[11px]" style={{ color: colors.accent2 }}>
            {earnedStars}/30
          </span>
        </div>
      </div>

      {!game && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8">
          <p className="text-slate-400 text-center">Start a run from Home to see your map</p>
          <button
            onClick={() => navigate("home")}
            className="px-6 py-2 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 transition-colors"
          >
            Go to Home
          </button>
        </div>
      )}

      {game && (
        <>
          <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${themeImages.mapBg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

        <div className="relative mx-auto w-full max-w-[400px]" style={{ height: "110vh" }}>
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <filter id="node-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {layout.edges.map((edge) => {
              const fromPt = layout.points[edge.from];
              const toPt = layout.points[edge.to];
              if (!fromPt || !toPt) return null;

              const fromX = fromPt.x * VB_W;
              const fromY = fromPt.y * VB_H;
              const toX = toPt.x * VB_W;
              const toY = toPt.y * VB_H;
              const midY = (fromY + toY) / 2;
              const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

              const fromNode = mapData.nodes[edge.from];
              const toNode = mapData.nodes[edge.to];
              if (!fromNode || !toNode) return null;

              const pathType = getPathType(fromNode.state, toNode.state);
               const stroke =
                 pathType === "locked" ? `${colors.border}66` : colors.border;
               const sw = pathType === "locked" ? 1.2 : 2;
               const opacity = pathType === "locked" ? 0.35 : 0.8;
               const dash = pathType === "locked" ? "4 4" : undefined;

              return (
                <g key={`edge-${edge.from}-${edge.to}`}>
                  {pathType !== "locked" && (
                    <path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={sw + 2}
                      strokeLinecap="round"
                      opacity={0.15}
                    />
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeLinecap="round"
                    opacity={opacity}
                    strokeDasharray={dash}
                  />
                </g>
              );
            })}

          </svg>

          <div className="pointer-events-none absolute inset-0">
            {mapData.nodes.map((node) => {
              const pt = layout.points[node.nodeInZone];
              if (!pt) return null;

              const isBoss = node.type === "boss";
              const isInteractive = node.state !== "locked";
              const isCleared = node.state === "cleared" || node.state === "visited";
              const isCurrent = node.state === "current";

              const image = isBoss
                ? themeImages.mapNodeBoss
                : isCleared
                  ? themeImages.mapNodeCompleted
                  : themeImages.mapNodeLevel;

              const sizeClass = isBoss ? "h-14 w-14" : "h-12 w-12";

              return (
                <button
                  key={`node-${node.nodeInZone}`}
                  type="button"
                  onClick={() => {
                    if (isInteractive) setSelectedNode(node);
                  }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pt.x * 100}%`,
                    top: `${pt.y * 100}%`,
                    cursor: isInteractive ? "pointer" : "default",
                  }}
                  disabled={!isInteractive}
                >
                  <div className="relative">
                    <img
                      src={image}
                      alt={isBoss ? `Boss level ${node.contractLevel}` : `Level ${node.contractLevel}`}
                      className={`${sizeClass} ${node.state === "locked" ? "opacity-30 grayscale" : ""}`}
                      style={
                        isCurrent
                          ? {
                              filter: `drop-shadow(0 0 10px ${colors.accent}) drop-shadow(0 0 22px ${colors.accent2}80)`,
                            }
                          : undefined
                      }
                      draggable={false}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center font-display text-sm font-black"
                      style={{ color: isCurrent ? "#0a1628" : colors.text }}
                    >
                      {node.contractLevel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          </div>
          </div>

          <AnimatePresence>
            {selectedNode && !pendingLevelCompletion && (
              <BottomSheetPreview
                node={selectedNode}
                game={game ?? null}
                gameLevel={gameLevel}
                gameId={gameId}
                colors={colors}
                onPlay={handlePlay}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </AnimatePresence>

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
              prevTotalScore={pendingLevelCompletion.prevTotalScore}
              totalScore={pendingLevelCompletion.totalScore}
              gameLevel={pendingLevelCompletion.gameLevel}
            />
          )}
        </>
      )}
    </div>
  );
};

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

interface BottomSheetPreviewProps {
  node: MapNodeData;
  game: import("@/dojo/game/models/game").Game | null;
  gameLevel: import("@/hooks/useGameLevel").GameLevelData | null;
  gameId: bigint | null;
  colors: ThemeColors;
  onPlay: () => void;
  onClose: () => void;
}

const BottomSheetPreview: React.FC<BottomSheetPreviewProps> = ({
  node,
  game,
  gameLevel,
  gameId,
  colors,
  onPlay,
  onClose,
}) => {
  const stars = game && node.contractLevel ? game.getLevelStars(node.contractLevel) : 0;
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
    gameId !== null && (node.state === "current" || node.state === "available");
  const isCleared = node.state === "cleared" || node.state === "visited";

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t px-5 pb-6 pt-3 shadow-2xl backdrop-blur-xl"
        style={{ backgroundColor: `${colors.surface}F2`, borderColor: colors.border }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl" style={{ color: colors.text }}>
              {node.type === "boss" ? `Boss Level ${node.contractLevel}` : `Level ${node.contractLevel}`}
            </h3>
            <span className={`text-sm ${DIFFICULTY_STYLES[difficulty] ?? ""}`} style={{ color: colors.textMuted }}>
              {difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: colors.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {isCleared && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ backgroundColor: `${colors.accent}1F`, borderColor: `${colors.accent}4D` }}>
            <span className="text-sm font-medium" style={{ color: colors.accent }}>Cleared</span>
            <span className="ml-auto text-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ color: i < stars ? colors.accent2 : colors.textMuted }}>★</span>
              ))}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: `${colors.surface}99` }}>
            <p className="text-[10px]" style={{ color: colors.textMuted }}>Target</p>
            <p className="font-display text-lg" style={{ color: colors.text }}>{pointsRequired}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: `${colors.surface}99` }}>
            <p className="text-[10px]" style={{ color: colors.textMuted }}>Moves</p>
            <p className="font-display text-lg" style={{ color: colors.text }}>{maxMoves}</p>
          </div>
        </div>

        {constraints.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px]" style={{ color: colors.textMuted }}>Constraints</p>
            <div className="space-y-1">
              {constraints.map((c) => (
                <p key={c} className="rounded-md px-2.5 py-1.5 text-sm" style={{ backgroundColor: `${colors.surface}99`, color: colors.text }}>
                  {c}
                </p>
              ))}
            </div>
          </div>
        )}

        {canPlay && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPlay}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-display text-lg tracking-wide transition-colors"
            style={{ backgroundColor: colors.accent, color: "#0a1628" }}
          >
            <Play size={18} fill="currentColor" />
            PLAY
          </motion.button>
        )}
      </motion.div>
    </>
  );
};

export default MapPage;
