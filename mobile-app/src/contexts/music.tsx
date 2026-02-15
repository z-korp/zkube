import React, { createContext, useState, useEffect, useCallback, useRef, type MutableRefObject } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { soundManager } from "@/pixi/audio/SoundManager";
import { AssetId } from "@/pixi/assets/catalog";
import type { ThemeId } from "@/pixi/utils/colors";

const MENU_TRACKS = [AssetId.MusicMain, AssetId.MusicMap] as const;
const GAMEPLAY_TRACKS = [AssetId.MusicLevel, AssetId.MusicBoss] as const;

function randomMenuTrack(): AssetId {
  return MENU_TRACKS[Math.floor(Math.random() * MENU_TRACKS.length)];
}

function randomGameplayTrack(): AssetId {
  return GAMEPLAY_TRACKS[Math.floor(Math.random() * GAMEPLAY_TRACKS.length)];
}

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
  setIsMenu: (isMenu: boolean) => void;
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
  setIsMenu: () => {},
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
  const [isMenu, setIsMenu] = useState(true);
  const [musicVolume, setMusicVolumeState] = useState(saved.current.musicVolume);
  const [effectsVolume, setEffectsVolumeState] = useState(saved.current.effectsVolume);
  const prevThemeRef = useRef<ThemeId>(themeId);
  const themeIdRef = useRef(themeId);
  themeIdRef.current = themeId;
  const musicVolumeRef = useRef(musicVolume);
  musicVolumeRef.current = musicVolume;
  const isMenuRef = useRef(isMenu);
  isMenuRef.current = isMenu;

  const handleFirstGesture = useCallback(() => {
    soundManager.preloadCommonSfx();
    soundManager.preloadThemeMusic(themeIdRef.current);
    if (musicVolumeRef.current > 0) {
      const track = isMenuRef.current ? randomMenuTrack() : randomGameplayTrack();
      soundManager.bgm.play(themeIdRef.current, track);
    }
  }, []);

  const gestureReady = useUserGesture(handleFirstGesture);

  useEffect(() => {
    soundManager.themeId = themeId;

    if (prevThemeRef.current !== themeId) {
      soundManager.bgm.stop();
      soundManager.unloadThemeMusic(prevThemeRef.current);
      prevThemeRef.current = themeId;
    }

    if (gestureReady.current) {
      soundManager.preloadThemeMusic(themeId);
    }

    if (gestureReady.current && musicVolume > 0 && !soundManager.bgm.isPlaying) {
      const track = isMenu ? randomMenuTrack() : randomGameplayTrack();
      soundManager.bgm.play(themeId, track);
    }
  }, [themeId, isMenu, musicVolume, gestureReady]);

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
      const track = isMenuRef.current ? randomMenuTrack() : randomGameplayTrack();
      soundManager.bgm.play(themeIdRef.current, track);
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
        setIsMenu,
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
