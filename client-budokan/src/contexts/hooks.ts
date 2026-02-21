import { useContext } from "react";
import { MusicPlayerContext, type MusicPlayerContextValue } from "./music";

export const useMusicPlayer = (): MusicPlayerContextValue => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};
