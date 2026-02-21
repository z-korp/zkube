import { getCommonAssetPath, getThemeImages, type ThemeId } from "@/config/themes";

const ImageAssets = (theme: ThemeId) => {
  const themeImages = getThemeImages(theme);

  return {
    ...themeImages,
    combo: getCommonAssetPath("bonus/combo.png"),
    score: getCommonAssetPath("bonus/score.png"),
    harvest: getCommonAssetPath("bonus/harvest.png"),
    wave: getCommonAssetPath("bonus/wave.png"),
    supply: getCommonAssetPath("bonus/supply.png"),
    bridging: getCommonAssetPath("bonus/bridging.png"),
    constraintClearLines: getCommonAssetPath("constraints/constraint-clear-lines.png"),
    constraintBreakBlocks: getCommonAssetPath("constraints/constraint-break-blocks.png"),
    constraintCombo: getCommonAssetPath("constraints/constraint-combo.png"),
    constraintFill: getCommonAssetPath("constraints/constraint-fill.png"),
    constraintNoBonus: getCommonAssetPath("constraints/constraint-no-bonus.png"),
    constraintClearGrid: getCommonAssetPath("constraints/constraint-clear-grid.png"),
    stone1: themeImages.block1,
    stone2: themeImages.block2,
    stone3: themeImages.block3,
    stone4: themeImages.block4,
    background: themeImages.background,
    loadingBackground: themeImages.loadingBg,
    logo: themeImages.logo,
    loader: "/assets/theme-1/loader.svg",
    imageBackground: themeImages.background,
  };
};

export default ImageAssets;
