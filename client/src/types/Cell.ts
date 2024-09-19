// Cell.ts
import { Piece } from "./Piece";

export class Cell {
  id: string;
  piece: Piece | null;
  isStart: boolean;

  constructor(id: string, piece: Piece | null = null, isStart = false) {
    this.id = id;
    this.piece = piece;
    this.isStart = isStart;
  }

  setPiece(piece: Piece | null, isStart: boolean) {
    this.piece = piece;
    this.isStart = isStart;
  }
}