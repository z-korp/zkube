import { useCallback, useState } from 'react';
import { BlockSprite } from './BlockSprite';
import type { Block } from '@/types/types';
import { BonusType } from '@/dojo/game/types/bonus';

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
  const [dragStartX, setDragStartX] = useState(0);
  const [initialBlockX, setInitialBlockX] = useState(0);
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks);

  // Sync blocks when props change (after contract updates)
  if (blocks !== localBlocks && !draggingBlock) {
    setLocalBlocks(blocks);
  }

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
    if (isTxProcessing) return;

    // If bonus is selected, apply it instead of dragging
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

    // Snap to grid
    const finalBlock = localBlocks.find(b => b.id === draggingBlock.id);
    if (finalBlock) {
      const finalX = Math.round(finalBlock.x);
      
      // Update local state with snapped position
      setLocalBlocks(prevBlocks =>
        prevBlocks.map(b =>
          b.id === draggingBlock.id ? { ...b, x: finalX } : b
        )
      );

      // Send move to contract if position changed
      if (Math.trunc(finalX) !== Math.trunc(initialBlockX)) {
        onMove(
          gridHeight - 1 - draggingBlock.y, // Convert to contract row index
          Math.trunc(initialBlockX),
          Math.trunc(finalX)
        );
      }
    }

    setDraggingBlock(null);
  }, [draggingBlock, localBlocks, initialBlockX, gridHeight, onMove]);

  return (
    <pixiContainer>
      {localBlocks.map((block) => (
        <BlockSprite
          key={block.id}
          block={block}
          gridSize={gridSize}
          isDragging={draggingBlock?.id === block.id}
          isSelected={bonus !== BonusType.None}
          isTxProcessing={isTxProcessing}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}
    </pixiContainer>
  );
};

export default GameGrid;
