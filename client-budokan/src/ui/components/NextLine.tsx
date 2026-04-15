import { useEffect, useMemo, useState } from "react";
import type { Block } from "@/types/types";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { getThemeImages, type ThemeId } from "@/config/themes";

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
  const { themeTemplate } = useTheme();
  const themeImages = getThemeImages(themeTemplate as ThemeId);

  const blockImages = useMemo<Record<number, string>>(() => ({
    1: themeImages.block1,
    2: themeImages.block2,
    3: themeImages.block3,
    4: themeImages.block4,
  }), [themeImages]);

  useEffect(() => {
    setBlocks(nextLineData);
  }, [nextLineData]);

  const svgW = gridWidth * gridSize;
  const svgH = gridHeight * gridSize;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={svgW}
      height={svgH}
    >
      {/* Grid lines */}
      {Array.from({ length: gridWidth + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={i * gridSize} y1={0}
          x2={i * gridSize} y2={svgH}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1}
        />
      ))}
      <line x1={0} y1={0} x2={svgW} y2={0} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      <line x1={0} y1={svgH} x2={svgW} y2={svgH} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />

      {/* Blocks */}
      {blocks.map((block) => {
        const x = block.x * gridSize;
        const y = block.y * gridSize;
        const w = block.width * gridSize;
        const h = gridSize;
        const imageUrl = blockImages[block.width] ?? "";
        return (
          <image
            key={block.id}
            href={imageUrl}
            x={x} y={y}
            width={w} height={h}
            preserveAspectRatio="none"
          />
        );
      })}
    </svg>
  );
};

export default NextLine;
