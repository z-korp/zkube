import React, { useState, useEffect, useRef, useCallback } from "react";
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
  const [debugMode, setDebugMode] = useState(false);
  const [draggingPiece, setDraggingPiece] = useState<{
    row: number;
    col: number;
    startX: number;
    currentX: number;
  } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    initializeGrid(initialGrid);
  }, [initialGrid]);

  const applyGravity = () => {
    let newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let changesMade = false;

    do {
      changesMade = false;
      for (let row = rows - 2; row >= 0; row--) {
        for (let col = 0; col < cols; col++) {
          if (newGrid[row][col].pieceId !== null && newGrid[row][col].isStart) {
            const piece = PIECES.find(
              (p) => p.id === newGrid[row][col].pieceId,
            );
            if (piece) {
              let canFall = true;
              for (let i = 0; i < piece.width; i++) {
                if (
                  col + i >= cols ||
                  newGrid[row + 1][col + i].pieceId !== null
                ) {
                  canFall = false;
                  break;
                }
              }

              if (canFall) {
                // Déplacer la pièce d'une ligne vers le bas
                for (let i = 0; i < piece.width; i++) {
                  newGrid[row + 1][col + i] = { ...newGrid[row][col + i] };
                  newGrid[row][col + i] = {
                    id: `${row}-${col + i}`,
                    pieceId: null,
                    isStart: false,
                  };
                }
                changesMade = true;
              }
            }
          }
        }
      }

      if (changesMade) {
        setGrid(newGrid);
        newGrid = newGrid.map((row) => row.map((cell) => ({ ...cell })));
      }
    } while (changesMade);
  };

  const placePiece = (
    grid: Cell[][],
    row: number,
    col: number,
    piece: Piece,
  ) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = piece.id;
      grid[row][col + j].isStart = j === 0;
    }
  };

  const checkCollision = (row: number, col: number, piece: Piece) => {
    if (col < 0 || col + piece.width > cols) return true;
    for (let i = 0; i < piece.width; i++) {
      if (col + i >= cols) return true;
      if (
        grid[row][col + i].pieceId !== null &&
        grid[row][col + i].pieceId !== piece.id
      ) {
        return true;
      }
    }
    return false;
  };

  const startDragging = (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent,
  ) => {
    const piece = PIECES.find((p) => p.id === grid[rowIndex][colIndex].pieceId);
    if (!piece) return;

    // Assurez-vous que nous commençons par la cellule de départ pour cette pièce
    let startCol = colIndex;
    while (
      startCol > 0 &&
      grid[rowIndex][startCol - 1].pieceId === piece.id &&
      !grid[rowIndex][startCol].isStart
    ) {
      startCol--;
    }

    const gridRect = gridRef.current?.getBoundingClientRect();
    const cellWidth = gridRect ? gridRect.width / cols : 0;
    const startX = gridRect ? gridRect.left + startCol * cellWidth : 0;

    // Calculez le décalage entre le point de clic et le début de la pièce
    const clickOffset = e.clientX - startX;

    setDraggingPiece({
      row: rowIndex,
      col: startCol,
      startX: startX,
      currentX: startX,
      clickOffset: clickOffset,
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggingPiece || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const cellWidth = gridRect.width / cols;
      const piece = PIECES.find(
        (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId,
      );
      if (!piece) return;

      let newX = e.clientX - draggingPiece.clickOffset;
      const totalDrag = newX - draggingPiece.startX;

      // Calculez la nouvelle colonne
      let newCol = draggingPiece.col + totalDrag / cellWidth;

      // Vérifiez les limites
      newCol = Math.max(0, Math.min(cols - piece.width, newCol));
      const leftCol = Math.floor(newCol);
      const rightCol = Math.ceil(newCol);
      // Vérifiez les collisions
      if (
        !checkCollision(draggingPiece.row, leftCol, piece) &&
        !checkCollision(draggingPiece.row, rightCol, piece)
      ) {
        // Si pas de collision, mettez à jour la position
        newX = draggingPiece.startX + (newCol - draggingPiece.col) * cellWidth;
        setDraggingPiece({ ...draggingPiece, currentX: newX });
      } else {
        // En cas de collision, trouvez la position valide la plus proche
        let validCol = draggingPiece.col;
        const direction = newCol > draggingPiece.col ? 1 : -1;
        while (
          validCol !== newCol &&
          !checkCollision(draggingPiece.row, validCol, piece)
        ) {
          validCol += direction;
        }
        validCol -= direction; // Reculez d'une case pour obtenir la dernière position valide

        newX =
          draggingPiece.startX + (validCol - draggingPiece.col) * cellWidth;
        setDraggingPiece({ ...draggingPiece, currentX: newX });
      }
    },
    [isDragging, draggingPiece, grid, cols],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !draggingPiece || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag = draggingPiece.currentX - draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, draggingPiece.col + draggedCells),
    );

    const newGrid = [...grid];

    console.log(draggingPiece.row, draggingPiece.col, newCol);
    console.log(grid[draggingPiece.row][draggingPiece.col]);
    const piece = PIECES.find(
      (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId,
    );
    if (piece && !checkCollision(draggingPiece.row, newCol, piece)) {
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
      setGrid(newGrid);
    }

    setDraggingPiece(null);
    setIsDragging(false);
  }, [isDragging, draggingPiece, grid, cols]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: Cell[][] = [];
    let uniqueIdCounter = 1;

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
      let j = 0;
      while (j < cols) {
        const currentPiece = grid[i][j].pieceId;
        if (currentPiece !== null) {
          const piece = PIECES.find((p) => p.id === currentPiece);
          if (piece) {
            // Marquer le début de la pièce
            grid[i][j].isStart = true;

            // Marquer le reste de la pièce comme non-début
            for (let k = 1; k < piece.width && j + k < cols; k++) {
              if (grid[i][j + k].pieceId === currentPiece) {
                grid[i][j + k].isStart = false;
              } else {
                break; // Si la pièce est interrompue, arrêter
              }
            }

            // Sauter à la fin de cette pièce
            j += piece.width;
          } else {
            // Si la pièce n'est pas trouvée dans PIECES, traiter comme une seule cellule
            grid[i][j].isStart = true;
            j++;
          }
        } else {
          grid[i][j].isStart = false;
          j++;
        }
      }
    }
  };

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    if (cell.isStart && piece) {
      const isDragging =
        draggingPiece?.row === rowIndex && draggingPiece.col === colIndex;

      const dragOffset = isDragging
        ? draggingPiece.currentX - draggingPiece.startX
        : 0;

      return (
        <div
          key={cell.id}
          className={`h-12 bg-secondary flex items-center justify-center cursor-move relative`}
          style={{
            ...getElementStyle(piece.element),
            gridColumn: `span ${piece.width * 4}`,
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            zIndex: 1000,
          }}
          onMouseDown={(e) => startDragging(rowIndex, colIndex, e)}
        >
          {debugMode && (
            <div className="absolute top-0 left-0 bg-black text-white text-xs p-1">
              {rowIndex}, {colIndex}
            </div>
          )}
        </div>
      );
    } else if (!cell.pieceId) {
      return (
        <div
          key={cell.id}
          className="h-12 w-12 bg-secondary relative"
          style={{ gridColumn: "span 4" }}
        >
          {debugMode && (
            <div className="absolute top-0 left-0 bg-black text-white text-xs p-1">
              {rowIndex}, {colIndex}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-4 bg-secondary">
      <div className="mb-4">
        <button
          onClick={applyGravity}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Apply Gravity
        </button>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          {debugMode ? "Disable Debug Mode" : "Enable Debug Mode"}
        </button>
      </div>
      <div className="bg-slate-800">
        <div
          ref={gridRef}
          className="border-4 border-slate-800 grid grid-cols-[repeat(32,1fr)] gap-1"
        >
          {grid.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map((cell, colIndex) =>
                renderCell(cell, rowIndex, colIndex),
              )}
            </React.Fragment>
          ))}
        </div>
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
