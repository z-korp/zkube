const ImageAssets = (theme: string) => {
  const PathAssets = "/assets/" + theme + "/";

  return {
    hammer: PathAssets + "bonus/hammer.png",
    tiki: PathAssets + "bonus/tiki.png",
    wave: PathAssets + "bonus/wave.png",
    stone1: PathAssets + "block-1.png",
    stone2: PathAssets + "block-2.png",
    stone3: PathAssets + "block-3.png",
    stone4: PathAssets + "block-4.png",
    background: PathAssets + "loading-bg.png",
    logo: PathAssets + "logo.png",
    loader: PathAssets + "loader.svg",
    imageBackground: PathAssets + "theme-2-1.png",
    imageTotemDark: PathAssets + "theme-2-totem-dark.png",
    imageTotemLight: PathAssets + "theme-2-totem-light.png",
    palmLeft: PathAssets + "palmtree-left.png",
    palmRight: PathAssets + "palmtree-right.png",
  };
};

export default ImageAssets;
