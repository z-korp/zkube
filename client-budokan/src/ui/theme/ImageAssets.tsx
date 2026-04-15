import { getThemeImages, type ThemeId } from "@/config/themes";

const ImageAssets = (theme: ThemeId) => {
  const themeImages = getThemeImages(theme);

  return {
    ...themeImages,
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
