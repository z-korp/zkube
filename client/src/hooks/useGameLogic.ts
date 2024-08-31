import { useState, useCallback, useRef, useEffect } from "react";
import { GameState } from "../types/GameState";
import { Cell as CellType, Piece } from "../types/types";
import { useDojo } from "@/dojo/useDojo";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";

const PIECES: Piece[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];

const ROWS = 10;
const COLS = 8;

export const useGameLogic = (initialGrid: number[][], nextLine: number[]) => {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
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
    initializeGrid(initialGrid);
  }, [initialGrid]);

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: CellType[][] = [];

    for (let i = 0; i < ROWS; i++) {
      const row: CellType[] = [];
      for (let j = 0; j < COLS; j++) {
        const value = initialGrid[i][j];
        row.push({
          id: `${i}-${j}`,
          pieceId: value !== 0 ? value : null,
          isStart: false,
          pieceIndex: null,
        });
      }
      newGrid.push(row);
    }
    markStartingCells(newGrid);
    setGameState((prev) => ({ ...prev, grid: newGrid }));
    stateGridRef.current = newGrid;
  };

  const markStartingCells = (grid: CellType[][]) => {
    for (let i = 0; i < ROWS; i++) {
      let j = 0;
      while (j < COLS) {
        const currentPiece = grid[i][j].pieceId;
        if (currentPiece !== null) {
          const piece = PIECES.find((p) => p.id === currentPiece);
          if (piece) {
            const pieceIndex = i * COLS + j;
            grid[i][j].isStart = true;
            grid[i][j].pieceIndex = pieceIndex;

            for (let k = 1; k < piece.width && j + k < COLS; k++) {
              grid[i][j + k].isStart = false;
              grid[i][j + k].pieceIndex = pieceIndex;
            }

            j += piece.width;
          } else {
            throw new Error(`Piece not found for id: ${currentPiece}`);
          }
        } else {
          grid[i][j].isStart = false;
          j++;
        }
      }
    }
  };

  const movePiece = useCallback(
    (rowIndex: number, startCol: number, endCol: number) => {
      if (gameState.isAnimating || !account) return;

      setGameState((prev) => ({ ...prev, isTxProcessing: true }));
      move({
        account: account as Account,
        row_index: rowIndex,
        start_index: startCol,
        final_index: endCol,
      }).finally(() => {
        setGameState((prev) => ({ ...prev, isTxProcessing: false }));
        applyGravity();
      });
    },
    [account, gameState.isAnimating]
  );

  const applyGravity = useCallback(async () => {
    setGameState((prev) => ({ ...prev, isAnimating: true }));

    const applyGravityStep = () => {
      return new Promise<boolean>((resolve) => {
        setGameState((prev) => {
          const newGrid = prev.grid.map((row) =>
            row.map((cell) => ({ ...cell }))
          );
          let changesMade = false;

          for (let row = ROWS - 2; row >= 0; row--) {
            for (let col = 0; col < COLS; col++) {
              if (
                newGrid[row][col].pieceId !== null &&
                newGrid[row][col].isStart
              ) {
                const piece = PIECES.find(
                  (p) => p.id === newGrid[row][col].pieceId
                );
                if (piece) {
                  let canFall = true;
                  for (let i = 0; i < piece.width; i++) {
                    if (
                      col + i >= COLS ||
                      newGrid[row + 1][col + i].pieceId !== null
                    ) {
                      canFall = false;
                      break;
                    }
                  }
                  if (canFall) {
                    for (let i = 0; i < piece.width; i++) {
                      newGrid[row + 1][col + i] = { ...newGrid[row][col + i] };
                      newGrid[row][col + i] = {
                        id: `${row}-${col + i}`,
                        pieceId: null,
                        isStart: false,
                        pieceIndex: null,
                      };
                    }
                    changesMade = true;
                  }
                }
              }
            }
          }

          stateGridRef.current = newGrid;
          resolve(changesMade);
          return { ...prev, grid: newGrid };
        });
      });
    };

    let changesMade = true;
    while (changesMade) {
      changesMade = await applyGravityStep();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setGameState((prev) => ({ ...prev, isAnimating: false }));
    checkAndClearLines();
  }, []);

  const checkAndClearLines = useCallback(() => {
    setGameState((prev) => {
      const newGrid = prev.grid.map((row) => row.map((cell) => ({ ...cell })));
      let linesCleared = 0;

      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row].every((cell) => cell.pieceId !== null)) {
          linesCleared++;
          for (let i = row; i > 0; i--) {
            newGrid[i] = newGrid[i - 1].map((cell, colIndex) => ({
              ...cell,
              id: `${i}-${colIndex}`,
            }));
          }
          newGrid[0] = newGrid[0].map((cell, colIndex) => ({
            id: `0-${colIndex}`,
            pieceId: null,
            isStart: false,
            pieceIndex: null,
          }));
        }
      }

      const newScore = prev.score + linesCleared * 100;
      const newCombo = linesCleared > 0 ? prev.combo + 1 : 0;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);

      stateGridRef.current = newGrid;
      return {
        ...prev,
        grid: newGrid,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
      };
    });

    if (isGridEmpty()) {
      insertNewLine();
    }
  }, []);

  const isGridEmpty = useCallback(() => {
    return gameState.grid.every((row) =>
      row.every((cell) => cell.pieceId === null)
    );
  }, [gameState.grid]);

  const insertNewLine = useCallback(() => {
    setGameState((prev) => {
      const newGrid = prev.grid.slice(1);
      const newLine: CellType[] = prev.nextLine.map((value, index) => ({
        id: `${ROWS - 1}-${index}`,
        pieceId: value !== 0 ? value : null,
        isStart: false,
        pieceIndex: null,
      }));
      newGrid.push(newLine);
      markStartingCells(newGrid);

      return { ...prev, grid: newGrid };
    });
  }, []);

  const applyBonus = useCallback(
    (
      bonusType: "wave" | "tiki" | "hammer",
      rowIndex: number,
      colIndex?: number
    ) => {
      if (gameState.isAnimating || !account) return;

      setGameState((prev) => ({ ...prev, isTxProcessing: true }));

      let bonusNumber: number;
      switch (bonusType) {
        case "wave":
          bonusNumber = 3;
          break;
        case "tiki":
          bonusNumber = 2;
          break;
        case "hammer":
          bonusNumber = 1;
          break;
      }

      applyBonus({
        account: account as Account,
        bonus: bonusNumber,
        row_index: rowIndex,
        block_index: colIndex || 0,
      }).finally(() => {
        setGameState((prev) => ({ ...prev, isTxProcessing: false }));
        if (bonusType === "wave") {
          clearLine(rowIndex);
        } else if (bonusType === "hammer" && colIndex !== undefined) {
          removePiece(rowIndex, colIndex);
        }
        applyGravity();
      });
    },
    [account, gameState.isAnimating]
  );

  const clearLine = useCallback((rowIndex: number) => {
    setGameState((prev) => {
      const newGrid = prev.grid.map((row) => row.map((cell) => ({ ...cell })));
      newGrid[rowIndex] = newGrid[rowIndex].map((cell, colIndex) => ({
        id: `${rowIndex}-${colIndex}`,
        pieceId: null,
        isStart: false,
        pieceIndex: null,
      }));
      return { ...prev, grid: newGrid };
    });
  }, []);

  const removePiece = useCallback((rowIndex: number, colIndex: number) => {
    setGameState((prev) => {
      const newGrid = prev.grid.map((row) => row.map((cell) => ({ ...cell })));
      const pieceId = newGrid[rowIndex][colIndex].pieceId;
      const pieceIndex = newGrid[rowIndex][colIndex].pieceIndex;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (
            newGrid[row][col].pieceId === pieceId &&
            newGrid[row][col].pieceIndex === pieceIndex
          ) {
            newGrid[row][col] = {
              id: `${row}-${col}`,
              pieceId: null,
              isStart: false,
              pieceIndex: null,
            };
          }
        }
      }

      return { ...prev, grid: newGrid };
    });
  }, []);

  return {
    gameState,
    setGameState,
    gridRef,
    movePiece,
    applyGravity,
    applyBonus,
  };
};
