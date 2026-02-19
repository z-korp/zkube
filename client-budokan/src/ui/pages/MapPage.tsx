import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useGame } from "@/hooks/useGame";
import {
  NODES_PER_ZONE,
  TOTAL_ZONES,
  useMapData,
  type MapNodeData,
} from "@/hooks/useMapData";
import {
  MAP_LAYOUT_PRESETS,
  useMapLayout,
  type MapLayoutPresetId,
} from "@/hooks/useMapLayout";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelPreview from "@/ui/components/map/LevelPreview";
import MapFlowNode, { type MapFlowNodeData } from "@/ui/components/map/MapFlowNode";
import ZoneBackground from "@/ui/components/map/ZoneBackground";

const SWIPE_THRESHOLD = 50;
const FLOW_WIDTH = 900;
const FLOW_HEIGHT = 1500;

const nodeTypes: NodeTypes = {
  mapNode: MapFlowNode,
};

const canOpenPreview = (node: MapNodeData): boolean => node.state !== "locked";

const getPathType = (
  fromState: MapNodeData["state"],
  toState: MapNodeData["state"],
): "cleared" | "active" | "locked" => {
  if (fromState === "cleared" && (toState === "cleared" || toState === "visited")) {
    return "cleared";
  }
  if (fromState === "cleared" && (toState === "current" || toState === "available")) {
    return "active";
  }
  return "locked";
};

function isMapFlowNodeData(data: unknown): data is MapFlowNodeData {
  if (!data || typeof data !== "object") return false;
  const candidate = data as { node?: unknown };
  return !!candidate.node && typeof candidate.node === "object";
}

const MapPage: React.FC = () => {
  const navigate = useNavigationStore((state) => state.navigate);
  const goBack = useNavigationStore((state) => state.goBack);
  const gameId = useNavigationStore((state) => state.gameId);

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

  const zoneNodes = useMemo(
    () =>
      Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
        const start = zoneIdx * NODES_PER_ZONE;
        return mapData.nodes.slice(start, start + NODES_PER_ZONE);
      }),
    [mapData.nodes],
  );

  const zoneFlowData = useMemo(
    () =>
      zoneNodes.map((nodes, zoneIdx) => {
        const layout = zoneLayouts[zoneIdx];
        if (!layout) {
          return { nodes: [] as Node[], edges: [] as Edge[] };
        }

        const flowNodes: Node[] = nodes.map((node) => {
          const position = layout.points[node.nodeInZone] ?? { x: 0.5, y: 0.5 };
          return {
            id: `node-${node.nodeInZone}`,
            type: "mapNode",
            data: { node },
            position: {
              x: position.x * FLOW_WIDTH,
              y: position.y * FLOW_HEIGHT,
            },
            draggable: false,
            selectable: false,
          };
        });

        const flowEdges: Edge[] = layout.edges.map((edge) => {
          const fromNode = nodes[edge.from];
          const toNode = nodes[edge.to];

          if (!fromNode || !toNode) {
            return {
              id: `${zoneIdx}-${edge.from}-${edge.to}`,
              source: `node-${edge.from}`,
              target: `node-${edge.to}`,
              type: "smoothstep",
              animated: false,
            };
          }

          if (edge.kind === "branch") {
            return {
              id: `branch-${zoneIdx}-${edge.from}-${edge.to}`,
              source: `node-${edge.from}`,
              target: `node-${edge.to}`,
              type: "bezier",
              style: {
                stroke: "rgba(255,255,255,0.2)",
                strokeWidth: 2,
                strokeDasharray: "6 8",
              },
              interactionWidth: 0,
            };
          }

          const pathType = getPathType(fromNode.state, toNode.state);
          const style =
            pathType === "cleared"
              ? { stroke: "#22c55e", strokeWidth: 4, opacity: 0.9 }
              : pathType === "active"
                ? { stroke: "#f97316", strokeWidth: 4, opacity: 0.9 }
                : {
                    stroke: "#6b7280",
                    strokeWidth: 2.5,
                    opacity: 0.45,
                    strokeDasharray: "8 7",
                  };

          return {
            id: `main-${zoneIdx}-${edge.from}-${edge.to}`,
            source: `node-${edge.from}`,
            target: `node-${edge.to}`,
            type: "smoothstep",
            style,
            interactionWidth: 0,
          };
        });

        return { nodes: flowNodes, edges: flowEdges };
      }),
    [zoneLayouts, zoneNodes],
  );

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
        rightSlot={(
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
        )}
      />

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
          {zoneNodes.map((_nodes, zoneIdx) => {
            const zone = zoneIdx + 1;
            const theme = mapData.zoneThemes[zoneIdx] ?? "theme-1";
            const flowData = zoneFlowData[zoneIdx] ?? { nodes: [], edges: [] };

            return (
              <div key={zone} className="relative h-full w-full flex-1">
                <div className="relative h-full w-full lg:mx-auto lg:w-auto lg:max-w-full lg:aspect-[9/16]">
                  <ZoneBackground zone={zone} themeId={theme} />

                  <div className="absolute inset-0">
                    <ReactFlow
                      nodes={flowData.nodes}
                      edges={flowData.edges}
                      nodeTypes={nodeTypes}
                      onNodeClick={(_, node) => {
                        if (!isMapFlowNodeData(node.data)) return;
                        const pressedNode = node.data.node;
                        if (canOpenPreview(pressedNode)) {
                          setSelectedNode(pressedNode);
                        }
                      }}
                      fitView
                      fitViewOptions={{
                        padding: 0.16,
                        minZoom: 0.8,
                        maxZoom: 1.15,
                      }}
                      nodesDraggable={false}
                      nodesConnectable={false}
                      elementsSelectable={false}
                      nodesFocusable={false}
                      edgesFocusable={false}
                      panOnDrag={false}
                      zoomOnScroll={false}
                      zoomOnPinch={false}
                      zoomOnDoubleClick={false}
                      preventScrolling={false}
                      proOptions={{ hideAttribution: true }}
                      className="!bg-transparent"
                    />
                  </div>
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

        {selectedNode && (
          <LevelPreview
            node={selectedNode}
            gameId={gameId}
            onPlay={handlePlay}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MapPage;
