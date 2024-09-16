// PieceComponent.tsx
import React from "react";
import { Piece } from "@/types/Piece";
import { useTheme } from "@/ui/elements/theme-provider";
import GetElementStyle from "../theme/GetElementStyle";
import { useMediaQuery } from "react-responsive";

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

export const PIECES: Piece[] = [
    { id: 1, width: 1, element: "stone1" },
    { id: 2, width: 2, element: "stone2" },
    { id: 3, width: 3, element: "stone3" },
    { id: 4, width: 4, element: "stone4" },
  ];

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

  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });
// const gridRect = gridRef.current?.getBoundingClientRect();
// const cellWidth = gridRect ? gridRect.width / cols : 0;
//     const cellHeight = gridRect ? gridRect.height / rows : 0;
  const offsetGapWidth = isSmallScreen ? 3 : 5;
  const offsetGapHeight = isSmallScreen ? 4 : 4;
  const widthPiece = isSmallScreen ? 48 : 32;

  return (
    <div
      className={`absolute ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"}`}
      style={{
        ...GetElementStyle(piece.element, themeTemplate),
        width: `${piece.width * widthPiece + (piece.width - 1) * offsetGapWidth + offsetGapHeight}px`,
        height: `${widthPiece}px`,
        left: `${startCol * widthPiece + startCol * offsetGapWidth - offsetGapHeight / 2}px`,
        top: `${startRow * widthPiece + startRow * offsetGapHeight}px`,
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