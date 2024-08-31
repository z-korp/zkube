import React from "react";
import Cell from "./Cell";
import { CellType } from "@/types/types";

interface GridProps {
  grid: CellType[][];
  rows: number;
  cols: number;
  draggingPiece: any;
  gridRef: React.RefObject<HTMLDivElement>;
  startDragging: (rowIndex: number, colIndex: number, e: any) => void;
  handleRowClick: (rowIndex: number) => void;
  handleCellClick: (rowIndex: number, colIndex: number) => void;
  isTxProcessing: boolean;
  isAnimating: boolean;
  isLineComplete: (row: CellType[]) => boolean;
}

const Grid: React.FC<GridProps> = ({
  grid,
  rows,
  cols,
  draggingPiece,
  gridRef,
  startDragging,
  handleRowClick,
  handleCellClick,
  isTxProcessing,
  isAnimating,
  isLineComplete,
}) => {
  return (
    <div
      ref={gridRef}
      className="w-[300px] md:w-[412px] border-4 border-slate-800 grid grid-cols-8 grid-rows-10 gap-1"
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

      {/* Pieces */}
      {grid.map((row, rowIndex) => {
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
                draggingPiece={draggingPiece}
                gridRef={gridRef}
                cols={cols}
                rows={rows}
                startDragging={startDragging}
                handleRowClick={handleRowClick}
                handleCellClick={handleCellClick}
                isTxProcessing={isTxProcessing}
                isAnimating={isAnimating}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};
