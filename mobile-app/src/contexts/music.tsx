import React, { createContext, useState, useEffect, useCallback, useRef, type MutableRefObject } from "react";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import { soundManager } from "@/pixi/audio/SoundManager";
import { AssetId } from "@/pixi/assets/catalog";
import type { ThemeId } from "@/pixi/utils/colors";

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
  playTheme: () => void;
  stopTheme: () => void;
  isPlaying: boolean;
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
  playTheme: () => {},
  stopTheme: () => {},
  isPlaying: false,
  musicVolume: 0.2,
  setMusicVolume: () => {},
  effectsVolume: 0.2,
  setEffectsVolume: () => {},
  setIsMenu: () => {},
  playStart: () => {},
  playOver: () => {},
  playSwipe: () => {},
  playExplode: () => {},
  playSuccess: () => {},
});

export const MusicPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { themeTemplate } = useTheme();
  const themeId = themeTemplate as ThemeId;

  const [isMenu, setIsMenu] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVolume, setMusicVolumeState] = useState(0.2);
  const [effectsVolume, setEffectsVolumeState] = useState(0.2);
  const prevThemeRef = useRef<ThemeId>(themeId);
  const themeIdRef = useRef(themeId);
  themeIdRef.current = themeId;

  const handleFirstGesture = useCallback(() => {
    soundManager.preloadTheme(themeIdRef.current);
  }, []);

  const gestureReady = useUserGesture(handleFirstGesture);

  useEffect(() => {
    soundManager.themeId = themeId;

    if (gestureReady.current) {
      soundManager.preloadTheme(themeId);
    }

    if (prevThemeRef.current !== themeId) {
      if (gestureReady.current) {
        soundManager.unloadTheme(prevThemeRef.current);
      }
      prevThemeRef.current = themeId;

      if (isPlaying) {
        const track = isMenu ? AssetId.Music2 : AssetId.Music3;
        soundManager.bgm.play(themeId, track);
      }
    }
  }, [themeId, isMenu, isPlaying, gestureReady]);

  useEffect(() => {
    soundManager.bgm.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    soundManager.sfx.volume = effectsVolume;
  }, [effectsVolume]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        soundManager.pauseAll();
      } else {
        soundManager.resumeAll();
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const playTheme = useCallback(() => {
    const track = isMenu ? AssetId.Music2 : AssetId.Music3;
    soundManager.bgm.play(themeId, track);
    setIsPlaying(true);
  }, [themeId, isMenu]);

  const stopTheme = useCallback(() => {
    soundManager.bgm.stop();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      soundManager.bgm.stop();
    };
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setMusicVolumeState(volume);
  }, []);

  const setEffectsVolume = useCallback((volume: number) => {
    setEffectsVolumeState(volume);
  }, []);

  const playStart = useCallback(() => {
    soundManager.sfx.play(themeId, AssetId.SfxStart);
  }, [themeId]);

  const playOver = useCallback(() => {
    soundManager.sfx.play(themeId, AssetId.SfxOver);
  }, [themeId]);

  const playSwipe = useCallback(() => {
    soundManager.sfx.play(themeId, AssetId.SfxSwipe);
  }, [themeId]);

  const playExplode = useCallback(() => {
    soundManager.sfx.play(themeId, AssetId.SfxExplode);
  }, [themeId]);

  const playSuccess = useCallback(() => {
    soundManager.sfx.play(themeId, AssetId.SfxNew);
  }, [themeId]);

  return (
    <MusicPlayerContext.Provider
      value={{
        playTheme,
        stopTheme,
        isPlaying,
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
