import { useCallback, useMemo, useState } from 'react';
import { type MapNodeData, useMapData, type MapData } from '../../hooks/useMapData';
import { MapNode, NODE_RADIUS } from './MapNode';
import { MapPath } from './MapPath';
import { ZoneBackground } from './ZoneBackground';
import { LevelPreview } from './LevelPreview';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { PageTopBar } from '../pages/PageTopBar';
import { NODES_PER_ZONE, TOTAL_ZONES, TOTAL_NODES } from '../../utils/mapLayout';

export interface MapPageProps {
  seed: bigint;
  currentLevel: number;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  onPlayLevel?: (contractLevel: number) => void;
}

const NODE_VERTICAL_SPACING = 70;
const ZONE_HEADER_HEIGHT = 55;
const ZONE_BOTTOM_PAD = 20;
const MAP_TOP_PAD = 10;

function getZoneHeight(): number {
  return ZONE_HEADER_HEIGHT + NODES_PER_ZONE * NODE_VERTICAL_SPACING + ZONE_BOTTOM_PAD;
}

function getTotalContentHeight(): number {
  return MAP_TOP_PAD + TOTAL_ZONES * getZoneHeight() + 40;
}

function getNodePosition(
  nodeIndex: number,
  screenWidth: number,
): { x: number; y: number } {
  const zone = Math.floor(nodeIndex / NODES_PER_ZONE);
  const nodeInZone = nodeIndex % NODES_PER_ZONE;
  const zoneY = MAP_TOP_PAD + zone * getZoneHeight();

  const y = zoneY + ZONE_HEADER_HEIGHT + nodeInZone * NODE_VERTICAL_SPACING + NODE_VERTICAL_SPACING / 2;

  const centerX = screenWidth / 2;
  const amplitude = screenWidth * 0.22;
  const x = centerX + Math.sin((nodeInZone * Math.PI) / 4) * amplitude;

  return { x, y };
}

export const MapPage = ({
  seed,
  currentLevel,
  screenWidth,
  screenHeight,
  topBarHeight,
  onPlayLevel,
}: MapPageProps) => {
  const mapData = useMapData(seed, currentLevel);
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);

  const contentHeight = getTotalContentHeight();
  const scrollAreaHeight = screenHeight - topBarHeight;

  const currentNodeY = useMemo(() => {
    const pos = getNodePosition(mapData.currentNodeIndex, screenWidth);
    return pos.y;
  }, [mapData.currentNodeIndex, screenWidth]);

  const initialScrollY = useMemo(() => {
    return Math.max(0, currentNodeY - scrollAreaHeight / 2);
  }, [currentNodeY, scrollAreaHeight]);

  const handleNodeTap = useCallback((node: MapNodeData) => {
    setSelectedNode(node);
  }, []);

  const handlePlay = useCallback(() => {
    if (selectedNode?.contractLevel) {
      onPlayLevel?.(selectedNode.contractLevel);
    }
    setSelectedNode(null);
  }, [selectedNode, onPlayLevel]);

  const handleClosePreview = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const nodePositions = useMemo(() => {
    return mapData.nodes.map((_, i) => getNodePosition(i, screenWidth));
  }, [mapData.nodes, screenWidth]);

  return (
    <pixiContainer>
      <PageTopBar
        title="World Map"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showHomeButton={true}
      />

      <PixiScrollContainer
        x={0}
        y={topBarHeight}
        width={screenWidth}
        height={scrollAreaHeight}
        contentHeight={contentHeight}
        initialScrollY={initialScrollY}
        scrollSpeed={1.2}
        showScrollbar={true}
        scrollbarColor={0x94a3b8}
      >
        {Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
          const zoneNum = zoneIdx + 1;
          const zoneY = MAP_TOP_PAD + zoneIdx * getZoneHeight();
          const theme = mapData.zoneThemes[zoneIdx];

          return (
            <ZoneBackground
              key={`zone-${zoneNum}`}
              zone={zoneNum}
              themeId={theme}
              x={0}
              y={zoneY}
              width={screenWidth}
              height={getZoneHeight()}
            />
          );
        })}

        {mapData.nodes.map((node, i) => {
          if (i >= TOTAL_NODES - 1) return null;
          const from = nodePositions[i];
          const to = nodePositions[i + 1];
          return (
            <MapPath
              key={`path-${i}`}
              fromX={from.x}
              fromY={from.y}
              toX={to.x}
              toY={to.y}
              fromState={node.state}
              toState={mapData.nodes[i + 1].state}
            />
          );
        })}

        {mapData.nodes.map((node, i) => {
          const pos = nodePositions[i];
          return (
            <MapNode
              key={`node-${i}`}
              node={node}
              x={pos.x}
              y={pos.y}
              onTap={handleNodeTap}
            />
          );
        })}
      </PixiScrollContainer>

      {selectedNode && (
        <LevelPreview
          node={selectedNode}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          onPlay={handlePlay}
          onClose={handleClosePreview}
        />
      )}
    </pixiContainer>
  );
};

export default MapPage;
