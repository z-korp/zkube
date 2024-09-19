import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { Cell } from "@/types/Cell";
import { Grid } from "@/types/Grid";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import MaxComboIcon from "./MaxComboIcon";
import PieceComponent from "./PieceComponent";
import CellComponent from "./CellComponent"; // Import of the Cell component
import { Piece } from "@/types/Piece";
import { PIECES } from "@/types/types";

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
  const [triggerGravity, setTriggerGravity] = useState(false); 
  const [isDragging, setIsDragging] = useState(false);
  const [bonusWave, setBonusWave] = useState(false);
  const [bonusTiki, setBonusTiki] = useState(false);
  const [bonusHammer, setBonusHammer] = useState(false);
  const [grid, setGrid] = useState(new Grid(rows, cols, initialGrid));
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });
  const [disappearingPieces, setDisappearingPieces] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (isAnimating || isTxProcessing) return;
    console.log("UPDATE GRID FROM CONTRACT", initialGrid);
    setGrid(new Grid(rows, cols, initialGrid)); // Reset the grid when the initial state changes
  }, [initialGrid, isAnimating, isTxProcessing]);

  useEffect(() => {
    if (grid && !isAnimating && triggerGravity) {
      loopGravityAndClear();
    }
  }, [grid]); 

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

  useEffect(() => {
    setIsTxProcessing(false);
  }, [initialGrid]);

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
          ? !!left?.piece?.id && left.piece?.id !== current.piece?.id
          : !!right?.piece?.id && right.piece?.id !== current.piece?.id
      ) {
        return true;
      }
    }
    return false;
  };

  function computeXAndDrag(e: any) {
    if (gridRef.current === null || draggingPiece === null) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const piece = grid.cells[draggingPiece?.row][draggingPiece.col].piece;
    if (!piece) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let newX = clientX - draggingPiece.clickOffset;

    const totalDrag = newX - draggingPiece.startX;

    // Calculate the new column
    let newCol = Math.round(draggingPiece.col + totalDrag / cellWidth);

    // Check boundaries
    newCol = Math.max(0, Math.min(cols - piece.width, newCol));

    // Check collisions along the entire path
    if (!checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)) {
      // If no collision, update the position
      newX = draggingPiece.startX + (newCol - draggingPiece.col) * cellWidth;
      setDraggingPiece({ ...draggingPiece, currentX: newX });
    } else {
      // In case of collision, find the closest valid position
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

    const numericGrid = grid.cells.map((row) =>
      row.map((cell) => cell.piece?.size ?? 0),
    );

    
    const piece = grid.cells[draggingPiece.row][draggingPiece.col].piece;
    if (
      piece &&
      !checkCollision(draggingPiece.row, draggingPiece.col, newCol, piece)
    ) {
      const newGrid = new Grid(rows, cols, numericGrid);
  
      const workgrid = newGrid;
      for (let i = 0; i < piece.width; i++) {
        const oldCol = draggingPiece.col + i;
        if (oldCol < cols) {
          workgrid.cells[draggingPiece.row][oldCol] = new Cell(
            `${draggingPiece.row}-${oldCol}`,
            null,
            false,
          );
        }
      }
      
      // Place at the new position
      const finalCol = Math.min(newCol, cols - piece.width);
      // Update the grid after placement
      const newGrid2 = placePiece(workgrid, draggingPiece.row, finalCol, piece);
      // setGrid(newGrid2);
      const numericGrid2 = newGrid2.cells.map((row) =>
        row.map((cell) => cell.piece?.size ?? 0),
      );
      setTriggerGravity(true);
      setGrid(new Grid(rows, cols, numericGrid2));
  
      // Send move tx
      handleMove(rows - draggingPiece.row - 1, draggingPiece.col, finalCol);
    }
  
    setDraggingPiece(null);
    setIsDragging(false);
  }

  const loopGravityAndClear = async () => {
    applyGravityLoop();
  };

  const placePiece = (
    grid: Grid,
    row: number,
    col: number,
    piece: Piece,
  ) => {
    const newGrid = grid;
    
    for (let j = 0; j < piece.width; j++) {
      newGrid.cells[row][col + j].piece = piece;
      newGrid.cells[row][col + j].isStart = j === 0;
    }
    
    return newGrid;
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      console.log("handleTouchMove", e);
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
    console.log("handleMouseEnd");
    setPieceToNewPositionAndTx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, draggingPiece, grid, cols]);

  const handleMouseUp = useCallback(() => {
    if (isAnimating) return;
    if (!isDragging || !draggingPiece || !gridRef.current) return;
    console.log("handleMouseUp");
    setPieceToNewPositionAndTx();
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

  useEffect(() => {
    if (isAnimating || isTxProcessing) return;
    setGrid(new Grid(rows, cols, initialGrid));
    console.log("Grid useEffect:", initialGrid);
  }, [initialGrid, isAnimating, isTxProcessing]);

  const applyGravity = async () => {
    console.log("applyGravity", grid.cells);
    const changesMade = grid.applyGravity();
    const numericGrid = grid.cells.map((row) =>
      row.map((cell) => cell.piece?.size ?? 0),
    );
    setTriggerGravity(false);
    setGrid(new Grid(rows, cols, numericGrid));
    console.log("Grid applyGravity:", numericGrid);
    return changesMade;
  };

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
      // animate or not depending on result of checkAndClearFullLines
      const linesToClear = grid.getFullLines();
      if (linesToClear.length > 0) {
        const piecesToDisappear = new Set<string>();
        linesToClear.forEach((row) => {
          grid.cells[row].forEach((cell, col) => {
            if (cell.piece) {
              piecesToDisappear.add(`${cell.piece.id}-${row}-${col}`);
            }
          });
        });
        setDisappearingPieces(piecesToDisappear);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setDisappearingPieces(new Set());
        grid.checkAndClearFullLines();
      } else {
        rowsCleared = false;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (!bonusHammer && !bonusTiki && !bonusWave) {
      await insertNewLine();
    }
    while (rowsCleared) {
      let changesMade = true;
      while (changesMade) {
        setIsFalling(true);
        changesMade = await applyGravity();
        setIsFalling(false);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      rowsCleared = await grid.checkAndClearFullLines();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (grid.isEmpty()) {
      handleEmptyGrid();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await insertNewLine();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

     setIsAnimating(false);
  };

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

  const insertNewLine = async () => {
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const numericGrid = prevGrid.cells
          .slice(1)
          .map((row) => row.map((cell) => cell.piece?.size ?? 0));
        const newGrid = new Grid(rows, cols, numericGrid);

        const newLine: Cell[] = nextLine.map(
          (value, index) =>
            new Cell(
              `${rows - 1}-${index}`,
              value !== 0
                ? new Piece(
                    value,
                    PIECES.find((p) => p.id === value)?.width || 0,
                    PIECES.find((p) => p.id === value)?.element || "",
                  )
                : null,
              false,
            ),
        );

        newGrid.cells.push(newLine);
        newGrid.markStartingCells();
        resolve(newGrid);
        console.log("Grid insertNewLine:", newGrid.cells);
        return newGrid;
      });
    });
  };

  const removePieceFromGrid = async (rowIndex: number, colIndex: number) => {
    await new Promise((resolve) => {
      setGrid((prevGrid) => {
        const numericGrid = prevGrid.cells.map((row) =>
          row.map((cell) => cell.piece?.size ?? 0),
        );
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
              if (
                newGrid.cells[row][col].piece === pieceToRemove 
              ) {
                newGrid.cells[row][col] = new Cell(
                  `${row}-${col}`,
                  null,
                  false,
                );
              }
            }
          }
        }
        console.log("Grid removePieceFromGrid:", newGrid.cells);
        resolve(newGrid);
        return newGrid;
      });
    });
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

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    console.log("handleCellClick", rowIndex, colIndex);
    const actualRowIndex = rows - 1 - rowIndex;
    const clickedPiece = grid.cells[rowIndex][colIndex];

    if (bonusHammer && clickedPiece.piece !== null) {
      removePieceFromGrid(actualRowIndex, colIndex);
      setBonusHammer(false);
      applyGravityLoop();
      handleBonusHammerTx(actualRowIndex, colIndex);
    }

    if (bonusTiki && clickedPiece.piece !== null) {
      removePieceFromGrid(actualRowIndex, colIndex);
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
      handleBonusWaveTx(actualRowIndex);
    }
  };

  function startDragging(rowIndex: number, colIndex: number, e: any) {
    if (isAnimating) return;
    const piece = grid.cells[rowIndex][colIndex].piece;
    if (!piece) return;

    // Make sure we start with the starting cell for this piece
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

    // Calculate the offset between the click point and the start of the piece
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickOffset = clientX - startX;
    console.log("startDragging", rowIndex, startCol, startX, clickOffset);
    setDraggingPiece({
      row: rowIndex,
      col: startCol,
      startX: startX,
      currentX: startX,
      clickOffset: clickOffset,
    });
    setIsDragging(true);
  }

  const renderPieces = () => {
    //TODO: debug rows here
    // console.log("Rendering pieces:", grid.pieces);
    return grid.pieces.map((pieceInfo, index) => {
      //console.log("pieceInfo", pieceInfo);
      return (
        <PieceComponent
          key={`piece-${index}`}
          piece={pieceInfo.piece}
          startRow={pieceInfo.startRow}
          startCol={pieceInfo.startCol}
          draggingPiece={draggingPiece}
          gridRef={gridRef}
          cols={cols}
          rows={rows}
          isTxProcessing={isTxProcessing}
          isAnimating={isAnimating}
          isDisappearing={disappearingPieces.has(
            `${pieceInfo.piece.id}-${pieceInfo.startRow}-${pieceInfo.startCol}`,
          )}
          startDragging={startDragging}
        />
      );
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
        <div
          className={`${isMdOrLarger ? "w-[413px]" : "w-[300px]"} mb-4 flex justify-between`}
        >
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
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{score}</span>
              <FontAwesomeIcon
                icon={faStar}
                className="text-yellow-500 ml-2"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{combo}</span>
              <FontAwesomeIcon
                icon={faFire}
                className="text-yellow-500 ml-2"
                width={26}
                height={26}
              />
            </div>
            <div
              className={`flex items-center ${isMdOrLarger ? "text-4xl" : "text-2xl"}`}
            >
              <span>{maxCombo}</span>
              <MaxComboIcon
                width={26}
                height={26}
                className={`text-yellow-500 ml-2`}
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
            {/* Rendering of background cells */}
            {grid.cells.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <CellComponent
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    handleCellClick={handleCellClick}
                    isLineComplete={isLineComplete(row)}
                  />
                ))}
              </React.Fragment>
            ))}

            {/* Rendering of pieces */}
            {renderPieces()}
          </div>
        </div>
      </Card>
    </>
  );
};

export default GameBoard;
