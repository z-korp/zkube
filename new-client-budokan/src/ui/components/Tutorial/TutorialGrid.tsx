import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import "../../../grid.css";
import { Account } from "starknet";
import { GameState } from "@/enums/gameEnums";
import type { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocksTutorial,
  isGridFull,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "motion/react";
import BlockContainer from "./TutorialBlock";
import ConfettiExplosion from "../ConfettiExplosion";
import type { ConfettiExplosionRef } from "../ConfettiExplosion";

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (_block: Block) => void;
  onMove?: (rowIndex: number, startIndex: number, finalIndex: number) => void;
  account: Account | null;
  tutorialStep: number;
  tutorialTargetBlock: { x: number; y: number; type: "block" | "row" }[] | null;
  onUpdate: (intermission: boolean) => void;
  intermission?: boolean;
}

const TutorialGrid: React.FC<GridProps> = ({
      initialData,
      nextLineData,
      gridHeight,
      gridWidth,
      gridSize,
      selectBlock: _selectBlock,
      tutorialStep,
      tutorialTargetBlock,
      onUpdate,
    }) => {
    const gravitySpeed = 100;

    const [blocks, setBlocks] = useState<Block[]>(initialData);
    const [isMoving, setIsMoving] = useState(true);
    const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
    const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
    const [lineExplodedCount, setLineExplodedCount] = useState(0);
    const [shouldBounce, setShouldBounce] = useState(false);
    const [animateText, setAnimateText] = useState<ComboMessages>(ComboMessages.None);
    const explosionRef = useRef<ConfettiExplosionRef>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState<Block | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [initialX, setInitialX] = useState(0);
    const [pendingMove, setPendingMove] = useState<{
      rowIndex: number;
      startX: number;
      finalX: number;
    } | null>(null);
    const [actionPerformed, setActionPerformed] = useState(false);

    useEffect(() => {
      if (initialData.length === 0) return;
      setBlocks(initialData);
    }, [initialData]);

    const calculateFallDistance = useCallback(
      (block: Block, currentBlocks: Block[]) => {
        let maxFall = gridHeight - block.y - 1;
        for (let y = block.y + 1; y < gridHeight; y++) {
          if (isCollision(block.x, y, block.width, currentBlocks, block.id)) {
            maxFall = y - block.y - 1;
            break;
          }
        }
        return maxFall;
      },
      [gridHeight],
    );

    const isCollision = (
      x: number,
      y: number,
      width: number,
      currentBlocks: Block[],
      blockId: number,
    ) => {
      return currentBlocks.some(
        (block) =>
          block.id !== blockId &&
          block.y === y &&
          x < block.x + block.width &&
          x + width > block.x,
      );
    };

    const applyGravity = useCallback(() => {
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.map((block) => {
          const fallDistance = calculateFallDistance(block, prevBlocks);
          if (fallDistance > 0) {
            return { ...block, y: block.y + 1 };
          }
          return block;
        });

        const newBlockMap = new Map(newBlocks.map((b) => [b.id, b]));
        const blocksChanged = !prevBlocks.every((block) => {
          const newBlock = newBlockMap.get(block.id);
          return newBlock && block.x === newBlock.x && block.y === newBlock.y;
        });

        setIsMoving(blocksChanged);

        return newBlocks;
      });
    }, [calculateFallDistance]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (gameState === GameState.GRAVITY || gameState === GameState.GRAVITY2) {
          applyGravity();
        }
      }, gravitySpeed);

      return () => clearInterval(interval);
    }, [gameState, applyGravity]);

    const handleDragStart = (x: number, block: Block) => {
      setActionPerformed(true);
      setDragging(block);
      setDragStartX(x);
      setInitialX(block.x);
      setGameState(GameState.DRAGGING);
    };

    const isBlocked = (
      baseX: number,
      newX: number,
      y: number,
      width: number,
      currentBlocks: Block[],
      blockId: number,
    ) => {
      const rowBlocks = currentBlocks.filter(
        (block) => block.y === y && block.id !== blockId,
      );

      if (newX > baseX) {
        return rowBlocks.some(
          (block) => block.x >= baseX + width && block.x < newX + width,
        );
      }

      return rowBlocks.some(
        (block) => block.x + block.width > newX && block.x <= baseX,
      );
    };

    const handleDragMove = (x: number, moveType: MoveType) => {
      if (!dragging) return;

      const deltaX = x - dragStartX;
      const newX = initialX + deltaX / gridSize;
      const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

      if (!isBlocked(initialX, boundedX, dragging.y, dragging.width, blocks, dragging.id)) {
        if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
          if (moveType === MoveType.TOUCH) {
            endDrag();
            return;
          }
          setInitialX(blocks.find((b) => b.id === dragging.id)?.x ?? 0);
        }

        setBlocks((prevBlocks) =>
          prevBlocks.map((b) =>
            b.id === dragging.id ? { ...b, x: boundedX } : b,
          ),
        );
      }
    };

    const endDrag = useCallback(() => {
      if (!dragging) return;

      setBlocks((prevBlocks) => {
        const updatedBlocks = prevBlocks.map((b) => {
          if (b.id === dragging.id) {
            const finalX = Math.round(b.x);
            if (Math.trunc(finalX) !== Math.trunc(initialX)) {
              setPendingMove({
                rowIndex: b.y,
                startX: initialX,
                finalX,
              });
            }
            return { ...b, x: finalX };
          }
          return b;
        });
        return updatedBlocks;
      });

      setDragging(null);
      setIsMoving(true);
      setGameState(GameState.GRAVITY);
    }, [dragging, initialX]);

    useEffect(() => {
      if (!dragging) return;
      const handleMouseUp = () => {
        endDrag();
      };
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, endDrag]);

    const handleMouseDown = (e: React.MouseEvent, block: Block) => {
      e.preventDefault();
      switch (tutorialStep) {
        case 1:
        case 2:
        case 3:
        case 5:
          handleDragStart(e.clientX, block);
          break;
        default:
          handleDragStart(e.clientX, block);
          break;
      }
    };

    const handleTouchStart = (e: React.TouchEvent, block: Block) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      handleDragStart(touch.clientX, block);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      e.preventDefault();
      if (dragging) {
        handleDragMove(e.clientX, MoveType.MOUSE);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (dragging) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, MoveType.TOUCH);
      }
    };

    const handleTouchEnd = useCallback(() => {
      endDrag();
    }, [endDrag]);

    const isHighlighted = (block: Block) => {
      if (!tutorialTargetBlock || actionPerformed) return false;

      return tutorialTargetBlock.some((targetBlock) => {
        if (targetBlock.type === "row") {
          return block.y === targetBlock.y;
        }
        return block.x === targetBlock.x && block.y === targetBlock.y;
      });
    };

    const resetAnimateText = (): void => {
      setAnimateText(ComboMessages.None);
    };

    const handleTriggerLocalExplosion = (x: number, y: number) => {
      if (explosionRef.current) {
        explosionRef.current.triggerLocalExplosion({ x, y });
      }
    };

    const handleLineClear = (
      newGravityState: GameState,
      newStateOnComplete: GameState,
    ) => {
      const { updatedBlocks, completeRows } = removeCompleteRows(
        blocks,
        gridWidth,
        gridHeight,
      );

      if (updatedBlocks.length < blocks.length) {
        const newLineCount = lineExplodedCount + completeRows.length;
        setLineExplodedCount(newLineCount);

        completeRows.forEach((rowIndex) => {
          const blocksSameRow = blocks.filter((block) => block.y === rowIndex);
          const gridRect = gridRef.current?.getBoundingClientRect();

          if (gridRect) {
            blocksSameRow.forEach((block) => {
              const explosionX =
                gridRect.left + block.x * gridSize + (block.width * gridSize) / 2;
              const explosionY = gridRect.top + block.y * gridSize + gridSize / 2;
              handleTriggerLocalExplosion(explosionX, explosionY);
            });
          }
        });

        setBlocks(updatedBlocks);
        setIsMoving(true);
        setGameState(newGravityState);
      } else {
        setGameState(newStateOnComplete);
      }
    };

    useEffect(() => {
      if (gameState === GameState.LINE_CLEAR) {
        handleLineClear(GameState.GRAVITY, GameState.ADD_LINE);
      } else if (gameState === GameState.LINE_CLEAR2) {
        handleLineClear(GameState.GRAVITY2, GameState.UPDATE_AFTER_MOVE);
      }
    }, [gameState, blocks]);

    useEffect(() => {
      if (
        gameState === GameState.ADD_LINE &&
        pendingMove &&
        transitioningBlocks.length === 0
      ) {
        const { startX, finalX } = pendingMove;
        if (startX !== finalX) {
          const updatedBlocks = concatenateAndShiftBlocksTutorial(
            blocks,
            nextLineData,
            gridHeight,
          );

          if (isGridFull(updatedBlocks)) {
            setGameState(GameState.UPDATE_AFTER_MOVE);
          } else {
            setBlocks(updatedBlocks);
          }
        }
        setIsMoving(true);
        setGameState(GameState.GRAVITY2);
      }
    }, [gameState, blocks, pendingMove, transitioningBlocks, nextLineData, gridHeight]);

    useEffect(() => {
      if (lineExplodedCount > 0) {
        setShouldBounce(true);
        setTimeout(() => setShouldBounce(false), 500);
      }
    }, [lineExplodedCount]);

    useEffect(() => {
      const isSuccessState =
        gameState === GameState.UPDATE_AFTER_MOVE ||
        (gameState === GameState.ADD_LINE && lineExplodedCount > 0);

      if (isSuccessState) {
        if (tutorialStep === 1 || tutorialStep === 2 || tutorialStep === 3 || tutorialStep === 5) {
          setTimeout(() => {
            onUpdate(true);
          }, 500);
        }
      }
    }, [gameState, lineExplodedCount, onUpdate, tutorialStep]);

    useEffect(() => {
      if (!isMoving && transitioningBlocks.length === 0) {
        if (gameState === GameState.GRAVITY) {
          setGameState(GameState.LINE_CLEAR);
        } else if (gameState === GameState.GRAVITY2) {
          setGameState(GameState.LINE_CLEAR2);
        }
      }
    }, [gameState, isMoving, transitioningBlocks]);

    useEffect(() => {
      setActionPerformed(false);
    }, [tutorialStep]);

    return (
      <>
        <ConfettiExplosion
          ref={explosionRef}
          colorSet={["#47D1D9", "#8BA3BC", "#1974D1", "#44A4D9", "#01040B"]}
        />
        <motion.div
          animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div className="grid-background" ref={gridRef} style={{ position: "relative" }}>
            <div
              className="relative"
              style={{
                height: `${gridHeight * gridSize + 2}px`,
                width: `${gridWidth * gridSize + 2}px`,
                backgroundImage:
                  `linear-gradient(var(--theme-grid-lines, #1E293B) 2px, transparent 2px), linear-gradient(to right, var(--theme-grid-lines, #1E293B) 2px, transparent 2px)`,
                backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
              }}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {blocks.map((block) => (
                <BlockContainer
                  key={block.id}
                  block={block}
                  gridSize={gridSize}
                  isTxProcessing={false}
                  transitionDuration={200}
                  state={gameState}
                  handleMouseDown={(e) => handleMouseDown(e, block)}
                  handleTouchStart={(e) => handleTouchStart(e, block)}
                  onTransitionBlockStart={() =>
                    setTransitioningBlocks((prev) => [...prev, block.id])
                  }
                  onTransitionBlockEnd={() =>
                    setTransitioningBlocks((prev) =>
                      prev.filter((blockId) => blockId !== block.id),
                    )
                  }
                  isHighlighted={isHighlighted(block)}
                  isClickable={!tutorialStep || isHighlighted(block)}
                />
              ))}
              <div className="flex items-center justify-center font-sans z-20 pointer-events-none">
                <AnimatedText textEnum={animateText} reset={resetAnimateText} />
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
};

export default TutorialGrid;
