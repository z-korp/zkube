import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import useSound from "use-sound";
import SoundAssets from "@/ui/theme/SoundAssets";
import { useTheme } from "@/ui/elements/theme-provider";
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
  volume: 0.2,
  setVolume: (volume: number) => {
    volume;
  },
  setTheme: (theme: boolean) => {
    theme;
  },
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
  const [volume, setVolume] = useState(0.2);

  // Hooks séparés pour chaque effet sonore
  const [playStartSound] = useSound(soundAssets.start, { volume });
  const [playOverSound] = useSound(soundAssets.over, { volume });
  const [playSwipeSound] = useSound(soundAssets.swipe, { volume });
  const [playExplodeSound] = useSound(soundAssets.explode, { volume });

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
      volume,
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
        volume,
        setVolume,
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
