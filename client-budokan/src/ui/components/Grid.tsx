import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import BlockContainer from "./Block";
import { GameState } from "@/enums/gameEnums";
import type { Block } from "@/types/types";
import {
  removeCompleteRows,
  isGridFull,
  removeBlocksSameWidth,
  removeBlocksInRows,
  getBlocksInRows,
  deepCompareBlocks,
  getBlocksSameRow,
  getBlocksSameWidth,
  concatenateNewLineWithGridAndShiftGrid,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "motion/react";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import ConfettiExplosion from "./ConfettiExplosion";
import type { ConfettiExplosionRef } from "./ConfettiExplosion";
import { useMusicPlayer } from "@/contexts/hooks";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, type ThemeId } from "@/config/themes";
import useGridAnimations from "@/hooks/useGridAnimations";
import { useMoveStore } from "@/stores/moveTxStore";
import { calculateFallDistance } from "@/utils/gridPhysics";
import useTransitionBlocks from "@/hooks/useTransitionBlocks";
import { showToast } from "@/utils/toast";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

interface GridProps {
  gameId: bigint;
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
  levelTransitionPending: boolean;
  onCascadeComplete?: () => void;
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
  isTxProcessing,
  setIsTxProcessing,
  levelTransitionPending,
  onCascadeComplete,
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
  const draggingRef = useRef<Block | null>(null);
  const dragStartXRef = useRef(0);
  const initialXRef = useRef(0);
  const draggedXRef = useRef(0);
  const gameStateRef = useRef<GameState>(GameState.WAITING);
  const endDragRef = useRef<() => void>(() => undefined);

  // ==================== State ====================

  const [gridPosition, setGridPosition] = useState<DOMRect | null>(null);
  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [nextLine, setNextLine] = useState<Block[]>(nextLineData);
  const [saveGridStateblocks, setSaveGridStateblocks] =
    useState<Block[]>(initialData);
  const [applyData, setApplyData] = useState(false);
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

  const queue = useMoveStore((state) => state.queue);
  const isQueueProcessing = useMoveStore((state) => state.isQueueProcessing);
  const { shouldBounce, animateText, resetAnimateText, setAnimateText, animatedPoints, setAnimatedPoints, animatedCubes, setAnimatedCubes } =
    useGridAnimations(lineExplodedCount);
  const {
    transitioningBlocks,
    handleTransitionBlockStart,
    handleTransitionBlockEnd,
  } = useTransitionBlocks();

  const queueForGame = useMemo(
    () => queue.filter((item) => item.gameId === gameId),
    [queue, gameId],
  );
  const nextQueuedMove = useMemo(
    () => queueForGame.find((item) => item.status === "queued"),
    [queueForGame],
  );

  // ==================== Constants ====================
  const borderSize = 2;
  const gravitySpeed = 100;
  const transitionDuration = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ? 400 : 300;

  const resetDragRefs = useCallback(() => {
    draggingRef.current = null;
    dragStartXRef.current = 0;
    initialXRef.current = 0;
    draggedXRef.current = 0;
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // =================== Chain sync ===================
  // After state machine completes (applyData=true), wait for chain data to arrive.
  // When chain state differs from our saved baseline, sync everything to chain.
  // Skip sync when levelTransitionPending — the chain grid is stale (old level's final state).
  useEffect(() => {
    if (!applyData) return;

    // Don't apply chain data during level transitions — blocks are stale
    // (old level's end grid until reset_grid_for_level runs in startNextLevel)
    if (levelTransitionPending) return;

    // Chain data hasn't changed yet — keep waiting
    const same = deepCompareBlocks(saveGridStateblocks, initialData);
    if (same) {
      return;
    }

    // Chain data arrived — sync everything to chain state
    setBlocks(initialData);
    setSaveGridStateblocks(initialData);
    setNextLine(nextLineData);
    setNextLineHasBeenConsumed(false);
    setIsTxProcessing(false);
    setApplyData(false);

    // If we were in CASCADE_COMPLETE, transition to WAITING now
    if (gameStateRef.current === GameState.CASCADE_COMPLETE) {
      gameStateRef.current = GameState.WAITING;
      setGameState(GameState.WAITING);
    }
  }, [applyData, initialData, nextLineData, saveGridStateblocks, setIsTxProcessing, setNextLineHasBeenConsumed, levelTransitionPending]);

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
    draggingRef.current = block;
    dragStartXRef.current = x;
    initialXRef.current = block.x;
    draggedXRef.current = block.x;
    gameStateRef.current = GameState.DRAGGING;
    setGameState(GameState.DRAGGING);
  };

  const handleDragMove = (x: number, _moveType: MoveType) => {
    const dragging = draggingRef.current;
    if (!dragging) return;
    if (gameStateRef.current !== GameState.DRAGGING) return;

    const deltaX = x - dragStartXRef.current;
    const newX = initialXRef.current + deltaX / gridSize;
    const boundedX = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    // Re-anchor drag origin when clamped at boundary to keep cursor synced with block
    if (boundedX !== newX) {
      dragStartXRef.current = x - (boundedX - initialXRef.current) * gridSize;
    }

    if (
      !isBlocked(
        initialXRef.current,
        boundedX,
        dragging.y,
        dragging.width,
        dragging.id
      )
    ) {
      draggedXRef.current = boundedX;
      setBlocks((prevBlocks) =>
        prevBlocks.map((b) =>
          b.id === dragging.id ? { ...b, x: boundedX } : b
        )
      );
    }
  };

  // Keep mutable state in refs for stable callbacks
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const gridPositionRef = useRef(gridPosition);
  gridPositionRef.current = gridPosition;
  const bonusRef = useRef(bonus);
  bonusRef.current = bonus;
  const isTxProcessingRef = useRef(isTxProcessing);
  isTxProcessingRef.current = isTxProcessing;

  const handleTouchStart = useCallback((e: React.TouchEvent, block: Block) => {
    if (gameStateRef.current !== GameState.WAITING || isTxProcessingRef.current) {
      return;
    }

    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (gameStateRef.current !== GameState.WAITING || isTxProcessingRef.current) {
      return;
    }

    const currentBonus = bonusRef.current;
    const currentBlocks = blocksRef.current;
    const currentGridPosition = gridPositionRef.current;
    // GRID bonuses: Hammer, Totem, Wave — modify blocks, then gravity state machine
    if (currentBonus === BonusType.Hammer) {
      // Hammer: destroy single block at target position
      setBlockBonus(block);
      if (currentGridPosition !== null) {
        handleTriggerLocalExplosion(
          currentGridPosition.left + block.x * gridSize + (block.width * gridSize) / 2,
          currentGridPosition.top + block.y * gridSize
        );
      }
      setBlocks(currentBlocks.filter((b) => !(b.x === block.x && b.y === block.y)));
    } else if (currentBonus === BonusType.Totem) {
      setBlockBonus(block);
      getBlocksSameWidth(block, currentBlocks).forEach((b) => {
        if (currentGridPosition === null) return;
        handleTriggerLocalExplosion(
          currentGridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          currentGridPosition.top + b.y * gridSize
        );
      });
      setBlocks(removeBlocksSameWidth(block, currentBlocks));
    } else if (currentBonus === BonusType.Wave) {
      setBlockBonus(block);
      // Wave clears exactly 1 row (matches contract behavior)
      const rows: number[] = [block.y];
      getBlocksInRows(rows, currentBlocks).forEach((b) => {
        if (currentGridPosition === null) return;
        handleTriggerLocalExplosion(
          currentGridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          currentGridPosition.top + b.y * gridSize
        );
      });
      setBlocks(removeBlocksInRows(rows, currentBlocks));
    }

    // Grid bonuses enter gravity state machine
    if (currentBonus === BonusType.Hammer || currentBonus === BonusType.Totem || currentBonus === BonusType.Wave) {
      setIsTxProcessing(true);
      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
      return;
    }
    handleDragStart(e.clientX, block);
  }, [gridSize, gridHeight]);

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, MoveType.MOUSE);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, MoveType.TOUCH);
  };

  const endDrag = useCallback(() => {
    const dragging = draggingRef.current;
    if (!dragging) return;

    if (gameStateRef.current !== GameState.DRAGGING) {
      resetDragRefs();
      return;
    }

    const startX = initialXRef.current;
    const finalX = Math.round(draggedXRef.current);
    const hasMoved = Math.trunc(finalX) !== Math.trunc(startX);

    setBlocks((prevBlocks) =>
      prevBlocks.map((b) =>
        b.id === dragging.id ? { ...b, x: hasMoved ? finalX : startX } : b
      )
    );

    if (hasMoved) {
      setcurrentMove({
        rowIndex: dragging.y,
        startX,
        finalX,
      });
      setIsMoving(true);
      gameStateRef.current = GameState.GRAVITY;
      setGameState(GameState.GRAVITY);
    } else {
      setcurrentMove(null);
      setIsMoving(false);
      gameStateRef.current = GameState.WAITING;
      setGameState(GameState.WAITING);
    }

    resetDragRefs();
  }, [resetDragRefs]);

  useEffect(() => {
    endDragRef.current = endDrag;
  }, [endDrag]);

  useEffect(() => {
    const handleMouseUp = () => {
      endDragRef.current();
    };
    const handleTouchEnd = () => {
      endDragRef.current();
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // =================== MOVE TX ===================

  const sendMoveTX = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (startColIndex === finalColIndex) return;
      if (!account) return;

      playSwipe();
      useMoveStore.getState().enqueueMove({
        gameId,
        rowIndex: gridHeight - 1 - rowIndex,
        startIndex: Math.trunc(startColIndex),
        finalIndex: Math.trunc(finalColIndex),
      });
    },
    [account, gameId, gridHeight, playSwipe]
  );

  useEffect(() => {
    if (!account || !nextQueuedMove || isQueueProcessing) {
      return;
    }

    let cancelled = false;
    const store = useMoveStore.getState();

    const processQueuedMove = async () => {
      store.setQueueProcessing(true);
      store.markSubmitting(nextQueuedMove.id);
      // No longer blocking UI — queue processes in background

      try {
        await move({
          account: account as Account,
          game_id: gameId,
          row_index: nextQueuedMove.rowIndex,
          start_index: nextQueuedMove.startIndex,
          final_index: nextQueuedMove.finalIndex,
        });
        // Always mark confirmed — store op is safe even if effect re-ran
        store.markConfirmed(nextQueuedMove.id);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Move transaction failed.";
        store.markFailed(nextQueuedMove.id, message);
        store.clearQueueForGame(gameId);

        setBlocks(initialData);
        setSaveGridStateblocks(initialData);
        setNextLine(nextLineData);
        setLineExplodedCount(0);
        setcurrentMove(null);
        resetDragRefs();
        setIsMoving(false);
        setExplodingRows(new Set());
        setBlockBonus(null);
        gameStateRef.current = GameState.WAITING;
        setGameState(GameState.WAITING);
        setApplyData(false);
        setIsTxProcessing(false);

        showToast({
          type: "error",
          message: "Move sync failed. Grid rolled back to chain state.",
        });
      } finally {
        // ALWAYS clean up queue processing — even if effect re-ran.
        // The cancelled flag only guards React setState calls above.
        store.setQueueProcessing(false);
      }
    };

    processQueuedMove();

    return () => {
      cancelled = true;
    };
  }, [
    account,
    nextQueuedMove,
    isQueueProcessing,
    move,
    gameId,
    // NOTE: initialData/nextLineData intentionally excluded.
    // They change on chain sync which would cancel the in-flight TX handler,
    // leaving isQueueProcessing stuck true forever. Error rollback reads
    // them from the closure at mount time — stale but acceptable for rollback.
    resetDragRefs,
    setIsTxProcessing,
  ]);

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

  const blocksByRow = useMemo(() => {
    const map = new Map<number, Block[]>();
    for (const block of blocks) {
      const existing = map.get(block.y);
      if (existing) existing.push(block);
      else map.set(block.y, [block]);
    }
    return map;
  }, [blocks]);

  const isBlocked = (
    initialX: number,
    newX: number,
    y: number,
    width: number,
    blockId: number
  ) => {
    const rowBlocks = blocksByRow.get(y);
    if (!rowBlocks) return false;

    if (newX > initialX) {
      for (const block of rowBlocks) {
        if (block.id !== blockId && block.x >= initialX + width && block.x < newX + width) {
          return true;
        }
      }
    } else {
      for (const block of rowBlocks) {
        if (block.id !== blockId && block.x + block.width > newX && block.x <= initialX) {
          return true;
        }
      }
    }

    return false;
  };

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      let anyChanged = false;
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(
          block,
          prevBlocks,
          gridHeight
        );
        if (fallDistance > 0) {
          anyChanged = true;
          return { ...block, y: block.y + 1 };
        }
        return block;
      });

      setIsMoving(anyChanged);
      return anyChanged ? newBlocks : prevBlocks;
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

      setExplodingRows(new Set(completeRows));

      if (gridPosition !== null) {
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
      }

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
        if (transitioningBlocks.length > 0) {
          break;
        }

        if (!currentMove) {
          setIsMoving(false);
          setGameState(GameState.WAITING);
          break;
        }

        {
          const { startX, finalX } = currentMove;
          if (startX === finalX) {
            setcurrentMove(null);
            setIsMoving(false);
            setGameState(GameState.WAITING);
            break;
          }

          const updatedBlocks = concatenateNewLineWithGridAndShiftGrid(
            blocks,
            nextLine,
            gridHeight
          );
          setNextLineHasBeenConsumed(true);

          if (isGridFull(updatedBlocks)) {
            setGameState(GameState.UPDATE_AFTER_MOVE);
            break;
          }

          setBlocks(updatedBlocks);
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
          // Calculate points for animation display
          const pointsEarned =
            (lineExplodedCount * (lineExplodedCount + 1)) / 2;
          // If we have a combo, we display a message with points and cubes
          if (lineExplodedCount > 1) {
            setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
            setAnimatedPoints(pointsEarned);
            // Cube bonuses match contract: 4→+1, 5→+3, 6→+5, 7→+10, 8→+25, 9+→+50
            const cubesFromCombo = lineExplodedCount >= 9 ? 50 : lineExplodedCount >= 8 ? 25 : lineExplodedCount >= 7 ? 10 : lineExplodedCount >= 6 ? 5 : lineExplodedCount >= 5 ? 3 : lineExplodedCount >= 4 ? 1 : 0;
            setAnimatedCubes(cubesFromCombo);
          }

          // All local cascading done — signal cascade complete
          setApplyData(true);

          // Reset per-move state
          setLineExplodedCount(0);
          const inDanger = blocks.some((block) => block.y < 2);
          setIsPlayerInDanger(inDanger);

          if (gameState === GameState.UPDATE_AFTER_BONUS) {
            selectBlock(blockBonus as Block);
            setBlockBonus(null);
            // Bonus: transition to CASCADE_COMPLETE, wait for chain sync
            setIsTxProcessing(true);
            gameStateRef.current = GameState.CASCADE_COMPLETE;
            setGameState(GameState.CASCADE_COMPLETE);
            onCascadeComplete?.();
          } else if (gameState === GameState.UPDATE_AFTER_MOVE) {
            // Block input until chain data syncs
            setIsTxProcessing(true);
            setcurrentMove(null);
            // Transition to CASCADE_COMPLETE instead of WAITING
            // Chain sync effect will move us to WAITING once data arrives
            gameStateRef.current = GameState.CASCADE_COMPLETE;
            setGameState(GameState.CASCADE_COMPLETE);
            onCascadeComplete?.();
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
            className={`relative p-r-[1px] p-b-[1px] touch-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)] ${
              isPlayerInDanger ? " animated-box-player-danger" : ""
            }`}
            style={{
              height: `${gridHeight * gridSize + borderSize}px`,
              width: `${gridWidth * gridSize + borderSize}px`,
              touchAction: "none",
              backgroundImage:
                `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px)`,
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
                onTransitionBlockStart={handleTransitionBlockStart}
                onTransitionBlockEnd={handleTransitionBlockEnd}
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
