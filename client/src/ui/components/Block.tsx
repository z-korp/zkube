import React, { useEffect, useRef, useState } from "react";
import { GameState } from "@/enums/gameEnums";

interface BlockProps {
  block: {
    id: number;
    width: number;
    x: number;
    y: number;
  };
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
  selectBlock?: (block: BlockProps["block"]) => void;
}

const Block: React.FC<BlockProps> = ({
  block,
  gridSize,
  transitionDuration = 100,
  isTxProcessing = false,
  state,
  handleMouseDown = () => {},
  handleTouchStart = () => {},
  onTransitionBlockStart = () => {},
  onTransitionBlockEnd = () => {},
  selectBlock = () => {},
}) => {
  const [transitionStatus, setTransition] = useState("End");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current === null) return;

    const onTransitionStart = () => {
      onTransitionBlockStart();
      setTransition("Start");
    };

    // Ajout de l'événement
    ref.current.addEventListener("transitionstart", onTransitionStart);

    // Nettoyage de l'événement à la fin du cycle de vie
    return () => {
      ref.current?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, []);

  // Gestion de la fin de la transition via l'événement onTransitionEnd
  const handleTransitionEnd = () => {
    setTransition("End");
    onTransitionBlockEnd(); // Notifier que la transition est terminée
  };

  return (
    <div
      className={`block block-${block.width} ${isTxProcessing ? "cursor-wait" : ""}`}
      ref={ref}
      style={{
        position: "absolute",
        top: `${block.y * gridSize + 1}px`,
        left: `${block.x * gridSize + 1}px`,
        width: `${block.width * gridSize}px`,
        height: `${gridSize}px`,
        transition:
          state === GameState.GRAVITY || state === GameState.GRAVITY2
            ? `top ${transitionDuration / 1000}s linear`
            : "none", // Désactivation de la transition autrement
        color: "white",
      }}
      onMouseDown={(e) => handleMouseDown(e, block)}
      onTouchStart={(e) => handleTouchStart(e, block)}
      onTransitionEnd={handleTransitionEnd}
      onClick={() => selectBlock(block)}
    ></div>
  );
};

export default Block;
