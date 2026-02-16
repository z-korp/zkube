# zKube — Complete Asset Reference

Single source of truth for every visual, audio, and generated asset in the game. Covers inventory, AI generation prompts, post-processing pipeline, audio production, and the progression map.

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

## Theme Reference

Source of truth: `mobile-app/src/pixi/utils/colors.ts`

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
| **Motifs** | Each theme has 2-3 recurring decorative motifs (see per-theme prompts) |
| **NO** | No logos, no people, no recognizable IP, no photorealism |

### Reference Style

Theme-1 (Tiki) and Theme-2 (Cosmic) establish the baseline:
- **Background** (1080x1920): Illustrated portrait landscape with layered silhouettes, atmospheric depth
- **Blocks** (256x256 per cell): Emblem-style tile with bold black shapes, 2-3 color tones, subtle texture overlay
- **Logo** (512x512): "zKube" text with theme motifs and isometric cube element
- **Grid frame** (576x720): Simple material-colored border panel
- **UI chrome** (360x40/64): Horizontal bars with subtle bevel/shadow

---

## Asset Classification

An asset is **🌐 Global** when:
- It serves a functional/UI purpose (navigation, indicators)
- Its appearance doesn't change the gameplay feel

An asset is **🎨 Per-theme** when:
- It defines the theme's visual identity
- It's visible during core gameplay
- A generic version would break immersion

---

## Chromakey Green Transparency Pipeline

### Why Chromakey Green?

**Gemini cannot generate native transparent PNGs.** All outputs have solid backgrounds. We use chromakey green (#00FF00) and strip it in post-processing.

### Model Details

- **Model:** `gemini-3-pro-image-preview` (codename "Nano Banana Pro")
- **Max Resolution:** 2048x2048
- **Aspect Ratios:** 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- **Resolutions:** 1K (1024px), 2K (2048px), 4K (4096px)
- **Output Format:** Always JPEG (even if PNG requested)

### Transparency Classification

**Needs chromakey green removal:** Blocks, Logo, Grid Frame, Theme Icon, Icons, Particles, Panels

**Opaque (no stripping):** Background, Loading BG, Grid BG, Map

### Post-Processing Pipeline

1. **JPEG to PNG** — Gemini always returns JPEG
2. **Green Despill** — Suppress excess green from ALL pixels: `G_new = G - 0.9 * max(G - max(R,B), 0)`
3. **Green Mask** — Detection: `G > 80 AND R < 220 AND B < 220 AND G > R*1.2 AND G > B*1.2`
4. **Alpha Matte** — Dilate mask by 3px, gaussian blur sigma=1.0 for soft edges
5. **Center-Crop** — For multi-cell blocks: crop center strip at target aspect ratio
6. **Resize** — Scale to target dimensions

### Prompt Suffix (transparency assets)

```
Background: Solid chromakey green (#00FF00, RGB 0,255,0).
The green will be removed in post-processing to create transparency.
```

---

# VISUAL ASSETS — PER-THEME

---

## 1. Blocks — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Block1` | `block-1.png` | 256x256 | ✅ theme-4 / ❌ all others |
| `Block2` | `block-2.png` | 512x256 | ✅ theme-4 / ❌ all others |
| `Block3` | `block-3.png` | 768x256 | ✅ theme-4 / ❌ all others |
| `Block4` | `block-4.png` | 1024x256 | ✅ theme-4 / ❌ all others |

**Generation:** 4 x 9 themes = **36 images**. Generate at 1:1 1K, center-crop to target aspect ratio, resize.

**Prompt template (block-1):**
```
Generate a square game tile texture for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, 2-3 color tones from palette: {BLOCK_COLORS}.
Design: A single decorative emblem with {MOTIFS}. Centered. Filled.
Background: Solid chromakey green (#00FF00). No text, no people.
```

**Prompt template (block-2/3/4 — crop from 1:1):**
```
Generate a wide game tile ({WIDTH} cells wide, 1 tall) for a puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Style: Bold black outlines, cel-shaded, palette: {BLOCK_COLORS}.
Design: Horizontal panel with {MOTIFS}, aspect ratio {WIDTH}:1.
Place as horizontal strip in CENTER of square canvas. Empty above/below.
Background: Solid chromakey green (#00FF00). No text, no people.
```

### Per-Theme Block Variables

| Theme | THEME_NAME | THEME_DESCRIPTION | BLOCK_COLORS | MOTIFS |
|-------|-----------|-------------------|--------------|--------|
| theme-3 | Easter Island | Mysterious volcanic island with ancient stone guardians | `#00FF88`, `#00DDFF`, `#FF00FF`, `#FFFF00` | Stone moai faces, volcanic rock patterns, petroglyph carvings |
| theme-4 | Maya | Ancient jungle temple civilization with jade and gold | `#00E5A0`, `#00B4D8`, `#FF6F91`, `#FFC947` | Jade serpent glyphs, stepped pyramid patterns, feathered serpent motifs |
| theme-5 | Cyberpunk | Enchanted ancient forest with golden mystical light | `#66BB6A`, `#42A5F5`, `#AB47BC`, `#FFCA28` | Leaf veins, bark rings, moss patches, glowing runes |
| theme-6 | Medieval | Stone castle fortress with iron and fire | `#E07B39`, `#D4463B`, `#3D9970`, `#E8C547` | Shield crests, iron rivets, stone brick patterns, sword motifs |
| theme-7 | Ancient Egypt | Golden desert kingdom with mystical hieroglyphs | `#40E0D0`, `#5B9BD5`, `#B070D0`, `#F0C060` | Hieroglyphs, scarab beetles, lotus flowers, Eye of Horus |
| theme-8 | Volcano | Volcanic forge with obsidian and molten lava | `#FF6600`, `#FF2222`, `#FFAA00`, `#FF4488` | Obsidian shards, lava cracks, ember glow, volcanic rock |
| theme-9 | Tribal | Earthy savanna with painted ritual stones | `#7DCEA0`, `#85C1E9`, `#D7BDE2`, `#F9E154` | Painted patterns, drum motifs, feather marks, tribal symbols |
| theme-10 | Arctic | Frozen steampunk tundra with brass machinery | `#B87333`, `#C5A050`, `#6B8E23`, `#CC5544` | Rusted gears, leather straps, brass fittings, ice crystals |

---

## 2. Background — 🎨 Per-Theme

Portrait orientation (9:16), mobile-first, rendered in "cover" mode.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Background` | `background.png` | 1080x1920 | ✅ theme-4 / ❌ all others |
| `LoadingBg` | `loading-bg.png` | 1080x1920 | ✅ theme-4 / ❌ all others |

**Generation:** 2 x 9 = **18 images**. Config: `9:16`, `2K`.

**Prompt template:**
```
Full-screen background for a mobile puzzle game.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}. Scene: {SCENE_DESCRIPTION}
PORTRAIT (9:16). Layered depth: dark foreground bottom, main scene middle, sky top.
Mood: {MOOD}. Palette: {GRADIENT}. Opaque fill. No text, no people.
```

| Theme | Scene | Mood |
|-------|-------|------|
| Easter Island | Volcanic island at night, moai silhouettes, bioluminescent pools | Mysterious, eerie |
| Maya | Deep jungle, stepped temple, jade canopy, misty waterfalls | Adventurous, lush |
| Cyberpunk | Forest clearing at golden hour, towering trees with moss | Serene, enchanted |
| Medieval | Castle courtyard at sunset, torches, towers, iron portcullis | Epic, warm |
| Ancient Egypt | Desert twilight, golden pyramids, obelisks, Nile reflection | Majestic, mystical |
| Volcano | Volcanic forge, lava rivers, obsidian platforms, ember sky | Intense, dramatic |
| Tribal | Savanna dawn, ritual stone circle, wildflowers, acacia trees | Earthy, spiritual |
| Arctic | Frozen tundra, aurora borealis, ice crystals, brass structures | Cold, wondrous |

---

## 3. Logo — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Logo` | `logo.png` | 512x512 | ✅ theme-4 / ❌ all others |

**Generation:** 9 images. Config: `1:1`, `1K`.

**Prompt template:**
```
Game logo for "zKube" puzzle game.
Theme: {THEME_NAME}
Design: The text "zKube" in a bold stylized font decorated with {THEME_NAME} elements.
Letters integrated with theme motifs: {MOTIFS}.
Include a small isometric cube with cultural motifs below/around the text.
Style: Bold outlines, cel-shading, accent color {ACCENT_COLOR}, glossy highlights.
Text must be clearly readable. Theme elements enhance but don't obscure.
Square format. Chromakey green (#00FF00) background.
```

---

## 4. Grid & Frame — 🎨 Per-Theme

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `GridBg` | `grid-bg.png` | 512x640 | ✅ theme-4 / ❌ all others |
| `GridFrame` | `grid-frame.png` | 576x720 | ✅ theme-4 / ❌ all others |

**Generation:** 2 x 9 = **18 images**. Config: `4:5`, `1K`.

**Grid-bg materials:**

| Theme | Material | Color |
|-------|----------|-------|
| Easter Island | Dark volcanic basalt with faint glow veins | `#0D0D22` |
| Maya | Deep ocean-floor stone with turquoise tint | `#0C2D4A` |
| Cyberpunk | Dark mossy wood bark | `#1E3E1E` |
| Medieval | Weathered sandstone with grain | `#9E7E5A` |
| Ancient Egypt | Cool blue-grey slate | `#A8C8D8` |
| Volcano | Cracked obsidian with faint ember glow | `#1E0E0E` |
| Tribal | Rose-tinted clay with faint texture | `#F0D0E0` |
| Arctic | Dark worn leather with brass patina | `#30241A` |

---

## 5. Map — 🎨 Per-Theme

Super Mario World-style progression map background.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `Map` | `map.png` | 1080x1920 | ✅ theme-4 / ❌ all others |

**Generation:** 10 images. Config: `9:16`, `2K`.

### Map Structure

**5 zones x 11 nodes = 55 total** (50 gameplay + 5 shops):

| Per Zone | Type | Count |
|----------|------|-------|
| Classic | Gameplay levels | 9 |
| Shop | Non-gameplay stop | 1 |
| Boss | Boss level | 1 |

S-curve winding path from bottom to top. Zone themes seeded from VRF (Fisher-Yates shuffle of 10 themes, pick 5).

**Prompt template:**
```
Top-down illustrated map for a game progression screen.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}
PORTRAIT (9:16). Winding S-curve path from bottom to top.
11 platform locations: 9 small level platforms, 1 shop landmark, 1 large boss arena at top.
Path meanders with 2-3 switchbacks. Themed terrain fills surrounding space.
Mood: Adventurous. Palette: {MAP_COLORS}. Opaque fill. No text, no people.
```

---

## 6. Theme Icon — 🎨 Per-Theme

Small icon for the settings page theme selector.

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `ThemeIcon` | `theme-icon.png` | 128x128 | ❌ all themes |

**Generation:** 10 images (all themes). Config: `1:1`, `1K`.

**Prompt template:**
```
Small square icon representing the "{THEME_NAME}" theme for a game settings menu.
Theme: {THEME_NAME} ({ICON})
Design: A single iconic symbol that instantly communicates the theme.
Most recognizable element from: {MOTIFS}.
Style: Bold silhouette, white fill. Thick strokes. Clean at 48x48.
Centered. Square. Chromakey green (#00FF00) background.
```

---

# VISUAL ASSETS — GLOBAL

---

## 7. UI Chrome — 🌐 Global

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `HudBar` | `common/ui/hud-bar.png` | 360x40 | ✅ |
| `ActionBar` | `common/ui/action-bar.png` | 360x64 | ✅ |
| `BonusBtnBg` | `common/ui/bonus-btn-bg.png` | 64x64 | ✅ |
| `StarFilled` | `common/ui/star-filled.png` | 24x24 | ✅ |
| `StarEmpty` | `common/ui/star-empty.png` | 24x24 | ✅ |
| `Loader` | `common/ui/loader.svg` | vector | ✅ |

---

## 8. Bonus Icons — 🌐 Global

| Asset ID | Filename | Dimensions | Status |
|----------|----------|------------|--------|
| `BonusCombo` | `common/bonus/combo.png` | 256x256 | ✅ |
| `BonusScore` | `common/bonus/score.png` | 256x256 | ✅ |
| `BonusHarvest` | `common/bonus/harvest.png` | 256x256 | ✅ |
| `BonusWave` | `common/bonus/wave.svg` | vector | ✅ |
| `BonusSupply` | `common/bonus/supply.svg` | vector | ✅ |

---

## 9. 9-Slice Panels — 🌐 Global (❌ ALL MISSING)

| Asset ID | Filename | Borders | Status |
|----------|----------|---------|--------|
| `PanelWood` | `common/panels/panel-wood.png` | 24px | ❌ |
| `PanelDark` | `common/panels/panel-dark.png` | 24px | ❌ |
| `PanelLeaf` | `common/panels/panel-leaf.png` | 24px | ❌ |
| `PanelGlass` | `common/panels/panel-glass.png` | 24px | ❌ |

**Specs:** 96x96px. 24px border = 48x48 stretchable center.

| Panel | Material | Edge Style |
|-------|----------|------------|
| Wood | Warm brown wood planks | Carved frame with nail studs |
| Dark | Dark slate/iron | Metallic border with rivets |
| Leaf | Green plant matter | Vine-wrapped edges with leaves |
| Glass | Frosted glass | Bright border, translucent center |

### 9-Slice Border Reference

| Type | Left | Top | Right | Bottom |
|------|------|-----|-------|--------|
| Panels | 24px | 24px | 24px | 24px |
| Buttons | 16px | 16px | 16px | 16px |
| Icon buttons | 12px | 12px | 12px | 12px |

---

## 10. Buttons — 🌐 Global (NO GENERATION NEEDED)

100% procedural — drawn with PixiGraphics.

---

## 11. Icons — 🌐 Global (❌ ALL MISSING)

48x48px, white fill on transparent. Tinted in code.

| Asset ID | Filename | Replaces |
|----------|----------|----------|
| `IconStarFilled` | `common/icons/icon-star-filled.png` | star emoji |
| `IconStarEmpty` | `common/icons/icon-star-empty.png` | star outline |
| `IconCube` | `common/icons/icon-cube.png` | ice emoji |
| `IconCrown` | `common/icons/icon-crown.png` | crown emoji |
| `IconFire` | `common/icons/icon-fire.png` | fire emoji |
| `IconScroll` | `common/icons/icon-scroll.png` | scroll emoji |
| `IconShop` | `common/icons/icon-shop.png` | cart emoji |
| `IconTrophy` | `common/icons/icon-trophy.png` | trophy emoji |
| `IconMenu` | `common/icons/icon-menu.png` | hamburger text |
| `IconClose` | `common/icons/icon-close.png` | X text |
| `IconSettings` | `common/icons/icon-settings.png` | gear emoji |
| `IconLock` | `common/icons/icon-lock.png` | lock emoji |
| `IconMusic` | `common/icons/icon-music.png` | note emoji |
| `IconSound` | `common/icons/icon-sound.png` | speaker emoji |

**Generation:** 14 images.

---

## 12. Particles — 🌐 Global (❌ ALL MISSING)

16x16px, white on transparent. Tinted by `ThemeColors.particles`.

| Particle | Shape |
|----------|-------|
| Spark | 4-pointed star burst |
| Leaf | Simple leaf silhouette |
| Flower | 5-petal flower |
| Star | 5-pointed star |

**Generation:** 4 images.

---

## 13. Shared Icons (Existing ✅)

At `public/assets/common/icons/`: icon-moves, icon-score, icon-cube, icon-level, icon-surrender.

---

## 14. Miscellaneous (Existing ✅)

Chests (`chests/c1-c10.png`), Trophies (`trophies/*.png`), NFT images, Lords token icon.

---

# AUDIO — SOUND EFFECTS

---

## 15. Sound Effects — 🌐 Global (All Complete ✅)

All SFX shared from `common/sounds/effects/`.

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `SfxBreak` | `break.mp3` | Line cleared |
| `SfxExplode` | `explode.mp3` | Multi-line combo |
| `SfxMove` | `move.mp3` | Block moved |
| `SfxNew` | `new.mp3` | New blocks spawned |
| `SfxStart` | `start.mp3` | Game started |
| `SfxSwipe` | `swipe.mp3` | Block swiped |
| `SfxOver` | `over.mp3` | Game over |

### How to Generate SFX with Suno

Use **Suno v5 Sounds mode** (not the music mode):

1. Switch to **Sounds** tab (top toggle: Simple / **Sounds**)
2. Set Advanced Options: Type = **One-Shot**, BPM = Auto, Key = Any
3. Paste the prompt into the "Describe the sound you want" field
4. Download generated audio, trim tight, normalize to **-12 LUFS**, export MP3 192kbps

### Global SFX Generation Prompts

SFX are shared across all themes — a single set stored in `common/sounds/effects/`. These prompts are theme-neutral, focusing on the game action.

| Effect | Duration | Suno Sounds Prompt |
|--------|----------|-----|
| break | 0.3-0.5s | Short bright impact with crystalline shimmer tail. A satisfying snap-crack of puzzle pieces breaking apart. Quick attack, fast decay. |
| explode | 0.5-0.8s | Rapid cascade of impacts building to an energy burst. Multiple elements scattering outward. Brief triumphant flourish at peak. Deep bass punctuation. |
| move | 0.15-0.25s | Quick smooth slide with subtle friction texture. Soft click as piece locks into position. Clean and responsive. |
| new | 0.3-0.4s | Ascending three-note chime cascade. Elements materializing and clicking into place. Bright and inviting. |
| start | 0.5-0.8s | Energetic fanfare burst with percussive hits. Confident, punchy game-start signal. Rising energy into a bright accent. |
| swipe | 0.15-0.2s | Quick airy whoosh. Short directional air displacement with subtle texture. Fast and light. |
| over | 0.8-1.2s | Deep resonant impact. Slow descending tones with fading reverb. Finality without harshness. |

---

# AUDIO — MUSIC

---

## 16. Music Tracks — 🎨 Per-Theme (All Complete ✅)

4 tracks x 10 themes = 40 files. Stored at `{themeId}/sounds/musics/`.

| Asset ID | Filename | When Played |
|----------|----------|-------------|
| `MusicMain` | `main.mp3` | Home screen |
| `MusicMap` | `map.mp3` | Progression map |
| `MusicLevel` | `level.mp3` | Gameplay |
| `MusicBoss` | `boss.mp3` | Boss levels |

### How to Generate with Suno

1. Toggle **Custom** mode ON
2. Paste prompt into "Style of Music" field
3. Put `[Instrumental]` in "Lyrics" field
4. 2 outputs per prompt: **Menu prompt** -> main.mp3 + map.mp3, **Gameplay prompt** -> level.mp3 + boss.mp3

### Theme 1: Tiki

**Menu:**
```
A laid-back tropical lo-fi instrumental with soft ukulele fingerpicking over warm steel drum chords and gentle bongo percussion. Light marimba accents shimmer through a haze of ocean breeze ambience. The tempo sits easy around 95 BPM, evoking wooden beach huts, swaying palms, and golden hour light filtering through bamboo. Calming and inviting, like a puzzle waiting on a sunlit porch.
```

**Gameplay:**
```
An upbeat island funk instrumental driven by a playful ukulele riff and tight djembe percussion. Kalimba runs sparkle over a steel drum melody that's catchy without being distracting, while shakers keep a steady groove underneath. Around 115 BPM, the energy stays focused and rhythmic — Polynesian puzzle-solving music that makes you nod along as you think, balancing tropical warmth with forward momentum.
```

### Theme 2: Cosmic

**Menu:**
```
A dreamy space ambient instrumental with lush analog synth pads drifting like nebula clouds. A gentle arpeggiator twinkles like distant stars over soft sub-bass warmth, while reverb-soaked bell tones float weightlessly. Around 80 BPM, retro-futuristic and serene — the feeling of drifting through a purple-pink star field, vast and quiet, with nothing but the hum of the cosmos and a sense of infinite possibility.
```

**Gameplay:**
```
A mid-tempo synthwave instrumental with a pulsing bassline driving forward under shimmering arpeggiated synths and crisp electronic drums. A melodic lead synth glides and soars through the mix, propulsive and luminous, like navigating through an asteroid field at speed. Sidechained pads breathe in and out around 110 BPM, keeping the energy focused and determined without ever getting heavy.
```

### Theme 3: Easter Island

**Menu:**
```
A mysterious retro-futuristic instrumental blending ancient atmosphere with neon synthwave. A haunting stone flute melody floats over warm analog synth pads and a slow, ritualistic drum pattern. Deep reverb creates vast open space, like standing among giant moai statues at dusk while neon arpeggios glimmer faintly in the distance. Around 85 BPM, otherworldly and contemplative — ancient mystery refracted through an 80s synth lens.
```

**Gameplay:**
```
A driving retro synthwave instrumental with punchy bass synth over tight electronic drums and bright neon arpeggios in a minor key. Quick percussive hits click like volcanic rocks while a low drone rumbles underneath like distant volcanic activity. 118 BPM and relentless, the mood is neon noir — solving puzzles under the watchful gaze of stone giants, electric and mysterious, with tension built into every measure.
```

### Theme 4: Maya

**Menu:**
```
An atmospheric Mesoamerican instrumental with a wooden pan flute melody floating over gentle rain stick textures and soft clay drum rhythm. Lush jungle ambience fills the space — distant bird calls, rustling canopy, warm humid air. Bass notes settle like stepping into a jade-walled temple deep in the overgrown ruins. Reverb-soaked and meditative around 85 BPM, mysterious but inviting, sacred and ancient.
```

**Gameplay:**
```
An energetic Latin world music instrumental driven by quick wooden marimba patterns and rattling seed shakers over tight hand drum rhythms. A pan flute melody weaves through in a pentatonic scale, punctuated by deep, growling bass notes. The percussion is layered and propulsive — 120 BPM of focused jungle energy, ritualistic yet playful, like a temple ceremony where every move counts.
```

### Theme 5: Cyberpunk

**Menu:**
```
A moody cyberpunk instrumental with warm, detuned analog synth chords and slow jazzy electric piano licks drifting over a laid-back hip-hop beat. Deep 808 sub-bass hums beneath lo-fi vinyl crackle while neon signs buzz faintly in the background and rain patters on city streets. Around 80 BPM, noir and nocturnal — a late-night puzzle session in a rain-soaked cyber cafe, all purple shadows and amber streetlight.
```

**Gameplay:**
```
A slick cyberpunk electronic instrumental with a driving bassline, crisp trap hi-hats, and snappy snare. Glitchy arpeggiated synths cascade like digital rain while pitch-bent lead stabs cut through filtered pads that rise and fall. 120 BPM, focused and calculated — hacking through the matrix one block at a time, every beat precise, every synth line purposeful, electric and forward-moving.
```

### Theme 6: Medieval

**Menu:**
```
A warm medieval tavern instrumental with gentle lute fingerpicking and a soft hurdy-gurdy drone underneath. A quiet bodhran keeps gentle time while Celtic harp arpeggios add touches of magic. The atmosphere is all crackling fireplaces and candlelit stone walls — nostalgic and comforting around 90 BPM, like resting at a roadside inn between adventures, a mug of mead in hand.
```

**Gameplay:**
```
An upbeat medieval folk rock instrumental with lively lute strumming driving the rhythm alongside a bodhran beat and bright tin whistle melody. Quick pizzicato strings add bounce while an occasional trumpet fanfare accents the peaks. 125 BPM, spirited and adventurous — a knight's training montage in the castle armory, determined and gallant, every move building toward something greater.
```

### Theme 7: Ancient Egypt

**Menu:**
```
An elegant Egyptian instrumental with a soft oud melody and gentle darbuka hand drum pattern. Shimmering golden harp arpeggios cascade while a ney flute floats delicately over warm desert wind ambience. The scale is Arabic maqam Hijaz — regal and serene, around 85 BPM, like watching the sun set golden over the Nile from the steps of a sandstone temple, timeless and unhurried.
```

**Gameplay:**
```
A rhythmic Egyptian fusion instrumental with driving darbuka and riq tambourine groove over punchy bass oud. Quick kanun zither runs sparkle like desert sand in sunlight while a ney flute melody in Hijaz scale keeps the energy focused and exotic. Tight and groovy at 115 BPM — deciphering ancient hieroglyphs under the pharaoh's watchful gaze, confident and precise.
```

### Theme 8: Volcano

**Menu:**
```
A dark volcanic ambient instrumental with deep rumbling sub-bass like magma flowing underground. Slow metallic percussion — anvil strikes and chain rattles — rings out over warm distorted drones with ember-like high-frequency crackle. Ominous but hypnotic around 75 BPM, like standing at the edge of a volcanic caldera at night, watching the glow pulse beneath black rock, primordial and smoldering.
```

**Gameplay:**
```
A driving industrial metal instrumental with heavy bass pulse and metallic percussion hammering on beat like a forge at full capacity. A distorted guitar-like synth chugs in rhythmic lockstep with quick hi-hats and snappy rimshots while an ember-bright lead melody cuts through the heat. 125 BPM of relentless forward momentum — forging blocks in the heart of the mountain, fiery and powerful.
```

### Theme 9: Tribal

**Menu:**
```
A warm organic tribal instrumental with soft djembe hand drumming and a gentle kalimba melody that rings clear and bright. Shaker and rain stick textures layer underneath warm acoustic bass plucks while a breathy wooden flute adds softness. Earthy and grounding around 90 BPM — like sitting around a campfire as twilight settles, the air still warm, the rhythm of the earth steady beneath you.
```

**Gameplay:**
```
A groovy Afrobeat instrumental with tight djembe and dunun in polyrhythmic lockstep. Funky kalimba riffs dance over the top while quick shaker patterns and hand clapping weave through talking drum accents. Bouncy and energetic with deep pocket at 120 BPM — a village celebration in full swing, joyful and rhythmic, every hit landing exactly where it should.
```

### Theme 10: Arctic

**Menu:**
```
A serene arctic ambient instrumental with crystalline bell tones shimmering like northern lights overhead. A soft bowed string drone hums underneath a gentle, sparse piano melody — contemplative and unhurried. Wind ambience whispers through with ice crystal tinkling at the edges. Around 75 BPM, vast and frozen, like standing alone on an endless tundra watching the aurora ripple in silence.
```

**Gameplay:**
```
A crisp Nordic folk electronic instrumental with staccato strings and a tight electronic drum beat driving forward. A bright folk fiddle melody sings over pulsing bass while quick plucked kantele accents add sparkle. Snappy and precise at 115 BPM, like cracking ice — cool-toned but warm at its core, determined and brisk, racing across frozen blocks before they shift beneath you.
```

---

## Audio Post-Production

### Music
- Download MP3 from Suno (2 per prompt)
- Trim silence, crossfade last 2-3s into first 2-3s for looping
- Normalize to **-14 LUFS**
- Assign: Menu prompt -> main.mp3 + map.mp3, Gameplay prompt -> level.mp3 + boss.mp3

### SFX
- Trim tight — no leading/trailing silence
- Normalize to **-12 LUFS**
- MP3 192kbps

---

# GENERATION

---

## Generation Summary

### Per-Theme Visual (all 10 themes, theme-4 already done)

| Category | Per Theme | Total (9 remaining) |
|----------|-----------|---------------------|
| Blocks | 4 | 36 |
| Background + Loading BG | 2 | 18 |
| Logo | 1 | 9 |
| Grid BG + Frame | 2 | 18 |
| **Subtotal** | **9** | **81** |

### Maps (all 10 themes, theme-4 already done): **9 images**

### Theme Icons (all 10 themes): **10 images**

### Global Assets

| Category | Total |
|----------|-------|
| Panels | 4 |
| Icons | 14 |
| Particles | 4 |
| **Subtotal** | **22** |

### Grand Total: **122 images to generate** (theme-4 done, 113 remaining)

| Tier | Rate | Time | Cost |
|------|------|------|------|
| Free | 15 RPM | ~8 min | $0 |
| Tier 1 | 300 RPM | ~23s | ~$6 |

---

## Batch Generation Pipeline

**Script:** `scripts/generate-assets.ts`

```bash
npx tsx scripts/generate-assets.ts --scope per-theme     # all missing per-theme
npx tsx scripts/generate-assets.ts --scope global         # all missing global
npx tsx scripts/generate-assets.ts --theme theme-3        # specific theme
npx tsx scripts/generate-assets.ts --asset blocks         # specific category
npx tsx scripts/generate-assets.ts --dry-run              # plan only
npx tsx scripts/generate-assets.ts --post-process         # JPEG->PNG + resize
```

Requires: `npm install @google/genai p-limit sharp` + `GEMINI_API_KEY` env var.

### Aspect Ratios

| Asset | Ratio | Size | Target |
|-------|-------|------|--------|
| Block-1 | 1:1 | 1K | 256x256 |
| Block-2/3/4 | 1:1 | 1K | center-crop → 512x256 / 768x256 / 1024x256 |
| Background/Loading | 9:16 | 2K | 1080x1920 |
| Logo | 1:1 | 1K | 512x512 |
| Grid BG/Frame | 4:5 | 1K | 512x640 / 576x720 |
| Map | 9:16 | 2K | 1080x1920 |
| Theme Icon | 1:1 | 1K | 128x128 |
| Panels | 1:1 | 1K | 96x96 |
| Icons | 1:1 | 1K | 48x48 |
| Particles | 1:1 | 1K | 16x16 |

---

## Verification

```bash
# Check format (must say "PNG image data")
file mobile-app/public/assets/theme-{N}/*.png

# Check dimensions (python)
python3 -c "
from PIL import Image; import sys
specs = {
    'block-1.png': (256, 256), 'block-2.png': (512, 256),
    'block-3.png': (768, 256), 'block-4.png': (1024, 256),
    'grid-bg.png': (512, 640), 'grid-frame.png': (576, 720),
    'background.png': (1080, 1920), 'loading-bg.png': (1080, 1920),
    'logo.png': (512, 512), 'theme-icon.png': (128, 128),
}
theme = sys.argv[1] if len(sys.argv) > 1 else 'theme-4'
for name, (w, h) in specs.items():
    try:
        img = Image.open(f'mobile-app/public/assets/{theme}/{name}')
        ok = img.format == 'PNG' and img.size == (w, h)
        alpha_ok = name in ('background.png','loading-bg.png','grid-bg.png') or img.mode != 'RGB'
        status = 'OK' if (ok and alpha_ok) else 'FAIL'
        print(f'  {status} {name}: {img.size[0]}x{img.size[1]} {img.mode}')
    except FileNotFoundError:
        print(f'  MISSING {name}')
" theme-4
```

---

## Asset Catalog Integration

Catalog: `mobile-app/src/pixi/assets/catalog.ts`. Resolver: `resolver.ts`.

- **Shared** (`meta.shared = true`): `/assets/common/${filename}`
- **Per-theme**: `/assets/${themeId}/${filename}`
- **SFX**: `/assets/common/sounds/effects/`
- **Music**: `/assets/${themeId}/sounds/musics/`

---

## Quality Checklist

- [ ] Correct dimensions (exact)
- [ ] Transparency correct (green removed)
- [ ] Style matches reference (outlines, cel-shading)
- [ ] Colors match palette from `colors.ts`
- [ ] No text (except logo "zKube"), no people
- [ ] File size < 500KB textures, < 50KB icons
- [ ] Loads correctly in game
- [ ] No green halo artifacts

---

## Troubleshooting

**Green halo** — Script uses despill (suppresses excess green from ALL pixels) + dilate-3 + gaussian blur. Current thresholds: `g > 80, r < 220, b < 220, g > r*1.2, g > b*1.2`

**Solid background in game** — Asset not in transparency list, or stripping skipped

**Wrong aspect ratio** — Gemini approximates; resize in post-processing

**API error** — Only supported ratios: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
