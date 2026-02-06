/**
 * Tiki Theme Asset Manifest
 * 
 * Defines all assets for the tiki theme including:
 * - Block textures
 * - UI panels (9-slice)
 * - Buttons (9-slice with states)
 * - Icons
 * - Backgrounds
 * - Particles
 */

/** Base path for theme assets */
export const TIKI_ASSET_BASE = '/assets/theme-1';

/** 9-slice border configuration for panels */
export interface NineSliceBorders {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Asset definition with optional 9-slice config */
export interface AssetDefinition {
  path: string;
  alias: string;
  /** 9-slice borders if applicable */
  borders?: NineSliceBorders;
}

/** Button state definitions */
export interface ButtonAssets {
  normal: AssetDefinition;
  pressed: AssetDefinition;
  disabled: AssetDefinition;
}

/**
 * Panel 9-slice borders (24px all sides for 96x96 panels)
 */
export const PANEL_BORDERS: NineSliceBorders = {
  left: 24,
  top: 24,
  right: 24,
  bottom: 24,
};

/**
 * Button 9-slice borders (16px all sides for 80x48 buttons)
 */
export const BUTTON_BORDERS: NineSliceBorders = {
  left: 16,
  top: 16,
  right: 16,
  bottom: 16,
};

/**
 * Icon button 9-slice borders (12px for 48x48 buttons)
 */
export const ICON_BUTTON_BORDERS: NineSliceBorders = {
  left: 12,
  top: 12,
  right: 12,
  bottom: 12,
};

// ============================================================================
// BLOCK ASSETS
// ============================================================================

export const BLOCK_ASSETS: Record<number, AssetDefinition> = {
  1: { path: `${TIKI_ASSET_BASE}/block-1.png`, alias: 'block-1' },
  2: { path: `${TIKI_ASSET_BASE}/block-2.png`, alias: 'block-2' },
  3: { path: `${TIKI_ASSET_BASE}/block-3.png`, alias: 'block-3' },
  4: { path: `${TIKI_ASSET_BASE}/block-4.png`, alias: 'block-4' },
};

// ============================================================================
// PANEL ASSETS (9-slice)
// ============================================================================

export const PANEL_ASSETS = {
  wood: { 
    path: `${TIKI_ASSET_BASE}/panels/panel-wood.png`, 
    alias: 'panel-wood',
    borders: PANEL_BORDERS,
  },
  dark: { 
    path: `${TIKI_ASSET_BASE}/panels/panel-dark.png`, 
    alias: 'panel-dark',
    borders: PANEL_BORDERS,
  },
  leaf: { 
    path: `${TIKI_ASSET_BASE}/panels/panel-leaf.png`, 
    alias: 'panel-leaf',
    borders: PANEL_BORDERS,
  },
  glass: { 
    path: `${TIKI_ASSET_BASE}/panels/panel-glass.png`, 
    alias: 'panel-glass',
    borders: PANEL_BORDERS,
  },
} as const;

export type PanelType = keyof typeof PANEL_ASSETS;

// ============================================================================
// BUTTON ASSETS (9-slice with states)
// ============================================================================

export const BUTTON_ASSETS: Record<string, ButtonAssets> = {
  orange: {
    normal: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-orange.png`, 
      alias: 'btn-orange',
      borders: BUTTON_BORDERS,
    },
    pressed: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-orange-pressed.png`, 
      alias: 'btn-orange-pressed',
      borders: BUTTON_BORDERS,
    },
    disabled: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-orange-disabled.png`, 
      alias: 'btn-orange-disabled',
      borders: BUTTON_BORDERS,
    },
  },
  green: {
    normal: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-green.png`, 
      alias: 'btn-green',
      borders: BUTTON_BORDERS,
    },
    pressed: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-green-pressed.png`, 
      alias: 'btn-green-pressed',
      borders: BUTTON_BORDERS,
    },
    disabled: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-green-disabled.png`, 
      alias: 'btn-green-disabled',
      borders: BUTTON_BORDERS,
    },
  },
  purple: {
    normal: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-purple.png`, 
      alias: 'btn-purple',
      borders: BUTTON_BORDERS,
    },
    pressed: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-purple-pressed.png`, 
      alias: 'btn-purple-pressed',
      borders: BUTTON_BORDERS,
    },
    disabled: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-purple-disabled.png`, 
      alias: 'btn-purple-disabled',
      borders: BUTTON_BORDERS,
    },
  },
  red: {
    normal: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-red.png`, 
      alias: 'btn-red',
      borders: BUTTON_BORDERS,
    },
    pressed: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-red-pressed.png`, 
      alias: 'btn-red-pressed',
      borders: BUTTON_BORDERS,
    },
    disabled: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-red-disabled.png`, 
      alias: 'btn-red-disabled',
      borders: BUTTON_BORDERS,
    },
  },
  icon: {
    normal: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-icon.png`, 
      alias: 'btn-icon',
      borders: ICON_BUTTON_BORDERS,
    },
    pressed: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-icon-pressed.png`, 
      alias: 'btn-icon-pressed',
      borders: ICON_BUTTON_BORDERS,
    },
    disabled: { 
      path: `${TIKI_ASSET_BASE}/buttons/btn-icon.png`, 
      alias: 'btn-icon-disabled',
      borders: ICON_BUTTON_BORDERS,
    },
  },
};

export type ButtonVariant = keyof typeof BUTTON_ASSETS;

// ============================================================================
// ICON ASSETS
// ============================================================================

export const ICON_ASSETS = {
  starFilled: { path: `${TIKI_ASSET_BASE}/icons/icon-star-filled.png`, alias: 'icon-star-filled' },
  starEmpty: { path: `${TIKI_ASSET_BASE}/icons/icon-star-empty.png`, alias: 'icon-star-empty' },
  cube: { path: `${TIKI_ASSET_BASE}/icons/icon-cube.png`, alias: 'icon-cube' },
  crown: { path: `${TIKI_ASSET_BASE}/icons/icon-crown.png`, alias: 'icon-crown' },
  fire: { path: `${TIKI_ASSET_BASE}/icons/icon-fire.png`, alias: 'icon-fire' },
  scroll: { path: `${TIKI_ASSET_BASE}/icons/icon-scroll.png`, alias: 'icon-scroll' },
  shop: { path: `${TIKI_ASSET_BASE}/icons/icon-shop.png`, alias: 'icon-shop' },
  trophy: { path: `${TIKI_ASSET_BASE}/icons/icon-trophy.png`, alias: 'icon-trophy' },
  menu: { path: `${TIKI_ASSET_BASE}/icons/icon-menu.png`, alias: 'icon-menu' },
  close: { path: `${TIKI_ASSET_BASE}/icons/icon-close.png`, alias: 'icon-close' },
  settings: { path: `${TIKI_ASSET_BASE}/icons/icon-settings.png`, alias: 'icon-settings' },
  lock: { path: `${TIKI_ASSET_BASE}/icons/icon-lock.png`, alias: 'icon-lock' },
  music: { path: `${TIKI_ASSET_BASE}/icons/icon-music.png`, alias: 'icon-music' },
  sound: { path: `${TIKI_ASSET_BASE}/icons/icon-sound.png`, alias: 'icon-sound' },
} as const;

export type IconType = keyof typeof ICON_ASSETS;

// ============================================================================
// BACKGROUND ASSETS
// ============================================================================

export const BACKGROUND_ASSETS = {
  background: { path: `${TIKI_ASSET_BASE}/theme-2-1.png`, alias: 'bg-main' },
  palmtreeLeft: { path: `${TIKI_ASSET_BASE}/palmtree-left.png`, alias: 'bg-palmtree-left' },
  palmtreeRight: { path: `${TIKI_ASSET_BASE}/palmtree-right.png`, alias: 'bg-palmtree-right' },
} as const;

export type BackgroundType = keyof typeof BACKGROUND_ASSETS;

// ============================================================================
// PARTICLE ASSETS
// ============================================================================

export const PARTICLE_ASSETS = {
  spark: { path: `${TIKI_ASSET_BASE}/particles/particle-spark.png`, alias: 'particle-spark' },
  leaf: { path: `${TIKI_ASSET_BASE}/particles/particle-leaf.png`, alias: 'particle-leaf' },
  flower: { path: `${TIKI_ASSET_BASE}/particles/particle-flower.png`, alias: 'particle-flower' },
  star: { path: `${TIKI_ASSET_BASE}/particles/particle-star.png`, alias: 'particle-star' },
} as const;

export type ParticleType = keyof typeof PARTICLE_ASSETS;

// ============================================================================
// LOGO ASSET
// ============================================================================

export const LOGO_ASSET: AssetDefinition = {
  path: `${TIKI_ASSET_BASE}/logo.png`,
  alias: 'logo-main',
};

// ============================================================================
// BONUS ASSETS (new tiki versions)
// ============================================================================

export const BONUS_ASSETS = {
  shrink: { path: `${TIKI_ASSET_BASE}/bonus/shrink.svg`, alias: 'bonus-shrink' },
  shuffle: { path: `${TIKI_ASSET_BASE}/bonus/shuffle.svg`, alias: 'bonus-shuffle' },
  hammer: { path: `${TIKI_ASSET_BASE}/bonus/hammer.png`, alias: 'bonus-hammer' },
  wave: { path: `${TIKI_ASSET_BASE}/bonus/wave.png`, alias: 'bonus-wave' },
  totem: { path: `${TIKI_ASSET_BASE}/bonus/tiki.png`, alias: 'bonus-totem' },
} as const;

export type BonusType = keyof typeof BONUS_ASSETS;

// ============================================================================
// FULL ASSET BUNDLE
// ============================================================================

/**
 * Get all asset paths for preloading
 */
export function getAllAssetPaths(): { alias: string; src: string }[] {
  const assets: { alias: string; src: string }[] = [];

  // Blocks
  Object.values(BLOCK_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Panels
  Object.values(PANEL_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Buttons (all states)
  Object.values(BUTTON_ASSETS).forEach(button => {
    assets.push({ alias: button.normal.alias, src: button.normal.path });
    assets.push({ alias: button.pressed.alias, src: button.pressed.path });
    assets.push({ alias: button.disabled.alias, src: button.disabled.path });
  });

  // Icons
  Object.values(ICON_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Backgrounds
  Object.values(BACKGROUND_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Particles
  Object.values(PARTICLE_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Logo
  assets.push({ alias: LOGO_ASSET.alias, src: LOGO_ASSET.path });

  // Bonuses
  Object.values(BONUS_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  return assets;
}

/**
 * Get essential assets for quick startup (blocks, buttons, panels)
 */
export function getEssentialAssetPaths(): { alias: string; src: string }[] {
  const assets: { alias: string; src: string }[] = [];

  // Blocks are essential
  Object.values(BLOCK_ASSETS).forEach(asset => {
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Main panel types
  ['wood', 'dark', 'glass'].forEach(type => {
    const asset = PANEL_ASSETS[type as PanelType];
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Primary button (orange) and icon button
  const orangeBtn = BUTTON_ASSETS.orange;
  assets.push({ alias: orangeBtn.normal.alias, src: orangeBtn.normal.path });
  assets.push({ alias: orangeBtn.pressed.alias, src: orangeBtn.pressed.path });
  
  const iconBtn = BUTTON_ASSETS.icon;
  assets.push({ alias: iconBtn.normal.alias, src: iconBtn.normal.path });
  assets.push({ alias: iconBtn.pressed.alias, src: iconBtn.pressed.path });

  // Essential icons
  ['close', 'menu', 'starFilled', 'starEmpty'].forEach(type => {
    const asset = ICON_ASSETS[type as IconType];
    assets.push({ alias: asset.alias, src: asset.path });
  });

  // Logo
  assets.push({ alias: LOGO_ASSET.alias, src: LOGO_ASSET.path });

  return assets;
}
