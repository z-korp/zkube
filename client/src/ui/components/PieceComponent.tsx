// PieceComponent.tsx
import React from "react";
import { Piece } from "@/types/Piece";
import { useTheme } from "@/ui/elements/theme-provider";
import GetElementStyle from "../theme/GetElementStyle";

interface PieceComponentProps {
  piece: Piece;
  startRow: number;
  startCol: number;
  draggingPiece: any;
  gridRef: React.RefObject<HTMLDivElement>;
  cols: number;
  rows: number;
  isTxProcessing: boolean;
  isAnimating: boolean;
  startDragging: (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
}

const PieceComponent: React.FC<PieceComponentProps> = ({
  piece,
  startRow,
  startCol,
  draggingPiece,
  gridRef,
  cols,
  rows,
  isTxProcessing,
  isAnimating,
  startDragging,
}) => {
  const { themeTemplate } = useTheme();
  const isDragging =
    draggingPiece?.row === startRow && draggingPiece.col === startCol;

  const dragOffset = isDragging
    ? draggingPiece.currentX - draggingPiece.startX
    : 0;

  const gridRect = gridRef.current?.getBoundingClientRect();
  const cellWidth = gridRect ? gridRect.width / cols : 0;
  const cellHeight = gridRect ? gridRect.height / rows : 0;

  return (
    <div
      className={`absolute ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"}`}
      style={{
        ...GetElementStyle(piece.element, themeTemplate),
        width: `${piece.width * cellWidth}px`,
        height: `${cellHeight}px`,
        left: `${startCol * cellWidth}px`,
        top: `${startRow * cellHeight}px`,
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
        zIndex: isDragging ? 1000 : 500,
      }}
      onMouseDown={(e) => startDragging(startRow, startCol, e)}
      onTouchStart={(
        e:
          | React.TouchEvent<HTMLDivElement>
          | React.MouseEvent<HTMLDivElement, MouseEvent>
      ) =>
        startDragging(
          startRow,
          startCol,
          e as React.MouseEvent<HTMLDivElement, MouseEvent>
        )
      }
    ></div>
  );
};

export default PieceComponent;