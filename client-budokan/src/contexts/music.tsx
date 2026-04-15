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
  setMusicPlaylist: (contexts: MusicContext[]) => void;
  currentContext: MusicContext;
  isPlaying: boolean;
  playSfx: (name: SfxName) => void;
  playSwipe: () => void;
  playExplode: () => void;
  playTheme: () => void;
  stopTheme: () => void;
}

const DEFAULT_MUSIC_CONTEXT: MusicContext = "main";

export const MusicPlayerContext = createContext<MusicPlayerContextValue>({
  musicVolume: 0.3,
  effectsVolume: 0.5,
  setMusicVolume: noop,
  setEffectsVolume: noop,
  setMusicContext: noop,
  setMusicPlaylist: noop,
  currentContext: DEFAULT_MUSIC_CONTEXT,
  isPlaying: false,
  playSfx: noop,
  playSwipe: noop,
  playExplode: noop,
  playTheme: noop,
  stopTheme: noop,
});

const clampVolume = (volume: number): number => Math.min(Math.max(volume, 0), 1);

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;
  const [musicVolume, setMusicVolumeState] = useState<number>(audioManager.musicVolume);
  const [effectsVolume, setEffectsVolumeState] = useState<number>(audioManager.effectsVolume);
  const [currentContext, setCurrentContextState] = useState<MusicContext>(DEFAULT_MUSIC_CONTEXT);
  const [playlistContexts, setPlaylistContextsState] = useState<MusicContext[]>([]);
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

      if (playlistContexts.length > 0) {
        audioManager.playMusicPlaylist(themeId, playlistContexts);
      } else {
        audioManager.playMusic(themeId, currentContext);
      }
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
  }, [themeId, currentContext, playlistContexts]);

  useEffect(() => {
    if (audioManager.isPlaying) {
      if (playlistContexts.length > 0) {
        audioManager.playMusicPlaylist(themeId, playlistContexts);
      } else {
        audioManager.playMusic(themeId, currentContext);
      }
      setIsPlaying(audioManager.isPlaying);
    }
  }, [themeId, currentContext, playlistContexts]);

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
      if (audioManager.currentThemeId === themeId && audioManager.currentContext === context && audioManager.isPlaying && playlistContexts.length === 0) {
        return;
      }
      setPlaylistContextsState([]);
      setCurrentContextState(context);
      audioManager.playMusic(themeId, context);
      setIsPlaying(audioManager.isPlaying);
    },
    [themeId, playlistContexts.length],
  );

  const setMusicPlaylist = useCallback(
    (contexts: MusicContext[]) => {
      setPlaylistContextsState(contexts);
      setCurrentContextState(contexts[0] ?? DEFAULT_MUSIC_CONTEXT);
      audioManager.playMusicPlaylist(themeId, contexts);
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

  const playSfx = useCallback((name: SfxName) => {
    audioManager.playSfx(name);
  }, []);

  const playSwipe = useCallback(() => {
    audioManager.playSfx("swipe");
  }, []);

  const playExplode = useCallback(() => {
    audioManager.playSfx("explode");
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      musicVolume,
      effectsVolume,
      setMusicVolume,
      setEffectsVolume,
      setMusicContext,
      setMusicPlaylist,
      currentContext,
      isPlaying,
      playSfx,
      playSwipe,
      playExplode,
      playTheme,
      stopTheme,
    }),
    [
      musicVolume,
      effectsVolume,
      setMusicVolume,
      setEffectsVolume,
      setMusicContext,
      setMusicPlaylist,
      currentContext,
      isPlaying,
      playSfx,
      playSwipe,
      playExplode,
      playTheme,
      stopTheme,
    ],
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}
