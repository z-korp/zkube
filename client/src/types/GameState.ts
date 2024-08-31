import { Cell, Piece } from "./types";

export interface GameState {
  grid: Cell[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  isAnimating: boolean;
  isTxProcessing: boolean;
  isDragging: boolean;
  draggingPiece: {
    row: number;
    col: number;
    startX: number;
    currentX: number;
    clickOffset: number;
  } | null;
  bonusWave: boolean;
  bonusTiki: boolean;
  bonusHammer: boolean;
}
