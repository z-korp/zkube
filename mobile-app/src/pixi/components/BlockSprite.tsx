import { useApplication } from '@pixi/react';
import { useCallback, useEffect, useMemo } from 'react';
import { FederatedPointerEvent, Graphics as PixiGraphics } from 'pixi.js';
import type { Block } from '@/types/types';
import { usePixiTheme, usePerformanceSettings } from '../themes/ThemeContext';
import { getBlockColors, darkenColor, type ThemeId } from '../utils/colors';
import { blockAssetId } from '../assets/catalog';
import { resolveAsset } from '../assets/resolver';
import { useTextureWithFallback } from '../hooks/useTexture';
import { createLogger } from '@/utils/logger';

const log = createLogger("BlockSprite");

interface BlockSpriteProps {
  block: Block;
  gridSize: number;
  isDragging: boolean;
  isSelected: boolean;
  isHovered?: boolean;
  isTxProcessing: boolean;
  onDragStart: (block: Block, globalX: number) => void;
  onDragMove: (globalX: number) => void;
  onDragEnd: () => void;
  onHoverStart?: (block: Block) => void;
  onHoverEnd?: (block: Block) => void;
}

export const BlockSprite = ({
  block,
  gridSize,
  isDragging,
  isSelected,
  isHovered = false,
  isTxProcessing,
  onDragStart,
  onDragMove,
  onDragEnd,
  onHoverStart,
  onHoverEnd,
}: BlockSpriteProps) => {
  const { app } = useApplication();
  const { themeName, colors } = usePixiTheme();

  const blockColors = useMemo(() => 
    getBlockColors(themeName, block.width),
    [themeName, block.width]
  );

  const candidates = useMemo(
    () => resolveAsset(themeName as ThemeId, blockAssetId(block.width)),
    [block.width, themeName],
  );
  const texture = useTextureWithFallback(candidates);

  // Calculate position and dimensions
  const x = block.x * gridSize;
  const y = block.y * gridSize;
  const width = block.width * gridSize;
  const height = gridSize;

  // Visual effects based on state
  const visualState = useMemo(() => {
    let alpha = 1;
    let scale = 1;
    let fillAlpha = 0.85;
    let borderAlpha = 0.4;
    let highlightAlpha = 0.3;
    
    if (isTxProcessing) {
      alpha = 0.7;
    } else if (isDragging) {
      alpha = 0.95;
      scale = 1.05;
      fillAlpha = 0.95;
      borderAlpha = 0.6;
    } else if (isSelected) {
      scale = 1.02;
      borderAlpha = 0.5;
    } else if (isHovered) {
      scale = 1.01;
      fillAlpha = 0.9;
      highlightAlpha = 0.4;
    }
    
    return { alpha, scale, fillAlpha, borderAlpha, highlightAlpha };
  }, [isTxProcessing, isDragging, isSelected, isHovered]);

  // Event handlers
  const handlePointerDown = useCallback((e: FederatedPointerEvent) => {
    log.debug("pointerDown", { blockId: block.id, isTxProcessing, hasTexture: !!texture });
    if (isTxProcessing) {
      log.warn("pointerDown blocked — isTxProcessing=true");
      return;
    }
    e.stopPropagation();
    onDragStart(block, e.global.x);
  }, [block, onDragStart, isTxProcessing, texture]);

  const handlePointerMove = useCallback((e: FederatedPointerEvent) => {
    if (isDragging) {
      onDragMove(e.global.x);
    }
  }, [isDragging, onDragMove]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      onDragEnd();
    }
  }, [isDragging, onDragEnd]);

  const handlePointerOver = useCallback(() => {
    if (!isTxProcessing && onHoverStart) {
      onHoverStart(block);
    }
  }, [block, isTxProcessing, onHoverStart]);

  const handlePointerOut = useCallback(() => {
    if (onHoverEnd) {
      onHoverEnd(block);
    }
  }, [block, onHoverEnd]);

  // Register global move/up handlers when dragging
  useEffect(() => {
    if (isDragging && app) {
      const stage = app.stage;
      
      const onGlobalMove = (e: FederatedPointerEvent) => {
        onDragMove(e.global.x);
      };
      
      const onGlobalUp = () => {
        onDragEnd();
      };

      stage.on('pointermove', onGlobalMove);
      stage.on('pointerup', onGlobalUp);
      stage.on('pointerupoutside', onGlobalUp);

      return () => {
        stage.off('pointermove', onGlobalMove);
        stage.off('pointerup', onGlobalUp);
        stage.off('pointerupoutside', onGlobalUp);
      };
    }
  }, [isDragging, app, onDragMove, onDragEnd]);

  // Draw placeholder while texture loads
  const drawPlaceholder = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: darkenColor(blockColors.fill, 50) });
    g.setStrokeStyle({ width: 1, color: blockColors.fill, alpha: 0.5 });
    g.rect(0, 0, width, height);
    g.fill();
    g.stroke();
  }, [width, height, blockColors]);

  const cursor = isTxProcessing ? 'wait' : isDragging ? 'grabbing' : 'grab';

  // Calculate position with scale adjustment
  const scaledX = x + (width * (1 - visualState.scale)) / 2;
  const scaledY = y + (height * (1 - visualState.scale)) / 2;

  if (!texture) {
    return (
      <pixiContainer
        x={x + width / 2}
        y={y + height / 2}
        eventMode="static"
        cursor={cursor}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <pixiGraphics
          x={-width / 2}
          y={-height / 2}
          draw={drawPlaceholder}
          eventMode="none"
        />
      </pixiContainer>
    );
  }

  return (
    <pixiContainer
      x={x + width / 2}
      y={y + height / 2}
      scale={visualState.scale}
      eventMode="static"
      cursor={cursor}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <pixiSprite
        texture={texture}
        width={width}
        height={height}
        anchor={0.5}
        alpha={visualState.alpha}
        eventMode="none"
      />
    </pixiContainer>
  );
};

export default BlockSprite;
