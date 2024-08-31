import { Cell as CellType } from "../../types/types";
import { GameState } from "../../types/GameState";
import { ROWS, COLS, PIECES } from "../constants";

export const applyGravityStep = (
  grid: CellType[][]
): { grid: CellType[][]; changesMade: boolean } => {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
  let changesMade = false;

  for (let row = ROWS - 2; row >= 0; row--) {
    for (let col = 0; col < COLS; col++) {
      if (newGrid[row][col].pieceId !== null && newGrid[row][col].isStart) {
        const piece = PIECES.find((p) => p.id === newGrid[row][col].pieceId);
        if (piece) {
          let canFall = true;
          for (let i = 0; i < piece.width; i++) {
            if (col + i >= COLS || newGrid[row + 1][col + i].pieceId !== null) {
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

  return { grid: newGrid, changesMade };
};
