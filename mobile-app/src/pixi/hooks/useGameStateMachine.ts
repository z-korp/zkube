import { useCallback, useEffect, useRef, useState } from "react";
import { Account } from "starknet";
import { useDojo } from "@/dojo/useDojo";
import { GameState } from "@/enums/gameEnums";
import type { Block } from "@/types/types";
import {
  removeCompleteRows,
  isGridFull,
  deepCompareBlocks,
  concatenateNewLineWithGridAndShiftGrid,
} from "@/utils/gridUtils";
import { useMusicPlayer } from "@/contexts/hooks";
import { useMoveStore } from "@/stores/moveTxStore";
import { calculateFallDistance } from "@/utils/gridPhysics";
import { createLogger } from "@/utils/logger";

const log = createLogger("useGameStateMachine");

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

interface UseGameStateMachineProps {
  initialBlocks: Block[];
  nextLineBlocks: Block[];
  gridWidth: number;
  gridHeight: number;
  gameId: number;
  account: Account | null;
  score: number;
  combo: number;
  maxCombo: number;
  setOptimisticScore: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticCombo: React.Dispatch<React.SetStateAction<number>>;
  setOptimisticMaxCombo: React.Dispatch<React.SetStateAction<number>>;
  setNextLineHasBeenConsumed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGameStateMachine = ({
  initialBlocks,
  nextLineBlocks,
  gridWidth,
  gridHeight,
  gameId,
  account,
  score,
  combo,
  maxCombo,
  setOptimisticScore,
  setOptimisticCombo,
  setOptimisticMaxCombo,
  setNextLineHasBeenConsumed,
}: UseGameStateMachineProps) => {
  const {
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  // Refs
  const isProcessingRef = useRef(false);

  // State
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [nextLine, setNextLine] = useState<Block[]>(nextLineBlocks);
  const [saveGridStateblocks, setSaveGridStateblocks] = useState<Block[]>(initialBlocks);
  const [applyData, setApplyData] = useState(false);
  const [isMoving, setIsMoving] = useState(true);
  const [currentMove, setCurrentMove] = useState<{
    rowIndex: number;
    startX: number;
    finalX: number;
  } | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING);
  const [isPlayerInDanger, setIsPlayerInDanger] = useState(false);
  const [lineExplodedCount, setLineExplodedCount] = useState(0);
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);

  const { playExplode, playSwipe } = useMusicPlayer();
  const isMoveComplete = useMoveStore((state) => state.isMoveComplete);

  // Track if we've done initial sync
  const hasInitializedRef = useRef(false);

  // Constants
  const gravitySpeed = 100;

  // Initial sync - when blocks first become available
  useEffect(() => {
    // Only run once when blocks first become available
    if (!hasInitializedRef.current && initialBlocks.length > 0) {
      log.debug("Initial sync with", initialBlocks.length, "blocks");
      setBlocks(initialBlocks);
      setNextLine(nextLineBlocks);
      setSaveGridStateblocks(initialBlocks);
      hasInitializedRef.current = true;
      
      const inDanger = initialBlocks.some((block) => block.y < 2);
      setIsPlayerInDanger(inDanger);
    }
  }, [initialBlocks, nextLineBlocks]);

  // Grid set up - sync with contract data (after moves)
  useEffect(() => {
    if (applyData) {
      if (deepCompareBlocks(saveGridStateblocks, initialBlocks)) {
        return;
      }

      setOptimisticScore(score);
      setOptimisticCombo(combo);
      setOptimisticMaxCombo(maxCombo);

      if (isMoveComplete) {
        setSaveGridStateblocks(initialBlocks);
        setBlocks(initialBlocks);
        setNextLine(nextLineBlocks);

        const inDanger = initialBlocks.some((block) => block.y < 2);
        setIsPlayerInDanger(inDanger);

        setLineExplodedCount(0);
        setNextLineHasBeenConsumed(false);
        setApplyData(false);
        setIsTxProcessing(false);
      }
    }
  }, [applyData, initialBlocks, isMoveComplete, saveGridStateblocks, score, combo, maxCombo, nextLineBlocks, setOptimisticScore, setOptimisticCombo, setOptimisticMaxCombo, setNextLineHasBeenConsumed]);

  // Handle move transaction
  const handleMove = useCallback(
    async (rowIndex: number, startColIndex: number, finalColIndex: number) => {
      if (isProcessingRef.current) {
        log.warn("Already processing a move");
        return;
      }

      if (startColIndex === finalColIndex) return;
      if (!gameId) return;
      if (!account) return;

      isProcessingRef.current = true;
      setIsTxProcessing(true);
      playSwipe();

      // Set current move for state machine
      setCurrentMove({
        rowIndex,
        startX: startColIndex,
        finalX: finalColIndex,
      });

      // Start gravity state
      setIsMoving(true);
      setGameState(GameState.GRAVITY);

      try {
        await move({
          account: account as Account,
          game_id: gameId,
          row_index: rowIndex,
          start_index: Math.trunc(startColIndex),
          final_index: Math.trunc(finalColIndex),
        });
      } catch (error) {
        log.error("Error sending move transaction:", error);
        setBlocks(saveGridStateblocks);
        setNextLine(nextLineBlocks);
        setLineExplodedCount(0);
        setApplyData(false);
        setIsMoving(false);
        setCurrentMove(null);
        setGameState(GameState.WAITING);
        setNextLineHasBeenConsumed(false);
        setIsTxProcessing(false);
        isProcessingRef.current = false;
      } finally {
        isProcessingRef.current = false;
      }
    },
    [account, gameId, move, nextLineBlocks, playSwipe, saveGridStateblocks, setNextLineHasBeenConsumed]
  );

  // Apply gravity
  const applyGravity = useCallback(() => {
    setBlocks((prevBlocks) => {
      const newBlocks = prevBlocks.map((block) => {
        const fallDistance = calculateFallDistance(block, prevBlocks, gridHeight);
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
  }, [gridHeight]);

  // Clear complete lines
  const clearCompleteLine = useCallback((
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
      setLineExplodedCount((prev) => prev + completeRows.length);
      setBlocks(updatedBlocks);
      setIsMoving(true);
      setGameState(newGravityState);
    } else {
      setGameState(newStateOnComplete);
    }
  }, [blocks, gridWidth, gridHeight, playExplode]);

  // State machine effect
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
        clearCompleteLine(GameState.GRAVITY_BONUS, GameState.UPDATE_AFTER_BONUS);
        break;

      case GameState.UPDATE_AFTER_BONUS:
      case GameState.UPDATE_AFTER_MOVE:
        {
          const currentCombo = lineExplodedCount > 1 ? lineExplodedCount : 0;
          const pointsEarned = (lineExplodedCount * (lineExplodedCount + 1)) / 2;

          setOptimisticScore((prevPoints) => prevPoints + pointsEarned);
          setOptimisticCombo((prevCombo) => prevCombo + currentCombo);
          setOptimisticMaxCombo((prevMaxCombo) =>
            currentCombo > prevMaxCombo ? currentCombo : prevMaxCombo
          );

          setApplyData(true);

          if (gameState === GameState.UPDATE_AFTER_BONUS) {
            setGameState(GameState.WAITING);
          } else if (gameState === GameState.UPDATE_AFTER_MOVE) {
            setCurrentMove(null);
            setGameState(GameState.WAITING);
          }
        }
        break;

      default:
        break;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    gameState,
    isMoving,
    transitioningBlocks,
    applyGravity,
    clearCompleteLine,
    currentMove,
    blocks,
    nextLine,
    gridHeight,
    lineExplodedCount,
    setOptimisticScore,
    setOptimisticCombo,
    setOptimisticMaxCombo,
    setNextLineHasBeenConsumed,
  ]);

  return {
    blocks,
    gameState,
    isTxProcessing,
    isPlayerInDanger,
    lineExplodedCount,
    handleMove,
  };
};
