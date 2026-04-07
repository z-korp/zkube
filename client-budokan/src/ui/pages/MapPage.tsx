import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import useAccountCustom from "@/hooks/useAccountCustom";
import { useDojo } from "@/dojo/useDojo";
import { useActiveStoryAttempt } from "@/hooks/useActiveStoryAttempt";
import { useZoneProgress } from "@/hooks/useZoneProgress";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";
import { showToast } from "@/utils/toast";

const SWIPE_THRESHOLD = 50;
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

  const currentZone = useMemo(() => {
    if (game?.zoneId) return game.zoneId;
    return (
      zones.find((zone) => zone.unlocked && !zone.cleared)?.zoneId ??
      zones.find((zone) => zone.unlocked)?.zoneId ??
      1
    );
  }, [game?.zoneId, zones]);

  const mapData = useMapData({
    seed,
    currentZone,
    activeStoryNode: activeStoryRun
      ? {
          zoneId: activeStoryRun.zoneId,
          level: activeStoryRun.level,
        }
      : null,
    zones: zones.map((zone) => ({
      zoneId: zone.zoneId,
      unlocked: zone.unlocked,
      highestCleared: zone.highestCleared ?? 0,
      levelStars: zone.levelStars ?? [],
    })),
  });

  const zoneLayouts = useMapLayout({
    seed,
    totalZones: TOTAL_ZONES,
    nodesPerZone: NODES_PER_ZONE,
  });

  const [activeZone, setActiveZone] = useState(Math.max(0, currentZone - 1));
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const pointerStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  useEffect(() => {
    setActiveZone(Math.max(0, currentZone - 1));
  }, [currentZone]);

  useEffect(() => {
    setMusicPlaylist(["main", "level"]);
  }, [setMusicPlaylist]);

  useEffect(() => {
    const themeRaw = mapData.zoneThemes[activeZone] ?? "theme-1";
    const themeId: ThemeId = isValidThemeId(themeRaw) ? themeRaw : "theme-1";
    setThemeTemplate(themeId);
  }, [activeZone, mapData.zoneThemes, setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const zoneId = activeZone + 1;
    const node = mapData.nodes.find(
      (n) =>
        n.zone === zoneId &&
        n.contractLevel === pendingPreviewLevel &&
        canOpenPreview(n),
    );
    if (node) setSelectedNode(node);
    setPendingPreviewLevel(null);
  }, [
    activeZone,
    mapData.nodes,
    pendingPreviewLevel,
    setPendingPreviewLevel,
  ]);

  const zoneNodes = useMemo(
    () =>
      Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
        const start = zoneIdx * NODES_PER_ZONE;
        return mapData.nodes.slice(start, start + NODES_PER_ZONE);
      }),
    [mapData.nodes],
  );

  const zoneProgressMap = useMemo(
    () => new Map(zones.map((zone) => [zone.zoneId, zone])),
    [zones],
  );

  const activeZoneHasNodes = (zoneNodes[activeZone]?.length ?? 0) > 0;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartX.current = event.clientX;
    isSwiping.current = false;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null || isSwiping.current) return;
    const delta = Math.abs(event.clientX - pointerStartX.current);
    if (delta > 10) {
      isSwiping.current = true;
      (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartX.current === null) return;
    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      setActiveZone((prev) => Math.min(prev + 1, TOTAL_ZONES - 1));
    } else {
      setActiveZone((prev) => Math.max(prev - 1, 0));
    }
  };

  const onPointerCancel = () => {
    pointerStartX.current = null;
    isSwiping.current = false;
  };

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

  const currentTheme: ThemeId = isValidThemeId(themeTemplate)
    ? themeTemplate
    : "theme-1";
  const colors = getThemeColors(currentTheme);
  const activeZoneData = zones[activeZone];
  const zoneStars = activeZoneData?.stars ?? 0;
  const zoneMaxStars = activeZoneData?.maxStars ?? 30;

  return (
    <div className="h-screen-viewport flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-3 mt-3 mb-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-3 py-2 backdrop-blur-md"
      >
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ color: colors.accent }}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-[15px] font-bold" style={{ color: colors.text }}>
            World Map <span className="font-sans text-[12px] font-semibold" style={{ color: colors.textMuted }}>· Zone {activeZone + 1} · zStars {zoneStars}/{zoneMaxStars}</span>
          </h1>
        </div>
      </motion.div>

      <div
        className="relative flex-1 min-h-0 overflow-hidden"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <motion.div
          className="flex h-full"
          style={{ width: `${TOTAL_ZONES * 100}%` }}
          animate={{ x: `-${(activeZone * 100) / TOTAL_ZONES}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
          {zoneNodes.map((nodes, zoneIdx) => {
            const zone = zoneIdx + 1;
            const themeRaw = mapData.zoneThemes[zoneIdx] ?? "theme-1";
            const themeId: ThemeId = isValidThemeId(themeRaw)
              ? themeRaw
              : "theme-1";
            const themeImages = getThemeImages(themeId);
            const layout = zoneLayouts[zoneIdx];
            const pathTheme = getMapPathTheme(themeId);
            const zoneProgress = zoneProgressMap.get(zone);

            return (
              <div key={zone} className="relative h-full flex-shrink-0" style={{ width: `${100 / TOTAL_ZONES}%` }}>
                <ZoneBackground zone={zone} themeId={themeId} />
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
                        <g key={`main-${zoneIdx}-${edge.from}-${edge.to}`}>
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
                          key={`node-${zoneIdx}-${node.nodeInZone}`}
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
                          <clipPath id={`node-clip-${zoneIdx}-${node.nodeInZone}`}>
                            <circle cx={cx} cy={cy} r={r} />
                          </clipPath>
                          <image
                            href={nodeImg}
                            x={cx - r}
                            y={cy - r}
                            width={r * 2}
                            height={r * 2}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath={`url(#node-clip-${zoneIdx}-${node.nodeInZone})`}
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
                                  const stars = zoneProgress?.levelStars?.[node.contractLevel! - 1] ?? 0;
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
                  </svg>
                </div>
              </div>
            );
          })}
        </motion.div>

        {activeZone > 0 && (
          <button
            type="button"
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            onClick={() => setActiveZone((prev) => Math.max(prev - 1, 0))}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {activeZone < TOTAL_ZONES - 1 && (
          <button
            type="button"
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            onClick={() => setActiveZone((prev) => Math.min(prev + 1, TOTAL_ZONES - 1))}
          >
            <ChevronRight size={22} />
          </button>
        )}

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {Array.from({ length: TOTAL_ZONES }, (_, idx) => (
            <button
              key={`zone-dot-${idx}`}
              type="button"
              onClick={() => setActiveZone(idx)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                idx === activeZone ? "scale-125 bg-white" : "bg-white/45"
              }`}
              aria-label={`Go to zone ${idx + 1}`}
            />
          ))}
        </div>

        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
            game={game ?? null}
            gameLevel={gameLevel}
            gameId={gameId}
            levelStars={zoneProgressMap.get(selectedNode.zone)?.levelStars ?? []}
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

        {!activeZoneHasNodes && (
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
