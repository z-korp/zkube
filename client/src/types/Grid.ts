// Grid.ts
import { Piece } from "@/types/Piece";
import { Cell } from "@/types/Cell";
import { PIECES } from "@/ui/components/CellComponent";

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
        const value = initialGrid[i][j];
        const piece = value !== 0 ? PIECES.find((p) => p.id === value) : null;
        const isStart = piece !== null && (j === 0 || initialGrid[i][j - 1] !== value);
        const cell = new Cell(cellId, piece, isStart);
        row.push(cell);
      }
      newGrid.push(row);
    }
    return newGrid;
  }

  isEmpty(): boolean {
    // Vérifie si toutes les cellules sont vides (i.e., aucune pièce présente)
    for (const row of this.cells) {
      for (const cell of row) {
        if (cell.piece !== null) {
          return false; // Si une pièce est trouvée, la grille n'est pas vide
        }
      }
    }
    return true; // Aucune pièce trouvée, donc la grille est vide
  }

  extractPiecesFromGrid(): { piece: Piece; startRow: number; startCol: number }[] {
    const pieces: { piece: Piece; startRow: number; startCol: number }[] = [];
    const visited: Set<string> = new Set();
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        // console.log(`Cell at (${row}, ${col}) has piece id ${JSON.stringify(cell)}`);
        if (cell.piece !== null && cell.isStart && !visited.has(cell.id)) {
          console.log(`Found starting piece at (${row}, ${col}) with id ${cell.id}`);
          const piece = PIECES.find((p) => p === cell.piece);
          if (piece) {
            pieces.push({ piece, startRow: row, startCol: col });
            console.log(`Piece added: ${piece.id} at start position (${row}, ${col})`);
            for (let i = 0; i < piece.width; i++) {
              const cellToVisit = `${row}-${col + i}`;
              visited.add(cellToVisit);
              console.log(`Marking cell as visited: ${cellToVisit}`);
            }
          }
        }
      }
    }

    console.log(`Total pieces extracted: ${pieces.length}`);
    return pieces;
  }

  applyGravity(): boolean {
    let changesMade = false;

    for (let row = this.rows - 2; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        const currentCell = this.cells[row][col];

        if (currentCell.piece !== null && currentCell.isStart) {
          const piece = PIECES.find((p) => p === currentCell.piece);
          if (piece) {
            let canFall = true;
            for (let i = 0; i < piece.width; i++) {
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
              for (let i = 0; i < piece.width; i++) {
                this.cells[row + 1][col + i].setPiece(
                  this.cells[row][col + i].piece ?? null,
                  this.cells[row][col + i].isStart,
                  this.cells[row][col + i].pieceIndex
                );
                this.cells[row][col + i] = new Cell(`${row}-${col + i}`);
              }
              changesMade = true;
            }
          }
        }
      }
    }

    if (changesMade) {
      this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after applying gravity
    }

    return changesMade;
  }

  checkAndClearFullLines(): boolean {
    let rowsCleared = false;

    for (let row = 0; row < this.rows; row++) {
      if (this.cells[row].every((cell) => cell.piece !== null)) {
        rowsCleared = true;
        for (let i = row; i > 0; i--) {
          this.cells[i] = this.cells[i - 1].map(
            (cell, col) =>
              new Cell(`${i}-${col}`, cell.piece, cell.isStart, cell.pieceIndex)
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

    // Create the new line from `nextLine`
    const newLine: Cell[] = nextLine.map(
      (value, index) => new Cell(`${this.rows - 1}-${index}`, value !== 0 ? PIECES.find((p) => p.id === value) : null)
    );

    // Add the new line at the bottom of the grid
    this.cells.push(newLine);

    this.markStartingCells();
    this.pieces = this.extractPiecesFromGrid(); // Update the pieces list after inserting a new line
  }

  markStartingCells() {
    for (let i = 0; i < this.rows; i++) {
      let j = 0;
      while (j < this.cols) {
        const currentPiece = this.cells[i][j].piece;
        if (currentPiece !== null) {
          const piece = PIECES.find((p) => p === currentPiece);
          if (piece) {
            // Mark the start of the piece
            const pieceIndex = i * this.cols + j;
            this.cells[i][j].isStart = true;
            this.cells[i][j].pieceIndex = pieceIndex;

            // Mark the rest of the piece as non-start
            for (let k = 1; k < piece.width && j + k < this.cols; k++) {
              this.cells[i][j + k].isStart = false;
              this.cells[i][j + k].pieceIndex = pieceIndex;
            }

            // Skip to the end of this piece
            j += piece.width;
          }
        } else {
          this.cells[i][j].isStart = false;
          j++;
        }
      }
    }
  }
}