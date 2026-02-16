# zKube Mobile Client — Asset List & Generation Guide

Complete inventory of every visual and audio asset, with classification (global vs per-theme), Gemini AI generation prompts, and batch pipeline documentation.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Exists on disk |
| ❌ | Not on disk (needs creation) |
| 🔁 | Currently procedural (code-drawn fallback) |
| 🎨 | Per-theme (unique art per theme) |
| 🌐 | Global (shared across all themes) |

---

## Theme Reference (Source of Truth: `colors.ts`)

| ID | Name | Icon | Palette Summary | Background Mood |
|----|------|------|-----------------|-----------------|
| theme-1 | Tiki | 🌴 | Sky blue + warm wood + vibrant tropical greens | Tropical night seascape, tiki totems, moonlit beach |
| theme-2 | Cosmic | 🌌 | Deep indigo + nebula pink + star white | Synthwave alien landscape, cratered planets, neon rim-lighting |
| theme-3 | Easter Island | 🗿 | Dark navy + hot magenta + electric cyan | Mysterious stone moai, volcanic island, starlit ocean |
| theme-4 | Maya | 🏛️ | Deep teal + coral + turquoise | Ancient jungle temples, jade ruins, misty canopy |
| theme-5 | Cyberpunk | 💜 | Dark green + amber gold + moss brown | Dense forest clearing, golden light, ancient trees |
| theme-6 | Medieval | ⚔️ | Sand gold + terracotta + burnt orange | Stone castle courtyard, torchlit walls, iron gates |
| theme-7 | Ancient Egypt | 🏺 | Ice blue + frost white + turquoise | Golden pyramids at dusk, desert sands, hieroglyphs |
| theme-8 | Volcano | 🌋 | Obsidian black + molten orange + ember red | Volcanic forge, lava rivers, obsidian pillars |
| theme-9 | Tribal | 🪘 | Pastel pink + mint green + lavender | Earthy savanna, ritual grounds, painted stones |
| theme-10 | Arctic | ❄️ | Brass gold + copper brown + dark leather | Frozen tundra, ice crystals, aurora borealis |

---

## Artistic Direction

All generated assets must follow a **unified art style** to feel like one game, not 10 different games.

### Style Rules

| Rule | Description |
|------|-------------|
| **Medium** | Digital illustration, vector-like with clean hard edges — NOT pixel art, NOT photographic |
| **Outlines** | Bold black outlines (2-4px at 512px scale) on foreground elements |
| **Shading** | Cel-shading with 2-3 tonal steps per surface, limited gradients |
| **Palette** | Each theme uses 4-6 dominant colors from its `ThemeColors` definition |
| **Texture** | Subtle grain/stipple overlay for depth — never photorealistic noise |
| **Lighting** | Single light source per scene, strong contrast between lit and shadow areas |
| **Motifs** | Each theme has 2-3 recurring decorative motifs (see per-theme prompts below) |
| **NO** | No text, no logos, no people, no recognizable IP, no photorealism |

### Reference Style

Theme-1 (Tiki) and Theme-2 (Cosmic) establish the baseline:
- **Background** (1456×816): Illustrated landscape with layered silhouettes, atmospheric depth, decorative foreground elements
- **Blocks** (544×544 per cell): Emblem-style tile with bold black shapes, 2-3 color tones, subtle texture overlay
- **Logo** (500×500): Isometric cube with theme-specific face/motif, bold outlines, cel-shading
- **Grid frame** (380×460): Simple material-colored border panel
- **UI chrome** (360×40/64): Horizontal bars with subtle bevel/shadow

---

## Asset Classification

### Decision Framework

An asset is **🌐 Global** when:
- It serves a functional/UI purpose (navigation, indicators)
- Its appearance doesn't change the gameplay feel
- Users won't notice it's the same across themes

An asset is **🎨 Per-theme** when:
- It defines the theme's visual identity
- It's visible during core gameplay
- A generic version would break immersion

---

## 1. Blocks — 🎨 Per-Theme

Each block type has a distinct width (1-4 cells). These are the most-seen assets in the game.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Block1` | `block-1.png` | 544×544 | ✅ themes 1-2, ❌ themes 3-10 |
| `Block2` | `block-2.png` | 1088×544 | ✅ themes 1-2, ❌ themes 3-10 |
| `Block3` | `block-3.png` | 1632×544 | ✅ themes 1-2, ❌ themes 3-10 |
| `Block4` | `block-4.png` | 2176×544 | ✅ themes 1-2, ❌ themes 3-10 |

**Generation:** 4 assets × 8 themes = **32 images**

**Prompt template:**
```
Generate a game block tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}
The block is {WIDTH} cells wide and 1 cell tall (aspect ratio {WIDTH}:1).
Design: An emblem or decorative tile with the theme's motifs ({MOTIFS}).
Center the design. Transparent background. No text, no people.
```

**Per-theme motifs for blocks:**
| Theme | Block Motifs | Primary Block Colors |
|-------|-------------|----------------------|
| Easter Island | Stone moai faces, volcanic rock patterns | Neon green, cyan, magenta, yellow |
| Maya | Jade carvings, serpent glyphs, temple steps | Emerald, turquoise, coral, gold |
| Cyberpunk | Leaf veins, bark rings, moss patches | Soft green, sky blue, purple, amber |
| Medieval | Shield crests, iron rivets, stone bricks | Copper, crimson, forest green, gold |
| Ancient Egypt | Hieroglyphs, scarab beetles, lotus flowers | Turquoise, cobalt, lavender, sand gold |
| Volcano | Obsidian shards, lava cracks, ember glow | Molten orange, crimson, amber, hot pink |
| Tribal | Painted patterns, drum motifs, feather marks | Sage green, sky blue, lavender, sunflower |
| Arctic | Rusted gears, leather straps, brass fittings | Copper, brass gold, olive, rust red |

---

## 2. Background — 🎨 Per-Theme

The full-screen background defines the theme's atmosphere.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Background` | `background.png` | 1456×816 | ✅ themes 1-2, ❌ themes 3-10 |
| `LoadingBg` | `loading-bg.png` | 1456×816 | ✅ themes 1-2, ❌ themes 3-10 |

**Generation:** 2 assets × 8 themes = **16 images**

**Prompt template (background):**
```
Generate a full-screen background illustration for a mobile puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Scene: {SCENE_DESCRIPTION}
Style: Digital illustration with layered silhouettes, atmospheric depth, subtle grain texture.
Composition: Landscape orientation (16:9). Foreground decorative elements framing left and right edges.
Mood: {MOOD}. Rich, immersive, inviting.
Color palette: gradient from {GRADIENT_START} to {GRADIENT_END} with accent colors {ACCENTS}.
No text, no UI elements, no people, no recognizable characters.
```

**Per-theme scene descriptions:**
| Theme | Scene | Mood |
|-------|-------|------|
| Easter Island | Volcanic island at night, giant moai statues silhouetted against starry sky, bioluminescent tide pools | Mysterious, eerie |
| Maya | Deep jungle with ancient stepped temple in background, jade-green canopy, misty waterfalls | Adventurous, lush |
| Cyberpunk | Ancient forest clearing at golden hour, towering trees with moss, forest floor with ferns | Serene, enchanted |
| Medieval | Castle courtyard at sunset, stone walls with torches, distant towers, iron portcullis | Epic, warm |
| Ancient Egypt | Desert at twilight, golden pyramids with hieroglyph-covered obelisks, Nile river reflecting sky | Majestic, mystical |
| Volcano | Volcanic forge interior, rivers of lava flowing between obsidian platforms, ember-filled sky | Intense, dramatic |
| Tribal | Savanna at dawn, ritual stone circle, painted rocks, wildflowers, distant acacia trees | Earthy, spiritual |
| Arctic | Frozen tundra under aurora borealis, ice crystal formations, brass and copper mechanical structures half-buried in snow | Cold, wondrous |

---

## 3. Logo — 🎨 Per-Theme

The logo appears on the home screen. Theme-1 is a tiki cube, Theme-2 is a crystal diamond.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Logo` | `logo.png` | 500×500 | ✅ themes 1-2, ❌ themes 3-10 |

**Generation:** 1 asset × 8 themes = **8 images**

**Prompt template:**
```
Generate a game logo icon for a puzzle game called "zKube".
Theme: {THEME_NAME}
Design: An isometric cube or geometric shape with the theme's motifs on its visible faces.
Style: Bold black outlines, cel-shading, glossy highlights, centered on transparent background.
Motifs: {MOTIFS} carved/painted/etched on the cube faces.
Colors: {ACCENT_COLOR} as primary with {SECONDARY_COLORS} for shading.
Square format. No text, no letters, just the iconic shape.
```

---

## 4. Grid & Frame — 🎨 Per-Theme

The grid background and ornamental frame surround the play area.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `GridBg` | `grid-bg.png` | 320×400 | ✅ themes 1-2, ❌ themes 3-10 |
| `GridFrame` | `grid-frame.png` | 380×460 | ✅ themes 1-2, ❌ themes 3-10 |

**Generation:** 2 assets × 8 themes = **16 images**

**Prompt template (grid-bg):**
```
Generate a subtle background texture for a game grid area (8 columns × 10 rows).
Theme: {THEME_NAME}
Style: Muted, low-contrast surface material — {MATERIAL} texture.
Color: Base fill {GRID_BG_COLOR} with subtle {GRID_CELL_ALT_COLOR} variation.
Should read as a flat surface the blocks sit on. No grid lines (those are drawn in code).
Dimensions: 320×400px portrait rectangle. No transparency.
```

**Grid-bg materials per theme:**
| Theme | Material |
|-------|----------|
| Easter Island | Dark volcanic basalt with faint glow veins |
| Maya | Deep ocean-floor stone with turquoise tint |
| Cyberpunk | Dark mossy wood bark |
| Medieval | Weathered sandstone with grain |
| Ancient Egypt | Cool blue-grey slate |
| Volcano | Cracked obsidian with faint ember glow |
| Tribal | Rose-tinted clay with faint texture |
| Arctic | Dark worn leather with brass patina |

---

## 5. Decoratives — 🎨 Per-Theme

Flanking elements on left/right of the grid. High visual impact.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `DecoLeft` | `deco-left.png` | ~600×800 (output) | ✅ themes 1-2, ❌ themes 3-10 |
| `DecoRight` | `deco-right.png` | ~600×800 (output) | ✅ themes 1-2, ❌ themes 3-10 |

**Note:** Theme-1 originals are 3612×2995 — generate at 1024px and let the renderer scale.

**Generation:** 2 assets × 8 themes = **16 images**

**Prompt template:**
```
Generate a decorative side element for a mobile game screen.
Theme: {THEME_NAME}
Content: {DECO_DESCRIPTION}
Style: Silhouetted foreground element, partially transparent, dark tones with theme accent highlights.
Composition: Tall portrait format (3:4). Element anchored to {LEFT/RIGHT} edge, fading to transparency on opposite side.
PNG with transparency. No text, no people.
```

**Per-theme decoratives:**
| Theme | Left Deco | Right Deco |
|-------|-----------|------------|
| Easter Island | Moai statue silhouette | Volcanic rock formation |
| Maya | Jungle vine curtain | Stone serpent pillar |
| Cyberpunk | Ancient twisted tree | Mossy boulder with ferns |
| Medieval | Stone tower with torch | Shield and crossed swords rack |
| Ancient Egypt | Obelisk with hieroglyphs | Papyrus reeds and lotus |
| Volcano | Obsidian column with lava drips | Ember-wreathed rock arch |
| Tribal | Painted totem pole | Drum and feather arrangement |
| Arctic | Ice pillar with brass gears | Snow-covered mechanical crane |

---

## 6. UI Chrome — 🌐 Global

HUD bar, action bar, and bonus button background are small UI elements. They're barely visible behind text/icons. A single set works across all themes — the background and blocks carry the theme identity.

| Asset ID | Filename | Dimensions | Type | Status |
|----------|----------|------------|------|--------|
| `HudBar` | `hud-bar.png` | 360×40 | 🌐 | ✅ (theme-1 serves all) |
| `ActionBar` | `action-bar.png` | 360×64 | 🌐 | ✅ (theme-1 serves all) |
| `BonusBtnBg` | `bonus-btn-bg.png` | 64×64 | 🌐 | ✅ (theme-1 serves all) |

**Generation needed:** 0

---

## 7. Stars — 🌐 Global

Small rating icons. Functional, not thematic.

| Asset ID | Filename | Dimensions | Type | Status |
|----------|----------|------------|------|--------|
| `StarFilled` | `star-filled.png` | 24×24 | 🌐 | ✅ (theme-1 serves all) |
| `StarEmpty` | `star-empty.png` | 24×24 | 🌐 | ✅ (theme-1 serves all) |

**Generation needed:** 0

---

## 8. Bonus Icons — 🌐 Global

Game mechanics icons (Combo, Score, Harvest, Wave, Supply). These represent abilities, not themes.

| Asset ID | Filename | Dimensions | Type | Status |
|----------|----------|------------|------|--------|
| `BonusCombo` | `bonus/combo.png` | 256×256 | 🌐 | ✅ (theme-1 serves all) |
| `BonusScore` | `bonus/score.png` | 256×256 | 🌐 | ✅ (theme-1 serves all) |
| `BonusHarvest` | `bonus/harvest.png` | 256×256 | 🌐 | ✅ (theme-1 serves all) |
| `BonusWave` | `bonus/wave.svg` | vector | 🌐 | ✅ (theme-1 serves all) |
| `BonusSupply` | `bonus/supply.svg` | vector | 🌐 | ✅ (theme-1 serves all) |

**Generation needed:** 0

---

## 9. 9-Slice Panels — 🌐 Global (❌ ALL MISSING)

Used for modals, popups, card backgrounds. 9-slice means corners stay fixed, edges stretch.

| Asset ID | Filename | Borders | Type | Status |
|----------|----------|---------|------|--------|
| `PanelWood` | `panels/panel-wood.png` | 24px | 🌐 | ❌ |
| `PanelDark` | `panels/panel-dark.png` | 24px | 🌐 | ❌ |
| `PanelLeaf` | `panels/panel-leaf.png` | 24px | 🌐 | ❌ |
| `PanelGlass` | `panels/panel-glass.png` | 24px | 🌐 | ❌ |

**Specs:** 96×96px minimum. 24px border on each side = 48×48px stretchable center.

**Generation:** 4 images (global, one set)

**Prompt template:**
```
Generate a 9-slice panel texture for a game UI.
Material: {MATERIAL}
Style: {STYLE_DESCRIPTION}
The image is 96×96px. The outer 24px on all sides are the fixed border. The inner 48×48px center will stretch.
Design the border with decorative edges ({EDGE_STYLE}). Center should be a subtle, stretchable fill.
Square format. PNG with slight transparency on the center area.
```

| Panel | Material | Edge Style |
|-------|----------|------------|
| Wood | Warm brown wood planks | Carved wooden frame with nail studs |
| Dark | Dark slate/iron | Thin metallic border with rivets |
| Leaf | Green plant matter | Vine-wrapped edges with small leaves |
| Glass | Frosted glass | Thin bright border, translucent center (0.85 alpha) |

---

## 10. Buttons — 🌐 Global (NO GENERATION NEEDED)

**Buttons are 100% procedural** — drawn with PixiGraphics, no textures used. The `BtnOrange`, `BtnGreen`, `BtnPurple`, `BtnRed`, `BtnIcon` entries in the catalog are unused.

---

## 11. Icons — 🌐 Global (❌ ALL MISSING)

Replace emoji placeholders with proper game icons.

| Asset ID | Filename | Currently Using | Status |
|----------|----------|-----------------|--------|
| `IconStarFilled` | `icons/icon-star-filled.png` | ⭐ emoji | ❌ |
| `IconStarEmpty` | `icons/icon-star-empty.png` | ☆ emoji | ❌ |
| `IconCube` | `icons/icon-cube.png` | 🧊 emoji | ❌ |
| `IconCrown` | `icons/icon-crown.png` | 👑 | ❌ |
| `IconFire` | `icons/icon-fire.png` | 🔥 | ❌ |
| `IconScroll` | `icons/icon-scroll.png` | 📜 emoji | ❌ |
| `IconShop` | `icons/icon-shop.png` | 🛒 emoji | ❌ |
| `IconTrophy` | `icons/icon-trophy.png` | 🏆 emoji | ❌ |
| `IconMenu` | `icons/icon-menu.png` | ☰ text | ❌ |
| `IconClose` | `icons/icon-close.png` | ✕ text | ❌ |
| `IconSettings` | `icons/icon-settings.png` | ⚙ emoji | ❌ |
| `IconLock` | `icons/icon-lock.png` | 🔒 | ❌ |
| `IconMusic` | `icons/icon-music.png` | 🎵 | ❌ |
| `IconSound` | `icons/icon-sound.png` | 🔊 | ❌ |

**Specs:** 48×48px, white fill on transparent background (tinted in code).

**Generation:** 14 images (global)

**Prompt template:**
```
Generate a simple game UI icon: {ICON_DESCRIPTION}.
Style: Clean, bold, white silhouette on transparent background.
Think "iOS SF Symbols" or "Material Icons" but slightly stylized for a fantasy game.
48×48 pixels. Thick strokes (3-4px). Rounded corners.
Single shape, centered, no text, no color (white only).
```

---

## 12. Particles — 🌐 Global (❌ ALL MISSING)

Small textures tinted by code via `ThemeColors.particles`.

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `ParticleSpark` | `particles/particle-spark.png` | 🌐 | ❌ |
| `ParticleLeaf` | `particles/particle-leaf.png` | 🌐 | ❌ |
| `ParticleFlower` | `particles/particle-flower.png` | 🌐 | ❌ |
| `ParticleStar` | `particles/particle-star.png` | 🌐 | ❌ |

**Specs:** 16×16px, white on transparent (code tints them with theme colors).

**Generation:** 4 images (global)

---

## 13. Shared Icons (Existing ✅)

Already on disk at `public/assets/common/`:

| Asset | Path | Status |
|-------|------|--------|
| Moves icon | `common/icon-moves.png` | ✅ |
| Score icon | `common/icon-score.png` | ✅ |
| Cube icon | `common/icon-cube.png` | ✅ |
| Level icon | `common/icon-level.png` | ✅ |
| Surrender icon | `common/icon-surrender.png` | ✅ |

---

## 14. Miscellaneous (Existing ✅)

| Asset | Path | Status |
|-------|------|--------|
| Chest variants | `chests/c1.png` – `c10.png` | ✅ |
| Trophy bronze/silver/gold | `trophies/*.png` | ✅ |
| NFT images | `nft-zkube.png`, `nft-zkube-small.png` | ✅ |
| Lords token | `lords-token.png` | ✅ |

---

## 15. Sound Effects (All Complete ✅)

7 SFX × 10 themes = 70 files, all exist.

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `SfxBreak` | `sounds/effects/break.mp3` | Line cleared |
| `SfxExplode` | `sounds/effects/explode.mp3` | Multi-line combo |
| `SfxMove` | `sounds/effects/move.mp3` | Block moved |
| `SfxNew` | `sounds/effects/new.mp3` | New blocks spawned |
| `SfxStart` | `sounds/effects/start.mp3` | Game started |
| `SfxSwipe` | `sounds/effects/swipe.mp3` | Block swiped |
| `SfxOver` | `sounds/effects/over.mp3` | Game over |

**Note:** SFX are shared from theme-1 in code (`resolveSoundUrl` always returns theme-1 for SFX).

---

## 16. Music Tracks (All Complete ✅)

4 tracks × 10 themes = 40 files, all exist.

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `MusicMain` | `sounds/musics/main.mp3` | Home screen |
| `MusicMap` | `sounds/musics/map.mp3` | Progression map |
| `MusicLevel` | `sounds/musics/level.mp3` | Gameplay |
| `MusicBoss` | `sounds/musics/boss.mp3` | Boss levels |

---

## Generation Summary

### Per-Theme Assets (themes 3-10 = 8 themes)

| Category | Assets | Per Theme | Total |
|----------|--------|-----------|-------|
| Blocks | block-{1,2,3,4}.png | 4 | 32 |
| Background | background.png | 1 | 8 |
| Loading BG | loading-bg.png | 1 | 8 |
| Logo | logo.png | 1 | 8 |
| Grid BG | grid-bg.png | 1 | 8 |
| Grid Frame | grid-frame.png | 1 | 8 |
| Decoratives | deco-left.png, deco-right.png | 2 | 16 |
| **Subtotal** | | **11** | **88** |

### Global Assets (one set, all themes share)

| Category | Assets | Total |
|----------|--------|-------|
| Panels | panel-{wood,dark,leaf,glass}.png | 4 |
| Icons | icon-*.png | 14 |
| Particles | particle-*.png | 4 |
| **Subtotal** | | **22** |

### Grand Total: **110 images to generate**

### Estimated Cost & Time

| Tier | Rate | Time for 110 images | Cost |
|------|------|---------------------|------|
| Free | 15 RPM | ~8 minutes | $0 |
| Tier 1 | 300 RPM | ~25 seconds | ~$5.50 |

---

## Batch Generation Pipeline

### Prerequisites

```bash
npm install @google/genai p-limit
export GEMINI_API_KEY="your-key-here"
```

### Script Location

`scripts/generate-assets.ts`

### Usage

```bash
# Generate all missing per-theme assets
npx tsx scripts/generate-assets.ts --scope per-theme

# Generate all missing global assets
npx tsx scripts/generate-assets.ts --scope global

# Generate specific theme only
npx tsx scripts/generate-assets.ts --theme theme-3

# Generate specific asset type only
npx tsx scripts/generate-assets.ts --asset blocks

# Dry run (show what would be generated)
npx tsx scripts/generate-assets.ts --dry-run
```

### How It Works

1. Reads `THEME_META` and `ThemeColors` from `colors.ts`
2. Checks `public/assets/{themeId}/` for existing files
3. For each missing asset, builds a prompt from the templates above
4. Calls Gemini `gemini-2.5-flash-image` with `responseModalities: ["IMAGE"]`
5. Decodes base64 response and writes PNG to correct path
6. Rate-limits to stay within API quota (10 concurrent via `p-limit`)

### API Configuration

```typescript
const config = {
  model: "gemini-2.5-flash-image",
  responseModalities: ["IMAGE"],
  imageConfig: {
    aspectRatio: "1:1",   // or "16:9" for backgrounds
    imageSize: "2K"       // 2048px on longest side
  },
  temperature: 0.5,       // balance consistency vs variety
};
```

### Aspect Ratios by Asset Type

| Asset | Aspect Ratio | imageSize | Output ~Resolution |
|-------|--------------|-----------|--------------------|
| Blocks (1-cell) | 1:1 | 1K | 1024×1024 |
| Blocks (2-cell) | 2:3 (closest to 2:1) | 1K | ~682×1024 |
| Background | 16:9 | 2K | 2048×1152 |
| Logo | 1:1 | 1K | 1024×1024 |
| Grid BG | 4:5 | 1K | ~819×1024 |
| Grid Frame | 4:5 | 1K | ~819×1024 |
| Decoratives | 3:4 | 1K | ~768×1024 |
| Panels | 1:1 | 1K | 1024×1024 |
| Icons | 1:1 | 1K | 1024×1024 (downscale to 48px) |
| Particles | 1:1 | 1K | 1024×1024 (downscale to 16px) |

### Post-Processing

After generation, resize to target dimensions:
```bash
# Example: resize blocks to 544×544
magick block-1-raw.png -resize 544x544 block-1.png

# Example: resize icons to 48×48 with alpha
magick icon-raw.png -resize 48x48 -background none icon.png
```

---

## File Structure (Target State)

```
public/assets/
├── common/                               ✅ Existing
│   ├── icon-moves.png
│   ├── icon-score.png
│   ├── icon-cube.png
│   ├── icon-level.png
│   └── icon-surrender.png
│
├── icons/                                ❌ → Generate (🌐 global)
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
├── panels/                               ❌ → Generate (🌐 global)
│   ├── panel-wood.png
│   ├── panel-dark.png
│   ├── panel-leaf.png
│   └── panel-glass.png
│
├── particles/                            ❌ → Generate (🌐 global)
│   ├── particle-spark.png
│   ├── particle-leaf.png
│   ├── particle-flower.png
│   └── particle-star.png
│
├── theme-1/                              ✅ Complete
│   ├── block-{1-4}.png
│   ├── background.png, loading-bg.png
│   ├── grid-bg.png, grid-frame.png
│   ├── hud-bar.png, action-bar.png
│   ├── bonus-btn-bg.png
│   ├── star-filled.png, star-empty.png
│   ├── logo.png
│   ├── deco-left.png, deco-right.png
│   ├── bonus/{combo,score,harvest}.png
│   ├── bonus/{wave,supply}.svg
│   └── sounds/ ✅
│
├── theme-2/                              ✅ Complete (same structure)
│
├── theme-3/ through theme-10/            ⚠️ → Generate per-theme textures
│   ├── block-{1-4}.png                   ❌ → Generate
│   ├── background.png                    ❌ → Generate
│   ├── loading-bg.png                    ❌ → Generate
│   ├── logo.png                          ❌ → Generate
│   ├── grid-bg.png                       ❌ → Generate
│   ├── grid-frame.png                    ❌ → Generate
│   ├── deco-left.png                     ❌ → Generate
│   ├── deco-right.png                    ❌ → Generate
│   └── sounds/ ✅                        (already complete)
```

**Note:** `hud-bar`, `action-bar`, `bonus-btn-bg`, `star-*`, `bonus/*` are global — themes 3-10 will continue falling back to theme-1 for these via the resolver.
