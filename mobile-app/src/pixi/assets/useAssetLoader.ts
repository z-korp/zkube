/**
 * Asset Loader Hook
 * 
 * Preloads and caches tiki theme assets using PixiJS Assets system
 */

import { useEffect, useState, useCallback } from 'react';
import { Assets, Texture } from 'pixi.js';
import { 
  getAllAssetPaths, 
  getEssentialAssetPaths,
  BLOCK_ASSETS,
  PANEL_ASSETS,
  BUTTON_ASSETS,
  ICON_ASSETS,
  BACKGROUND_ASSETS,
  PARTICLE_ASSETS,
  LOGO_ASSET,
  BONUS_ASSETS,
  type PanelType,
  type ButtonVariant,
  type IconType,
  type BackgroundType,
  type ParticleType,
  type BonusType,
} from './manifest';

export interface AssetLoaderState {
  /** Whether essential assets are loaded */
  essentialsLoaded: boolean;
  /** Whether all assets are loaded */
  allLoaded: boolean;
  /** Loading progress (0-1) */
  progress: number;
  /** Any error that occurred */
  error: Error | null;
}

/**
 * Hook to preload tiki theme assets
 * 
 * @param loadAll - Whether to load all assets or just essentials
 */
export function useAssetLoader(loadAll: boolean = false): AssetLoaderState {
  const [state, setState] = useState<AssetLoaderState>({
    essentialsLoaded: false,
    allLoaded: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      try {
        // Load essential assets first
        const essentials = getEssentialAssetPaths();
        
        // Add assets to loader
        for (const asset of essentials) {
          if (!Assets.cache.has(asset.alias)) {
            Assets.add(asset);
          }
        }

        // Load with progress
        await Assets.load(essentials.map(a => a.alias), (progress) => {
          if (!cancelled) {
            setState(prev => ({ 
              ...prev, 
              progress: loadAll ? progress * 0.5 : progress 
            }));
          }
        });

        if (cancelled) return;

        setState(prev => ({ ...prev, essentialsLoaded: true }));

        // Load remaining assets if requested
        if (loadAll) {
          const all = getAllAssetPaths();
          const remaining = all.filter(a => 
            !essentials.some(e => e.alias === a.alias)
          );

          for (const asset of remaining) {
            if (!Assets.cache.has(asset.alias)) {
              Assets.add(asset);
            }
          }

          await Assets.load(remaining.map(a => a.alias), (progress) => {
            if (!cancelled) {
              setState(prev => ({ 
                ...prev, 
                progress: 0.5 + progress * 0.5 
              }));
            }
          });

          if (cancelled) return;

          setState(prev => ({ ...prev, allLoaded: true, progress: 1 }));
        } else {
          setState(prev => ({ ...prev, progress: 1 }));
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load assets:', error);
          setState(prev => ({ 
            ...prev, 
            error: error instanceof Error ? error : new Error('Asset loading failed') 
          }));
        }
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  return state;
}

// ============================================================================
// TEXTURE GETTERS
// ============================================================================

/**
 * Get a block texture by width
 */
export function getBlockTexture(width: number): Texture {
  const asset = BLOCK_ASSETS[width];
  if (!asset) {
    console.warn(`Block texture for width ${width} not found, using width 1`);
    return Assets.get(BLOCK_ASSETS[1].alias) ?? Texture.WHITE;
  }
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

/**
 * Get a panel texture by type
 */
export function getPanelTexture(type: PanelType): Texture {
  const asset = PANEL_ASSETS[type];
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

/**
 * Get button textures by variant
 */
export function getButtonTextures(variant: ButtonVariant): {
  normal: Texture;
  pressed: Texture;
  disabled: Texture;
} {
  const assets = BUTTON_ASSETS[variant];
  return {
    normal: Assets.get(assets.normal.alias) ?? Texture.WHITE,
    pressed: Assets.get(assets.pressed.alias) ?? Texture.WHITE,
    disabled: Assets.get(assets.disabled.alias) ?? Texture.WHITE,
  };
}

/**
 * Get an icon texture by type
 */
export function getIconTexture(type: IconType): Texture {
  const asset = ICON_ASSETS[type];
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

/**
 * Get a background texture by type
 */
export function getBackgroundTexture(type: BackgroundType): Texture {
  const asset = BACKGROUND_ASSETS[type];
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

/**
 * Get a particle texture by type
 */
export function getParticleTexture(type: ParticleType): Texture {
  const asset = PARTICLE_ASSETS[type];
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

/**
 * Get the logo texture
 */
export function getLogoTexture(): Texture {
  return Assets.get(LOGO_ASSET.alias) ?? Texture.WHITE;
}

/**
 * Get a bonus icon texture by type
 */
export function getBonusTexture(type: BonusType): Texture {
  const asset = BONUS_ASSETS[type];
  return Assets.get(asset.alias) ?? Texture.WHITE;
}

// ============================================================================
// ASSET PRELOAD HELPER
// ============================================================================

/**
 * Preload specific asset categories
 */
export async function preloadAssetCategory(
  category: 'blocks' | 'panels' | 'buttons' | 'icons' | 'backgrounds' | 'particles'
): Promise<void> {
  let assets: { alias: string; src: string }[] = [];

  switch (category) {
    case 'blocks':
      assets = Object.values(BLOCK_ASSETS).map(a => ({ alias: a.alias, src: a.path }));
      break;
    case 'panels':
      assets = Object.values(PANEL_ASSETS).map(a => ({ alias: a.alias, src: a.path }));
      break;
    case 'buttons':
      Object.values(BUTTON_ASSETS).forEach(btn => {
        assets.push({ alias: btn.normal.alias, src: btn.normal.path });
        assets.push({ alias: btn.pressed.alias, src: btn.pressed.path });
        assets.push({ alias: btn.disabled.alias, src: btn.disabled.path });
      });
      break;
    case 'icons':
      assets = Object.values(ICON_ASSETS).map(a => ({ alias: a.alias, src: a.path }));
      break;
    case 'backgrounds':
      assets = Object.values(BACKGROUND_ASSETS).map(a => ({ alias: a.alias, src: a.path }));
      break;
    case 'particles':
      assets = Object.values(PARTICLE_ASSETS).map(a => ({ alias: a.alias, src: a.path }));
      break;
  }

  for (const asset of assets) {
    if (!Assets.cache.has(asset.alias)) {
      Assets.add(asset);
    }
  }

  await Assets.load(assets.map(a => a.alias));
}
