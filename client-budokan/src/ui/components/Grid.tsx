import { useCallback, useEffect, useRef, useState } from "react";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import BlockContainer from "./Block";
import { GameState } from "@/enums/gameEnums";
import type { Block } from "@/types/types";
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
import { motion } from "motion/react";
import { BonusType } from "@/dojo/game/types/bonus";
import ConfettiExplosion from "./ConfettiExplosion";
import type { ConfettiExplosionRef } from "./ConfettiExplosion";
import { useMusicPlayer } from "@/contexts/hooks";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";
import useGridAnimations from "@/hooks/useGridAnimations";
import { useMoveStore } from "@/stores/moveTxStore";
import { calculateFallDistance } from "@/utils/gridPhysics";
import useTransitionBlocks from "@/hooks/useTransitionBlocks";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

interface GridProps {
  gameId: number;
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
  score: number;
  combo: number;
  maxCombo: number;
  setOptimisticScore: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticCombo: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticMaxCombo: React.Dispatch<React.SetStateAction<number>>;
  freezeGrid?: boolean;
}

const Grid: React.FC<GridProps> = ({
  gameId,
  initialData,
  nextLineData,
  setNextLineHasBeenConsumed,
  gridHeight,
  gridWidth,
  gridSize,
  selectBlock,
  bonus,
  account,
  score,
  combo,
  maxCombo,
  setOptimisticScore,
  setOptimisticCombo,
  setOptimisticMaxCombo,
  isTxProcessing,
  setIsTxProcessing,
  freezeGrid = false,
}) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  // ==================== Refs ====================

  // Grid Position will be used to trigger particle in the right spot
  const gridRef = useRef<HTMLDivElement | null>(null);
  const explosionRef = useRef<ConfettiExplosionRef>(null);
  // Ref to prevent multiple move tx
  const isProcessingRef = useRef(false);

  // ==================== State ====================

  const [gridPosition, setGridPosition] = useState<DOMRect | null>(null);
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
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isPlayerInDanger, setIsPlayerInDanger] = useState(false);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [blockBonus, setBlockBonus] = useState<Block | null>(null);
  const [explodingRows, setExplodingRows] = useState<Set<number>>(new Set());
  const { playExplode, playSwipe } = useMusicPlayer();
  const { themeTemplate } = useTheme();
  const themeColors = getThemeColors(themeTemplate as ThemeId);

  // ==================== Custom Hooks ====================

  const isMoveComplete = useMoveStore((state) => state.isMoveComplete);
  const { shouldBounce, animateText, resetAnimateText, setAnimateText, animatedPoints, setAnimatedPoints, animatedCubes, setAnimatedCubes } =
    useGridAnimations(lineExplodedCount);
  const {
    transitioningBlocks,
    handleTransitionBlockStart,
    handleTransitionBlockEnd,
  } = useTransitionBlocks();

  // ==================== Constants ====================
  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ? 400 : 300;

  // =================== Grid set up ===================
  useEffect(() => {
    if (applyData) {
      if (freezeGrid) return;

      if (deepCompareBlocks(saveGridStateblocks, initialData)) {
        return;
      }

      setOptimisticScore(score);
      setOptimisticCombo(combo);
      setOptimisticMaxCombo(maxCombo);

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
  }, [applyData, initialData, isMoveComplete, freezeGrid]);

  // Keep grid position in store used for particles positionning
  useEffect(() => {
    if (gridRef.current) {
      const gridPosition = gridRef.current.getBoundingClientRect();
      // Pass the grid position to the parent via the callback
      setGridPosition(gridPosition);
    }
  }, []);

  const handleTriggerLocalExplosion = (x: number, y: number) => {
    if (explosionRef.current) {
      explosionRef.current.triggerLocalExplosion({ x, y });
    }
  };

  // =================== DRAG & DROP ===================

  const handleDragStart = (x: number, block: Block) => {
    setDragging(block);
    setDragStartX(x);
    setInitialX(block.x);
    setGameState(GameState.DRAGGING);
  };

  const handleDragMove = (x: number, _moveType: MoveType) => {
    if (!dragging) return;
    if (isTxProcessing || applyData) return;

    const deltaX = x - dragStartX;
    const newX = initialX + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    // Re-anchor drag origin when clamped at boundary to keep cursor synced with block
    if (boundedX !== newX) {
      setDragStartX(x - (boundedX - initialX) * gridSize);
    }

    if (
      !isBlocked(
        initialX,
        boundedX,
        dragging.y,
        dragging.width,
        blocks,
        dragging.id
      )
    ) {
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b
        )
      );
    }
  };

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    e.preventDefault();
    if (isProcessingRef.current || isTxProcessing || applyData) return;

    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (isTxProcessing || applyData) return;

    setBlockBonus(block);
    if (bonus === BonusType.Harvest) {
      setBlocks(removeBlocksSameRow(block, blocks));
      getBlocksSameRow(block.y, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize
        );
      });
    } else if (bonus === BonusType.Score) {
      setBlocks(removeBlocksSameWidth(block, blocks));
      getBlocksSameWidth(block, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize
        );
      });
    } else if (bonus === BonusType.Combo) {
      setBlocks(removeBlockId(block, blocks));
      if (gridPosition === null) return;
      handleTriggerLocalExplosion(
        gridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
        gridPosition.top + block.y * gridSize
      );
    } else if (bonus === BonusType.Wave) {
      if (gridPosition === null) return;
      handleTriggerLocalExplosion(
        gridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
        gridPosition.top + block.y * gridSize
      );
    } else if (bonus === BonusType.Supply) {
      getBlocksSameRow(block.y, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize
        );
      });
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
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientX, MoveType.TOUCH);
  };

  const endDrag = () => {
    if (!dragging) return;

    const shouldSubmitMove = !isProcessingRef.current && !isTxProcessing && !applyData;

    setBlocks((prevBlocks) => {
      const updatedBlocks = prevBlocks.map((b) => {
        if (b.id === dragging.id) {
          const finalX = Math.round(b.x);
          if (shouldSubmitMove && Math.trunc(finalX) !== Math.trunc(initialX)) {
            setcurrentMove({
              rowIndex: b.y,
              startX: initialX,
              finalX,
            });
          }
          return { ...b, x: shouldSubmitMove ? finalX : initialX };
        }
        return b;
      });
      return updatedBlocks;
    });

    setDragging(null);
    if (shouldSubmitMove) {
      setIsMoving(true);
      setGameState(GameState.GRAVITY);
    } else {
      setGameState(GameState.WAITING);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      endDrag();
    };
    const handleTouchEnd = () => {
      endDrag();
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
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
        await move({
          account: account as Account,
          game_id: gameId,
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
    [account, isMoving, gridHeight, move]
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
    blockId: number
  ) => {
    const rowBlocks = blocks.filter(
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
  };

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(
          block,
          prevBlocks,
          gridHeight
        );
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
  };

  const explosionAnimDuration = 250;

  const clearCompleteLine = (
    newGravityState: GameState,
    newStateOnComplete: GameState
  ) => {
    const { updatedBlocks, completeRows } = removeCompleteRows(
      blocks,
      gridWidth,
      gridHeight
    );

    if (updatedBlocks.length < blocks.length) {
      playExplode();
      setLineExplodedCount(lineExplodedCount + completeRows.length);

      if (gridPosition === null) return;

      setExplodingRows(new Set(completeRows));

      completeRows.forEach((rowIndex) => {
        const blocksSameRow = getBlocksSameRow(rowIndex, blocks);
        blocksSameRow.forEach((block) => {
          handleTriggerLocalExplosion(
            gridPosition.left +
              block.x * gridSize +
              (block.width * gridSize) / 2,
            gridPosition.top + block.y * gridSize
          );
        });
      });

      setTimeout(() => {
        setExplodingRows(new Set());
        setBlocks(updatedBlocks);
        setIsMoving(true);
        setGameState(newGravityState);
      }, explosionAnimDuration);
    } else {
      setGameState(newStateOnComplete);
    }
  };

  // STATE MACHINE : GAME LOGIC
  // Gravity -> Line Clear -> Add Line -> Gravity2 -> Update After Move -> Waiting
  //
  useEffect(() => {
    // Interval ref to clear gravity interval
    const intervalRef = { current: null as NodeJS.Timeout | null };
    // Apply gravity with interval
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
          // Play gravity game loop
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
              gridHeight
            );
            setNextLineHasBeenConsumed(true);
            if (isGridFull(updatedBlocks)) {
              setGameState(GameState.UPDATE_AFTER_MOVE);
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
        clearCompleteLine(GameState.GRAVITY2, GameState.UPDATE_AFTER_MOVE);
        break;

      case GameState.LINE_CLEAR_BONUS:
        clearCompleteLine(
          GameState.GRAVITY_BONUS,
          GameState.UPDATE_AFTER_BONUS
        );
        break;

      case GameState.UPDATE_AFTER_BONUS:
      case GameState.UPDATE_AFTER_MOVE:
        {
          // Update the score and combo
          const currentCombo = lineExplodedCount > 1 ? lineExplodedCount : 0;
          const pointsEarned =
            (lineExplodedCount * (lineExplodedCount + 1)) / 2;

          setOptimisticScore((prevPoints) => prevPoints + pointsEarned);
          setOptimisticCombo((prevCombo) => prevCombo + currentCombo);
          setOptimisticMaxCombo((prevMaxCombo) =>
            currentCombo > prevMaxCombo ? currentCombo : prevMaxCombo
          );

          // If we have a combo, we display a message with points and cubes
          if (lineExplodedCount > 1) {
            setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
            setAnimatedPoints(pointsEarned);
            // Cube bonuses: 4 lines = +1, 5 lines = +2, 6+ lines = +3
            const cubesFromCombo = lineExplodedCount >= 6 ? 3 : lineExplodedCount >= 5 ? 2 : lineExplodedCount >= 4 ? 1 : 0;
            setAnimatedCubes(cubesFromCombo);
          }

          // All animations and computing are done
          // we can apply data that we received from smart contract
          setApplyData(true);

          // Reset states
          if (gameState === GameState.UPDATE_AFTER_BONUS) {
            selectBlock(blockBonus as Block);
            setBlockBonus(null);
            setGameState(GameState.WAITING);
          } else if (gameState === GameState.UPDATE_AFTER_MOVE) {
            setcurrentMove(null);
            setGameState(GameState.WAITING);
          }
        }
        break;

      default:
        break;
    }

    // Clear interval on unmount
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
        colorSet={themeColors.particles.explosion}
      />
      <motion.div
        animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <div
          className={`grid-background ${
            isTxProcessing ? " cursor-wait animated-border" : "static-border"
          }`}
          id="grid"
          ref={gridRef}
        >
          <div
            className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)] ${
              isPlayerInDanger ? " animated-box-player-danger" : ""
            }`}
            style={{
              height: `${gridHeight * gridSize + borderSize}px`,
              width: `${gridWidth * gridSize + borderSize}px`,
              backgroundImage:
                `linear-gradient(var(--theme-grid-lines, #1E293B) 2px, transparent 2px), linear-gradient(to right, var(--theme-grid-lines, #1E293B) 2px, transparent 2px)`,
              backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
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
                isExploding={explodingRows.has(block.y)}
                handleMouseDown={handleMouseDown}
                handleTouchStart={handleTouchStart}
                onTransitionBlockStart={() =>
                  handleTransitionBlockStart(block.id)
                }
                onTransitionBlockEnd={() => handleTransitionBlockEnd(block.id)}
              />
            ))}
            <div className="flex items-center justify-center font-sans z-20 pointer-events-none">
              <AnimatedText textEnum={animateText} pointsEarned={animatedPoints} cubesEarned={animatedCubes} reset={resetAnimateText} />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Grid;
