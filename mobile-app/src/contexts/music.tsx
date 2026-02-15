import React, { createContext, useState, useEffect, useCallback, useRef, type MutableRefObject } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { soundManager } from "@/pixi/audio/SoundManager";
import { AssetId } from "@/pixi/assets/catalog";
import type { ThemeId } from "@/pixi/utils/colors";

// Deterministic music context — each context maps to exactly one track
export type MusicContext = 'main' | 'map' | 'level' | 'boss';

const MUSIC_CONTEXT_TRACK: Record<MusicContext, AssetId> = {
  main: AssetId.MusicMain,
  map: AssetId.MusicMap,
  level: AssetId.MusicLevel,
  boss: AssetId.MusicBoss,
};

function useUserGesture(onGesture: () => void) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    const handler = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      onGesture();
      for (const evt of ["pointerdown", "keydown", "touchstart"]) {
        document.removeEventListener(evt, handler, true);
      }
    };
    for (const evt of ["pointerdown", "keydown", "touchstart"]) {
      document.addEventListener(evt, handler, { capture: true, once: false });
    }
    return () => {
      for (const evt of ["pointerdown", "keydown", "touchstart"]) {
        document.removeEventListener(evt, handler, true);
      }
    };
  }, [onGesture]);
  return firedRef as MutableRefObject<boolean>;
}

export const MusicPlayerContext = createContext<{
  musicVolume: number;
  effectsVolume: number;
  setMusicVolume: (volume: number) => void;
  setEffectsVolume: (volume: number) => void;
  setMusicContext: (ctx: MusicContext, themeOverride?: ThemeId) => void;
  playStart: () => void;
  playOver: () => void;
  playSwipe: () => void;
  playExplode: () => void;
  playSuccess: () => void;
}>({
  musicVolume: 0.5,
  setMusicVolume: () => {},
  effectsVolume: 0.5,
  setEffectsVolume: () => {},
  setMusicContext: () => {},
  playStart: () => {},
  playOver: () => {},
  playSwipe: () => {},
  playExplode: () => {},
  playSuccess: () => {},
});

const STORAGE_KEY = "zkube_audio_settings";
const DEFAULT_MUSIC_VOLUME = 0.5;
const DEFAULT_EFFECTS_VOLUME = 0.5;

function loadAudioSettings(): { musicVolume: number; effectsVolume: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        musicVolume: typeof parsed.musicVolume === "number" ? parsed.musicVolume : DEFAULT_MUSIC_VOLUME,
        effectsVolume: typeof parsed.effectsVolume === "number" ? parsed.effectsVolume : DEFAULT_EFFECTS_VOLUME,
      };
    }
  } catch { /* ignore corrupt data */ }
  return { musicVolume: DEFAULT_MUSIC_VOLUME, effectsVolume: DEFAULT_EFFECTS_VOLUME };
}

function saveAudioSettings(musicVolume: number, effectsVolume: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ musicVolume, effectsVolume }));
  } catch { /* localStorage full or unavailable */ }
}

export const MusicPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;

  const saved = useRef(loadAudioSettings());
  const [musicContext, setMusicContextState] = useState<MusicContext>('main');
  const [musicThemeOverride, setMusicThemeOverride] = useState<ThemeId | null>(null);
  const [musicVolume, setMusicVolumeState] = useState(saved.current.musicVolume);
  const [effectsVolume, setEffectsVolumeState] = useState(saved.current.effectsVolume);

  const effectiveThemeId = musicThemeOverride ?? themeId;
  const prevThemeRef = useRef<ThemeId>(effectiveThemeId);
  const prevContextRef = useRef<MusicContext>(musicContext);
  const effectiveThemeRef = useRef(effectiveThemeId);
  effectiveThemeRef.current = effectiveThemeId;
  const musicVolumeRef = useRef(musicVolume);
  musicVolumeRef.current = musicVolume;
  const musicContextRef = useRef<MusicContext>(musicContext);
  musicContextRef.current = musicContext;

  const setMusicContext = useCallback((ctx: MusicContext, themeOverride?: ThemeId) => {
    setMusicContextState(ctx);
    setMusicThemeOverride(themeOverride ?? null);
  }, []);

  const handleFirstGesture = useCallback(() => {
    soundManager.preloadCommonSfx();
    soundManager.preloadThemeMusic(effectiveThemeRef.current);
    if (musicVolumeRef.current > 0) {
      const track = MUSIC_CONTEXT_TRACK[musicContextRef.current];
      soundManager.bgm.play(effectiveThemeRef.current, track);
    }
  }, []);

  const gestureReady = useUserGesture(handleFirstGesture);

  useEffect(() => {
    soundManager.themeId = effectiveThemeId;

    const themeChanged = prevThemeRef.current !== effectiveThemeId;
    const contextChanged = prevContextRef.current !== musicContext;

    if (themeChanged) {
      soundManager.bgm.stop();
      soundManager.unloadThemeMusic(prevThemeRef.current);
      prevThemeRef.current = effectiveThemeId;
    }

    if (gestureReady.current) {
      soundManager.preloadThemeMusic(effectiveThemeId);
    }

    if (gestureReady.current && musicVolume > 0) {
      if (themeChanged || contextChanged || !soundManager.bgm.isPlaying) {
        const track = MUSIC_CONTEXT_TRACK[musicContext];
        soundManager.bgm.play(effectiveThemeId, track);
      }
    }

    prevContextRef.current = musicContext;
  }, [effectiveThemeId, musicContext, musicVolume, gestureReady]);

  useEffect(() => {
    soundManager.bgm.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    soundManager.sfx.volume = effectsVolume;
  }, [effectsVolume]);

  useEffect(() => {
    saveAudioSettings(musicVolume, effectsVolume);
  }, [musicVolume, effectsVolume]);

  const setMusicVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const wasZero = musicVolumeRef.current === 0;

    setMusicVolumeState(clamped);

    if (clamped > 0 && wasZero && gestureReady.current) {
      const track = MUSIC_CONTEXT_TRACK[musicContextRef.current];
      soundManager.bgm.play(effectiveThemeRef.current, track);
    } else if (clamped === 0) {
      soundManager.bgm.stop();
    }
  }, [gestureReady]);

  const setEffectsVolume = useCallback((volume: number) => {
    setEffectsVolumeState(Math.max(0, Math.min(1, volume)));
  }, []);

  useEffect(() => {
    return () => {
      soundManager.bgm.stop();
    };
  }, []);

  const playStart = useCallback(() => {
    soundManager.sfx.play(AssetId.SfxStart);
  }, []);

  const playOver = useCallback(() => {
    soundManager.sfx.play(AssetId.SfxOver);
  }, []);

  const playSwipe = useCallback(() => {
    soundManager.sfx.play(AssetId.SfxSwipe);
  }, []);

  const playExplode = useCallback(() => {
    soundManager.sfx.play(AssetId.SfxExplode);
  }, []);

  const playSuccess = useCallback(() => {
    soundManager.sfx.play(AssetId.SfxNew);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        musicVolume,
        setMusicVolume,
        effectsVolume,
        setEffectsVolume,
        setMusicContext,
        playStart,
        playOver,
        playSwipe,
        playExplode,
        playSuccess,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};
