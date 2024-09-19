// Grid.ts
import { Piece } from "@/types/Piece";
import { Cell } from "@/types/Cell";
import { PIECES } from "./types";

export class Grid {
  rows: number;
  cols: number;
  cells: Cell[][];
  pieces: { piece: Piece; startRow: number; startCol: number }[];

  constructor(rows: number, cols: number, initialGrid: number[][]) {
    this.rows = rows;
    this.cols = cols;
    this.cells = this.initializeGrid(initialGrid);
    this.pieces = this.extractPiecesFromGrid();
  }

  initializeGrid(initialGrid: number[][]): Cell[][] {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < this.rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < this.cols; j++) {
        const cellId = `${i}-${j}`;
        const value = initialGrid && initialGrid[i] ? initialGrid[i][j] : 0;
        const piece = value !== 0 ? PIECES.find((p) => p.id === value) : null;
        if (piece) {
          const newPiece = new Piece(piece.id, piece.width, piece.element);
          for (let k = 0; k < piece.width; k++) {
            const isStart = k === 0;
            const currentCellId = `${i}-${j + k}`;
            row.push(new Cell(currentCellId, newPiece, isStart));
          }
          j += piece.width - 1; // Skip the cells we've just filled
        } else {
          row.push(new Cell(cellId, null, false));
        }
      }
      newGrid.push(row);
    }
    return newGrid;
  }

  removePiece(rowIndex: number, colIndex: number): void {
    if (
      rowIndex >= 0 &&
      rowIndex < this.rows &&
      colIndex >= 0 &&
      colIndex < this.cols
    ) {
      const pieceToRemove = this.cells[rowIndex][colIndex].piece;
      if (pieceToRemove) {
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            if (this.cells[row][col].piece === pieceToRemove) {
              this.cells[row][col].setPiece(null, false);
            }
          }
        }
        // Update the pieces list after removing a piece
        this.pieces = this.extractPiecesFromGrid();
      }
    }
  }

  isEmpty(): boolean {
    // Check if all cells are empty (i.e., no piece present)
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.piece !== null) {
          return false; // If a piece is found, the grid is not empty
        }
      }
    }
    return true; // No piece found, so the grid is empty
  }

  extractPiecesFromGrid(): { piece: Piece; startRow: number; startCol: number }[] {
    const pieces: { piece: Piece; startRow: number; startCol: number }[] = [];
    for (let row = 0; row < this.rows; row++) {
      let col = 0;
      while (col < this.cols) {
        const cell = this.cells[row][col];
        if (cell.piece !== null) {
          const piece = PIECES.find((p) => p.element === cell.piece?.element);
          if (piece) {
            const newPiece = new Piece(piece.id, piece.width, piece.element);
            pieces.push({ piece: newPiece, startRow: row, startCol: col });
            // Move to the next column after this piece
            col += piece.width;
          } else {
            col++; // Move to the next column if no matching piece is found
          }
        } else {
          col++; // Move to the next column for empty cells
        }
      }
    }
  
    return pieces;
  }

  applyGravity(): boolean {
    let changesMade = false;

    for (let row = this.rows - 2; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const currentCell = this.cells[row][col];

        if (currentCell.piece !== null && currentCell.isStart) {
            let canFall = true;
            for (let i = 0; i < currentCell.piece?.width; i++) {
              if (
                col + i >= this.cols ||
                this.cells[row + 1][col + i].piece !== null
              ) {
                canFall = false;
                break;
              }
            }
            if (canFall) {
              // Move the piece one row down
              for (let i = 0; i < currentCell.piece?.width; i++) {
                const currentPiece = this.cells[row][col + i].piece;
                if (currentPiece) {
                  this.cells[row + 1][col + i].setPiece(
                    currentPiece,
                    this.cells[row][col + i].isStart,
                  );
                } else {
                  this.cells[row + 1][col + i].setPiece(null, false);
                }
                this.cells[row][col + i] = new Cell(`${row}-${col + i}`);
              }
              changesMade = true;
            }
        }
      }
    }

    if (changesMade) {
      this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after applying gravity
    }

    return changesMade;
  }

  getFullLines(): number[] {
    const fullLines: number[] = [];
    for (let row = 0; row < this.rows; row++) {
      if (this.cells[row].every((cell) => cell.piece !== null)) {
        fullLines.push(row);
      }
    }
    return fullLines;
  }

  checkAndClearFullLines(): boolean {
    let rowsCleared = false;

    for (let row = 0; row < this.rows; row++) {
      if (this.cells[row].every((cell) => cell.piece !== null)) {
        rowsCleared = true;
        for (let i = row; i > 0; i--) {
          this.cells[i] = this.cells[i - 1].map(
            (cell, col) =>
              new Cell(`${i}-${col}`, cell.piece, cell.isStart)
          );
        }
        // Clear the first line
        this.cells[0] = this.cells[0].map((_, col) => new Cell(`0-${col}`));
      }
    }

    if (rowsCleared) {
      this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after clearing lines
    }

    return rowsCleared;
  }

  insertNewLine(nextLine: number[]): void {
    // Shift all lines upwards
    this.cells = this.cells.slice(1);

    const newLine: Cell[] = [];
    let currentPiece: Piece | null = null;
    let pieceStartIndex = 0;

    for (let index = 0; index < nextLine.length; index++) {
      const value = nextLine[index];
      
      if (value !== 0 && !currentPiece) {
        const piece = PIECES.find((p) => p.id === value);
        if (piece) {
          currentPiece = new Piece(value, piece.width, piece.element);
          pieceStartIndex = index;
        }
      }

      if (currentPiece) {
        newLine.push(new Cell(`${this.rows - 1}-${index}`, currentPiece, index === pieceStartIndex));
        if (index - pieceStartIndex + 1 === currentPiece.width) {
          currentPiece = null;
        }
      } else {
        newLine.push(new Cell(`${this.rows - 1}-${index}`, null, false));
      }
    }

    // Add the new line at the bottom of the grid
    this.cells.push(newLine);

    this.markStartingCells();
    this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after inserting a new line
  }

  getNumericGrid = (): number[][] =>
    this.cells.map((row) => row.map((cell) => cell.piece?.width ?? 0));

  markStartingCells() {
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; ) {
        const cell = this.cells[i][j];
        if (cell.piece !== null) {
          const pieceWidth = cell.piece.width;
          for (let k = 0; k < pieceWidth && j + k < this.cols; k++) {
            const currentCell = this.cells[i][j + k];
            currentCell.isStart = k === 0;
          }
          j += pieceWidth;
        } else {
          cell.isStart = false;
          j++;
        }
      }
    }
  }

  placePiece(row: number, col: number, piece: Piece): Grid {
    for (let j = 0; j < piece.width; j++) {
      if (row < this.rows && col + j < this.cols) {
        this.cells[row][col + j].piece = piece;
        this.cells[row][col + j].isStart = j === 0;
      }
    }
    this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after placing a new piece
    return this;
  }
}