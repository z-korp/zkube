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
  getMapPathTheme,
  getThemeImages,
  THEME_META,
  type ThemeId,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { Constraint, ConstraintType } from "@/dojo/game/types/constraint";
import { Difficulty } from "@/dojo/game/types/difficulty";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";


const VB_W = 60;
const VB_H = 100;

const NODE_R = 8;
const BOSS_R = 11;

const getLabel = (node: MapNodeData): string => {
  if (node.type === "boss") return node.state === "cleared" ? "\u2713" : "\u2605";
  if (node.state === "cleared") return "\u2713";
  return String(node.contractLevel ?? "");
};

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
  const themeImages = getThemeImages(themeId);
  const pathTheme = getMapPathTheme(themeId);
  const zoneName = THEME_META[themeId].name;

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 h-11 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={goBack}
            className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-['Chakra_Petch'] text-white text-sm">
            {zoneName}
          </span>
        </div>
        {game && (
          <span className="font-['Chakra_Petch'] text-amber-200/80 text-sm tabular-nums">
            Score: {game.totalScore}
          </span>
        )}
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
            <ZoneBackground zone={1} themeId={themeId} />

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
                pathType === "cleared"
                  ? pathTheme.clearedColor
                  : pathType === "active"
                    ? pathTheme.activeColor
                    : pathTheme.lockedColor;
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

            {mapData.nodes.map((node) => {
              const pt = layout.points[node.nodeInZone];
              if (!pt) return null;

              const cx = pt.x * VB_W;
              const cy = pt.y * VB_H;
              const isBoss = node.type === "boss";
              const r = isBoss ? BOSS_R : NODE_R;
              const isInteractive = node.state !== "locked";
              const isCleared = node.state === "cleared" || node.state === "visited";
              const isCurrent = node.state === "current";

              const nodeImg = isBoss
                ? themeImages.mapNodeBoss
                : isCleared
                  ? themeImages.mapNodeCompleted
                  : themeImages.mapNodeLevel;

              const stars = game && node.contractLevel
                ? game.getLevelStars(node.contractLevel)
                : 0;

              return (
                <g
                  key={`node-${node.nodeInZone}`}
                  onClick={() => {
                    if (isInteractive) setSelectedNode(node);
                  }}
                  style={{
                    cursor: isInteractive ? "pointer" : "default",
                  }}
                  opacity={node.state === "locked" ? 0.35 : 1}
                  filter={isCurrent ? "url(#node-glow)" : undefined}
                >
                  <clipPath id={`clip-${node.nodeInZone}`}>
                    <circle cx={cx} cy={cy} r={r} />
                  </clipPath>
                  <image
                    href={nodeImg}
                    x={cx - r}
                    y={cy - r}
                    width={r * 2}
                    height={r * 2}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip-${node.nodeInZone})`}
                  />

                  {isCurrent && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r + 1.2}
                      fill="none"
                      stroke={pathTheme.activeColor}
                      strokeWidth={0.6}
                      opacity={0.8}
                      style={{ animation: "map-node-pulse 2s ease-in-out infinite" }}
                    />
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={
                      isCurrent
                        ? pathTheme.activeColor
                        : isCleared
                          ? pathTheme.clearedColor
                          : "rgba(255,255,255,0.15)"
                    }
                    strokeWidth={isCurrent ? 0.7 : 0.4}
                  />

                  <circle
                    cx={cx + r * 0.65}
                    cy={cy + r * 0.65}
                    r={2.2}
                    fill="rgba(0,0,0,0.8)"
                    stroke={isCleared ? pathTheme.clearedColor : "rgba(255,255,255,0.3)"}
                    strokeWidth={0.3}
                  />
                  <text
                    x={cx + r * 0.65}
                    y={cy + r * 0.65 + 0.2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={2.4}
                    fontWeight="bold"
                  >
                    {getLabel(node)}
                  </text>

                  {isCleared && stars > 0 && (
                    <g>
                      {Array.from({ length: 3 }).map((_, i) => {
                        const starX = cx - 2.5 + i * 2.5;
                        const starY = cy - r - 2;
                        const filled = i < stars;
                        return (
                          <text
                            key={i}
                            x={starX}
                            y={starY}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={2}
                            fill={filled ? "#fbbf24" : "rgba(255,255,255,0.15)"}
                          >
                            ★
                          </text>
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          </div>
          </div>

          <AnimatePresence>
            {selectedNode && !pendingLevelCompletion && (
              <BottomSheetPreview
                node={selectedNode}
                game={game ?? null}
                gameLevel={gameLevel}
                gameId={gameId}
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
  onPlay: () => void;
  onClose: () => void;
}

const BottomSheetPreview: React.FC<BottomSheetPreviewProps> = ({
  node,
  game,
  gameLevel,
  gameId,
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
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-slate-900/98 border-t border-white/15 backdrop-blur-xl px-5 pb-6 pt-3 shadow-2xl max-h-[70vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-600" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-['Chakra_Petch'] text-xl text-white">
              {node.type === "boss" ? `Boss Level ${node.contractLevel}` : `Level ${node.contractLevel}`}
            </h3>
            <span className={`text-sm ${DIFFICULTY_STYLES[difficulty] ?? "text-white"}`}>
              {difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {isCleared && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-3">
            <span className="text-emerald-300 text-sm font-medium">Cleared</span>
            <span className="ml-auto text-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < stars ? "text-yellow-400" : "text-slate-600"}>★</span>
              ))}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-lg bg-black/30 p-2.5">
            <p className="text-[10px] text-slate-400">Target</p>
            <p className="font-['Chakra_Petch'] text-lg text-white">{pointsRequired}</p>
          </div>
          <div className="rounded-lg bg-black/30 p-2.5">
            <p className="text-[10px] text-slate-400">Moves</p>
            <p className="font-['Chakra_Petch'] text-lg text-white">{maxMoves}</p>
          </div>
        </div>

        {constraints.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] text-slate-400 mb-1.5">Constraints</p>
            <div className="space-y-1">
              {constraints.map((c) => (
                <p key={c} className="rounded-md bg-black/25 px-2.5 py-1.5 text-sm text-slate-200">
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
            className="w-full py-3.5 rounded-xl font-['Chakra_Petch'] text-lg tracking-wide bg-emerald-500 hover:bg-emerald-400 text-white transition-colors flex items-center justify-center gap-2"
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
