import { useCallback, useEffect, useRef, useState } from "react";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import BlockContainer from "./Block";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";
import {
  removeCompleteRows,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksSameRow,
  removeBlockId,
  deepCompareBlocks,
  getBlocksSameRow,
  getBlocksSameWidth,
  concatenateNewLineWithGridAndShiftGrid,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "framer-motion";
import { BonusType } from "@/dojo/game/types/bonus";
import ConfettiExplosion, { ConfettiExplosionRef } from "./ConfettiExplosion";
import { useMusicPlayer } from "@/contexts/hooks";

import "../../grid.css";
import { useMoveStore } from "@/stores/moveTxStore";
import { calculateFallDistance } from "@/utils/gridPhysics";
import { consoleTSLog } from "@/utils/logger";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

interface GridProps {
  initialData: Block[];
  nextLineData: Block[];
  setNextLineHasBeenConsumed: React.Dispatch<React.SetStateAction<boolean>>;
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  selectBlock: (block: Block) => void;
  bonus: BonusType;
  account: Account | null;
  isTxProcessing: boolean;
  setIsTxProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setOptimisticScore: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticCombo: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticMaxCombo: React.Dispatch<React.SetStateAction<number>>;
}

const Grid: React.FC<GridProps> = ({
  initialData,
  nextLineData,
  setNextLineHasBeenConsumed,
  gridHeight,
  gridWidth,
  gridSize,
  selectBlock,
  bonus,
  account,
  setOptimisticScore,
  setOptimisticCombo,
  setOptimisticMaxCombo,
  isTxProcessing,
  setIsTxProcessing,
}) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  // Grid Position will be used to trigger particle in the right spot
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridPosition, setGridPosition] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (gridRef.current) {
      const gridPosition = gridRef.current.getBoundingClientRect();
      // Pass the grid position to the parent via the callback
      setGridPosition(gridPosition);
    }
  }, []);

  // Ref to prevent multiple move tx
  const isProcessingRef = useRef(false);

  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [nextLine, setNextLine] = useState<Block[]>(nextLineData);
  const [saveGridStateblocks, setSaveGridStateblocks] =
    useState<Block[]>(initialData);
  const [applyData, setApplyData] = useState(false);
  const [dragging, setDragging] = useState<Block | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialX, setInitialX] = useState(0);
  const [isMoving, setIsMoving] = useState(true);
  const [currentMove, setcurrentMove] = useState<{
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isPlayerInDanger, setIsPlayerInDanger] = useState(false);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [blockBonus, setBlockBonus] = useState<Block | null>(null);
  const [animateText, setAnimateText] = useState<ComboMessages>(
    ComboMessages.None,
  );
  const [shouldBounce, setShouldBounce] = useState(false);
  const { playExplode, playSwipe } = useMusicPlayer();
  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ? 400 : 300;
  const isMoveComplete = useMoveStore((state) => state.isMoveComplete);

  // INIT useEffect set or reset grid when grid is ready :
  useEffect(() => {
    if (applyData) {
      if (deepCompareBlocks(saveGridStateblocks, initialData)) {
        // Prevent render if the grid is the same
        return;
      }
      if (isMoveComplete) {
        setSaveGridStateblocks(initialData);
        setBlocks(initialData);
        setNextLine(nextLineData);

        const inDanger = initialData.some((block) => block.y < 2);
        setIsPlayerInDanger(inDanger);

        setLineExplodedCount(0);
        setNextLineHasBeenConsumed(false);

        setApplyData(false);
        setIsTxProcessing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyData, initialData, isMoveComplete]);

  // =================== ANIMATIONS ===================

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

  const explosionRef = useRef<ConfettiExplosionRef>(null);

  const handleTriggerLocalExplosion = (x: number, y: number) => {
    if (explosionRef.current) {
      explosionRef.current.triggerLocalExplosion({ x, y });
    }
  };

  // =================== DRAG AND DROP ===================

  const handleDragStart = (x: number, block: Block) => {
    setDragging(block);
    setDragStartX(x);
    setInitialX(block.x);
    setGameState(GameState.DRAGGING);
  };

  const handleDragMove = (x: number, moveType: MoveType) => {
    if (!dragging) return;
    if (isTxProcessing || applyData) return;

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

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    if (isProcessingRef.current || isTxProcessing || applyData) return;

    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (isTxProcessing || applyData) return;

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
    } else if (bonus === BonusType.Totem) {
      setBlocks(removeBlocksSameWidth(block, blocks));
      getBlocksSameWidth(block, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize,
        );
      });
    } else if (bonus === BonusType.Hammer) {
      setBlocks(removeBlockId(block, blocks));
      if (gridPosition === null) return;
      handleTriggerLocalExplosion(
        gridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
        gridPosition.top + block.y * gridSize,
      );
    }

    // if we have a bonus, we go in state gravity_bonus
    if (bonus !== BonusType.None) {
      setIsTxProcessing(true);
      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
      return;
    }
    handleDragStart(e.clientX, block);
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
    if (isProcessingRef.current || isTxProcessing || applyData) return;

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x);
          if (Math.trunc(finalX) !== Math.trunc(initialX)) {
            setcurrentMove({
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
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    endDrag();
  };

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      endDrag();
    };
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  // =================== MOVE TX ===================

  const sendMoveTX = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (isProcessingRef.current) {
        console.warn("Already processing a move");
        return;
      }
      if (startColIndex === finalColIndex) return;
      if (!account) return;

      isProcessingRef.current = true;
      setIsTxProcessing(true);
      playSwipe();
      try {
        console.log(
          "Move TX (row, start col, end col)",
          gridHeight - 1 - rowIndex,
          startColIndex,
          finalColIndex,
        );
        await move({
          account: account as Account,
          row_index: gridHeight - 1 - rowIndex,
          start_index: Math.trunc(startColIndex),
          final_index: Math.trunc(finalColIndex),
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de la transaction", error);
        isProcessingRef.current = false; // Reset the ref
      } finally {
        isProcessingRef.current = false; // Reset the ref
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account, isMoving, gridHeight, move],
  );

  // Send the move transaction when the currentMove state is updated
  // Keep it in useEffect to avoid multiple trigger
  useEffect(() => {
    if (currentMove) {
      const { rowIndex, startX, finalX } = currentMove;
      sendMoveTX(rowIndex, startX, finalX);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMove]);

  // =================== GAME LOGIC ===================

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

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(
          block,
          prevBlocks,
          gridHeight,
        );
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
  };

  const clearCompleteLine = (
    newGravityState: GameState,
    newStateOnComplete: GameState,
  ) => {
    const { updatedBlocks, completeRows } = removeCompleteRows(
      blocks,
      gridWidth,
      gridHeight,
    );

    if (updatedBlocks.length < blocks.length) {
      playExplode();
      setLineExplodedCount(lineExplodedCount + completeRows.length);

      // Calculate absolute position in the viewport
      if (gridPosition === null) return;

      // Trigger particle explosions for each cleared row
      completeRows.forEach((rowIndex) => {
        const blocksSameRow = getBlocksSameRow(rowIndex, blocks);

        blocksSameRow.forEach((block) => {
          handleTriggerLocalExplosion(
            gridPosition.left +
              block.x * gridSize +
              (block.width * gridSize) / 2,
            gridPosition.top + block.y * gridSize,
          );
        });
      });

      setBlocks(updatedBlocks);
      setIsMoving(true);
      setGameState(newGravityState);
    } else {
      setGameState(newStateOnComplete);
    }
  };

  // STATE MACHINE : GAME LOGIC
  useEffect(() => {
    const intervalRef = { current: null as NodeJS.Timeout | null };

    const applyGravityWithInterval = () => {
      intervalRef.current = setInterval(() => {
        applyGravity();
      }, gravitySpeed);
    };

    switch (gameState) {
      case GameState.GRAVITY:
      case GameState.GRAVITY2:
      case GameState.GRAVITY_BONUS:
        if (!isMoving && transitioningBlocks.length === 0) {
          switch (gameState) {
            case GameState.GRAVITY:
              setGameState(GameState.LINE_CLEAR);
              break;
            case GameState.GRAVITY2:
              setGameState(GameState.LINE_CLEAR2);
              break;
            case GameState.GRAVITY_BONUS:
              setGameState(GameState.LINE_CLEAR_BONUS);
              break;
          }
        } else {
          applyGravityWithInterval();
        }
        break;

      case GameState.ADD_LINE:
        if (currentMove && transitioningBlocks.length === 0) {
          const { startX, finalX } = currentMove;
          if (startX !== finalX) {
            const updatedBlocks = concatenateNewLineWithGridAndShiftGrid(
              blocks,
              nextLine,
              gridHeight,
            );
            setNextLineHasBeenConsumed(true);
            if (isGridFull(updatedBlocks)) {
              setGameState(GameState.MOVE_TX);
            } else {
              setBlocks(updatedBlocks);
            }
          }
          setIsMoving(true);
          setGameState(GameState.GRAVITY2);
        }
        break;

      case GameState.LINE_CLEAR:
        clearCompleteLine(GameState.GRAVITY, GameState.ADD_LINE);
        break;

      case GameState.LINE_CLEAR2:
        clearCompleteLine(GameState.GRAVITY2, GameState.MOVE_TX);
        break;

      case GameState.LINE_CLEAR_BONUS:
        clearCompleteLine(GameState.GRAVITY_BONUS, GameState.BONUS_TX);
        break;

      case GameState.BONUS_TX:
      case GameState.MOVE_TX:
        {
          const currentCombo = lineExplodedCount > 1 ? lineExplodedCount : 0;
          const pointsEarned =
            (lineExplodedCount * (lineExplodedCount + 1)) / 2;

          setOptimisticScore((prevPoints) => prevPoints + pointsEarned);
          setOptimisticCombo((prevCombo) => prevCombo + currentCombo);
          setOptimisticMaxCombo((prevMaxCombo) =>
            currentCombo > prevMaxCombo ? currentCombo : prevMaxCombo,
          );

          if (lineExplodedCount > 1) {
            setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
          }

          setApplyData(true);

          if (gameState === GameState.BONUS_TX) {
            selectBlock(blockBonus as Block);
            setBlockBonus(null);
            setGameState(GameState.WAITING);
          } else if (gameState === GameState.MOVE_TX) {
            setcurrentMove(null);
            setGameState(GameState.WAITING);
          }
        }
        break;

      default:
        break;
    }

    // Nettoyage de l'intervalle
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isMoving, transitioningBlocks]);

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
        <div
          className={`grid-background ${isTxProcessing ? " cursor-wait animated-border" : "static-border"}`}
          id="grid"
          ref={gridRef}
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
                gridHeight={gridHeight}
                isTxProcessing={isTxProcessing}
                transitionDuration={transitionDuration}
                state={gameState}
                handleMouseDown={handleMouseDown}
                handleTouchStart={handleTouchStart}
                onTransitionBlockStart={() =>
                  handleTransitionBlockStart(block.id)
                }
                onTransitionBlockEnd={() => handleTransitionBlockEnd(block.id)}
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

export default Grid;
