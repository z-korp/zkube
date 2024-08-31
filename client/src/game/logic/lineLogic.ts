import { Cell as CellType } from "../../types/types";
import { GameState } from "../../types/GameState";
import { ROWS, COLS } from "../constants";

export const checkAndClearLines = (gameState: GameState): GameState => {
  const newGrid = gameState.grid.map((row) => row.map((cell) => ({ ...cell })));
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

  const newScore = gameState.score + linesCleared * 100;
  const newCombo = linesCleared > 0 ? gameState.combo + 1 : 0;
  const newMaxCombo = Math.max(gameState.maxCombo, newCombo);

  return {
    ...gameState,
    grid: newGrid,
    score: newScore,
    combo: newCombo,
    maxCombo: newMaxCombo,
  };
};
