import React, { useEffect, useRef } from "react";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";

interface BlockProps {
  block: Block;
  gridSize: number;
  isTxProcessing?: boolean;
  transitionDuration?: number;
  state?: GameState;
  handleMouseDown?: (
    e: React.MouseEvent<HTMLDivElement>,
    block: BlockProps["block"],
  ) => void;
  handleTouchStart?: (
    e: React.TouchEvent<HTMLDivElement>,
    block: BlockProps["block"],
  ) => void;
  onTransitionBlockStart?: () => void;
  onTransitionBlockEnd?: () => void;
  isHighlighted?: boolean;
  highlightType?: "block" | "row";
  isClickable?: boolean; // If the block or row is clickable
}

const BlockContainer: React.FC<BlockProps> = ({
  block,
  gridSize,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  handleMouseDown,
  handleTouchStart,
  onTransitionBlockStart,
  onTransitionBlockEnd,
  isHighlighted,
  highlightType = "block",
  isClickable,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current === null) return;

    const element = ref.current; // Capture the current value
    const onTransitionStart = () => {
      onTransitionBlockStart && onTransitionBlockStart();
    };

    element.addEventListener("transitionstart", onTransitionStart);

    return () => {
      element.removeEventListener("transitionstart", onTransitionStart);
    };
  }, [block, onTransitionBlockStart]);

  const handleTransitionEnd = () => {
    onTransitionBlockEnd && onTransitionBlockEnd();
  };

  // Determine the CSS class based on highlight status
  const highlightClass = isHighlighted
    ? highlightType === "row"
      ? "ring-2 ring-yellow-400 ring-opacity-50" // Subtle row highlight
      : "ring-4 ring-yellow-400 animate-pulse" // Prominent block highlight
    : "";

  // Only make the block clickable if it's highlighted
  const isBlockClickable = isHighlighted && isClickable;

  return (
    <div
      className={`block block-${block.width} ${isTxProcessing ? "cursor-wait" : ""} ${highlightClass} ${isBlockClickable ? "cursor-pointer" : ""}`}
      ref={ref}
      style={{
        zIndex: isHighlighted ? 40 : "auto",
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
            : "none", // No transition in other states
        color: "white",
      }}
      onMouseDown={(e) => {
        if (isBlockClickable && handleMouseDown) {
          handleMouseDown(e, block); // Allow clicking only if it's clickable
        }
      }}
      onTouchStart={(e) => {
        if (isBlockClickable && handleTouchStart) {
          handleTouchStart(e, block); // Allow touch only if it's clickable
        }
      }}
      onTransitionEnd={handleTransitionEnd}
    ></div>
  );
};

export default BlockContainer;
