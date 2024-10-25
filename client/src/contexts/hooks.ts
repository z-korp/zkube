import { useContext } from 'react';
import { MusicPlayerContext } from './music';

export const useMusicPlayer = () => {
    return useContext(MusicPlayerContext);
  };
