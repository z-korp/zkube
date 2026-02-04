import { useApplication } from '@pixi/react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Assets, Texture, FederatedPointerEvent, Graphics as PixiGraphics, Container as PixiContainer } from 'pixi.js';
import { GlowFilter, DropShadowFilter } from 'pixi-filters';
import type { Block } from '@/types/types';
import { usePixiTheme, usePerformanceSettings } from '../themes/ThemeContext';
import { getBlockColors, lightenColor, darkenColor } from '../utils/colors';

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
  const { themeName, isProcedural, colors } = usePixiTheme();
  const { glowQuality, isMobile } = usePerformanceSettings();
  
  const [texture, setTexture] = useState<Texture | null>(null);
  
  // Get block colors based on theme and block width
  const blockColors = useMemo(() => 
    getBlockColors(themeName, block.width),
    [themeName, block.width]
  );

  // Create filters
  const filters = useMemo(() => {
    if (isProcedural) {
      // Neon theme - glow filter
      return [new GlowFilter({
        distance: isMobile ? 8 : 12,
        outerStrength: 1.5,
        innerStrength: 0.5,
        color: blockColors.glow,
        quality: glowQuality,
      })];
    } else {
      // Tiki theme - subtle drop shadow
      return [new DropShadowFilter({
        offset: { x: 2, y: 2 },
        color: 0x000000,
        alpha: 0.3,
        blur: 2,
      })];
    }
  }, [isProcedural, blockColors.glow, glowQuality, isMobile]);

  // Update filter properties based on state
  useEffect(() => {
    if (isProcedural && filters[0] instanceof GlowFilter) {
      const glow = filters[0] as GlowFilter;
      if (isDragging) {
        glow.outerStrength = 2.5;
        glow.innerStrength = 1;
      } else if (isSelected) {
        glow.outerStrength = 2;
        glow.innerStrength = 0.8;
      } else if (isHovered) {
        glow.outerStrength = 2;
        glow.innerStrength = 0.6;
      } else {
        glow.outerStrength = 1.5;
        glow.innerStrength = 0.5;
      }
    }
  }, [filters, isProcedural, isDragging, isSelected, isHovered]);

  // Load texture for tiki theme
  useEffect(() => {
    if (isProcedural) {
      setTexture(null);
      return;
    }
    
    const texturePath = `/assets/${themeName}/block-${block.width}.png`;
    Assets.load(texturePath)
      .then(setTexture)
      .catch(() => {
        // Fallback to default assets folder
        Assets.load(`/assets/block-${block.width}.png`)
          .then(setTexture)
          .catch(console.error);
      });
  }, [block.width, isProcedural, themeName]);

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
    if (isTxProcessing) return;
    e.stopPropagation();
    onDragStart(block, e.global.x);
  }, [block, onDragStart, isTxProcessing]);

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

  // Draw procedural neon block
  const drawNeonBlock = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const padding = 2;
    const radius = 6;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    
    // Main fill - rounded rectangle
    g.setFillStyle({ 
      color: blockColors.fill, 
      alpha: visualState.fillAlpha * visualState.alpha 
    });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.fill();
    
    // Outer border (white, subtle)
    g.setStrokeStyle({ 
      width: 2, 
      color: 0xFFFFFF, 
      alpha: visualState.borderAlpha * visualState.alpha 
    });
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.stroke();
    
    // Inner highlight (top edge shine)
    const highlightHeight = innerHeight * 0.35;
    g.setFillStyle({ 
      color: lightenColor(blockColors.fill, 30), 
      alpha: visualState.highlightAlpha * visualState.alpha 
    });
    g.roundRect(
      padding + 3, 
      padding + 3, 
      innerWidth - 6, 
      highlightHeight, 
      radius - 2
    );
    g.fill();
    
    // Center line accent (gives depth)
    g.setStrokeStyle({ 
      width: 1, 
      color: 0xFFFFFF, 
      alpha: 0.1 * visualState.alpha 
    });
    g.moveTo(padding + 4, height / 2);
    g.lineTo(width - padding - 4, height / 2);
    g.stroke();
    
    // Bottom edge shadow
    g.setFillStyle({ 
      color: 0x000000, 
      alpha: 0.2 * visualState.alpha 
    });
    g.roundRect(
      padding + 2, 
      height - padding - 4, 
      innerWidth - 4, 
      3, 
      2
    );
    g.fill();
    
  }, [width, height, blockColors, visualState]);

  // Draw placeholder while texture loads (tiki theme)
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

  // Procedural rendering (neon theme)
  if (isProcedural) {
    return (
      <pixiContainer
        x={scaledX}
        y={scaledY}
        scale={visualState.scale}
        filters={filters}
        eventMode="static"
        cursor={cursor}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <pixiGraphics draw={drawNeonBlock} />
      </pixiContainer>
    );
  }

  // Texture rendering (tiki theme)
  if (!texture) {
    return (
      <pixiGraphics
        x={x}
        y={y}
        draw={drawPlaceholder}
      />
    );
  }

  return (
    <pixiContainer
      x={x + width / 2}
      y={y + height / 2}
      scale={visualState.scale}
      filters={filters}
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
      />
    </pixiContainer>
  );
};

export default BlockSprite;
