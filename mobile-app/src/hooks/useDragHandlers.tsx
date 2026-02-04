import { MoveType } from "@/enums/moveEnum";
import { useCallback } from "react";

const useDragHandlers = (
  handleDragMove: (clientX: number, moveType: MoveType) => void,
) => {
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX, MoveType.MOUSE);
    },
    [handleDragMove],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleDragMove(touch.clientX, MoveType.TOUCH);
    },
    [handleDragMove],
  );

  return {
    handleMouseMove,
    handleTouchMove,
  };
};

export default useDragHandlers;
