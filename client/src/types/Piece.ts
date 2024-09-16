// Piece.ts
export class Piece {
    id: number;
    width: number;
    element: string;
  
    constructor(id: number, width: number, element: string) {
      this.id = id;
      this.width = width;
      this.element = element;
    }
  }