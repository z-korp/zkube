import { Assets } from 'pixi.js';
import type { ThemeId } from '../utils/colors';
import { AssetId, ASSET_CATALOG, getAssetsByBundle } from './catalog';
import { resolveAsset } from './resolver';

export async function preloadBundle(
  themeId: ThemeId,
  bundle: 'essential' | 'gameplay' | 'ui' | 'effects',
  onProgress?: (progress: number) => void,
): Promise<void> {
  const assetIds = getAssetsByBundle(bundle).filter(
    (id) => ASSET_CATALOG[id].kind === 'texture',
  );

  const urls: string[] = [];
  for (const id of assetIds) {
    const candidates = resolveAsset(themeId, id);
    if (candidates && candidates.length > 0) {
      urls.push(candidates[0]);
    }
  }

  if (urls.length === 0) return;

  const missing = urls.filter((url) => !Assets.cache.has(url));
  if (missing.length === 0) {
    onProgress?.(1);
    return;
  }

  for (const url of missing) {
    if (!Assets.cache.has(url)) {
      Assets.add({ alias: url, src: url });
    }
  }

  await Assets.load(missing, onProgress);
}

export async function preloadEssentials(
  themeId: ThemeId,
  onProgress?: (progress: number) => void,
): Promise<void> {
  await preloadBundle(themeId, 'essential', onProgress);
}

export async function preloadAll(
  themeId: ThemeId,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const bundles: ('essential' | 'gameplay' | 'ui' | 'effects')[] = [
    'essential', 'gameplay', 'ui', 'effects',
  ];

  let completed = 0;
  for (const bundle of bundles) {
    await preloadBundle(themeId, bundle, (p) => {
      const overall = (completed + p) / bundles.length;
      onProgress?.(overall);
    });
    completed++;
  }
  onProgress?.(1);
}
