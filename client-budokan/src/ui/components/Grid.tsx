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
import { showToast } from "@/utils/toast";

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
  activeBonusLevel: number;
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
  activeBonusLevel,
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

  const queueForGame = queue.filter((item) => item.gameId === gameId);
  const pendingQueueCount = queueForGame.length;
  const nextQueuedMove = queueForGame.find((item) => item.status === "queued");

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
  useEffect(() => {
    if (!applyData) return;

    // Chain data hasn't changed yet — keep waiting
    const same = deepCompareBlocks(saveGridStateblocks, initialData);
    console.log('[GRID] chain-sync check', { applyData, same, savedLen: saveGridStateblocks.length, chainLen: initialData.length });
    if (same) {
      return;
    }

    // Chain data arrived — sync everything to chain state
    console.log('[GRID] ✅ chain data arrived — syncing. blocks:', initialData.length, 'nextLine:', nextLineData.length);
    setBlocks(initialData);
    setSaveGridStateblocks(initialData);
    setNextLine(nextLineData);
    setNextLineHasBeenConsumed(false);
    setIsTxProcessing(false);
    setApplyData(false);
  }, [applyData, initialData, nextLineData, saveGridStateblocks, setIsTxProcessing, setNextLineHasBeenConsumed]);

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
        blocks,
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

  const handleTouchStart = (e: React.TouchEvent, block: Block) => {
    e.preventDefault();
    if (gameState !== GameState.WAITING || isTxProcessing) {
      console.log('[GRID] ❌ touch blocked', { gameState, isTxProcessing });
      return;
    }

    const touch = e.touches[0];
    handleDragStart(touch.clientX, block);
  };

  const handleMouseDown = (e: React.MouseEvent, block: Block) => {
    e.preventDefault();
    if (gameState !== GameState.WAITING || isTxProcessing) {
      console.log('[GRID] ❌ mouse blocked', { gameState, isTxProcessing });
      return;
    }

    // NON-GRID bonuses: Combo, Score, Supply — send tx directly, no block changes
    if (bonus === BonusType.Combo) {
      setIsTxProcessing(true);
      setAnimateText(`+${activeBonusLevel + 1} combo`);
      selectBlock(block);
      return;
    } else if (bonus === BonusType.Score) {
      setIsTxProcessing(true);
      setAnimatedPoints((activeBonusLevel + 1) * 10);
      selectBlock(block);
      return;
    } else if (bonus === BonusType.Supply) {
      setIsTxProcessing(true);
      selectBlock(block);
      return;
    }

    // GRID bonuses: Harvest, Wave — modify blocks, then gravity state machine
    if (bonus === BonusType.Harvest) {
      setBlockBonus(block);
      getBlocksSameWidth(block, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize
        );
      });
      setBlocks(removeBlocksSameWidth(block, blocks));
    } else if (bonus === BonusType.Wave) {
      setBlockBonus(block);
      const rowCount = activeBonusLevel + 1;
      const rows: number[] = [];
      for (let i = 0; i < rowCount; i++) {
        const r = block.y + i;
        if (r < gridHeight) rows.push(r);
      }
      getBlocksInRows(rows, blocks).forEach((b) => {
        if (gridPosition === null) return;
        handleTriggerLocalExplosion(
          gridPosition.left + b.x * gridSize + (b.width * gridSize) / 2,
          gridPosition.top + b.y * gridSize
        );
      });
      setBlocks(removeBlocksInRows(rows, blocks));
    }

    // Grid bonuses enter gravity state machine
    if (bonus === BonusType.Harvest || bonus === BonusType.Wave) {
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
      console.log('[GRID] endDrag → hasMoved, setting GRAVITY', { rowIndex: dragging.y, startX, finalX });
      setcurrentMove({
        rowIndex: dragging.y,
        startX,
        finalX,
      });
      setIsMoving(true);
      gameStateRef.current = GameState.GRAVITY;
      setGameState(GameState.GRAVITY);
    } else {
      console.log('[GRID] endDrag → no move, back to WAITING');
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

      console.log('[GRID] sendMoveTX enqueue', { rowIndex, startColIndex, finalColIndex });
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
      console.log('[GRID] TX queue idle', { hasAccount: !!account, nextQueuedMove: nextQueuedMove?.id ?? null, isQueueProcessing });
      return;
    }

    let cancelled = false;
    const store = useMoveStore.getState();

    const processQueuedMove = async () => {
      store.setQueueProcessing(true);
      store.markSubmitting(nextQueuedMove.id);
      // No longer blocking UI — queue processes in background
      console.log('[GRID] 🔄 TX submitting move', nextQueuedMove.id, { row: nextQueuedMove.rowIndex, start: nextQueuedMove.startIndex, final: nextQueuedMove.finalIndex });

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
        console.log('[GRID] ✅ TX confirmed', nextQueuedMove.id);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Move transaction failed.";
        store.markFailed(nextQueuedMove.id, message);
        store.clearQueueForGame(gameId);
        console.log('[GRID] ❌ TX failed', nextQueuedMove.id, message);

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
        console.log('[GRID] TX queue processing done');
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

    console.log('[GRID] state machine =>', gameState, { isMoving, transitioning: transitioningBlocks.length, isTxProcessing });
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
            // Cube bonuses: 4 lines = +1, 5 lines = +2, 6+ lines = +3
            const cubesFromCombo = lineExplodedCount >= 6 ? 3 : lineExplodedCount >= 5 ? 2 : lineExplodedCount >= 4 ? 1 : 0;
            setAnimatedCubes(cubesFromCombo);
          }

          // All animations done — wait for chain data to arrive
          console.log('[GRID] UPDATE_AFTER_MOVE/BONUS → setApplyData(true), lineExploded:', lineExplodedCount);
          setApplyData(true);

          // Reset per-move state
          setLineExplodedCount(0);
          const inDanger = blocks.some((block) => block.y < 2);
          setIsPlayerInDanger(inDanger);

          if (gameState === GameState.UPDATE_AFTER_BONUS) {
            selectBlock(blockBonus as Block);
            setBlockBonus(null);
            console.log('[GRID] → WAITING (bonus path)');
            setGameState(GameState.WAITING);
          } else if (gameState === GameState.UPDATE_AFTER_MOVE) {
            // Block input until chain data syncs
            console.log('[GRID] → WAITING (move path), setting isTxProcessing=true');
            setIsTxProcessing(true);
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
