import { useApplication } from '@pixi/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Assets, Texture, FederatedPointerEvent } from 'pixi.js';
import type { Block } from '@/types/types';

interface BlockSpriteProps {
  block: Block;
  gridSize: number;
  isDragging: boolean;
  isSelected: boolean;
  isTxProcessing: boolean;
  onDragStart: (block: Block, globalX: number) => void;
  onDragMove: (globalX: number) => void;
  onDragEnd: () => void;
}

// Block texture paths
const BLOCK_TEXTURES: Record<number, string> = {
  1: '/assets/block-1.png',
  2: '/assets/block-2.png',
  3: '/assets/block-3.png',
  4: '/assets/block-4.png',
};

export const BlockSprite = ({
  block,
  gridSize,
  isDragging,
  isSelected,
  isTxProcessing,
  onDragStart,
  onDragMove,
  onDragEnd,
}: BlockSpriteProps) => {
  const { app } = useApplication();
  const [texture, setTexture] = useState<Texture | null>(null);

  // Load texture for this block size
  useEffect(() => {
    const texturePath = BLOCK_TEXTURES[block.width];
    if (texturePath) {
      Assets.load(texturePath).then(setTexture).catch(console.error);
    }
  }, [block.width]);

  // Calculate position
  const x = block.x * gridSize;
  const y = block.y * gridSize;
  const width = block.width * gridSize;
  const height = gridSize;

  // Visual effects based on state
  const alpha = useMemo(() => {
    if (isTxProcessing) return 0.7;
    if (isDragging) return 0.9;
    return 1;
  }, [isTxProcessing, isDragging]);

  const scale = useMemo(() => {
    if (isDragging) return 1.02;
    if (isSelected) return 1.01;
    return 1;
  }, [isDragging, isSelected]);

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

  if (!texture) {
    // Render a placeholder while texture loads
    return (
      <pixiGraphics
        x={x}
        y={y}
        draw={(g) => {
          g.clear();
          g.rect(0, 0, width, height);
          g.fill({ color: 0x1E293B });
          g.stroke({ width: 1, color: 0x334155 });
        }}
      />
    );
  }

  return (
    <pixiSprite
      texture={texture}
      x={x + width / 2}
      y={y + height / 2}
      width={width * scale}
      height={height * scale}
      anchor={0.5}
      alpha={alpha}
      eventMode="static"
      cursor={isTxProcessing ? 'wait' : isDragging ? 'grabbing' : 'grab'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerUpOutside={handlePointerUp}
    />
  );
};

export default BlockSprite;
