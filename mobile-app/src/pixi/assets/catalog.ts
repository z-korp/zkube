import type { ThemeId } from '../utils/colors';

// ============================================================================
// ASSET IDS — single source of truth for every asset in the game
// ============================================================================

export enum AssetId {
  // Blocks
  Block1 = 'block-1',
  Block2 = 'block-2',
  Block3 = 'block-3',
  Block4 = 'block-4',

  // Grid
  GridBg = 'grid-bg',
  GridFrame = 'grid-frame',

  // Backgrounds
  Background = 'background',
  LoadingBg = 'loading-bg',

  // UI Chrome
  HudBar = 'hud-bar',
  ActionBar = 'action-bar',
  BonusBtnBg = 'bonus-btn-bg',
  StarFilled = 'star-filled',
  StarEmpty = 'star-empty',
  Logo = 'logo',

  // Decorative
  DecoLeft = 'deco-left',
  DecoRight = 'deco-right',

  // Bonus icons
  BonusCombo = 'bonus-combo',
  BonusScore = 'bonus-score',
  BonusHarvest = 'bonus-harvest',
  BonusWave = 'bonus-wave',
  BonusSupply = 'bonus-supply',

  // 9-slice panels
  PanelWood = 'panel-wood',
  PanelDark = 'panel-dark',
  PanelLeaf = 'panel-leaf',
  PanelGlass = 'panel-glass',

  // 9-slice buttons (normal state — pressed/disabled derive from this)
  BtnOrange = 'btn-orange',
  BtnGreen = 'btn-green',
  BtnPurple = 'btn-purple',
  BtnRed = 'btn-red',
  BtnIcon = 'btn-icon',

  // Icons
  IconStarFilled = 'icon-star-filled',
  IconStarEmpty = 'icon-star-empty',
  IconCube = 'icon-cube',
  IconCrown = 'icon-crown',
  IconFire = 'icon-fire',
  IconScroll = 'icon-scroll',
  IconShop = 'icon-shop',
  IconTrophy = 'icon-trophy',
  IconMenu = 'icon-menu',
  IconClose = 'icon-close',
  IconSettings = 'icon-settings',
  IconLock = 'icon-lock',
  IconMusic = 'icon-music',
  IconSound = 'icon-sound',

  // Particles
  ParticleSpark = 'particle-spark',
  ParticleLeaf = 'particle-leaf',
  ParticleFlower = 'particle-flower',
  ParticleStar = 'particle-star',

  // Sounds — effects
  SfxBreak = 'sfx-break',
  SfxExplode = 'sfx-explode',
  SfxMove = 'sfx-move',
  SfxNew = 'sfx-new',
  SfxStart = 'sfx-start',
  SfxSwipe = 'sfx-swipe',
  SfxOver = 'sfx-over',

  // Sounds — music
  Music1 = 'music-1',
  Music2 = 'music-2',
  Music3 = 'music-3',
  MusicIntro = 'music-intro',
}

// ============================================================================
// 9-SLICE BORDERS
// ============================================================================

export interface NineSliceBorders {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const PANEL_BORDERS: NineSliceBorders = { left: 24, top: 24, right: 24, bottom: 24 };
export const BUTTON_BORDERS: NineSliceBorders = { left: 16, top: 16, right: 16, bottom: 16 };
export const ICON_BUTTON_BORDERS: NineSliceBorders = { left: 12, top: 12, right: 12, bottom: 12 };

// ============================================================================
// ASSET METADATA
// ============================================================================

export type AssetKind = 'texture' | 'sound';

export interface AssetMeta {
  filename: string;
  kind: AssetKind;
  borders?: NineSliceBorders;
  bundle: 'essential' | 'gameplay' | 'ui' | 'effects' | 'audio';
  shared?: boolean;
}

// Button state variants: {id}-pressed, {id}-disabled
export function buttonPressedId(id: AssetId): string {
  return `${id}-pressed`;
}
export function buttonDisabledId(id: AssetId): string {
  return `${id}-disabled`;
}

const P = PANEL_BORDERS;
const B = BUTTON_BORDERS;
const IB = ICON_BUTTON_BORDERS;

export const ASSET_CATALOG: Record<AssetId, AssetMeta> = {
  // Blocks
  [AssetId.Block1]: { filename: 'block-1.png', kind: 'texture', bundle: 'essential' },
  [AssetId.Block2]: { filename: 'block-2.png', kind: 'texture', bundle: 'essential' },
  [AssetId.Block3]: { filename: 'block-3.png', kind: 'texture', bundle: 'essential' },
  [AssetId.Block4]: { filename: 'block-4.png', kind: 'texture', bundle: 'essential' },

  // Grid
  [AssetId.GridBg]: { filename: 'grid-bg.png', kind: 'texture', bundle: 'essential' },
  [AssetId.GridFrame]: { filename: 'grid-frame.png', kind: 'texture', bundle: 'essential' },

  // Backgrounds
  [AssetId.Background]: { filename: 'theme-2-1.png', kind: 'texture', bundle: 'essential' },
  [AssetId.LoadingBg]: { filename: 'loading-bg.png', kind: 'texture', bundle: 'essential' },

  // UI Chrome
  [AssetId.HudBar]: { filename: 'hud-bar.png', kind: 'texture', bundle: 'essential' },
  [AssetId.ActionBar]: { filename: 'action-bar.png', kind: 'texture', bundle: 'essential' },
  [AssetId.BonusBtnBg]: { filename: 'bonus-btn-bg.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.StarFilled]: { filename: 'star-filled.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.StarEmpty]: { filename: 'star-empty.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.Logo]: { filename: 'logo.png', kind: 'texture', bundle: 'essential' },

  // Decorative
  [AssetId.DecoLeft]: { filename: 'palmtree-left.png', kind: 'texture', bundle: 'ui' },
  [AssetId.DecoRight]: { filename: 'palmtree-right.png', kind: 'texture', bundle: 'ui' },

  // Bonus icons (TODO: replace placeholder filenames with actual V3 assets)
  [AssetId.BonusCombo]: { filename: 'bonus/hammer.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.BonusScore]: { filename: 'bonus/tiki.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.BonusHarvest]: { filename: 'bonus/wave.png', kind: 'texture', bundle: 'gameplay' },
  [AssetId.BonusWave]: { filename: 'bonus/shrink.svg', kind: 'texture', bundle: 'gameplay' },
  [AssetId.BonusSupply]: { filename: 'bonus/shuffle.svg', kind: 'texture', bundle: 'gameplay' },

  // 9-slice panels
  [AssetId.PanelWood]: { filename: 'panels/panel-wood.png', kind: 'texture', borders: P, bundle: 'ui' },
  [AssetId.PanelDark]: { filename: 'panels/panel-dark.png', kind: 'texture', borders: P, bundle: 'ui' },
  [AssetId.PanelLeaf]: { filename: 'panels/panel-leaf.png', kind: 'texture', borders: P, bundle: 'ui' },
  [AssetId.PanelGlass]: { filename: 'panels/panel-glass.png', kind: 'texture', borders: P, bundle: 'ui' },

  // 9-slice buttons (normal states; pressed/disabled use derived filenames)
  [AssetId.BtnOrange]: { filename: 'buttons/btn-orange.png', kind: 'texture', borders: B, bundle: 'ui' },
  [AssetId.BtnGreen]: { filename: 'buttons/btn-green.png', kind: 'texture', borders: B, bundle: 'ui' },
  [AssetId.BtnPurple]: { filename: 'buttons/btn-purple.png', kind: 'texture', borders: B, bundle: 'ui' },
  [AssetId.BtnRed]: { filename: 'buttons/btn-red.png', kind: 'texture', borders: B, bundle: 'ui' },
  [AssetId.BtnIcon]: { filename: 'buttons/btn-icon.png', kind: 'texture', borders: IB, bundle: 'ui' },

  // Icons
  [AssetId.IconStarFilled]: { filename: 'icons/icon-star-filled.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconStarEmpty]: { filename: 'icons/icon-star-empty.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconCube]: { filename: 'icons/icon-cube.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconCrown]: { filename: 'icons/icon-crown.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconFire]: { filename: 'icons/icon-fire.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconScroll]: { filename: 'icons/icon-scroll.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconShop]: { filename: 'icons/icon-shop.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconTrophy]: { filename: 'icons/icon-trophy.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconMenu]: { filename: 'icons/icon-menu.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconClose]: { filename: 'icons/icon-close.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconSettings]: { filename: 'icons/icon-settings.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconLock]: { filename: 'icons/icon-lock.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconMusic]: { filename: 'icons/icon-music.png', kind: 'texture', bundle: 'ui' },
  [AssetId.IconSound]: { filename: 'icons/icon-sound.png', kind: 'texture', bundle: 'ui' },

  // Particles
  [AssetId.ParticleSpark]: { filename: 'particles/particle-spark.png', kind: 'texture', bundle: 'effects' },
  [AssetId.ParticleLeaf]: { filename: 'particles/particle-leaf.png', kind: 'texture', bundle: 'effects' },
  [AssetId.ParticleFlower]: { filename: 'particles/particle-flower.png', kind: 'texture', bundle: 'effects' },
  [AssetId.ParticleStar]: { filename: 'particles/particle-star.png', kind: 'texture', bundle: 'effects' },

  // Sounds — effects
  [AssetId.SfxBreak]: { filename: 'sounds/effects/break.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxExplode]: { filename: 'sounds/effects/explode.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxMove]: { filename: 'sounds/effects/move.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxNew]: { filename: 'sounds/effects/new.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxStart]: { filename: 'sounds/effects/start.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxSwipe]: { filename: 'sounds/effects/swipe.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.SfxOver]: { filename: 'sounds/effects/over.mp3', kind: 'sound', bundle: 'audio' },

  // Sounds — music
  [AssetId.Music1]: { filename: 'sounds/musics/theme-jungle.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.Music2]: { filename: 'sounds/musics/theme-jungle2.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.Music3]: { filename: 'sounds/musics/theme-jungle3.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.MusicIntro]: { filename: 'sounds/musics/intro.mp3', kind: 'sound', bundle: 'audio' },
};

// ============================================================================
// SHARED (THEME-INDEPENDENT) ASSETS
// ============================================================================

export const SHARED_ICON_PATHS = {
  moves: '/assets/icon-moves.png',
  score: '/assets/icon-score.png',
  cube: '/assets/icon-cube.png',
  level: '/assets/icon-level.png',
  surrender: '/assets/icon-surrender.png',
} as const;

// ============================================================================
// BUNDLE HELPERS
// ============================================================================

export function getAssetsByBundle(bundle: AssetMeta['bundle']): AssetId[] {
  return (Object.entries(ASSET_CATALOG) as [AssetId, AssetMeta][])
    .filter(([, meta]) => meta.bundle === bundle)
    .map(([id]) => id);
}

export function getTextureAssets(): AssetId[] {
  return (Object.entries(ASSET_CATALOG) as [AssetId, AssetMeta][])
    .filter(([, meta]) => meta.kind === 'texture')
    .map(([id]) => id);
}

// ============================================================================
// BUTTON VARIANT + ICON TYPE MAPPINGS (for PixiButton/PixiComponents consumers)
// ============================================================================

export type ButtonVariant = 'orange' | 'green' | 'purple' | 'red' | 'icon';
export type PanelType = 'wood' | 'dark' | 'leaf' | 'glass';
export type IconType =
  | 'starFilled' | 'starEmpty' | 'cube' | 'crown' | 'fire' | 'scroll'
  | 'shop' | 'trophy' | 'menu' | 'close' | 'settings' | 'lock' | 'music' | 'sound';

export const BUTTON_VARIANT_TO_ASSET: Record<ButtonVariant, AssetId> = {
  orange: AssetId.BtnOrange,
  green: AssetId.BtnGreen,
  purple: AssetId.BtnPurple,
  red: AssetId.BtnRed,
  icon: AssetId.BtnIcon,
};

export const PANEL_TYPE_TO_ASSET: Record<PanelType, AssetId> = {
  wood: AssetId.PanelWood,
  dark: AssetId.PanelDark,
  leaf: AssetId.PanelLeaf,
  glass: AssetId.PanelGlass,
};

export const ICON_TYPE_TO_ASSET: Record<IconType, AssetId> = {
  starFilled: AssetId.IconStarFilled,
  starEmpty: AssetId.IconStarEmpty,
  cube: AssetId.IconCube,
  crown: AssetId.IconCrown,
  fire: AssetId.IconFire,
  scroll: AssetId.IconScroll,
  shop: AssetId.IconShop,
  trophy: AssetId.IconTrophy,
  menu: AssetId.IconMenu,
  close: AssetId.IconClose,
  settings: AssetId.IconSettings,
  lock: AssetId.IconLock,
  music: AssetId.IconMusic,
  sound: AssetId.IconSound,
};

export function blockAssetId(width: number): AssetId {
  switch (width) {
    case 1: return AssetId.Block1;
    case 2: return AssetId.Block2;
    case 3: return AssetId.Block3;
    case 4: return AssetId.Block4;
    default: return AssetId.Block1;
  }
}
