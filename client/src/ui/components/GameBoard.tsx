import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";

import stone1Image from "/assets/block-1.png";
import stone2Image from "/assets/block-2.png";
import stone3Image from "/assets/block-3.png";
import stone4Image from "/assets/block-4.png";
import { useMediaQuery } from "react-responsive";
import { set } from "mobx";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKhanda, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";

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
  pieceIndex: number | null;
}

const GameBoard = ({
  initialGrid,
  nextLine,
  score,
  combo,
}: {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
}) => {
  const {
    account: { account },
    setup: {
      systemCalls: { move },
    },
  } = useDojo();

  const [isLoading, setIsLoading] = useState(false);
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [draggingPiece, setDraggingPiece] = useState<{
    row: number;
    col: number;
    startX: number;
    currentX: number;
    clickOffset: number;
  } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isAnimating) return;
    initializeGrid(initialGrid);
  }, [initialGrid, isAnimating]);

  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });

  const printGrid = (grid: Cell[][]) => {
    for (const row of grid) {
      let rowStr = "";
      for (const cell of row) {
        if (cell.isStart) {
          rowStr += "[S] "; // S pour Start
        } else if (cell.pieceId !== null) {
          rowStr += `[${cell.pieceId}] `;
        } else {
          rowStr += "[ ] ";
        }
      }
      console.log(rowStr);
    }
  };

  const applyGravity = async () => {
    let changesMade = false;

    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));
        changesMade = false;

        for (let row = rows - 2; row >= 0; row--) {
          for (let col = 0; col < cols; col++) {
            if (
              newGrid[row][col].pieceId !== null &&
              newGrid[row][col].isStart
            ) {
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
                      pieceIndex: null,
                    };
                  }
                  changesMade = true;
                }
              }
            }
          }
        }
        resolve(newGrid);
        return newGrid;
      });
    });

    return changesMade;
  };

  // Fonction pour appliquer la gravité en boucle tant qu'il y a des changements
  const applyGravityLoop = async () => {
    setIsAnimating(true);
    let rowsCleared = true;
    let count = 0;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        changesMade = await applyGravity();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    await insertNewLine();

    rowsCleared = true;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        changesMade = await applyGravity();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    setIsAnimating(false);
  };

  const checkAndClearFullLines = async () => {
    let rowsCleared = false;
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

        for (let row = 0; row < rows; row++) {
          if (newGrid[row].every((cell) => cell.pieceId !== null)) {
            // Ligne complète, on la supprime
            rowsCleared = true;
            for (let i = row; i > 0; i--) {
              newGrid[i] = newGrid[i - 1].map((cell) => ({
                ...cell,
                id: `${i}-${cell.id.split("-")[1]}`,
              }));
            }
            // Vider la première ligne
            newGrid[0] = newGrid[0].map((cell, col) => ({
              id: `0-${col}`,
              pieceId: null,
              isStart: false,
              pieceIndex: null,
            }));
          }
        }

        resolve(newGrid);
        return newGrid;
      });
    });
    return rowsCleared;
  };

  const checkAndClearFullLinesFromBot = async () => {
    let rowsCleared = false;
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

        for (let row = rows - 1; row >= 0; row--) {
          if (newGrid[row].every((cell) => cell.pieceId !== null)) {
            // Ligne complète, on la supprime
            rowsCleared = true;
            for (let i = row; i > 0; i--) {
              newGrid[i] = newGrid[i - 1].map((cell) => ({
                ...cell,
                id: `${i}-${cell.id.split("-")[1]}`,
              }));
            }
            // Vider la première ligne
            newGrid[0] = newGrid[0].map((cell, col) => ({
              id: `0-${col}`,
              pieceId: null,
              isStart: false,
            }));
            break;
          }
        }

        resolve(newGrid);
        return newGrid;
      });
    });

    return rowsCleared;
  };

  const insertNewLine = async () => {
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        // Créez une nouvelle grille en décalant toutes les lignes vers le haut
        const newGrid = prevGrid.slice(1);

        // Créez la nouvelle ligne à partir de nextLine
        const newLine: Cell[] = nextLine.map((value, index) => ({
          id: `${rows - 1}-${index}`,
          pieceId: value !== 0 ? value : null,
          isStart: false,
          pieceIndex: null,
        }));

        // Ajoutez la nouvelle ligne en bas de la grille
        newGrid.push(newLine);

        // Mettez à jour les isStart pour la nouvelle ligne
        markStartingCells(newGrid);

        resolve(newGrid);

        return newGrid;
      });
    });
  };

  const loopGravityAndClear = async () => {
    applyGravityLoop();
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
      grid[row][col + j].pieceIndex = row * cols + col;
    }
  };

  const checkCollision = (
    row: number,
    startCol: number,
    endCol: number,
    piece: Piece,
  ) => {
    const direction = endCol > startCol ? 1 : -1;
    for (let col = startCol; col !== endCol; col += direction) {
      if (col < 0 || col + piece.width > cols) return true;
      const current: Cell = grid[row][col];
      const left: Cell = grid[row][col - 1];
      const right: Cell = grid[row][col + piece.width];
      if (
        direction === -1
          ? !!left?.pieceIndex && left.pieceIndex !== current.pieceIndex
          : !!right?.pieceIndex && right.pieceIndex !== current.pieceIndex
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
    if (isAnimating) return;
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
      if (isAnimating) return;

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
      let newCol = Math.round(draggingPiece.col + totalDrag / cellWidth);

      // Vérifiez les limites
      newCol = Math.max(0, Math.min(cols - piece.width, newCol));

      // Vérifiez les collisions sur tout le chemin
      if (
        !checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)
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
          !checkCollision(
            draggingPiece.row,
            draggingPiece.col,
            validCol + direction,
            piece,
          )
        ) {
          validCol += direction;
        }

        newX =
          draggingPiece.startX + (validCol - draggingPiece.col) * cellWidth;
        setDraggingPiece({ ...draggingPiece, currentX: newX });
      }
    },
    [isDragging, draggingPiece, grid, cols],
  );

  const handleMove = useCallback(
    async (rowIndex: number, startIndex: number, finalOndex: number) => {
      if (startIndex === finalOndex) return;
      if (isAnimating) return;

      setIsLoading(true);
      try {
        await move({
          account: account,
          row_index: rowIndex,
          start_index: startIndex,
          final_index: finalOndex,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account],
  );

  const handleMouseUp = useCallback(() => {
    if (isAnimating) return;

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

    const piece = PIECES.find(
      (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId,
    );
    if (
      piece &&
      !checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)
    ) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        const oldCol = draggingPiece.col + i;
        if (oldCol < cols) {
          newGrid[draggingPiece.row][oldCol] = {
            id: `${draggingPiece.row}-${oldCol}`,
            pieceId: null,
            isStart: false,
            pieceIndex: null,
          };
        }
      }

      // Placer à la nouvelle position
      const finalCol = Math.min(newCol, cols - piece.width);
      placePiece(newGrid, draggingPiece.row, finalCol, piece);
      setGrid(newGrid);
      loopGravityAndClear();

      // Send move tx
      handleMove(rows - draggingPiece.row - 1, draggingPiece.col, finalCol);
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
          pieceIndex: null,
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
            const pieceIndex = i * cols + j;
            grid[i][j].isStart = true;
            grid[i][j].pieceIndex = pieceIndex;

            // Marquer le reste de la pièce comme non-début
            for (let k = 1; k < piece.width && j + k < cols; k++) {
              grid[i][j + k].isStart = false;
              grid[i][j + k].pieceIndex = pieceIndex;
            }

            // Sauter à la fin de cette pièce
            j += piece.width;
          } else {
            // Si la pièce n'est pas trouvée dans PIECES, traiter comme une seule cellule
            throw new Error(`Piece not found for id: ${currentPiece}`);
          }
        } else {
          grid[i][j].isStart = false;
          j++;
        }
      }
    }
  };

  const isLineComplete = (row) => {
    return row.every((cell) => cell.pieceId !== null);
  };

  const renderCell = (
    cell: Cell,
    rowIndex: number,
    colIndex: number,
    isLineComplete,
  ) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    if (cell.isStart && piece) {
      const isDragging =
        draggingPiece?.row === rowIndex && draggingPiece.col === colIndex;

      const dragOffset = isDragging
        ? draggingPiece.currentX - draggingPiece.startX
        : 0;

      const gridRect = gridRef.current?.getBoundingClientRect();
      const cellWidth = gridRect ? gridRect.width / cols : 0;
      const cellHeight = gridRect ? gridRect.height / rows : 0;

      const offsetGap = isSmallScreen ? 4 : 2;
      return (
        <div
          key={cell.id}
          className={`bg-secondary flex items-center justify-center cursor-move absolute ${isLineComplete ? "wiggle-blink" : ""}`}
          style={{
            ...getElementStyle(piece.element),
            width: `${piece.width * cellWidth}px`,
            height: `${cellHeight}px`,
            left: `${colIndex * cellWidth - offsetGap}px`,
            top: `${rowIndex * cellHeight - offsetGap}px`,
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
            zIndex: isDragging ? 1000 : 500,
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
    }
    return null;
  };

  return (
    <Card className="p-4 bg-secondary">
      <div className="mb-4 flex justify-start items-center">
        <GameBonus />
        <div className="grow text-4xl flex gap-2 justify-end">
          {score}
          <FontAwesomeIcon icon={faStar} className="text-yellow-500 ml-2" />
        </div>
        <div className="grow text-4xl flex gap-2 justify-end">
          {combo}
          <FontAwesomeIcon icon={faKhanda} className="text-slate-500 ml-2" />
        </div>
      </div>
      <div className="bg-slate-800 relative">
        <div
          ref={gridRef}
          className="border-4 border-slate-800 grid grid-cols-[repeat(32,1fr)] sm:gap-2 gap-[2px]"
          style={{ position: "relative" }}
        >
          {/* Grille de fond */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="h-10 w-10 sm:h-12 sm:w-12 bg-secondary relative"
                  style={{ gridColumn: "span 4" }}
                >
                  {debugMode && (
                    <div className="absolute top-0 left-0 bg-black text-white text-xs p-1">
                      {rowIndex}, {colIndex}
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Pièces placées */}
          {grid.map((row, rowIndex) => {
            const complete = isLineComplete(row);
            return (
              <React.Fragment key={`piece-${rowIndex}`}>
                {row.map((cell, colIndex) =>
                  renderCell(cell, rowIndex, colIndex, complete),
                )}
              </React.Fragment>
            );
          })}
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
