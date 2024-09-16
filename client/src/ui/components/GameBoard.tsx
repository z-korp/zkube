import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { Piece } from "@/types/Piece";
import { Cell } from "@/types/Cell";
import { Grid } from "@/types/Grid";
//Todo remove one of the two Cell
import { PIECES } from "./CellComponent";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import MaxComboIcon from "./MaxComboIcon";
import PieceComponent from "./PieceComponent";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
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
  const [bonusWave, setBonusWave] = useState(false);
  const [bonusTiki, setBonusTiki] = useState(false);
  const [bonusHammer, setBonusHammer] = useState(false);
  // const [clickedPieceId, setClickedPieceId] = useState<number | null>(null);

  // Initialiser la grille avec une instance de la classe Grid
  const [grid, setGrid] = useState(new Grid(rows, cols, initialGrid));

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  useEffect(() => {
    setIsTxProcessing(false);
    console.log("initialGrid", initialGrid);
    console.log("grid", grid);
  }, [initialGrid]);

  useEffect(() => {
    if (isAnimating || isTxProcessing) return;
    setGrid(new Grid(rows, cols, initialGrid)); // Réinitialiser la grille lorsque l'état initial change
    console.log("Grid updated:", initialGrid); // Log pour déboguer
  }, [initialGrid, isAnimating, isTxProcessing]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const printGrid = (grid: Cell[][]) => {
    console.log("Current grid state:"); // Log pour déboguer
    for (const row of grid) {
      let rowStr = "";
      for (const cell of row) {
        if (cell.isStart) {
          rowStr += "[S] "; // S pour Start
        } else if (cell.piece !== null) {
          rowStr += `[${cell.piece}] `;
        } else {
          rowStr += "[ ] ";
        }
      }
      console.log(rowStr);
    }
  };

  const applyGravity = async () => {
    const changesMade = grid.applyGravity();
    const numericGrid = grid.cells.map(row => row.map(cell => cell.piece?.id ?? 0));
    setGrid(new Grid(rows, cols, numericGrid));
    return changesMade;
  };

  // Fonction pour appliquer la gravité en boucle tant qu'il y a des changements
  const applyGravityLoop = async () => {
    setIsAnimating(true);
    setIsFalling(true);
  
    let rowsCleared = true;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        changesMade = await applyGravity();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      setIsFalling(false);
  
      await new Promise((resolve) => setTimeout(resolve, 200));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  
    // Si aucun bonus n'est utilisé alors nouvelle ligne
    if (!bonusHammer && !bonusTiki && !bonusWave) {
      await insertNewLine();
    }
  
    await new Promise((resolve) => setTimeout(resolve, 300));
  
    rowsCleared = true;
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        setIsFalling(true);
        changesMade = await applyGravity();
        setIsFalling(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      rowsCleared = await checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  
    if (grid.isEmpty()) {
      handleEmptyGrid();
  
      await new Promise((resolve) => setTimeout(resolve, 200));
  
      await insertNewLine();
  
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    setIsAnimating(false);
  };


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const clearSelectedLine = async (selectedRow: number) => {
  //   await new Promise((resolve) => {
  //     setGrid((prevGrid) => {
  //       const newGrid = prevGrid.map((row) => row.map((cell) => ({ ...cell })));

  //       // Vérifier et supprimer tous les blocs assignés de la ligne sélectionnée
  //       if (selectedRow >= 0 && selectedRow < newGrid.length) {
  //         newGrid[selectedRow] = newGrid[selectedRow].map((cell, col) => ({
  //           id: `${selectedRow}-${col}`,
  //           piece: null,
  //           isStart: false,
  //           pieceIndex: null,
  //         }));
  //       }

  //       resolve(newGrid);
  //       return newGrid;
  //     });
  //   });
  // };

  const insertNewLine = async () => {
    console.log("insertNewLine");
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        // Create a new grid by shifting all lines up
        const numericGrid = prevGrid.cells.slice(1).map(row => row.map(cell => (cell.piece?.id ?? 0) as number));
        const newGrid = new Grid(rows, cols, numericGrid);

        // Créez la nouvelle ligne à partir de nextLine
        const newLine: Cell[] = nextLine.map((value, index) => 
          new Cell(`${rows - 1}-${index}`, value !== 0 ? PIECES.find((p) => p.id === value) : null, false, null)
        );

        // Add the new line at the bottom of the grid
        newGrid.cells.push(newLine);

        // Update the isStart for the new line
        newGrid.markStartingCells();

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
      grid[row][col + j].piece = piece;
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
      const current: Cell = grid.cells[row][col];
      const left: Cell = grid.cells[row][col - 1];
      const right: Cell = grid.cells[row][col + piece.width];
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
    if (isAnimating) return;
    const piece = PIECES.find((p) => p === grid.cells[rowIndex][colIndex].piece);
    if (!piece) return;

    // Assurez-vous que nous commençons par la cellule de départ pour cette pièce
    let startCol = colIndex;
    while (
      startCol > 0 &&
      grid.cells[rowIndex][startCol - 1].piece === piece &&
      !grid.cells[rowIndex][startCol].isStart
    ) {
      startCol--;
    }

    const gridRect = gridRef.current?.getBoundingClientRect();
    const cellWidth = gridRect ? gridRect.width / cols : 0;
    const startX = gridRect ? gridRect.left + startCol * cellWidth : 0;

    // Calculez le décalage entre le point de clic et le début de la pièce
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickOffset = clientX - startX;

    setDraggingPiece({
      row: rowIndex,
      col: startCol,
      startX: startX,
      currentX: startX,
      clickOffset: clickOffset,
    });
    setIsDragging(true);
  }

  function computeXAndDrag(e: any) {
    if (gridRef.current === null || draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const piece = PIECES.find(
      (p) => p === grid.cells[draggingPiece?.row][draggingPiece.col].piece,
    );
    if (!piece) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let newX = clientX - draggingPiece.clickOffset;

    const totalDrag = newX - draggingPiece.startX;

    // Calculez la nouvelle colonne
    let newCol = Math.round(draggingPiece.col + totalDrag / cellWidth);

    // Vérifiez les limites
    newCol = Math.max(0, Math.min(cols - piece.width, newCol));

    // Vérifiez les collisions sur tout le chemin
    if (!checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)) {
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

      newX = draggingPiece.startX + (validCol - draggingPiece.col) * cellWidth;
      setDraggingPiece({ ...draggingPiece, currentX: newX });
    }
  }

  function setPieceToNewPositionAndTx() {
    if (gridRef.current === null || draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag = draggingPiece.currentX - draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, draggingPiece.col + draggedCells),
    );
    const numericGrid = grid.cells.slice(1).map(row => row.map(cell => cell.piece?.id ?? 0));
    const newGrid = new Grid(rows, cols, numericGrid);

    const piece = PIECES.find(
      (p) => p === grid.cells[draggingPiece.row][draggingPiece.col].piece,
    );
    if (
      piece &&
      !checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)
    ) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        const oldCol = draggingPiece.col + i;
        if (oldCol < cols) {
          newGrid.cells[draggingPiece.row][oldCol] = new Cell(
            `${draggingPiece.row}-${oldCol}`,
            null,
            false,
            null
          );
        }
      }

      // Placer à la nouvelle position
      const finalCol = Math.min(newCol, cols - piece.width);
      placePiece(newGrid.cells, draggingPiece.row, finalCol, piece);
      setGrid(newGrid);
      if (draggingPiece.col !== finalCol) {
        loopGravityAndClear();
      }

      // Send move tx
      handleMove(rows - draggingPiece.row - 1, draggingPiece.col, finalCol);
    }

    setDraggingPiece(null);
    setIsDragging(false);
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isAnimating) return;
      if (isTxProcessing) return;
      if (!isDragging || !draggingPiece || !gridRef.current) return;

      computeXAndDrag(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging, draggingPiece, grid, cols],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isAnimating) return;
      if (isTxProcessing) return;
      if (!isDragging || !draggingPiece || !gridRef.current) return;
      computeXAndDrag(e);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isDragging, draggingPiece, grid, cols],
  );

  const handleMouseEnd = useCallback(() => {
    if (isAnimating) return;
    if (!isDragging || !draggingPiece || !gridRef.current) return;

    setPieceToNewPositionAndTx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, draggingPiece, grid, cols]);

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
      if (isAnimating) return;
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await move({
          account: account as Account,
          row_index: rowIndex,
          start_index: startIndex,
          final_index: finalOndex,
        });
      } finally {
        setIsTxProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account],
  );

  const handleEmptyGrid = useCallback(async () => {
    if (!account) return;

    setIsTxProcessing(true);
    try {
      await move({
        account: account as Account,
        row_index: 0,
        start_index: 0,
        final_index: 0,
      });
    } finally {
      setIsTxProcessing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleMouseUp = useCallback(() => {
    if (isAnimating) return;
    if (!isDragging || !draggingPiece || !gridRef.current) return;

    setPieceToNewPositionAndTx();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleBonusWaveClick = () => {
    setBonusWave(true);
    setBonusTiki(false);
    setBonusHammer(false);
  };

  const handleBonusTikiClick = () => {
    setBonusWave(false);
    setBonusTiki(true);
    setBonusHammer(false);
  };

  const handleBonusHammerClick = () => {
    setBonusWave(false);
    setBonusTiki(false);
    setBonusHammer(true);
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const actualRowIndex = rows - 1 - rowIndex;
    const clickedPiece = grid.cells[rowIndex][colIndex];

    if (bonusHammer && clickedPiece.piece !== null) {
      // setClickedPieceId(clickedPiece.piece);
      removePieceFromGrid(actualRowIndex, colIndex);
      setBonusHammer(false);
      applyGravityLoop();
      handleBonusHammerTx(actualRowIndex, colIndex);
    }

    if (bonusTiki && clickedPiece.piece !== null) {
      removePieceFromGridByCell(actualRowIndex, colIndex);
      setBonusTiki(false);
      applyGravityLoop();
      handleBonusTikiTx(actualRowIndex, colIndex);
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (bonusWave) {
      const actualRowIndex = rows - 1 - rowIndex;
      grid.checkAndClearFullLines();
      setBonusWave(false);
      applyGravityLoop();
      // Call TX for bonus wave
      handleBonusWaveTx(actualRowIndex);
    }
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (isAnimating) return;
      if (!account) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 3,
          row_index: rowIndex,
          block_index: 0,
        });
      } finally {
        setIsTxProcessing(false);
      }
    },
    [account],
  );

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (isAnimating) return;

      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 1,
          row_index: rowIndex,
          block_index: colIndex,
        });
      } finally {
        setIsTxProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account],
  );

  const handleBonusTikiTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (isAnimating) return;
      setIsTxProcessing(true);
      try {
        await applyBonus({
          account: account as Account,
          bonus: 2,
          row_index: rowIndex,
          block_index: colIndex,
        });
      } finally {
        setIsTxProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account],
  );

  //WAVE EFFECT
  const checkAndClearFullLines = async () => {
    const rowsCleared = grid.checkAndClearFullLines();
    const numericGrid = grid.cells.map(row => row.map(cell => cell.piece?.id ?? 0));
    setGrid(new Grid(rows, cols, numericGrid)); // Mettre à jour l'état avec la nouvelle grille
    return rowsCleared;
  };

  //TIKI EFFECT
  const removePieceFromGridByCell = async (
    rowIndex: number,
    colIndex: number,
  ) => {
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const numericGrid = prevGrid.cells.map(row => row.map(cell => cell.piece?.id ?? 0));
        const newGrid = new Grid(rows, cols, numericGrid);

        if (
          rowIndex >= 0 &&
          rowIndex < newGrid.rows &&
          colIndex >= 0 &&
          colIndex < newGrid.cols
        ) {
          const pieceToRemove = newGrid.cells[rowIndex][colIndex].piece;

          for (let row = 0; row < newGrid.rows; row++) {
            for (let col = 0; col < newGrid.cols; col++) {
              if (newGrid.cells[row][col].piece === pieceToRemove) {
                newGrid.cells[row][col] = new Cell(
                  `${row}-${col}`,
                  null,
                  false,
                  null
                );
              }
            }
          }
        }

        resolve(newGrid);
        return newGrid;
      });
    });
  };

  //HAMMER EFFECT
  const removePieceFromGrid = async (rowIndex: number, colIndex: number) => {
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const numericGrid = prevGrid.cells.map(row => row.map(cell => cell.piece?.id ?? 0));
        const newGrid = new Grid(rows, cols, numericGrid);

        if (
          rowIndex >= 0 &&
          rowIndex < newGrid.rows &&
          colIndex >= 0 &&
          colIndex < newGrid.cols
        ) {
          const pieceToRemove = newGrid.cells[rowIndex][colIndex].piece;
          const pieceIndexToRemove = newGrid.cells[rowIndex][colIndex].pieceIndex;
          for (let row = 0; row < newGrid.rows; row++) {
            for (let col = 0; col < newGrid.cols; col++) {
              if (
                newGrid.cells[row][col].piece === pieceToRemove &&
                newGrid.cells[row][col].pieceIndex === pieceIndexToRemove
              ) {
                newGrid.cells[row][col] = new Cell(
                  `${row}-${col}`,
                  null,
                  false,
                  null
                );
              }
            }
          }
        }

        resolve(newGrid);
        return newGrid;
      });
    });
  };

  const isLineComplete = (row: any) => {
    return row.every((cell: Cell) => cell.piece !== null && !isFalling);
  };

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"}`}
      >
        <div className={`${isMdOrLarger ? "w-[413px]" : "w-[300px]"} mb-4 flex justify-between`}>
        <div className="w-5/12">
    <GameBonus
      onBonusWaveClick={handleBonusWaveClick}
      onBonusTikiClick={handleBonusTikiClick}
      onBonusHammerClick={handleBonusHammerClick}
      hammerCount={hammerCount}
      tikiCount={totemCount}
      waveCount={waveCount}
    />
  </div>
  
  <div className="flex gap-1">
    <div className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}>
      <span>{score}</span>
      <FontAwesomeIcon
        icon={faStar}
        className="text-yellow-500 ml-2"
        width={ 26}
        height={ 26}
      />
    </div>
    
    <div className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}>
      <span>{combo}</span>
      <FontAwesomeIcon
        icon={faFire}
        className="text-yellow-500 ml-2"
        width={ 26}
        height={26}
      />
    </div>
    
    <div className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}>
      <span>{maxCombo}</span>
      <MaxComboIcon
        width={26}
        height={26}
        className={`text-yellow-500 ml-2 `}
      />
    </div>
  </div>
</div>
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

            {grid.pieces.map(({ piece, startRow, startCol }, index) => (
                          <PieceComponent
                            key={index}
                            piece={piece}
                            startRow={startRow}
                            startCol={startCol}
                            draggingPiece={draggingPiece}
                            gridRef={gridRef}
                            cols={cols}
                            rows={rows}
                            isTxProcessing={isTxProcessing}
                            isAnimating={isAnimating}
                            startDragging={startDragging}
                          />
                      ))}
            </div>
        </div>
      </Card>
    </>
  );
};

export default GameBoard;
