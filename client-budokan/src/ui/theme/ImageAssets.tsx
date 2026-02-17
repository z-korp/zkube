import { getCommonAssetPath, getThemeImages, isLegacyTheme, type ThemeId } from "@/config/themes";

const ImageAssets = (theme: ThemeId) => {
  const pathAssets = `/assets/${theme}/`;
  const themeImages = getThemeImages(theme);
  const legacy = isLegacyTheme(theme);

  return {
    ...themeImages,
    hammer: getCommonAssetPath("bonus/combo.png"),
    tiki: getCommonAssetPath("bonus/score.png"),
    totem: getCommonAssetPath("bonus/score.png"),
    wave: getCommonAssetPath("bonus/wave.png"),
    shrink: getCommonAssetPath("bonus/harvest.png"),
    shuffle: getCommonAssetPath("bonus/supply.png"),
    stone1: themeImages.block1,
    stone2: themeImages.block2,
    stone3: themeImages.block3,
    stone4: themeImages.block4,
    background: themeImages.loadingBg,
    logo: themeImages.logo,
    loader: legacy ? `${pathAssets}loader.svg` : "/assets/theme-1/loader.svg",
    imageBackground: legacy ? `${pathAssets}theme-2-1.png` : (themeImages.background ?? `${pathAssets}loading-bg.png`),
    imageTotemDark: legacy ? `${pathAssets}theme-2-totem-dark.png` : "",
    imageTotemLight: legacy ? `${pathAssets}theme-2-totem-light.png` : "",
    palmLeft: legacy ? `${pathAssets}palmtree-left.png` : "",
    palmRight: legacy ? `${pathAssets}palmtree-right.png` : "",
  };
};

export default ImageAssets;
