/**
 * Native Audio Hook for CapacitorJS Apps
 * 
 * Provides native audio playback on iOS/Android with better performance
 * than Howler.js/Web Audio API. Falls back to web audio on browsers.
 * 
 * Key differences from web audio:
 * - Assets must be in the public/ folder
 * - Must preload before playing
 * - Separate lifecycle management for pause/resume
 * 
 * Usage:
 * const { preload, play, stop, loop, setVolume } = useNativeAudio();
 * 
 * // Preload on mount
 * useEffect(() => {
 *   preload("bg_music", "assets/sounds/music.mp3");
 * }, []);
 * 
 * // Play when ready
 * loop("bg_music");
 */

import { NativeAudio } from "@capacitor-community/native-audio";
import { App } from "@capacitor/app";
import { useCallback, useEffect, useRef } from "react";
import { isNative } from "../utils/capacitorUtils";

interface PreloadedAsset {
  assetId: string;
  assetPath: string;
  isPlaying: boolean;
  volume: number;
}

export const useNativeAudio = () => {
  // Track preloaded assets
  const preloadedAssets = useRef<Map<string, PreloadedAsset>>(new Map());
  
  // Track assets that should resume on app resume
  const pausedForBackground = useRef<Set<string>>(new Set());

  /**
   * Preload an audio file for playback
   * @param assetId Unique identifier for this audio
   * @param assetPath Path relative to public/ folder (e.g., "assets/sounds/click.mp3")
   * @param volume Initial volume (0.0 - 1.0)
   */
  const preload = useCallback(async (
    assetId: string,
    assetPath: string,
    volume: number = 1.0
  ) => {
    if (!isNative) return;
    if (preloadedAssets.current.has(assetId)) return; // Already preloaded

    try {
      await NativeAudio.preload({
        assetId,
        assetPath: `public/${assetPath}`,
        audioChannelNum: 1,
        volume,
        isUrl: false,
      });

      preloadedAssets.current.set(assetId, {
        assetId,
        assetPath,
        isPlaying: false,
        volume,
      });

      console.log(`[useNativeAudio] Preloaded: ${assetId}`);
    } catch (error) {
      console.error(`[useNativeAudio] Failed to preload ${assetId}:`, error);
    }
  }, []);

  /**
   * Unload an audio file to free memory
   */
  const unload = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.unload({ assetId });
      preloadedAssets.current.delete(assetId);
      pausedForBackground.current.delete(assetId);
      console.log(`[useNativeAudio] Unloaded: ${assetId}`);
    } catch (error) {
      console.error(`[useNativeAudio] Failed to unload ${assetId}:`, error);
    }
  }, []);

  /**
   * Play an audio file (one-shot)
   */
  const play = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.play({ assetId });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.isPlaying = true;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to play ${assetId}:`, error);
    }
  }, []);

  /**
   * Play an audio file in a loop (for background music)
   */
  const loop = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.loop({ assetId });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.isPlaying = true;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to loop ${assetId}:`, error);
    }
  }, []);

  /**
   * Stop audio playback
   */
  const stop = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.stop({ assetId });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.isPlaying = false;
      pausedForBackground.current.delete(assetId);
    } catch (error) {
      console.error(`[useNativeAudio] Failed to stop ${assetId}:`, error);
    }
  }, []);

  /**
   * Pause audio playback
   */
  const pause = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.pause({ assetId });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.isPlaying = false;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to pause ${assetId}:`, error);
    }
  }, []);

  /**
   * Resume paused audio
   */
  const resume = useCallback(async (assetId: string) => {
    if (!isNative) return;

    try {
      await NativeAudio.resume({ assetId });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.isPlaying = true;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to resume ${assetId}:`, error);
    }
  }, []);

  /**
   * Set volume for an audio asset
   * @param volume 0.0 - 1.0
   */
  const setVolume = useCallback(async (assetId: string, volume: number) => {
    if (!isNative) return;

    try {
      await NativeAudio.setVolume({ assetId, volume });
      const asset = preloadedAssets.current.get(assetId);
      if (asset) asset.volume = volume;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to set volume for ${assetId}:`, error);
    }
  }, []);

  /**
   * Get current playback state
   */
  const isPlaying = useCallback((assetId: string): boolean => {
    const asset = preloadedAssets.current.get(assetId);
    return asset?.isPlaying ?? false;
  }, []);

  /**
   * Get duration of audio (if available)
   */
  const getDuration = useCallback(async (assetId: string): Promise<number> => {
    if (!isNative) return 0;

    try {
      const result = await NativeAudio.getDuration({ assetId });
      return result.duration;
    } catch (error) {
      console.error(`[useNativeAudio] Failed to get duration for ${assetId}:`, error);
      return 0;
    }
  }, []);

  // Handle app lifecycle (pause/resume audio when app goes to background)
  useEffect(() => {
    if (!isNative) return;

    // Pause all playing audio when app goes to background
    const pauseListener = App.addListener("pause", () => {
      preloadedAssets.current.forEach((asset) => {
        if (asset.isPlaying) {
          pausedForBackground.current.add(asset.assetId);
          NativeAudio.pause({ assetId: asset.assetId }).catch(() => {});
        }
      });
    });

    // Resume audio that was paused when app went to background
    const resumeListener = App.addListener("resume", () => {
      pausedForBackground.current.forEach((assetId) => {
        NativeAudio.resume({ assetId }).catch(() => {});
        const asset = preloadedAssets.current.get(assetId);
        if (asset) asset.isPlaying = true;
      });
      pausedForBackground.current.clear();
    });

    return () => {
      pauseListener.then(l => l.remove());
      resumeListener.then(l => l.remove());
    };
  }, []);

  return {
    // Asset management
    preload,
    unload,
    
    // Playback controls
    play,
    loop,
    stop,
    pause,
    resume,
    
    // Volume
    setVolume,
    
    // State
    isPlaying,
    getDuration,
    
    // Platform detection
    isNative,
  };
};

export default useNativeAudio;
