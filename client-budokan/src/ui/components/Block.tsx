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
  /** Map of block width (1-4) → image URL */
  blockImages: Record<number, string>;
  onPointerDown?: (
    e: React.PointerEvent<SVGGElement>,
    block: Block,
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
  blockImages,
  onPointerDown,
  onTransitionBlockStart,
  onTransitionBlockEnd,
}) => {
  const ref = useRef<SVGGElement | null>(null);

  const isGravity =
    state === GameState.GRAVITY ||
    state === GameState.GRAVITY2 ||
    state === GameState.GRAVITY_BONUS;

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    const onTransitionStart = (event: TransitionEvent) => {
      if (event.propertyName !== "transform") return;
      if (!isGravity) return;
      onTransitionBlockStart?.(block.id);
    };

    element.addEventListener("transitionstart", onTransitionStart);
    return () => {
      element?.removeEventListener("transitionstart", onTransitionStart);
    };
  }, [onTransitionBlockStart, isGravity, block.id]);

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<SVGGElement>) => {
      if (e.propertyName !== "transform") return;
      onTransitionBlockEnd?.(block.id);
    },
    [onTransitionBlockEnd, block.id],
  );

  const x = block.x * gridSize;
  const y = block.y * gridSize;
  const w = block.width * gridSize;
  const h = gridSize;
  const imageUrl = blockImages[block.width] ?? "";

  return (
    <g
      ref={ref}
      className="svg-block"
      style={{
        transform: `translate(${x}px, ${y}px)`,
        transition: isGravity
          ? `transform ${transitionDuration / 1000}s linear`
          : "none",
        cursor: isTxProcessing ? "wait" : "grab",
      }}
      onPointerDown={(e) => onPointerDown?.(e, block)}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Inner group for explosion animation — doesn't conflict with outer translate */}
      <g
        className={isExploding ? "svg-block-exploding" : ""}
        style={{ transformOrigin: `${w / 2}px ${h / 2}px` }}
      >
        <image
          href={imageUrl}
          x={0}
          y={0}
          width={w}
          height={h}
          preserveAspectRatio="none"
        />
      </g>
    </g>
  );
};

export default React.memo(BlockContainer);
