# Theme Assets Reference

Complete inventory of assets needed per theme, with strict format requirements and AI generation prompts.

---

## Architecture

- **10 themes** defined: `theme-1` through `theme-10`
- **theme-1** (Tiki) and **theme-2** (Cosmic) have full art
- **theme-3 to theme-10** currently use theme-1 assets as placeholders via fallback
- All assets resolved through `mobile-app/src/pixi/assets/resolver.ts`
- Asset metadata defined in `mobile-app/src/pixi/assets/catalog.ts`
- Files stored in `mobile-app/public/assets/theme-{N}/`

## Fallback Behavior

When a theme's asset file is missing, the resolver falls back to `theme-1`.
SFX always come from `theme-1` (shared). Music loads from the actual zone theme.

---

## Theme List

| ID | Name | Icon | Status |
|----|------|------|--------|
| `theme-1` | Tiki | `🌴` | **Complete** |
| `theme-2` | Cosmic | `🌌` | **Complete** |
| `theme-3` | Easter Island | `🗿` | Placeholder (uses theme-1) |
| `theme-4` | Maya | `🏛️` | ⚠️ Generated but BROKEN (see Known Issues) |
| `theme-5` | Cyberpunk | `💜` | Placeholder (uses theme-1) |
| `theme-6` | Medieval | `⚔️` | Placeholder (uses theme-1) |
| `theme-7` | Ancient Egypt | `🏺` | Placeholder (uses theme-1) |
| `theme-8` | Volcano | `🌋` | Placeholder (uses theme-1) |
| `theme-9` | Tribal | `🪘` | Placeholder (uses theme-1) |
| `theme-10` | Arctic | `❄️` | Placeholder (uses theme-1) |

---

## ⚠️ Known Issues — Theme-4 (Maya) Generation Failure

The first generation run produced unusable assets. **All 13 files have these problems:**

| Problem | Details |
|---------|---------|
| **Wrong file format** | All files are JPEG data saved with `.png` extension (`mode=RGB`, `format=JPEG`). No alpha channel → no transparency → checkerboard artifacts in-game. |
| **Wrong block dimensions** | All 4 blocks generated at 1024×1024 (square). Should be 544×544, 1088×544, 1632×544, 2176×544 (aspect ratio N:1). |
| **Wrong grid dimensions** | `grid-bg.png` and `grid-frame.png` are 928×1152. Should be 320×400 and 380×460. |
| **Wrong background dimensions** | `background.png` and `loading-bg.png` are 2752×1536. Should be 1456×816. |
| **Extra unwanted files** | `map.png` (3812KB) and `theme-icon.png` (824KB) were generated but aren't in the spec. |

**Root cause:** The generation script saved Gemini's raw output without format conversion or resizing. Now fixed — run `--post-process` after generation.

**Fix applied:** Post-processing converted all 13 files to proper PNG/RGBA and resized to correct dimensions. However, the images are still from the old landscape-oriented generation. They need regeneration with portrait prompts.

---

## STRICT FORMAT REQUIREMENTS

**Every asset MUST meet ALL of these requirements. If it doesn't, it's broken.**

### File Format Rules

| Rule | Requirement |
|------|-------------|
| **Format** | True PNG (not JPEG renamed to .png). Verify with `file *.png` — must say "PNG image data" |
| **Color mode** | RGBA or P (palette with alpha). NEVER RGB-only (no transparency). |
| **Bit depth** | 8-bit |
| **Transparency** | REQUIRED for: blocks, deco, grid-frame, logo. NOT required for: background, loading-bg, grid-bg |
| **Compression** | Optimize with `pngquant` or similar to keep file sizes reasonable |

### Dimension Rules (EXACT — from theme-1 reference)

| Asset | EXACT Dimensions | Aspect Ratio | Transparency |
|-------|-----------------|--------------|--------------|
| `block-1.png` | **544 × 544** | 1:1 | ✅ Required |
| `block-2.png` | **1088 × 544** | 2:1 | ✅ Required |
| `block-3.png` | **1632 × 544** | 3:1 | ✅ Required |
| `block-4.png` | **2176 × 544** | 4:1 | ✅ Required |
| `grid-bg.png` | **320 × 400** | 4:5 | ❌ Opaque OK |
| `grid-frame.png` | **380 × 460** | ~4:5 | ✅ Required |
| `background.png` | **1080 × 1920** | 9:16 portrait | ❌ Opaque OK |
| `loading-bg.png` | **1080 × 1920** | 9:16 portrait | ❌ Opaque OK |
| `logo.png` | **500 × 500** | 1:1 | ✅ Required |
| `deco-left.png` | **~600 × 800** output | 3:4 | ✅ Required |
| `deco-right.png` | **~600 × 800** output | 3:4 | ✅ Required |

### Verification Commands

Run these AFTER every generation batch. **Any failure = regenerate.**

```bash
# 1. Check file format (MUST say "PNG image data", NOT "JPEG")
file mobile-app/public/assets/theme-{N}/*.png
# ✅ GOOD: block-1.png: PNG image data, 544 x 544, 8-bit/color RGBA, non-interlaced
# ❌ BAD:  block-1.png: JPEG image data, JFIF standard 1.01

# 2. Check dimensions and mode (python)
python3 -c "
from PIL import Image
import glob, sys
errors = []
specs = {
    'block-1.png': (544, 544), 'block-2.png': (1088, 544),
    'block-3.png': (1632, 544), 'block-4.png': (2176, 544),
    'grid-bg.png': (320, 400), 'grid-frame.png': (380, 460),
    'background.png': (1080, 1920), 'loading-bg.png': (1080, 1920),
    'logo.png': (500, 500),
}
theme = sys.argv[1] if len(sys.argv) > 1 else 'theme-4'
for name, (w, h) in specs.items():
    path = f'mobile-app/public/assets/{theme}/{name}'
    try:
        img = Image.open(path)
        if img.format != 'PNG':
            errors.append(f'  ❌ {name}: format={img.format} (expected PNG)')
        if img.size != (w, h):
            errors.append(f'  ❌ {name}: {img.size[0]}x{img.size[1]} (expected {w}x{h})')
        if img.mode == 'RGB' and name not in ('background.png', 'loading-bg.png', 'grid-bg.png'):
            errors.append(f'  ❌ {name}: mode={img.mode} (needs alpha channel)')
        print(f'  ✅ {name}: {img.size[0]}x{img.size[1]} {img.mode} {img.format}' if not any(name in e for e in errors) else '')
    except FileNotFoundError:
        errors.append(f'  ❌ {name}: MISSING')
if errors:
    print('\\nERRORS:')
    for e in errors: print(e)
else:
    print('\\nAll assets valid!')
" theme-4

# 3. Quick visual check — open in browser
# open mobile-app/public/assets/theme-{N}/block-1.png
```

---

## Artistic Direction

All generated assets must follow a **unified art style** across all themes.

### Style Rules

| Rule | Description |
|------|-------------|
| **Medium** | Digital illustration, vector-like with clean hard edges — NOT pixel art, NOT photographic |
| **Outlines** | Bold black outlines (2-4px at 512px scale) on foreground elements |
| **Shading** | Cel-shading with 2-3 tonal steps per surface, limited gradients |
| **Palette** | Each theme uses 4-6 dominant colors from its `ThemeColors` definition |
| **Texture** | Subtle grain/stipple overlay for depth — never photorealistic noise |
| **Lighting** | Single light source per scene, strong contrast between lit and shadow areas |
| **Motifs** | Each theme has 2-3 recurring decorative motifs (see per-theme prompts) |
| **NO** | No text, no logos, no people, no recognizable IP, no photorealism |

---

## Required Assets Per Theme (🎨 Per-Theme)

Each theme directory (`public/assets/theme-{N}/`) needs these 11 files:

| Asset ID | Filename | Dimensions | Transparency | Description |
|----------|----------|------------|--------------|-------------|
| `Block1` | `block-1.png` | 544×544 | ✅ | Block size 1 sprite (1 cell) |
| `Block2` | `block-2.png` | 1088×544 | ✅ | Block size 2 sprite (2 cells wide) |
| `Block3` | `block-3.png` | 1632×544 | ✅ | Block size 3 sprite (3 cells wide) |
| `Block4` | `block-4.png` | 2176×544 | ✅ | Block size 4 sprite (4 cells wide) |
| `GridBg` | `grid-bg.png` | 320×400 | ❌ | Grid background surface |
| `GridFrame` | `grid-frame.png` | 380×460 | ✅ | Grid border/frame overlay |
| `Background` | `background.png` | 1080×1920 | ❌ | Full-screen background (portrait) |
| `LoadingBg` | `loading-bg.png` | 1080×1920 | ❌ | Loading screen background (portrait) |
| `Logo` | `logo.png` | 500×500 | ✅ | Game logo/icon |
| `DecoLeft` | `deco-left.png` | ~600×800 | ✅ | Left decorative element |
| `DecoRight` | `deco-right.png` | ~600×800 | ✅ | Right decorative element |
| `Map` | `map.png` | 1080×1920 | ❌ | Zone progression map (portrait) |
| `ThemeIcon` | `theme-icon.png` | 128×128 | ✅ | Theme selector icon |

**Total: 13 assets × 8 themes (3-10) = 104 images to generate**

### Global Assets (🌐 — shared, no per-theme generation)

| Asset | Filename | Dimensions | Notes |
|-------|----------|------------|-------|
| HUD bar | `hud-bar.png` | 360×40 | theme-1 serves all |
| Action bar | `action-bar.png` | 360×64 | theme-1 serves all |
| Bonus btn bg | `bonus-btn-bg.png` | 64×64 | theme-1 serves all |
| Stars | `star-filled.png`, `star-empty.png` | 24×24 | theme-1 serves all |
| Bonus icons | `bonus/*.png`, `bonus/*.svg` | Various | theme-1 serves all |
| Panels | `panels/panel-*.png` | 96×96 | ❌ Not yet created |
| Icons | `icons/icon-*.png` | 48×48 | ❌ Not yet created |
| Particles | `particles/particle-*.png` | 16×16 | ❌ Not yet created |

### Audio (All Complete ✅)

| Type | Files Per Theme | Notes |
|------|----------------|-------|
| SFX (7 effects) | `sounds/effects/*.mp3` | 🌐 Always loaded from theme-1 |
| Music (4 tracks) | `sounds/musics/{main,map,level,boss}.mp3` | 🎨 Loaded from zone theme |

---

## AI Generation Prompts

### Nano Banana Pro (Gemini 3 Pro Image) Aspect Ratios

Supported: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

Resolutions: `1K` (1024px base), `2K` (2048px base), `4K` (4096px base)

Blocks need 2:1, 3:1, 4:1 — none are natively supported. Generate at `1:1` and resize.

**Backgrounds are PORTRAIT (9:16)** — mobile-first. The renderer uses "cover" mode to handle all screen sizes (phones, tablets, desktop).

| Asset | Nano Banana Ratio | Resolution | Post-Process Target |
|-------|------------------|------------|---------------------|
| block-1 | `1:1` | 1K | 544×544 |
| block-2 | `1:1` | 1K | 1088×544 |
| block-3 | `1:1` | 1K | 1632×544 |
| block-4 | `1:1` | 1K | 2176×544 |
| grid-bg | `4:5` | 1K | 320×400 |
| grid-frame | `4:5` | 1K | 380×460 |
| background | `9:16` | 2K | 1080×1920 |
| loading-bg | `9:16` | 2K | 1080×1920 |
| logo | `1:1` | 1K | 500×500 |
| deco-left | `3:4` | 1K | ~600×800 |
| deco-right | `3:4` | 1K | ~600×800 |
| map | `9:16` | 2K | 1080×1920 |
| theme-icon | `1:1` | 1K | 128×128 |

### CRITICAL: Post-Processing is MANDATORY

Gemini often returns JPEG data (RGB, no alpha) even with `.png` extension. Always run:

```bash
npx tsx scripts/generate-assets.ts --post-process --theme theme-{N}
```

This converts JPEG→PNG (RGBA) and resizes to target dimensions automatically.

---

### Block Prompts

#### Block-1 (1:1 — generates directly)
```
Generate a square game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}.
Design: A single decorative emblem or symbol with {MOTIFS}. Centered in the frame.
The entire tile should be filled with the design — no empty space around it.
Transparent background (the tile shape itself should have transparency around its edges).
No text, no people, no letters.
Square format, 1:1 aspect ratio.
```

#### Block-2 (2:1 — needs crop)
```
Generate a wide rectangular game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}.
Design: A decorative horizontal panel with {MOTIFS}, exactly 2 units wide and 1 unit tall.
The design must be a WIDE HORIZONTAL RECTANGLE with aspect ratio 2:1 — twice as wide as it is tall.
Place the design as a horizontal strip in the CENTER of the canvas. The area above and below the strip must be completely empty/transparent.
Transparent background.
No text, no people, no letters.
Square canvas, 1:1 aspect ratio, but the art fills only the center horizontal band.
```

#### Block-3 (3:1 — needs crop)
```
Generate a very wide rectangular game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}.
Design: A decorative horizontal panel with {MOTIFS}, exactly 3 units wide and 1 unit tall.
The design must be a WIDE HORIZONTAL RECTANGLE with aspect ratio 3:1 — three times as wide as it is tall.
Place the design as a narrow horizontal strip in the CENTER of the canvas. The area above and below the strip must be completely empty/transparent.
Transparent background.
No text, no people, no letters.
Square canvas, 1:1 aspect ratio, but the art fills only the center horizontal band (⅓ of the height).
```

#### Block-4 (4:1 — needs crop)
```
Generate an extra-wide rectangular game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from this palette: {BLOCK_COLORS}.
Design: A decorative horizontal panel with {MOTIFS}, exactly 4 units wide and 1 unit tall.
The design must be a VERY WIDE HORIZONTAL RECTANGLE with aspect ratio 4:1 — four times as wide as it is tall.
Place the design as a thin horizontal strip in the CENTER of the canvas. The area above and below the strip must be completely empty/transparent.
Transparent background.
No text, no people, no letters.
Square canvas, 1:1 aspect ratio, but the art fills only the center horizontal band (¼ of the height).
```

#### Per-Theme Block Variables

| Theme | THEME_NAME | THEME_DESCRIPTION | BLOCK_COLORS | MOTIFS |
|-------|-----------|-------------------|--------------|--------|
| theme-3 | Easter Island | Mysterious volcanic island with ancient stone guardians | Neon green `#00FF88`, cyan `#00DDFF`, magenta `#FF00FF`, yellow `#FFFF00` | Stone moai faces, volcanic rock patterns, petroglyph carvings |
| theme-4 | Maya | Ancient jungle temple civilization with jade and gold | Emerald `#00E5A0`, turquoise `#00B4D8`, coral `#FF6F91`, gold `#FFC947` | Jade serpent glyphs, stepped pyramid patterns, feathered serpent motifs |
| theme-5 | Cyberpunk | Enchanted ancient forest with golden mystical light | Soft green `#66BB6A`, sky blue `#42A5F5`, purple `#AB47BC`, amber `#FFCA28` | Leaf veins, bark rings, moss patches, glowing runes |
| theme-6 | Medieval | Stone castle fortress with iron and fire | Copper `#E07B39`, crimson `#D4463B`, forest green `#3D9970`, gold `#E8C547` | Shield crests, iron rivets, stone brick patterns, sword motifs |
| theme-7 | Ancient Egypt | Golden desert kingdom with mystical hieroglyphs | Turquoise `#40E0D0`, cobalt `#5B9BD5`, lavender `#B070D0`, sand gold `#F0C060` | Hieroglyphs, scarab beetles, lotus flowers, Eye of Horus |
| theme-8 | Volcano | Volcanic forge with obsidian and molten lava | Molten orange `#FF6600`, crimson `#FF2222`, amber `#FFAA00`, hot pink `#FF4488` | Obsidian shards, lava cracks, ember glow, volcanic rock |
| theme-9 | Tribal | Earthy savanna with painted ritual stones | Sage green `#7DCEA0`, sky blue `#85C1E9`, lavender `#D7BDE2`, sunflower `#F9E154` | Painted patterns, drum motifs, feather marks, tribal symbols |
| theme-10 | Arctic | Frozen steampunk tundra with brass machinery | Copper `#B87333`, brass gold `#C5A050`, olive `#6B8E23`, rust red `#CC5544` | Rusted gears, leather straps, brass fittings, ice crystals |

### Background & Loading Screen

```
Generate a full-screen background illustration for a mobile puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Scene: {SCENE_DESCRIPTION}
Style: Digital illustration with layered silhouettes, atmospheric depth, subtle grain texture.
Composition: PORTRAIT orientation (9:16 tall mobile screen). Vertical depth: bottom third is darker foreground, middle third is the main scene, top third is sky/atmosphere.
Mood: {MOOD}. Rich, immersive, inviting.
Color palette: gradient from {GRADIENT_START} to {GRADIENT_END} with accent colors {ACCENTS}.
No text, no UI elements, no people, no recognizable characters.
Output must be PNG format. No transparency needed — fully opaque scene.
```

**Gemini config:** `aspectRatio: "9:16"`, `imageSize: "2K"` → post-process resizes to 1080×1920.

| Theme | Scene | Mood |
|-------|-------|------|
| Easter Island | Volcanic island at night, giant moai statues silhouetted against starry sky, bioluminescent tide pools | Mysterious, eerie |
| Maya | Deep jungle with ancient stepped temple in background, jade-green canopy, misty waterfalls | Adventurous, lush |
| Cyberpunk | Ancient forest clearing at golden hour, towering trees with moss, forest floor with ferns | Serene, enchanted |
| Medieval | Castle courtyard at sunset, stone walls with torches, distant towers, iron portcullis | Epic, warm |
| Ancient Egypt | Desert at twilight, golden pyramids with hieroglyph-covered obelisks, Nile river reflecting sky | Majestic, mystical |
| Volcano | Volcanic forge interior, rivers of lava flowing between obsidian platforms, ember-filled sky | Intense, dramatic |
| Tribal | Savanna at dawn, ritual stone circle, painted rocks, wildflowers, distant acacia trees | Earthy, spiritual |
| Arctic | Frozen tundra under aurora borealis, ice crystal formations, brass mechanical structures half-buried in snow | Cold, wondrous |

### Logo

```
Generate a game logo icon for a puzzle game.
Theme: {THEME_NAME}
Design: An isometric cube or geometric shape with the theme's motifs on its visible faces.
Style: Bold black outlines, cel-shading, glossy highlights, centered.
Motifs: {MOTIFS} carved/painted/etched on the cube faces.
Colors: {ACCENT_COLOR} as primary with {SECONDARY_COLORS} for shading.
Transparent background — only the cube/shape, nothing else.
Square format, 1:1 aspect ratio. No text, no letters.
```

**Gemini config:** `aspectRatio: "1:1"`, `imageSize: "1K"` → resize output to 500×500.

### Grid Background

```
Generate a subtle background texture for a game grid area (8 columns × 10 rows puzzle board).
Theme: {THEME_NAME}
Style: Muted, low-contrast surface material — {MATERIAL} texture.
Color: Base fill {GRID_BG_COLOR} with subtle {GRID_CELL_ALT_COLOR} variation.
Should read as a flat surface the blocks sit on. No grid lines (drawn in code). No decorations.
Portrait rectangle (4:5 aspect ratio). Fully opaque, no transparency.
```

**Gemini config:** `aspectRatio: "3:4"` (closest to 4:5) → resize output to 320×400.

| Theme | Material | Grid BG Color |
|-------|----------|---------------|
| Easter Island | Dark volcanic basalt with faint glow veins | `#0D0D22` |
| Maya | Deep ocean-floor stone with turquoise tint | `#0C2D4A` |
| Cyberpunk | Dark mossy wood bark | `#1E3E1E` |
| Medieval | Weathered sandstone with grain | `#9E7E5A` |
| Ancient Egypt | Cool blue-grey slate | `#A8C8D8` |
| Volcano | Cracked obsidian with faint ember glow | `#1E0E0E` |
| Tribal | Rose-tinted clay with faint texture | `#F0D0E0` |
| Arctic | Dark worn leather with brass patina | `#30241A` |

### Grid Frame

```
Generate a decorative border/frame for a game grid area.
Theme: {THEME_NAME}
Style: An ornamental rectangular frame, open center (the center is where the game board goes).
Material: {FRAME_MATERIAL}
The frame is slightly larger than the grid — it wraps around the play area.
Portrait rectangle (approximately 4:5 aspect ratio). Transparent center and transparent outer area.
Only the frame border itself should be visible.
No text, no people.
```

**Gemini config:** `aspectRatio: "3:4"` → resize to 380×460.

### Decoratives (Left/Right)

```
Generate a decorative side element for a mobile game screen.
Theme: {THEME_NAME}
Content: {DECO_DESCRIPTION}
Style: Silhouetted foreground element, partially transparent, dark tones with theme accent highlights.
Composition: Tall portrait format (3:4). Element anchored to the {LEFT/RIGHT} edge, fading to transparency on the opposite side.
PNG with transparency. No text, no people.
```

**Gemini config:** `aspectRatio: "3:4"` → resize to ~600×800.

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

## Post-Processing Pipeline

**MANDATORY after every generation run.** Do NOT skip any step.

### Step 1: Verify Format

```bash
# Must say "PNG image data" for every file
file mobile-app/public/assets/theme-{N}/*.png
```

If any file says "JPEG image data":
```bash
# Convert JPEG-as-PNG to actual PNG
python3 -c "
from PIL import Image
img = Image.open('broken.png')
img = img.convert('RGBA')
img.save('fixed.png', 'PNG')
"
```

### Step 2: Add Transparency (if needed)

For assets that require transparency (blocks, logo, deco, grid-frame):
```bash
# Remove white/near-white background
python3 -c "
from PIL import Image
import numpy as np
img = Image.open('input.png').convert('RGBA')
arr = np.array(img)
# Make near-white pixels transparent
white_mask = (arr[:,:,0] > 240) & (arr[:,:,1] > 240) & (arr[:,:,2] > 240)
arr[white_mask, 3] = 0
Image.fromarray(arr).save('output.png')
"
```

### Step 3: Crop Wide Blocks (block-2, block-3, block-4)

These were generated as 1:1 canvases with the design in a horizontal strip:
```bash
python3 -c "
from PIL import Image
import numpy as np

img = Image.open('block-2-raw.png').convert('RGBA')
arr = np.array(img)

# Find non-transparent rows
alpha = arr[:,:,3]
row_has_content = alpha.max(axis=1) > 10
rows = np.where(row_has_content)[0]

if len(rows) > 0:
    top, bottom = rows[0], rows[-1]
    pad = max(5, (bottom - top) // 20)
    top = max(0, top - pad)
    bottom = min(arr.shape[0], bottom + pad)
    cropped = img.crop((0, top, img.width, bottom))
else:
    cropped = img

# Resize: block-2=1088x544, block-3=1632x544, block-4=2176x544
cropped = cropped.resize((1088, 544), Image.LANCZOS)
cropped.save('block-2.png')
"
```

### Step 4: Resize to Target Dimensions

```bash
python3 -c "
from PIL import Image

resizes = {
    'block-1.png': (544, 544),
    'grid-bg.png': (320, 400),
    'grid-frame.png': (380, 460),
    'background.png': (1456, 816),
    'loading-bg.png': (1456, 816),
    'logo.png': (500, 500),
}

theme = 'theme-4'
base = f'mobile-app/public/assets/{theme}'

for name, (w, h) in resizes.items():
    try:
        img = Image.open(f'{base}/{name}')
        if img.size != (w, h):
            img = img.resize((w, h), Image.LANCZOS)
            img.save(f'{base}/{name}')
            print(f'  Resized {name} to {w}x{h}')
        else:
            print(f'  {name} already correct')
    except FileNotFoundError:
        print(f'  {name} MISSING')
"
```

### Step 5: Final Verification

Run the verification script from the "Verification Commands" section above. **ALL checks must pass.**

---

## Directory Structure

```
public/assets/theme-{N}/
├── background.png         1080×1920  portrait, opaque
├── loading-bg.png         1080×1920  portrait, opaque
├── logo.png                 500×500  transparent bg
├── grid-bg.png              320×400  opaque
├── grid-frame.png           380×460  transparent
├── block-1.png              544×544  transparent bg
├── block-2.png             1088×544  transparent bg
├── block-3.png             1632×544  transparent bg
├── block-4.png             2176×544  transparent bg
├── deco-left.png           ~600×800  transparent
├── deco-right.png          ~600×800  transparent
├── map.png                1080×1920  portrait
├── theme-icon.png           128×128  transparent
└── sounds/                            (already complete for all themes)
    ├── effects/
    │   ├── break.mp3
    │   ├── explode.mp3
    │   ├── move.mp3
    │   ├── new.mp3
    │   ├── start.mp3
    │   ├── swipe.mp3
    │   └── over.mp3
    └── musics/
        ├── main.mp3
        ├── map.mp3
        ├── level.mp3
        └── boss.mp3
```

## Total Per-Theme Asset Count

| Category | Count |
|----------|-------|
| Blocks | 4 |
| Grid (bg + frame) | 2 |
| Backgrounds (bg + loading) | 2 |
| Logo | 1 |
| Decoratives (left + right) | 2 |
| Map | 1 |
| Theme icon | 1 |
| **Total visual assets** | **13** |
| Sound effects (shared) | 7 |
| Music tracks | 4 |
| **Total all** | **24 files** |

---

## Color Palettes

Each theme has a full color palette defined in `mobile-app/src/pixi/utils/colors.ts`:

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

## 9-Slice Borders Reference (for panels/buttons — Global assets)

| Asset Type | Left | Top | Right | Bottom |
|------------|------|-----|-------|--------|
| Panels | 24px | 24px | 24px | 24px |
| Buttons | 16px | 16px | 16px | 16px |
| Icon buttons | 12px | 12px | 12px | 12px |
