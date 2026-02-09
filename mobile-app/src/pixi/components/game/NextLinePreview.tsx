import { useCallback, useMemo, useState, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle, Texture, Assets } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { getBlockColors , FONT_BODY } from '../../utils/colors';
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
 * Block renderer for preview that matches main grid style
 */
const PreviewBlock = ({ 
  block, 
  cellSize 
}: { 
  block: Block; 
  cellSize: number;
}) => {
  const { themeName, colors } = usePixiTheme();
  const [texture, setTexture] = useState<Texture | null>(null);
  const blockColors = useMemo(() => getBlockColors(themeName, block.width), [themeName, block.width]);

  const x = block.x * cellSize;
  const width = block.width * cellSize;
  const height = cellSize;

  // Load texture for tiki theme (same as BlockSprite)
  useEffect(() => {
    const texturePath = `/assets/${themeName}/block-${block.width}.png`;
    Assets.load(texturePath)
      .then(setTexture)
      .catch(() => {
        // Fallback to default assets folder
        Assets.load(`/assets/block-${block.width}.png`)
          .then(setTexture)
          .catch(console.error);
      });
  }, [block.width, themeName]);

  if (!texture) {
    // Loading placeholder
    return (
      <pixiGraphics 
        x={x} 
        y={0} 
        draw={(g) => {
          g.clear();
          g.rect(2, 2, width - 4, height - 4);
          g.fill({ color: blockColors.fill, alpha: 0.3 });
        }} 
      />
    );
  }

  return (
    <pixiSprite
      texture={texture}
      x={x}
      y={0}
      width={width}
      height={height}
      alpha={0.9}
    />
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
  const { colors } = usePixiTheme();

  const width = gridCols * cellSize;
  const height = cellSize;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, width, height, 8);
    g.fill({ color: 0x0d1a2a, alpha: 0.7 });
    g.roundRect(0, 0, width, height, 8);
    g.stroke({ color: 0x334155, width: 1, alpha: 0.3 });
  }, [width, height]);

  // Filter to only row 0 blocks (the next line)
  const nextLineBlocks = useMemo(() => {
    return blocks.filter(block => block.y === 0);
  }, [blocks]);

  if (isConsumed || nextLineBlocks.length === 0) {
    const labelStyle = useMemo(() => new TextStyle({
      fontFamily: FONT_BODY,
      fontSize: 10,
      fontWeight: 'normal',
      fill: 0x64748b,
      letterSpacing: 1,
    }), []);

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
