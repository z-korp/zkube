import { getCommonAssetPath, getThemeImages, hasBackgroundImage, type ThemeId } from "@/config/themes";

const ImageAssets = (theme: ThemeId) => {
  const pathAssets = `/assets/${theme}/`;
  const themeImages = getThemeImages(theme);
  const hasBg = hasBackgroundImage(theme);

  return {
    ...themeImages,
    combo: getCommonAssetPath("bonus/combo.png"),
    score: getCommonAssetPath("bonus/score.png"),
    harvest: getCommonAssetPath("bonus/harvest.png"),
    wave: getCommonAssetPath("bonus/wave.png"),
    supply: getCommonAssetPath("bonus/supply.png"),
    stone1: themeImages.block1,
    stone2: themeImages.block2,
    stone3: themeImages.block3,
    stone4: themeImages.block4,
    background: themeImages.loadingBg,
    logo: themeImages.logo,
    loader: hasBg ? "/assets/theme-1/loader.svg" : `${pathAssets}loader.svg`,
    imageBackground: themeImages.background ?? `${pathAssets}theme-2-1.png`,
    imageTotemDark: hasBg ? "" : `${pathAssets}theme-2-totem-dark.png`,
    imageTotemLight: hasBg ? "" : `${pathAssets}theme-2-totem-light.png`,
    palmLeft: hasBg ? "" : `${pathAssets}palmtree-left.png`,
    palmRight: hasBg ? "" : `${pathAssets}palmtree-right.png`,
  };
};

export default ImageAssets;
