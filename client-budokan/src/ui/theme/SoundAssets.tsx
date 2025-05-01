const SoundAssets = (theme: string) => {
  const PathAssets = "/assets/" + theme + "/";

  return {
    start: PathAssets + "sounds/effects/start.mp3",
    over: PathAssets + "sounds/effects/over.mp3",
    jungle2: PathAssets + "sounds/musics/theme-jungle2.mp3",
    jungle3: PathAssets + "sounds/musics/theme-jungle3.mp3",
    swipe: PathAssets + "sounds/effects/swipe.mp3",
    explode: PathAssets + "sounds/effects/explode.mp3",
  };
};

export default SoundAssets;
