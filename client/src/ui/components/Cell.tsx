import React from "react";
import { Piece, Cell as CellType } from "@/types/types";
import GetElementStyle from "../theme/GetElementStyle";
import useTemplateTheme from "@/hooks/useTemplateTheme";
import { useMediaQuery } from "react-responsive";

const PIECES: Piece[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];

interface CellProps {
  cell: CellType;
  rowIndex: number;
  colIndex: number;
  isLineComplete: boolean;
  draggingPiece: any;
  gridRef: any;
  cols: number;
  rows: number;
  isTxProcessing: boolean;
  isAnimating: boolean;
  startDragging: (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  handleRowClick: (rowIndex: number) => void;
}

const Cell: React.FC<CellProps> = ({
  cell,
  rowIndex,
  colIndex,
  isLineComplete,
  draggingPiece,
  gridRef,
  cols,
  rows,
  isTxProcessing,
  isAnimating,
  startDragging,
  handleRowClick,
}) => {
  const piece = PIECES.find((p) => p.id === cell.pieceId);
  const { themeTemplate } = useTemplateTheme();
  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });

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
        className={`bg-secondary flex items-center justify-center cursor-move absolute ${isLineComplete ? "wiggle-blink" : ""}  ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"} `}
        style={{
          ...GetElementStyle(piece.element, themeTemplate),
          width: `${piece.width * cellWidth}px`,
          height: `${cellHeight}px`,
          left: `${colIndex * cellWidth - offsetGap}px`,
          top: `${rowIndex * cellHeight - offsetGap}px`,
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
          zIndex: isDragging ? 1000 : 500,
        }}
        onMouseDown={(e) => startDragging(rowIndex, colIndex, e)}
        onTouchStart={(e) => startDragging(rowIndex, colIndex, e)}
        onClick={() => handleRowClick(rowIndex)}
      ></div>
    );
  }
  return null;
};

export default Cell;
