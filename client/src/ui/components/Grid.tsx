import React, { useCallback, useEffect, useState } from "react";
import "../../grid.css";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import BlockContainer from "./Block";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocks,
  isGridFull,
} from "@/utils/gridUtils";

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (block: Block) => void;
}

const Grid: React.FC<GridProps> = ({
  initialData,
  nextLineData,
  gridHeight,
  gridWidth,
  gridSize,
  selectBlock,
}) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  const { account } = useAccountCustom();
  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [dragging, setDragging] = useState<Block | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [pendingMove, setPendingMove] = useState<{
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isTxProcessing, setIsTxProcessing] = useState(false);

  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = 100;

  useEffect(() => {
    setBlocks(initialData);
    setIsTxProcessing(false);
  }, [initialData]);

  const handleTransitionBlockStart = (id: number) => {
    setTransitioningBlocks((prev) => {
      const updatedBlocks = prev.includes(id) ? prev : [...prev, id];
      return updatedBlocks;
    });
  };

  const handleTransitionBlockEnd = (id: number) => {
    setTransitioningBlocks((prev) => {
      const updatedBlocks = prev.filter((blockId) => blockId !== id);
      return updatedBlocks;
    });
  };

  const handleDragMove = (x: number) => {
    if (!dragging) return;

    const deltaX = x - dragStartX;
    const newX = initialX + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    // Vérifie si le nouveau X est en dehors des limites de la grille
    if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
      endDrag(); // Appelle endDrag si le drag sort de la grille
      return; // Sort de la fonction
    }

    if (
      !isBlocked(
        initialX,
        boundedX,
        dragging.y,
        dragging.width,
        blocks,
        dragging.id,
      )
    ) {
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b,
        ),
      );
    }
  };

  const handleDragStart = (x: number, block: Block) => {
    if (isTxProcessing) return;
    setDragging(block);
    setDragStartX(x);
    setInitialX(block.x);
    setGameState(GameState.DRAGGING);
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    handleDragStart(e.clientX, block);
  };

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX);
  };

  const endDrag = () => {
    if (!dragging) return;

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x);
          if (Math.trunc(finalX) !== Math.trunc(initialX))
            setIsTxProcessing(true);
          setPendingMove({ rowIndex: b.y, startX: initialX, finalX });
          return { ...b, x: finalX };
        }
        return b;
      });
      return updatedBlocks;
    });

    setDragging(null);
    setIsMoving(true);
    setGameState(GameState.GRAVITY);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  const handleMoveTX = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (startColIndex === finalColIndex || isMoving) return;
      if (!account) return;
      setIsTxProcessing(true);
      try {
        await move({
          account: account as Account,
          row_index: gridHeight - 1 - rowIndex,
          start_index: Math.trunc(startColIndex),
          final_index: Math.trunc(finalColIndex),
        });
        console.log(
          `Mouvement effectué : Ligne ${rowIndex}, de ${startColIndex} à ${finalColIndex}`,
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi de la transaction", error);
      }
    },
    [account, isMoving, gridHeight, move],
  );

  const isBlocked = (
    initialX: number,
    newX: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    const rowBlocks = blocks.filter(
      (block) => block.y === y && block.id !== blockId,
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
  };

  const calculateFallDistance = (block: Block, blocks: Block[]) => {
    let maxFall = gridHeight - block.y - 1;
    for (let y = block.y + 1; y < gridHeight; y++) {
      if (isCollision(block.x, y, block.width, blocks, block.id)) {
        maxFall = y - block.y - 1;
        break;
      }
    }
    return maxFall;
  };

  const isCollision = (
    x: number,
    y: number,
    width: number,
    blocks: Block[],
    blockId: number,
  ) => {
    return blocks.some(
      (block) =>
        block.id !== blockId &&
        block.y === y &&
        x < block.x + block.width &&
        x + width > block.x,
    );
  };

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(block, prevBlocks);
        if (fallDistance > 0) {
          return { ...block, y: block.y + 1 };
        }
        return block;
      });

      const blocksChanged = !prevBlocks.every((block, index) => {
        const newBlock = newBlocks.find((b) => b.id === block.id);
        return newBlock && block.x === newBlock.x && block.y === newBlock.y;
      });

      setIsMoving(blocksChanged);

      return newBlocks;
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState === GameState.GRAVITY || gameState === GameState.GRAVITY2) {
        applyGravity();
      }
    }, gravitySpeed);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleGravityState = (gravityState: GameState, newState: GameState) => {
    if (
      gameState === gravityState &&
      !isMoving &&
      transitioningBlocks.length === 0
    ) {
      setGameState(newState);
    }
  };

  useEffect(() => {
    handleGravityState(GameState.GRAVITY, GameState.LINE_CLEAR);
    handleGravityState(GameState.GRAVITY2, GameState.LINE_CLEAR2);
  }, [gameState, isMoving, transitioningBlocks]);

  const handleLineClear = (
    lineClearState: GameState,
    newGravityState: GameState,
    newStateOnComplete: GameState,
  ) => {
    if (gameState === lineClearState) {
      const cleanedBlocks = removeCompleteRows(blocks, gridWidth, gridHeight);
      if (cleanedBlocks.length < blocks.length) {
        setBlocks(cleanedBlocks);
        setIsMoving(true);
        setGameState(newGravityState);
      } else {
        setGameState(newStateOnComplete);
      }
    }
  };

  useEffect(() => {
    handleLineClear(
      GameState.LINE_CLEAR,
      GameState.GRAVITY,
      GameState.ADD_LINE,
    );
    handleLineClear(
      GameState.LINE_CLEAR2,
      GameState.GRAVITY2,
      GameState.MOVE_TX,
    );
  }, [gameState, blocks]);

  useEffect(() => {
    if (gameState === GameState.ADD_LINE && pendingMove) {
      const { rowIndex, startX, finalX } = pendingMove;
      if (startX !== finalX) {
        const updatedBlocks = concatenateAndShiftBlocks(
          blocks,
          nextLineData,
          gridHeight,
        );
        if (isGridFull(updatedBlocks)) {
          setGameState(GameState.MOVE_TX);
        } else setBlocks(updatedBlocks);
      }
      setIsMoving(true);
      setGameState(GameState.GRAVITY2);
    }
  }, [gameState, blocks, pendingMove]);

  useEffect(() => {
    if (gameState === GameState.MOVE_TX && pendingMove) {
      const { rowIndex, startX, finalX } = pendingMove;
      handleMoveTX(rowIndex, startX, finalX);
      setPendingMove(null);
      setGameState(GameState.WAITING);
    }
  }, [gameState, pendingMove, handleMoveTX]);

  return (
    <div className={`grid-background ${isTxProcessing ? "cursor-wait" : ""}`}>
      <div
        className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)]`}
        style={{
          height: `${gridHeight * gridSize + borderSize}px`,
          width: `${gridWidth * gridSize + borderSize}px`,
          backgroundImage:
            "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {blocks.map((block) => (
          <BlockContainer
            key={block.id}
            block={block}
            gridSize={gridSize}
            isTxProcessing={isTxProcessing}
            transitionDuration={transitionDuration}
            state={gameState}
            handleMouseDown={handleMouseDown}
            handleTouchStart={handleTouchStart}
            onTransitionBlockStart={() => handleTransitionBlockStart(block.id)}
            onTransitionBlockEnd={() => handleTransitionBlockEnd(block.id)}
            selectBlock={selectBlock}
          />
        ))}
      </div>
    </div>
  );
};

export default Grid;
