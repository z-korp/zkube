import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import useSound from "use-sound";
import SoundAssets from "@/ui/theme/SoundAssets";
import { useTheme } from "@/ui/elements/theme-provider/hooks";
import noop from '@/utils/noop';

type Track = {
  name: string;
  url: string;
};

export const MusicPlayerContext = createContext<{
  playTheme: () => unknown,
  stopTheme: () => unknown,
  isPlaying: boolean,
  volume: number,
  setVolume: (volume: number) => unknown,
  setTheme: (theme: boolean) => unknown,
  playStart: () => unknown,
  playOver: () => unknown,
  playSwipe: () => unknown,
  playExplode: () => unknown,
}>({
  playTheme: noop,
  stopTheme: noop,
  isPlaying: false,
  musicVolume: 0.2,
  setMusicVolume: (volume: number) => { volume },
  effectsVolume: 0.2,
  setEffectsVolume: (volume: number) => { theme},
  setTheme: (theme: boolean) => {},
  playStart: noop,
  playOver: noop,
  playSwipe: noop,
  playExplode: noop,
});

export const MusicPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { themeTemplate } = useTheme();
  const soundAssets = SoundAssets(themeTemplate);

  const menuTracks: Track[] = [
    { name: "Intro", url: soundAssets.jungle2 },
    { name: "Intro", url: soundAssets.jungle2 },
  ];

  const playTracks: Track[] = [
    { name: "Play", url: soundAssets.jungle3 },
    { name: "Play", url: soundAssets.jungle3 },
  ];

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [tracks, setTracks] = useState(menuTracks);
  const [theme, setTheme] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.2);
  const [effectsVolume, setEffectsVolume] = useState(0.2);

  // Hooks séparés pour chaque effet sonore avec volume indépendant
  const [playStartSound] = useSound(soundAssets.start, {
    volume: effectsVolume,
  });
  const [playOverSound] = useSound(soundAssets.over, { volume: effectsVolume });
  const [playSwipeSound] = useSound(soundAssets.swipe, {
    volume: effectsVolume,
  });
  const [playExplodeSound] = useSound(soundAssets.explode, {
    volume: effectsVolume,
  });

  const goToNextTrack = () => {
    setCurrentTrackIndex((prevIndex) => {
      return (prevIndex + 1) % tracks.length;
    });
  };

  // Fonctions de lecture d'effets sonores simplifiées
  const playStart = useCallback(() => {
    playStartSound();
  }, [playStartSound]);

  const playOver = useCallback(() => {
    playOverSound();
  }, [playOverSound]);

  const playSwipe = useCallback(() => {
    playSwipeSound();
  }, [playSwipeSound]);

  const playExplode = useCallback(() => {
    playExplodeSound();
  }, [playExplodeSound]);

  const [playTheme, { stop: stopTheme }] = useSound(
    tracks[currentTrackIndex].url,
    {
      volume: musicVolume,
      onplay: () => setIsPlaying(true),
      onstop: () => setIsPlaying(false),
      onend: () => {
        setIsPlaying(false);
        goToNextTrack();
      },
    },
  );

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      stopTheme();
      setIsPlaying(false);
    }
  }, [stopTheme]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  useEffect(() => {
    playTheme();
    return () => stopTheme();
  }, [currentTrackIndex, playTheme, stopTheme]);

  useEffect(() => {
    setTracks(theme ? menuTracks : playTracks);
    setCurrentTrackIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, themeTemplate]);

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
        setTheme,
        playStart,
        playOver,
        playSwipe,
        playExplode,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};
