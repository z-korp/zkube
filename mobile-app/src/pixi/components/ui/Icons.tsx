import { useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { AssetId } from '../../assets/catalog';
import { resolveAsset } from '../../assets/resolver';
import { useTextureWithFallback } from '../../hooks/useTexture';
import { usePixiTheme } from '../../themes/ThemeContext';
import type { ThemeId } from '../../utils/colors';

// ============================================================================
// COLOR PALETTE (kept — used by non-icon components)
// ============================================================================

export const IconColors = {
  primary: 0xffffff,
  secondary: 0x94a3b8,
  accent: 0x3b82f6,
  gold: 0xfbbf24,
  danger: 0xef4444,
  success: 0x22c55e,
};

// ============================================================================
// ICON NAME → ASSET MAP
// ============================================================================

const ICON_ASSET_MAP: Record<string, AssetId> = {
  menu: AssetId.IconMenu,
  trophy: AssetId.IconTrophy,
  shop: AssetId.IconShop,
  quests: AssetId.IconScroll,
  scroll: AssetId.IconScroll,
  flag: AssetId.IconSurrender,
  surrender: AssetId.IconSurrender,
  cube: AssetId.IconCube,
  close: AssetId.IconClose,
  combo: AssetId.IconFire,
  fire: AssetId.IconFire,
  moves: AssetId.IconMoves,
  target: AssetId.IconScore,
  score: AssetId.IconScore,
  starFilled: AssetId.IconStarFilled,
  starEmpty: AssetId.IconStarEmpty,
  crown: AssetId.IconCrown,
  settings: AssetId.IconSettings,
  lock: AssetId.IconLock,
  music: AssetId.IconMusic,
  sound: AssetId.IconSound,
  level: AssetId.IconLevel,
};

// ============================================================================
// SPRITE ICON COMPONENT
// ============================================================================

interface SpriteIconProps {
  /** Icon name (matches ICON_ASSET_MAP keys) */
  name: string;
  /** Display size in pixels */
  size?: number;
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Anchor (0–1, default 0.5 = centered) */
  anchor?: number;
  /** Alpha */
  alpha?: number;
  /** Tint color override */
  tint?: number;
}

export const SpriteIcon = ({
  name,
  size = 24,
  x = 0,
  y = 0,
  anchor = 0.5,
  alpha = 1,
  tint,
}: SpriteIconProps) => {
  const { themeName } = usePixiTheme();

  const candidates = useMemo(() => {
    const assetId = ICON_ASSET_MAP[name];
    if (!assetId) return null;
    return resolveAsset(themeName as ThemeId, assetId);
  }, [name, themeName]);

  const texture = useTextureWithFallback(candidates);

  if (!texture) return null;

  return (
    <pixiSprite
      texture={texture}
      x={x}
      y={y}
      width={size}
      height={size}
      anchor={anchor}
      alpha={alpha}
      tint={tint}
      eventMode="none"
    />
  );
};

// ============================================================================
// DEPRECATED DRAW STUBS
// Kept for backward compatibility with consumers that haven't migrated yet
// (SurrenderButton, CubeBalance, etc.). Draw a minimal circle placeholder.
// ============================================================================

/** @deprecated Use SpriteIcon or PixiButton with icon prop instead */
const drawDeprecatedStub = (g: PixiGraphics, size: number, color = IconColors.secondary) => {
  g.clear();
  g.circle(0, 0, size * 0.2);
  g.fill({ color, alpha: 0.4 });
};

/** @deprecated Use SpriteIcon name="menu" or PixiButton icon="menu" */
export const drawMenuIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="starFilled" / name="starEmpty" */
export const drawStarIcon = (g: PixiGraphics, size: number, _filled = true, color = IconColors.gold) => {
  drawDeprecatedStub(g, size, color);
};

/** @deprecated Use SpriteIcon name="trophy" or PixiButton icon="trophy" */
export const drawTrophyIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="shop" or PixiButton icon="shop" */
export const drawShopIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="quests" or PixiButton icon="scroll" */
export const drawQuestsIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="flag" or PixiButton icon="surrender" */
export const drawFlagIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="cube" or PixiButton icon="cube" */
export const drawCubeIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="close" or PixiButton icon="close" */
export const drawCloseIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="combo" or PixiButton icon="fire" */
export const drawComboIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="moves" or PixiButton icon="moves" */
export const drawMovesIcon = drawDeprecatedStub;

/** @deprecated Use SpriteIcon name="target" or PixiButton icon="score" */
export const drawTargetIcon = drawDeprecatedStub;

export default {
  drawMenuIcon,
  drawStarIcon,
  drawTrophyIcon,
  drawShopIcon,
  drawQuestsIcon,
  drawFlagIcon,
  drawCubeIcon,
  drawCloseIcon,
  drawComboIcon,
  drawMovesIcon,
  drawTargetIcon,
  IconColors,
  SpriteIcon,
};
