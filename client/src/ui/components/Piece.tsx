import React from "react";
import { PieceNew, PIECE_TYPES } from "@/types/types";
import GetElementStyle from "../theme/GetElementStyle";
import { useTheme } from "@/ui/elements/theme-provider";
import { useMediaQuery } from "react-responsive";

interface PieceProps {
  piece: PieceNew;
  cellIndex: number;
  isLineComplete: boolean;
  isDragging: boolean;
  dragOffset: number;
  isTxProcessing: boolean;
  isAnimating: boolean;
  startDragging: (rowIndex: number, colIndex: number, e: React.MouseEvent | React.TouchEvent) => void;
  handleRowClick: (rowIndex: number) => void;
  handleCellClick: (rowIndex: number, colIndex: number) => void;
}

const Piece: React.FC<PieceProps> = ({
  piece,
  cellIndex,
  isLineComplete,
  isDragging,
  dragOffset,
  isTxProcessing,
  isAnimating,
  startDragging,
  handleRowClick,
  handleCellClick
}) => {
  const { themeTemplate } = useTheme();
  const isSmallScreen = useMediaQuery({ query: "(min-width: 640px)" });

  const pieceType = PIECE_TYPES.find((p) => p.type === piece.type);
  if (!pieceType) return null;

  const offsetGapWidth = isSmallScreen ? 3 : 5;
  const offsetGapHeight = isSmallScreen ? 4 : 4;
  const widthPiece = isSmallScreen ? 48 : 32;

  return (
    <div
      className={`bg-secondary flex items-center justify-center ${
        isLineComplete ? "wiggle-blink" : ""
      } ${isTxProcessing || isAnimating ? "cursor-wait" : "cursor-move"}`}
      style={{
        ...GetElementStyle(pieceType.element, themeTemplate),
        width: `${piece.width * widthPiece + (piece.width - 1) * offsetGapWidth + offsetGapHeight}px`,
        height: `${widthPiece}px`,
        position: 'absolute',
        left: `${piece.col * widthPiece + piece.col * offsetGapWidth - offsetGapHeight / 2}px`,
        top: `${piece.row * widthPiece + piece.row * offsetGapHeight}px`,
        transform: `translateX(${dragOffset}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease-out",
        zIndex: isDragging ? 1000 : 500,
      }}
      onMouseDown={(e) => startDragging(piece.row, piece.col, e)}
      onTouchStart={(e) => startDragging(piece.row, piece.col, e)}
      onClick={() => {
        handleRowClick(piece.row);
        handleCellClick(piece.row, piece.col);
      }}
    ></div>
  );
};

export default Piece;