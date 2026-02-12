# Theme Assets Tracker

10 themes, each needing the same set of visual and audio assets. Themes 1-2 have full art. Themes 3-10 use procedural rendering (Graphics API) until art is provided.

## Architecture

All assets flow through a unified catalog+resolver system:

```
catalog.ts  (AssetId enum -> filename + metadata)
     |
resolver.ts (themeId + AssetId -> URL[] | null)
     |
useTexture.ts   (URL[] -> Texture via useTextureWithFallback)
preloader.ts    (themeId + bundle -> preload URLs)
```

**Key files:**
- `pixi/assets/catalog.ts` — Single source of truth: every AssetId, filename, kind, 9-slice borders, bundle
- `pixi/assets/resolver.ts` — Theme-aware URL resolution with fallback chain (theme -> theme-1 -> null)
- `pixi/hooks/useTexture.ts` — `useTextureWithFallback(candidates)` hook used by all components
- `pixi/assets/preloader.ts` — Bundle-based preloading per theme
- `pixi/audio/SoundManager.ts` — BGM + SFX classes using `@pixi/sound` (WebAudio API)
- `pixi/utils/colors.ts` — `ThemeColors` palettes, `ThemeId` type, `isProceduralTheme()`

**Resolution rules:**
- Texture assets: procedural themes return `null` (component draws via Graphics API)
- Sound assets: all themes have their own audio files (duplicated from theme-1 for customization)
- All non-procedural themes try `theme -> theme-1` fallback chain

**Audio pipeline:**
```
catalog.ts (AssetId.SfxBreak → "sounds/effects/break.mp3")
     |
resolver.ts (resolveSoundUrl(themeId, AssetId) → "/assets/theme-X/sounds/...")
     |
SoundManager.ts (soundManager.sfx.play / soundManager.bgm.play)
     |
@pixi/sound (WebAudio API, same engine as PixiJS renderer)
```

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Art asset exists on disk |
| 🔧 | Procedural fallback active (code-drawn) |
| 🎨 | Needs art asset (currently missing) |
| ➖ | Shared / theme-independent |

## Themes

| # | ID | Name | Style | Status |
|---|-----|------|-------|--------|
| 1 | `theme-1` | Tiki | Tropical paradise, wooden frames, jungle | ✅ Full art |
| 2 | `theme-2` | Cosmic | Deep space, nebula gradients, starfield | ✅ Full art |
| 3 | `theme-3` | Neon | Cyberpunk neon on dark city grid | 🔧 Procedural |
| 4 | `theme-4` | Ocean | Deep sea blues, coral, bioluminescence | 🔧 Procedural |
| 5 | `theme-5` | Forest | Enchanted woodland, moss, fireflies | 🔧 Procedural |
| 6 | `theme-6` | Desert | Golden sands, terracotta, sun-baked stone | 🔧 Procedural |
| 7 | `theme-7` | Arctic | Frozen tundra, ice crystals, aurora | 🔧 Procedural |
| 8 | `theme-8` | Lava | Volcanic forge, molten rock, obsidian | 🔧 Procedural |
| 9 | `theme-9` | Candy | Sweet pastels, candy colors | 🔧 Procedural |
| 10 | `theme-10` | Steampunk | Brass gears, copper pipes, dark leather | 🔧 Procedural |

---

## Per-Theme Image Assets

Path pattern: `public/assets/{theme-id}/{filename}`

### Core Game Assets

| Asset | File | Used By | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|---------|----|----|----|----|----|----|----|----|----|-----|
| Block width 1 | `block-1.png` | BlockSprite, NextLinePreview | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Block width 2 | `block-2.png` | BlockSprite, NextLinePreview | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Block width 3 | `block-3.png` | BlockSprite, NextLinePreview | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Block width 4 | `block-4.png` | BlockSprite, NextLinePreview | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Grid background | `grid-bg.png` | GridBackground | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Grid frame | `grid-frame.png` | GridBackground | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Background image | `theme-2-1.png` | PlayScreen, MainScreen, Landing | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |

### UI Chrome

| Asset | File | Used By | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|---------|----|----|----|----|----|----|----|----|----|-----|
| HUD bar | `hud-bar.png` | StatsBar, ProgressHudBar | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Action bar | `action-bar.png` | ActionBar | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Bonus button bg | `bonus-btn-bg.png` | BonusButton | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Star filled | `star-filled.png` | LevelComplete, LevelDisplay | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Star empty | `star-empty.png` | LevelComplete, LevelDisplay | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Logo | `logo.png` | MainScreen, LandingScreen | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |
| Loading background | `loading-bg.png` | LoadingScreen | ✅ | ✅ | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 | 🔧 |

### Decorative Elements

| Asset | File | Used By | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|---------|----|----|----|----|----|----|----|----|----|-----|
| Decoration left | `palmtree-left.png` | LandingScreen, MainScreen | ✅ | ✅ | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 |
| Decoration right | `palmtree-right.png` | LandingScreen, MainScreen | ✅ | ✅ | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 |

**Decoration suggestions per theme:**
- T3 Neon: neon sign / holographic pillar
- T4 Ocean: coral formation / kelp strand
- T5 Forest: tree trunk / mushroom cluster
- T6 Desert: cactus / rock arch
- T7 Arctic: ice formation / frozen tree
- T8 Lava: obsidian pillar / lava geyser
- T9 Candy: candy cane / lollipop tree
- T10 Steampunk: gear tower / pipe stack

### Bonus Icons

| Asset | File | Used By | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|---------|----|----|----|----|----|----|----|----|----|-----|
| Hammer | `bonus/hammer.png` | BonusButton | ✅ | ✅ | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 |
| Wave | `bonus/wave.png` | BonusButton | ✅ | ✅ | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 |
| Totem | `bonus/tiki.png` | BonusButton | ✅ | ✅ | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 | 🎨 |
| Shrink | `bonus/shrink.svg` | BonusButton | ✅ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Shuffle | `bonus/shuffle.svg` | BonusButton | ✅ | ✅ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |

> Shrink/Shuffle are SVG icons (monochrome) — can be tinted per theme via code. Only Hammer/Wave/Totem need per-theme art.

**Totem reskin suggestions:**
- T3 Neon: hologram projector
- T4 Ocean: trident / conch shell
- T5 Forest: tree spirit / ancient stump
- T6 Desert: scarab / obelisk
- T7 Arctic: ice crystal / snowflake totem
- T8 Lava: obsidian idol / fire crystal
- T9 Candy: gummy bear / candy jar
- T10 Steampunk: gear idol / automaton

---

## Catalog-Defined Assets (Not Yet On Disk)

These are defined in `catalog.ts` but no PNG files exist yet for any theme. All currently rendered procedurally.

### 9-Slice Panels

| Asset | File | Purpose | All Themes |
|-------|------|---------|------------|
| Wood panel | `panels/panel-wood.png` | Main card background | 🎨 |
| Dark panel | `panels/panel-dark.png` | Overlay/modal panels | 🎨 |
| Leaf panel | `panels/panel-leaf.png` | Accent panels | 🎨 |
| Glass panel | `panels/panel-glass.png` | Transparent overlays | 🎨 |

> 9-slice borders: 24px all sides for 96×96 source. Per-theme panel styles vary (wood for Tiki, metal for Steampunk, ice for Arctic, etc.)

### 9-Slice Buttons (× 3 states: normal, pressed, disabled)

| Asset | Files | All Themes |
|-------|-------|------------|
| Orange button | `buttons/btn-orange.png` (+pressed, +disabled) | 🎨 |
| Green button | `buttons/btn-green.png` (+pressed, +disabled) | 🎨 |
| Purple button | `buttons/btn-purple.png` (+pressed, +disabled) | 🎨 |
| Red button | `buttons/btn-red.png` (+pressed, +disabled) | 🎨 |
| Icon button | `buttons/btn-icon.png` (+pressed) | 🎨 |

> 9-slice borders: 16px all sides for 80×48 buttons, 12px for 48×48 icon buttons

### Icons

| Asset | File | All Themes |
|-------|------|------------|
| Star filled | `icons/icon-star-filled.png` | 🎨 |
| Star empty | `icons/icon-star-empty.png` | 🎨 |
| Cube | `icons/icon-cube.png` | 🎨 |
| Crown | `icons/icon-crown.png` | 🎨 |
| Fire | `icons/icon-fire.png` | 🎨 |
| Scroll | `icons/icon-scroll.png` | 🎨 |
| Shop | `icons/icon-shop.png` | 🎨 |
| Trophy | `icons/icon-trophy.png` | 🎨 |
| Menu | `icons/icon-menu.png` | 🎨 |
| Close | `icons/icon-close.png` | 🎨 |
| Settings | `icons/icon-settings.png` | 🎨 |
| Lock | `icons/icon-lock.png` | 🎨 |
| Music | `icons/icon-music.png` | 🎨 |
| Sound | `icons/icon-sound.png` | 🎨 |

> Icons can potentially be shared across themes (white/monochrome) and tinted via code. Only create per-theme variants if visual style demands it.

### Particles

| Asset | File | All Themes |
|-------|------|------------|
| Spark | `particles/particle-spark.png` | 🎨 |
| Leaf | `particles/particle-leaf.png` | 🎨 |
| Flower | `particles/particle-flower.png` | 🎨 |
| Star | `particles/particle-star.png` | 🎨 |

> Particles are currently procedural (circles/squares via Graphics API). Art versions would enhance quality. Per-theme variants recommended (snowflakes for Arctic, embers for Lava, bubbles for Ocean, etc.)

---

## Sound Assets

Path pattern: `public/assets/{theme-id}/sounds/`
Audio engine: `@pixi/sound` (WebAudio API, replaces Howler.js/use-sound)

### Sound Effects (11 files per theme)

| Sound | File | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|----|----|----|----|----|----|----|----|----|-----|
| Break | `sounds/effects/break.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Explode | `sounds/effects/explode.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Move | `sounds/effects/move.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| New | `sounds/effects/new.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Start | `sounds/effects/start.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Swipe | `sounds/effects/swipe.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Over | `sounds/effects/over.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |

> ✅* = duplicated from theme-1. Replace with unique per-theme sounds for immersion.

### Music Tracks

| Track | File | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10 |
|-------|------|----|----|----|----|----|----|----|----|----|-----|
| Music 1 | `sounds/musics/theme-jungle.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Music 2 | `sounds/musics/theme-jungle2.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Music 3 | `sounds/musics/theme-jungle3.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| Intro | `sounds/musics/intro.mp3` | ✅ | ✅ | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |

> ✅* = duplicated from theme-1. Main theme music stays shared. Replace per-theme tracks as produced.

---

## Shared Assets (Theme-Independent)

Located in `public/assets/` root. No per-theme variants needed.

| Asset | Path | Purpose |
|-------|------|---------|
| Icon: Moves | `icon-moves.png` | HUD moves counter |
| Icon: Score | `icon-score.png` | HUD score display |
| Icon: Cube | `icon-cube.png` | HUD cube counter |
| Icon: Level | `icon-level.png` | HUD level display |
| Icon: Surrender | `icon-surrender.png` | Surrender button |
| Chests 1-10 | `chests/c1.png` .. `c10.png` | Level rewards |
| Trophy Bronze | `trophies/bronze.png` | Achievement |
| Trophy Silver | `trophies/silver.png` | Achievement |
| Trophy Gold | `trophies/gold.png` | Achievement |
| NFT image | `nft-zkube.png` | Game token |
| NFT small | `nft-zkube-small.png` | Game token thumbnail |
| Lords token | `lords-token.png` | Token icon |
| Wardens logo | `wardens-logo.png` | Partner logo |

---

## Procedural Rendering Fallbacks

For themes 3-10 (`isProceduralTheme() === true`), these elements are drawn via the Graphics API using `ThemeColors`:

| Element | Source of Colors | Notes |
|---------|-----------------|-------|
| Sky gradient background | `backgroundGradientStart` → `backgroundGradientEnd` | Linear gradient fill |
| Grid fill + checkerboard | `gridBg`, `gridCellAlt` | Alternating cell pattern |
| Grid frame + border | `frameBorder` | Rounded rectangle stroke |
| HUD bar background | `hudBar`, `hudBarBorder` | Rounded rectangle |
| Action bar background | `actionBarBg` | Rounded rectangle |
| Block sprites | `blocks[width].fill`, `.glow`, `.highlight` | Rounded rectangles with glow |
| Danger zone overlay | `dangerZone`, `dangerZoneAlpha` | Animated red tint |
| Particles | `particles.primary`, `particles.explosion` | Circles/squares |
| Stars (level complete) | `accent` | 5-point star polygon |
| Progress bar | `accent` | Fill rectangle |
| Bonus button bg | `accent` | Rounded rectangle |
| Vignette | Black radial gradient | Same for all themes |

---

## Asset Creation Priority

### P0 — Blocks (biggest visual impact)
- `block-1.png` through `block-4.png` per theme
- Dimensions: match theme-1 originals (79KB–381KB, various sizes)
- Style: unique texture/pattern per theme matching block colors

### P1 — Backgrounds + Grid
- `theme-2-1.png` (full background scene)
- `grid-bg.png` + `grid-frame.png`
- These define the entire mood of the theme

### P2 — UI Chrome
- `hud-bar.png`, `action-bar.png`, `bonus-btn-bg.png`
- `star-filled.png`, `star-empty.png`
- `logo.png` (variant or shared)
- `loading-bg.png`

### P3 — Bonus Icons
- `bonus/hammer.png`, `bonus/wave.png`, `bonus/tiki.png`
- Themed reskins (see suggestions above)

### P4 — Decorative
- `palmtree-left.png`, `palmtree-right.png` equivalents
- Theme-specific decorative elements

### P5 — 9-Slice UI Kit (not on disk for any theme yet)
- Panels: wood, dark, leaf, glass variants
- Buttons: orange, green, purple, red (×3 states each)
- Icon button (×2 states)

### P6 — Icons + Particles
- 14 themed icons
- 4 particle textures per theme

### P7 — Audio
- 7 sound effects per theme (can share initially)
- 2-3 music tracks per theme (highest effort)

---

## Asset Count Summary

| Category | Per Theme | × 10 Themes | Existing (T1+T2) | Remaining |
|----------|-----------|-------------|-------------------|-----------|
| Block textures | 4 | 40 | 8 | 32 |
| Background + grid | 3 | 30 | 6 | 24 |
| UI chrome | 7 | 70 | 14 | 56 |
| Decorative | 2 | 20 | 4 | 16 |
| Bonus icons (art) | 3 | 30 | 6 | 24 |
| 9-slice panels | 4 | 40 | 0 | 40 |
| 9-slice buttons | 13 | 130 | 0 | 130 |
| Icons | 14 | 140 | 0 | 140 |
| Particles | 4 | 40 | 0 | 40 |
| Sound effects | 7 | 70 | 70 | 0 (unique: 56) |
| Music tracks | 4 | 40 | 40 | 0 (unique: 32) |
| **TOTAL** | **65** | **650** | **167** | **483** |

> Many icons and sound effects can be shared across themes, reducing actual unique assets needed significantly. Focus P0-P2 first for maximum visual variety.

---

## Color Reference (Procedural Fallbacks)

Colors are defined in `src/pixi/utils/colors.ts` via `ThemeColors` interface.

| Theme | Background | Grid BG | Accent | Block 1 | Block 2 | Block 3 | Block 4 |
|-------|-----------|---------|--------|---------|---------|---------|---------|
| Tiki | `#87CEEB` | `#5D4037` | `#FF8C00` | `#4ADE80` | `#4AA8DE` | `#9F7AEA` | `#FBBF24` |
| Cosmic | `#0B0D21` | `#12102A` | `#A29BFE` | `#00D2D3` | `#6C5CE7` | `#FD79A8` | `#FDCB6E` |
| Neon | `#0A0A1A` | `#0D0D22` | `#00FFFF` | `#00FF88` | `#00DDFF` | `#FF00FF` | `#FFFF00` |
| Ocean | `#0A2540` | `#0C2D4A` | `#00CED1` | `#00E5A0` | `#00B4D8` | `#FF6F91` | `#FFC947` |
| Forest | `#1A3A1A` | `#1E3E1E` | `#DAA520` | `#66BB6A` | `#42A5F5` | `#AB47BC` | `#FFCA28` |
| Desert | `#C2956B` | `#9E7E5A` | `#E07B39` | `#E07B39` | `#D4463B` | `#3D9970` | `#E8C547` |
| Arctic | `#D0E8F0` | `#A8C8D8` | `#40E0D0` | `#40E0D0` | `#5B9BD5` | `#B070D0` | `#F0C060` |
| Lava | `#1A0A0A` | `#1E0E0E` | `#FF6600` | `#FF6600` | `#FF2222` | `#FFAA00` | `#FF4488` |
| Candy | `#FFF0F5` | `#F0D0E0` | `#FF69B4` | `#7DCEA0` | `#85C1E9` | `#D7BDE2` | `#F9E154` |
| Steampunk | `#2A1F14` | `#30241A` | `#D4A017` | `#B87333` | `#C5A050` | `#6B8E23` | `#CC5544` |
