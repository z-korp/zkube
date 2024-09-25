import React, { useEffect, useState } from "react";
import { Block } from "@/types/types";
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
    <div className={`grid-background`}>
      <div
        className={`relative p-r-[1px] p-b-[1px] touch-action-none display-grid grid grid-cols-[repeat(${gridWidth},${gridSize}px)] grid-rows-[repeat(${gridHeight},${gridSize}px)]`}
        style={{
          height: `${gridHeight * gridSize + borderSize}px`,
          width: `${gridWidth * gridSize + borderSize}px`,
          backgroundImage:
            "linear-gradient(#1E293B 2px, transparent 2px), linear-gradient(to right, #1E293B 2px, #10172A 2px)",
          backgroundSize: `${gridSize}px ${gridSize}px`,
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
