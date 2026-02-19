import { useEffect, useMemo, useRef, useState } from "react";
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
import MapFlowNode from "@/ui/components/map/MapFlowNode";
import ZoneBackground from "@/ui/components/map/ZoneBackground";

const FLOW_WIDTH = 900;
const ZONE_SECTION_HEIGHT = 920;
const FLOW_TOP_PADDING = 96;
const FLOW_BOTTOM_PADDING = 80;
const FLOW_SIDE_PADDING = 72;

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
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveZone(Math.max(0, mapData.currentZone - 1));
  }, [mapData.currentZone]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const zoneIndex = Math.max(0, mapData.currentZone - 1);
    container.scrollTo({
      top: zoneIndex * ZONE_SECTION_HEIGHT,
      behavior: "smooth",
    });
  }, [mapData.currentZone]);

  const zoneNodes = useMemo(
    () =>
      Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
        const start = zoneIdx * NODES_PER_ZONE;
        return mapData.nodes.slice(start, start + NODES_PER_ZONE);
      }),
    [mapData.nodes],
  );

  const mapHeight = TOTAL_ZONES * ZONE_SECTION_HEIGHT;

  const flowData = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    const laneWidth = FLOW_WIDTH - FLOW_SIDE_PADDING * 2;
    const zoneFlowHeight = ZONE_SECTION_HEIGHT - FLOW_TOP_PADDING - FLOW_BOTTOM_PADDING;

    zoneNodes.forEach((nodes, zoneIdx) => {
      const layout = zoneLayouts[zoneIdx];
      if (!layout) return;

      const baseY = zoneIdx * ZONE_SECTION_HEIGHT + FLOW_TOP_PADDING;

      nodes.forEach((node) => {
        const position = layout.points[node.nodeInZone] ?? { x: 0.5, y: 0.5 };
        flowNodes.push({
          id: `node-${node.nodeIndex}`,
          type: "mapNode",
          data: {
            node,
            onTap: (pressedNode: MapNodeData) => {
              if (canOpenPreview(pressedNode)) {
                setSelectedNode(pressedNode);
              }
            },
          },
          position: {
            x: FLOW_SIDE_PADDING + position.x * laneWidth,
            y: baseY + position.y * zoneFlowHeight,
          },
          draggable: false,
          selectable: false,
        });
      });

      layout.edges.forEach((edge) => {
        const fromNode = nodes[edge.from];
        const toNode = nodes[edge.to];

        if (!fromNode || !toNode) return;

        if (edge.kind === "branch") {
          flowEdges.push({
            id: `branch-${zoneIdx}-${edge.from}-${edge.to}`,
            source: `node-${fromNode.nodeIndex}`,
            target: `node-${toNode.nodeIndex}`,
            type: "bezier",
            style: {
              stroke: "rgba(255,255,255,0.2)",
              strokeWidth: 2,
              strokeDasharray: "6 8",
            },
            interactionWidth: 0,
          });
          return;
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

        flowEdges.push({
          id: `main-${zoneIdx}-${edge.from}-${edge.to}`,
          source: `node-${fromNode.nodeIndex}`,
          target: `node-${toNode.nodeIndex}`,
          type: "smoothstep",
          style,
          interactionWidth: 0,
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [zoneLayouts, zoneNodes]);

  const jumpToZone = (zoneIdx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: zoneIdx * ZONE_SECTION_HEIGHT, behavior: "smooth" });
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const centerY = container.scrollTop + container.clientHeight * 0.45;
    const zoneIdx = Math.min(TOTAL_ZONES - 1, Math.max(0, Math.floor(centerY / ZONE_SECTION_HEIGHT)));
    setActiveZone(zoneIdx);
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

      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden"
          onScroll={handleScroll}
        >
          <div className="relative mx-auto w-full max-w-[780px]" style={{ height: mapHeight }}>
            {Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
              const zone = zoneIdx + 1;
              const theme = mapData.zoneThemes[zoneIdx] ?? "theme-1";

              return (
                <div
                  key={`zone-bg-${zone}`}
                  className="absolute left-0 right-0"
                  style={{ top: zoneIdx * ZONE_SECTION_HEIGHT, height: ZONE_SECTION_HEIGHT }}
                >
                  <ZoneBackground zone={zone} themeId={theme} />
                </div>
              );
            })}

            <div className="absolute inset-0">
              <ReactFlow
                nodes={flowData.nodes}
                edges={flowData.edges}
                nodeTypes={nodeTypes}
                fitView={false}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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

        <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2">
          {Array.from({ length: TOTAL_ZONES }, (_, idx) => (
            <button
              key={`zone-dot-${idx}`}
              type="button"
              onClick={() => jumpToZone(idx)}
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
