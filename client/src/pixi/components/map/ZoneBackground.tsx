import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { getThemeColors, THEME_META, type ThemeId, FONT_TITLE, hexToRgb } from '../../utils/colors';
import { getThemeMapConfig } from '../../utils/mapLayout';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';

export interface ZoneBackgroundProps {
  zone: number;
  themeId: ThemeId;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ZoneBackground = ({ zone, themeId, x, y, width, height }: ZoneBackgroundProps) => {
  const colors = getThemeColors(themeId);
  const meta = THEME_META[themeId];

  const mapCandidates = useMemo(() => resolveAsset(themeId, AssetId.Map), [themeId]);
  const mapTexture = useTextureWithFallback(mapCandidates);
  const hasBackgroundImage = !!mapTexture;

  const config = getThemeMapConfig(themeId);

  // Cover-mode dimensions: scale image to fill zone without distortion
  const coverLayout = useMemo(() => {
    if (!hasBackgroundImage || !mapTexture) return null;
    const imageAR = config.imageAspectRatio ?? (mapTexture.width / mapTexture.height);
    const viewportAR = width / height;
    let displayW: number;
    let displayH: number;
    if (viewportAR > imageAR) {
      displayW = width;
      displayH = width / imageAR;
    } else {
      displayH = height;
      displayW = height * imageAR;
    }
    const offsetX = (width - displayW) / 2;
    const offsetY = (height - displayH) / 2;
    return { displayW, displayH, offsetX, offsetY };
  }, [hasBackgroundImage, mapTexture, config.imageAspectRatio, width, height]);

  const drawCoverMask = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.rect(0, 0, width, height);
      g.fill({ color: 0xffffff });
    },
    [width, height],
  );

  const drawGradient = useCallback(
    (g: PixiGraphics) => {
      g.clear();

      const startRgb = hexToRgb(colors.backgroundGradientStart);
      const endRgb = hexToRgb(colors.backgroundGradientEnd);
      const steps = 12;
      const stepH = Math.ceil(height / steps) + 1;

      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
        const gC = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
        const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);
        g.rect(0, i * stepH, width, stepH);
        g.fill({ color: (r << 16) | (gC << 8) | b, alpha: 0.85 });
      }
    },
    [width, height, colors],
  );

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_TITLE,
        fontSize: 14,
        fill: colors.accent,
        letterSpacing: 2,
      }),
    [colors.accent],
  );

  return (
    <pixiContainer x={x} y={y}>
      {hasBackgroundImage && coverLayout ? (
        <pixiContainer>
          <pixiGraphics
            draw={drawCoverMask}
            ref={(ref: PixiGraphics | null) => {
              if (ref?.parent) ref.parent.mask = ref;
            }}
          />
          <pixiSprite
            texture={mapTexture}
            x={coverLayout.offsetX}
            y={coverLayout.offsetY}
            width={coverLayout.displayW}
            height={coverLayout.displayH}
            eventMode="none"
          />
        </pixiContainer>
      ) : (
        <pixiGraphics draw={drawGradient} eventMode="none" />
      )}
      <pixiText
        text={`${meta.icon} ZONE ${zone} - ${meta.name.toUpperCase()}`}
        x={width / 2}
        y={14}
        anchor={{ x: 0.5, y: 0 }}
        style={titleStyle}
        alpha={0.3}
        eventMode="none"
      />
    </pixiContainer>
  );
};

export default ZoneBackground;
