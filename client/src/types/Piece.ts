// Piece.ts
export class Piece {
    id: string;
    width: number;
    element: string;
  
    constructor(size: number, width: number, element: string) {
      this.id = crypto.randomUUID();
      this.width = width;
      this.element = element;
    }
  }