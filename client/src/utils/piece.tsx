import { Cell, PIECE_TYPES, PieceNew } from "@/types/types";

const generateUniqueId = (): number => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };
  
  export const createPiece = (type: number, row: number, col: number): PieceNew => {
    const pieceType = PIECE_TYPES.find(p => p.type === type);
    if (!pieceType) throw new Error(`Invalid piece type: ${type}`);
    
    return {
      id: generateUniqueId(),
      ...pieceType,
      row,
      col,
      isMoving: false,
      isFalling: false,
      isClearing: false,
    };
  };
  
  export const convertGridToPieces = (grid: Cell[][]): PieceNew[] => {
    const pieces: PieceNew[] = [];
    const rows = grid.length;
    const cols = grid[0].length;
  
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];
        if (cell.pieceId !== null && cell.isStart) {
          const pieceType = PIECE_TYPES.find(p => p.type === cell.pieceId);
          if (pieceType) {
            pieces.push(createPiece(cell.pieceId, row, col));
          }
        }
      }
    }
  
    return pieces;
  };
  
  // Convertit un tableau de PieceNew en une grille de Cell
  export const convertPiecesToGrid = (pieces: PieceNew[], rows: number, cols: number): Cell[][] => {
    const grid: Cell[][] = Array(rows).fill(null).map((_, row) => 
      Array(cols).fill(null).map((_, col) => ({
        id: `${row}-${col}`,
        pieceId: null,
        isStart: false,
        pieceIndex: null,
      }))
    );
  
    pieces.forEach(piece => {
      for (let i = 0; i < piece.width; i++) {
        if (piece.row >= 0 && piece.row < rows && piece.col + i >= 0 && piece.col + i < cols) {
          grid[piece.row][piece.col + i] = {
            id: `${piece.row}-${piece.col + i}`,
            pieceId: piece.type,
            isStart: i === 0,
            pieceIndex: piece.id,
          };
        }
      }
    });
  
    return grid;
  };
  
  export const updateGridWithPieces = (grid: Cell[][], pieces: PieceNew[]): Cell[][] => {
    // Créer une nouvelle grille vide
    const newGrid: Cell[][] = grid.map(row => 
      row.map(cell => ({
        id: cell.id,
        pieceId: null,
        isStart: false,
        pieceIndex: null
      }))
    );
  
    // Placer les pièces dans la grille
    pieces.forEach(piece => {
      for (let i = 0; i < piece.width; i++) {
        if (piece.row >= 0 && piece.row < newGrid.length && 
            piece.col + i >= 0 && piece.col + i < newGrid[0].length) {
          newGrid[piece.row][piece.col + i] = {
            id: `${piece.row}-${piece.col + i}`,
            pieceId: piece.type,
            isStart: i === 0,
            pieceIndex: piece.id
          };
        }
      }
    });
  
    return newGrid;
  };
  
  // Trouve une pièce dans le tableau de pièces à partir des coordonnées d'une cellule
  export const findPieceAtCell = (pieces: PieceNew[], row: number, col: number): PieceNew | undefined => {
    return pieces.find(piece => 
      piece.row === row && col >= piece.col && col < piece.col + piece.width
    );
  };
  
  // Vérifie si une position est valide pour une pièce
  export const isValidPosition = (piece: PieceNew, grid: Cell[][]): boolean => {
    const rows = grid.length;
    const cols = grid[0].length;
  
    if (piece.row < 0 || piece.row >= rows || piece.col < 0 || piece.col + piece.width > cols) {
      return false;
    }
  
    for (let i = 0; i < piece.width; i++) {
      const cell = grid[piece.row][piece.col + i];
      if (cell.pieceId !== null && cell.pieceIndex !== piece.id) {
        return false;
      }
    }
  
    return true;
  };