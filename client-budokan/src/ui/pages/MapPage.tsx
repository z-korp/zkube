import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import {
  NODES_PER_ZONE,
  TOTAL_ZONES,
  useMapData,
  type MapNodeData,
  type NodeState,
} from "@/hooks/useMapData";
import {
  MAP_LAYOUT_PRESETS,
  useMapLayout,
  type MapLayoutPresetId,
} from "@/hooks/useMapLayout";
import { getMapPathTheme, isValidThemeId, type ThemeId } from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { useMusicPlayer } from "@/contexts/hooks";
import { useNavigationStore } from "@/stores/navigationStore";
import { isInGameShopAvailable } from "@/dojo/game/helpers/runDataPacking";
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelPreview from "@/ui/components/map/LevelPreview";
import LevelCompleteDialog from "@/ui/components/LevelCompleteDialog";
import ZoneBackground from "@/ui/components/map/ZoneBackground";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const canOpenPreview = (node: MapNodeData): boolean => node.state !== "locked";

const getPathType = (
  fromState: NodeState,
  toState: NodeState,
): "cleared" | "active" | "locked" => {
  if (fromState === "cleared" && (toState === "cleared" || toState === "visited")) {
    return "cleared";
  }
  if (fromState === "cleared" && (toState === "current" || toState === "available")) {
    return "active";
  }
  return "locked";
};

const getLabel = (node: MapNodeData): string => {
  if (node.type === "shop") {
    return node.state === "visited" ? "\u2713" : "SHOP";
  }
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
  const pendingPreviewLevel = useNavigationStore((state) => state.pendingPreviewLevel);
  const setPendingPreviewLevel = useNavigationStore((state) => state.setPendingPreviewLevel);
  const pendingLevelCompletion = useNavigationStore((state) => state.pendingLevelCompletion);
  const setPendingLevelCompletion = useNavigationStore((state) => state.setPendingLevelCompletion);
  const { setThemeTemplate } = useTheme();
  const { setMusicContext } = useMusicPlayer();

  const { game, seed } = useGame({
    gameId: gameId ?? undefined,
    shouldLog: false,
  });

  const currentLevel = game?.level ?? 1;
  const mapData = useMapData({ seed, currentLevel });
  const [layoutPreset, setLayoutPreset] = useState<MapLayoutPresetId>("balanced");
  const zoneLayouts = useMapLayout({
    seed,
    totalZones: TOTAL_ZONES,
    nodesPerZone: NODES_PER_ZONE,
    preset: layoutPreset,
  });

  const [activeZone, setActiveZone] = useState(Math.max(0, mapData.currentZone - 1));
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    setActiveZone(Math.max(0, mapData.currentZone - 1));
  }, [mapData.currentZone]);

  useEffect(() => {
    setMusicContext("main");
  }, [setMusicContext]);

  useEffect(() => {
    const themeRaw = mapData.zoneThemes[activeZone] ?? "theme-1";
    const themeId: ThemeId = isValidThemeId(themeRaw) ? themeRaw : "theme-1";
    setThemeTemplate(themeId, false);
  }, [activeZone, mapData.zoneThemes, setThemeTemplate]);

  useEffect(() => {
    if (pendingPreviewLevel == null) return;
    const node = mapData.nodes.find(
      (n) => n.contractLevel === pendingPreviewLevel && canOpenPreview(n),
    );
    if (node) {
      setActiveZone(node.zone);
      setSelectedNode(node);
    }
    setPendingPreviewLevel(null);
  }, [pendingPreviewLevel, mapData.nodes, setPendingPreviewLevel]);

  /* Split nodes into per-zone arrays */
  const zoneNodes = useMemo(
    () =>
      Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
        const start = zoneIdx * NODES_PER_ZONE;
        return mapData.nodes.slice(start, start + NODES_PER_ZONE);
      }),
    [mapData.nodes],
  );

  /* ---- Swipe handlers ---- */

  const onStartDrag = (clientX: number) => {
    pointerStartX.current = clientX;
  };

  const onEndDrag = (clientX: number) => {
    if (pointerStartX.current === null) return;
    const deltaX = clientX - pointerStartX.current;
    pointerStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0) {
      setActiveZone((prev) => Math.min(prev + 1, TOTAL_ZONES - 1));
      return;
    }

    setActiveZone((prev) => Math.max(prev - 1, 0));
  };

  const handlePlay = () => {
    if (gameId !== null) {
      navigate("play", gameId);
    }
  };

  return (
    <div className="h-screen-viewport flex flex-col">
      <PageTopBar
        title="WORLD MAP"
        subtitle={`Level ${currentLevel}`}
        onBack={goBack}
        rightSlot={
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/20 p-1">
            {Object.entries(MAP_LAYOUT_PRESETS).map(([presetId, preset]) => {
              const isActive = layoutPreset === presetId;
              return (
                <button
                  key={presetId}
                  type="button"
                  onClick={() => setLayoutPreset(presetId as MapLayoutPresetId)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ---- Map viewport ---- */}
      <div
        className="relative flex-1 overflow-hidden"
        onMouseDown={(event) => onStartDrag(event.clientX)}
        onMouseUp={(event) => onEndDrag(event.clientX)}
        onTouchStart={(event) => onStartDrag(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => onEndDrag(event.changedTouches[0]?.clientX ?? 0)}
      >
        <motion.div
          className="flex h-full"
          style={{ width: `${TOTAL_ZONES * 100}%` }}
          animate={{ x: `-${activeZone * (100 / TOTAL_ZONES)}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
          {zoneNodes.map((nodes, zoneIdx) => {
            const zone = zoneIdx + 1;
            const themeRaw = mapData.zoneThemes[zoneIdx] ?? "theme-1";
            const themeId: ThemeId = isValidThemeId(themeRaw) ? themeRaw : "theme-1";
            const layout = zoneLayouts[zoneIdx];
            const pathTheme = getMapPathTheme(themeId);

            return (
              <div key={zone} className="relative h-full w-full flex-1">
                <ZoneBackground zone={zone} themeId={themeId} />
                <div className="relative h-full w-full lg:mx-auto lg:w-auto lg:max-w-full lg:aspect-[9/16]">
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

                      if (edge.kind === "branch") {
                        return (
                          <path
                            key={`branch-${zoneIdx}-${edge.from}-${edge.to}`}
                            d={d}
                            fill="none"
                            stroke={pathTheme.branchColor}
                            strokeWidth={1}
                            strokeDasharray={pathTheme.branchDash}
                            strokeLinecap="round"
                          />
                        );
                      }

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

                    {nodes.map((node) => {
                      const pt = layout?.points[node.nodeInZone];
                      if (!pt) return null;

                      const cx = pt.x * VB_W;
                      const cy = pt.y * VB_H;
                      const colors = STATE_COLORS[node.state];
                      const isInteractive = node.state !== "locked";
                      const label = getLabel(node);

                      return (
                        <g
                          key={`node-${zoneIdx}-${node.nodeInZone}`}
                          onClick={() => {
                            if (isInteractive && canOpenPreview(node)) {
                              setSelectedNode(node);
                            }
                          }}
                          style={{ cursor: isInteractive ? "pointer" : "default" }}
                          opacity={colors.alpha}
                          className={node.state === "current" ? "animate-pulse" : ""}
                        >
                          {node.type === "shop" ? (
                            <>
                              <rect
                                x={cx - 4}
                                y={cy - 2.5}
                                width={8}
                                height={5}
                                rx={1.2}
                                fill={colors.fill}
                                stroke={colors.border}
                                strokeWidth={0.4}
                              />
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={colors.text}
                                fontSize={1.8}
                                fontFamily="Bangers"
                                letterSpacing="0.08em"
                              >
                                {label}
                              </text>
                            </>
                          ) : (
                            <>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={node.type === "boss" ? 3.2 : 2.5}
                                fill={colors.fill}
                                stroke={colors.border}
                                strokeWidth={node.type === "boss" ? 0.5 : 0.4}
                              />
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={colors.text}
                                fontSize={2.2}
                                fontFamily="Bangers"
                              >
                                {label}
                              </text>
                            </>
                          )}

                          {node.state === "cleared" && (
                            <text
                              x={cx}
                              y={cy + (node.type === "boss" ? 4.5 : 3.8)}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={1.6}
                            >
                              {"🧊".repeat(node.cubesEarned || 3)}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ---- Zone navigation arrows ---- */}
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

        {/* ---- Zone dots ---- */}
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

        {/* ---- Level preview modal ---- */}
        {selectedNode && !pendingLevelCompletion && (
          <LevelPreview
            node={selectedNode}
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
              const shopAvailable = isInGameShopAvailable(completedLevel);

              setPendingLevelCompletion(null);

              if (shopAvailable) {
                navigate("ingameshop");
              } else {
                setPendingPreviewLevel(completedLevel + 1);
              }
            }}
            level={pendingLevelCompletion.level}
            levelMoves={pendingLevelCompletion.levelMoves}
            prevTotalCubes={pendingLevelCompletion.prevTotalCubes}
            totalCubes={pendingLevelCompletion.totalCubes}
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
