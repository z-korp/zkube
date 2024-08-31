import { GameState } from "../../types/GameState";
import { ROWS, COLS } from "../constants";

export const applyWaveBonus = (
  gameState: GameState,
  rowIndex: number
): GameState => {
  const newGrid = gameState.grid.map((row) => row.map((cell) => ({ ...cell })));
  newGrid[rowIndex] = newGrid[rowIndex].map((cell, colIndex) => ({
    id: `${rowIndex}-${colIndex}`,
    pieceId: null,
    isStart: false,
    pieceIndex: null,
  }));

  return {
    ...gameState,
    grid: newGrid,
    waveCount: gameState.waveCount - 1,
  };
};

export const applyHammerBonus = (
  gameState: GameState,
  rowIndex: number,
  colIndex: number
): GameState => {
  const newGrid = gameState.grid.map((row) => row.map((cell) => ({ ...cell })));
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

  return {
    ...gameState,
    grid: newGrid,
    hammerCount: gameState.hammerCount - 1,
  };
};
