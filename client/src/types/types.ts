export interface Cell {
  id: string;
  pieceId: number | null;
  isStart: boolean;
}

export interface PriceData {
  id: number;
  width: number;
  element: string;
}

export const PIECES: PriceData[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];
