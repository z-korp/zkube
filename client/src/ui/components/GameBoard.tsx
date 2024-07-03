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

const GameBoard = () => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const rows = 10;
  const cols = 8;

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
    console.log('Grid initialized:', newGrid);
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

  const placePiece = (grid: Cell[][], row: number, col: number, piece: Piece) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = piece.id;
      grid[row][col + j].isStart = j === 0;
    }
  };

  const [debugMode, setDebugMode] = useState(false);

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    if (cell.isStart && piece) {
      return (
        <div
          key={cell.id}
          className={'h-12 bg-slate-700 flex items-center justify-center cursor-pointer'}
          style={{
            ...getElementStyle(piece.element),
            gridColumn: `span ${piece.width * 4}`,
          }}
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
      return { backgroundImage: `url(${stone1Image})`, backgroundSize: 'cover' };
    case 'stone2':
      return { backgroundImage: `url(${stone2Image})`, backgroundSize: 'cover' };
    case 'stone3':
      return { backgroundImage: `url(${stone3Image})`, backgroundSize: 'cover' };
    case 'stone4':
      return { backgroundImage: `url(${stone4Image})`, backgroundSize: 'cover' };
    default:
      return {};
  }
};

export default GameBoard;
