import { useApplication, useTick } from '@pixi/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Container, FederatedPointerEvent, Graphics as PixiGraphics, Rectangle } from 'pixi.js';
import type { Block } from '@/types/types';
import { usePixiTheme, usePerformanceSettings } from '../themes/ThemeContext';
import { getBlockColors, darkenColor, type ThemeId } from '../utils/colors';
import { blockAssetId } from '../assets/catalog';
import { resolveAsset } from '../assets/resolver';
import { useTextureWithFallback } from '../hooks/useTexture';
import { createLogger } from '@/utils/logger';

const log = createLogger("BlockSprite");

const ANIM_DECAY = 0.82;

interface BlockSpriteProps {
  block: Block;
  gridSize: number;
  isDragging: boolean;
  isSelected: boolean;
  isHovered?: boolean;
  isExploding?: boolean;
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
  isExploding = false,
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

  const animContainerRef = useRef<Container | null>(null);
  const prevBlockYRef = useRef(block.y);
  const animOffsetRef = useRef(0);
  const explodeProgressRef = useRef(0);

  if (block.y !== prevBlockYRef.current) {
    const delta = block.y - prevBlockYRef.current;
    animOffsetRef.current -= delta * gridSize;
    prevBlockYRef.current = block.y;
  }

  useTick((ticker) => {
    const c = animContainerRef.current;
    if (!c) return;

    if (isExploding) {
      explodeProgressRef.current = Math.min(1, explodeProgressRef.current + ticker.deltaMS / 400);
      const t = explodeProgressRef.current;
      c.scale.set(1 + t * 0.4);
      c.alpha = 1 - t;
    } else if (explodeProgressRef.current > 0) {
      explodeProgressRef.current = 0;
      c.scale.set(1);
      c.alpha = 1;
    }

    if (Math.abs(animOffsetRef.current) >= 0.5) {
      animOffsetRef.current *= ANIM_DECAY;
      c.y = animOffsetRef.current;
    } else if (animOffsetRef.current !== 0) {
      animOffsetRef.current = 0;
      c.y = 0;
    }
  }, isExploding || animOffsetRef.current !== 0);

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
  const hitArea = useMemo(() => new Rectangle(-width / 2, -height / 2, width, height), [width, height]);

  if (!texture) {
    return (
      <pixiContainer
        x={x + width / 2}
        y={y + height / 2}
        hitArea={hitArea}
        eventMode="static"
        cursor={cursor}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <pixiContainer ref={animContainerRef}>
          <pixiGraphics
            x={-width / 2}
            y={-height / 2}
            draw={drawPlaceholder}
            eventMode="none"
          />
        </pixiContainer>
      </pixiContainer>
    );
  }

  return (
    <pixiContainer
      x={x + width / 2}
      y={y + height / 2}
      scale={visualState.scale}
      hitArea={hitArea}
      eventMode="static"
      cursor={cursor}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUp}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <pixiContainer ref={animContainerRef}>
        <pixiSprite
          texture={texture}
          width={width}
          height={height}
          anchor={0.5}
          alpha={visualState.alpha}
          eventMode="none"
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default BlockSprite;
