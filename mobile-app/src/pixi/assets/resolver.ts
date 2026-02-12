import { type ThemeId, isProceduralTheme } from '../utils/colors';
import { AssetId, ASSET_CATALOG, type AssetMeta } from './catalog';

const FALLBACK_THEME: ThemeId = 'theme-1';

function themeUrl(themeId: ThemeId, filename: string): string {
  return `/assets/${themeId}/${filename}`;
}

/**
 * Resolve an asset to a URL for a given theme.
 *
 * Returns null when the asset should be skipped (procedural theme + texture-only asset).
 * Returns an ordered array of candidate URLs to try (theme → fallback theme).
 *
 * Sounds always fall back to a real theme since there's no procedural audio.
 */
export function resolveAsset(themeId: ThemeId, assetId: AssetId): string[] | null {
  const meta = ASSET_CATALOG[assetId];
  if (!meta) return null;

  const procedural = isProceduralTheme(themeId);

  if (procedural && meta.kind === 'texture') {
    return null;
  }

  const candidates: string[] = [];

  candidates.push(themeUrl(themeId, meta.filename));

  if (themeId !== FALLBACK_THEME) {
    candidates.push(themeUrl(FALLBACK_THEME, meta.filename));
  }

  return candidates;
}

export function resolveAssetUrl(themeId: ThemeId, assetId: AssetId): string | null {
  const candidates = resolveAsset(themeId, assetId);
  return candidates?.[0] ?? null;
}

export function resolveButtonStateUrls(
  themeId: ThemeId,
  baseFilename: string,
): { normal: string[]; pressed: string[]; disabled: string[] } | null {
  const procedural = isProceduralTheme(themeId);
  if (procedural) return null;

  const ext = baseFilename.slice(baseFilename.lastIndexOf('.'));
  const base = baseFilename.slice(0, baseFilename.lastIndexOf('.'));

  const normalFile = baseFilename;
  const pressedFile = `${base}-pressed${ext}`;
  const disabledFile = `${base}-disabled${ext}`;

  const build = (filename: string): string[] => {
    const urls: string[] = [themeUrl(themeId, filename)];
    if (themeId !== FALLBACK_THEME) {
      urls.push(themeUrl(FALLBACK_THEME, filename));
    }
    return urls;
  };

  return {
    normal: build(normalFile),
    pressed: build(pressedFile),
    disabled: build(disabledFile),
  };
}

export function resolveSoundUrl(themeId: ThemeId, assetId: AssetId): string | null {
  const meta = ASSET_CATALOG[assetId];
  if (!meta || meta.kind !== 'sound') return null;

  // For procedural themes, fall back to theme-1 sounds directly
  if (isProceduralTheme(themeId)) {
    return themeUrl(FALLBACK_THEME, meta.filename);
  }

  return themeUrl(themeId, meta.filename);
}

export function resolveImageAssetUrl(themeId: ThemeId, assetId: AssetId): string {
  const candidates = resolveAsset(themeId, assetId);
  return candidates?.[0] ?? themeUrl(FALLBACK_THEME, ASSET_CATALOG[assetId]?.filename ?? '');
}
