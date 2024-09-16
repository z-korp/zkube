// Cell.ts
import { Piece } from "./Piece";

export class Cell {
  id: string;
  piece: Piece | null; // Utiliser une référence à une pièce
  isStart: boolean;
  pieceIndex: number | null;

  constructor(id: string, piece: Piece | null = null, isStart = false, pieceIndex: number | null = null) {
    this.id = id;
    this.piece = piece;
    this.isStart = isStart;
    this.pieceIndex = pieceIndex;
  }

  setPiece(piece: Piece | null, isStart: boolean, pieceIndex: number | null) {
    this.piece = piece;
    this.isStart = isStart;
    this.pieceIndex = pieceIndex;
  }
}