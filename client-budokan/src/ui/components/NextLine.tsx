import { useEffect, useState } from "react";
import type { Block } from "@/types/types";
import BlockContainer from "@/ui/components/Block";

interface NextLineProps {
  nextLineData: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
}

const NextLine = ({
  nextLineData,
  gridHeight,
  gridSize,
  gridWidth,
}: NextLineProps) => {
  const [blocks, setBlocks] = useState<Block[]>(nextLineData);

  const borderSize = 2;

  useEffect(() => {
    setBlocks(nextLineData);
  }, [nextLineData]);

  return (
    <div className="grid-background static-border">
      <div
        className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)]`}
        style={{
          height: `${gridHeight * gridSize + borderSize}px`,
          width: `${gridWidth * gridSize + borderSize}px`,
          backgroundImage:
            `linear-gradient(var(--theme-grid-lines, #1E293B) 2px, transparent 2px), linear-gradient(to right, var(--theme-grid-lines, #1E293B) 2px, transparent 2px), linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), var(--theme-grid-bg-image, none)`,
          backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, cover, cover`,
          backgroundColor: `var(--theme-grid-bg, #10172A)`,
        }}
      >
        {blocks.map((block) => (
          <BlockContainer key={block.id} block={block} gridSize={gridSize} />
        ))}
      </div>
    </div>
  );
};

export default NextLine;
