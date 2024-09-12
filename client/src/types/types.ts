export interface Cell {
  id: string;
  pieceId: number | null;
  isStart: boolean;
  pieceIndex: number | null;
}

export interface Piece {
  id: number;
  width: number;
  element: string;
}

export interface PieceNew {
  id: number;           
  type: number;         
  width: number;        
  row: number;          
  col: number;          
  element: string;      
  isMoving: boolean;    
  isFalling: boolean;   
  isClearing: boolean; 
}

export const PIECE_TYPES: Omit<PieceNew, 'id' | 'row' | 'col' | 'isMoving' | 'isFalling' | 'isClearing'>[] = [
  { type: 1, width: 1, element: "stone1" },
  { type: 2, width: 2, element: "stone2" },
  { type: 3, width: 3, element: "stone3" },
  { type: 4, width: 4, element: "stone4" },
];
