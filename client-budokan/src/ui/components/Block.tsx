import React, { useEffect, useRef } from "react";
import { GameState } from "@/enums/gameEnums";
import { Block } from "@/types/types";

interface BlockProps {
  block: Block;
  gridSize: number;
  gridHeight?: number;
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
}

const BlockContainer: React.FC<BlockProps> = ({
  block,
  gridSize,
  gridHeight = 10,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  handleMouseDown,
  handleTouchStart,
  onTransitionBlockStart,
  onTransitionBlockEnd,
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current
    if (element === null) return;

    const onTransitionStart = () => {
      if (onTransitionBlockStart !== undefined) onTransitionBlockStart();
    };

    element.addEventListener("transitionstart", onTransitionStart);

    return () => {
      element?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, [onTransitionBlockStart]);

  // Gestion de la fin de la transition via l'événement onTransitionEnd
  const handleTransitionEnd = () => {
    //setTriggerParticles(true);
    if (onTransitionBlockEnd !== undefined) onTransitionBlockEnd(); // Notifier que la transition est terminée
  };

  return (
    <div
      className={`block block-${block.width} ${isTxProcessing ? "cursor-wait" : ""} ${block.y != gridHeight - 1 ? "z-10" : ""}`}
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
            : "none", // Désactivation de la transition autrement
        color: "white",
      }}
      onMouseDown={(e) => {
        if (handleMouseDown !== undefined) handleMouseDown(e, block);
      }}
      onTouchStart={(e) => {
        if (handleTouchStart !== undefined) handleTouchStart(e, block);
      }}
      onTransitionEnd={handleTransitionEnd}
    ></div>
  );
};

export default BlockContainer;
