# CapacitorJS Migration Plan - mobile-app

## Overview

This document tracks the migration of `mobile-app` (formerly `client-pixijs`) to a CapacitorJS mobile app targeting iOS and Android, with Cartridge Controller integration for Starknet wallet authentication.

**Start Date:** February 4, 2026  
**Completion Date:** February 4, 2026  
**Status:** COMPLETED  
**Target Platforms:** Android (primary), iOS (prepared for later)  
**URL Scheme:** `zkubegame://`  
**Domain:** `zkube.xyz`

---

## Constraints

- **Policies MUST be sorted alphabetically** (contract addresses AND methods) - IMPLEMENTED
- **No push notifications** for initial release
- **Google Play only** (Apple Developer account pending)
- **Native features:** Haptics, Native Audio, Share
- **Node.js 22+ required** for Capacitor 8.x

---

## Progress Tracker

### Phase 1: Policy Sorting Fix (CRITICAL)
- [x] Fix alphabetical policy sorting in `mobile-app/src/cartridgeConnector.tsx`
- [x] Fix alphabetical policy sorting in `client-budokan/src/cartridgeConnector.tsx`

### Phase 2: Capacitor Setup
- [x] Install Capacitor core dependencies (v8.0.2)
- [x] Install Capacitor plugins (app, browser, device, haptics, share, native-audio)
- [x] Create `capacitor.config.ts`
- [x] Update `package.json` scripts

### Phase 3: Platform Detection Utilities
- [x] Create `src/utils/capacitorUtils.ts`
- [x] Create `src/types/promise.ts` (WithResolvers helper)

### Phase 4: Cartridge Controller Integration
- [x] Create `src/dojo/connectorWrapper.ts` (SessionConnectorWrapper)
- [x] Update `src/cartridgeConnector.tsx` for platform-conditional auth
- [x] Update `@cartridge/connector` to 0.12.2

### Phase 5: Native Audio Integration
- [x] Create `src/hooks/useNativeAudio.ts`
- [~] Update `src/contexts/music.tsx` for app lifecycle (SKIPPED - Web audio works in WebView)
- [~] Update `src/contexts/sound.tsx` for native SFX (SKIPPED - Web audio works in WebView)

### Phase 6: Haptic Feedback
- [x] Create `src/hooks/useHaptics.ts`
- [ ] Integrate haptics in game components (FUTURE: use the hook where needed)

### Phase 7: Share Functionality
- [x] Create `src/hooks/useShare.ts`

### Phase 8: Add Native Platforms
- [x] Run `npx cap add android`
- [x] Run `npx cap add ios`

### Phase 9: Android Configuration
- [x] Update `AndroidManifest.xml` with intent filters
- [x] Configure deep links for `zkubegame://` scheme
- [x] Configure App Links for `https://zkube.xyz/open`
- [x] Add VIBRATE permission for haptics
- [x] Set portrait orientation

### Phase 10: iOS Configuration (Prepared)
- [x] Update `Info.plist` with URL schemes
- [x] Create `App.entitlements` with associated domains
- [x] AppDelegate.swift already configured (default Capacitor)
- [x] Set portrait-only orientation for iPhone

### Phase 11: UI Adaptations
- [x] Viewport meta already has `viewport-fit=cover`
- [x] Safe area CSS variables available via `capacitorUtils.ts`

### Phase 12: Build & Test
- [x] Build web assets (`pnpm build`)
- [x] Sync to native (`npx cap sync`)
- [ ] Test on Android emulator/device (NEXT STEP)
- [ ] Test OAuth flow with Cartridge Controller
- [ ] Test haptics, audio, share functionality

---

## File Inventory

### New Files Created

| File | Status | Description |
|------|--------|-------------|
| `mobile-app/capacitor.config.ts` | [x] | Capacitor configuration |
| `mobile-app/src/utils/capacitorUtils.ts` | [x] | Platform detection |
| `mobile-app/src/types/promise.ts` | [x] | TypeScript helpers |
| `mobile-app/src/dojo/connectorWrapper.ts` | [x] | SessionConnector wrapper |
| `mobile-app/src/hooks/useNativeAudio.ts` | [x] | Native audio hook |
| `mobile-app/src/hooks/useHaptics.ts` | [x] | Haptic feedback hook |
| `mobile-app/src/hooks/useShare.ts` | [x] | Share functionality hook |
| `mobile-app/ios/App/App/App.entitlements` | [x] | iOS associated domains |

### Files Modified

| File | Status | Changes |
|------|--------|---------|
| `mobile-app/package.json` | [x] | Added Capacitor deps + scripts |
| `mobile-app/src/cartridgeConnector.tsx` | [x] | Platform connector + sorting |
| `client-budokan/src/cartridgeConnector.tsx` | [x] | Alphabetical sorting fix |
| `mobile-app/android/app/src/main/AndroidManifest.xml` | [x] | Deep links + permissions |
| `mobile-app/ios/App/App/Info.plist` | [x] | URL schemes + orientation |

### Native Folders Created

| Folder | Description |
|--------|-------------|
| `mobile-app/android/` | Android native project |
| `mobile-app/ios/` | iOS native project |

---

## External Requirements Checklist

- [ ] **Asset Links File:** Host at `https://zkube.xyz/.well-known/assetlinks.json`
- [ ] **App Icon:** 1024x1024 PNG at `resources/icon.png`
- [ ] **Splash Screen:** 2732x2732 PNG at `resources/splash.png`
- [ ] **Google Play Console:** Create app, get signing fingerprint

---

## Technical Details

### Deep Link Configuration

**Custom URL Scheme:**
```
zkubegame://open
```

**Universal Links (Android App Links):**
```
https://zkube.xyz/open
```

### Asset Links File (zkube.xyz/.well-known/assetlinks.json)

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.zkube.game",
      "sha256_cert_fingerprints": ["YOUR_SIGNING_KEY_FINGERPRINT"]
    }
  }
]
```

### Capacitor Configuration

```typescript
const config: CapacitorConfig = {
  appId: "com.zkube.game",
  appName: "zKube",
  webDir: "dist",
};
```

### Platform-Specific Auth Options

```typescript
// Android: No WebAuthn (unreliable in WebView)
const signupOptions = isNativeAndroid
  ? ["google", "discord", "password"]
  : ["google", "discord", "webauthn", "password"];
```

### SessionConnector Redirect URLs

```typescript
redirectUrl: "zkubegame://open",
disconnectRedirectUrl: "zkubegame://open",
```

---

## Package Versions (Installed)

| Package | Version | Purpose |
|---------|---------|---------|
| `@capacitor/core` | ^8.0.2 | Core runtime |
| `@capacitor/cli` | ^8.0.2 | CLI tools |
| `@capacitor/android` | ^8.0.2 | Android platform |
| `@capacitor/ios` | ^8.0.2 | iOS platform |
| `@capacitor/app` | ^8.0.0 | App lifecycle |
| `@capacitor/browser` | ^8.0.0 | In-app browser |
| `@capacitor/device` | ^8.0.0 | Device info |
| `@capacitor/haptics` | ^8.0.0 | Haptic feedback |
| `@capacitor/share` | ^8.0.0 | Native share |
| `@capacitor-community/native-audio` | ^8.0.0 | Native audio |
| `@cartridge/connector` | ^0.12.2 | Controller connector |

---

## Commands Reference

### Development
```bash
# IMPORTANT: Use Node 22+ for Capacitor 8.x
nvm use 22

# Web dev server
pnpm slot

# Build for Capacitor
pnpm build && npx cap copy

# Sync dependencies
npx cap sync

# Open in IDE
npx cap open android
npx cap open ios

# Run on device
npx cap run android
npx cap run ios
```

### Production Build
```bash
pnpm build
npx cap sync
# Then use Android Studio / Xcode to build release
```

### Package.json Scripts Added
```json
{
  "build:cap": "npm run build && npx cap copy",
  "cap:sync": "npx cap sync",
  "cap:ios": "npx cap open ios",
  "cap:android": "npx cap open android",
  "cap:run:ios": "npx cap run ios",
  "cap:run:android": "npx cap run android",
  "cap:assets": "npx capacitor-assets generate"
}
```

---

## Troubleshooting

### OAuth Flow Issues
- Ensure `zkubegame://` scheme is registered in AndroidManifest.xml
- Check that `App.addListener("resume")` fires after browser return
- Verify `Browser.close()` is called on deep link receive
- On Android, don't use WebAuthn - use Google/Discord/Password

### Audio Issues on Android
- Use `@capacitor-community/native-audio` for better performance
- Handle app pause/resume to stop/restart music
- Preload audio files before playing
- Files must be in `public/` folder with `public/` prefix in path

### WebAuthn on Android
- WebAuthn is unreliable on Android WebViews
- Exclude from signup options: `["google", "discord", "password"]`

### Node Version
- Capacitor 8.x requires Node 22+
- Use `nvm use 22` before running Capacitor commands

---

## Notes

- iOS deployment requires Apple Developer account ($99/year)
- Android App Links require `assetlinks.json` hosted at domain
- Cartridge Controller uses `webcredentials:cartridge.gg` for passkey sync (iOS)
- Native audio requires files in `public/` directory with path prefix
- Existing web audio (Howler.js) still works in WebView

---

## Next Steps

1. **Create app icons and splash screens** in `resources/` folder
2. **Generate assets:** `npx capacitor-assets generate`
3. **Test on Android device/emulator**
4. **Set up Google Play Console**
5. **Get signing key fingerprint** for asset links
6. **Host assetlinks.json** at zkube.xyz
7. **Integrate haptics** in game components (useHaptics hook ready)
8. **Add share buttons** using useShare hook

---

## Changelog

### 2026-02-04
- Initial migration plan created
- Identified alphabetical policy sorting requirement
- Defined scope: Android first, iOS prepared
- **COMPLETED**: Full Capacitor migration
  - Installed Capacitor 8.0.2 with all plugins
  - Created platform utilities and hooks
  - Implemented SessionConnectorWrapper for native OAuth
  - Configured Android and iOS native projects
  - Build and sync successful
- **Renamed**: `client-pixijs/` -> `mobile-app/`
