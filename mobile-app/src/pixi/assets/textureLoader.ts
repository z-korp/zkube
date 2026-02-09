import { Assets, Texture } from "pixi.js";

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
