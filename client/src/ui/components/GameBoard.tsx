import React, { useState, useEffect } from 'react';
import { Card } from '@/ui/elements/ui/card';

import stone1Image from '/assets/block-1.png';
import stone2Image from '/assets/block-2.png';
import stone3Image from '/assets/block-3.png';
import stone4Image from '/assets/block-4.png';

interface Piece {
  id: number;
  width: number;
  element: string;
}

const PIECES: Piece[] = [
  { id: 1, width: 1, element: 'stone1' },
  { id: 2, width: 2, element: 'stone2' },
  { id: 3, width: 3, element: 'stone3' },
  { id: 4, width: 4, element: 'stone4' },
];

interface Cell {
  id: string;
  pieceId: number | null;
  isStart: boolean;
}

const GameBoard = ({ initialGrid }: { initialGrid: number[][] }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedPiece, setSelectedPiece] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const rows = 10;
  const cols = 8;

  useEffect(() => {
    initializeGrid(initialGrid);
  }, [initialGrid]);

  const handlePieceClick = (rowIndex: number, colIndex: number) => {
    if (selectedPiece && selectedPiece.row === rowIndex) {
      setSelectedPiece(null); // Désélectionner si déjà sélectionné
    } else {
      setSelectedPiece({ row: rowIndex, col: colIndex });
    }
  };

  const placePiece = (grid: Cell[][], row: number, col: number, piece: Piece) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = piece.id;
      grid[row][col + j].isStart = j === 0;
    }
  };

  const movePiece = (direction: 'left' | 'right') => {
    if (!selectedPiece) return;

    const { row, col } = selectedPiece;
    const piece = PIECES.find((p) => p.id === grid[row][col].pieceId);
    if (!piece) return;

    const newGrid = [...grid];
    const newCol = direction === 'left' ? col - 1 : col + 1;

    if (newCol >= 0 && newCol + piece.width <= cols) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        newGrid[row][col + i] = {
          id: `${row}-${col + i}`,
          pieceId: null,
          isStart: false,
        };
      }

      // Placer à la nouvelle position
      placePiece(newGrid, row, newCol, piece);

      setGrid(newGrid);
      setSelectedPiece({ row, col: newCol });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') movePiece('left');
      if (e.key === 'ArrowRight') movePiece('right');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPiece, grid]);

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        const value = initialGrid[i][j];
        row.push({ id: `${i}-${j}`, pieceId: value !== 0 ? value : null, isStart: false });
      }
      newGrid.push(row);
    }
    markStartingCells(newGrid);
    setGrid(newGrid);
  };

  const markStartingCells = (grid: Cell[][]) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const pieceId = grid[i][j].pieceId;
        if (pieceId !== null) {
          let isStart = true;
          for (let k = 1; k < pieceId; k++) {
            if (j + k < cols && grid[i][j + k].pieceId === pieceId) {
              grid[i][j + k].isStart = false;
            } else {
              isStart = false;
              break;
            }
          }
          grid[i][j].isStart = isStart;
        }
      }
    }
  };

  const [debugMode, setDebugMode] = useState(false);

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    if (cell.isStart && piece) {
      const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
      return (
        <div
          key={cell.id}
          className={`h-12 bg-slate-700 flex items-center justify-center cursor-pointer ${isSelected ? 'ring-2 ring-yellow-500' : ''}`}
          style={{
            ...getElementStyle(piece.element),
            gridColumn: `span ${piece.width * 4}`,
          }}
          onClick={() => handlePieceClick(rowIndex, colIndex)}
        ></div>
      );
    } else if (!cell.pieceId) {
      return <div key={cell.id} className="h-12 w-12 bg-slate-700" style={{ gridColumn: 'span 4' }} />;
    }
    return null;
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div className="mb-4">
        <button onClick={() => setDebugMode(!debugMode)} className="px-4 py-2 bg-blue-500 text-white rounded">
          Toggle Debug Mode
        </button>
        <button onClick={() => movePiece('left')} className="px-4 py-2 bg-green-500 text-white rounded ml-2">
          Move Left
        </button>
        <button onClick={() => movePiece('right')} className="px-4 py-2 bg-green-500 text-white rounded ml-2">
          Move Right
        </button>
      </div>
      <div className="grid grid-cols-[repeat(32,1fr)] gap-1">
        {grid.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

const getElementStyle = (element: string) => {
  switch (element) {
    case 'stone1':
      return {
        backgroundImage: `url(${stone1Image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    case 'stone2':
      return {
        backgroundImage: `url(${stone2Image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    case 'stone3':
      return {
        backgroundImage: `url(${stone3Image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    case 'stone4':
      return {
        backgroundImage: `url(${stone4Image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    default:
      return {};
  }
};

export default GameBoard;
