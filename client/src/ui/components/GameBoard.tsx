import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/ui/elements/ui/card";

import stone1Image from "/assets/block-1.png";
import stone2Image from "/assets/block-2.png";
import stone3Image from "/assets/block-3.png";
import stone4Image from "/assets/block-4.png";

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

const GameBoard = ({ initialGrid }: { initialGrid: number[][] }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [draggingPiece, setDraggingPiece] = useState<{
    row: number;
    col: number;
    startX: number;
    currentX: number;
  } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeGrid(initialGrid);
  }, [initialGrid]);

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

  const startDragging = (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent
  ) => {
    setDraggingPiece({
      row: rowIndex,
      col: colIndex,
      startX: e.clientX,
      currentX: e.clientX,
    });
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!draggingPiece) return;
    setDraggingPiece({ ...draggingPiece, currentX: e.clientX });
  };

  const endDragging = () => {
    if (!draggingPiece || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag = draggingPiece.currentX - draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, draggingPiece.col + draggedCells)
    );

    const newGrid = [...grid];
    const piece = PIECES.find(
      (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId
    );
    if (piece) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        const oldCol = draggingPiece.col + i;
        if (oldCol < cols) {
          newGrid[draggingPiece.row][oldCol] = {
            id: `${draggingPiece.row}-${oldCol}`,
            pieceId: null,
            isStart: false,
          };
        }
      }

      // Placer à la nouvelle position
      const finalCol = Math.min(newCol, cols - piece.width);
      placePiece(newGrid, draggingPiece.row, finalCol, piece);
    }

    setGrid(newGrid);
    setDraggingPiece(null);
  };

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        const value = initialGrid[i][j];
        row.push({
          id: `${i}-${j}`,
          pieceId: value !== 0 ? value : null,
          isStart: false,
        });
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
      const isDragging =
        draggingPiece?.row === rowIndex && draggingPiece?.col === colIndex;
      const dragOffset = isDragging
        ? draggingPiece.currentX - draggingPiece.startX
        : 0;

      return (
        <div
          key={cell.id}
          className={`h-12 bg-slate-700 flex items-center justify-center cursor-move`}
          style={{
            ...getElementStyle(piece.element),
            gridColumn: `span ${piece.width * 4}`,
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
          onMouseDown={(e) => startDragging(rowIndex, colIndex, e)}
        ></div>
      );
    } else if (!cell.pieceId) {
      return (
        <div
          key={cell.id}
          className="h-12 w-12 bg-slate-700"
          style={{ gridColumn: "span 4" }}
        />
      );
    }
    return null;
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div
        ref={gridRef}
        className="grid grid-cols-[repeat(32,1fr)] gap-1"
        onMouseMove={onDrag}
        onMouseUp={endDragging}
        onMouseLeave={endDragging}
      >
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
    case "stone1":
      return {
        backgroundImage: `url(${stone1Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone2":
      return {
        backgroundImage: `url(${stone2Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone3":
      return {
        backgroundImage: `url(${stone3Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone4":
      return {
        backgroundImage: `url(${stone4Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    default:
      return {};
  }
};

export default GameBoard;
