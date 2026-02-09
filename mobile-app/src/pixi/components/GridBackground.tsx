import { useCallback, useState, useEffect, useMemo } from 'react';
import { Graphics as PixiGraphics, Texture, Assets } from 'pixi.js';
import { usePixiTheme } from '../themes/ThemeContext';
import { THEME_ASSETS } from '../utils/colors';
import { GlowFilter } from '../extend';
import { usePulse } from '../hooks/useAnimatedValue';

interface GridBackgroundProps {
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  isPlayerInDanger: boolean;
}

export const FRAME_PAD = 12;

export const GridBackground = ({
  gridSize,
  gridWidth,
  gridHeight,
  isPlayerInDanger,
}: GridBackgroundProps) => {
  const { colors, getAssetPath } = usePixiTheme();

  const width = gridWidth * gridSize;
  const height = gridHeight * gridSize;

  const dangerAlpha = isPlayerInDanger ? colors.dangerZoneAlpha : 0;
  const dangerPulse = usePulse(isPlayerInDanger, { minScale: 0.6, maxScale: 1.0, duration: 800 });

  const dangerGlowFilter = useMemo(() => {
    if (!isPlayerInDanger) return null;
    return new GlowFilter({
      distance: 6,
      outerStrength: 3,
      innerStrength: 1,
      color: 0xef4444,
      quality: 0.1,
    });
  }, [isPlayerInDanger]);

  const dangerFilters = useMemo(() => dangerGlowFilter ? [dangerGlowFilter] : [], [dangerGlowFilter]);

  const drawDangerZone = useCallback((g: PixiGraphics) => {
    g.clear();
    if (dangerAlpha <= 0) return;
    g.rect(0, 0, width, gridSize * 2);
    g.fill({ color: colors.dangerZone, alpha: dangerAlpha * dangerPulse });
    g.moveTo(0, gridSize * 2);
    g.lineTo(width, gridSize * 2);
    g.stroke({ color: colors.dangerZone, width: 2, alpha: dangerAlpha * 2 * dangerPulse });
  }, [width, gridSize, colors.dangerZone, dangerAlpha, dangerPulse]);

  const [gridBgTex, setGridBgTex] = useState<Texture | null>(null);
  const [frameTex, setFrameTex] = useState<Texture | null>(null);

  useEffect(() => {
    const bgPath = getAssetPath(THEME_ASSETS.gridBg);
    const framePath = getAssetPath(THEME_ASSETS.gridFrame);
    Assets.load(bgPath).then(t => setGridBgTex(t as Texture)).catch(() => setGridBgTex(null));
    Assets.load(framePath).then(t => setFrameTex(t as Texture)).catch(() => setFrameTex(null));
  }, [getAssetPath]);

  const drawGridFill = useCallback((g: PixiGraphics) => {
    g.clear();

    const radius = 8;

    if (!gridBgTex) {
      g.roundRect(0, 0, width, height, radius);
      g.fill({ color: colors.gridBg, alpha: 0.92 });

      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          if ((x + y) % 2 === 0) {
            g.rect(x * gridSize, y * gridSize, gridSize, gridSize);
            g.fill({ color: colors.gridCellAlt, alpha: 0.25 });
          }
        }
      }
    }

    g.setStrokeStyle({ width: 1, color: colors.gridLines, alpha: colors.gridLinesAlpha });
    for (let x = 1; x < gridWidth; x++) {
      g.moveTo(x * gridSize, 0);
      g.lineTo(x * gridSize, height);
    }
    for (let y = 1; y < gridHeight; y++) {
      g.moveTo(0, y * gridSize);
      g.lineTo(width, y * gridSize);
    }
    g.stroke();

  }, [gridSize, gridWidth, gridHeight, width, height, colors, gridBgTex]);

  const frameRadius = 16;
  const drawFrame = useCallback((g: PixiGraphics) => {
    g.clear();

    if (!frameTex) {
      const fW = width + FRAME_PAD * 2;
      const fH = height + FRAME_PAD * 2;

      g.roundRect(0, 0, fW, fH, frameRadius);
      g.stroke({ color: colors.frameBorder, width: 4, alpha: 0.85 });

      g.roundRect(2, 2, fW - 4, fH - 4, frameRadius - 2);
      g.stroke({ color: colors.frameBorder, width: 1.5, alpha: 0.4 });

      const capR = 7;
      const positions = [
        [capR + 2, capR + 2],
        [fW - capR - 2, capR + 2],
        [capR + 2, fH - capR - 2],
        [fW - capR - 2, fH - capR - 2],
      ];
      for (const [cx, cy] of positions) {
        g.circle(cx, cy, capR);
        g.fill({ color: 0x2E7D32, alpha: 0.7 });
        g.circle(cx, cy, capR);
        g.stroke({ color: colors.frameBorder, width: 2, alpha: 0.8 });
      }
    }
  }, [width, height, colors, frameTex, frameRadius]);

  return (
    <pixiContainer>
      <pixiContainer x={-FRAME_PAD} y={-FRAME_PAD}>
        {frameTex ? (
          <pixiSprite
            texture={frameTex}
            width={width + FRAME_PAD * 2}
            height={height + FRAME_PAD * 2}
          />
        ) : (
          <pixiGraphics draw={drawFrame} />
        )}
      </pixiContainer>

      {gridBgTex && (
        <pixiSprite
          texture={gridBgTex}
          width={width}
          height={height}
        />
      )}

      <pixiGraphics draw={drawGridFill} />

      {isPlayerInDanger && (
        <pixiContainer filters={dangerFilters}>
          <pixiGraphics draw={drawDangerZone} />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

export default GridBackground;
