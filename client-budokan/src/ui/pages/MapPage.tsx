import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import {
  NODES_PER_ZONE,
  TOTAL_ZONES,
  useMapData,
  type MapNodeData,
  type NodeState,
} from "@/hooks/useMapData";
import { useMapLayout } from "@/hooks/useMapLayout";
import {
  getThemeColors,
  getMapPathTheme,
  getThemeImages,
  isValidThemeId,
  type ThemeId,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";
import { getLevelStars } from "@/dojo/game/helpers/levelStarsPacking";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VB_W = 60;
const VB_H = 100;

const STATE_COLORS: Record<
  NodeState,
  { fill: string; border: string; alpha: number; text: string }
> = {
  locked: { fill: "#334155", border: "#475569", alpha: 0.5, text: "#94a3b8" },
  cleared: { fill: "#14532d", border: "#22c55e", alpha: 1, text: "#bbf7d0" },
  current: { fill: "#0f2743", border: "#3b82f6", alpha: 1, text: "#bfdbfe" },
  available: { fill: "#1e293b", border: "#f97316", alpha: 1, text: "#fed7aa" },
  visited: { fill: "#1e3a2f", border: "#4ade80", alpha: 0.85, text: "#bbf7d0" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const canOpenPreview = (node: MapNodeData): boolean => node.state !== "locked";

const getPathType = (
  fromState: NodeState,
  toState: NodeState,
): "cleared" | "active" | "locked" => {
  if (
    fromState === "cleared" &&
    (toState === "cleared" || toState === "visited")
  ) {
    return "cleared";
  }
  if (
    fromState === "cleared" &&
    (toState === "current" || toState === "available")
  ) {
    return "active";
  }
  return "locked";
};

const getLabel = (node: MapNodeData): string => {
  if (node.type === "boss") {
    return node.state === "cleared" ? "\u2713" : "\u2605";
  }
  if (node.state === "cleared") {
    return "\u2713";
  }
  return String(node.contractLevel ?? "");
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);
  const pendingPreviewLevel = useNavigationStore(
    (state) => state.pendingPreviewLevel,
  );
  const setPendingPreviewLevel = useNavigationStore(
    (state) => state.setPendingPreviewLevel,
  );
  const pendingLevelCompletion = useNavigationStore(
    (state) => state.pendingLevelCompletion,
  );
  const setPendingLevelCompletion = useNavigationStore(
    (state) => state.setPendingLevelCompletion,
  );
  const { setThemeTemplate, themeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const gameLevel = useGameLevel({ gameId: game?.id });

  // GameSeed.seed is now stable (never overwritten). level_seed holds per-level VRF.

  const currentLevel = game?.level ?? 1;
  const mapData = useMapData({ seed, currentLevel });
  const zoneLayouts = useMapLayout({
    seed,
    totalZones: TOTAL_ZONES,
    nodesPerZone: NODES_PER_ZONE,
  });

  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  useEffect(() => {
    setThemeTemplate("theme-1");
  }, [setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) => n.contractLevel === pendingPreviewLevel && canOpenPreview(n),
    );
    if (node) setSelectedNode(node);
    setPendingPreviewLevel(null);
  }, [pendingPreviewLevel, mapData.nodes, setPendingPreviewLevel]);

  const zoneNodes = useMemo(() => {
    const start = 0;
    return mapData.nodes.slice(start, start + NODES_PER_ZONE);
  }, [mapData.nodes]);

  const handlePlay = () => {
    if (gameId === null) return;
    navigate("play", gameId);
  };

  const currentTheme: ThemeId = isValidThemeId(themeTemplate)
    ? themeTemplate
    : "theme-1";
  const colors = getThemeColors(currentTheme);
  const activeThemeId: ThemeId = "theme-1";
  const layout = zoneLayouts[0];
  const pathTheme = getMapPathTheme(activeThemeId);
  const themeImages = getThemeImages(activeThemeId);

  return (
    <div className="h-screen-viewport flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-4 pt-3 pb-2"
      >
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ color: colors.accent }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1
            className="font-display text-base font-bold"
            style={{ color: colors.text }}
          >
            World Map
          </h1>
          <p className="font-sans text-[10px]" style={{ color: colors.textMuted }}>
            Polynesian · Level {currentLevel}
          </p>
        </div>
      </motion.div>

      <div className="relative flex-1 min-h-0 overflow-hidden">
        <ZoneBackground zone={1} themeId={"theme-1" as ThemeId} />
        <div className="relative mx-auto h-full w-full max-w-[430px]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            {layout?.edges.map((edge) => {
                      const fromPt = layout.points[edge.from];
                      const toPt = layout.points[edge.to];
                      if (!fromPt || !toPt) return null;

                      const fromX = fromPt.x * VB_W;
                      const fromY = fromPt.y * VB_H;
                      const toX = toPt.x * VB_W;
                      const toY = toPt.y * VB_H;
                      const midY = (fromY + toY) / 2;
                      const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

                      const fromNode = zoneNodes[edge.from];
                      const toNode = zoneNodes[edge.to];
                      if (!fromNode || !toNode) return null;

                      const pathType = getPathType(
                        fromNode.state,
                        toNode.state,
                      );

                      const stroke =
                        pathType === "cleared"
                          ? pathTheme.clearedColor
                          : pathType === "active"
                            ? pathTheme.activeColor
                            : pathTheme.lockedColor;
                      const sw =
                        pathType === "locked"
                          ? pathTheme.lockedStrokeWidth
                          : pathTheme.strokeWidth;
                      const opacity = pathType === "locked" ? 0.5 : 0.85;
                      const dash =
                        pathType === "locked"
                          ? pathTheme.lockedDash
                          : pathTheme.pathStyle === "dashed"
                            ? "8 4"
                            : pathTheme.pathStyle === "dotted"
                              ? "2 3"
                              : undefined;

                      return (
                        <g key={`main-${edge.from}-${edge.to}`}>
                          {pathTheme.pathStyle === "double" && (
                            <motion.path
                              d={d}
                              fill="none"
                              stroke={stroke}
                              strokeWidth={sw + 1.6}
                              strokeLinecap="round"
                              initial={!dash ? { pathLength: 0 } : undefined}
                              animate={!dash ? { pathLength: 1 } : undefined}
                              transition={{
                                delay: 0.3 + edge.from * 0.05,
                                duration: 0.5,
                                ease: "easeInOut"
                              }}
                              opacity={opacity * 0.35}
                            />
                          )}
                          <motion.path
                            d={d}
                            fill="none"
                            stroke={stroke}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            initial={!dash ? { pathLength: 0 } : undefined}
                            animate={!dash ? { pathLength: 1 } : undefined}
                            transition={{
                              delay: 0.3 + edge.from * 0.05,
                              duration: 0.5,
                              ease: "easeInOut"
                            }}
                            opacity={opacity}
                            strokeDasharray={dash}
                          />
                        </g>
                      );
                    })}

                    {zoneNodes.map((node) => {
                      const pt = layout?.points[node.nodeInZone];
                      if (!pt) return null;

                      const cx = pt.x * VB_W;
                      const cy = pt.y * VB_H;
                      const colors = STATE_COLORS[node.state];
                      const isInteractive = node.state !== "locked";
                      const label = getLabel(node);

                      const isCleared =
                        node.state === "cleared" || node.state === "visited";
                      const nodeImg =
                        node.type === "boss"
                          ? themeImages.mapNodeBoss
                          : isCleared
                            ? themeImages.mapNodeCompleted
                            : themeImages.mapNodeLevel;
                      const r = node.type === "boss" ? 7.5 : 5;

                      const nodeContent = (
                        <>
                          <clipPath id={`node-clip-${node.nodeInZone}`}>
                            <circle cx={cx} cy={cy} r={r} />
                          </clipPath>
                          <image
                            href={nodeImg}
                            x={cx - r}
                            y={cy - r}
                            width={r * 2}
                            height={r * 2}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath={`url(#node-clip-${node.nodeInZone})`}
                          />
                          {node.type === "boss" ? (
                            <motion.circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill="none"
                              stroke={colors.border}
                              strokeWidth={0.6}
                              animate={{
                                strokeWidth: [0.6, 1.0, 0.6],
                                opacity: [0.8, 1, 0.8],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          ) : (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={r}
                              fill="none"
                              stroke={colors.border}
                              strokeWidth={0.4}
                            />
                          )}

                          <>
                            <circle
                              cx={cx + r * 0.7}
                              cy={cy + r * 0.7}
                              r={2}
                              fill="rgba(0,0,0,0.75)"
                              stroke={colors.border}
                              strokeWidth={0.3}
                            />
                            <text
                              x={cx + r * 0.7}
                              y={cy + r * 0.7 + 0.1}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#ffffff"
                              fontSize={2.2}
                              fontWeight="bold"
                              fontFamily="Bangers"
                            >
                              {label}
                            </text>
                          </>
                          {node.type === "classic" &&
                            node.state !== "locked" &&
                            node.contractLevel !== null && (
                              <g>
                                {[0, 1, 2].map((i) => {
                                  const stars = game
                                    ? getLevelStars(
                                        BigInt(game.levelStarsRaw ?? 0n),
                                        node.contractLevel!,
                                      )
                                    : 0;
                                  const filled = stars > i;
                                  const starX = cx - 2.5 + i * 2.5;
                                  const starY = cy + r + 2.5;
                                  return (
                                    <motion.text
                                      key={i}
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1,
                                        fill: filled
                                          ? "#FACC15"
                                          : "rgba(255,255,255,0.3)"
                                      }}
                                      transition={{
                                        delay: node.nodeInZone * 0.06 + 0.3 + i * 0.1,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                      }}
                                      style={{ transformOrigin: `${starX}px ${starY}px` }}
                                      x={starX}
                                      y={starY}
                                      fontSize={2}
                                      textAnchor="middle"
                                    >
                                      ★
                                    </motion.text>
                                  );
                                })}
                              </g>
                            )}
                        </>
                      );

                      return (
                        <motion.g
                          key={`node-${node.nodeInZone}`}
                          onClick={() => {
                            if (!isInteractive) {
                              return;
                            }

                            if (canOpenPreview(node)) {
                              setSelectedNode(node);
                            }
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: colors.alpha }}
                          transition={{
                            delay: node.nodeInZone * 0.06,
                            type: "spring",
                            stiffness: 260,
                            damping: 20
                          }}
                          style={{
                            cursor: isInteractive ? "pointer" : "default",
                            transformOrigin: `${cx}px ${cy}px`,
                          }}
                        >
                          {node.state === "current" ? (
                            <motion.g
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{ transformOrigin: `${cx}px ${cy}px` }}
                            >
                              {nodeContent}
                            </motion.g>
                          ) : (
                            <g>{nodeContent}</g>
                          )}
                        </motion.g>
                      );
                    })}
          </svg>
        </div>

        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
            game={game ?? null}
            gameLevel={gameLevel}
            gameId={gameId}
            onPlay={handlePlay}
            onClose={() => setSelectedNode(null)}
          />
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
            draftWillOpen={false}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
