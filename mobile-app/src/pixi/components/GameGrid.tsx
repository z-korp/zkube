import { useCallback, useEffect, useState } from 'react';
import { BlockSprite } from './BlockSprite';
import type { Block } from '@/types/types';
import { BonusType } from '@/dojo/game/types/bonus';
import { createLogger } from '@/utils/logger';

const log = createLogger("GameGrid");

interface GameGridProps {
  blocks: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
  bonus: BonusType;
  isTxProcessing: boolean;
  onExplosion: (x: number, y: number) => void;
}

export const GameGrid = ({
  blocks,
  gridSize,
  gridWidth,
  gridHeight,
  onMove,
  onBonusApply,
  bonus,
  isTxProcessing,
  onExplosion,
}: GameGridProps) => {
  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialBlockX, setInitialBlockX] = useState(0);
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);

  useEffect(() => {
    if (!draggingBlock) {
      setLocalBlocks(blocks);
    }
  }, [blocks, draggingBlock]);

  const isBlocked = useCallback((
    initialX: number,
    newX: number,
    y: number,
    width: number,
    blockId: number
  ) => {
    const rowBlocks = localBlocks.filter(
      (block) => block.y === y && block.id !== blockId
    );

    if (newX > initialX) {
      for (const block of rowBlocks) {
        if (block.x >= initialX + width && block.x < newX + width) {
          return true;
        }
      }
    } else {
      for (const block of rowBlocks) {
        if (block.x + block.width > newX && block.x <= initialX) {
          return true;
        }
      }
    }

    return false;
  }, [localBlocks]);

  const handleDragStart = useCallback((block: Block, globalX: number) => {
    log.debug("dragStart", { blockId: block.id, isTxProcessing, bonus });
    if (isTxProcessing) {
      log.warn("dragStart blocked — isTxProcessing=true");
      return;
    }

    if (bonus !== BonusType.None) {
      onBonusApply(block);
      // Trigger explosion effect at block position
      const centerX = block.x * gridSize + (block.width * gridSize) / 2;
      const centerY = block.y * gridSize + gridSize / 2;
      onExplosion(centerX, centerY);
      return;
    }

    setDraggingBlock(block);
    setDragStartX(globalX);
    setInitialBlockX(block.x);
  }, [bonus, isTxProcessing, onBonusApply, gridSize, onExplosion]);

  const handleDragMove = useCallback((globalX: number) => {
    if (!draggingBlock || isTxProcessing) return;

    const deltaX = globalX - dragStartX;
    const newX = initialBlockX + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - draggingBlock.width, newX));

    if (!isBlocked(initialBlockX, boundedX, draggingBlock.y, draggingBlock.width, draggingBlock.id)) {
      setLocalBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === draggingBlock.id ? { ...b, x: boundedX } : b
        )
      );
    }
  }, [draggingBlock, dragStartX, initialBlockX, gridSize, gridWidth, isBlocked, isTxProcessing]);

  const handleDragEnd = useCallback(() => {
    if (!draggingBlock) return;

    const finalBlock = localBlocks.find(b => b.id === draggingBlock.id);
    if (finalBlock) {
      const finalX = Math.round(finalBlock.x);
      
      setLocalBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === draggingBlock.id ? { ...b, x: finalX } : b
        )
      );

      if (Math.trunc(finalX) !== Math.trunc(initialBlockX)) {
        const rowIndex = gridHeight - 1 - draggingBlock.y;
        log.info("dragEnd → onMove", { rowIndex, startX: Math.trunc(initialBlockX), finalX: Math.trunc(finalX) });
        onMove(rowIndex, Math.trunc(initialBlockX), Math.trunc(finalX));
      } else {
        log.debug("dragEnd — no position change, skip onMove");
      }
    }

    setDraggingBlock(null);
  }, [draggingBlock, localBlocks, initialBlockX, gridHeight, onMove]);

  const handleHoverStart = useCallback((block: Block) => {
    if (!draggingBlock) {
      setHoveredBlock(block);
    }
  }, [draggingBlock]);

  const handleHoverEnd = useCallback(() => {
    setHoveredBlock(null);
  }, []);

  return (
    <pixiContainer>
      {localBlocks.map((block) => (
        <BlockSprite
          key={block.id}
          block={block}
          gridSize={gridSize}
          isDragging={draggingBlock?.id === block.id}
          isSelected={bonus !== BonusType.None}
          isHovered={hoveredBlock?.id === block.id}
          isTxProcessing={isTxProcessing}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
        />
      ))}
    </pixiContainer>
  );
};

export default GameGrid;
