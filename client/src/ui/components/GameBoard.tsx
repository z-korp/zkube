import React, { useState, useEffect } from "react";
import { Card } from "@/ui/elements/ui/card";

interface Piece {
  id: number;
  width: number;
  element: string;
}

const PIECES: Piece[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];

interface Cell {
  id: string;
  pieceId: number | null;
  isStart: boolean;
}

const GameBoard = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const rows = 8;
  const cols = 6;

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({ id: `${i}-${j}`, pieceId: null, isStart: false });
      }
      newGrid.push(row);
    }
    console.log("Grid initialized:", newGrid);
    addRandomPieces(newGrid);
  };

  const addRandomPieces = (grid: Cell[][]) => {
    const newGrid = [...grid];
    for (let i = 0; i < rows; i++) {
      let j = 0;
      while (j < cols) {
        if (Math.random() < 0.3) {
          const piece = PIECES[Math.floor(Math.random() * PIECES.length)];
          if (j + piece.width <= cols) {
            placePiece(newGrid, i, j, piece);
            j += piece.width;
          } else {
            j++;
          }
        } else {
          j++;
        }
      }
    }
    setGrid(newGrid);
  };

  const placePiece = (
    grid: Cell[][],
    row: number,
    col: number,
    piece: Piece
  ) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = piece.id;
      grid[row][col + j].isStart = j === 0;
    }
  };

  const applyGravity = () => {
    const newGrid = [...grid];
    for (let col = 0; col < cols; col++) {
      let emptyRow = rows - 1;
      for (let row = rows - 1; row >= 0; row--) {
        if (newGrid[row][col].pieceId !== null) {
          if (row !== emptyRow) {
            const piece = PIECES.find(
              (p) => p.id === newGrid[row][col].pieceId
            );
            if (piece && newGrid[row][col].isStart) {
              for (let i = 0; i < piece.width; i++) {
                newGrid[emptyRow][col + i].pieceId =
                  newGrid[row][col + i].pieceId;
                newGrid[emptyRow][col + i].isStart = i === 0;
                newGrid[row][col + i].pieceId = null;
                newGrid[row][col + i].isStart = false;
              }
              emptyRow--;
              col += piece.width - 1; // Sauter les colonnes déjà traitées
            }
          } else {
            emptyRow--;
          }
        }
      }
    }
    setGrid(newGrid);
  };

  const fillEmptySpaces = () => {
    const newGrid = [...grid];
    for (let col = 0; col < cols; col++) {
      if (newGrid[0][col].pieceId === null) {
        const availableWidth = cols - col;
        const possiblePieces = PIECES.filter((p) => p.width <= availableWidth);
        if (possiblePieces.length > 0) {
          const piece =
            possiblePieces[Math.floor(Math.random() * possiblePieces.length)];
          placePiece(newGrid, 0, col, piece);
          col += piece.width - 1; // Sauter les colonnes déjà remplies
        }
      }
    }
    setGrid(newGrid);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    // Appliquer la gravité et remplir les espaces vides après un court délai
    setTimeout(() => {
      applyGravity();
      setTimeout(() => {
        fillEmptySpaces();
      }, 300);
    }, 100);
  };

  const [debugMode, setDebugMode] = useState(false);

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    return (
      <div
        key={cell.id}
        className={`relative w-12 h-12 bg-slate-700 flex items-center justify-center cursor-pointer ${
          piece ? getElementColor(piece.element) : ""
        }`}
        onClick={() => handleCellClick(rowIndex, colIndex)}
      >
        {debugMode && cell.pieceId !== null && (
          <div className="absolute bottom-0 right-0 text-xs text-white bg-black bg-opacity-50 p-1">
            id:{cell.pieceId}
            <br />
            start:{cell.isStart.toString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div className="mb-4">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Toggle Debug Mode
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))
        )}
      </div>
    </Card>
  );
};

// const getPieceColor = (pieceId: number): string => {
//   const piece = PIECES.find((p) => p.id === pieceId);
//   console.log(
//     `Piece color for id ${pieceId}:`,
//     piece ? piece.color : "not found"
//   ); // we'll need to change this as color is not dictated by size of the element
//   return piece ? piece.color : "";
// };

const getElementColor = (element: any) => {
  switch (element) {
    case "stone1":
      return "!bg-red-500";
    case "stone2":
      return "!bg-blue-500";
    case "stone3":
      return "!bg-green-500";
    case "stone4":
      return "!bg-yellow-500";
    default:
      return "";
  }
};

export default GameBoard;
