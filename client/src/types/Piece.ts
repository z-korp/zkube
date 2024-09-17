// Piece.ts
export class Piece {
    id: string;
    size: number;
    width: number;
    element: string;
  
    constructor(size: number, width: number, element: string) {
      this.id = crypto.randomUUID();
      this.size = size;
      this.width = width;
      this.element = element;
    }
  }