import { useCallback, useMemo, useState, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle, Texture, Assets } from 'pixi.js';
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
 * Block renderer for preview that matches main grid style
 */
const PreviewBlock = ({ 
  block, 
  cellSize 
}: { 
  block: Block; 
  cellSize: number;
}) => {
  const { themeName, isProcedural, colors } = usePixiTheme();
  const [texture, setTexture] = useState<Texture | null>(null);
  const blockColors = useMemo(() => getBlockColors(themeName, block.width), [themeName, block.width]);

  const x = block.x * cellSize;
  const width = block.width * cellSize;
  const height = cellSize;

  // Load texture for tiki theme (same as BlockSprite)
  useEffect(() => {
    if (isProcedural) {
      setTexture(null);
      return;
    }
    
    const texturePath = `/assets/${themeName}/block-${block.width}.png`;
    Assets.load(texturePath)
      .then(setTexture)
      .catch(() => {
        // Fallback to default assets folder
        Assets.load(`/assets/block-${block.width}.png`)
          .then(setTexture)
          .catch(console.error);
      });
  }, [block.width, isProcedural, themeName]);

  // Procedural neon drawing
  const drawNeon = useCallback((g: PixiGraphics) => {
    g.clear();
    
    const padding = 2;
    const radius = 6;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;
    
    // Main fill
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.fill({ color: blockColors.fill, alpha: 0.8 });
    
    // Border
    g.roundRect(padding, padding, innerWidth, innerHeight, radius);
    g.stroke({ color: 0xFFFFFF, width: 1.5, alpha: 0.3 });
    
    // Highlight
    g.roundRect(padding + 2, padding + 2, innerWidth - 4, innerHeight * 0.35, radius - 1);
    g.fill({ color: lightenColor(blockColors.fill, 30), alpha: 0.25 });
  }, [width, height, blockColors]);

  // Procedural rendering (neon theme)
  if (isProcedural) {
    return <pixiGraphics x={x} y={0} draw={drawNeon} />;
  }

  // Texture rendering (tiki theme)
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
  const { colors, isProcedural } = usePixiTheme();

  const width = gridCols * cellSize;
  const height = cellSize;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Subtle background to differentiate from grid
    g.rect(0, 0, width, height);
    g.fill({ color: isProcedural ? 0x0a0a12 : 0x0d1520, alpha: 0.8 });
    
    // Top border separator
    g.moveTo(0, 0);
    g.lineTo(width, 0);
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 1, alpha: 0.4 });
    
    // "NEXT" indicator line on left
    g.moveTo(4, 4);
    g.lineTo(4, height - 4);
    g.stroke({ color: isProcedural ? colors.accent : 0x3b82f6, width: 2, alpha: 0.6 });
  }, [width, height, isProcedural, colors.accent]);

  // Filter to only row 0 blocks (the next line)
  const nextLineBlocks = useMemo(() => {
    return blocks.filter(block => block.y === 0);
  }, [blocks]);

  if (isConsumed || nextLineBlocks.length === 0) {
    const labelStyle = new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      fontWeight: 'normal',
      fill: 0x64748b,
      letterSpacing: 1,
    });

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
