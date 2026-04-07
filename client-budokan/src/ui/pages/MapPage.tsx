import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { motion } from "motion/react";
import { useGame } from "@/hooks/useGame";
import { useGameLevel } from "@/hooks/useGameLevel";
import {
  NODES_PER_ZONE,
  getZoneTheme,
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
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import { ZONE_NAMES } from "@/config/profileData";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";
import ZoneInfoSheet from "@/ui/components/map/ZoneInfoSheet";
import { showToast } from "@/utils/toast";

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
  playing: { fill: "#7c2d12", border: "#fb923c", alpha: 1, text: "#ffedd5" },
};

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
    (toState === "current" || toState === "available" || toState === "playing")
  ) {
    return "active";
  }
  return "locked";
};

const getLabel = (node: MapNodeData): string => {
  if (node.state === "playing") {
    return "▶";
  }
  if (node.type === "boss") {
    return node.state === "cleared" ? "✓" : "★";
  }
  if (node.state === "cleared") {
    return "✓";
  }
  return String(node.contractLevel ?? "");
};

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);
  const mapZoneId = useNavigationStore((state) => state.mapZoneId);
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
  const { account } = useAccountCustom();
  const {
    setup: {
      systemCalls: { replayLevel },
    },
  } = useDojo();
  const activeStoryRun = useActiveStoryAttempt();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });
  const gameLevel = useGameLevel({ gameId: game?.id });
  const { zones } = useZoneProgress(account?.address, 0);

  const zoneState = useMemo(
    () => {
      const z = zones.find((zone) => zone.zoneId === mapZoneId);
      if (!z) return undefined;
      return {
        zoneId: z.zoneId,
        unlocked: z.unlocked,
        highestCleared: z.highestCleared ?? 0,
        levelStars: z.levelStars ?? [],
      };
    },
    [zones, mapZoneId],
  );

  const mapData = useMapData({
    seed,
    zoneId: mapZoneId,
    zoneState,
    activeStoryNode: activeStoryRun
      ? {
          zoneId: activeStoryRun.zoneId,
          level: activeStoryRun.level,
        }
      : null,
  });

  const zoneLayouts = useMapLayout({
    seed,
    totalZones: 1,
    nodesPerZone: NODES_PER_ZONE,
  });

  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  const zoneThemeId = getZoneTheme(mapZoneId);
  useEffect(() => {
    setThemeTemplate(zoneThemeId);
  }, [zoneThemeId, setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) =>
        n.contractLevel === pendingPreviewLevel &&
        canOpenPreview(n),
    );
    if (node) setSelectedNode(node);
    setPendingPreviewLevel(null);
  }, [
    mapData.nodes,
    pendingPreviewLevel,
    setPendingPreviewLevel,
  ]);

  const zoneProgressData = useMemo(
    () => zones.find((z) => z.zoneId === mapZoneId),
    [zones, mapZoneId],
  );

  const handlePlay = async () => {
    if (!account || !selectedNode || selectedNode.contractLevel == null) return;

    if (activeStoryRun && activeStoryRun.gameId !== 0n) {
      const isPlayingNode =
        selectedNode.zone === activeStoryRun.zoneId &&
        selectedNode.contractLevel === activeStoryRun.level;

      if (isPlayingNode) {
        setSelectedNode(null);
        navigate("play", activeStoryRun.gameId);
        return;
      }

      showToast({
        message: `Run in progress on Zone ${activeStoryRun.zoneId}, Level ${activeStoryRun.level}.`,
        type: "error",
      });
      return;
    }

    try {
      const result = await replayLevel({
        account,
        zone_id: selectedNode.zone,
        level: selectedNode.contractLevel,
      });
      if (result.game_id !== 0n) {
        setSelectedNode(null);
        navigate("play", result.game_id);
      }
    } catch (error) {
      console.error("Failed to start story level:", error);
    }
  };

  const themeId: ThemeId = isValidThemeId(zoneThemeId) ? zoneThemeId : "theme-1";
  const colors = getThemeColors(themeId);
  const themeImages = getThemeImages(themeId);
  const pathTheme = getMapPathTheme(themeId);
  const layout = zoneLayouts[0];
  const nodes = mapData.nodes;
  const zoneName = ZONE_NAMES[mapZoneId] ?? `Zone ${mapZoneId}`;
  const zoneStars = zoneProgressData?.stars ?? 0;

  // SVG info node position (top-right area)
  const INFO_CX = VB_W - 8;
  const INFO_CY = 6;
  const INFO_R = 3.5;

  return (
    <div className="relative flex h-full flex-col">
      <ZoneBackground zone={mapZoneId} themeId={themeId} />

      {/* Floating overlay: back + zone name + stars */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-3 pt-3 pb-1 pointer-events-none"
      >
        <button
          onClick={goBack}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/30 backdrop-blur-md"
          style={{ color: colors.accent }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-[14px] font-bold text-white drop-shadow-md">
          {zoneName}
        </span>
        <span className="font-sans text-[11px] font-semibold text-white/60 drop-shadow-md">
          {zoneStars}/30 ★
        </span>
      </motion.div>

      {/* Map SVG */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-[430px]">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            {/* Paths */}
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

              const fromNode = nodes[edge.from];
              const toNode = nodes[edge.to];
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
                <g key={`path-${edge.from}-${edge.to}`}>
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
                        ease: "easeInOut",
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
                      ease: "easeInOut",
                    }}
                    opacity={opacity}
                    strokeDasharray={dash}
                  />
                </g>
              );
            })}

            {/* Level nodes */}
            {nodes.map((node) => {
              const pt = layout?.points[node.nodeInZone];
              if (!pt) return null;

              const cx = pt.x * VB_W;
              const cy = pt.y * VB_H;
              const stateColors = STATE_COLORS[node.state];
              const isPlayingNode =
                activeStoryRun !== null &&
                node.zone === activeStoryRun.zoneId &&
                node.contractLevel === activeStoryRun.level;
              const blockedByActiveRun =
                activeStoryRun !== null && !isPlayingNode;
              const isInteractive =
                node.state !== "locked" && !blockedByActiveRun;
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

              return (
                <motion.g
                  key={`node-${node.nodeInZone}`}
                  onClick={() => {
                    if (activeStoryRun && !isPlayingNode) {
                      showToast({
                        message: `Run in progress on Zone ${activeStoryRun.zoneId}, Level ${activeStoryRun.level}.`,
                        type: "error",
                      });
                      return;
                    }

                    if (activeStoryRun && isPlayingNode) {
                      navigate("play", activeStoryRun.gameId);
                      return;
                    }

                    if (!isInteractive) return;
                    if (canOpenPreview(node)) {
                      setSelectedNode(node);
                    }
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: stateColors.alpha }}
                  transition={{
                    delay: node.nodeInZone * 0.06,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  style={{
                    cursor: isInteractive ? "pointer" : "default",
                    transformOrigin: `${cx}px ${cy}px`,
                  }}
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
                    stroke={node.state === "playing" ? colors.accent : stateColors.border}
                    strokeWidth={
                      node.state === "playing"
                        ? 1.5
                        : node.type === "boss"
                          ? 0.6
                          : 0.4
                    }
                  />

                  {node.state === "playing" && (
                    <>
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r + 2.5}
                        fill={colors.accent}
                        initial={{ opacity: 0.1 }}
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <motion.circle
                        cx={cx}
                        cy={cy}
                        r={r + 1.8}
                        fill="none"
                        stroke={colors.accent}
                        strokeWidth={1}
                        initial={{ opacity: 0.9, scale: 1 }}
                        animate={{ opacity: 0.25, scale: 1.35 }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                    </>
                  )}

                  <>
                    <circle
                      cx={cx + r * 0.7}
                      cy={cy + r * 0.7}
                      r={2}
                      fill="rgba(0,0,0,0.75)"
                      stroke={stateColors.border}
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
                          const stars = zoneProgressData?.levelStars?.[node.contractLevel! - 1] ?? 0;
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
                                fill: filled ? "#FACC15" : "rgba(255,255,255,0.3)",
                              }}
                              transition={{
                                delay: node.nodeInZone * 0.06 + 0.3 + i * 0.1,
                                type: "spring",
                                stiffness: 300,
                                damping: 20,
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
                </motion.g>
              );
            })}

            {/* Info node */}
            <motion.g
              onClick={() => setShowInfo(true)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 18 }}
              style={{ cursor: "pointer", transformOrigin: `${INFO_CX}px ${INFO_CY}px` }}
            >
              <circle
                cx={INFO_CX}
                cy={INFO_CY}
                r={INFO_R}
                fill="rgba(0,0,0,0.5)"
                stroke={colors.accent}
                strokeWidth={0.4}
                strokeDasharray="1.5 1"
              />
              <text
                x={INFO_CX}
                y={INFO_CY + 0.3}
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.accent}
                fontSize={4}
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                ℹ
              </text>
            </motion.g>
          </svg>
        </div>

        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
            game={game ?? null}
            gameLevel={gameLevel}
            gameId={gameId}
            levelStars={zoneProgressData?.levelStars ?? []}
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
              if (completedLevel < 10) {
                setPendingPreviewLevel(completedLevel + 1);
              }
            }}
            level={pendingLevelCompletion.level}
            levelMoves={pendingLevelCompletion.levelMoves}
            prevTotalScore={pendingLevelCompletion.prevTotalScore}
            totalScore={pendingLevelCompletion.totalScore}
            gameLevel={pendingLevelCompletion.gameLevel}
            draftWillOpen={false}
          />
        )}

        {showInfo && (
          <ZoneInfoSheet zoneId={mapZoneId} onClose={() => setShowInfo(false)} />
        )}

        {nodes.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="rounded-2xl border border-white/20 bg-black/45 px-4 py-3 font-sans text-sm font-semibold text-white/80 backdrop-blur-md">
              Loading map...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
