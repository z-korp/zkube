/**
 * Haptic Feedback Hook for Native Apps
 * 
 * Provides haptic feedback functions that only trigger on native platforms.
 * Uses @capacitor/haptics for iOS and Android vibration patterns.
 * 
 * Usage:
 * const { lightImpact, heavyImpact, successNotification } = useHaptics();
 * 
 * // In game logic:
 * onBlockMove(() => lightImpact());
 * onLineClear(() => heavyImpact());
 * onCombo(() => successNotification());
 */

import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useCallback } from "react";
import { isNative } from "../utils/capacitorUtils";

export const useHaptics = () => {
  /**
   * Light impact - for subtle feedback
   * Use for: block selection, menu taps, hover states
   */
  const lightImpact = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.warn("[useHaptics] lightImpact failed:", error);
    }
  }, []);

  /**
   * Medium impact - for standard interactions
   * Use for: block moves, button presses, drag start/end
   */
  const mediumImpact = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.warn("[useHaptics] mediumImpact failed:", error);
    }
  }, []);

  /**
   * Heavy impact - for significant events
   * Use for: single line clears, block drops
   */
  const heavyImpact = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.warn("[useHaptics] heavyImpact failed:", error);
    }
  }, []);

  /**
   * Success notification - celebratory feedback
   * Use for: combos (3+ lines), level complete, achievements
   */
  const successNotification = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.warn("[useHaptics] successNotification failed:", error);
    }
  }, []);

  /**
   * Warning notification - alert feedback
   * Use for: low moves remaining, time running out
   */
  const warningNotification = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.warn("[useHaptics] warningNotification failed:", error);
    }
  }, []);

  /**
   * Error notification - negative feedback
   * Use for: game over, invalid move, failed transaction
   */
  const errorNotification = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.warn("[useHaptics] errorNotification failed:", error);
    }
  }, []);

  /**
   * Selection changed - subtle tick feedback
   * Use for: scrolling through options, slider changes
   */
  const selectionChanged = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      console.warn("[useHaptics] selectionChanged failed:", error);
    }
  }, []);

  /**
   * Vibrate for a specific duration (Android only, iOS ignores duration)
   * Use for: custom vibration patterns
   */
  const vibrate = useCallback(async (duration: number = 300) => {
    if (!isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.warn("[useHaptics] vibrate failed:", error);
    }
  }, []);

  return {
    // Impact feedback (physical "tap" feeling)
    lightImpact,
    mediumImpact,
    heavyImpact,
    
    // Notification feedback (distinct patterns)
    successNotification,
    warningNotification,
    errorNotification,
    
    // Selection feedback
    selectionChanged,
    
    // Custom vibration
    vibrate,
    
    // Platform detection
    isNative,
  };
};

export default useHaptics;
