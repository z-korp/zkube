import { useCallback, useMemo, useState } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { type MapNodeData, useMapData } from '../../hooks/useMapData';
import { MapNode } from './MapNode';
import { MapPath } from './MapPath';
import { ZoneBackground } from './ZoneBackground';
import { LevelPreview } from './LevelPreview';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { NODES_PER_ZONE, TOTAL_ZONES, TOTAL_NODES } from '../../utils/mapLayout';
import { FONT_TITLE } from '../../utils/colors';

export interface MapPageProps {
  seed: bigint;
  currentLevel: number;
  isGameOver?: boolean;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  onPlayLevel?: (contractLevel: number) => void;
  standalone?: boolean;
  onBack?: () => void;
  levelStarsFn?: (level: number) => number;
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

const MAP_TITLE_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 20, fill: 0xFFFFFF,
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
};

export const MapPage = ({
  seed,
  currentLevel,
  isGameOver = false,
  screenWidth,
  screenHeight,
  topBarHeight,
  onPlayLevel,
  standalone = false,
  onBack,
  levelStarsFn,
}: MapPageProps) => {
  const mapData = useMapData(seed, currentLevel, undefined, levelStarsFn);
  const [selectedNode, setSelectedNode] = useState<MapNodeData | null>(null);

  const headerH = standalone ? 0 : topBarHeight;
  const contentHeight = getTotalContentHeight();
  const scrollAreaHeight = screenHeight - headerH;

  const currentNodeY = useMemo(() => {
    const pos = getNodePosition(mapData.currentNodeIndex, screenWidth);
    return pos.y;
  }, [mapData.currentNodeIndex, screenWidth]);

  const initialScrollY = useMemo(() => {
    return Math.max(0, currentNodeY - scrollAreaHeight / 2);
  }, [currentNodeY, scrollAreaHeight]);

  const handleNodeTap = useCallback((node: MapNodeData) => {
    // Allow tapping cleared/current nodes in game-over mode for review
    if (isGameOver || node.state === 'current' || node.state === 'available' || node.state === 'cleared') {
      setSelectedNode(node);
    }
  }, [isGameOver]);

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

  const entryDelays = useMemo(() => {
    const currentIdx = mapData.currentNodeIndex;
    return mapData.nodes.map((_, i) => Math.abs(i - currentIdx) * 30);
  }, [mapData.nodes, mapData.currentNodeIndex]);

  const drawTitleBar = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, screenWidth, topBarHeight);
    g.fill({ color: 0x000000, alpha: 1 });
    g.rect(0, topBarHeight - 1, screenWidth, 1);
    g.fill({ color: 0x1e293b, alpha: 0.5 });
  }, [screenWidth, topBarHeight]);

  return (
    <pixiContainer>
      {!standalone && (
        <pixiContainer>
          <pixiGraphics draw={drawTitleBar} eventMode="static" onPointerDown={(e: any) => e.stopPropagation()} />
          {onBack && (
            <pixiText
              text="←"
              x={16}
              y={topBarHeight / 2}
              anchor={{ x: 0, y: 0.5 }}
              style={{ fontSize: 22, fill: 0xffffff }}
              eventMode="static"
              cursor="pointer"
              onPointerUp={onBack}
            />
          )}
           <pixiText text="WORLD MAP" x={screenWidth / 2} y={topBarHeight / 2} anchor={0.5} style={MAP_TITLE_STYLE} eventMode="none" />
        </pixiContainer>
      )}

      <PixiScrollContainer
        x={0}
        y={headerH}
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
              entryDelay={entryDelays[i]}
            />
          );
        })}
      </PixiScrollContainer>

      {selectedNode && (
        <LevelPreview
          node={selectedNode}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          isGameOver={isGameOver}
          onPlay={handlePlay}
          onClose={handleClosePreview}
        />
      )}
    </pixiContainer>
  );
};

export default MapPage;
