import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import "../../../grid.css";
import { Account } from "starknet";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  concatenateAndShiftBlocks,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksSameRow,
  removeBlockId,
  getBlocksSameRow,
  getBlocksSameWidth,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";
import BlockContainer from "./TutorialBlock";
import ConfettiExplosion, { ConfettiExplosionRef } from "../ConfettiExplosion";

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

const TutorialGrid: React.FC<GridProps> = forwardRef(
  (
    {
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
    },
    ref,
  ) => {
    const gravitySpeed = 100;

    const [blocks, setBlocks] = useState<Block[]>(initialData);
    const [isMoving, setIsMoving] = useState(true);
    const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
    const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>(
      [],
    );
    const [lineExplodedCount, setLineExplodedCount] = useState(0);
    const [shouldBounce, setShouldBounce] = useState(false);
    const [animateText, setAnimateText] = useState<ComboMessages>(
      ComboMessages.None,
    );
    const explosionRef = useRef<ConfettiExplosionRef>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const [gridPosition, setGridPosition] = useState<DOMRect | null>(null);
    const [dragging, setDragging] = useState<Block | null>(null);
    const [dragStartX, setDragStartX] = useState(0);
    const [initialX, setInitialX] = useState(0);
    const [pendingMove, setPendingMove] = useState<{
      block: Block;
      rowIndex: number;
      startX: number;
      finalX: number;
    } | null>(null);
    const [blockBonus, setBlockBonus] = useState<Block | null>(null);

    useEffect(() => {
      if (gridRef.current) {
        const position = gridRef.current.getBoundingClientRect();
        setGridPosition(position);
      }
    }, []);

    const handleTransitionBlockStart = (id: number) => {
      setTransitioningBlocks((prev) => [...prev, id]);
    };

    const handleTransitionBlockEnd = (id: number) => {
      setTransitioningBlocks((prev) =>
        prev.filter((blockId) => blockId !== id),
      );
    };

    useEffect(() => {
      if (initialData.length === 0) return;
      setBlocks(initialData);
    }, [initialData]);

    const calculateFallDistance = useCallback(
      (block: Block, blocks: Block[]) => {
        let maxFall = gridHeight - block.y - 1;
        for (let y = block.y + 1; y < gridHeight; y++) {
          if (isCollision(block.x, y, block.width, blocks, block.id)) {
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

    const applyGravity = useCallback(() => {
      setBlocks((prevBlocks) => {
        const newBlocks = prevBlocks.map((block) => {
          const fallDistance = calculateFallDistance(block, prevBlocks);
          if (fallDistance > 0) {
            return { ...block, y: block.y + 1 };
          }
          return block;
        });

        const blocksChanged = !prevBlocks.every((block) => {
          const newBlock = newBlocks.find((b) => b.id === block.id);
          return newBlock && block.x === newBlock.x && block.y === newBlock.y;
        });

        setIsMoving(blocksChanged);

        return newBlocks;
      });
    }, [calculateFallDistance]);

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    const handleDragStart = (x: number, block: Block) => {
      console.log("Drag start:", block);
      setDragging(block);
      setDragStartX(x);
      setInitialX(block.x);
      setGameState(GameState.DRAGGING);
    };

    const handleDragMove = (x: number, moveType: MoveType) => {
      if (!dragging) return;

      const deltaX = x - dragStartX;
      const newX = initialX + deltaX / gridSize;
      const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

      console.log("Drag move:", { deltaX, newX, boundedX });

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
        if (boundedX <= 0 || boundedX >= gridWidth - dragging.width) {
          if (moveType === MoveType.TOUCH) {
            endDrag();
            return;
          } else {
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

    const endDrag = useCallback(() => {
      if (!dragging) return;

      console.log("endDrag called", {
        dragging,
        initialX,
        currentX: dragging.x,
      });

      setBlocks((prevBlocks) => {
        const updatedBlocks = prevBlocks.map((b) => {
          if (b.id === dragging.id) {
            const finalX = Math.round(b.x);
            console.log("Finalizing drag position", { finalX, initialX });

            if (Math.trunc(finalX) !== Math.trunc(initialX)) {
              setPendingMove({
                block: b,
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

    const handleBonusApplication = (block: Block) => {
      setBlockBonus(block);
      if (bonus === BonusType.Wave) {
        setBlocks(removeBlocksSameRow(block, blocks));
        getBlocksSameRow(block.y, blocks).forEach((b) => {
          if (gridPosition === null) return;
          handleTriggerLocalExplosion(
            gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
            gridPosition.top + b.y * gridSize,
          );
        });
        if (tutorialStep === 3) {
          applyGravity();
          setIsMoving(true);
          setGameState(GameState.GRAVITY_BONUS);
          setTimeout(() => onUpdate(true), 1000);
          return;
        }
      } else if (bonus === BonusType.Totem) {
        setBlocks(removeBlocksSameWidth(block, blocks));
        getBlocksSameWidth(block, blocks).forEach((b) => {
          if (gridPosition === null) return;
          handleTriggerLocalExplosion(
            gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
            gridPosition.top + b.y * gridSize,
          );
        });
        if (tutorialStep === 4) {
          applyGravity();
          setIsMoving(true);
          setGameState(GameState.GRAVITY_BONUS);
          setTimeout(() => onUpdate(true), 1000);
          return;
        }
      } else if (bonus === BonusType.Hammer) {
        setBlocks(removeBlockId(block, blocks));
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
          gridPosition.top + block.y * gridSize,
        );
        if (tutorialStep === 2) {
          setTimeout(() => onUpdate(true), 1000);
          return;
        }
      }
    };

    const handleMouseDown = (e: React.MouseEvent, block: Block) => {
      e.preventDefault();
      e.stopPropagation();

      if (bonus !== BonusType.None) {
        handleBonusApplication(block);
        return;
      }
      handleDragStart(e.clientX, block);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      e.preventDefault();
      if (dragging) {
        handleDragMove(e.clientX, MoveType.MOUSE);
      }
    };

    const handleTouchStart = (e: React.TouchEvent, block: Block) => {
      e.preventDefault();
      e.stopPropagation();

      if (bonus !== BonusType.None) {
        handleBonusApplication(block);
        return;
      }
      const touch = e.touches[0];
      handleDragStart(touch.clientX, block);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault();
      if (dragging) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, MoveType.TOUCH);
      }
    };

    const handleTouchEnd = useCallback(
      (e: React.TouchEvent) => {
        e.preventDefault();
        endDrag();
      },
      [endDrag],
    );

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
        return rowBlocks.some(
          (block) => block.x >= initialX + width && block.x < newX + width,
        );
      } else {
        return rowBlocks.some(
          (block) => block.x + block.width > newX && block.x <= initialX,
        );
      }
    };

    const isHighlighted = (block: Block) => {
      if (!tutorialTargetBlock) return false;
      if (intermission) return false;
      if (tutorialTargetBlock.type === "row") {
        return block.y === tutorialTargetBlock.y;
      } else {
        return (
          block.x === tutorialTargetBlock.x && block.y === tutorialTargetBlock.y
        );
      }
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
        setLineExplodedCount(lineExplodedCount + completeRows.length);

        completeRows.forEach((rowIndex) => {
          const blocksSameRow = blocks.filter((block) => block.y === rowIndex);
          const gridRect = gridRef.current?.getBoundingClientRect();

          if (gridRect) {
            blocksSameRow.forEach((block) => {
              const explosionX =
                gridRect.left +
                block.x * gridSize +
                (block.width * gridSize) / 2;
              const explosionY =
                gridRect.top + block.y * gridSize + gridSize / 2;

              handleTriggerLocalExplosion(explosionX, explosionY);
            });
          }
        });

        setBlocks(updatedBlocks);
        setIsMoving(true);
        setGameState(newGravityState);
        if (tutorialStep === 1) {
          setTimeout(() => onUpdate(true), 1000);
        }
      } else {
        setGameState(newStateOnComplete);
      }
    };

    useEffect(() => {
      if (gameState === GameState.LINE_CLEAR) {
        handleLineClear(GameState.GRAVITY, GameState.WAITING);
      } else if (gameState === GameState.LINE_CLEAR2) {
        handleLineClear(GameState.GRAVITY2, GameState.WAITING);
      }
    }, [gameState, blocks]);

    useEffect(() => {
      if (lineExplodedCount > 0) {
        setShouldBounce(true);
        setTimeout(() => setShouldBounce(false), 500);
      }
    }, [lineExplodedCount]);

    useEffect(() => {
      if (
        (gameState === GameState.GRAVITY || gameState === GameState.GRAVITY2) &&
        !isMoving &&
        transitioningBlocks.length === 0
      ) {
        console.log("Transitioning from GRAVITY to LINE_CLEAR", {
          gameState,
          isMoving,
          transitioningBlocks,
        });
        setGameState(GameState.LINE_CLEAR);
      }
    }, [gameState, isMoving, transitioningBlocks]);

    useEffect(() => {
      if (
        gameState === GameState.GRAVITY_BONUS &&
        !isMoving &&
        transitioningBlocks.length === 0
      ) {
        setGameState(GameState.LINE_CLEAR);
      }
    }, [gameState, isMoving, transitioningBlocks]);

    useEffect(() => {
      if (gameState === GameState.BONUS_TX) {
        selectBlock(blockBonus as Block);
        setBlockBonus(null);
        setGameState(GameState.WAITING);
      }
    }, [gameState, blockBonus, selectBlock]);

    return (
      <>
        <ConfettiExplosion
          ref={explosionRef}
          colorSet={["#47D1D9", "#8BA3BC", "#1974D1", "#44A4D9", "#01040B"]}
          particleCount={20}
          particleSize={6}
          duration={2000}
          force={0.3}
        />
        <motion.div
          animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div
            className="grid-background"
            ref={gridRef}
            style={{ position: "relative" }}
          >
            <div
              className="relative"
              style={{
                height: `${gridHeight * gridSize + 2}px`,
                width: `${gridWidth * gridSize + 2}px`,
                backgroundImage:
                  "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
                backgroundSize: `${gridSize}px ${gridSize}px`,
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
                    handleTransitionBlockStart(block.id)
                  }
                  onTransitionBlockEnd={() =>
                    handleTransitionBlockEnd(block.id)
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
  },
);

export default TutorialGrid;
