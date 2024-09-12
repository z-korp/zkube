import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/card";
import { useDojo } from "@/dojo/useDojo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faGlobe, faStar } from "@fortawesome/free-solid-svg-icons";
import { GameBonus } from "../containers/GameBonus";
import { PieceNew, Cell as CellType, PIECE_TYPES } from "@/types/types";
import Cell from "./Piece";
import { useMediaQuery } from "react-responsive";
import { Account } from "starknet";
import useAccountCustom from "@/hooks/useAccountCustom";
import { convertGridToPieces, updateGridWithPieces, findPieceAtCell, isValidPosition } from '@/utils/piece';
import Piece from "./Piece";

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

  const [isLoading, setIsLoading] = useState(false);
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [pieces, setPieces] = useState<PieceNew[]>([]);

  const [isTxProcessing, setIsTxProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFalling, setIsFalling] = useState(false);
  const [draggingPiece, setDraggingPiece] = useState<PieceNew | null>(null);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [bonusWave, setBonusWave] = useState(false);
  const [bonusTiki, setBonusTiki] = useState(false);
  const [bonusHammer, setBonusHammer] = useState(false);

  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  useEffect(() => {
    setIsTxProcessing(false);
  }, [initialGrid]);

  useEffect(() => {
    if (isAnimating || isTxProcessing) return;
    initializeGrid(initialGrid);
  }, [initialGrid, isAnimating, isTxProcessing]);

  const initializeGrid = (initialGrid: number[][]) => {
    console.log("Initializing grid with:", initialGrid);
    const newGrid: CellType[][] = initialGrid.map((row, i) =>
      row.map((value, j) => ({
        id: `${i}-${j}`,
        pieceId: value !== 0 ? value : null,
        isStart: false,
        pieceIndex: null,
      }))
    );
    markStartingCells(newGrid);
    setGrid(newGrid);

    console.log("newGrid", newGrid)
    const newPieces = convertGridToPieces(newGrid);
    console.log("Converted pieces:", newPieces);
    setPieces(newPieces);
  };

  const markStartingCells = (grid: CellType[][]) => {
    for (let i = 0; i < rows; i++) {
      let j = 0;
      while (j < cols) {
        const currentPiece = grid[i][j].pieceId;
        if (currentPiece !== null) {
          const piece = PIECE_TYPES.find((p) => p.type === currentPiece);
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

  const applyGravity = async () => {
    let changesMade = false;
    const newPieces = [...pieces];

    for (let i = newPieces.length - 1; i >= 0; i--) {
      const piece = newPieces[i];
      if (piece.row < rows - 1) {
        const newPosition = { ...piece, row: piece.row + 1 };
        if (isValidPosition(newPosition, grid)) {
          newPieces[i] = newPosition;
          changesMade = true;
        }
      }
    }

    if (changesMade) {
      console.log("Gravity applied, new pieces:", newPieces);
      setPieces(newPieces);
      const newGrid = updateGridWithPieces(grid, newPieces);
      console.log("Updated grid after gravity:", newGrid);
      setGrid(newGrid);
    }

    return changesMade;
  };

  const applyGravityLoop = async () => {
    setIsAnimating(true);
    setIsFalling(true);

    let changesMade = true;
    while (changesMade) {
      changesMade = await applyGravity();
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setIsFalling(false);
    await checkAndClearFullLines();

    if (!bonusHammer && !bonusTiki && !bonusWave) {
      await insertNewLine();
    }

    setIsAnimating(false);
  };

  const checkAndClearFullLines = async () => {
    const newPieces = pieces.filter(piece => {
      const row = grid[piece.row];
      return !row || !row.every(cell => cell.pieceId !== null);
    });

    if (newPieces.length !== pieces.length) {
      console.log("Clearing full lines, new pieces:", newPieces);
      setPieces(newPieces);
      const newGrid = updateGridWithPieces(grid, newPieces);
      console.log("Updated grid after clearing lines:", newGrid);
      setGrid(newGrid);
      return true;
    }

    return false;
  };

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const insertNewLine = async () => {
    const newPieces = pieces.map(piece => ({ ...piece, row: piece.row - 1 }));
    const newLinePieces = nextLine.map((type, index) => ({
      id: generateUniqueId(),
      type,
      width: PIECE_TYPES.find(p => p.type === type)?.width || 1,
      row: rows - 1,
      col: index,
      element: PIECE_TYPES.find(p => p.type === type)?.element || "unknown",
      isMoving: false,
      isFalling: false,
      isClearing: false,
    }));
    console.log("newLinePieces", newLinePieces);
    const updatedPieces = [...newPieces, ...newLinePieces];
    console.log("Inserting new line, updated pieces:", updatedPieces);
    setPieces(updatedPieces);
    const newGrid = updateGridWithPieces(grid, updatedPieces);
    console.log("Updated grid after inserting new line:", newGrid);
    setGrid(newGrid);
  };

  function startDragging(rowIndex: number, colIndex: number, e: React.MouseEvent | React.TouchEvent) {
    if (isAnimating) return;
    const piece = findPieceAtCell(pieces, rowIndex, colIndex);
    if (!piece) return;

    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const cellWidth = gridRect.width / cols;
    const startX = gridRect.left + piece.col * cellWidth;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clickOffset = clientX - startX;

    console.log("Starting drag for piece:", piece);
    setDraggingPiece({ ...piece, isMoving: true, clickOffset });
    setIsDragging(true);

    // Add event listeners for move and end events
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseEnd);
  }

  function computeXAndDrag(e: any) {
    if (gridRef.current === null || !draggingPiece) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newX = clientX - draggingPiece.col * cellWidth;

    let newCol = Math.round(newX / cellWidth);
    newCol = Math.max(0, Math.min(cols - draggingPiece.width, newCol));

    if (isValidPosition({ ...draggingPiece, col: newCol }, grid)) {
      console.log("Dragging piece to new position:", { col: newCol });
      const updatedPiece = { ...draggingPiece, col: newCol };
      setDraggingPiece(updatedPiece);
      
      // Update the pieces array and grid to reflect the new position
      const newPieces = pieces.map(p => 
        p.id === updatedPiece.id ? updatedPiece : p
      );
      setPieces(newPieces);
      const newGrid = updateGridWithPieces(grid, newPieces);
      setGrid(newGrid);
    }
  }

  function setPieceToNewPositionAndTx() {
    if (!draggingPiece) return;

    const newPieces = pieces.map(p => 
      p.id === draggingPiece.id ? { ...draggingPiece, isMoving: false } : p
    );

    console.log("Setting piece to new position:", newPieces);
    setPieces(newPieces);
    const newGrid = updateGridWithPieces(grid, newPieces);
    console.log("Updated grid after setting piece:", newGrid);
    setGrid(newGrid);

    if (draggingPiece.col !== pieces.find(p => p.id === draggingPiece.id)?.col) {
      handleMove(rows - draggingPiece.row - 1, draggingPiece.col, draggingPiece.col);
      loopGravityAndClear();
    }

    setDraggingPiece(null);
    setIsDragging(false);
  }

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isAnimating || isTxProcessing || !isDragging || !draggingPiece) return;
      computeXAndDrag(e);
    },
    [isDragging, draggingPiece, grid, cols, isAnimating, isTxProcessing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isAnimating || isTxProcessing || !isDragging || !draggingPiece) return;
      computeXAndDrag(e);
    },
    [isDragging, draggingPiece, grid, cols, isAnimating, isTxProcessing]
  );

  const handleMouseEnd = useCallback(() => {
    console.log("Handling mouse end");
    // console.log("Dragging piece:", draggingPiece);
    // console.log("Is dragging:", isDragging);
    // console.log("Is animating:", isAnimating);
    if (isAnimating || !draggingPiece) return;
    setPieceToNewPositionAndTx();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseEnd);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseEnd);
  }, [isDragging, draggingPiece, grid, cols, isAnimating]);

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
    async (rowIndex: number, startIndex: number, finalIndex: number) => {
      if (startIndex === finalIndex || isAnimating || !account) return;
      setIsLoading(true);
      setIsTxProcessing(true);
      try {
        console.log("Handling move:", { rowIndex, startIndex, finalIndex });
        await move({
          account: account as Account,
          row_index: rowIndex,
          start_index: startIndex,
          final_index: finalIndex,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, move]
  );

  const loopGravityAndClear = () => {
    console.log("Starting gravity and clear loop");
    applyGravityLoop();
  };

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
    const clickedPiece = findPieceAtCell(pieces, rowIndex, colIndex);

    if (bonusHammer && clickedPiece) {
      console.log("Applying hammer bonus to piece:", clickedPiece);
      removePieceFromGrid(actualRowIndex, colIndex);
      setBonusHammer(false);
      applyGravityLoop();
      handleBonusHammerTx(actualRowIndex, colIndex);
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (bonusWave) {
      const actualRowIndex = rows - 1 - rowIndex;
      console.log("Applying wave bonus to row:", actualRowIndex);
      clearSelectedLine(rowIndex);
      setBonusWave(false);
      applyGravityLoop();
      handleBonusWaveTx(actualRowIndex);
    }
  };

  const handleBonusWaveTx = useCallback(
    async (rowIndex: number) => {
      if (isAnimating || !account) return;
      setIsLoading(true);
      setIsTxProcessing(true);
      try {
        console.log("Handling wave bonus transaction for row:", rowIndex);
        await applyBonus({
          account: account as Account,
          bonus: 3,
          row_index: rowIndex,
          block_index: 0,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, applyBonus]
  );

  const handleBonusHammerTx = useCallback(
    async (rowIndex: number, colIndex: number) => {
      if (isAnimating || !account) return;
      setIsLoading(true);
      setIsTxProcessing(true);
      try {
        console.log("Handling hammer bonus transaction:", { rowIndex, colIndex });
        await applyBonus({
          account: account as Account,
          bonus: 1,
          row_index: rowIndex,
          block_index: colIndex,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [account, applyBonus]
  );

  const clearSelectedLine = (selectedRow: number) => {
    const newPieces = pieces.filter(piece => piece.row !== selectedRow);
    console.log("Clearing selected line, new pieces:", newPieces);
    setPieces(newPieces);
    const newGrid = updateGridWithPieces(grid, newPieces);
    console.log("Updated grid after clearing line:", newGrid);
    setGrid(newGrid);
  };

  const removePieceFromGrid = (rowIndex: number, colIndex: number) => {
    const pieceToRemove = findPieceAtCell(pieces, rowIndex, colIndex);
    if (pieceToRemove) {
      const newPieces = pieces.filter(piece => piece.id !== pieceToRemove.id);
      console.log("Removing piece from grid, new pieces:", newPieces);
      setPieces(newPieces);
      const newGrid = updateGridWithPieces(grid, newPieces);
      console.log("Updated grid after removing piece:", newGrid);
      setGrid(newGrid);
    }
  };

  const isLineComplete = (rowIndex: number) => {
    return grid[rowIndex].every(cell => cell.pieceId !== null) && !isFalling;
  };

  return (
    <>
      <Card
        className={`p-4 bg-secondary ${
          isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"
        }`}
      >
        <div
          className={`${
            isMdOrLarger ? "w-[413px]" : "w-[300px]"
          } mb-4 flex justify-start items-center`}
        >
          <GameBonus
            onBonusWaveClick={handleBonusWaveClick}
            onBonusTikiClick={handleBonusTikiClick}
            onBonusHammerClick={handleBonusHammerClick}
            hammerCount={hammerCount}
            tikiCount={totemCount}
            waveCount={waveCount}
          />
          <div
            className={`flex grow ${
              isMdOrLarger ? "text-4xl" : "text-2xl"
            } sm:gap-2 gap-[2px] justify-end ml-4`}
          >
            {score}
            <div className="relative inline-block">
              <FontAwesomeIcon
                icon={faStar}
                className="text-yellow-500"
                width={26}
                height={26}
              />
            </div>
          </div>
          <div
            className={`flex grow ${
              isMdOrLarger ? "text-4xl" : "text-2xl"
            } sm:gap-2 gap-[2px] justify-end relative ml-4`}
          >
            {combo}
            <div className="relative inline-block">
              <FontAwesomeIcon
                icon={faFire}
                className="text-slate-500"
                width={26}
                height={26}
              />
            </div>
          </div>
          <div
            className={`flex grow ${
              isMdOrLarger ? "text-4xl" : "text-2xl"
            } sm:gap-2 gap-[2px] justify-end relative ml-4`}
          >
            {maxCombo}
            <FontAwesomeIcon
              icon={faGlobe}
              className="text-slate-500"
              width={28}
              height={28}
            />
          </div>
        </div>
        <div className="bg-slate-800 relative">
          <div
            ref={gridRef}
            className={`${
              isMdOrLarger ? "w-[412px]" : "w-[300px]"
            } border-4 border-slate-800 grid grid-cols-8 grid-rows-10 gap-1`}
            style={{ position: "relative" }}
          >
            {/* Background grid */}
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

            {/* Render pieces */}
            {pieces.map((piece) => (
  <React.Fragment key={piece.id}>
    {Array.from({ length: piece.width }).map((_, i) => (
      <Piece
        key={`${piece.id}-${i}`}
        piece={piece}
        cellIndex={i}
        isLineComplete={isLineComplete(piece.row)}
        isDragging={draggingPiece?.id === piece.id}
        dragOffset={draggingPiece?.id === piece.id ? draggingPiece.currentX - draggingPiece.startX : 0}
        isTxProcessing={isTxProcessing}
        isAnimating={isAnimating}
        startDragging={startDragging}
        handleRowClick={handleRowClick}
        handleCellClick={handleCellClick}
      />
    ))}
  </React.Fragment>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

  export default GameBoard
