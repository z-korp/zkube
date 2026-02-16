import { type ThemeId } from '../utils/colors';
import { AssetId, ASSET_CATALOG } from './catalog';

function themeUrl(themeId: ThemeId, filename: string): string {
  return `/assets/${themeId}/${filename}`;
}

export function resolveAsset(themeId: ThemeId, assetId: AssetId): string[] | null {
  const meta = ASSET_CATALOG[assetId];
  if (!meta) return null;

  if (meta.shared) {
    return [`/assets/common/${meta.filename}`];
  }

  return [themeUrl(themeId, meta.filename)];
}

export function resolveAssetUrl(themeId: ThemeId, assetId: AssetId): string | null {
  const candidates = resolveAsset(themeId, assetId);
  return candidates?.[0] ?? null;
}

export function resolveButtonStateUrls(
  themeId: ThemeId,
  baseFilename: string,
): { normal: string[]; pressed: string[]; disabled: string[] } | null {
  const ext = baseFilename.slice(baseFilename.lastIndexOf('.'));
  const base = baseFilename.slice(0, baseFilename.lastIndexOf('.'));

  const normalFile = baseFilename;
  const pressedFile = `${base}-pressed${ext}`;
  const disabledFile = `${base}-disabled${ext}`;

  const baseAsset = Object.entries(ASSET_CATALOG).find(([, meta]) => meta.filename === baseFilename);
  if (baseAsset && baseAsset[1].shared) {
    const build = (filename: string): string[] => [`/assets/common/${filename}`];
    return {
      normal: build(normalFile),
      pressed: build(pressedFile),
      disabled: build(disabledFile),
    };
  }

  const build = (filename: string): string[] => [themeUrl(themeId, filename)];

  return {
    normal: build(normalFile),
    pressed: build(pressedFile),
    disabled: build(disabledFile),
  };
}

export function resolveSoundUrl(themeId: ThemeId, assetId: AssetId): string | null {
  const meta = ASSET_CATALOG[assetId];
  if (!meta || meta.kind !== 'sound') return null;

  const isSfx = (assetId as string).startsWith('sfx-');
  if (isSfx) {
    return `/assets/common/${meta.filename}`;
  }

  return themeUrl(themeId, meta.filename);
}

export function resolveImageAssetUrl(themeId: ThemeId, assetId: AssetId): string {
  const candidates = resolveAsset(themeId, assetId);
  return candidates?.[0] ?? themeUrl(themeId, ASSET_CATALOG[assetId]?.filename ?? '');
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
