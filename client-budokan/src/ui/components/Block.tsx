import React, { useCallback, useEffect, useRef } from "react";
import { GameState } from "@/enums/gameEnums";
import type { Block } from "@/types/types";

interface BlockProps {
  block: Block;
  gridSize: number;
  gridHeight?: number;
  isTxProcessing?: boolean;
  transitionDuration?: number;
  state?: GameState;
  isExploding?: boolean;
  handleMouseDown?: (
    e: React.MouseEvent<HTMLDivElement>,
    block: Block
  ) => void;
  handleTouchStart?: (
    e: React.TouchEvent<HTMLDivElement>,
    block: Block
  ) => void;
  onTransitionBlockStart?: (id: number) => void;
  onTransitionBlockEnd?: (id: number) => void;
}

const BlockContainer: React.FC<BlockProps> = ({
  block,
  gridSize,
  gridHeight = 10,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  isExploding = false,
  handleMouseDown,
  handleTouchStart,
  onTransitionBlockStart,
  onTransitionBlockEnd,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const onTransitionStart = (event: TransitionEvent) => {
      if (event.propertyName !== "top") return;
      if (
        state !== GameState.GRAVITY &&
        state !== GameState.GRAVITY2 &&
        state !== GameState.GRAVITY_BONUS
      ) {
        return;
      }
      onTransitionBlockStart?.(block.id);
    };

    element.addEventListener("transitionstart", onTransitionStart);

    return () => {
      element?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, [onTransitionBlockStart, state, block.id]);

  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "top") return;
      onTransitionBlockEnd?.(block.id);
    },
    [onTransitionBlockEnd, block.id],
  );

  return (
    <div
      className={`block block-${block.width} ${
        isTxProcessing ? "cursor-wait" : ""
      } ${block.y != gridHeight - 1 ? "z-10" : ""} ${isExploding ? "block-exploding" : ""}`}
      ref={ref}
      style={{
        position: "absolute",
        top: `${block.y * gridSize + 1}px`,
        left: `${block.x * gridSize + 1}px`,
        width: `${block.width * gridSize}px`,
        height: `${gridSize}px`,
        transition:
          state === GameState.GRAVITY ||
          state === GameState.GRAVITY2 ||
          state === GameState.GRAVITY_BONUS
            ? `top ${transitionDuration / 1000}s linear`
            : "none",
        color: "white",
      }}
      onMouseDown={(e) => handleMouseDown?.(e, block)}
      onTouchStart={(e) => handleTouchStart?.(e, block)}
      onTransitionEnd={handleTransitionEnd}
    ></div>
  );
};

export default React.memo(BlockContainer);
