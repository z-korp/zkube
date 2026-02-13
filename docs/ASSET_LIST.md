# zKube Mobile Client — Asset List

Complete inventory of every visual and audio asset needed for the mobile client. Assets are organized by category, with clear indicators for **what exists**, **what's missing**, and **what's common vs theme-specific**.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Exists on disk for themes 1-2 |
| ⚠️ | Exists but only for some themes |
| ❌ | Not on disk (needs creation) |
| 🔁 | Currently procedural (code-drawn fallback) |
| 🎨 | Theme-specific (one per theme) |
| 🌐 | Common (shared across all themes) |

---

## 1. Fonts

| Asset | File | Type | Status |
|-------|------|------|--------|
| Title font | `public/fonts/FrederickatheGreat-Regular.ttf` | 🌐 | ✅ |
| Body/Bold font | System Arial / Arial Black | 🌐 | ✅ (system) |

**Font stack used:**
- `FONT_TITLE` = `Fredericka the Great, Bangers, Arial Black, sans-serif`
- `FONT_BOLD` = `Arial Black, Arial Bold, Arial, sans-serif`
- `FONT_BODY` = `Arial, Helvetica, sans-serif`

**Suggestion:** Consider adding **Bangers** (Google Fonts, free) as a TTF — it's in the fallback chain but not on disk. A custom pixel/game font for body text would also strengthen the visual identity.

---

## 2. Blocks (Gameplay Core)

Each block type has a distinct width (1-4 cells). Needs unique art per theme.

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `Block1` | `block-1.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `Block2` | `block-2.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `Block3` | `block-3.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `Block4` | `block-4.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |

**Specs:** ~64×64px per cell, PNG with transparency. Block 2 = 2 cells wide, Block 3 = 3, Block 4 = 4.

**Per theme:** 4 textures × 10 themes = **40 total** (8 exist, 32 needed)

---

## 3. Grid & Play Area

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `GridBg` | `grid-bg.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `GridFrame` | `grid-frame.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |

**Specs:**
- `grid-bg.png` — 8×10 cell grid background texture, ~320×400px
- `grid-frame.png` — Ornamental frame around the grid, ~360×440px

**Per theme:** 2 textures × 10 themes = **20 total** (4 exist, 16 needed)

---

## 4. Backgrounds

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `Background` | `theme-2-1.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `LoadingBg` | `loading-bg.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |

**Specs:**
- `background` — Full-screen background for gameplay (~750×1334px or larger, will be scaled)
- `loading-bg` — Loading/splash screen background (same dimensions)

**Per theme:** 2 textures × 10 themes = **20 total** (4 exist, 16 needed)

**Suggestion:** Also add a dedicated **map background** texture per theme for the progression map zones. Currently zones use a procedural gradient. A tileable or tall strip texture per theme would look much better.

---

## 5. UI Chrome (HUD, Action Bar)

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `HudBar` | `hud-bar.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `ActionBar` | `action-bar.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `BonusBtnBg` | `bonus-btn-bg.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `StarFilled` | `star-filled.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `StarEmpty` | `star-empty.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `Logo` | `logo.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |

**Specs:**
- `hud-bar` — Top bar background strip (~750×60px)
- `action-bar` — Bottom action bar background (~750×80px)
- `bonus-btn-bg` — Background for bonus buttons (~64×64px)
- `star-filled/empty` — Star rating icons (~32×32px)
- `logo` — zKube logo (variable size, ~300×120px)

**Per theme:** 6 textures × 10 themes = **60 total** (12 exist, 48 needed)

---

## 6. Decorative Elements

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `DecoLeft` | `palmtree-left.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |
| `DecoRight` | `palmtree-right.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 |

**Specs:** Decorative elements flanking the grid (~100×300px each, PNG with transparency)

**Per theme:** 2 textures × 10 themes = **20 total** (4 exist, 16 needed)

**Note:** For non-Tiki themes these shouldn't be palm trees. Per-theme decoratives:
- Tiki: palm trees 🌴
- Cosmic: asteroids / space debris
- Neon: neon pillars / light bars
- Ocean: coral / kelp
- Forest: trees / vines
- Desert: cacti / sand pillars
- Arctic: ice pillars / snowflakes
- Lava: obsidian columns / lava drips
- Candy: candy canes / lollipops
- Steampunk: gear towers / pipes

---

## 7. Bonus Icons

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `BonusCombo` | `bonus/hammer.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 (TODO: new art) |
| `BonusScore` | `bonus/tiki.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 (TODO: new art) |
| `BonusHarvest` | `bonus/wave.png` | 🎨 | ✅ themes 1-2, 🔁 themes 3-10 (TODO: new art) |
| `BonusWave` | `bonus/shrink.svg` | 🎨 | ✅ themes 1-2 only (TODO: new art) |
| `BonusSupply` | `bonus/shuffle.svg` | 🎨 | ✅ themes 1-2 only (TODO: new art) |

**Specs:** ~48×48px, PNG (or SVG). Represent the 5 bonus abilities.

**Per theme:** 5 textures × 10 themes = **50 total** (10 exist, 40 needed)

---

## 8. 9-Slice Panels ❌ ALL MISSING

Used for modals, popups, card backgrounds. 9-slice means the image is split into a 3×3 grid and stretched — corners stay fixed, edges stretch.

| Asset ID | Filename | Borders | Type | Status |
|----------|----------|---------|------|--------|
| `PanelWood` | `panels/panel-wood.png` | 24px | 🎨 | ❌ |
| `PanelDark` | `panels/panel-dark.png` | 24px | 🎨 | ❌ |
| `PanelLeaf` | `panels/panel-leaf.png` | 24px | 🎨 | ❌ |
| `PanelGlass` | `panels/panel-glass.png` | 24px | 🎨 | ❌ |

**Specs:** ~96×96px minimum (24px border on each side). PNG with semi-transparent center area.

**Per theme:** 4 textures × 10 themes = **40 total** (0 exist, 40 needed)

**Suggestion:** Start with 2 panels (`panel-dark` and `panel-wood`) — they cover most use cases. `panel-glass` for overlays, `panel-leaf` for nature themes.

---

## 9. 9-Slice Buttons ❌ ALL MISSING

Each button has 3 states: normal, pressed, disabled.

| Asset ID | Filename | Borders | Type | Status |
|----------|----------|---------|------|--------|
| `BtnOrange` | `buttons/btn-orange.png` | 16px | 🌐 | ❌ |
| `BtnOrange` (pressed) | `buttons/btn-orange-pressed.png` | 16px | 🌐 | ❌ |
| `BtnOrange` (disabled) | `buttons/btn-orange-disabled.png` | 16px | 🌐 | ❌ |
| `BtnGreen` | `buttons/btn-green.png` | 16px | 🌐 | ❌ |
| `BtnGreen` (pressed) | `buttons/btn-green-pressed.png` | 16px | 🌐 | ❌ |
| `BtnGreen` (disabled) | `buttons/btn-green-disabled.png` | 16px | 🌐 | ❌ |
| `BtnPurple` | `buttons/btn-purple.png` | 16px | 🌐 | ❌ |
| `BtnPurple` (pressed) | `buttons/btn-purple-pressed.png` | 16px | 🌐 | ❌ |
| `BtnPurple` (disabled) | `buttons/btn-purple-disabled.png` | 16px | 🌐 | ❌ |
| `BtnRed` | `buttons/btn-red.png` | 16px | 🌐 | ❌ |
| `BtnRed` (pressed) | `buttons/btn-red-pressed.png` | 16px | 🌐 | ❌ |
| `BtnRed` (disabled) | `buttons/btn-red-disabled.png` | 16px | 🌐 | ❌ |
| `BtnIcon` | `buttons/btn-icon.png` | 12px | 🌐 | ❌ |
| `BtnIcon` (pressed) | `buttons/btn-icon-pressed.png` | 12px | 🌐 | ❌ |
| `BtnIcon` (disabled) | `buttons/btn-icon-disabled.png` | 12px | 🌐 | ❌ |

**Specs:** ~64×64px minimum (16px border). Rounded rect style. 3 states per color variant.

**Total:** 15 textures (can be common across themes, or theme-specific if desired)

**Suggestion:** Make buttons common (🌐) — they provide visual consistency. Theme-specific panels are more impactful.

---

## 10. Icons ❌ ALL MISSING

Replace emoji placeholders with proper pixel-art or vector icons.

| Asset ID | Filename | Currently Using | Type | Status |
|----------|----------|-----------------|------|--------|
| `IconStarFilled` | `icons/icon-star-filled.png` | ⭐ emoji | 🌐 | ❌ |
| `IconStarEmpty` | `icons/icon-star-empty.png` | ☆ emoji | 🌐 | ❌ |
| `IconCube` | `icons/icon-cube.png` | 🧊 emoji | 🌐 | ❌ |
| `IconCrown` | `icons/icon-crown.png` | 👑 (not used yet) | 🌐 | ❌ |
| `IconFire` | `icons/icon-fire.png` | 🔥 (not used yet) | 🌐 | ❌ |
| `IconScroll` | `icons/icon-scroll.png` | 📜 emoji | 🌐 | ❌ |
| `IconShop` | `icons/icon-shop.png` | 🛒 emoji | 🌐 | ❌ |
| `IconTrophy` | `icons/icon-trophy.png` | 🏆 emoji | 🌐 | ❌ |
| `IconMenu` | `icons/icon-menu.png` | ☰ (text) | 🌐 | ❌ |
| `IconClose` | `icons/icon-close.png` | ✕ (text) | 🌐 | ❌ |
| `IconSettings` | `icons/icon-settings.png` | ⚙ emoji | 🌐 | ❌ |
| `IconLock` | `icons/icon-lock.png` | 🔒 (not used yet) | 🌐 | ❌ |
| `IconMusic` | `icons/icon-music.png` | 🎵 (not used yet) | 🌐 | ❌ |
| `IconSound` | `icons/icon-sound.png` | 🔊 (not used yet) | 🌐 | ❌ |

**Specs:** 32×32px or 48×48px, PNG with transparency, white or light-colored (tinted in code).

**Total:** 14 textures (common)

**Additional icons needed for the map & pages (not yet in catalog):**
- `icon-back-arrow` — ← back navigation
- `icon-play` — ▶ play button
- `icon-checkmark` — ✓ completed indicator
- `icon-boss` — ★ boss level marker
- `icon-tutorial` — 📖 tutorial
- `icon-leaderboard` — leaderboard icon

---

## 11. Particles ❌ ALL MISSING

Small textures used by the particle system for effects.

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `ParticleSpark` | `particles/particle-spark.png` | 🌐 | ❌ |
| `ParticleLeaf` | `particles/particle-leaf.png` | 🎨 | ❌ |
| `ParticleFlower` | `particles/particle-flower.png` | 🎨 | ❌ |
| `ParticleStar` | `particles/particle-star.png` | 🌐 | ❌ |

**Specs:** 8×8px to 16×16px, PNG with transparency, white/bright colors (tinted in code).

**Note:** Currently particles are drawn as colored rectangles. Textured particles would look significantly better.

**Suggestion:** `particle-spark` and `particle-star` should be common. `particle-leaf` and `particle-flower` could be theme-specific (leaf for Forest, flower for Candy, ember for Lava, snowflake for Arctic, etc.)

---

## 12. Shared (Theme-Independent) Icons

These exist on disk at `public/assets/` root level:

| Asset | Path | Status |
|-------|------|--------|
| Moves icon | `/assets/icon-moves.png` | ✅ |
| Score icon | `/assets/icon-score.png` | ✅ |
| Cube icon | `/assets/icon-cube.png` | ✅ |
| Level icon | `/assets/icon-level.png` | ✅ |
| Surrender icon | `/assets/icon-surrender.png` | ✅ |

---

## 13. Miscellaneous Textures (Existing)

| Asset | Path | Type | Status |
|-------|------|------|--------|
| Chest variants | `/assets/chests/c1.png` - `c10.png` | 🌐 | ✅ (10 files) |
| Trophy bronze | `/assets/trophies/bronze.png` | 🌐 | ✅ |
| Trophy silver | `/assets/trophies/silver.png` | 🌐 | ✅ |
| Trophy gold | `/assets/trophies/gold.png` | 🌐 | ✅ |
| NFT image | `/assets/nft-zkube.png` | 🌐 | ✅ |
| NFT small | `/assets/nft-zkube-small.png` | 🌐 | ✅ |
| Lords token | `/assets/lords-token.png` | 🌐 | ✅ |
| Loader spinner | `/assets/loader.svg` | 🌐 | ✅ |

---

## 14. Sound Effects (SFX)

All 7 SFX exist for **all 10 themes** ✅

| Asset ID | Filename | When Played | Type |
|----------|----------|-------------|------|
| `SfxBreak` | `sounds/effects/break.mp3` | Line cleared | 🎨 |
| `SfxExplode` | `sounds/effects/explode.mp3` | Multi-line combo | 🎨 |
| `SfxMove` | `sounds/effects/move.mp3` | Block moved | 🎨 |
| `SfxNew` | `sounds/effects/new.mp3` | New blocks spawned | 🎨 |
| `SfxStart` | `sounds/effects/start.mp3` | Game/level started | 🎨 |
| `SfxSwipe` | `sounds/effects/swipe.mp3` | Block swiped | 🎨 |
| `SfxOver` | `sounds/effects/over.mp3` | Game over | 🎨 |

**Path pattern:** `public/assets/{themeId}/sounds/effects/{name}.mp3`

**Total:** 7 × 10 = 70 files (all exist ✅)

**Missing SFX (not in catalog yet, recommended additions):**
- `sfx-bonus` — Bonus ability activated
- `sfx-level-complete` — Level cleared
- `sfx-boss-intro` — Boss level entrance
- `sfx-shop-purchase` — Shop item bought
- `sfx-map-node-tap` — Tapping a map node
- `sfx-ui-tap` — Generic UI button tap
- `sfx-achievement` — Achievement unlocked

---

## 15. Music Tracks

All 4 tracks exist for **all 10 themes** ✅

| Asset ID | Filename | When Played | Type |
|----------|----------|-------------|------|
| `Music1` | `sounds/musics/theme-jungle.mp3` | Gameplay track 1 | 🎨 |
| `Music2` | `sounds/musics/theme-jungle2.mp3` | Menu / Home | 🎨 |
| `Music3` | `sounds/musics/theme-jungle3.mp3` | Gameplay track 2 | 🎨 |
| `MusicIntro` | `sounds/musics/intro.mp3` | Loading / Title | 🎨 |

**Path pattern:** `public/assets/{themeId}/sounds/musics/{name}.mp3`

**Total:** 4 × 10 = 40 files (all exist ✅)

**Missing music (recommended additions):**
- `music-boss` — Boss level tension music
- `music-map` — Map screen ambient/exploration music
- `music-shop` — Shop screen chill music
- `music-victory` — Victory fanfare (short, ~5s)

---

## 16. Progression Map Assets (NEW — Not in Catalog Yet)

The progression map currently uses procedural rendering for everything. These assets would elevate it:

### Common (🌐)
| Asset | Suggested Filename | Specs | Priority |
|-------|--------------------|-------|----------|
| Map node (classic) | `map/node-classic.png` | 48×48px, circular | Medium |
| Map node (boss) | `map/node-boss.png` | 64×64px, larger + ornate | Medium |
| Map node (shop) | `map/node-shop.png` | 56×48px, bag/shop shape | Medium |
| Node cleared overlay | `map/node-cleared.png` | 48×48px, checkmark/glow | Low |
| Node locked overlay | `map/node-locked.png` | 48×48px, lock/chain | Low |
| Path segment | `map/path-segment.png` | 16×16px tileable | Low |
| Zone divider | `map/zone-divider.png` | 750×4px, decorative line | Low |

### Theme-Specific (🎨)
| Asset | Suggested Filename | Specs | Priority |
|-------|--------------------|-------|----------|
| Zone background | `map/zone-bg.png` | 750×800px, tileable vertically | High |
| Zone banner | `map/zone-banner.png` | 200×60px, zone title frame | Medium |
| Zone decoratives | `map/zone-deco-left.png` / `zone-deco-right.png` | ~80×200px | Low |

---

## 17. PWA / App Icons (Existing ✅)

| Asset | Path | Status |
|-------|------|--------|
| Apple icon 180 | `/assets/apple-icon-180.png` | ✅ |
| PWA 192 | `/assets/pwa-192x192.png` | ✅ |
| PWA 512 | `/assets/pwa-512x512.png` | ✅ |
| PWA maskable 192 | `/assets/pwa-maskable-192x192.png` | ✅ |
| PWA maskable 512 | `/assets/pwa-maskable-512x512.png` | ✅ |

---

## Summary: Production Priority

### Tier 1 — Ship Blockers (currently showing as broken/placeholder)
| Category | Count | Common/Theme |
|----------|-------|--------------|
| Buttons (9-slice, 3 states each) | 15 | Common |
| Icons | 14+6 = 20 | Common |
| Panels (9-slice) | 4 | Common or 2 variants |

### Tier 2 — Visual Quality (procedural fallback works but looks basic)
| Category | Count | Common/Theme |
|----------|-------|--------------|
| Blocks (themes 3-10) | 32 | Per-theme |
| Grid bg+frame (themes 3-10) | 16 | Per-theme |
| Backgrounds (themes 3-10) | 16 | Per-theme |
| HUD/ActionBar (themes 3-10) | 40 | Per-theme |
| Bonus icons (themes 3-10) | 40 | Per-theme |
| Decoratives (themes 3-10) | 16 | Per-theme |
| Particles | 4 | Common + per-theme |

### Tier 3 — Polish (nice to have)
| Category | Count | Common/Theme |
|----------|-------|--------------|
| Map node textures | 7 | Common |
| Map zone backgrounds | 10 | Per-theme |
| Additional SFX | 7 | Per-theme or common |
| Additional music | 4 | Per-theme |
| Bangers font | 1 | Common |

---

## File Structure

```
public/assets/
├── fonts/
│   └── FrederickatheGreat-Regular.ttf    ✅
├── icon-moves.png                        ✅ (shared)
├── icon-score.png                        ✅
├── icon-cube.png                         ✅
├── icon-level.png                        ✅
├── icon-surrender.png                    ✅
├── chests/c1-c10.png                     ✅
├── trophies/{bronze,silver,gold}.png     ✅
│
├── icons/                                ❌ ALL MISSING (common)
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
│
├── buttons/                              ❌ ALL MISSING (common)
│   ├── btn-orange.png / -pressed / -disabled
│   ├── btn-green.png / -pressed / -disabled
│   ├── btn-purple.png / -pressed / -disabled
│   ├── btn-red.png / -pressed / -disabled
│   └── btn-icon.png / -pressed / -disabled
│
├── particles/                            ❌ ALL MISSING
│   ├── particle-spark.png
│   ├── particle-leaf.png
│   ├── particle-flower.png
│   └── particle-star.png
│
├── map/                                  ❌ ALL MISSING (new)
│   ├── node-classic.png
│   ├── node-boss.png
│   ├── node-shop.png
│   ├── node-cleared.png
│   ├── node-locked.png
│   └── zone-divider.png
│
├── theme-1/                              ✅ COMPLETE
│   ├── block-{1-4}.png
│   ├── grid-bg.png, grid-frame.png
│   ├── hud-bar.png, action-bar.png
│   ├── bonus-btn-bg.png
│   ├── star-filled.png, star-empty.png
│   ├── logo.png, loading-bg.png
│   ├── palmtree-left.png, palmtree-right.png
│   ├── theme-2-1.png (background)
│   ├── bonus/{hammer,wave,tiki,shrink,shuffle}
│   ├── panels/                           ❌ MISSING
│   ├── map/zone-bg.png                   ❌ MISSING (new)
│   └── sounds/                           ✅ COMPLETE
│       ├── effects/{break,explode,move,new,start,swipe,over}.mp3
│       └── musics/{intro,theme-jungle,theme-jungle2,theme-jungle3}.mp3
│
├── theme-2/                              ✅ COMPLETE (same as theme-1)
│   └── ...
│
├── theme-3/ through theme-10/            ⚠️ SOUNDS ONLY
│   └── sounds/                           ✅ COMPLETE
│       ├── effects/...
│       └── musics/...
│   (NO texture files — rendered procedurally)
```

---

## Theme Reference

| ID | Name | Icon | Color Palette Summary |
|----|------|------|----------------------|
| theme-1 | Tiki | 🌴 | Sky blue + warm wood + vibrant tropical |
| theme-2 | Cosmic | 🌌 | Deep purple + nebula pink + star white |
| theme-3 | Neon | 💜 | Dark navy + hot pink + electric cyan |
| theme-4 | Ocean | 🌊 | Deep teal + coral orange + foam white |
| theme-5 | Forest | 🌿 | Dark green + amber gold + moss brown |
| theme-6 | Desert | 🏜️ | Sand gold + terracotta + burnt orange |
| theme-7 | Arctic | ❄️ | Ice blue + frost white + aurora green |
| theme-8 | Lava | 🌋 | Obsidian black + molten orange + ember red |
| theme-9 | Candy | 🍬 | Pastel pink + mint green + lavender |
| theme-10 | Steampunk | ⚙️ | Brass gold + copper brown + dark leather |
