import { useEffect, useState } from "react";
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
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";



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
  const { setThemeTemplate } = useTheme();
  const { setMusicPlaylist } = useMusicPlayer();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const gameLevel = useGameLevel({ gameId: game?.id });

  // GameSeed.seed is now stable (never overwritten). level_seed holds per-level VRF.

  const currentLevel = game?.level ?? 1;
  const mapData = useMapData({ seed, currentLevel });
  const layout = useMapLayout({
    seed,
    nodesPerZone: TOTAL_LEVELS,
  });

  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  const themeId: ThemeId = "theme-1";

  useEffect(() => {
    setThemeTemplate(themeId);
  }, [setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) => n.contractLevel === pendingPreviewLevel && canOpenPreview(n),
    );
    if (node) {
      setSelectedNode(node);
    }
    setPendingPreviewLevel(null);
  }, [pendingPreviewLevel, mapData.nodes, setPendingPreviewLevel]);

  const handlePlay = () => {
    if (gameId === null) return;
    navigate("play", gameId);
  };

  const zoneName = THEME_META[themeId].name;
  const themeImages = getThemeImages(themeId);
  const pathTheme = getMapPathTheme(themeId);

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="MAP"
        subtitle={zoneName}
        onBack={goBack}
        rightSlot={null}
      />

      {/* ---- Map viewport ---- */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ZoneBackground zone={1} themeId={themeId} />
        <div className="relative mx-auto h-full w-auto max-w-full aspect-[9/16]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
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
                    <path
                      d={d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={sw + 1.6}
                      strokeLinecap="round"
                      opacity={opacity * 0.35}
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
              const colors = STATE_COLORS[node.state];
              const isInteractive = node.state !== "locked";
              const label = getLabel(node);

              const isCleared = node.state === "cleared" || node.state === "visited";
              const nodeImg =
                node.type === "boss"
                  ? themeImages.mapNodeBoss
                  : isCleared
                    ? themeImages.mapNodeCompleted
                    : themeImages.mapNodeLevel;
              const r = node.type === "boss" ? 7.5 : 5;

              return (
                <g
                  key={`node-${node.nodeInZone}`}
                  onClick={() => {
                    if (!isInteractive) {
                      return;
                    }

                    if (canOpenPreview(node)) {
                      setSelectedNode(node);
                    }
                  }}
                  style={{
                    cursor: isInteractive ? "pointer" : "default",
                    transformOrigin: `${cx}px ${cy}px`,
                    ...(node.state === "current"
                      ? {
                          animation: "map-node-pulse 2s ease-in-out infinite",
                        }
                      : {}),
                  }}
                  opacity={colors.alpha}
                >
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
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={node.type === "boss" ? 0.6 : 0.4}
                  />

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
                </g>
              );
            })}
          </svg>
        </div>

        {/* ---- Level preview modal ---- */}
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

        {/* ---- Level complete overlay ---- */}
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
      </div>
    </div>
  );
};

export default MapPage;
