import { type ThemeId, isProceduralTheme } from '../utils/colors';
import { AssetId, ASSET_CATALOG } from './catalog';

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

  // Procedural themes have no texture files of their own — fall back to theme-1
  if (procedural && meta.kind === 'texture') {
    return [themeUrl(FALLBACK_THEME, meta.filename)];
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

/**
 * Resolve a sound asset URL.
 *
 * - **SFX** are shared across all themes → always served from theme-1.
 * - **Music** is unique per theme → always served from the requested theme.
 */
export function resolveSoundUrl(themeId: ThemeId, assetId: AssetId): string | null {
  const meta = ASSET_CATALOG[assetId];
  if (!meta || meta.kind !== 'sound') return null;

  // SFX: common across all themes — always use fallback (theme-1)
  const isSfx = (assetId as string).startsWith('sfx-');
  if (isSfx) {
    return themeUrl(FALLBACK_THEME, meta.filename);
  }

  // Music: each theme has unique tracks — always use the actual theme
  return themeUrl(themeId, meta.filename);
}

export function resolveImageAssetUrl(themeId: ThemeId, assetId: AssetId): string {
  const candidates = resolveAsset(themeId, assetId);
  return candidates?.[0] ?? themeUrl(FALLBACK_THEME, ASSET_CATALOG[assetId]?.filename ?? '');
}

export async function validateCatalog(themeId: ThemeId): Promise<{ missing: string[]; valid: number }> {
  const textureIds = (Object.keys(ASSET_CATALOG) as AssetId[]).filter(
    (id) => ASSET_CATALOG[id].kind === 'texture',
  );

  const missing: string[] = [];
  let valid = 0;

  await Promise.all(
    textureIds.map(async (id) => {
      const candidates = resolveAsset(themeId, id);
      if (!candidates || candidates.length === 0) return;

      try {
        const res = await fetch(candidates[0], { method: 'HEAD' });
        if (res.ok) {
          valid++;
        } else {
          missing.push(`${id} → ${candidates[0]} (${res.status})`);
        }
      } catch {
        missing.push(`${id} → ${candidates[0]} (network error)`);
      }
    }),
  );

  return { missing, valid };
}
