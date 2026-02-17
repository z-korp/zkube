import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { getBlockColors, FONT_BODY, type ThemeId } from '../../utils/colors';
import type { Block } from '@/types/types';
import { blockAssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { color } from '@/pixi/design/tokens';

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
  const { themeName } = usePixiTheme();
  const blockColors = useMemo(() => getBlockColors(themeName, block.width), [themeName, block.width]);

  const x = block.x * cellSize;
  const width = block.width * cellSize;
  const height = cellSize;

  const candidates = useMemo(
    () => resolveAsset(themeName as ThemeId, blockAssetId(block.width)),
    [block.width, themeName],
  );
  const texture = useTextureWithFallback(candidates);

  const drawPlaceholder = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(2, 2, width - 4, height - 4);
    g.fill({ color: blockColors.fill, alpha: 0.3 });
  }, [width, height, blockColors.fill]);

  if (!texture) {
    return (
      <pixiGraphics x={x} y={0} draw={drawPlaceholder} />
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
  const width = gridCols * cellSize;
  const height = cellSize;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, width, height, 8);
    g.fill({ color: color.bg.secondary, alpha: 0.7 });
    g.roundRect(0, 0, width, height, 8);
    g.stroke({ color: color.bg.surface, width: 1, alpha: 0.3 });
  }, [width, height]);

  // Filter to only row 0 blocks (the next line)
  const nextLineBlocks = useMemo(() => {
    return blocks.filter(block => block.y === 0);
  }, [blocks]);

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 10,
    fontWeight: 'normal',
    fill: color.text.muted,
    letterSpacing: 1,
  }), []);

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
