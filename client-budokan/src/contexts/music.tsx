import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { audioManager } from "@/audio/AudioManager";
import {
  type MusicContext,
  type SfxName,
  type ThemeId,
  loadAudioSettings,
  saveAudioSettings,
} from "@/config/themes";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import noop from "@/utils/noop";

export interface MusicPlayerContextValue {
  musicVolume: number;
  effectsVolume: number;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  setMusicContext: (context: MusicContext) => void;
  currentContext: MusicContext;
  isPlaying: boolean;
  playSfx: (name: SfxName) => void;
  playStart: () => void;
  playOver: () => void;
  playSwipe: () => void;
  playExplode: () => void;
  playSuccess: () => void;
  playTheme: () => void;
  stopTheme: () => void;
  setTheme: (theme: boolean) => void;
}

const DEFAULT_MUSIC_CONTEXT: MusicContext = "main";

export const MusicPlayerContext = createContext<MusicPlayerContextValue>({
  musicVolume: 0.3,
  effectsVolume: 0.5,
  setMusicVolume: noop,
  setEffectsVolume: noop,
  setMusicContext: noop,
  currentContext: DEFAULT_MUSIC_CONTEXT,
  isPlaying: false,
  playSfx: noop,
  playStart: noop,
  playOver: noop,
  playSwipe: noop,
  playExplode: noop,
  playSuccess: noop,
  playTheme: noop,
  stopTheme: noop,
  setTheme: noop,
});

const clampVolume = (volume: number): number => Math.min(Math.max(volume, 0), 1);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;
  const [musicVolume, setMusicVolumeState] = useState<number>(audioManager.musicVolume);
  const [effectsVolume, setEffectsVolumeState] = useState<number>(audioManager.effectsVolume);
  const [currentContext, setCurrentContextState] = useState<MusicContext>(DEFAULT_MUSIC_CONTEXT);
  const [isPlaying, setIsPlaying] = useState<boolean>(audioManager.isPlaying);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const settings = loadAudioSettings();
    audioManager.setMusicVolume(settings.musicVolume);
    audioManager.setEffectsVolume(settings.effectsVolume);
    setMusicVolumeState(settings.musicVolume);
    setEffectsVolumeState(settings.effectsVolume);
  }, []);

  // Web Audio autoplay policy: browsers block Howl.play() until a user gesture.
  // Re-trigger playMusic on first interaction so the track actually starts.
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;

      audioManager.playMusic(themeId, currentContext);
      setIsPlaying(audioManager.isPlaying);

      document.removeEventListener("click", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };

    document.addEventListener("click", unlock, true);
    document.addEventListener("touchstart", unlock, true);
    document.addEventListener("keydown", unlock, true);

    return () => {
      document.removeEventListener("click", unlock, true);
      document.removeEventListener("touchstart", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId, currentContext]);

  useEffect(() => {
    if (audioManager.isPlaying) {
      audioManager.playMusic(themeId, currentContext);
      setIsPlaying(audioManager.isPlaying);
    }
  }, [themeId, currentContext]);

  useEffect(() => {
    return () => {
      audioManager.stopMusic(false);
      audioManager.dispose();
    };
  }, []);

  const setMusicVolume = useCallback(
    (volume: number) => {
      const nextVolume = clampVolume(volume);
      audioManager.setMusicVolume(nextVolume);
      saveAudioSettings({
        musicVolume: nextVolume,
        effectsVolume,
      });
      setMusicVolumeState(nextVolume);
    },
    [effectsVolume],
  );

  const setEffectsVolume = useCallback(
    (volume: number) => {
      const nextVolume = clampVolume(volume);
      audioManager.setEffectsVolume(nextVolume);
      saveAudioSettings({
        musicVolume,
        effectsVolume: nextVolume,
      });
      setEffectsVolumeState(nextVolume);
    },
    [musicVolume],
  );

  const setMusicContext = useCallback(
    (context: MusicContext) => {
      setCurrentContextState(context);
      audioManager.playMusic(themeId, context);
      setIsPlaying(audioManager.isPlaying);
    },
    [themeId],
  );

  const playTheme = useCallback(() => {
    audioManager.playMusic(themeId, currentContext);
    setIsPlaying(audioManager.isPlaying);
  }, [themeId, currentContext]);

  const stopTheme = useCallback(() => {
    audioManager.stopMusic();
    setIsPlaying(audioManager.isPlaying);
  }, []);

  const setTheme = useCallback(
    (theme: boolean) => {
      const nextContext: MusicContext = theme ? "main" : "level";
      setMusicContext(nextContext);
    },
    [setMusicContext],
  );

  const playSfx = useCallback((name: SfxName) => {
    audioManager.playSfx(name);
  }, []);

  const playStart = useCallback(() => {
    audioManager.playSfx("start");
  }, []);

  const playOver = useCallback(() => {
    audioManager.playSfx("over");
  }, []);

  const playSwipe = useCallback(() => {
    audioManager.playSfx("swipe");
  }, []);

  const playExplode = useCallback(() => {
    audioManager.playSfx("explode");
  }, []);

  const playSuccess = useCallback(() => {
    audioManager.playSfx("new");
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      musicVolume,
      effectsVolume,
      setMusicVolume,
      setEffectsVolume,
      setMusicContext,
      currentContext,
      isPlaying,
      playSfx,
      playStart,
      playOver,
      playSwipe,
      playExplode,
      playSuccess,
      playTheme,
      stopTheme,
      setTheme,
    }),
    [
      musicVolume,
      effectsVolume,
      setMusicVolume,
      setEffectsVolume,
      setMusicContext,
      currentContext,
      isPlaying,
      playSfx,
      playStart,
      playOver,
      playSwipe,
      playExplode,
      playSuccess,
      playTheme,
      stopTheme,
      setTheme,
    ],
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}
