import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import useSound from "use-sound";

type Track = {
  name: string;
  url: string;
};

const menuTracks: Track[] = [
  { name: "Intro", url: "/sounds/musics/theme-jungle2.mp3" },
  { name: "Intro", url: "/sounds/musics/theme-jungle2.mp3" },
];

const playTracks: Track[] = [
  { name: "Play", url: "/sounds/musics/theme-jungle3.mp3" },
  { name: "Play", url: "/sounds/musics/theme-jungle3.mp3" },
];

const effectTracks: Track[] = [
  { name: "Start", url: "/sounds/effects/start.mp3" },
  { name: "Start", url: "/sounds/effects/start.mp3" },
  { name: "Over", url: "/sounds/effects/over.mp3" },
];

const MusicPlayerContext = createContext({
  playTheme: () => {},
  stopTheme: () => {},
  isPlaying: false,
  volume: 0.2,
  setVolume: (volume: number) => {
    volume;
  },
  setTheme: (theme: boolean) => {
    theme;
  },
  playStart: () => {},
  playOver: () => {},
});

export const MusicPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentEffectIndex, setCurrentEffectIndex] = useState(0);
  const [tracks, setTracks] = useState(menuTracks);
  const [theme, setTheme] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2);

  const goToNextTrack = () => {
    setCurrentTrackIndex((prevIndex) => {
      return (prevIndex + 1) % tracks.length;
    });
  };

  const playStart = useCallback(() => {
    setCurrentEffectIndex(1);
  }, []);

  const playOver = useCallback(() => {
    setCurrentEffectIndex(2);
  }, []);

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

  const [playEffect, { stop: stopEffect }] = useSound(
    effectTracks[currentEffectIndex].url,
    {
      volume,
    },
  );

  useEffect(() => {
    playTheme();
    return () => stopTheme();
  }, [currentTrackIndex, playTheme, stopTheme]);

  useEffect(() => {
    if (currentEffectIndex === 0) return;
    playEffect();
    return () => stopEffect();
  }, [currentEffectIndex, playEffect, stopEffect]);

  useEffect(() => {
    setTracks(theme ? menuTracks : playTracks);
    setCurrentTrackIndex(0);
  }, [theme]);

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
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  return useContext(MusicPlayerContext);
};
