/**
 * Capacitor Platform Detection Utilities
 * 
 * Provides utilities for detecting the current platform (web, iOS, Android)
 * and platform-specific configurations.
 */

import { Capacitor } from "@capacitor/core";

/**
 * Current platform: "web" | "ios" | "android"
 */
export const platform = Capacitor.getPlatform();

/**
 * True if running as a native app (iOS or Android)
 */
export const isNative = platform === "ios" || platform === "android";

/**
 * True if running on Android native app
 */
export const isNativeAndroid = platform === "android";

/**
 * True if running on iOS native app
 */
export const isNativeIOS = platform === "ios";

/**
 * True if running in web browser
 */
export const isWeb = platform === "web";

/**
 * Safe area padding for top of screen (accounts for notches/status bars)
 * - iOS: 50px (Dynamic Island / notch)
 * - Android: 25px (status bar)
 * - Web: 0px
 */
export const nativePaddingTop = isNativeIOS ? "50px" : isNativeAndroid ? "25px" : "0px";

/**
 * Safe area padding for bottom of screen (accounts for home indicators)
 * - iOS: 34px (home indicator)
 * - Android/Web: 0px
 */
export const nativePaddingBottom = isNativeIOS ? "34px" : "0px";

/**
 * App Store URLs for directing users to download/rate the app
 */
export const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.zkube.game";
export const IOS_STORE_URL = import.meta.env.VITE_PUBLIC_IOS_STORE_URL ?? "https://apps.apple.com/app/zkube";

/**
 * Get the appropriate store URL for the current platform
 */
export const getStoreUrl = (): string => {
  if (isNativeAndroid) return ANDROID_STORE_URL;
  if (isNativeIOS) return IOS_STORE_URL;
  // On web, default to Android Play Store
  return ANDROID_STORE_URL;
};

/**
 * Deep link URL scheme for OAuth callbacks
 */
export const DEEP_LINK_SCHEME = "zkubegame";
export const DEEP_LINK_HOST = "open";
export const DEEP_LINK_URL = `${DEEP_LINK_SCHEME}://${DEEP_LINK_HOST}`;

/**
 * Universal link domain
 */
export const UNIVERSAL_LINK_DOMAIN = "zkube.xyz";
export const UNIVERSAL_LINK_PATH = "/open";
export const UNIVERSAL_LINK_URL = `https://${UNIVERSAL_LINK_DOMAIN}${UNIVERSAL_LINK_PATH}`;
