import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGame } from "@/hooks/useGame";
import {
  MAP_NODE_POSITIONS,
  NODES_PER_ZONE,
  TOTAL_ZONES,
  useMapData,
  type MapNodeData,
} from "@/hooks/useMapData";
import { useNavigationStore } from "@/stores/navigationStore";
import PageTopBar from "@/ui/navigation/PageTopBar";
import LevelPreview from "@/ui/components/map/LevelPreview";
import MapNode from "@/ui/components/map/MapNode";
import MapPath from "@/ui/components/map/MapPath";
import ZoneBackground from "@/ui/components/map/ZoneBackground";

const SWIPE_THRESHOLD = 50;
const SVG_VIEWBOX = 1000;

const canOpenPreview = (node: MapNodeData): boolean => node.state !== "locked";

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
      />

      <div
        className="relative flex-1 overflow-hidden"
        onMouseDown={(event) => onStartDrag(event.clientX)}
        onMouseUp={(event) => onEndDrag(event.clientX)}
        onTouchStart={(event) => onStartDrag(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={(event) => onEndDrag(event.changedTouches[0]?.clientX ?? 0)}
      >
        <motion.div
          className="flex h-full w-[500%]"
          animate={{ x: `-${activeZone * 20}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
          {zoneNodes.map((nodes, zoneIdx) => {
            const zone = zoneIdx + 1;
            const theme = mapData.zoneThemes[zoneIdx] ?? "theme-1";

            return (
              <div key={zone} className="relative h-full w-full flex-1">
                <ZoneBackground zone={zone} themeId={theme} />

                <svg
                  viewBox={`0 0 ${SVG_VIEWBOX} ${SVG_VIEWBOX}`}
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  aria-hidden
                >
                  {nodes.slice(0, -1).map((node, idx) => {
                    const from = MAP_NODE_POSITIONS[idx];
                    const to = MAP_NODE_POSITIONS[idx + 1];

                    return (
                      <MapPath
                        key={`path-${node.nodeIndex}`}
                        fromX={from.x * SVG_VIEWBOX}
                        fromY={from.y * SVG_VIEWBOX}
                        toX={to.x * SVG_VIEWBOX}
                        toY={to.y * SVG_VIEWBOX}
                        fromState={node.state}
                        toState={nodes[idx + 1].state}
                      />
                    );
                  })}
                </svg>

                <div className="absolute inset-0">
                  {nodes.map((node) => {
                    const position = MAP_NODE_POSITIONS[node.nodeInZone];
                    return (
                      <MapNode
                        key={`node-${node.nodeIndex}`}
                        node={node}
                        xPercent={position.x * 100}
                        yPercent={position.y * 100}
                        onTap={(pressedNode) => {
                          if (canOpenPreview(pressedNode)) {
                            setSelectedNode(pressedNode);
                          }
                        }}
                      />
                    );
                  })}
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
