import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { getBlockColors, lightenColor } from '../../utils/colors';
import type { Block } from '@/types/types';

interface NextLinePreviewProps {
  /** Blocks to display in the next line */
  blocks: Block[];
  /** Size of each cell */
  cellSize: number;
  /** Number of columns in the grid */
  gridCols: number;
  /** Y position of the preview */
  y: number;
  /** Whether the next line has been consumed (empty state) */
  isConsumed?: boolean;
}

/**
 * Simple block renderer for preview (no interactions)
 */
const PreviewBlock = ({ 
  block, 
  cellSize 
}: { 
  block: Block; 
  cellSize: number;
}) => {
  const { themeName, isProcedural } = usePixiTheme();
  const blockColors = useMemo(() => getBlockColors(themeName, block.width), [themeName, block.width]);

  const x = block.x * cellSize;
  const width = block.width * cellSize;
  const height = cellSize;

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const padding = 2;
    const radius = 6;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    
    // Main fill
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.fill({ color: blockColors.fill, alpha: 0.7 });
    
    // Border
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.stroke({ color: 0xFFFFFF, width: 1.5, alpha: 0.25 });
    
    // Highlight
    g.roundRect(padding + 2, padding + 2, innerWidth - 4, innerHeight * 0.35, radius - 1);
    g.fill({ color: lightenColor(blockColors.fill, 30), alpha: 0.2 });
  }, [width, height, blockColors]);

  return (
    <pixiGraphics x={x} y={0} draw={draw} />
  );
};

/**
 * Shows a preview of the next line that will be added to the grid
 */
export const NextLinePreview = ({
  blocks,
  cellSize,
  gridCols,
  y,
  isConsumed = false,
}: NextLinePreviewProps) => {
  const { colors, isProcedural } = usePixiTheme();

  const width = gridCols * cellSize;
  const height = cellSize;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Subtle background to differentiate from grid
    g.rect(0, 0, width, height);
    g.fill({ color: isProcedural ? 0x0f0f14 : 0x0f172a, alpha: 0.6 });
    
    // Top border to separate from grid
    g.moveTo(0, 0);
    g.lineTo(width, 0);
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 1, alpha: 0.3 });
  }, [width, height, isProcedural, colors.accent]);

  const labelStyle = new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fontWeight: 'normal',
    fill: 0x64748b,
    letterSpacing: 1,
  });

  // Filter to only row 0 blocks (the next line)
  const nextLineBlocks = useMemo(() => {
    return blocks.filter(block => block.y === 0);
  }, [blocks]);

  if (isConsumed || nextLineBlocks.length === 0) {
    return (
      <pixiContainer y={y}>
        <pixiGraphics draw={drawBackground} />
        <pixiText
          text="NEXT"
          x={width / 2}
          y={height / 2}
          anchor={0.5}
          style={labelStyle}
          alpha={0.5}
        />
      </pixiContainer>
    );
  }

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBackground} />
      
      {/* Next line blocks */}
      {nextLineBlocks.map((block) => (
        <PreviewBlock
          key={`next-${block.id}`}
          block={block}
          cellSize={cellSize}
        />
      ))}
    </pixiContainer>
  );
};

export default NextLinePreview;
