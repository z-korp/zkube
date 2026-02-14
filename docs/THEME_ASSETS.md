# Theme Assets Reference

Complete inventory of assets needed per theme. Use this as a checklist when creating new theme art.

## Architecture

- **10 themes** defined: `theme-1` through `theme-10`
- **theme-1** (Tiki) and **theme-2** (Cosmic) have full art
- **theme-3 to theme-10** currently use theme-1 assets as placeholders via fallback
- All assets resolved through `mobile-app/src/pixi/assets/resolver.ts`
- Asset metadata defined in `mobile-app/src/pixi/assets/catalog.ts`
- Files stored in `mobile-app/public/assets/theme-{N}/`

## Fallback Behavior

When a theme's asset file is missing, the resolver falls back to `theme-1`.
Sounds always fall back to `theme-1` for themes that don't have their own audio.

## Theme List

| ID | Name | Icon | Status |
|----|------|------|--------|
| `theme-1` | Tiki | `🌴` | **Complete** |
| `theme-2` | Cosmic | `🌌` | **Complete** |
| `theme-3` | Neon | `💜` | Placeholder (uses theme-1) |
| `theme-4` | Ocean | `🌊` | Placeholder (uses theme-1) |
| `theme-5` | Forest | `🌿` | Placeholder (uses theme-1) |
| `theme-6` | Desert | `🏜️` | Placeholder (uses theme-1) |
| `theme-7` | Arctic | `❄️` | Placeholder (uses theme-1) |
| `theme-8` | Lava | `🌋` | Placeholder (uses theme-1) |
| `theme-9` | Candy | `🍬` | Placeholder (uses theme-1) |
| `theme-10` | Steampunk | `⚙️` | Placeholder (uses theme-1) |

## Required Assets Per Theme

Each theme directory (`public/assets/theme-{N}/`) needs the following files. All assets are optional; missing files fall back to theme-1.

### Essential (Bundle: `essential`)

These load first and are needed before gameplay starts.

| Asset ID | Filename | Description | Dimensions (reference) |
|----------|----------|-------------|----------------------|
| `Block1` | `block-1.png` | Block size 1 sprite | ~64x64 |
| `Block2` | `block-2.png` | Block size 2 sprite | ~128x64 |
| `Block3` | `block-3.png` | Block size 3 sprite | ~192x64 |
| `Block4` | `block-4.png` | Block size 4 sprite | ~256x64 |
| `GridBg` | `grid-bg.png` | Grid background texture | ~320x400 |
| `GridFrame` | `grid-frame.png` | Grid border/frame | ~340x420 |
| `Background` | `background.png` | Full-screen background image | ~1080x1920 |
| `LoadingBg` | `loading-bg.png` | Loading screen background | ~1080x1920 |
| `HudBar` | `hud-bar.png` | HUD bar background (9-slice) | ~400x48 |
| `ActionBar` | `action-bar.png` | Action bar background | ~400x64 |
| `Logo` | `logo.png` | Game logo | ~400x200 |

### Gameplay (Bundle: `gameplay`)

Loaded after essentials; needed for game interactions.

| Asset ID | Filename | Description | Dimensions (reference) |
|----------|----------|-------------|----------------------|
| `BonusBtnBg` | `bonus-btn-bg.png` | Bonus button background | ~64x64 |
| `StarFilled` | `star-filled.png` | Filled star (level rating) | ~32x32 |
| `StarEmpty` | `star-empty.png` | Empty star (level rating) | ~32x32 |
| `BonusCombo` | `bonus/hammer.png` | Combo bonus icon | ~64x64 |
| `BonusScore` | `bonus/tiki.png` | Score bonus icon | ~64x64 |
| `BonusHarvest` | `bonus/wave.png` | Harvest bonus icon | ~64x64 |
| `BonusWave` | `bonus/shrink.svg` | Wave bonus icon | SVG |
| `BonusSupply` | `bonus/shuffle.svg` | Supply bonus icon | SVG |

### UI (Bundle: `ui`)

Decorative and UI chrome elements.

| Asset ID | Filename | Description | Dimensions (reference) |
|----------|----------|-------------|----------------------|
| `DecoLeft` | `palmtree-left.png` | Left decoration (e.g. palm tree) | ~200x400 |
| `DecoRight` | `palmtree-right.png` | Right decoration | ~200x400 |
| `PanelWood` | `panels/panel-wood.png` | Wood panel (9-slice, 24px borders) | ~128x128 |
| `PanelDark` | `panels/panel-dark.png` | Dark panel (9-slice, 24px borders) | ~128x128 |
| `PanelLeaf` | `panels/panel-leaf.png` | Leaf panel (9-slice, 24px borders) | ~128x128 |
| `PanelGlass` | `panels/panel-glass.png` | Glass panel (9-slice, 24px borders) | ~128x128 |
| `BtnOrange` | `buttons/btn-orange.png` | Orange button (9-slice, 16px borders) | ~128x48 |
| `BtnGreen` | `buttons/btn-green.png` | Green button (9-slice, 16px borders) | ~128x48 |
| `BtnPurple` | `buttons/btn-purple.png` | Purple button (9-slice, 16px borders) | ~128x48 |
| `BtnRed` | `buttons/btn-red.png` | Red button (9-slice, 16px borders) | ~128x48 |
| `BtnIcon` | `buttons/btn-icon.png` | Icon-only button (9-slice, 12px borders) | ~48x48 |
| `IconStarFilled` | `icons/icon-star-filled.png` | Star filled icon | ~32x32 |
| `IconStarEmpty` | `icons/icon-star-empty.png` | Star empty icon | ~32x32 |
| `IconCube` | `icons/icon-cube.png` | Cube currency icon | ~32x32 |
| `IconCrown` | `icons/icon-crown.png` | Crown/rank icon | ~32x32 |
| `IconFire` | `icons/icon-fire.png` | Fire/combo icon | ~32x32 |
| `IconScroll` | `icons/icon-scroll.png` | Quest/scroll icon | ~32x32 |
| `IconShop` | `icons/icon-shop.png` | Shop icon | ~32x32 |
| `IconTrophy` | `icons/icon-trophy.png` | Trophy icon | ~32x32 |
| `IconMenu` | `icons/icon-menu.png` | Menu hamburger icon | ~32x32 |
| `IconClose` | `icons/icon-close.png` | Close/X icon | ~32x32 |
| `IconSettings` | `icons/icon-settings.png` | Settings gear icon | ~32x32 |
| `IconLock` | `icons/icon-lock.png` | Lock icon | ~32x32 |
| `IconMusic` | `icons/icon-music.png` | Music toggle icon | ~32x32 |
| `IconSound` | `icons/icon-sound.png` | Sound toggle icon | ~32x32 |

**Button state variants**: Each button also needs `-pressed` and `-disabled` variants:
- `buttons/btn-orange-pressed.png`, `buttons/btn-orange-disabled.png`
- Same pattern for green, purple, red, icon

### Effects (Bundle: `effects`)

Particle textures for visual effects.

| Asset ID | Filename | Description | Dimensions (reference) |
|----------|----------|-------------|----------------------|
| `ParticleSpark` | `particles/particle-spark.png` | Spark particle | ~16x16 |
| `ParticleLeaf` | `particles/particle-leaf.png` | Leaf particle | ~16x16 |
| `ParticleFlower` | `particles/particle-flower.png` | Flower particle | ~16x16 |
| `ParticleStar` | `particles/particle-star.png` | Star particle | ~16x16 |

### Audio (Bundle: `audio`)

Sound effects and music tracks.

| Asset ID | Filename | Description |
|----------|----------|-------------|
| `SfxBreak` | `sounds/effects/break.mp3` | Line break sound |
| `SfxExplode` | `sounds/effects/explode.mp3` | Explosion sound |
| `SfxMove` | `sounds/effects/move.mp3` | Block move sound |
| `SfxNew` | `sounds/effects/new.mp3` | New line spawn sound |
| `SfxStart` | `sounds/effects/start.mp3` | Game start sound |
| `SfxSwipe` | `sounds/effects/swipe.mp3` | Swipe gesture sound |
| `SfxOver` | `sounds/effects/over.mp3` | Game over sound |
| `Music1` | `sounds/musics/theme-jungle.mp3` | Background music track 1 |
| `Music2` | `sounds/musics/theme-jungle2.mp3` | Background music track 2 |
| `Music3` | `sounds/musics/theme-jungle3.mp3` | Background music track 3 |
| `MusicIntro` | `sounds/musics/intro.mp3` | Intro/menu music |

### Shared Assets (Theme-Independent)

These live at `public/assets/` root and are the same across all themes:

| Path | Description |
|------|-------------|
| `icon-moves.png` | Moves counter icon |
| `icon-score.png` | Score counter icon |
| `icon-cube.png` | Cube currency icon (HUD) |
| `icon-level.png` | Level indicator icon |
| `icon-surrender.png` | Surrender button icon |

## Directory Structure Template

```
public/assets/theme-{N}/
├── background.png
├── loading-bg.png
├── logo.png
├── grid-bg.png
├── grid-frame.png
├── hud-bar.png
├── action-bar.png
├── bonus-btn-bg.png
├── star-filled.png
├── star-empty.png
├── block-1.png
├── block-2.png
├── block-3.png
├── block-4.png
├── palmtree-left.png
├── palmtree-right.png
├── bonus/
│   ├── hammer.png
│   ├── tiki.png
│   ├── wave.png
│   ├── shrink.svg
│   └── shuffle.svg
├── panels/
│   ├── panel-wood.png
│   ├── panel-dark.png
│   ├── panel-leaf.png
│   └── panel-glass.png
├── buttons/
│   ├── btn-orange.png
│   ├── btn-orange-pressed.png
│   ├── btn-orange-disabled.png
│   ├── btn-green.png
│   ├── btn-green-pressed.png
│   ├── btn-green-disabled.png
│   ├── btn-purple.png
│   ├── btn-purple-pressed.png
│   ├── btn-purple-disabled.png
│   ├── btn-red.png
│   ├── btn-red-pressed.png
│   ├── btn-red-disabled.png
│   ├── btn-icon.png
│   ├── btn-icon-pressed.png
│   └── btn-icon-disabled.png
├── icons/
│   ├── icon-star-filled.png
│   ├── icon-star-empty.png
│   ├── icon-cube.png
│   ├── icon-crown.png
│   ├── icon-fire.png
│   ├── icon-scroll.png
│   ├── icon-shop.png
│   ├── icon-trophy.png
│   ├── icon-menu.png
│   ├── icon-close.png
│   ├── icon-settings.png
│   ├── icon-lock.png
│   ├── icon-music.png
│   └── icon-sound.png
├── particles/
│   ├── particle-spark.png
│   ├── particle-leaf.png
│   ├── particle-flower.png
│   └── particle-star.png
└── sounds/
    ├── effects/
    │   ├── break.mp3
    │   ├── explode.mp3
    │   ├── move.mp3
    │   ├── new.mp3
    │   ├── start.mp3
    │   ├── swipe.mp3
    │   └── over.mp3
    └── musics/
        ├── theme-jungle.mp3
        ├── theme-jungle2.mp3
        ├── theme-jungle3.mp3
        └── intro.mp3
```

## Total Asset Count Per Theme

| Category | Count |
|----------|-------|
| Essential textures | 11 |
| Gameplay textures | 8 |
| UI textures (panels, buttons, icons) | 25 + 15 button variants = 40 |
| Particles | 4 |
| Sound effects | 7 |
| Music tracks | 4 |
| **Total** | **74 files** |

## Current Status

### theme-1 (Tiki) - COMPLETE (essentials + gameplay)
- All essential + gameplay textures present
- Bonus icons present
- Sound effects and music present
- Missing: panels/, buttons/, icons/, particles/ subdirectories (not yet created)

### theme-2 (Cosmic) - COMPLETE (essentials + gameplay)
- Same coverage as theme-1
- Has unique art for all essentials and gameplay assets
- Missing: panels/, buttons/, icons/, particles/ subdirectories (not yet created)

### theme-3 to theme-10 - PLACEHOLDER
- Sound effects and music present (copies of theme-1 audio)
- All visual assets fall back to theme-1 via resolver
- Need unique art for: everything in the Essential and Gameplay sections above

## 9-Slice Borders Reference

For panels and buttons that use 9-slice rendering:

| Asset Type | Left | Top | Right | Bottom |
|------------|------|-----|-------|--------|
| Panels | 24px | 24px | 24px | 24px |
| Buttons | 16px | 16px | 16px | 16px |
| Icon buttons | 12px | 12px | 12px | 12px |

## Color Palettes

Each theme has a full color palette defined in `mobile-app/src/pixi/utils/colors.ts`. These are used for procedural rendering when texture assets are not available. Key colors per theme:

| Theme | Background | Grid | Accent | Block 1 | Block 2 | Block 3 | Block 4 |
|-------|-----------|------|--------|---------|---------|---------|---------|
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

Use these palettes as guidance when creating theme-specific art.
