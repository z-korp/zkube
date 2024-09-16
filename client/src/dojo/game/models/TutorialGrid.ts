export interface Block {
    value: number;
    color: number;
  }
  
export class TutorialGrid {
    private grid: Block[][];
    private width: number;
    private height: number;
  
    constructor(width: number = 4, height: number = 4) {
      this.width = width;
      this.height = height;
      this.grid = this.createEmptyGrid();
    }
  
    private createEmptyGrid(): Block[][] {
      return Array(this.height).fill(null).map(() => 
        Array(this.width).fill(null).map(() => ({ value: 0, color: 0 }))
      );
    }
  
    public setBlock(row: number, col: number, value: number, color: number): void {
      if (this.isValidPosition(row, col)) {
        this.grid[row][col] = { value, color };
      }
    }
  
    public getBlock(row: number, col: number): Block | null {
      if (this.isValidPosition(row, col)) {
        return this.grid[row][col];
      }
      return null;
    }
  
    private isValidPosition(row: number, col: number): boolean {
      return row >= 0 && row < this.height && col >= 0 && col < this.width;
    }
  
    public slideCube(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
      if (!this.isValidPosition(fromRow, fromCol) || !this.isValidPosition(toRow, toCol)) {
        return false;
      }
  
      const block = this.grid[fromRow][fromCol];
      if (block.value === 0) {
        return false; // Can't slide an empty space
      }
  
      // Check if the move is valid (only horizontal or vertical)
      if (fromRow !== toRow && fromCol !== toCol) {
        return false;
      }
  
      // Slide the cube
      this.grid[toRow][toCol] = block;
      this.grid[fromRow][fromCol] = { value: 0, color: 0 };
  
      return true;
    }
  
    public applyGravity(): void {
      for (let col = 0; col < this.width; col++) {
        let emptyRow = this.height - 1;
        for (let row = this.height - 1; row >= 0; row--) {
          if (this.grid[row][col].value !== 0) {
            if (row !== emptyRow) {
              this.grid[emptyRow][col] = this.grid[row][col];
              this.grid[row][col] = { value: 0, color: 0 };
            }
            emptyRow--;
          }
        }
      }
    }
  
    public clearLines(): number {
      let linesCleared = 0;
      for (let row = 0; row < this.height; row++) {
        if (this.isLineFull(row)) {
          this.clearLine(row);
          linesCleared++;
        }
      }
      return linesCleared;
    }
  
    private isLineFull(row: number): boolean {
      return this.grid[row].every(block => block.value !== 0);
    }
  
    private clearLine(row: number): void {
      for (let col = 0; col < this.width; col++) {
        this.grid[row][col] = { value: 0, color: 0 };
      }
      // Shift all rows above down
      for (let r = row; r > 0; r--) {
        this.grid[r] = this.grid[r - 1];
      }
      // Add new empty row at the top
      this.grid[0] = Array(this.width).fill(null).map(() => ({ value: 0, color: 0 }));
    }
  
    public getGridState(): Block[][] {
      return this.grid.map(row => [...row]);
    }
  }