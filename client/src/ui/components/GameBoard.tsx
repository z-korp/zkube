import React from "react";
import { Card } from "@/ui/elements/card";
import { useMediaQuery } from "react-responsive";
import ScoreDisplay from "./ScoreDisplay";
import BonusPanel from "./BonusPanel";
import Grid from "./Grid";
import { useGameLogic } from "../hooks/useGameLogic";

interface GameBoardProps {
  initialGrid: number[][];
  nextLine: number[];
}

const GameBoard: React.FC<GameBoardProps> = ({ initialGrid, nextLine }) => {
  const { gameState, setGameState, gridRef, movePiece, applyBonus } =
    useGameLogic(initialGrid, nextLine);
  const isMdOrLarger = useMediaQuery({ query: "(min-width: 768px)" });

  const handleBonusClick = (bonusType: "wave" | "tiki" | "hammer") => {
    setGameState((prev) => ({
      ...prev,
      [`bonus${bonusType.charAt(0).toUpperCase() + bonusType.slice(1)}`]: true,
    }));
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (gameState.bonusHammer) {
      applyBonus("hammer", rowIndex, colIndex);
      setGameState((prev) => ({ ...prev, bonusHammer: false }));
    }
  };

  const handleRowClick = (rowIndex: number) => {
    if (gameState.bonusWave) {
      applyBonus("wave", rowIndex);
      setGameState((prev) => ({ ...prev, bonusWave: false }));
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!gameState.isDragging || !gameState.draggingPiece || !gridRef.current)
        return;

      const gridRect = gridRef.current.getBoundingClientRect();
      const cellWidth = gridRect.width / 8;
      const piece =
        gameState.grid[gameState.draggingPiece.row][
          gameState.draggingPiece.col
        ];
      if (!piece.pieceId) return;

      const clientX = e.clientX;
      let newX = clientX - gameState.draggingPiece.clickOffset;

      const totalDrag = newX - gameState.draggingPiece.startX;
      let newCol = Math.round(
        gameState.draggingPiece.col + totalDrag / cellWidth
      );
      newCol = Math.max(0, Math.min(7 - (piece.pieceId - 1), newCol));

      setGameState((prev) => ({
        ...prev,
        draggingPiece: {
          ...prev.draggingPiece!,
          currentX:
            gameState.draggingPiece!.startX +
            (newCol - gameState.draggingPiece!.col) * cellWidth,
        },
      }));
    },
    [gameState.isDragging, gameState.draggingPiece, gameState.grid]
  );

  const handleMouseUp = useCallback(() => {
    if (!gameState.isDragging || !gameState.draggingPiece) return;

    const totalDrag =
      gameState.draggingPiece.currentX - gameState.draggingPiece.startX;
    const cellWidth = gridRef.current
      ? gridRef.current.getBoundingClientRect().width / 8
      : 0;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(7, gameState.draggingPiece.col + draggedCells)
    );

    if (gameState.draggingPiece.col !== newCol) {
      movePiece(
        9 - gameState.draggingPiece.row,
        gameState.draggingPiece.col,
        newCol
      );
    }

    setGameState((prev) => ({
      ...prev,
      isDragging: false,
      draggingPiece: null,
    }));
  }, [gameState.isDragging, gameState.draggingPiece, movePiece]);

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

  return (
    <Card
      className={`p-4 bg-secondary ${
        gameState.isTxProcessing || gameState.isAnimating
          ? "cursor-wait"
          : "cursor-move"
      }`}
    >
      <div
        className={`${
          isMdOrLarger ? "w-[413px]" : "w-[300px]"
        } mb-4 flex justify-start items-center`}
      >
        <BonusPanel
          onBonusWaveClick={() => handleBonusClick("wave")}
          onBonusTikiClick={() => handleBonusClick("tiki")}
          onBonusHammerClick={() => handleBonusClick("hammer")}
          hammerCount={gameState.hammerCount}
          tikiCount={gameState.totemCount}
          waveCount={gameState.waveCount}
        />
        <ScoreDisplay
          score={gameState.score}
          combo={gameState.combo}
          maxCombo={gameState.maxCombo}
          isMdOrLarger={isMdOrLarger}
        />
      </div>
      <div className="bg-slate-800 relative">
        <Grid
          grid={gameState.grid}
          rows={10}
          cols={8}
          draggingPiece={gameState.draggingPiece}
          gridRef={gridRef}
          startDragging={(rowIndex, colIndex, e) => {
            if (gameState.isAnimating || gameState.isTxProcessing) return;
            const piece = gameState.grid[rowIndex][colIndex];
            if (!piece.pieceId) return;

            const gridRect = gridRef.current?.getBoundingClientRect();
            const cellWidth = gridRect ? gridRect.width / 8 : 0;
            const startX = gridRect ? gridRect.left + colIndex * cellWidth : 0;

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clickOffset = clientX - startX;

            setGameState((prev) => ({
              ...prev,
              isDragging: true,
              draggingPiece: {
                row: rowIndex,
                col: colIndex,
                startX: startX,
                currentX: startX,
                clickOffset: clickOffset,
              },
            }));
          }}
          handleRowClick={handleRowClick}
          handleCellClick={handleCellClick}
          isTxProcessing={gameState.isTxProcessing}
          isAnimating={gameState.isAnimating}
          isLineComplete={(row) => row.every((cell) => cell.pieceId !== null)}
        />
      </div>
    </Card>
  );
};

export default GameBoard;
