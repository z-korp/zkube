import { Assets, Graphics as PixiGraphics, RenderTexture, Texture } from "pixi.js";

export type AssetEntry = {
  alias: string;
  path?: string;
  src?: string;
};

export const ensureAssetsRegistered = (assets: AssetEntry[]) => {
  for (const asset of assets) {
    if (!Assets.cache.has(asset.alias)) {
      const src = asset.path ?? asset.src;
      if (!src) continue;
      Assets.add({ alias: asset.alias, src });
    }
  }
};

export const getMissingAliases = (aliases: string[]) =>
  aliases.filter((alias) => !Assets.cache.has(alias));

export const loadTextureCached = async (id: string): Promise<Texture> => {
  const cached = Assets.get(id) as Texture | undefined;
  if (cached) {
    return cached;
  }
  return (await Assets.load(id)) as Texture;
};

let _fallbackTexture: Texture | null = null;

export function getFallbackTexture(): Texture {
  if (_fallbackTexture) return _fallbackTexture;
  const g = new PixiGraphics();
  g.rect(0, 0, 4, 4);
  g.fill({ color: 0xff00ff, alpha: 0.3 });
  const rt = RenderTexture.create({ width: 4, height: 4 });
  _fallbackTexture = rt;
  return rt;
}
