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
  concatenateNewLineWithGridAndShiftGrid,
  deepCompareBlocks,
} from "@/utils/gridUtils";
import { MoveType } from "@/enums/moveEnum";
import AnimatedText from "../elements/animatedText";
import { ComboMessages } from "@/enums/comboEnum";
import { motion } from "motion/react";
import { BonusType } from "@/dojo/game/types/bonusTypes";
import { useMusicPlayer } from "@/contexts/hooks";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeColors, getThemeImages, type ThemeId } from "@/config/themes";
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

  // ==================== Theme ====================
  const { themeTemplate } = useTheme();
  const themeColors = getThemeColors(themeTemplate as ThemeId);
  const themeImages = getThemeImages(themeTemplate as ThemeId);
  const blockImages = useMemo<Record<number, string>>(() => ({
    1: themeImages.block1,
    2: themeImages.block2,
    3: themeImages.block3,
    4: themeImages.block4,
  }), [themeImages]);

  // ==================== Refs ====================
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef<Block | null>(null);
  const dragStartXRef = useRef(0);
  const initialXRef = useRef(0);
  const draggedXRef = useRef(0);
  const gameStateRef = useRef<GameState>(GameState.WAITING);
  const endDragRef = useRef<() => void>(() => undefined);

  // ==================== State ====================
  const [blocks, setBlocks] = useState<Block[]>(initialData);
  const [nextLine, setNextLine] = useState<Block[]>(nextLineData);
  const [saveGridStateblocks, setSaveGridStateblocks] = useState<Block[]>(initialData);
  const [applyData, setApplyData] = useState(false);
  const [isMoving, setIsMoving] = useState(true);
  const [currentMove, setcurrentMove] = useState<{
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  // 0 = safe, 1 = warning (row 1 occupied), 2 = critical (row 0 occupied)
  const [dangerLevel, setDangerLevel] = useState(0);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [blockBonus, setBlockBonus] = useState<Block | null>(null);
  const [explodingRows, setExplodingRows] = useState<Set<number>>(new Set());
  const { playExplode, playSwipe } = useMusicPlayer();

  // ==================== Custom Hooks ====================
  const queue = useMoveStore((state) => state.queue);
  const isQueueProcessing = useMoveStore((state) => state.isQueueProcessing);
  const { shouldBounce, animateText, resetAnimateText, setAnimateText } =
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
  const gravitySpeed = 100;
  const transitionDuration = VITE_PUBLIC_DEPLOY_TYPE === "sepolia" ? 400 : 300;

  // SVG dimensions
  const svgW = gridWidth * gridSize;
  const svgH = gridHeight * gridSize;
  // Frame padding
  const framePad = 9;
  const frameW = svgW + framePad * 2;
  const frameH = svgH + framePad * 2;
  // Total perimeter for stroke-dasharray
  const framePerimeter = 2 * (svgW + framePad * 2 - 16) + 2 * (svgH + framePad * 2 - 16); // approximate for rounded rect

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
  useEffect(() => {
    if (!applyData) return;
    if (levelTransitionPending) return;

    const same = deepCompareBlocks(saveGridStateblocks, initialData);
    if (same) return;

    setBlocks(initialData);
    setSaveGridStateblocks(initialData);
    setNextLine(nextLineData);
    setNextLineHasBeenConsumed(false);
    setIsTxProcessing(false);
    setApplyData(false);

    if (gameStateRef.current === GameState.CASCADE_COMPLETE) {
      gameStateRef.current = GameState.WAITING;
      setGameState(GameState.WAITING);
    }
  }, [applyData, initialData, nextLineData, saveGridStateblocks, setIsTxProcessing, setNextLineHasBeenConsumed, levelTransitionPending]);

  // Recompute danger level whenever blocks change (covers initial load + chain sync + gravity)
  useEffect(() => {
    const hasCritical = blocks.some((b) => b.y === 0);
    const hasWarning = blocks.some((b) => b.y === 1);
    setDangerLevel(hasCritical ? 2 : hasWarning ? 1 : 0);
  }, [blocks]);

  // =================== DRAG & DROP ===================
  //
  // Convert screen clientX → grid cell X using SVG's getScreenCTM().
  // This handles all viewBox scaling automatically.

  // Mutable refs for stable callbacks
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  const bonusRef = useRef(bonus);
  bonusRef.current = bonus;
  const isTxProcessingRef = useRef(isTxProcessing);
  isTxProcessingRef.current = isTxProcessing;

  /** Convert screen clientX to grid cell units (0-based, fractional) */
  const clientXToCellX = useCallback((clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const ctm = svg.getScreenCTM();
    if (!ctm) return 0;
    // Convert screen px → SVG viewBox units, subtract frame padding, divide by cell size
    const svgX = (clientX - ctm.e) / ctm.a;
    return (svgX - framePad) / gridSize;
  }, [framePad, gridSize]);

  /** Check if moving a block from initialX to newX is blocked by another block in the same row */
  const checkBlocked = useCallback((initialX: number, newX: number, y: number, width: number, blockId: number): boolean => {
    const currentBlocks = blocksRef.current;
    const rowBlocks = currentBlocks.filter(b => b.y === y);

    if (newX > initialX) {
      // Moving right: check if any block sits between old right edge and new right edge
      for (const b of rowBlocks) {
        if (b.id !== blockId && b.x >= initialX + width && b.x < newX + width) return true;
      }
    } else {
      // Moving left: check if any block's right edge is past our new left edge
      for (const b of rowBlocks) {
        if (b.id !== blockId && b.x + b.width > newX && b.x <= initialX) return true;
      }
    }
    return false;
  }, []);

  const onDragMove = useCallback((clientX: number) => {
    const dragging = draggingRef.current;
    if (!dragging) return;
    if (gameStateRef.current !== GameState.DRAGGING) return;

    const cellX = clientXToCellX(clientX);
    const delta = cellX - dragStartXRef.current;
    const newX = initialXRef.current + delta;
    const bounded = Math.max(0, Math.min(gridWidth - dragging.width, newX));

    if (!checkBlocked(initialXRef.current, bounded, dragging.y, dragging.width, dragging.id)) {
      draggedXRef.current = bounded;
      setBlocks((prev) =>
        prev.map((b) => b.id === dragging.id ? { ...b, x: bounded } : b),
      );
    }
  }, [clientXToCellX, gridWidth, checkBlocked]);

  const onDragMoveRef = useRef(onDragMove);
  onDragMoveRef.current = onDragMove;

  const onDragStart = useCallback((clientX: number, block: Block) => {
    draggingRef.current = block;
    dragStartXRef.current = clientXToCellX(clientX);
    initialXRef.current = block.x;
    draggedXRef.current = block.x;
    gameStateRef.current = GameState.DRAGGING;
    setGameState(GameState.DRAGGING);
  }, [clientXToCellX]);

  const onDragEnd = useCallback(() => {
    const dragging = draggingRef.current;
    if (!dragging) return;

    if (gameStateRef.current !== GameState.DRAGGING) {
      resetDragRefs();
      return;
    }

    const startX = initialXRef.current;
    const finalX = Math.round(draggedXRef.current);
    const hasMoved = Math.trunc(finalX) !== Math.trunc(startX);

    setBlocks((prev) =>
      prev.map((b) => b.id === dragging.id ? { ...b, x: hasMoved ? finalX : startX } : b),
    );

    if (hasMoved) {
      setcurrentMove({ rowIndex: dragging.y, startX, finalX });
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

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGGElement>, block: Block) => {
    if (gameStateRef.current !== GameState.WAITING || isTxProcessingRef.current) return;

    const currentBonus = bonusRef.current;
    const currentBlocks = blocksRef.current;

    // Grid bonuses: Hammer, Totem, Wave
    if (currentBonus === BonusType.Hammer) {
      setBlockBonus(block);
      setBlocks(currentBlocks.filter((b) => !(b.x === block.x && b.y === block.y)));
    } else if (currentBonus === BonusType.Totem) {
      setBlockBonus(block);
      setBlocks(removeBlocksSameWidth(block, currentBlocks));
    } else if (currentBonus === BonusType.Wave) {
      setBlockBonus(block);
      const rows: number[] = [block.y];
      setBlocks(removeBlocksInRows(rows, currentBlocks));
    }

    if (currentBonus === BonusType.Hammer || currentBonus === BonusType.Totem || currentBonus === BonusType.Wave) {
      setIsTxProcessing(true);
      setIsMoving(true);
      setGameState(GameState.GRAVITY_BONUS);
      return;
    }

    onDragStart(e.clientX, block);
  }, [onDragStart, setIsTxProcessing]);

  // Document-level listeners for move and end (works outside SVG bounds)
  useEffect(() => {
    const move = (e: PointerEvent) => onDragMoveRef.current(e.clientX);
    const end = () => endDragRef.current();
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", end);
    };
  }, []);

  useEffect(() => {
    endDragRef.current = onDragEnd;
  }, [onDragEnd]);

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
    [account, gameId, gridHeight, playSwipe],
  );

  useEffect(() => {
    if (!account || !nextQueuedMove || isQueueProcessing) return;

    let cancelled = false;
    const store = useMoveStore.getState();

    const processQueuedMove = async () => {
      store.setQueueProcessing(true);
      store.markSubmitting(nextQueuedMove.id);

      try {
        await move({
          account: account as Account,
          game_id: gameId,
          row_index: nextQueuedMove.rowIndex,
          start_index: nextQueuedMove.startIndex,
          final_index: nextQueuedMove.finalIndex,
        });
        store.markConfirmed(nextQueuedMove.id);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Move transaction failed.";
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

        showToast({ type: "error", message: "Move sync failed. Grid rolled back to chain state." });
      } finally {
        store.setQueueProcessing(false);
      }
    };

    processQueuedMove();
    return () => { cancelled = true; };
  }, [account, nextQueuedMove, isQueueProcessing, move, gameId, resetDragRefs, setIsTxProcessing]);

  useEffect(() => {
    if (currentMove) {
      const { rowIndex, startX, finalX } = currentMove;
      sendMoveTX(rowIndex, startX, finalX);
    }
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

  const isBlocked = (initialX: number, newX: number, y: number, width: number, blockId: number) => {
    const rowBlocks = blocksByRow.get(y);
    if (!rowBlocks) return false;

    if (newX > initialX) {
      for (const block of rowBlocks) {
        if (block.id !== blockId && block.x >= initialX + width && block.x < newX + width) return true;
      }
    } else {
      for (const block of rowBlocks) {
        if (block.id !== blockId && block.x + block.width > newX && block.x <= initialX) return true;
      }
    }
    return false;
  };

  const applyGravity = () => {
    setBlocks((prevBlocks) => {
      let anyChanged = false;
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(block, prevBlocks, gridHeight);
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

  const clearCompleteLine = (newGravityState: GameState, newStateOnComplete: GameState) => {
    const { updatedBlocks, completeRows } = removeCompleteRows(blocks, gridWidth, gridHeight);

    if (updatedBlocks.length < blocks.length) {
      playExplode();
      setLineExplodedCount(lineExplodedCount + completeRows.length);
      setExplodingRows(new Set(completeRows));

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

  // STATE MACHINE
  useEffect(() => {
    const intervalRef = { current: null as NodeJS.Timeout | null };
    const applyGravityWithInterval = () => {
      intervalRef.current = setInterval(() => applyGravity(), gravitySpeed);
    };

    switch (gameState) {
      case GameState.GRAVITY:
      case GameState.GRAVITY2:
      case GameState.GRAVITY_BONUS:
        if (!isMoving && transitioningBlocks.length === 0) {
          switch (gameState) {
            case GameState.GRAVITY: setGameState(GameState.LINE_CLEAR); break;
            case GameState.GRAVITY2: setGameState(GameState.LINE_CLEAR2); break;
            case GameState.GRAVITY_BONUS: setGameState(GameState.LINE_CLEAR_BONUS); break;
          }
        } else {
          applyGravityWithInterval();
        }
        break;

      case GameState.ADD_LINE:
        if (transitioningBlocks.length > 0) break;
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
          const updatedBlocks = concatenateNewLineWithGridAndShiftGrid(blocks, nextLine, gridHeight);
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
        clearCompleteLine(GameState.GRAVITY_BONUS, GameState.UPDATE_AFTER_BONUS);
        break;

      case GameState.UPDATE_AFTER_BONUS:
      case GameState.UPDATE_AFTER_MOVE:
        {
          if (lineExplodedCount > 1) {
            setAnimateText(Object.values(ComboMessages)[lineExplodedCount]);
          }
          setApplyData(true);
          setLineExplodedCount(0);
          const hasCritical = blocks.some((block) => block.y === 0);
          const hasWarning = blocks.some((block) => block.y === 1);
          setDangerLevel(hasCritical ? 2 : hasWarning ? 1 : 0);

          if (gameState === GameState.UPDATE_AFTER_BONUS) {
            selectBlock(blockBonus as Block);
            setBlockBonus(null);
            setIsTxProcessing(true);
            gameStateRef.current = GameState.CASCADE_COMPLETE;
            setGameState(GameState.CASCADE_COMPLETE);
            onCascadeComplete?.();
          } else if (gameState === GameState.UPDATE_AFTER_MOVE) {
            setIsTxProcessing(true);
            setcurrentMove(null);
            gameStateRef.current = GameState.CASCADE_COMPLETE;
            setGameState(GameState.CASCADE_COMPLETE);
            onCascadeComplete?.();
          }
        }
        break;
      default:
        break;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, isMoving, transitioningBlocks]);

  // =================== RENDER ===================

  return (
    <motion.div
      animate={shouldBounce ? { scale: [1, 1.1, 1, 1.1, 1] } : {}}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative"
      style={{ width: frameW, height: frameH }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${frameW} ${frameH}`}
        width={frameW}
        height={frameH}
        className="touch-none"
        style={{ cursor: isTxProcessing ? "wait" : "default" }}
      >
        <defs>
          {/* Frame border gradient */}
          <linearGradient id="gf-border" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.5" />
            <stop offset="20%" stopColor="#8B7355" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6B5B3E" stopOpacity="0.2" />
            <stop offset="80%" stopColor="#8B7355" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="gf-inner" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.06" />
          </linearGradient>
          <filter id="gf-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* ─── Frame border ─── */}
        <rect
          x={1} y={1}
          width={frameW - 2} height={frameH - 2}
          rx={8} ry={8}
          fill="none" stroke="url(#gf-border)" strokeWidth={2}
          filter="url(#gf-shadow)"
        />
        <rect
          x={3} y={3}
          width={frameW - 6} height={frameH - 6}
          rx={6} ry={6}
          fill="none" stroke="url(#gf-inner)" strokeWidth={1}
        />

        {/* ─── Loading animation (rotating sweep, like old conic-gradient) ─── */}
        {isTxProcessing && (
          <rect
            x={1} y={1}
            width={frameW - 2} height={frameH - 2}
            rx={8} ry={8}
            fill="none"
            stroke={themeColors.accent}
            strokeWidth={5}
            strokeDasharray={`${framePerimeter * 0.15} ${framePerimeter * 0.85}`}
            className="svg-loading-border"
            strokeLinecap="round"
            style={{ ["--perimeter" as string]: framePerimeter }}
          />
        )}

        {/* ─── Danger border pulse + grid overlay ─── */}
        {dangerLevel > 0 && (
          <>
            <rect
              x={1} y={1}
              width={frameW - 2} height={frameH - 2}
              rx={8} ry={8}
              fill="none"
              stroke={dangerLevel === 2 ? "rgb(209, 18, 28)" : "rgb(255, 100, 80)"}
              strokeWidth={dangerLevel === 2 ? 4 : 3}
              className={dangerLevel === 2 ? "svg-danger-border-critical" : "svg-danger-border-warning"}
            />
            <rect
              x={1} y={1}
              width={frameW - 2} height={frameH - 2}
              rx={8} ry={8}
              fill={dangerLevel === 2 ? "rgb(209, 18, 28)" : "rgb(255, 100, 80)"}
              stroke="none"
              className={dangerLevel === 2 ? "svg-danger-fill-critical" : "svg-danger-fill-warning"}
              pointerEvents="none"
            />
          </>
        )}

        {/* ─── Grid area (offset by frame padding) ─── */}
        <g transform={`translate(${framePad}, ${framePad})`}>
          {/* Grid lines */}
          {Array.from({ length: gridWidth + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i * gridSize} y1={0}
              x2={i * gridSize} y2={svgH}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}
            />
          ))}
          {Array.from({ length: gridHeight + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0} y1={i * gridSize}
              x2={svgW} y2={i * gridSize}
              stroke="rgba(255,255,255,0.07)" strokeWidth={1}
            />
          ))}


          {/* Blocks */}
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
              blockImages={blockImages}
              onPointerDown={handlePointerDown}
              onTransitionBlockStart={handleTransitionBlockStart}
              onTransitionBlockEnd={handleTransitionBlockEnd}
            />
          ))}
        </g>
      </svg>

      {/* Combo text overlay (HTML — complex text effects) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <AnimatedText textEnum={animateText} reset={resetAnimateText} />
      </div>
    </motion.div>
  );
};

export default Grid;
