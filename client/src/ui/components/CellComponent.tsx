// CellComponent.tsx
import React from "react";
import { Cell as CellType } from "@/types/Cell";

interface CellComponentProps {
  cell: CellType;
  rowIndex: number;
  colIndex: number;
  handleCellClick: (rowIndex: number, colIndex: number) => void;
  isLineComplete: boolean;
}

const CellComponent: React.FC<CellComponentProps> = ({
  cell,
  rowIndex,
  colIndex,
  handleCellClick,
  isLineComplete,
}) => {
  return (
    <div
      className={`h-8 w-8 sm:w-12 sm:h-12 bg-secondary relative ${
        isLineComplete ? "line-complete" : ""
      }`}
      onClick={() => handleCellClick(rowIndex, colIndex)}
    ></div>
  );
};

export default CellComponent;