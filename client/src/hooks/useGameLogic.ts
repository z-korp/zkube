import { useState, useCallback, useRef, useEffect } from "react";
import { GameState } from "../types/GameState";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { initializeGrid, isGridEmpty } from "../game/utils/gridUtils";
import { applyGravityStep } from "../game/logic/gravityLogic";
import { checkAndClearLines } from "../game/logic/lineLogic";
import { applyWaveBonus, applyHammerBonus } from "../game/logic/bonusLogic";

export const useGameLogic = (initialGrid: number[][], nextLine: number[]) => {
  const [gameState, setGameState] = useState<GameState>({
    grid: initializeGrid(initialGrid),
    nextLine,
    score: 0,
    combo: 0,
    maxCombo: 0,
    hammerCount: 0,
    waveCount: 0,
    totemCount: 0,
    isAnimating: false,
    isTxProcessing: false,
    isDragging: false,
    draggingPiece: null,
    bonusWave: false,
    bonusTiki: false,
    bonusHammer: false,
  });

  const {
    setup: {
      systemCalls: { move, applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();

  const gridRef = useRef<HTMLDivElement>(null);
  const stateGridRef = useRef(gameState.grid);

  useEffect(() => {
    setGameState((prev) => ({ ...prev, grid: initializeGrid(initialGrid) }));
  }, [initialGrid]);

  const movePiece = useCallback(
    (rowIndex: number, startCol: number, endCol: number) => {
      if (gameState.isAnimating || !account) return;

      setGameState((prev) => ({ ...prev, isTxProcessing: true }));
      move({
        account: account,
        row_index: rowIndex,
        start_index: startCol,
        final_index: endCol,
      }).finally(() => {
        setGameState((prev) => ({ ...prev, isTxProcessing: false }));
        applyGravity();
      });
    },
    [account, gameState.isAnimating, move]
  );

  const applyGravity = useCallback(async () => {
    setGameState((prev) => ({ ...prev, isAnimating: true }));

    let changesMade = true;
    while (changesMade) {
      const { grid: newGrid, changesMade: changes } = applyGravityStep(
        gameState.grid
      );
      setGameState((prev) => ({ ...prev, grid: newGrid }));
      changesMade = changes;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setGameState((prev) => {
      const updatedState = checkAndClearLines(prev);
      if (isGridEmpty(updatedState.grid)) {
        return insertNewLine(updatedState);
      }
      return { ...updatedState, isAnimating: false };
    });
  }, [gameState.grid]);

  const insertNewLine = useCallback((state: GameState): GameState => {
    const newGrid = state.grid.slice(1);
    const newLine = state.nextLine.map((value, index) => ({
      id: `9-${index}`,
      pieceId: value !== 0 ? value : null,
      isStart: false,
      pieceIndex: null,
    }));
    newGrid.push(newLine);
    return { ...state, grid: newGrid, nextLine: [] };
  }, []);

  const applyBonusAction = useCallback(
    (bonusType: "wave" | "hammer", rowIndex: number, colIndex?: number) => {
      if (gameState.isAnimating || !account) return;

      setGameState((prev) => ({ ...prev, isTxProcessing: true }));

      const bonusNumber = bonusType === "wave" ? 3 : 1;

      applyBonus({
        account: account,
        bonus: bonusNumber,
        row_index: rowIndex,
        block_index: colIndex || 0,
      }).finally(() => {
        setGameState((prev) => {
          let updatedState = { ...prev, isTxProcessing: false };
          if (bonusType === "wave") {
            updatedState = applyWaveBonus(updatedState, rowIndex);
          } else if (bonusType === "hammer" && colIndex !== undefined) {
            updatedState = applyHammerBonus(updatedState, rowIndex, colIndex);
          }
          return updatedState;
        });
        applyGravity();
      });
    },
    [account, gameState.isAnimating, applyBonus, applyGravity]
  );

  return {
    gameState,
    setGameState,
    gridRef,
    movePiece,
    applyGravity,
    applyBonusAction,
  };
};
