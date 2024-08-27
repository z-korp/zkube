// useGameLogic.ts
import { useState, useRef, useEffect, useCallback } from "react";

import { Account } from "starknet";
import useAccountCustom from "./useAccountCustom";
import { useDojo } from "@/dojo/useDojo";

interface CellType {
  id: string;
  pieceId: string | null;
  isStart: boolean;
}

interface GameState {
  grid: CellType[][];
  isLoading: boolean;
  isTxProcessing: boolean;
  debugMode: boolean;
  isAnimating: boolean;
  isFalling: boolean;
  draggingPiece: {
    row: number;
    col: number;
    startX: number;
    currentX: number;
    clickOffset: number;
  } | null;
  isDragging: boolean;
  bonusWave: boolean;
  bonusTiki: boolean;
  bonusHammer: boolean;
  clickedPieceId: number | null;
}
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

const useGameLogic = (initialGrid: CellType[][]) => {
  const {
    setup: {
      systemCalls: { move, applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();
  const [gameState, setGameState] = useState<GameState>({
    grid: initialGrid,
    isLoading: false,
    isTxProcessing: false,
    debugMode: false,
    isAnimating: false,
    isFalling: false,
    draggingPiece: null,
    isDragging: false,
    bonusWave: false,
    bonusTiki: false,
    bonusHammer: false,
    clickedPieceId: null,
  });

  interface Piece {
    id: number;
    width: number;
    element: string;
  }

  const stateGridRef = useRef(gameState.grid);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  const applyGravity = useCallback(async () => {
    let changesMade = false;

    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );
      changesMade = false;

      for (let row = rows - 2; row >= 0; row--) {
        for (let col = 0; col < cols; col++) {
          if (newGrid[row][col].pieceId !== null && newGrid[row][col].isStart) {
            const piece = PIECES.find(
              (p) => String(p.id) === newGrid[row][col].pieceId
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
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });

    return changesMade;
  }, []);

  const applyGravityLoop = useCallback(async () => {
    // Implement applyGravityLoop logic
    setGameState((prevState) => ({
      ...prevState,
      isAnimating: true,
      isFalling: true,
    }));

    let rowsCleared = true;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        changesMade = await applyGravity();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      setGameState((prevState) => ({
        ...prevState,
        isFalling: false,
      }));

      await new Promise((resolve) => setTimeout(resolve, 200));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    await new Promise((resolve) => setTimeout(resolve, 200));

    //Si aucun bonus n'est utilisé alors nouvelle ligne
    if (
      !gameState.bonusHammer &&
      !gameState.bonusTiki &&
      !gameState.bonusWave
    ) {
      await insertNewLine();
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    rowsCleared = true;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        setGameState((prevState) => ({
          ...prevState,
          isFalling: true,
        }));
        changesMade = await applyGravity();
        setGameState((prevState) => ({
          ...prevState,
          isFalling: false,
        }));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (isGridEmpty(stateGridRef.current)) {
      handleEmptyGrid();

      await new Promise((resolve) => setTimeout(resolve, 200));

      await insertNewLine();

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setGameState((prevState) => ({
      ...prevState,
      isAnimating: false,
    }));
  }, []);

  const checkAndClearFullLines = useCallback(async () => {
    let rowsCleared = false;
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

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
      stateGridRef.current = newGrid;
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });
    return rowsCleared;
  }, []);

  const insertNewLines = useCallback(async () => {
    console.log("insertNewLine");
    await new Promise((resolve) => {
      // Créez une nouvelle grille en décalant toutes les lignes vers le haut
      const newGrid = gameState.grid.slice(1);

      // Créez la nouvelle ligne à partir de nextLine
      const newLine: CellType[] = nextLine.map((value, index) => ({
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
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });
  }, []);

  const loopGravityAndClear = useCallback(() => {
    applyGravityLoop();
  }, []);

  const checkCollision = useCallback(
    (row: number, startCol: number, endCol: number, piece: Piece) => {
      const direction = endCol > startCol ? 1 : -1;
      for (let col = startCol; col !== endCol; col += direction) {
        if (col < 0 || col + piece.width > cols) return true;
        const current: CellType = gameState.grid[row][col];
        const left: CellType = gameState.grid[row][col - 1];
        const right: CellType = gameState.grid[row][col + piece.width];
        if (
          direction === -1
            ? !!left?.pieceIndex && left.pieceIndex !== current.pieceIndex
            : !!right?.pieceIndex && right.pieceIndex !== current.pieceIndex
        ) {
          return true;
        }
      }
      return false;
    },
    []
  );

  const startDragging = useCallback(
    (rowIndex: number, colIndex: number, e: any) => {
      if (gameState.isAnimating) return;
      const piece = PIECES.find(
        (p) => String(p.id) === gameState.grid[rowIndex][colIndex].pieceId
      );
      if (!piece) return;

      // Assurez-vous que nous commençons par la cellule de départ pour cette pièce
      let startCol = colIndex;
      while (
        startCol > 0 &&
        gameState.grid[rowIndex][startCol - 1].pieceId === String(piece.id) &&
        !gameState.grid[rowIndex][startCol].isStart
      ) {
        startCol--;
      }

      const gridRect = gridRef.current?.getBoundingClientRect();
      const cellWidth = gridRect ? gridRect.width / cols : 0;
      const startX = gridRect ? gridRect.left + startCol * cellWidth : 0;

      // Calculez le décalage entre le point de clic et le début de la pièce
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clickOffset = clientX - startX;
      setGameState((prevState) => ({
        ...prevState,
        draggingPiece: {
          row: rowIndex,
          col: startCol,
          startX: startX,
          currentX: startX,
          clickOffset: clickOffset,
        },
        isDragging: true,
      }));
    },
    []
  );

  const computeXAndDrag = useCallback((e: any) => {
    if (gridRef.current === null || gameState.draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    let currentDraggingPiece = gameState.draggingPiece;
    const piece = PIECES.find(
      (p) =>
        String(p.id) ===
        gameState.grid[currentDraggingPiece?.row][currentDraggingPiece.col]
          .pieceId
    );
    if (!piece) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let newX = clientX - gameState.draggingPiece.clickOffset;

    const totalDrag = newX - gameState.draggingPiece.startX;

    // Calculez la nouvelle colonne
    let newCol = Math.round(
      gameState.draggingPiece.col + totalDrag / cellWidth
    );

    // Vérifiez les limites
    newCol = Math.max(0, Math.min(cols - piece.width, newCol));

    // Vérifiez les collisions sur tout le chemin
    if (
      !checkCollision(
        gameState.draggingPiece.row,
        gameState.draggingPiece.col,
        newCol,
        piece
      )
    ) {
      // Si pas de collision, mettez à jour la position
      newX =
        gameState.draggingPiece.startX +
        (newCol - gameState.draggingPiece.col) * cellWidth;
      currentDraggingPiece = gameState.draggingPiece;
      setGameState((prevState) => ({
        ...prevState,
        draggingPiece: {
          ...currentDraggingPiece,
          currentX: newX,
          col: newCol,
        },
      }));
    } else {
      // En cas de collision, trouvez la position valide la plus proche
      let validCol = gameState.draggingPiece.col;
      const direction = newCol > gameState.draggingPiece.col ? 1 : -1;
      while (
        validCol !== newCol &&
        !checkCollision(
          gameState.draggingPiece.row,
          gameState.draggingPiece.col,
          validCol + direction,
          piece
        )
      ) {
        validCol += direction;
      }

      newX =
        gameState.draggingPiece.startX +
        (validCol - gameState.draggingPiece.col) * cellWidth;
      setGameState((prevState) => ({
        ...prevState,
        draggingPiece: {
          ...currentDraggingPiece,
          currentX: newX,
          col: validCol,
        },
      }));
    }
  }, []);

  const setPieceToNewPositionAndTx = useCallback(() => {
    if (gridRef.current === null || gameState.draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag =
      gameState.draggingPiece.currentX - gameState.draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, gameState.draggingPiece.col + draggedCells)
    );

    const newGrid = [...gameState.grid];
    let currentDraggingPiece = gameState.draggingPiece;

    const piece = PIECES.find(
      (p) =>
        String(p.id) ===
        gameState.grid[currentDraggingPiece.row][currentDraggingPiece.col]
          .pieceId
    );
    if (
      piece &&
      !checkCollision(
        gameState.draggingPiece.row,
        gameState.draggingPiece.col,
        newCol,
        piece
      )
    ) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        const oldCol = gameState.draggingPiece.col + i;
        if (oldCol < cols) {
          newGrid[gameState.draggingPiece.row][oldCol] = {
            id: `${gameState.draggingPiece.row}-${oldCol}`,
            pieceId: null,
            isStart: false,
            pieceIndex: null,
          };
        }
      }

      // Placer à la nouvelle position
      const finalCol = Math.min(newCol, cols - piece.width);
      placePiece(newGrid, gameState.draggingPiece.row, finalCol, piece);
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      if (gameState.draggingPiece.col !== finalCol) {
        loopGravityAndClear();
      }

      // Send move tx
      handleMove(
        rows - gameState.draggingPiece.row - 1,
        gameState.draggingPiece.col,
        finalCol
      );
    }

    setGameState((prevState) => ({
      ...prevState,
      draggingPiece: null,
      isDragging: false,
    }));
  }, []);

  const placePiece = (
    grid: CellType[][],
    row: number,
    col: number,
    piece: Piece
  ) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = String(piece.id);
      grid[row][col + j].isStart = j === 0;
      grid[row][col + j].pieceIndex = row * cols + col;
    }
  };

  const handleMove = useCallback(
    async (rowIndex: number, startIndex: number, finalOndex: number) => {
      if (startIndex === finalOndex) return;
      if (gameState.isAnimating) return;
      if (!account) return;

      setGameState((prevState) => ({
        ...prevState,
        isLoading: true,
        isTxProcessing: true,
      }));
      try {
        await move({
          account: account as Account,
          row_index: rowIndex,
          start_index: startIndex,
          final_index: finalOndex,
        });
      } finally {
        setGameState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
      }
    },
    [account]
  );

  return {
    gameState,
    setGameState,
    applyGravity,
    applyGravityLoop,
    checkAndClearFullLines,
    insertNewLines,
    loopGravityAndClear,
    checkCollision,
    startDragging,
    computeXAndDrag,
    setPieceToNewPositionAndTx,
    gridRef,
    rows,
    cols,
  };
};

export default useGameLogic;
