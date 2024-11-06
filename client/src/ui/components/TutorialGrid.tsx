import React, { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import "../../grid.css";
import { Account } from "starknet";
import BlockContainer from "./TutorialBlock";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocks,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksSameRow,
  removeBlockId,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (block: Block) => void;
  onMove?: (rowIndex: number, startIndex: number, finalIndex: number) => void;
  bonus: BonusType;
  account: Account | null;
  tutorialStep: number;
  tutorialTargetBlock: { x: number; y: number; type: "block" | "row" } | null;
  onUpdate: (intermission: boolean) => void;
  ref: any;
  intermission?: boolean;
}

const TutorialGrid: React.FC<GridProps> = forwardRef(({
  initialData,
  nextLineData,
  gridHeight,
  gridWidth,
  gridSize,
  selectBlock,
  onMove,
  bonus,
  account,
  tutorialStep,
  tutorialTargetBlock,
  onUpdate,
  intermission,
}, ref) => {
  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [dragging, setDragging] = useState<Block | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [pendingMove, setPendingMove] = useState<{
    block: Block;
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [isPlayerInDanger, setIsPlayerInDanger] = useState(false);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [blockBonus, setBlockBonus] = useState<Block | null>(null);
  const [animateText, setAnimateText] = useState<ComboMessages>(
    ComboMessages.None,
  );
  const [shouldBounce, setShouldBounce] = useState(false);

  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = 200;

  const updateValue = () =>{
    const newvalue = tutorialStep + 1;
    onUpdate(true);
  }

  useEffect(() => {
    setBlocks(initialData);

    const inDanger = initialData.some((block) => block.y < 2);
    setIsPlayerInDanger(inDanger);
    if (lineExplodedCount > 1) {
      setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
    }
    setLineExplodedCount(0);
    setIsTxProcessing(false);
  }, [initialData]);

  const resetAnimateText = (): void => {
    setAnimateText(ComboMessages.None);
  };

  useEffect(() => {
    if (lineExplodedCount > 0) {
      setShouldBounce(true); // Trigger bounce animation
      setTimeout(() => setShouldBounce(false), 500); // Stop bouncing after 0.5s
    }
  }, [lineExplodedCount]);

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

  const handleDragMove = (x: number, moveType: MoveType) => {
    if (!dragging) return;

    const deltaX = x - dragStartX;
    const newX = initialX + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

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
      // Vérifie si le nouveau X est en dehors des limites de la grille
      if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
        if (moveType === MoveType.TOUCH) {
          endDrag(); // Appelle endDrag si le drag sort de la grille sur un touch
          return;
        } else {
          // Si on est en dehors de la grille, cela implique que la nouvelle start position a changer et on doit la mettre à jour
          setInitialX(blocks.find((b) => b.id === dragging.id)?.x ?? 0);
        }
      }
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b,
        ),
      );
    }
  };

  const handleDragStart = (x: number, block: Block) => {
    // if (isTxProcessing) return;
    setDragging(block);
    setDragStartX(x);
    setInitialX(block.x);
    setGameState(GameState.DRAGGING);
  };

const useBonus = (block: Block) => {
  if (bonus === BonusType.Wave) {
    setBlocks(removeBlocksSameRow(block, blocks));
  } else if (bonus === BonusType.Totem) {
    setBlocks(removeBlocksSameWidth(block, blocks));
  } else if (bonus === BonusType.Hammer) {
    setBlocks(removeBlockId(block, blocks));
  }

  // Return success if a bonus was applied
  return bonus !== BonusType.None;
};

useImperativeHandle(ref, () => ({
  useBonus,
}));

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();

    setBlockBonus(block);
    // if (bonus === BonusType.Wave) {
    //   setBlocks(removeBlocksSameRow(block, blocks));
    // }
    // if (bonus === BonusType.Totem) {
    //   setBlocks(removeBlocksSameWidth(block, blocks));
    // }
    // if (bonus === BonusType.Hammer) {
    //   setBlocks(removeBlockId(block, blocks));
    // }
    if (bonus !== BonusType.None) {
    //   setIsTxProcessing(false);
      useBonus(block);
      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
      return;
    }
    handleDragStart(e.clientX, block);
  };

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, MoveType.MOUSE);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, MoveType.TOUCH);
  };

  const endDrag = () => {
    if (!dragging) return;

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x);
          // if (Math.trunc(finalX) !== Math.trunc(initialX))
            // setIsTxProcessing(true);
          setPendingMove({
            block: b,
            rowIndex: b.y,
            startX: initialX,
            finalX,
          });
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

  const handleTouchEnd = () => {
    endDrag();
  };

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      endDrag(); // Appeler directement endDrag() ici.
    };

    // Ajoute l'écouteur d'événements pour le document une seule fois.
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      // Nettoie l'écouteur d'événements lorsque le composant est démonté.
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  const move = async ({ row_index, start_index, final_index }: any) => {
    try {
      onMove?.(row_index, start_index, final_index);

      if (tutorialStep === 1 && start_index === 2){
        updateValue();
        console.log('tutorialstep', tutorialStep);
      }
      if (tutorialStep === 2  && start_index === 6){
        updateValue();
        console.log('tutorialstep', tutorialStep);
      }

      // Update score based on move
      // const moveScore = Math.abs(final_index - start_index) * 10;
      //  setScore(prevScore => prevScore + moveScore);

      // Check if the move results in any complete lines
      const { completeRows } = removeCompleteRows(
        blocks,
        gridWidth,
        gridHeight,
      );
      if (completeRows.length > 0) {
        // Add bonus points for completing lines
        const lineScore = completeRows.length * 100;
        //   setScore(prevScore => prevScore + lineScore);
      }
      setIsMoving(true);

      console.log(
        `Movement effected : Line ${row_index}, of ${start_index} has ${final_index}`,
      );
      return true;
    } catch (error) {
      console.error("Error executing move:", error);
      throw error;
    }
  };

  const handleMoveTX = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (startColIndex === finalColIndex || isMoving) return;
      try {
        const moveSuccess = await move({
          row_index: gridHeight - 1 - rowIndex,
          start_index: Math.trunc(startColIndex),
          final_index: Math.trunc(finalColIndex),
        });

        if (moveSuccess) {
          setBlocks((prevBlocks) =>
            prevBlocks.map((block) =>
              block.y === rowIndex ? { ...block, x: finalColIndex } : block,
            ),
          );

          setIsMoving(false);
        }
        console.log(
          `Movement effected : Line ${rowIndex}, of ${startColIndex} has ${finalColIndex}`,
        );
      } catch (error) {
        console.error("Erreur lors de l'envoi de la transaction", error);
      }
    },
    [move, isMoving, gridHeight],
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
      if (
        gameState === GameState.GRAVITY ||
        gameState === GameState.GRAVITY2 ||
        gameState === GameState.GRAVITY_BONUS
      ) {
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
    handleGravityState(GameState.GRAVITY_BONUS, GameState.LINE_CLEAR_BONUS);
  }, [gameState, isMoving, transitioningBlocks]);

  const handleLineClear = (
    lineClearState: GameState,
    newGravityState: GameState,
    newStateOnComplete: GameState,
  ) => {
    if (gameState === lineClearState) {
      const { updatedBlocks, completeRows } = removeCompleteRows(
        blocks,
        gridWidth,
        gridHeight,
      );
      if (updatedBlocks.length < blocks.length) {
        setLineExplodedCount(lineExplodedCount + completeRows.length);
        setBlocks(updatedBlocks);
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
    handleLineClear(
      GameState.LINE_CLEAR_BONUS,
      GameState.GRAVITY_BONUS,
      GameState.BONUS_TX,
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
    if (gameState === GameState.BONUS_TX) {
      selectBlock(blockBonus as Block);
      setBlockBonus(null);
      setGameState(GameState.WAITING);
    }
    if (gameState === GameState.MOVE_TX) {
      if (pendingMove) {
        const { rowIndex, startX, finalX } = pendingMove;
        handleMoveTX(rowIndex, startX, finalX);
        setPendingMove(null);
        setGameState(GameState.WAITING);
      }
    }
  }, [gameState, pendingMove, handleMoveTX]);

  const isHighlighted = (block: Block) => {
    if (!tutorialTargetBlock) return false;

    if (tutorialTargetBlock.type === "row") {
      // Highlight any block in the target row
      return block.y === tutorialTargetBlock.y;
    } else {
      // Original single block highlighting
      return (
        block.x === tutorialTargetBlock.x && block.y === tutorialTargetBlock.y
      );
    }
};

  return (
    <motion.div
      animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <div
        className={`grid-background ${isTxProcessing ? " cursor-wait" : ""} `}
      >
        <div
          className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)] ${isPlayerInDanger ? " animated-box-player-danger" : ""}`}
          style={{
            height: `${gridHeight * gridSize + borderSize}px`,
            width: `${gridWidth * gridSize + borderSize}px`,
            backgroundImage:
              "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
          onMouseMove={handleMouseMove}
          //onMouseUp={handleMouseUp}
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
              onTransitionBlockStart={() =>
                handleTransitionBlockStart(block.id)
              }
              onTransitionBlockEnd={() => handleTransitionBlockEnd(block.id)}
              isHighlighted={isHighlighted(block)}
              isClickable={
                !tutorialStep ||
                (!!tutorialTargetBlock &&
                  (tutorialTargetBlock.type === "row"
                    ? block.y === tutorialTargetBlock.y
                    : block.x === tutorialTargetBlock.x &&
                      block.y === tutorialTargetBlock.y))
              }
            />
          ))}
          <div className="flex items-center justify-center font-sans">
            <AnimatedText textEnum={animateText} reset={resetAnimateText} />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default TutorialGrid;
