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
  Logo = 'logo',

  // Map
  Map = 'map',

  // Theme icon (settings page theme selector)
  ThemeIcon = 'theme-icon',

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
  IconSurrender = 'icon-surrender',
  IconMoves = 'icon-moves',
  IconScore = 'icon-score',
  IconLevel = 'icon-level',

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
  MusicMain = 'music-main',
  MusicMap = 'music-map',
  MusicLevel = 'music-level',
  MusicBoss = 'music-boss',
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
  [AssetId.Background]: { filename: 'background.png', kind: 'texture', bundle: 'essential' },
  [AssetId.LoadingBg]: { filename: 'loading-bg.png', kind: 'texture', bundle: 'essential' },

  // UI Chrome
  [AssetId.HudBar]: { filename: 'ui/hud-bar.png', kind: 'texture', bundle: 'essential', shared: true },
  [AssetId.ActionBar]: { filename: 'ui/action-bar.png', kind: 'texture', bundle: 'essential', shared: true },
  [AssetId.BonusBtnBg]: { filename: 'ui/bonus-btn-bg.png', kind: 'texture', bundle: 'gameplay', shared: true },
  [AssetId.Logo]: { filename: 'logo.png', kind: 'texture', bundle: 'essential' },

  // Bonus icons
  [AssetId.BonusCombo]: { filename: 'bonus/combo.png', kind: 'texture', bundle: 'gameplay', shared: true },
  [AssetId.BonusScore]: { filename: 'bonus/score.png', kind: 'texture', bundle: 'gameplay', shared: true },
  [AssetId.BonusHarvest]: { filename: 'bonus/harvest.png', kind: 'texture', bundle: 'gameplay', shared: true },
  [AssetId.BonusWave]: { filename: 'bonus/wave.png', kind: 'texture', bundle: 'gameplay', shared: true },
  [AssetId.BonusSupply]: { filename: 'bonus/supply.png', kind: 'texture', bundle: 'gameplay', shared: true },

  // Map
  [AssetId.Map]: { filename: 'map.png', kind: 'texture', bundle: 'essential' },

  [AssetId.ThemeIcon]: { filename: 'theme-icon.png', kind: 'texture', bundle: 'ui' },

  // 9-slice panels
  [AssetId.PanelWood]: { filename: 'panels/panel-wood.png', kind: 'texture', borders: P, bundle: 'ui', shared: true },
  [AssetId.PanelDark]: { filename: 'panels/panel-dark.png', kind: 'texture', borders: P, bundle: 'ui', shared: true },
  [AssetId.PanelLeaf]: { filename: 'panels/panel-leaf.png', kind: 'texture', borders: P, bundle: 'ui', shared: true },
  [AssetId.PanelGlass]: { filename: 'panels/panel-glass.png', kind: 'texture', borders: P, bundle: 'ui', shared: true },

  // 9-slice buttons (normal states; pressed/disabled use derived filenames)
  [AssetId.BtnOrange]: { filename: 'buttons/btn-orange.png', kind: 'texture', borders: B, bundle: 'ui', shared: true },
  [AssetId.BtnGreen]: { filename: 'buttons/btn-green.png', kind: 'texture', borders: B, bundle: 'ui', shared: true },
  [AssetId.BtnPurple]: { filename: 'buttons/btn-purple.png', kind: 'texture', borders: B, bundle: 'ui', shared: true },
  [AssetId.BtnRed]: { filename: 'buttons/btn-red.png', kind: 'texture', borders: B, bundle: 'ui', shared: true },
  [AssetId.BtnIcon]: { filename: 'buttons/btn-icon.png', kind: 'texture', borders: IB, bundle: 'ui', shared: true },

  // Icons
  [AssetId.IconStarFilled]: { filename: 'icons/icon-star-filled.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconStarEmpty]: { filename: 'icons/icon-star-empty.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconCube]: { filename: 'icons/icon-cube.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconCrown]: { filename: 'icons/icon-crown.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconFire]: { filename: 'icons/icon-fire.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconScroll]: { filename: 'icons/icon-scroll.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconShop]: { filename: 'icons/icon-shop.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconTrophy]: { filename: 'icons/icon-trophy.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconMenu]: { filename: 'icons/icon-menu.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconClose]: { filename: 'icons/icon-close.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconSettings]: { filename: 'icons/icon-settings.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconLock]: { filename: 'icons/icon-lock.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconMusic]: { filename: 'icons/icon-music.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconSound]: { filename: 'icons/icon-sound.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconSurrender]: { filename: 'icons/icon-surrender.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconMoves]: { filename: 'icons/icon-moves.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconScore]: { filename: 'icons/icon-score.png', kind: 'texture', bundle: 'ui', shared: true },
  [AssetId.IconLevel]: { filename: 'icons/icon-level.png', kind: 'texture', bundle: 'ui', shared: true },

  // Particles
  [AssetId.ParticleSpark]: { filename: 'particles/particle-spark.png', kind: 'texture', bundle: 'effects', shared: true },
  [AssetId.ParticleLeaf]: { filename: 'particles/particle-leaf.png', kind: 'texture', bundle: 'effects', shared: true },
  [AssetId.ParticleFlower]: { filename: 'particles/particle-flower.png', kind: 'texture', bundle: 'effects', shared: true },
  [AssetId.ParticleStar]: { filename: 'particles/particle-star.png', kind: 'texture', bundle: 'effects', shared: true },

  // Sounds — effects
  [AssetId.SfxBreak]: { filename: 'sounds/effects/break.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxExplode]: { filename: 'sounds/effects/explode.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxMove]: { filename: 'sounds/effects/move.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxNew]: { filename: 'sounds/effects/new.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxStart]: { filename: 'sounds/effects/start.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxSwipe]: { filename: 'sounds/effects/swipe.mp3', kind: 'sound', bundle: 'audio', shared: true },
  [AssetId.SfxOver]: { filename: 'sounds/effects/over.mp3', kind: 'sound', bundle: 'audio', shared: true },

  // Sounds — music
  [AssetId.MusicMain]: { filename: 'sounds/musics/main.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.MusicMap]: { filename: 'sounds/musics/map.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.MusicLevel]: { filename: 'sounds/musics/level.mp3', kind: 'sound', bundle: 'audio' },
  [AssetId.MusicBoss]: { filename: 'sounds/musics/boss.mp3', kind: 'sound', bundle: 'audio' },
};

// ============================================================================
// SHARED (THEME-INDEPENDENT) ASSETS
// ============================================================================

export const SHARED_ICON_PATHS = {
  moves: '/assets/common/icons/icon-moves.png',
  score: '/assets/common/icons/icon-score.png',
  cube: '/assets/common/icons/icon-cube.png',
  level: '/assets/common/icons/icon-level.png',
  surrender: '/assets/common/icons/icon-surrender.png',
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
  | 'shop' | 'trophy' | 'menu' | 'close' | 'settings' | 'lock' | 'music' | 'sound'
  | 'surrender' | 'moves' | 'score' | 'level';

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
  surrender: AssetId.IconSurrender,
  moves: AssetId.IconMoves,
  score: AssetId.IconScore,
  level: AssetId.IconLevel,
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
