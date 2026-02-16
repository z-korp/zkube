import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { FONT_BODY, type ThemeId } from '../../utils/colors';
import { usePixiTheme } from '../../themes/ThemeContext';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { drawCubeIcon } from '../ui/Icons';

interface CubeBalanceProps {
  balance: number;
  x: number;
  y: number;
  height: number;
  uiScale: number;
}

/**
 * Cube currency display with icon and balance
 */
export const CubeBalance = ({ balance, x, y, height, uiScale }: CubeBalanceProps) => {
  const { themeName } = usePixiTheme();
  const iconCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.IconCube),
    [themeName],
  );
  const iconTex = useTextureWithFallback(iconCandidates);

  const fontSize = Math.round(14 * uiScale);
  const iconSize = height * 0.7;
  const padding = Math.round(10 * uiScale);
  const iconPadding = Math.round(6 * uiScale);
  
  // Calculate width based on text length
  const textWidth = Math.max(40, String(balance).length * fontSize * 0.6 + 10);
  const totalWidth = iconSize + textWidth + padding * 2 + iconPadding;

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    const radius = height * 0.35;
    g.roundRect(0, 0, totalWidth, height, radius);
    g.fill({ color: 0x1e293b, alpha: 0.85 });
    g.roundRect(0, 0, totalWidth, height, radius);
    g.stroke({ color: 0x475569, width: 1, alpha: 0.35 });
  }, [totalWidth, height]);

  const drawIcon = useCallback((g: PixiGraphics) => {
    drawCubeIcon(g, iconSize);
  }, [iconSize]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize,
    fontWeight: 'bold',
    fill: 0xffffff,
    letterSpacing: 0.5,
  }), [fontSize]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBackground} eventMode="none" />
      
      {iconTex ? (
        <pixiSprite
          texture={iconTex}
          x={padding + iconSize / 2}
          y={height / 2}
          width={iconSize}
          height={iconSize}
          anchor={0.5}
          eventMode="none"
        />
      ) : (
        <pixiGraphics
          x={padding + iconSize / 2}
          y={height / 2}
          draw={drawIcon}
          eventMode="none"
        />
      )}
      
      <pixiText
        text={balance.toLocaleString()}
        x={padding + iconSize + iconPadding}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={textStyle}
        eventMode="none"
      />
    </pixiContainer>
  );
};

export default CubeBalance;
