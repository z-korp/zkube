import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { getThemeColors, THEME_META, type ThemeId, FONT_TITLE, FONT_BODY, hexToRgb } from '../../utils/colors';

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

  const draw = useCallback(
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

      g.rect(0, 0, width, 2);
      g.fill({ color: colors.accent, alpha: 0.5 });
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

  const subtitleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 10,
        fill: 0xffffff,
      }),
    [],
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} eventMode="none" />
      <pixiText
         text={`${meta.icon} ZONE ${zone} - ${meta.name.toUpperCase()}`}
         x={width / 2}
         y={14}
         anchor={{ x: 0.5, y: 0 }}
         style={titleStyle}
         eventMode="none"
       />
      <pixiText
        text={meta.description}
        x={width / 2}
        y={32}
        anchor={{ x: 0.5, y: 0 }}
        style={subtitleStyle}
        alpha={0.5}
        eventMode="none"
      />
    </pixiContainer>
  );
};

export default ZoneBackground;
