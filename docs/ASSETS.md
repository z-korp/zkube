# zKube — Complete Asset Reference & Generation Guide

Single source of truth for every visual, audio, and generated asset in the game. Input a theme → generate all needed assets.

**Client**: `client-budokan/` (React + Vite + Tailwind + CSS). All images rendered via standard `<img>` tags with CSS `object-cover` / `object-contain`. No PixiJS, no canvas.

---

## Table of Contents

1. [Theme Reference](#theme-reference)
2. [Artistic Direction](#artistic-direction)
3. [Generation Pipeline](#generation-pipeline)
4. [Per-Theme Visual Assets](#per-theme-visual-assets) (Blocks, Backgrounds, Logos, Grids, Maps, Icons)
5. [Global Visual Assets](#global-visual-assets) (UI, Bonuses, Panels, Buttons, Icons, Particles, Bosses, Constraints, Consumables)
6. [Audio — Sound Effects](#audio--sound-effects)
7. [Audio — Music](#audio--music)
8. [Asset Catalog Integration](#asset-catalog-integration)
9. [Verification & Quality Checklist](#verification--quality-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Exists on disk |
| ❌ | Not yet created |
| 🎨 | Per-theme (unique art per theme) |
| 🌐 | Global (shared across all themes) |

---

## Theme Reference

Source of truth: `client-budokan/src/config/themes.ts`

### Theme Definitions

| ID | Name | Mood | Key Motifs |
|----|------|------|------------|
| theme-1 | Tiki | Tropical night, moonlit beach | Tiki masks, bamboo, palm trees, tropical flowers |
| theme-2 | Cosmic | Synthwave alien landscape | Crystals, nebula swirls, alien glyphs, planets |
| theme-3 | Easter Island | Mysterious volcanic island | Moai statues, petroglyphs, volcanic rock |
| theme-4 | Maya | Ancient jungle temple | Jade serpents, stepped pyramids, feathered motifs |
| theme-5 | Cyberpunk | Enchanted ancient forest | Leaf veins, bark rings, glowing runes, moss |
| theme-6 | Medieval | Stone castle fortress | Shield crests, iron rivets, stone bricks, swords |
| theme-7 | Ancient Egypt | Golden desert kingdom | Hieroglyphs, scarabs, lotus, Eye of Horus |
| theme-8 | Volcano | Volcanic forge | Obsidian shards, lava cracks, ember glow |
| theme-9 | Tribal | Earthy savanna ritual grounds | Painted patterns, drums, feathers, tribal symbols |
| theme-10 | Arctic | Frozen steampunk tundra | Rusted gears, leather straps, brass fittings, ice |

### Full Color Palettes

| Theme | Background | Grid | Accent | Block 1 | Block 2 | Block 3 | Block 4 |
|-------|-----------|------|--------|---------|---------|---------|---------|
| Tiki | `#87CEEB` | `#5D4037` | `#FF8C00` | `#4ADE80` | `#4AA8DE` | `#9F7AEA` | `#FBBF24` |
| Cosmic | `#0B0D21` | `#12102A` | `#A29BFE` | `#00D2D3` | `#6C5CE7` | `#FD79A8` | `#FDCB6E` |
| Easter Island | `#0A0A1A` | `#0D0D22` | `#00FFFF` | `#00FF88` | `#00DDFF` | `#FF00FF` | `#FFFF00` |
| Maya | `#0A2540` | `#0C2D4A` | `#00CED1` | `#00E5A0` | `#00B4D8` | `#FF6F91` | `#FFC947` |
| Cyberpunk | `#1A3A1A` | `#1E3E1E` | `#DAA520` | `#66BB6A` | `#42A5F5` | `#AB47BC` | `#FFCA28` |
| Medieval | `#C2956B` | `#9E7E5A` | `#E07B39` | `#E07B39` | `#D4463B` | `#3D9970` | `#E8C547` |
| Ancient Egypt | `#D0E8F0` | `#A8C8D8` | `#40E0D0` | `#40E0D0` | `#5B9BD5` | `#B070D0` | `#F0C060` |
| Volcano | `#1A0A0A` | `#1E0E0E` | `#FF6600` | `#FF6600` | `#FF2222` | `#FFAA00` | `#FF4488` |
| Tribal | `#FFF0F5` | `#F0D0E0` | `#FF69B4` | `#7DCEA0` | `#85C1E9` | `#D7BDE2` | `#F9E154` |
| Arctic | `#2A1F14` | `#30241A` | `#D4A017` | `#B87333` | `#C5A050` | `#6B8E23` | `#CC5544` |

---

## Artistic Direction

All generated assets must follow a **unified art style** so the game feels cohesive across all 10 themes.

### Style Rules

| Rule | Description |
|------|-------------|
| **Medium** | Digital illustration, vector-like with clean hard edges — NOT pixel art, NOT photographic |
| **Outlines** | Bold black outlines (2-4px at 512px scale) on foreground elements |
| **Shading** | Cel-shading with 2-3 tonal steps per surface, limited gradients |
| **Palette** | Each theme uses 4-6 dominant colors from its `ThemeColors` definition |
| **Texture** | Subtle grain/stipple overlay for depth — never photorealistic noise |
| **Lighting** | Single light source per scene, strong contrast between lit and shadow areas |
| **Motifs** | Each theme has 2-3 recurring decorative motifs (see per-theme tables) |
| **NO** | No logos, no people, no recognizable IP, no photorealism |

### Reference Style

Theme-1 (Tiki) and Theme-2 (Cosmic) establish the baseline:
- **Background** (1080×1920): Illustrated portrait landscape with layered silhouettes, atmospheric depth
- **Blocks** (256×256 per cell): Emblem-style tile with bold black shapes, 2-3 color tones, subtle texture
- **Logo** (512×512): "zKube" text with theme motifs and isometric cube element
- **Grid frame** (576×720): Simple material-colored border panel
- **UI chrome** (360×40/64): Horizontal bars with subtle bevel/shadow

---

## Generation Pipeline

### Model & Tools

| Tool | Purpose |
|------|---------|
| **Gemini 3 Pro Image** | AI image generation (codename "Nano Banana Pro") |
| **sharp** (Node.js) | Resize, crop, format conversion |
| **Suno v5 Sounds** | SFX generation |
| **Suno v5 Custom** | Music generation |

### Gemini Details

- **Max Resolution**: 2048×2048
- **Aspect Ratios**: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- **Output Format**: Always JPEG (even if PNG requested) — convert in post-processing
- **API key**: `GEMINI_API_KEY` env var

### Design Principle: Fill the Canvas

**No background removal (rembg) needed.** All generated images must fill the entire canvas edge-to-edge with the intended content. The prompt must specify that the art fills the full image dimensions with no empty margins or solid-color padding.

For opaque assets (backgrounds, loading, grids, maps): the image IS the final asset after resize.
For blocks and icons: generate art that fills the entire square canvas. The block texture itself IS the image — no transparency, no cutout.

### Post-Processing Steps

1. **JPEG → PNG** — Gemini always returns JPEG
2. **Center-Crop** — For multi-cell blocks: crop center horizontal strip at target aspect ratio
3. **Resize** — Scale to target dimensions via sharp

### Batch Generation Script

**Location**: `scripts/generate-assets.ts`

```bash
npx tsx scripts/generate-assets.ts --scope per-theme     # all missing per-theme
npx tsx scripts/generate-assets.ts --scope global         # all missing global
npx tsx scripts/generate-assets.ts --theme theme-3        # specific theme
npx tsx scripts/generate-assets.ts --asset blocks         # specific category
npx tsx scripts/generate-assets.ts --dry-run              # plan only
npx tsx scripts/generate-assets.ts --post-process         # JPEG→PNG + crop + resize
```

Requires: `npm install @google/genai p-limit sharp` + `GEMINI_API_KEY` env var.

### Aspect Ratios & Target Dimensions

| Asset | Gen Ratio | Gen Size | Target Dimensions | Notes |
|-------|-----------|----------|-------------------|-------|
| Block-1 | 1:1 | 2K | 544×544 | Single cell, fill canvas |
| Block-2 | 1:1 | 2K | center-crop → 1088×544 | Horizontal strip from square |
| Block-3 | 1:1 | 2K | center-crop → 1632×544 | Horizontal strip from square |
| Block-4 | 1:1 | 2K | center-crop → 2176×544 | Horizontal strip from square |
| Background | 1:1 | 2K | 2048×2048 | Square; CSS `object-cover` crops per viewport |
| Loading BG | 1:1 | 2K | 2048×2048 | Square; distinct scene from background |
| Logo | 1:1 | 1K | 512×512 | |
| Grid BG | 4:5 | 1K | 512×640 | |
| Grid Frame | 4:5 | 1K | 576×720 | |
| Map | 9:16 | 2K | 1080×1920 | Portrait only (map is scrollable) |
| Theme Icon | 1:1 | 1K | 128×128 | |
| Panels | 1:1 | 1K | 96×96 | |
| Icons | 1:1 | 1K | 48×48 | |
| Particles | 1:1 | 1K | 16×16 | |

### Why Square Backgrounds (2048×2048)

The game runs on both mobile (portrait, ~9:16) and desktop (landscape, ~16:9). A square image is the optimal single source because CSS `object-cover` crops it to fill any viewport orientation:

- **Mobile 390×844**: scales to 844×844, crops ~227px per side → center stays visible
- **Desktop 1920×1080**: scales to 1920×1920, crops ~420px top/bottom → center stays visible
- **Composition rule**: All important content must be within the center 60% of the image. Edges are safe-to-crop atmospheric filler.

---

## Per-Theme Visual Assets

### How to Use: Input a Theme → Generate Everything

To generate all assets for a theme, fill in these variables:

```
THEME_NAME        = "Maya"
THEME_DESCRIPTION = "Ancient jungle temple civilization with jade and gold"
MOTIFS            = "Jade serpent glyphs, stepped pyramid patterns, feathered serpent motifs"
BLOCK_COLORS      = "#00E5A0, #00B4D8, #FF6F91, #FFC947"
ACCENT_COLOR      = "#00CED1"
GRADIENT          = "#0A2540 to #0C2D4A"
SCENE_DESCRIPTION = "Deep jungle, stepped temple, jade canopy, misty waterfalls"
MOOD              = "Adventurous, lush"
GRID_MATERIAL     = "Deep ocean-floor stone with turquoise tint"
GRID_COLOR        = "#0C2D4A"
ICON_SYMBOL       = "Stepped pyramid with jade serpent"
```

Then use each prompt template below, substituting the variables.

---

### 1. Blocks — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Block1` | `block-1.png` | 544×544 | ✅ theme-1, ⚠️ theme-2 (200×200), ⚠️ theme-3–10 (256×256) |
| `Block2` | `block-2.png` | 1088×544 | ✅ theme-1, ⚠️ others |
| `Block3` | `block-3.png` | 1632×544 | ✅ theme-1, ⚠️ others |
| `Block4` | `block-4.png` | 2176×544 | ✅ theme-1, ⚠️ others |

**Reference**: Theme-1 (Tiki) blocks at 544px/cell are the quality target. All other themes must be regenerated at this size.

**Generation**: 4 × 9 themes (2–10) = **36 images** to regenerate.

**Prompt — Block-1 (1×1 cell)**:
```
Generate a square game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from palette: {BLOCK_COLORS}.
Design: A single decorative emblem with {MOTIFS}. Centered.
The texture must fill the entire canvas edge-to-edge with no empty margins.
No text, no people.
```

**Prompt — Block-2/3/4 (multi-cell)**:
```
Generate a wide game tile ({WIDTH} cells wide, 1 tall) for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, palette: {BLOCK_COLORS}.
Design: Horizontal panel with {MOTIFS}, aspect ratio {WIDTH}:1.
Place as horizontal strip in CENTER of square canvas. The strip fills the full width.
The art must have no empty margins or padding — content fills edge-to-edge within the strip.
No text, no people.
```

Replace `{WIDTH}` with 2, 3, or 4 for block-2, block-3, block-4.
Post-process: center-crop the horizontal strip from the square, then resize to target (1088×544, 1632×544, 2176×544).

### Per-Theme Block Variables

| Theme | THEME_NAME | THEME_DESCRIPTION | BLOCK_COLORS | MOTIFS |
|-------|-----------|-------------------|--------------|--------|
| theme-1 | Tiki | Tropical moonlit beach with carved tiki totems | `#4ADE80, #4AA8DE, #9F7AEA, #FBBF24` | Carved tiki mask faces, bamboo weave patterns, tropical flower motifs |
| theme-2 | Cosmic | Synthwave alien landscape with cratered planets | `#00D2D3, #6C5CE7, #FD79A8, #FDCB6E` | Cosmic crystal formations, nebula swirl patterns, alien glyph carvings |
| theme-3 | Easter Island | Mysterious volcanic island with ancient stone guardians | `#00FF88, #00DDFF, #FF00FF, #FFFF00` | Stone moai faces, volcanic rock patterns, petroglyph carvings |
| theme-4 | Maya | Ancient jungle temple civilization with jade and gold | `#00E5A0, #00B4D8, #FF6F91, #FFC947` | Jade serpent glyphs, stepped pyramid patterns, feathered serpent motifs |
| theme-5 | Cyberpunk | Enchanted ancient forest with golden mystical light | `#66BB6A, #42A5F5, #AB47BC, #FFCA28` | Leaf veins, bark rings, moss patches, glowing runes |
| theme-6 | Medieval | Stone castle fortress with iron and fire | `#E07B39, #D4463B, #3D9970, #E8C547` | Shield crests, iron rivets, stone brick patterns, sword motifs |
| theme-7 | Ancient Egypt | Golden desert kingdom with mystical hieroglyphs | `#40E0D0, #5B9BD5, #B070D0, #F0C060` | Hieroglyphs, scarab beetles, lotus flowers, Eye of Horus |
| theme-8 | Volcano | Volcanic forge with obsidian and molten lava | `#FF6600, #FF2222, #FFAA00, #FF4488` | Obsidian shards, lava cracks, ember glow, volcanic rock |
| theme-9 | Tribal | Earthy savanna with painted ritual stones | `#7DCEA0, #85C1E9, #D7BDE2, #F9E154` | Painted patterns, drum motifs, feather marks, tribal symbols |
| theme-10 | Arctic | Frozen steampunk tundra with brass machinery | `#B87333, #C5A050, #6B8E23, #CC5544` | Rusted gears, leather straps, brass fittings, ice crystals |

---

### 2. Background & Loading — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Background` | `background.png` | 2048×2048 | ❌ theme-1, ❌ theme-2, ⚠️ theme-3–10 (1080×1920, need regen) |
| `LoadingBg` | `loading-bg.png` | 2048×2048 | ⚠️ all themes (1080×1920, need regen) |

**Generation**: 2 × 10 = **20 images**. Config: **1:1, 2K** (Gemini max 2048×2048).

**Why square**: The game runs on both mobile (portrait ~9:16) and desktop (landscape ~16:9). A square source image works for both orientations via CSS `object-cover`. See [Why Square Backgrounds](#why-square-backgrounds-2048×2048) above.

**Composition rule**: Center-weighted. All important scene elements (landmarks, focal points) within the center 60% of the canvas. Edges are atmospheric filler (sky, ground, distant scenery) that can be safely cropped in either orientation.

**Background prompt**:
```
Illustrated environment scene for a puzzle game. SQUARE format (1:1).
Theme: {THEME_NAME} — {THEME_DESCRIPTION}. Scene: {SCENE_DESCRIPTION}
CENTER-WEIGHTED composition: main subject in the center 60% of the canvas.
Edges filled with atmospheric scenery (sky, ground, foliage) that can be cropped.
Layered depth: foreground elements, main scene, distant background.
The art must fill the entire canvas edge-to-edge with no empty margins.
Mood: {MOOD}. Palette: {GRADIENT}. Opaque fill. No text, no people.
```

**Loading BG prompt** (distinct scene from background):
```
Loading screen illustration for a puzzle game. SQUARE format (1:1).
Theme: {THEME_NAME} — {THEME_DESCRIPTION}.
Scene: A close-up atmospheric detail from the theme world — {LOADING_SCENE}.
CENTER-WEIGHTED: main focal point in the middle. Edges can be cropped.
Moody, atmospheric, slightly darker than the main background.
The art must fill the entire canvas edge-to-edge.
Palette: {GRADIENT}. Opaque fill. No text, no people.
```

### Scene Variables

| Theme | SCENE_DESCRIPTION | LOADING_SCENE | MOOD |
|-------|-------------------|---------------|------|
| Tiki | Tropical night seascape, tiki totems, moonlit beach, palm silhouettes | Close-up of a carved tiki mask with glowing eyes, surrounded by tropical flowers | Warm, inviting |
| Cosmic | Synthwave alien landscape, cratered planets, neon rim-lighting | A swirling nebula with crystal formations floating in deep space | Vast, dreamy |
| Easter Island | Volcanic island at night, moai silhouettes, bioluminescent pools | A single moai statue face emerging from volcanic mist, bioluminescent glow | Mysterious, eerie |
| Maya | Deep jungle, stepped temple, jade canopy, misty waterfalls | Jade serpent carving on a moss-covered temple wall, golden light filtering through | Adventurous, lush |
| Cyberpunk | Forest clearing at golden hour, towering trees with moss | Ancient tree trunk close-up with glowing runes and bark patterns | Serene, enchanted |
| Medieval | Castle courtyard at sunset, torches, towers, iron portcullis | Torchlit stone wall with a shield and crossed swords, warm firelight | Epic, warm |
| Ancient Egypt | Desert twilight, golden pyramids, obelisks, Nile reflection | Hieroglyph-covered wall with Eye of Horus, golden torchlight | Majestic, mystical |
| Volcano | Volcanic forge, lava rivers, obsidian platforms, ember sky | Obsidian rock face with molten lava cracks glowing orange-red | Intense, dramatic |
| Tribal | Savanna dawn, ritual stone circle, wildflowers, acacia trees | Painted ritual drum surrounded by feathers and wildflowers, warm earth tones | Earthy, spiritual |
| Arctic | Frozen tundra, aurora borealis, ice crystals, brass structures | Ice crystal formation with aurora light refracting through, brass gears embedded | Cold, wondrous |

---

### 3. Logo — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Logo` | `logo.png` | 512×512 | ✅ all themes |

**Generation**: 10 images. Config: 1:1, 1K.

**Prompt**:
```
Game logo for "zKube" puzzle game.
Theme: {THEME_NAME}
Design: The text "zKube" in a bold stylized font decorated with {THEME_NAME} elements.
Letters integrated with theme motifs: {MOTIFS}.
Include a small isometric cube with cultural motifs below/around the text.
Style: Bold outlines, cel-shading, accent color {ACCENT_COLOR}, glossy highlights.
Text must be clearly readable. Theme elements enhance but don't obscure.
Square format. Dark background that blends with the theme's background color.
```

---

### 4. Grid & Frame — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `GridBg` | `grid-bg.png` | 512×640 | ✅ all themes |
| `GridFrame` | `grid-frame.png` | 576×720 | ✅ all themes |

**Generation**: 2 × 10 = **20 images**. Config: 4:5, 1K.

**Grid BG Prompt**:
```
Game board background texture for a puzzle game grid.
Theme: {THEME_NAME}. Material: {GRID_MATERIAL}.
Subtle texture, uniform color {GRID_COLOR}. Low contrast. No patterns that compete with blocks.
Aspect ratio 4:5. Opaque fill. No text, no people.
```

**Grid Frame Prompt**:
```
Decorative frame border for a game board.
Theme: {THEME_NAME}. Material matches grid: {GRID_MATERIAL}.
Border width ~32px on each side. Interior is a dark flat fill matching {GRID_COLOR}.
Style: Bold outlines, {MOTIFS} decorations on corners and edges.
Aspect ratio 4:5. The frame art fills the entire canvas edge-to-edge.
```

### Grid Material Variables

| Theme | GRID_MATERIAL | GRID_COLOR |
|-------|---------------|------------|
| Tiki | Weathered bamboo planks with rope lashing | `#5D4037` |
| Cosmic | Dark crystalline surface with faint nebula glow | `#12102A` |
| Easter Island | Dark volcanic basalt with faint glow veins | `#0D0D22` |
| Maya | Deep ocean-floor stone with turquoise tint | `#0C2D4A` |
| Cyberpunk | Dark mossy wood bark | `#1E3E1E` |
| Medieval | Weathered sandstone with grain | `#9E7E5A` |
| Ancient Egypt | Cool blue-grey slate | `#A8C8D8` |
| Volcano | Cracked obsidian with faint ember glow | `#1E0E0E` |
| Tribal | Rose-tinted clay with faint texture | `#F0D0E0` |
| Arctic | Dark worn leather with brass patina | `#30241A` |

---

### 5. Map — 🎨 Per-Theme (10 maps)

Campaign progression map backgrounds. One per theme. Each run picks 5 themes for its 5 zones — each zone displays that theme's map with React-rendered level nodes layered on top.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Map` | `theme-{N}/map.png` | 1080×1920 | ✅ all themes |

**Generation**: 10 images (one per theme). Config: 9:16, 2K.

**Map Structure**: Each map = 10 levels (9 classic + 1 boss) + 1 shop node. S-curve path with 10 "landing spots" (lighter clearings where level nodes are placed). Final node (boss) at top is a distinct landmark.

**Design rules**:
- Background is a scenic illustration with a clear winding path
- Path has 10 visible "platform" spots — slightly lighter or clearer areas
- NO text, NO numbers, NO UI elements on the background (React components handle all interactivity)
- Boss area at top should be a dramatic landmark (arena, fortress, altar)
- Shop area just before boss should be a small distinct structure (market stall, chest)
- Each map must work as any zone (1-5) since theme-to-zone assignment is random per run

| Theme | Map Palette | Scene |
|-------|-------------|-------|
| Ocean | Cool blues, teals | Coastal cliffs, coral reefs, ocean backdrop |
| Ice | Whites, pale blues | Frozen shore, ice caves, aurora sky |
| Forest | Greens, browns | Dense canopy, vine bridges, ancient trees |
| Crystal | Emeralds, prismatic | Crystal cavern, glowing mushrooms, gem formations |
| Desert | Warm golds, sand | Sand dunes, oasis, ancient ruins |
| Sunset | Oranges, reds | Canyon at golden hour, warm rock formations |
| Neon | Electric purples, pinks | Neon city streets, holographic signs, dark alleys |
| Storm | Dark grays, lightning whites | Storm peaks, thunderclouds, rain-swept cliffs |
| Lava | Deep reds, oranges | Volcanic ascent, lava rivers, obsidian rock |
| Shadow | Blacks, dark purples | Shadow citadel, dim glowing embers, eerie mist |

**Prompt**:
```
Full-screen illustrated map background for a mobile puzzle game.
Theme: {THEME_NAME}. Scene: {THEME_SCENE}
PORTRAIT (9:16). A scenic winding path from bottom to top.
The path has 10 clear circular platform areas (lighter clearings on the path) where game nodes will be placed.
A dramatic boss landmark at the very top. A small shop structure just before the boss area.
Layered depth: foreground flora/rocks bottom, path with clearings middle, distant scenery top.
Mood: Adventurous. Palette: {THEME_PALETTE}. Opaque fill. No text, no numbers, no UI elements, no people.
```

---

### 6. Theme Icon — 🎨 Per-Theme

Small icon for settings theme selector.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `ThemeIcon` | `theme-icon.png` | 128×128 | ✅ all themes |

**Generation**: 10 images. Config: 1:1, 1K.

**Prompt**:
```
Small square icon representing the "{THEME_NAME}" theme for a game settings menu.
Design: A single iconic symbol — {ICON_SYMBOL}.
Style: Bold silhouette, white fill. Thick strokes. Clean at 48×48.
Centered. Square. Dark background matching the theme.
```

### Icon Symbol Variables

| Theme | ICON_SYMBOL |
|-------|-------------|
| Tiki | Palm tree with tiki mask |
| Cosmic | Ringed planet with stars |
| Easter Island | Moai head silhouette |
| Maya | Stepped pyramid with serpent |
| Cyberpunk | Glowing tree with runes |
| Medieval | Shield with crossed swords |
| Ancient Egypt | Eye of Horus |
| Volcano | Erupting volcano |
| Tribal | Ritual drum with feathers |
| Arctic | Snowflake with gear |

---

## Global Visual Assets

### 7. UI Chrome — 🌐 Global

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `HudBar` | `common/ui/hud-bar.png` | 360×40 | ✅ |
| `ActionBar` | `common/ui/action-bar.png` | 360×64 | ✅ |
| `BonusBtnBg` | `common/ui/bonus-btn-bg.png` | 64×64 | ✅ |
| `StarFilled` | `common/ui/star-filled.png` | 24×24 | ✅ |
| `StarEmpty` | `common/ui/star-empty.png` | 24×24 | ✅ |
| `Loader` | `common/ui/loader.svg` | vector | ✅ |

---

### 8. Bonus Icons — 🌐 Global

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `BonusCombo` | `common/bonus/combo.png` | 256×256 | ✅ |
| `BonusScore` | `common/bonus/score.png` | 256×256 | ✅ |
| `BonusHarvest` | `common/bonus/harvest.png` | 256×256 | ✅ |
| `BonusWave` | `common/bonus/wave.svg` | vector | ✅ |
| `BonusSupply` | `common/bonus/supply.svg` | vector | ✅ |

---

### 9. 9-Slice Panels — 🌐 Global

| Asset ID | Filename | Borders | Status |
|----------|----------|---------|--------|
| `PanelWood` | `common/panels/panel-wood.png` | 24px | ❌ |
| `PanelDark` | `common/panels/panel-dark.png` | 24px | ❌ |
| `PanelLeaf` | `common/panels/panel-leaf.png` | 24px | ❌ |
| `PanelGlass` | `common/panels/panel-glass.png` | 24px | ❌ |

**Specs**: 96×96px source. 24px border = 48×48 stretchable center.

| Panel | Material | Edge Style |
|-------|----------|------------|
| Wood | Warm brown wood planks | Carved frame with nail studs |
| Dark | Dark slate/iron | Metallic border with rivets |
| Leaf | Green plant matter | Vine-wrapped edges with leaves |
| Glass | Frosted glass | Bright border, translucent center |

**Prompt**:
```
A 9-slice panel texture for a game UI. 96x96 pixels.
Material: {PANEL_MATERIAL}. Edge style: {EDGE_STYLE}.
The border is 24px wide on all sides. The center 48x48 area should be a uniform, stretchable fill.
Corner ornaments. Bold outlines, cel-shaded. Square.
Fill the entire canvas with the panel texture edge-to-edge.
```

### 9-Slice Border Reference

| Type | Left | Top | Right | Bottom |
|------|------|-----|-------|--------|
| Panels | 24px | 24px | 24px | 24px |
| Buttons | 16px | 16px | 16px | 16px |
| Icon buttons | 12px | 12px | 12px | 12px |

---

### 10. Buttons — 🌐 Global

100% procedural — drawn with PixiGraphics. **No generation needed.**

| Variant | Code Color | Usage |
|---------|-----------|-------|
| orange | `0xf97316` | Primary CTA |
| green | `0x22c55e` | Confirm, Start |
| purple | `0x6366f1` | Secondary, Cancel |
| red | `0xef4444` | Surrender, Danger |
| icon | `0x334155` | Icon-only square |

---

### 11. Icons — 🌐 Global

48×48px, white fill on transparent. Tinted in code via `SpriteIcon` component.

#### Existing Icons ✅

| Asset ID | Filename | Replaces |
|----------|----------|----------|
| `IconMoves` | `common/icons/icon-moves.png` | — |
| `IconScore` | `common/icons/icon-score.png` | — |
| `IconCube` | `common/icons/icon-cube.png` | ice emoji 🧊 |
| `IconLevel` | `common/icons/icon-level.png` | — |
| `IconSurrender` | `common/icons/icon-surrender.png` | — |
| `IconStarFilled` | `common/icons/icon-star-filled.png` | star emoji ⭐ |
| `IconStarEmpty` | `common/icons/icon-star-empty.png` | star outline ☆ |
| `IconCrown` | `common/icons/icon-crown.png` | crown emoji 👑 |
| `IconFire` | `common/icons/icon-fire.png` | fire emoji 🔥 |
| `IconScroll` | `common/icons/icon-scroll.png` | scroll emoji 📜 |
| `IconShop` | `common/icons/icon-shop.png` | cart emoji 🛒 |
| `IconTrophy` | `common/icons/icon-trophy.png` | trophy emoji 🏆 |
| `IconMenu` | `common/icons/icon-menu.png` | hamburger ☰ |
| `IconClose` | `common/icons/icon-close.png` | X |
| `IconSettings` | `common/icons/icon-settings.png` | gear emoji ⚙ |
| `IconLock` | `common/icons/icon-lock.png` | lock emoji 🔒 |
| `IconMusic` | `common/icons/icon-music.png` | music note 🎵 |
| `IconSound` | `common/icons/icon-sound.png` | speaker 🔊 |

#### New Icons Needed ❌

| Asset ID | Filename | Usage |
|----------|----------|-------|
| `IconHome` | `common/icons/icon-home.png` | Home tab |
| `IconMap` | `common/icons/icon-map.png` | Map tab |
| `IconProfile` | `common/icons/icon-profile.png` | Profile tab |
| `IconArrowLeft` | `common/icons/icon-arrow-left.png` | Back button |
| `IconArrowRight` | `common/icons/icon-arrow-right.png` | Menu list chevron |
| `IconInfo` | `common/icons/icon-info.png` | How to Play |
| `IconHeart` | `common/icons/icon-heart.png` | Favorites (future) |
| `IconGamepad` | `common/icons/icon-gamepad.png` | Quest: Player family |
| `IconChart` | `common/icons/icon-chart.png` | Quest: Clearer family |
| `IconLightning` | `common/icons/icon-lightning.png` | Quest: Combo family |
| `IconMedalGold` | `common/icons/icon-medal-gold.png` | Leaderboard #1 |
| `IconMedalSilver` | `common/icons/icon-medal-silver.png` | Leaderboard #2 |
| `IconMedalBronze` | `common/icons/icon-medal-bronze.png` | Leaderboard #3 |
| `IconCheck` | `common/icons/icon-check.png` | Completed state |
| `IconPlay` | `common/icons/icon-play.png` | In-progress / resume |
| `IconSkull` | `common/icons/icon-skull.png` | Game over |
| `IconRefresh` | `common/icons/icon-refresh.png` | Retry action |
| `IconGesture` | `common/icons/icon-gesture.png` | Tutorial hand/swipe |
| `IconBridge` | `common/icons/icon-bridge.png` | Bridging card |
| `IconPackage` | `common/icons/icon-package.png` | Supply bonus |
| `IconWheat` | `common/icons/icon-wheat.png` | Harvest bonus |

**Total new icons**: 21. **Generation**: Config 1:1, 1K, resize to 48×48.

**Prompt (per icon)**:
```
A simple game UI icon: {ICON_DESCRIPTION}.
Style: Bold white silhouette on dark background. Thick strokes, minimal detail.
Must be clearly recognizable at 48x48 pixels.
Centered. Square. Fill the entire canvas.
```

| Icon | ICON_DESCRIPTION |
|------|------------------|
| home | A house with chimney |
| map | A treasure map with X mark |
| profile | A person silhouette bust |
| arrow-left | A left-pointing arrow/chevron |
| arrow-right | A right-pointing arrow/chevron |
| info | A circle with letter "i" inside |
| heart | A simple heart shape |
| gamepad | A game controller |
| chart | A bar chart with ascending bars |
| lightning | A lightning bolt |
| medal-gold | A medal with ribbon, filled gold circle |
| medal-silver | A medal with ribbon, filled silver circle |
| medal-bronze | A medal with ribbon, filled bronze circle |
| check | A checkmark/tick |
| play | A right-pointing triangle (play button) |
| skull | A skull front view |
| refresh | Two curved arrows forming a circle |
| gesture | A pointing hand/finger |
| bridge | An arched bridge |
| package | A box/package |
| wheat | A wheat stalk |

---

### 12. Particles — 🌐 Global

16×16px, white on transparent. Tinted by `ThemeColors.particles` at runtime.

| Particle | Shape | Status |
|----------|-------|--------|
| Spark | 4-pointed star burst | ❌ |
| Leaf | Simple leaf silhouette | ❌ |
| Flower | 5-petal flower | ❌ |
| Star | 5-pointed star | ❌ |

**Prompt**:
```
A tiny particle sprite: {PARTICLE_SHAPE}.
Pure white silhouette on dark background. Minimal detail.
Must read clearly at 16x16 pixels. Centered. Square.
```

---

### 13. Boss Portraits — 🌐 Global (NEW)

10 unique boss portraits for the boss intro screen. Each boss has a distinct visual identity.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `BossComboMaster` | `common/bosses/combo-master.png` | 512×512 | ❌ |
| `BossDemolisher` | `common/bosses/demolisher.png` | 512×512 | ❌ |
| `BossDaredevil` | `common/bosses/daredevil.png` | 512×512 | ❌ |
| `BossPurist` | `common/bosses/purist.png` | 512×512 | ❌ |
| `BossHarvester` | `common/bosses/harvester.png` | 512×512 | ❌ |
| `BossTidal` | `common/bosses/tidal.png` | 512×512 | ❌ |
| `BossStacker` | `common/bosses/stacker.png` | 512×512 | ❌ |
| `BossSurgeon` | `common/bosses/surgeon.png` | 512×512 | ❌ |
| `BossAscetic` | `common/bosses/ascetic.png` | 512×512 | ❌ |
| `BossPerfectionist` | `common/bosses/perfectionist.png` | 512×512 | ❌ |

**Generation**: 10 images. Config: 1:1, 1K.

| Boss | Portrait Concept | Accent Color |
|------|-----------------|-------------|
| Combo Master | Figure wreathed in chain lightning, electric arcs | Electric blue `#4AA8DE` |
| Demolisher | Armored brute with wrecking ball, rubble | Dark red `#D4463B` |
| Daredevil | Acrobat on a flaming tightrope, fire trails | Hot orange `#FF6600` |
| Purist | Zen monk with empty hands, serene aura | Silver/white `#C0C0C0` |
| Harvester | Cloaked figure with giant scythe, grain field | Dark green `#3D9970` |
| Tidal | Water elemental with crashing waves, deep ocean | Deep ocean `#00B4D8` |
| Stacker | Tower of blocks forming a golem, stone texture | Stone gray `#9E7E5A` |
| Surgeon | Masked figure with precise instruments, clinical | Clinical teal `#40E0D0` |
| Ascetic | Floating meditator, no possessions, golden light | Pale gold `#DAA520` |
| Perfectionist | Crowned figure atop a flawless grid, royal | Royal purple `#9F7AEA` |

**Prompt**:
```
A boss character portrait for a puzzle game.
Character: {BOSS_NAME} — {BOSS_CONCEPT}.
Style: Bold black outlines, cel-shaded illustration, 2-3 tonal steps.
Accent color: {ACCENT_COLOR}. Dramatic lighting from below.
Upper body/bust composition. Imposing and memorable.
Must feel threatening but stylized (not photorealistic).
Square format. Dark atmospheric background that fills the entire canvas.
No text, no logos.
```

---

### 14. Constraint Icons — 🌐 Global (NEW)

7 constraint type icons for the play screen HUD badges. Rendered at 64×64 in the badge component.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `ConstraintClearLines` | `common/constraints/clear-lines.png` | 128×128 | ❌ |
| `ConstraintBreakBlocks` | `common/constraints/break-blocks.png` | 128×128 | ❌ |
| `ConstraintAchieveCombo` | `common/constraints/achieve-combo.png` | 128×128 | ❌ |
| `ConstraintFillAndClear` | `common/constraints/fill-and-clear.png` | 128×128 | ❌ |
| `ConstraintNoBonusUsed` | `common/constraints/no-bonus-used.png` | 128×128 | ❌ |
| `ConstraintKeepGridBelow` | `common/constraints/constraint-keep-grid-below.png` | 128×128 | ✅ |

**Generation**: 6 images (None = no icon). Config: 1:1, 1K, resize to 128×128.

| Constraint | Icon Description |
|------------|-----------------|
| ClearLines | Three horizontal lines stacked, top line has sparkle burst |
| BreakBlocks | A cube/block with visible crack/fracture lines splitting it |
| AchieveCombo | Interlocking chain links with lightning spark at junction |
| FillAndClear | Upward arrow reaching a horizontal target/goal line |
| NoBonusUsed | A star shape with a diagonal line through it (prohibition) |
| KeepGridBelow | A grid with a highlighted cap line and warning marker above it |

**Prompt**:
```
A constraint icon for a puzzle game HUD badge.
Design: {CONSTRAINT_DESCRIPTION}.
Style: Bold white silhouette with clean edges. Must read clearly at 32x32 pixels.
Iconic and instantly recognizable. Simple shapes, no fine detail.
Centered. Square. Dark background.
```

**Usage in game**: These icons sit inside circular progress ring badges on the HUD bar. The ring fills to show constraint completion progress. See UI_UX.md section 4.5 "Constraint Badge" for details.

---

### 15. Consumable Icons — 🌐 Global (NEW)

3 icons for the in-game shop consumable items.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `ConsumableBonusCharge` | `common/consumables/bonus-charge.png` | 128×128 | ❌ |
| `ConsumableLevelUp` | `common/consumables/level-up.png` | 128×128 | ❌ |
| `ConsumableSwapBonus` | `common/consumables/swap-bonus.png` | 128×128 | ❌ |

**Generation**: 3 images. Config: 1:1, 1K, resize to 128×128.

| Consumable | Icon Description |
|------------|-----------------|
| BonusCharge | A lightning bolt inside a battery/charge cell shape |
| LevelUp | An upward arrow with a star at its tip, radiating lines |
| SwapBonus | Two curved arrows forming a swap/exchange circle |

**Prompt**:
```
A shop item icon for a puzzle game.
Design: {CONSUMABLE_DESCRIPTION}.
Style: Bold colorful illustration with black outlines, cel-shaded.
Color: Gold and accent tones for premium feel.
Must be recognizable at 64x64 pixels. Centered. Square.
Dark background that fills the entire canvas.
```

---

### 16. Additional Particles — 🌐 Global (NEW)

Additional particle sprites needed for the redesigned animation system.

| Particle | Shape | Size | Status |
|----------|-------|------|--------|
| Coin | Small gold circle with glint | 16×16 | ❌ |
| Confetti | Small rectangular strip | 8×16 | ❌ |
| Ember | Teardrop glow | 16×16 | ❌ |
| Ring | Thin circle outline | 24×24 | ❌ |

**Prompt**:
```
A tiny particle sprite: {PARTICLE_SHAPE}.
Pure white silhouette on dark background. Minimal detail.
Must read clearly at {SIZE} pixels. Centered.
```

**Usage**:
- **Coin**: CUBE earning animation (gold tinted at runtime)
- **Confetti**: Victory celebration (multi-color tinted)
- **Ember**: Boss level background atmosphere (orange/red tinted)
- **Ring**: Constraint completion celebration (success color tinted)

---

### 17. Boss Defeat Shards — 🌐 Global (NEW)

Spritesheet of triangular shards for the boss defeat shatter animation.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `BossShards` | `common/bosses/boss-shards.png` | 256×64 (4 frames) | ❌ |

**Generation**: 1 spritesheet with 4 shard variants. Config: 4:1.

4 triangular shard shapes (different angles/sizes). White on transparent, tinted at runtime with boss accent color.

**Prompt**:
```
A horizontal spritesheet of 4 glass/crystal shard fragments for a shatter animation.
4 triangular fragments of different sizes and angles, evenly spaced in a row.
Style: Bold white shapes with sharp edges and a subtle glass refraction line.
Each shard ~64x64 area. Total: 256x64 strip.
Dark background filling the entire canvas.
```

---

### 18. Tutorial Assets — 🌐 Global (NEW)

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `TutorialHand` | `common/ui/tutorial-hand.png` | 64×64 | ❌ |

**Prompt**:
```
A cartoon pointing hand/finger for a game tutorial overlay.
Style: Bold black outlines, cel-shaded, friendly and inviting.
Index finger pointing downward. Clean at 64x64 pixels.
Square. Dark background.
```

---

### 14. Existing Shared Assets ✅

| Category | Location | Notes |
|----------|----------|-------|
| Chests | `common/chests/c1-c10.png` | Level reward chests |
| Trophies | `common/trophies/*.png` | Achievement trophies |
| NFT images | various | Token metadata |
| Lords icon | `common/lords.png` | Token icon |

---

## Audio — Sound Effects

### Existing SFX ✅

All SFX shared from `common/sounds/effects/`.

| Asset ID | Filename | When Played | Duration |
|----------|----------|-------------|----------|
| `SfxBreak` | `break.mp3` | Line cleared | 0.3-0.5s |
| `SfxExplode` | `explode.mp3` | Multi-line combo | 0.5-0.8s |
| `SfxMove` | `move.mp3` | Block moved | 0.15-0.25s |
| `SfxNew` | `new.mp3` | New blocks spawned | 0.3-0.4s |
| `SfxStart` | `start.mp3` | Game started | 0.5-0.8s |
| `SfxSwipe` | `swipe.mp3` | Block swiped | 0.15-0.2s |
| `SfxOver` | `over.mp3` | Game over | 0.8-1.2s |

### New SFX Needed ❌

| Asset ID | Filename | When Played | Duration |
|----------|----------|-------------|----------|
| `SfxClick` | `click.mp3` | UI button tap | 0.1-0.15s |
| `SfxCoin` | `coin.mp3` | Cube earned/received | 0.2-0.3s |
| `SfxClaim` | `claim.mp3` | Quest reward claimed | 0.3-0.5s |
| `SfxStar` | `star.mp3` | Star earned (level complete) | 0.2-0.3s |
| `SfxLevelup` | `levelup.mp3` | Level complete fanfare | 0.5-0.8s |
| `SfxBossIntro` | `boss-intro.mp3` | Boss intro screen appears | 1.0-1.5s |
| `SfxBossDefeat` | `boss-defeat.mp3` | Boss portrait shatter | 0.8-1.2s |
| `SfxBonusActivate` | `bonus-activate.mp3` | Bonus used in gameplay | 0.3-0.5s |
| `SfxShopPurchase` | `shop-purchase.mp3` | Item purchased in shop | 0.3-0.5s |
| `SfxEquip` | `equip.mp3` | Bonus equipped in loadout | 0.2-0.3s |
| `SfxUnequip` | `unequip.mp3` | Bonus removed from slot | 0.15-0.2s |
| `SfxConstraintComplete` | `constraint-complete.mp3` | Constraint badge fulfilled | 0.3-0.5s |
| `SfxVictory` | `victory.mp3` | Run complete (L50 cleared) | 2.0-3.0s |

### How to Generate SFX with Suno

1. Switch to **Sounds** tab (top toggle: Simple / **Sounds**)
2. Set Advanced Options: Type = **One-Shot**, BPM = Auto, Key = Any
3. Paste prompt into "Describe the sound you want"
4. Download, trim tight, normalize to **-12 LUFS**, export MP3 192kbps

### Existing SFX Prompts

| Effect | Suno Sounds Prompt |
|--------|-----|
| break | Short bright impact with crystalline shimmer tail. A satisfying snap-crack of puzzle pieces breaking apart. Quick attack, fast decay. |
| explode | Rapid cascade of impacts building to an energy burst. Multiple elements scattering outward. Brief triumphant flourish at peak. Deep bass punctuation. |
| move | Quick smooth slide with subtle friction texture. Soft click as piece locks into position. Clean and responsive. |
| new | Ascending three-note chime cascade. Elements materializing and clicking into place. Bright and inviting. |
| start | Energetic fanfare burst with percussive hits. Confident, punchy game-start signal. Rising energy into a bright accent. |
| swipe | Quick airy whoosh. Short directional air displacement with subtle texture. Fast and light. |
| over | Deep resonant impact. Slow descending tones with fading reverb. Finality without harshness. |

### New SFX Prompts

| Effect | Suno Sounds Prompt |
|--------|-----|
| click | Clean, minimal button tap. A subtle tactile click with a tiny reverb tail. Crisp and satisfying. Under 0.15 seconds. |
| coin | Bright coin clink with metallic shimmer. A single upward ting like a gold coin landing. Quick and rewarding. |
| claim | Ascending sparkle cascade with a satisfying chime resolution. Like opening a treasure chest and coins spilling. Brief and celebratory. |
| star | A single bright bell ding with harmonic overtones. Pure, high-pitched, and clean. Like a star appearing and twinkling once. |
| levelup | Short triumphant brass fanfare with ascending notes. Confident victory signal. Celebratory but not long — punchy and bright. |
| boss-intro | Deep ominous rumble building to a dramatic hit. Low brass, war drums, a sense of impending challenge. Tension without resolution. |
| boss-defeat | Explosive shattering glass/crystal impact followed by triumphant ascending chord. Like a boss shield breaking apart into pieces. |
| bonus-activate | Quick magical activation burst. A whoosh into a bright energy pulse. Empowering and snappy. |
| shop-purchase | Satisfying cash register cha-ching with a sparkle tail. Brief and rewarding, like coins well spent. |
| equip | A solid metallic click-snap, like slotting a gem into place. Satisfying and mechanical. Quick. |
| unequip | A soft reverse click, like lifting something out of a socket. Quick and gentle. Opposite energy of equip. |
| constraint-complete | A bright ascending two-note chime with a bell shimmer. Like a checkbox getting ticked. Satisfying completion signal. |
| victory | Extended triumphant orchestral fanfare with ascending brass, cymbal crashes, and sparkle cascade. Heroic and celebratory. Grand finale energy. |

---

## Audio — Music

4 tracks × 10 themes = **40 files**. Stored at `{themeId}/sounds/musics/`.

| Asset ID | Filename | When Played | Status |
|----------|----------|-------------|--------|
| `MusicMain` | `main.mp3` | Home screen | ✅ all themes |
| `MusicMap` | `map.mp3` | Progression map | ✅ all themes |
| `MusicLevel` | `level.mp3` | Gameplay | ✅ all themes |
| `MusicBoss` | `boss.mp3` | Boss levels | ✅ all themes |

### How to Generate Music with Suno

1. Toggle **Custom** mode ON
2. Paste prompt into "Style of Music" field
3. Put `[Instrumental]` in "Lyrics" field
4. 2 outputs per prompt: **Menu prompt** → main.mp3 + map.mp3, **Gameplay prompt** → level.mp3 + boss.mp3

### Theme Music Prompts

#### Theme 1: Tiki

**Menu:**
```
A laid-back tropical lo-fi instrumental with soft ukulele fingerpicking over warm steel drum chords and gentle bongo percussion. Light marimba accents shimmer through a haze of ocean breeze ambience. The tempo sits easy around 95 BPM, evoking wooden beach huts, swaying palms, and golden hour light filtering through bamboo. Calming and inviting, like a puzzle waiting on a sunlit porch.
```

**Gameplay:**
```
An upbeat island funk instrumental driven by a playful ukulele riff and tight djembe percussion. Kalimba runs sparkle over a steel drum melody that's catchy without being distracting, while shakers keep a steady groove underneath. Around 115 BPM, the energy stays focused and rhythmic — Polynesian puzzle-solving music that makes you nod along as you think, balancing tropical warmth with forward momentum.
```

#### Theme 2: Cosmic

**Menu:**
```
A dreamy space ambient instrumental with lush analog synth pads drifting like nebula clouds. A gentle arpeggiator twinkles like distant stars over soft sub-bass warmth, while reverb-soaked bell tones float weightlessly. Around 80 BPM, retro-futuristic and serene — the feeling of drifting through a purple-pink star field, vast and quiet, with nothing but the hum of the cosmos and a sense of infinite possibility.
```

**Gameplay:**
```
A mid-tempo synthwave instrumental with a pulsing bassline driving forward under shimmering arpeggiated synths and crisp electronic drums. A melodic lead synth glides and soars through the mix, propulsive and luminous, like navigating through an asteroid field at speed. Sidechained pads breathe in and out around 110 BPM, keeping the energy focused and determined without ever getting heavy.
```

#### Theme 3: Easter Island

**Menu:**
```
A mysterious retro-futuristic instrumental blending ancient atmosphere with neon synthwave. A haunting stone flute melody floats over warm analog synth pads and a slow, ritualistic drum pattern. Deep reverb creates vast open space, like standing among giant moai statues at dusk while neon arpeggios glimmer faintly in the distance. Around 85 BPM, otherworldly and contemplative — ancient mystery refracted through an 80s synth lens.
```

**Gameplay:**
```
A driving retro synthwave instrumental with punchy bass synth over tight electronic drums and bright neon arpeggios in a minor key. Quick percussive hits click like volcanic rocks while a low drone rumbles underneath like distant volcanic activity. 118 BPM and relentless, the mood is neon noir — solving puzzles under the watchful gaze of stone giants, electric and mysterious, with tension built into every measure.
```

#### Theme 4: Maya

**Menu:**
```
An atmospheric Mesoamerican instrumental with a wooden pan flute melody floating over gentle rain stick textures and soft clay drum rhythm. Lush jungle ambience fills the space — distant bird calls, rustling canopy, warm humid air. Bass notes settle like stepping into a jade-walled temple deep in the overgrown ruins. Reverb-soaked and meditative around 85 BPM, mysterious but inviting, sacred and ancient.
```

**Gameplay:**
```
An energetic Latin world music instrumental driven by quick wooden marimba patterns and rattling seed shakers over tight hand drum rhythms. A pan flute melody weaves through in a pentatonic scale, punctuated by deep, growling bass notes. The percussion is layered and propulsive — 120 BPM of focused jungle energy, ritualistic yet playful, like a temple ceremony where every move counts.
```

#### Theme 5: Cyberpunk

**Menu:**
```
A moody cyberpunk instrumental with warm, detuned analog synth chords and slow jazzy electric piano licks drifting over a laid-back hip-hop beat. Deep 808 sub-bass hums beneath lo-fi vinyl crackle while neon signs buzz faintly in the background and rain patters on city streets. Around 80 BPM, noir and nocturnal — a late-night puzzle session in a rain-soaked cyber cafe, all purple shadows and amber streetlight.
```

**Gameplay:**
```
A slick cyberpunk electronic instrumental with a driving bassline, crisp trap hi-hats, and snappy snare. Glitchy arpeggiated synths cascade like digital rain while pitch-bent lead stabs cut through filtered pads that rise and fall. 120 BPM, focused and calculated — hacking through the matrix one block at a time, every beat precise, every synth line purposeful, electric and forward-moving.
```

#### Theme 6: Medieval

**Menu:**
```
A warm medieval tavern instrumental with gentle lute fingerpicking and a soft hurdy-gurdy drone underneath. A quiet bodhran keeps gentle time while Celtic harp arpeggios add touches of magic. The atmosphere is all crackling fireplaces and candlelit stone walls — nostalgic and comforting around 90 BPM, like resting at a roadside inn between adventures, a mug of mead in hand.
```

**Gameplay:**
```
An upbeat medieval folk rock instrumental with lively lute strumming driving the rhythm alongside a bodhran beat and bright tin whistle melody. Quick pizzicato strings add bounce while an occasional trumpet fanfare accents the peaks. 125 BPM, spirited and adventurous — a knight's training montage in the castle armory, determined and gallant, every move building toward something greater.
```

#### Theme 7: Ancient Egypt

**Menu:**
```
An elegant Egyptian instrumental with a soft oud melody and gentle darbuka hand drum pattern. Shimmering golden harp arpeggios cascade while a ney flute floats delicately over warm desert wind ambience. The scale is Arabic maqam Hijaz — regal and serene, around 85 BPM, like watching the sun set golden over the Nile from the steps of a sandstone temple, timeless and unhurried.
```

**Gameplay:**
```
A rhythmic Egyptian fusion instrumental with driving darbuka and riq tambourine groove over punchy bass oud. Quick kanun zither runs sparkle like desert sand in sunlight while a ney flute melody in Hijaz scale keeps the energy focused and exotic. Tight and groovy at 115 BPM — deciphering ancient hieroglyphs under the pharaoh's watchful gaze, confident and precise.
```

#### Theme 8: Volcano

**Menu:**
```
A dark volcanic ambient instrumental with deep rumbling sub-bass like magma flowing underground. Slow metallic percussion — anvil strikes and chain rattles — rings out over warm distorted drones with ember-like high-frequency crackle. Ominous but hypnotic around 75 BPM, like standing at the edge of a volcanic caldera at night, watching the glow pulse beneath black rock, primordial and smoldering.
```

**Gameplay:**
```
A driving industrial metal instrumental with heavy bass pulse and metallic percussion hammering on beat like a forge at full capacity. A distorted guitar-like synth chugs in rhythmic lockstep with quick hi-hats and snappy rimshots while an ember-bright lead melody cuts through the heat. 125 BPM of relentless forward momentum — forging blocks in the heart of the mountain, fiery and powerful.
```

#### Theme 9: Tribal

**Menu:**
```
A warm organic tribal instrumental with soft djembe hand drumming and a gentle kalimba melody that rings clear and bright. Shaker and rain stick textures layer underneath warm acoustic bass plucks while a breathy wooden flute adds softness. Earthy and grounding around 90 BPM — like sitting around a campfire as twilight settles, the air still warm, the rhythm of the earth steady beneath you.
```

**Gameplay:**
```
A groovy Afrobeat instrumental with tight djembe and dunun in polyrhythmic lockstep. Funky kalimba riffs dance over the top while quick shaker patterns and hand clapping weave through talking drum accents. Bouncy and energetic with deep pocket at 120 BPM — a village celebration in full swing, joyful and rhythmic, every hit landing exactly where it should.
```

#### Theme 10: Arctic

**Menu:**
```
A serene arctic ambient instrumental with crystalline bell tones shimmering like northern lights overhead. A soft bowed string drone hums underneath a gentle, sparse piano melody — contemplative and unhurried. Wind ambience whispers through with ice crystal tinkling at the edges. Around 75 BPM, vast and frozen, like standing alone on an endless tundra watching the aurora ripple in silence.
```

**Gameplay:**
```
A crisp Nordic folk electronic instrumental with staccato strings and a tight electronic drum beat driving forward. A bright folk fiddle melody sings over pulsing bass while quick plucked kantele accents add sparkle. Snappy and precise at 115 BPM, like cracking ice — cool-toned but warm at its core, determined and brisk, racing across frozen blocks before they shift beneath you.
```

### Audio Post-Production

**Music:**
- Download MP3 from Suno (2 per prompt)
- Trim silence, crossfade last 2-3s into first 2-3s for seamless looping
- Normalize to **-14 LUFS**
- Assign: Menu prompt → main.mp3 + map.mp3, Gameplay prompt → level.mp3 + boss.mp3

**SFX:**
- Trim tight — no leading/trailing silence
- Normalize to **-12 LUFS**
- MP3 192kbps

---

## Asset Catalog Integration

### File Locations

| Category | Path Pattern |
|----------|-------------|
| Per-theme | `public/assets/{themeId}/{filename}` |
| Theme maps | `public/assets/{themeId}/map.png` |
| Shared icons | `public/assets/common/icons/{filename}` |
| Shared UI | `public/assets/common/ui/{filename}` |
| Shared bonus | `public/assets/common/bonus/{filename}` |
| Shared panels | `public/assets/common/panels/{filename}` |
| Shared particles | `public/assets/common/particles/{filename}` |
| Boss portraits | `public/assets/common/bosses/{filename}` |
| Constraint icons | `public/assets/common/constraints/{filename}` |
| Consumable icons | `public/assets/common/consumables/{filename}` |
| SFX | `public/assets/common/sounds/effects/{filename}` |
| Music | `public/assets/{themeId}/sounds/musics/{filename}` |

### Catalog Registration

All per-theme assets live at `client-budokan/public/assets/{themeId}/`.
All shared assets live at `client-budokan/public/assets/common/`.

Theme images are resolved via `getThemeImages(themeId)` in `client-budokan/src/config/themes.ts`.
Common assets via `getCommonAssetPath(path)`.

### Adding a New Icon

1. Generate with Gemini (1:1, 1K)
2. Convert JPEG → PNG
3. Resize to 48×48
4. Save to `client-budokan/public/assets/common/icons/icon-{name}.png`
5. Reference via `getCommonAssetPath("icons/icon-{name}.png")`

---

## Verification & Quality Checklist

### Automated Verification

```bash
# Check per-theme dimensions (Node.js — no PIL needed)
node -e "
const fs = require('fs');
const path = require('path');
const base = 'client-budokan/public/assets';
const specs = {
  'block-1.png': [544, 544], 'block-2.png': [1088, 544],
  'block-3.png': [1632, 544], 'block-4.png': [2176, 544],
  'grid-bg.png': [512, 640], 'grid-frame.png': [576, 720],
  'background.png': [2048, 2048], 'loading-bg.png': [2048, 2048],
  'logo.png': [512, 512], 'theme-icon.png': [128, 128],
  'map.png': [1080, 1920],
};
const theme = process.argv[2] || 'theme-1';
for (const [name, [ew, eh]] of Object.entries(specs)) {
  const fp = path.join(base, theme, name);
  if (!fs.existsSync(fp)) { console.log('  MISSING ' + name); continue; }
  const buf = fs.readFileSync(fp);
  if (buf[0] !== 0x89 || buf[1] !== 0x50) { console.log('  NOT_PNG ' + name); continue; }
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const ok = w === ew && h === eh ? 'OK' : 'WRONG_SIZE';
  console.log('  ' + ok + ' ' + name + ': ' + w + 'x' + h + ' (expected ' + ew + 'x' + eh + ')');
}
" -- theme-1
```

### Quality Checklist

For every generated asset, verify:

- [ ] **Correct dimensions** (exact match to spec)
- [ ] **Correct format** (PNG)
- [ ] **Content fills canvas** (no empty margins, no solid-color padding)
- [ ] **Style matches reference** (bold outlines, cel-shading, 2-3 tonal steps)
- [ ] **Colors match palette** from `themes.ts` ThemeColors
- [ ] **No text** (except logo "zKube"), no people
- [ ] **File size** < 500KB textures, < 50KB icons (backgrounds exempt — up to 5MB)
- [ ] **Loads correctly** in game (no console errors)
- [ ] **Scales correctly on both mobile and desktop** (no visible pixelation, no awkward cropping)

---

## Troubleshooting

**Background looks cropped on desktop** — Expected. Square backgrounds (2048×2048) get cropped via `object-cover` to fit the viewport. Ensure composition is center-weighted.

**Wrong aspect ratio** — Gemini approximates; resize in post-processing handles final dimensions.

**Gemini API error** — Only supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9

**Icon too detailed at 48px** — Simplify the prompt. Use "bold silhouette" and "thick strokes". Regenerate.

**Music doesn't loop** — Crossfade last 2-3s into first 2-3s in audio editor before export.

**Block has visible margins** — The prompt must specify "fill the entire canvas edge-to-edge". Regenerate with explicit fill instruction.

---

## Generation Status Summary

### Per-Theme Assets — Regeneration Needed

| Category | Per Theme | Status | Action |
|----------|-----------|--------|--------|
| Blocks | 4 | ✅ theme-1 (544px), ⚠️ themes 2-10 (wrong size) | **Regen 36 blocks** (themes 2-10 at 544px/cell) |
| Background | 1 | ❌ theme-1&2 (missing), ⚠️ theme-3-10 (1080×1920) | **Regen all 10** at 2048×2048 square |
| Loading BG | 1 | ⚠️ all themes (1080×1920) | **Regen all 10** at 2048×2048 square |
| Logo | 1 | ✅ all themes | No action |
| Grid BG + Frame | 2 | ✅ all themes | No action |
| Map | 1 | ✅ all themes | No action |
| Theme Icon | 1 | ✅ all themes | No action |
| Music | 4 | ✅ all themes | No action |

### Regeneration Priority

1. **Backgrounds (10)** — Theme 1 & 2 are missing `background.png`, themes 3-10 are 1080×1920 (need 2048×2048 for desktop)
2. **Loading BGs (10)** — All are 1080×1920, need 2048×2048 square
3. **Blocks (36)** — Themes 2-10 need regen at 544px/cell (theme 1 = reference quality)

**Total images to regenerate: 56**

### Code Changes Required After Regen

After generating new backgrounds for themes 1 & 2:
- Update `hasBackgroundImage()` in `client-budokan/src/config/themes.ts` to return `true` for all themes
- Remove legacy pixi fallback assets from `theme-1/` and `theme-2/` (theme-2-1.png, palmtree-*.png, theme-2-totem-*.png)
- Clean up `ImageAssets.tsx` to remove legacy fallback paths

### Global Assets

| Category | Count | Status |
|----------|-------|--------|
| UI Chrome | 6 | ✅ Complete |
| Bonus Icons | 5 | ✅ Complete |
| 9-Slice Panels | 4 | ❌ Missing |
| Existing Icons | 18 | ✅ Complete |
| New Icons | 21 | ❌ Missing |
| Particles (existing) | 4 | ❌ Missing |
| Particles (new) | 4 | ❌ Missing |
| Tutorial Hand | 1 | ❌ Missing |
| Boss Portraits | 10 | ❌ Missing |
| Constraint Icons | 6 | ❌ Missing |
| Consumable Icons | 3 | ❌ Missing |
| Boss Defeat Shards | 1 | ❌ Missing |
| Existing SFX | 7 | ✅ Complete |
| New SFX | 13 | ❌ Missing |
| **Total Global** | **98** | **36 ✅ / 62 ❌** |
