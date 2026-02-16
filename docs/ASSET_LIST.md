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

## Chromakey Green Transparency Pipeline

### Why Chromakey Green?

**Gemini cannot generate native transparent PNGs.** All image generation models output solid backgrounds. To work around this limitation, we use a chromakey green (#00FF00) background and strip it in post-processing.

### Model Details

- **Model:** `gemini-3-pro-image-preview` (codename "Nano Banana Pro")
- **Max Resolution:** 2048×2048
- **Aspect Ratios:** 1:1, 16:9, 9:16, 4:3, 3:4
- **Output Format:** Always JPEG (even if PNG requested)

### Assets Requiring Transparency

- **Blocks** (block-1.png through block-4.png)
- **Logo** (logo.png)
- **Grid Frame** (grid-frame.png)
- **Icons** (all icon-*.png files)
- **Particles** (all particle-*.png files)
- **Panels** (all panel-*.png files)

### Assets That Are Opaque

- **Background** (background.png)
- **Loading Background** (loading-bg.png)
- **Grid Background** (grid-bg.png)
- **Map** (map.png)

### Post-Processing Steps

All generated assets go through a 3-step pipeline:

1. **JPEG → PNG Conversion**
   - Gemini always returns JPEG, convert to PNG format

2. **Green Stripping** (transparency assets only)
   - Detect chromakey green pixels using HSV color space
   - Algorithm: If `G > 100 AND R < 200 AND B < 200 AND G > R*1.3 AND G > B*1.3` → set alpha to 0
   - Preserves non-green colors while removing background

3. **Resize to Target Dimensions**
   - Scale from generation resolution (typically 1024px or 2048px) to final asset size
   - Maintain aspect ratio and quality

### Prompt Template Modification

For transparency assets, prompts must specify:
```
Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
```

For opaque assets, prompts specify the actual background color/gradient.

---

## 1. Blocks — 🎨 Per-Theme

Each block type has a distinct width (1-4 cells). These are the most-seen assets in the game.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Block1` | `block-1.png` | 544×544 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |
| `Block2` | `block-2.png` | 1088×544 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |
| `Block3` | `block-3.png` | 1632×544 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |
| `Block4` | `block-4.png` | 2176×544 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |

**Generation:** 4 assets × 7 themes (3,5-10) = **28 images**

**Prompt template:**
```
Generate a game block tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}
The block is {WIDTH} cells wide and 1 cell tall (aspect ratio {WIDTH}:1).
Design: An emblem or decorative tile with the theme's motifs ({MOTIFS}).
Center the design. Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
No text, no people.
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
| `Background` | `background.png` | 1456×816 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |
| `LoadingBg` | `loading-bg.png` | 1456×816 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |

**Generation:** 2 assets × 7 themes (3,5-10) = **14 images**

**Prompt template (background):**
```
Generate a full-screen background illustration for a mobile puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Scene: {SCENE_DESCRIPTION}
Style: Digital illustration with layered silhouettes, atmospheric depth, subtle grain texture.
Composition: Landscape orientation (16:9). Foreground decorative elements framing left and right edges.
Mood: {MOOD}. Rich, immersive, inviting.
Color palette: gradient from {GRADIENT_START} to {GRADIENT_END} with accent colors {ACCENTS}.
Background: Full opaque fill (no transparency needed).
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
| `Logo` | `logo.png` | 500×500 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |

**Generation:** 1 asset × 7 themes (3,5-10) = **7 images**

**Prompt template:**
```
Generate a game logo icon for a puzzle game called "zKube".
Theme: {THEME_NAME}
Design: An isometric cube or geometric shape with the theme's motifs on its visible faces.
Style: Bold black outlines, cel-shading, glossy highlights, centered.
Motifs: {MOTIFS} carved/painted/etched on the cube faces.
Colors: {ACCENT_COLOR} as primary with {SECONDARY_COLORS} for shading.
Square format. Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
No text, no letters, just the iconic shape.
```

---

## 4. Grid & Frame — 🎨 Per-Theme

The grid background and ornamental frame surround the play area.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `GridBg` | `grid-bg.png` | 320×400 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |
| `GridFrame` | `grid-frame.png` | 380×460 | ✅ themes 1,2,4 / ❌ themes 3,5-10 |

**Generation:** 2 assets × 7 themes (3,5-10) = **14 images**

**Prompt template (grid-bg):**
```
Generate a subtle background texture for a game grid area (8 columns × 10 rows).
Theme: {THEME_NAME}
Style: Muted, low-contrast surface material — {MATERIAL} texture.
Color: Base fill {GRID_BG_COLOR} with subtle {GRID_CELL_ALT_COLOR} variation.
Should read as a flat surface the blocks sit on. No grid lines (those are drawn in code).
Dimensions: 320×400px portrait rectangle. Background: Full opaque fill (no transparency needed).
```

**Prompt template (grid-frame):**
```
Generate a decorative frame border for a game grid.
Theme: {THEME_NAME}
Style: Simple material-colored border panel with {MATERIAL} texture.
Design: Rectangular frame (380×460px) with {BORDER_WIDTH}px border on all sides.
The frame should have decorative edges matching the theme's aesthetic.
Background: Solid chromakey green (#00FF00, RGB 0,255,0) for the interior cutout.
The green will be removed in post-processing to create transparency.
Border color: {FRAME_COLOR}
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

## 5. Map — 🎨 Per-Theme

The progression map background (Super Mario World-style level selection).

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Map` | `map.png` | 1456×816 | ✅ theme-4 only / ❌ all others |

**Generation:** 1 asset × 9 themes (1-3,5-10) = **9 images**

**Prompt template:**
```
Generate a top-down map illustration for a game progression screen.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Illustrated map view with winding path, landmarks, and decorative terrain.
Composition: Landscape orientation (16:9). Path should wind from bottom-left to top-right.
Include 5 distinct landmark areas for boss levels (levels 10, 20, 30, 40, 50).
Mood: Adventurous, inviting, shows journey progression.
Color palette: {MAP_COLORS}
Background: Full opaque fill (no transparency needed).
No text, no UI elements, no people.
```

---

## 6. UI Chrome — 🌐 Global

HUD bar, action bar, and bonus button background are small UI elements shared across all themes.

| Asset ID | Filename | Dimensions | Type | Status |
|----------|----------|------------|------|--------|
| `HudBar` | `common/ui/hud-bar.png` | 360×40 | 🌐 | ✅ |
| `ActionBar` | `common/ui/action-bar.png` | 360×64 | 🌐 | ✅ |
| `BonusBtnBg` | `common/ui/bonus-btn-bg.png` | 64×64 | 🌐 | ✅ |
| `StarFilled` | `common/ui/star-filled.png` | 24×24 | 🌐 | ✅ |
| `StarEmpty` | `common/ui/star-empty.png` | 24×24 | 🌐 | ✅ |
| `Loader` | `common/ui/loader.svg` | vector | 🌐 | ✅ |

**Generation needed:** 0

---

## 7. Bonus Icons — 🌐 Global

Game mechanics icons (Combo, Score, Harvest, Wave, Supply). These represent abilities, not themes.

| Asset ID | Filename | Dimensions | Type | Status |
|----------|----------|------------|------|--------|
| `BonusCombo` | `common/bonus/combo.png` | 256×256 | 🌐 | ✅ |
| `BonusScore` | `common/bonus/score.png` | 256×256 | 🌐 | ✅ |
| `BonusHarvest` | `common/bonus/harvest.png` | 256×256 | 🌐 | ✅ |
| `BonusWave` | `common/bonus/wave.svg` | vector | 🌐 | ✅ |
| `BonusSupply` | `common/bonus/supply.svg` | vector | 🌐 | ✅ |

**Generation needed:** 0

---

## 8. 9-Slice Panels — 🌐 Global (❌ ALL MISSING)

Used for modals, popups, card backgrounds. 9-slice means corners stay fixed, edges stretch.

| Asset ID | Filename | Borders | Type | Status |
|----------|----------|---------|------|--------|
| `PanelWood` | `common/panels/panel-wood.png` | 24px | 🌐 | ❌ |
| `PanelDark` | `common/panels/panel-dark.png` | 24px | 🌐 | ❌ |
| `PanelLeaf` | `common/panels/panel-leaf.png` | 24px | 🌐 | ❌ |
| `PanelGlass` | `common/panels/panel-glass.png` | 24px | 🌐 | ❌ |

**Specs:** 96×96px minimum. 24px border on each side = 48×48px stretchable center.

**Generation:** 4 images (global, one set)

**Prompt template:**
```
Generate a 9-slice panel texture for a game UI.
Material: {MATERIAL}
Style: {STYLE_DESCRIPTION}
The image is 96×96px. The outer 24px on all sides are the fixed border. The inner 48×48px center will stretch.
Design the border with decorative edges ({EDGE_STYLE}). Center should be a subtle, stretchable fill.
Square format. Background: Solid chromakey green (#00FF00, RGB 0,255,0) for semi-transparent areas.
The green will be removed in post-processing to create transparency.
```

| Panel | Material | Edge Style |
|-------|----------|------------|
| Wood | Warm brown wood planks | Carved wooden frame with nail studs |
| Dark | Dark slate/iron | Thin metallic border with rivets |
| Leaf | Green plant matter | Vine-wrapped edges with small leaves |
| Glass | Frosted glass | Thin bright border, translucent center (0.85 alpha) |

---

## 9. Buttons — 🌐 Global (NO GENERATION NEEDED)

**Buttons are 100% procedural** — drawn with PixiGraphics, no textures used. The `BtnOrange`, `BtnGreen`, `BtnPurple`, `BtnRed`, `BtnIcon` entries in the catalog are unused.

---

## 10. Icons — 🌐 Global

Replace emoji placeholders with proper game icons.

| Asset ID | Filename | Currently Using | Status |
|----------|----------|-----------------|--------|
| `IconStarFilled` | `common/icons/icon-star-filled.png` | ⭐ emoji | ❌ |
| `IconStarEmpty` | `common/icons/icon-star-empty.png` | ☆ emoji | ❌ |
| `IconCube` | `common/icons/icon-cube.png` | 🧊 emoji | ❌ |
| `IconCrown` | `common/icons/icon-crown.png` | 👑 | ❌ |
| `IconFire` | `common/icons/icon-fire.png` | 🔥 | ❌ |
| `IconScroll` | `common/icons/icon-scroll.png` | 📜 emoji | ❌ |
| `IconShop` | `common/icons/icon-shop.png` | 🛒 emoji | ❌ |
| `IconTrophy` | `common/icons/icon-trophy.png` | 🏆 emoji | ❌ |
| `IconMenu` | `common/icons/icon-menu.png` | ☰ text | ❌ |
| `IconClose` | `common/icons/icon-close.png` | ✕ text | ❌ |
| `IconSettings` | `common/icons/icon-settings.png` | ⚙ emoji | ❌ |
| `IconLock` | `common/icons/icon-lock.png` | 🔒 | ❌ |
| `IconMusic` | `common/icons/icon-music.png` | 🎵 | ❌ |
| `IconSound` | `common/icons/icon-sound.png` | 🔊 | ❌ |

**Specs:** 48×48px, white fill on transparent background (tinted in code).

**Generation:** 14 images (global)

**Prompt template:**
```
Generate a simple game UI icon: {ICON_DESCRIPTION}.
Style: Clean, bold, white silhouette.
Think "iOS SF Symbols" or "Material Icons" but slightly stylized for a fantasy game.
48×48 pixels. Thick strokes (3-4px). Rounded corners.
Single shape, centered, no text, no color (white only).
Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
```

---

## 11. Particles — 🌐 Global (❌ ALL MISSING)

Small textures tinted by code via `ThemeColors.particles`.

| Asset ID | Filename | Type | Status |
|----------|----------|------|--------|
| `ParticleSpark` | `common/particles/particle-spark.png` | 🌐 | ❌ |
| `ParticleLeaf` | `common/particles/particle-leaf.png` | 🌐 | ❌ |
| `ParticleFlower` | `common/particles/particle-flower.png` | 🌐 | ❌ |
| `ParticleStar` | `common/particles/particle-star.png` | 🌐 | ❌ |

**Specs:** 16×16px, white on transparent (code tints them with theme colors).

**Generation:** 4 images (global)

**Prompt template:**
```
Generate a small particle texture for game effects.
Shape: {PARTICLE_SHAPE}
Style: Simple white silhouette, clean edges, centered.
16×16 pixels. Single shape, no details, no color (white only).
Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
```

| Particle | Shape |
|----------|-------|
| Spark | Small 4-pointed star burst |
| Leaf | Simple leaf silhouette |
| Flower | 5-petal flower |
| Star | Classic 5-pointed star |

---

## 12. Shared Icons (Existing ✅)

Already on disk at `public/assets/common/icons/`:

| Asset | Path | Status |
|-------|------|--------|
| Moves icon | `common/icons/icon-moves.png` | ✅ |
| Score icon | `common/icons/icon-score.png` | ✅ |
| Cube icon | `common/icons/icon-cube.png` | ✅ |
| Level icon | `common/icons/icon-level.png` | ✅ |
| Surrender icon | `common/icons/icon-surrender.png` | ✅ |

---

## 13. Miscellaneous (Existing ✅)

| Asset | Path | Status |
|-------|------|--------|
| Chest variants | `chests/c1.png` – `c10.png` | ✅ |
| Trophy bronze/silver/gold | `trophies/*.png` | ✅ |
| NFT images | `nft-zkube.png`, `nft-zkube-small.png` | ✅ |
| Lords token | `lords-token.png` | ✅ |

---

## 14. Sound Effects (All Complete ✅)

All SFX are shared from `common/sounds/effects/` (not per-theme).

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `SfxBreak` | `common/sounds/effects/break.mp3` | Line cleared |
| `SfxExplode` | `common/sounds/effects/explode.mp3` | Multi-line combo |
| `SfxMove` | `common/sounds/effects/move.mp3` | Block moved |
| `SfxNew` | `common/sounds/effects/new.mp3` | New blocks spawned |
| `SfxStart` | `common/sounds/effects/start.mp3` | Game started |
| `SfxSwipe` | `common/sounds/effects/swipe.mp3` | Block swiped |
| `SfxOver` | `common/sounds/effects/over.mp3` | Game over |

**Note:** SFX are global assets, shared across all themes.

---

## 15. Music Tracks (All Complete ✅)

4 tracks × 10 themes = 40 files, all exist. Music is per-theme.

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `MusicMain` | `sounds/musics/main.mp3` | Home screen |
| `MusicMap` | `sounds/musics/map.mp3` | Progression map |
| `MusicLevel` | `sounds/musics/level.mp3` | Gameplay |
| `MusicBoss` | `sounds/musics/boss.mp3` | Boss levels |

---

## Generation Summary

### Per-Theme Assets (themes 3,5-10 = 7 themes)

| Category | Assets | Per Theme | Total |
|----------|--------|-----------|-------|
| Blocks | block-{1,2,3,4}.png | 4 | 28 |
| Background | background.png | 1 | 7 |
| Loading BG | loading-bg.png | 1 | 7 |
| Logo | logo.png | 1 | 7 |
| Grid BG | grid-bg.png | 1 | 7 |
| Grid Frame | grid-frame.png | 1 | 7 |
| **Subtotal** | | **9** | **63** |

### Maps (themes 1-3,5-10 = 9 themes)

| Category | Assets | Total |
|----------|--------|-------|
| Map | map.png | 9 |

### Global Assets (one set, all themes share)

| Category | Assets | Total |
|----------|--------|-------|
| Panels | panel-{wood,dark,leaf,glass}.png | 4 |
| Icons | icon-*.png | 14 |
| Particles | particle-*.png | 4 |
| **Subtotal** | | **22** |

### Grand Total: **94 images to generate**

- Per-theme textures: 63
- Maps: 9
- Global assets: 22

### Estimated Cost & Time

| Tier | Rate | Time for 94 images | Cost |
|------|------|---------------------|------|
| Free | 15 RPM | ~7 minutes | $0 |
| Tier 1 | 300 RPM | ~20 seconds | ~$4.70 |

---

## Batch Generation Pipeline

### Prerequisites

```bash
npm install @google/genai p-limit sharp
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
2. Checks `public/assets/{themeId}/` and `public/assets/common/` for existing files
3. For each missing asset, builds a prompt from the templates above
4. Calls Gemini `gemini-3-pro-image-preview` with `responseModalities: ["IMAGE"]`
5. Receives JPEG response, converts to PNG
6. Applies chromakey green stripping for transparency assets
7. Resizes to target dimensions
8. Writes final PNG to correct path
9. Rate-limits to stay within API quota (10 concurrent via `p-limit`)

### API Configuration

```typescript
const config = {
  model: "gemini-3-pro-image-preview",
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
| Map | 16:9 | 2K | 2048×1152 |
| Panels | 1:1 | 1K | 1024×1024 |
| Icons | 1:1 | 1K | 1024×1024 (downscale to 48px) |
| Particles | 1:1 | 1K | 1024×1024 (downscale to 16px) |

### Post-Processing Pipeline

```typescript
// 1. JPEG → PNG conversion
const pngBuffer = await sharp(jpegBuffer).png().toBuffer();

// 2. Green stripping (transparency assets only)
const { data, info } = await sharp(pngBuffer)
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  
  // Detect chromakey green
  if (g > 100 && r < 200 && b < 200 && g > r * 1.3 && g > b * 1.3) {
    data[i + 3] = 0; // Set alpha to 0
  }
}

// 3. Resize to target dimensions
const finalBuffer = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 }
})
  .resize(targetWidth, targetHeight)
  .png()
  .toBuffer();
```

---

## File Structure (Target State)

```
public/assets/
├── common/                               # ALL shared assets
│   ├── icons/                            # HUD + catalog icons
│   │   ├── icon-moves.png               ✅
│   │   ├── icon-score.png               ✅
│   │   ├── icon-cube.png                ✅
│   │   ├── icon-level.png               ✅
│   │   ├── icon-surrender.png           ✅
│   │   ├── icon-star-filled.png         ❌ → Generate
│   │   ├── icon-star-empty.png          ❌ → Generate
│   │   ├── icon-crown.png               ❌ → Generate
│   │   ├── icon-fire.png                ❌ → Generate
│   │   ├── icon-scroll.png              ❌ → Generate
│   │   ├── icon-shop.png                ❌ → Generate
│   │   ├── icon-trophy.png              ❌ → Generate
│   │   ├── icon-menu.png                ❌ → Generate
│   │   ├── icon-close.png               ❌ → Generate
│   │   ├── icon-settings.png            ❌ → Generate
│   │   ├── icon-lock.png                ❌ → Generate
│   │   ├── icon-music.png               ❌ → Generate
│   │   └── icon-sound.png               ❌ → Generate
│   ├── ui/                               # UI Chrome
│   │   ├── action-bar.png               ✅
│   │   ├── hud-bar.png                  ✅
│   │   ├── bonus-btn-bg.png             ✅
│   │   ├── star-filled.png              ✅
│   │   ├── star-empty.png               ✅
│   │   └── loader.svg                   ✅
│   ├── bonus/                            # Bonus icons
│   │   ├── combo.png                    ✅
│   │   ├── score.png                    ✅
│   │   ├── harvest.png                  ✅
│   │   ├── wave.svg                     ✅
│   │   └── supply.svg                   ✅
│   ├── panels/                           ❌ → Generate
│   │   ├── panel-wood.png               ❌
│   │   ├── panel-dark.png               ❌
│   │   ├── panel-leaf.png               ❌
│   │   └── panel-glass.png              ❌
│   ├── particles/                        ❌ → Generate
│   │   ├── particle-spark.png           ❌
│   │   ├── particle-leaf.png            ❌
│   │   ├── particle-flower.png          ❌
│   │   └── particle-star.png            ❌
│   └── sounds/effects/                   ✅
│       ├── break.mp3                    ✅
│       ├── explode.mp3                  ✅
│       ├── move.mp3                     ✅
│       ├── new.mp3                      ✅
│       ├── start.mp3                    ✅
│       ├── swipe.mp3                    ✅
│       └── over.mp3                     ✅
│
├── theme-1/                              ✅ Complete (except map)
│   ├── block-{1-4}.png                  ✅
│   ├── background.png                   ✅
│   ├── loading-bg.png                   ✅
│   ├── logo.png                         ✅
│   ├── grid-bg.png                      ✅
│   ├── grid-frame.png                   ✅
│   ├── map.png                          ❌ → Generate
│   └── sounds/musics/                   ✅
│       ├── main.mp3                     ✅
│       ├── map.mp3                      ✅
│       ├── level.mp3                    ✅
│       └── boss.mp3                     ✅
│
├── theme-2/                              ✅ Complete (except map)
│   ├── block-{1-4}.png                  ✅
│   ├── background.png                   ✅
│   ├── loading-bg.png                   ✅
│   ├── logo.png                         ✅
│   ├── grid-bg.png                      ✅
│   ├── grid-frame.png                   ✅
│   ├── map.png                          ❌ → Generate
│   └── sounds/musics/                   ✅
│
├── theme-3/                              ⚠️ → Generate per-theme textures
│   ├── block-{1-4}.png                  ❌ → Generate
│   ├── background.png                   ❌ → Generate
│   ├── loading-bg.png                   ❌ → Generate
│   ├── logo.png                         ❌ → Generate
│   ├── grid-bg.png                      ❌ → Generate
│   ├── grid-frame.png                   ❌ → Generate
│   ├── map.png                          ❌ → Generate
│   └── sounds/musics/                   ✅
│
├── theme-4/                              ✅ Complete
│   ├── block-{1-4}.png                  ✅
│   ├── background.png                   ✅
│   ├── loading-bg.png                   ✅
│   ├── logo.png                         ✅
│   ├── grid-bg.png                      ✅
│   ├── grid-frame.png                   ✅
│   ├── map.png                          ✅
│   └── sounds/musics/                   ✅
│
├── theme-5/ through theme-10/            ⚠️ → Generate per-theme textures
│   ├── block-{1-4}.png                  ❌ → Generate
│   ├── background.png                   ❌ → Generate
│   ├── loading-bg.png                   ❌ → Generate
│   ├── logo.png                         ❌ → Generate
│   ├── grid-bg.png                      ❌ → Generate
│   ├── grid-frame.png                   ❌ → Generate
│   ├── map.png                          ❌ → Generate
│   └── sounds/musics/                   ✅
```

**Note:** All UI chrome, bonus icons, stars, and SFX are now global assets in `common/`. Themes 3,5-10 use procedural rendering for blocks/backgrounds with fallback to theme-1 textures until generated.

---

## Asset Catalog Integration

The `AssetCatalog` type in `mobile-app/src/pixi/utils/assetCatalog.ts` defines all asset paths. When adding new assets:

1. Add the asset ID to the appropriate section (e.g., `Icons`, `Panels`, `Particles`)
2. Update the path resolver to point to `common/` for global assets
3. For per-theme assets, keep the `{themeId}/` prefix
4. Ensure the filename matches the catalog entry exactly

Example:
```typescript
export const AssetCatalog = {
  Icons: {
    StarFilled: "common/icons/icon-star-filled.png",
    StarEmpty: "common/icons/icon-star-empty.png",
    // ...
  },
  Panels: {
    Wood: "common/panels/panel-wood.png",
    Dark: "common/panels/panel-dark.png",
    // ...
  },
  Blocks: {
    Block1: "block-1.png", // Per-theme, resolved to {themeId}/block-1.png
    // ...
  },
};
```

---

## Quality Checklist

Before marking an asset as complete:

- [ ] Correct dimensions (exact pixel size)
- [ ] Transparency applied correctly (chromakey green removed)
- [ ] Style matches reference themes (bold outlines, cel-shading)
- [ ] Colors match theme palette from `colors.ts`
- [ ] No text, logos, or recognizable IP
- [ ] File size reasonable (<500KB for textures, <50KB for icons)
- [ ] Asset loads correctly in game
- [ ] No visual artifacts from green stripping

---

## Troubleshooting

### Green Halo Around Edges

**Problem:** Transparent assets have green fringe pixels.

**Solution:** Adjust green detection threshold or use edge erosion:
```typescript
// More aggressive green detection
if (g > 80 && r < 220 && b < 220 && g > r * 1.2 && g > b * 1.2) {
  data[i + 3] = 0;
}
```

### Transparency Not Working

**Problem:** Asset appears with solid background in game.

**Solution:** Verify the asset was processed with green stripping enabled. Check that the asset type is in the transparency list.

### Wrong Aspect Ratio

**Problem:** Generated image doesn't match expected dimensions.

**Solution:** Gemini's aspect ratios are approximate. Use the closest available ratio and resize in post-processing.

### Model Returns Error

**Problem:** API returns "Invalid aspect ratio" or "Invalid image size".

**Solution:** Use only supported aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4) and image sizes (1K, 2K).

---

## Future Improvements

- **Batch retry logic** for failed generations
- **Quality scoring** to auto-reject low-quality outputs
- **Style consistency checker** to ensure unified art direction
- **Automated testing** to verify all assets load correctly
- **Asset versioning** to track iterations and improvements
