import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";

import { GameBonus } from "../containers/GameBonus";
import { Piece, Cell as CellType } from "@/types/types";
import Cell from "./Cell";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import PlayerPanel from "./PlayerPanel";

//NOTE : Row commence en bas de la grille.
//NOTE : Back : PieceId numéro de la piece dans la ligne (de gauche à droite)

const PIECES: Piece[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
  score: number;
  combo: number;
  maxCombo: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
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

const GameBoard: React.FC<GameBoardProps> = ({
  initialGrid,
  nextLine,
  score,
  combo,
  maxCombo,
  waveCount,
  hammerCount,
  totemCount,
}) => {
  const {
    setup: {
      systemCalls: { move, applyBonus },
    },
  } = useDojo();
  const { account } = useAccountCustom();

  const [gameState, setGameState] = useState<GameState>({
    grid: [],
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

  // const [isLoading, setIsLoading] = useState(false);
  // const [grid, setGrid] = useState<CellType[][]>([]);
  // const stateGridRef = useRef(grid);
  // const [isTxProcessing, setIsTxProcessing] = useState(false);
  // const [debugMode, setDebugMode] = useState(false);
  // const [isAnimating, setIsAnimating] = useState(false);
  // const [isFalling, setIsFalling] = useState(false);
  // const [draggingPiece, setDraggingPiece] = useState<{
  //   row: number;
  //   col: number;
  //   startX: number;
  //   currentX: number;
  //   clickOffset: number;
  // } | null>(null);
  const stateGridRef = useRef(gameState.grid);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  // const [isDragging, setIsDragging] = useState(false);
  // const [bonusWave, setBonusWave] = useState(false);
  // const [bonusTiki, setBonusTiki] = useState(false);
  // const [bonusHammer, setBonusHammer] = useState(false);
  // const [clickedPieceId, setClickedPieceId] = useState<number | null>(null);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  useEffect(() => {
    setGameState((prevState) => ({
      ...prevState,
      isTxProcessing: false,
    }));
  }, [initialGrid]);

  useEffect(() => {
    if (gameState.isAnimating || gameState.isTxProcessing) return;
    initializeGrid(initialGrid);
  }, [initialGrid, gameState.isAnimating, gameState.isTxProcessing]);

  const printGrid = (grid: CellType[][]) => {
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
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );
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
  };

  // Fonction pour appliquer la gravité en boucle tant qu'il y a des changements
  const applyGravityLoop = async () => {
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
  };

  const checkAndClearFullLines = async () => {
    let rowsCleared = false;
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
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
  };

  const checkAndClearFullLinesFromBot = async () => {
    let rowsCleared = false;
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );

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
            pieceIndex: null,
          }));
          break;
        }
      }

      resolve(newGrid);
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });

    return rowsCleared;
  };

  const clearSelectedLine = async (selectedRow: number) => {
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );

      // Vérifier et supprimer tous les blocs assignés de la ligne sélectionnée
      if (selectedRow >= 0 && selectedRow < newGrid.length) {
        newGrid[selectedRow] = newGrid[selectedRow].map((cell, col) => ({
          id: `${selectedRow}-${col}`,
          pieceId: null,
          isStart: false,
          pieceIndex: null,
        }));
      }

      resolve(newGrid);
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });
  };

  const insertNewLine = async () => {
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
  };

  const loopGravityAndClear = async () => {
    applyGravityLoop();
  };

  const placePiece = (
    grid: CellType[][],
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
  };

  function startDragging(rowIndex: number, colIndex: number, e: any) {
    if (gameState.isAnimating) return;
    const piece = PIECES.find(
      (p) => p.id === gameState.grid[rowIndex][colIndex].pieceId,
    );
    if (!piece) return;

    // Assurez-vous que nous commençons par la cellule de départ pour cette pièce
    let startCol = colIndex;
    while (
      startCol > 0 &&
      gameState.grid[rowIndex][startCol - 1].pieceId === piece.id &&
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
  }

  function computeXAndDrag(e: any) {
    if (gridRef.current === null || gameState.draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    let currentDraggingPiece = gameState.draggingPiece;
    const piece = PIECES.find(
      (p) =>
        p.id ===
        gameState.grid[currentDraggingPiece?.row][currentDraggingPiece.col]
          .pieceId,
    );
    if (!piece) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let newX = clientX - gameState.draggingPiece.clickOffset;

    const totalDrag = newX - gameState.draggingPiece.startX;

    // Calculez la nouvelle colonne
    let newCol = Math.round(
      gameState.draggingPiece.col + totalDrag / cellWidth,
    );

    // Vérifiez les limites
    newCol = Math.max(0, Math.min(cols - piece.width, newCol));

    // Vérifiez les collisions sur tout le chemin
    if (
      !checkCollision(
        gameState.draggingPiece.row,
        gameState.draggingPiece.col,
        newCol,
        piece,
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
          piece,
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
  }

  function setPieceToNewPositionAndTx() {
    if (gridRef.current === null || gameState.draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag =
      gameState.draggingPiece.currentX - gameState.draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, gameState.draggingPiece.col + draggedCells),
    );

    const newGrid = [...gameState.grid];
    let currentDraggingPiece = gameState.draggingPiece;

    const piece = PIECES.find(
      (p) =>
        p.id ===
        gameState.grid[currentDraggingPiece.row][currentDraggingPiece.col]
          .pieceId,
    );
    if (
      piece &&
      !checkCollision(
        gameState.draggingPiece.row,
        gameState.draggingPiece.col,
        newCol,
        piece,
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
        finalCol,
      );
    }

    setGameState((prevState) => ({
      ...prevState,
      draggingPiece: null,
      isDragging: false,
    }));
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (gameState.isAnimating) return;
      if (gameState.isTxProcessing) return;
      if (!gameState.isDragging || !gameState.draggingPiece || !gridRef.current)
        return;

      computeXAndDrag(e);
    },
    [gameState.isDragging, gameState.draggingPiece, gameState.grid, cols],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (gameState.isAnimating) return;
      if (gameState.isTxProcessing) return;
      if (!gameState.isDragging || !gameState.draggingPiece || !gridRef.current)
        return;
      computeXAndDrag(e);
    },
    [gameState.isDragging, gameState.draggingPiece, gameState.grid, cols],
  );

  const handleMouseEnd = useCallback(() => {
    if (gameState.isAnimating) return;
    if (!gameState.isDragging || !gameState.draggingPiece || !gridRef.current)
      return;

    setPieceToNewPositionAndTx();
  }, [gameState.isDragging, gameState.draggingPiece, gameState.grid, cols]);

  useEffect(() => {
    const gridElement = gridRef.current;

    if (gridElement) {
      gridElement.addEventListener("touchmove", handleTouchMove);
      gridElement.addEventListener("touchend", handleMouseEnd);

      return () => {
        gridElement.removeEventListener("touchmove", handleTouchMove);
        gridElement.removeEventListener("touchend", handleMouseEnd);
      };
    }
  }, [handleTouchMove, handleMouseEnd]);

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
    [account],
  );

  const handleEmptyGrid = useCallback(async () => {
    //if (isAnimating) return;
    if (!account) return;

    setGameState((prevState) => ({
      ...prevState,
      isLoading: true,
      isTxProcessing: true,
    }));
    try {
      await move({
        account: account as Account,
        row_index: 0,
        start_index: 0,
        final_index: 0,
      });
    } finally {
      setGameState((prevState) => ({
        ...prevState,
        isLoading: false,
      }));
    }
  }, [account]);

  const handleMouseUp = useCallback(() => {
    if (gameState.isAnimating) return;
    if (!gameState.isDragging || !gameState.draggingPiece || !gridRef.current)
      return;

    setPieceToNewPositionAndTx();
  }, [gameState.isDragging, gameState.draggingPiece, gameState.grid, cols]);

  useEffect(() => {
    if (gameState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [gameState.isDragging, handleMouseMove, handleMouseUp]);

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: CellType[][] = [];

    for (let i = 0; i < rows; i++) {
      const row: CellType[] = [];
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
    setGameState((prevState) => ({
      ...prevState,
      grid: newGrid,
    }));
  };

  const isGridEmpty = (grid: CellType[][]) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const value = grid[i][j];
        if (value.pieceIndex != null) return false;
      }
    }
    return true;
  };

  const markStartingCells = (grid: CellType[][]) => {
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

  const handleClickTest = () => {
    console.log(isGridEmpty(gameState.grid));
  };

  const handleBonusWaveClick = () => {
    setGameState((prevState) => ({
      ...prevState,
      bonusWave: true,
      bonusTiki: false,
      bonusHammer: false,
    }));
  };

  const handleBonusTikiClick = () => {
    setGameState((prevState) => ({
      ...prevState,
      bonusWave: false,
      bonusTiki: true,
      bonusHammer: false,
    }));
  };

  const handleBonusHammerClick = () => {
    setGameState((prevState) => ({
      ...prevState,
      bonusWave: false,
      bonusTiki: false,
      bonusHammer: true,
    }));
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const actualRowIndex = rows - 1 - rowIndex;
    const clickedPiece = gameState.grid[rowIndex][colIndex];

    if (gameState.bonusHammer && clickedPiece.pieceId !== null) {
      setGameState((prevState) => ({
        ...prevState,
        clickedPieceId: clickedPiece.pieceId,
      }));
      removePieceFromGrid(actualRowIndex, colIndex);
      setGameState((prevState) => ({
        ...prevState,
        bonusHammer: false,
      }));
      applyGravityLoop();
      handleBonusHammerTx(actualRowIndex, colIndex);
    }

    // if (bonusTiki && clickedPiece.pieceId !== null) {
    //   removePieceFromGridByCell(actualRowIndex, colIndex);
    //   setBonusTiki(false);
    //   applyGravityLoop();
    //   // TODO: Appeler la transaction pour le bonus Tiki si nécessaire
    // }
  };

  const handleRowClick = (rowIndex: number) => {
    if (gameState.bonusWave) {
      const actualRowIndex = rows - 1 - rowIndex;
      checkAndClearSelectedLine(rowIndex);
      setGameState((prevState) => ({
        ...prevState,
        bonusWave: false,
      }));
      applyGravityLoop();
      // Call TX for bonus wave
      handleBonusWaveTx(actualRowIndex);
    }
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (gameState.isAnimating) return;
      if (!account) return;

      setGameState((prevState) => ({
        ...prevState,
        isTxProcessing: true,
        isLoading: true,
      }));

      try {
        await applyBonus({
          account: account as Account,
          bonus: 3,
          row_index: rowIndex,
          block_index: 0,
        });
      } finally {
        setGameState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
      }
    },
    [account],
  );

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (gameState.isAnimating) return;

      setGameState((prevState) => ({
        ...prevState,
        isTxProcessing: true,
        isLoading: true,
      }));
      try {
        await applyBonus({
          account: account as Account,
          bonus: 1,
          row_index: rowIndex,
          block_index: colIndex,
        });
      } finally {
        setGameState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
      }
    },
    [account],
  );

  //WAVE EFFECT
  const checkAndClearSelectedLine = async (selectedRow: number) => {
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );

      if (selectedRow >= 0 && selectedRow < newGrid.length) {
        newGrid[selectedRow] = newGrid[selectedRow].map((cell, col) => ({
          id: `${selectedRow}-${col}`,
          pieceId: null,
          isStart: false,
          pieceIndex: null,
        }));
      }

      resolve(newGrid);
      setGameState((prevState) => ({
        ...prevState,
        grid: newGrid,
      }));
      return newGrid;
    });
  };

  //TIKI EFFECT
  const removePieceFromGridByCell = async (
    rowIndex: number,
    colIndex: number,
  ) => {
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );

      if (
        rowIndex >= 0 &&
        rowIndex < newGrid.length &&
        colIndex >= 0 &&
        colIndex < newGrid[0].length
      ) {
        const pieceIdToRemove = newGrid[rowIndex][colIndex].pieceId;

        for (let row = 0; row < newGrid.length; row++) {
          for (let col = 0; col < newGrid[row].length; col++) {
            if (newGrid[row][col].pieceId === pieceIdToRemove) {
              newGrid[row][col] = {
                id: `${row}-${col}`,
                pieceId: null,
                isStart: false,
                pieceIndex: null,
              };
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
  };

  //HAMMER EFFECT
  const removePieceFromGrid = async (rowIndex: number, colIndex: number) => {
    await new Promise((resolve) => {
      const newGrid = gameState.grid.map((row) =>
        row.map((cell) => ({ ...cell })),
      );

      if (
        rowIndex >= 0 &&
        rowIndex < newGrid.length &&
        colIndex >= 0 &&
        colIndex < newGrid[0].length
      ) {
        const pieceIdToRemove = newGrid[rowIndex][colIndex].pieceId;
        const pieceIndexToRemove = newGrid[rowIndex][colIndex].pieceIndex;

        for (let row = 0; row < newGrid.length; row++) {
          for (let col = 0; col < newGrid[row].length; col++) {
            if (
              newGrid[row][col].pieceId === pieceIdToRemove &&
              newGrid[row][col].pieceIndex === pieceIndexToRemove
            ) {
              newGrid[row][col] = {
                id: `${row}-${col}`,
                pieceId: null,
                isStart: false,
                pieceIndex: null,
              };
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
  };

  const isLineComplete = (row: any) => {
    return row.every(
      (cell: CellType) => cell.pieceId !== null && !gameState.isFalling,
    );
  };

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${gameState.isTxProcessing || gameState.isAnimating ? "cursor-wait" : "cursor-move"}`}
      >
        <PlayerPanel
          styleBoolean={isMdOrLarger}
          score={score}
          combo={combo}
          maxCombo={maxCombo}
        >
          <GameBonus
            onBonusWaveClick={handleBonusWaveClick}
            onBonusTikiClick={handleBonusTikiClick}
            onBonusHammerClick={handleBonusHammerClick}
            hammerCount={hammerCount}
            tikiCount={totemCount}
            waveCount={waveCount}
          />
        </PlayerPanel>

        <div className="bg-slate-800 relative">
          <div
            ref={gridRef}
            className={`${isMdOrLarger ? "w-[412px]" : "w-[300px]"} border-4 border-slate-800 grid grid-cols-8 grid-rows-10 gap-1`}
            style={{ position: "relative" }}
          >
            {/* Grille de fond */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="h-8 w-8 sm:w-12 sm:h-12 bg-secondary relative"
                  ></div>
                ))}
              </React.Fragment>
            ))}

            {gameState.grid.map((row, rowIndex) => {
              const complete = isLineComplete(row);
              return (
                <React.Fragment key={`piece-${rowIndex}`}>
                  {row.map((cell, colIndex) => (
                    <Cell
                      key={cell.id}
                      cell={cell}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isLineComplete={complete}
                      draggingPiece={gameState.draggingPiece}
                      gridRef={gridRef}
                      cols={cols}
                      rows={rows}
                      startDragging={startDragging}
                      handleRowClick={handleRowClick}
                      handleCellClick={handleCellClick}
                      isTxProcessing={gameState.isTxProcessing}
                      isAnimating={gameState.isAnimating}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>
    </>
  );
};

export default GameBoard;
