import { Cell as CellType, Piece } from "../../types/types";
import { ROWS, COLS, PIECES } from "../constants";

export const initializeGrid = (initialGrid: number[][]): CellType[][] => {
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
  return newGrid;
};

export const markStartingCells = (grid: CellType[][]) => {
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

export const isGridEmpty = (grid: CellType[][]) => {
  return grid.every((row) => row.every((cell) => cell.pieceId === null));
};
