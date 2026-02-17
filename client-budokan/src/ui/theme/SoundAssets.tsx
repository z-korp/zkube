import {
  SFX_PATHS,
  THEME_MUSIC,
  type MusicContext,
  type ThemeId,
} from "@/config/themes";

const SoundAssets = (theme: ThemeId) => {
  const music: Record<MusicContext, string> = THEME_MUSIC[theme];

  return {
    music,
    sfx: SFX_PATHS,
    start: SFX_PATHS.start,
    over: SFX_PATHS.over,
    swipe: SFX_PATHS.swipe,
    explode: SFX_PATHS.explode,
    break: SFX_PATHS.break,
    move: SFX_PATHS.move,
    new: SFX_PATHS.new,
    success: SFX_PATHS.new,
    jungle2: music.main,
    jungle3: music.level,
  };
};

export default SoundAssets;
