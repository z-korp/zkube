/**
 * PageTopBar - Consistent top bar for all pages
 * 
 * Layout: [Home Button] [Title] [Action Button (optional)]
 * Uses theme-1 style with tropical/sky colors
 */

import { useMemo, useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { usePageNavigator } from './PageNavigator';
import { FONT_TITLE, FONT_BODY, type ThemeId } from '../../utils/colors';
import { PixiButton } from '../../ui/PixiButton';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { usePixiTheme } from '../../themes/ThemeContext';
import { color } from '@/pixi/design/tokens';

const PAGE_TITLE_STYLE = {
  fontFamily: FONT_TITLE, fontSize: 20, fill: color.text.primary,
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, distance: 1, color: color.bg.overlay },
};
const PAGE_SUBTITLE_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: color.text.secondary };
const BALANCE_TEXT_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary };

interface PageTopBarProps {
  title: string;
  subtitle?: string;
  screenWidth: number;
  topBarHeight: number;
  showHomeButton?: boolean;
  actionIcon?: string;
  onAction?: () => void;
  cubeBalance?: number;
  showCubeBalance?: boolean;
}

const CubeBalanceDisplay = ({
  balance,
  x,
  y,
  height,
}: {
  balance: number;
  x: number;
  y: number;
  height: number;
}) => {
  const width = 100;
  const { themeName } = usePixiTheme();
  const iconSize = height * 0.5;

  const cubeCandidates = useMemo(
    () => resolveAsset(themeName as ThemeId, AssetId.IconCube),
    [themeName],
  );
  const cubeTexture = useTextureWithFallback(cubeCandidates);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.primary, alpha: 0.9 });
      g.roundRect(0, 0, width, height, height / 2);
      g.fill();
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.5 });
      g.roundRect(0, 0, width, height, height / 2);
      g.stroke();
    },
    [height],
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} eventMode="none" />
      {cubeTexture ? (
        <pixiSprite
          texture={cubeTexture}
          x={14}
          y={height / 2}
          width={iconSize}
          height={iconSize}
          anchor={{ x: 0, y: 0.5 }}
          eventMode="none"
        />
      ) : null}
      <pixiText
        text={String(balance)}
        x={14 + iconSize + 4}
        y={height / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={BALANCE_TEXT_STYLE}
        eventMode="none"
      />
    </pixiContainer>
  );
};

// ============================================================================
// PAGE TOP BAR
// ============================================================================

export const PageTopBar = ({
  title,
  subtitle,
  screenWidth,
  topBarHeight,
  showHomeButton = true,
  actionIcon,
  onAction,
  cubeBalance,
  showCubeBalance = false,
}: PageTopBarProps) => {
  const { goHome } = usePageNavigator();

  const btnSize = Math.max(40, Math.min(48, topBarHeight - 12));
  const padding = 12;
  const centerY = (topBarHeight - btnSize) / 2;

  // Draw background
  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Semi-transparent dark background
      g.rect(0, 0, screenWidth, topBarHeight);
      g.fill({ color: color.bg.overlay, alpha: 1 });
      g.rect(0, topBarHeight - 1, screenWidth, 1);
      g.fill({ color: color.bg.primary, alpha: 0.5 });
    },
    [screenWidth, topBarHeight]
  );

  return (
    <pixiContainer>
      <pixiGraphics
        draw={drawBg}
        eventMode="static"
        onPointerDown={(e: any) => e.stopPropagation()}
      />

      {showHomeButton && (
        <PixiButton
          x={padding}
          y={centerY}
          width={btnSize}
          height={btnSize}
          iconOnly
          icon="close"
          onPress={goHome}
        />
      )}

      <pixiContainer x={screenWidth / 2} y={topBarHeight / 2}>
        <pixiText text={title.toUpperCase()} x={0} y={subtitle ? -8 : 0} anchor={0.5} style={PAGE_TITLE_STYLE} eventMode="none" />
        {subtitle && (
          <pixiText text={subtitle.toUpperCase()} x={0} y={10} anchor={0.5} style={PAGE_SUBTITLE_STYLE} eventMode="none" />
        )}
      </pixiContainer>

      {showCubeBalance && cubeBalance !== undefined ? (
        <CubeBalanceDisplay
          balance={cubeBalance}
          x={screenWidth - padding - 100}
          y={centerY}
          height={btnSize}
        />
      ) : actionIcon && onAction ? (
        <PixiButton
          x={screenWidth - padding - btnSize}
          y={centerY}
          width={btnSize}
          height={btnSize}
          iconOnly
          icon="close"
          onPress={onAction}
        />
      ) : null}
    </pixiContainer>
  );
};

export default PageTopBar;
