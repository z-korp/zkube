import { useCallback, useMemo, useRef, useState } from 'react';
import { Container, Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { type MapNodeData, useMapData } from '../../hooks/useMapData';
import { MapNode } from './MapNode';
import { MapPath } from './MapPath';
import { ZoneBackground } from './ZoneBackground';
import { LevelPreview } from './LevelPreview';
import { NODES_PER_ZONE, TOTAL_ZONES, MAP_NODE_POSITIONS } from '../../utils/mapLayout';
import { isProceduralTheme, FONT_TITLE } from '../../utils/colors';

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

const SWIPE_THRESHOLD = 50;

function getNodePosition(
  nodeInZone: number,
  screenWidth: number,
  zoneHeight: number,
): { x: number; y: number } {
  const pos = MAP_NODE_POSITIONS[nodeInZone];
  return {
    x: pos.x * screenWidth,
    y: pos.y * zoneHeight,
  };
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
  const [targetZone, setTargetZone] = useState(mapData.currentZone - 1);

  const headerH = standalone ? 0 : topBarHeight;
  const zoneHeight = screenHeight - headerH;

  const slideRef = useRef(targetZone * screenWidth);
  const containerRef = useRef<Container>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  useTick(() => {
    const target = targetZone * screenWidth;
    const diff = target - slideRef.current;
    if (Math.abs(diff) < 0.5) {
      slideRef.current = target;
    } else {
      slideRef.current += diff * 0.15;
    }
    if (containerRef.current) {
      containerRef.current.x = -slideRef.current;
    }
  });

  const handlePointerDown = useCallback((e: { globalX: number; globalY: number }) => {
    pointerStartRef.current = { x: e.globalX, y: e.globalY };
  }, []);

  const handlePointerUp = useCallback((e: { globalX: number; globalY: number }) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.globalX - pointerStartRef.current.x;
    pointerStartRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    setTargetZone((prev) => {
      const maxZone = Math.min(TOTAL_ZONES - 1, mapData.currentZone - 1);
      if (deltaX < 0) return Math.min(prev + 1, maxZone);
      return Math.max(prev - 1, 0);
    });
  }, [mapData.currentZone]);

  const handleNodeTap = useCallback((node: MapNodeData) => {
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

  const drawTitleBar = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, screenWidth, topBarHeight);
    g.fill({ color: 0x000000, alpha: 1 });
    g.rect(0, topBarHeight - 1, screenWidth, 1);
    g.fill({ color: 0x1e293b, alpha: 0.5 });
  }, [screenWidth, topBarHeight]);

  const drawSwipeMask = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, screenWidth, zoneHeight);
    g.fill({ color: 0xffffff });
  }, [screenWidth, zoneHeight]);

  const drawDots = useCallback((g: PixiGraphics) => {
    g.clear();
    const maxReachable = Math.min(TOTAL_ZONES - 1, mapData.currentZone - 1);
    for (let i = 0; i < TOTAL_ZONES; i++) {
      g.circle((i - 2) * 16, 0, 4);
      const isActive = i === targetZone;
      const isReachable = i <= maxReachable;
      g.fill({ color: 0xffffff, alpha: isActive ? 1 : isReachable ? 0.4 : 0.15 });
    }
  }, [targetZone, mapData.currentZone]);

  const zones = useMemo(() => {
    return Array.from({ length: TOTAL_ZONES }, (_, zoneIdx) => {
      const zoneNum = zoneIdx + 1;
      const theme = mapData.zoneThemes[zoneIdx];
      const startIdx = zoneIdx * NODES_PER_ZONE;
      const zoneNodes = mapData.nodes.slice(startIdx, startIdx + NODES_PER_ZONE);
      const procedural = isProceduralTheme(theme);

      const nodePositions = zoneNodes.map((_, i) =>
        getNodePosition(i, screenWidth, zoneHeight),
      );

      return { zoneNum, theme, zoneNodes, procedural, nodePositions };
    });
  }, [mapData.nodes, mapData.zoneThemes, screenWidth, zoneHeight]);

  return (
    <pixiContainer>
      {!standalone && (
        <pixiContainer>
          <pixiGraphics draw={drawTitleBar} eventMode="static" onPointerDown={(e: { stopPropagation: () => void }) => e.stopPropagation()} />
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

      <pixiContainer y={headerH}>
        <pixiGraphics draw={drawSwipeMask} ref={(ref: PixiGraphics | null) => {
          if (ref?.parent) ref.parent.mask = ref;
        }} />

        <pixiContainer
          ref={containerRef}
          eventMode="static"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerUpOutside={handlePointerUp}
        >
          {zones.map(({ zoneNum, theme, zoneNodes, procedural, nodePositions }, zoneIdx) => (
            <pixiContainer key={zoneIdx} x={zoneIdx * screenWidth}>
              <ZoneBackground
                zone={zoneNum}
                themeId={theme}
                x={0}
                y={0}
                width={screenWidth}
                height={zoneHeight}
              />

              {procedural && zoneNodes.map((node, i) => {
                if (i >= zoneNodes.length - 1) return null;
                const from = nodePositions[i];
                const to = nodePositions[i + 1];
                return (
                  <MapPath
                    key={`path-${zoneIdx}-${i}`}
                    fromX={from.x}
                    fromY={from.y}
                    toX={to.x}
                    toY={to.y}
                    fromState={node.state}
                    toState={zoneNodes[i + 1].state}
                  />
                );
              })}

              {zoneNodes.map((node, i) => {
                const pos = nodePositions[i];
                return (
                  <MapNode
                    key={`node-${zoneIdx}-${i}`}
                    node={node}
                    x={pos.x}
                    y={pos.y}
                    onTap={handleNodeTap}
                    entryDelay={i * 30}
                  />
                );
              })}
            </pixiContainer>
          ))}
        </pixiContainer>
      </pixiContainer>

      <pixiGraphics
        draw={drawDots}
        x={screenWidth / 2}
        y={screenHeight - 20}
        eventMode="none"
      />

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
