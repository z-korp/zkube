# zKube — Visual Asset Reference & Generation Guide

Single source of truth for every visual asset in the game. Input a theme, get all images.

**Client**: `client-budokan/` (React + Vite + Tailwind + CSS). All images rendered via `<img>` tags with CSS `object-cover` or CSS `background-image` with `background-size: cover`. No PixiJS, no canvas.

---

## Table of Contents

1. [Generation Pipeline](#generation-pipeline)
2. [Theme Reference](#theme-reference)
3. [Per-Theme Assets](#per-theme-assets) (Blocks, Backgrounds, Logos, Grids, Maps, Icons)
4. [Global Assets](#global-assets) (UI, Bonuses, Bosses, Constraints, Consumables, Panels, Particles)
5. [Client Rendering Reference](#client-rendering-reference)
6. [Status & Priority](#status--priority)
7. [Quality Checklist](#quality-checklist)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Exists on disk at correct dimensions |
| ⚠️ | Exists but wrong dimensions or quality |
| ❌ | Not yet created |
| 🎨 | Per-theme (unique art per theme) |
| 🌐 | Global (shared across all themes) |

---

## Generation Pipeline

### Model & Tools

| Tool | Purpose |
|------|---------|
| **Flux 2 Pro** (`fal-ai/flux-2-pro`) | AI image generation via fal.ai — arbitrary pixel dimensions, zero cropping |
| **sharp** (Node.js) | Format conversion (JPEG→PNG), resize if needed |

### Why Flux (not Gemini)

| Feature | Gemini | Flux via fal.ai |
|---------|--------|-----------------|
| **Aspect ratios** | Fixed set (1:1, 3:2, 16:9, etc.) | **Arbitrary pixel dimensions** |
| **Block generation** | Generate 1:1 square → center-crop 50-75% for wide blocks | **Generate at exact target size** — zero cropping |
| **Max resolution** | 2048×2048 | 2048 on longest side (per dimension) |
| **Output format** | Always JPEG | PNG or JPEG (download + convert) |
| **API** | `@google/genai` | `@fal-ai/client` |
| **Speed** | ~5-8s per image | ~3-5s per image |

### Key Advantage: Exact Pixel Dimensions

Flux accepts `image_size: { width: W, height: H }` directly. This means:
- **Blocks**: Generate at exact 544×544, 1088×544, 1632×544, 2176×544 — no cropping, no content loss
- **Backgrounds**: Generate at any aspect ratio — could be 2048×2048 (square), 2048×1152 (16:9), or 1152×2048 (9:16)
- **Maps**: Generate at exact 1080×1920 (9:16 portrait)

### Design Principle: Fill the Canvas

All generated images must fill the entire canvas edge-to-edge. No empty margins, no solid-color padding, no border radius.
- **Opaque assets** (backgrounds, loading, grids, maps): image IS the final asset
- **Blocks**: texture fills every pixel — hard square edges, no rounded corners

### Post-Processing Steps

1. **Download** — Flux returns image URLs; download as buffer
2. **Convert** — If not PNG, convert via sharp
3. **Save** — Write to target path

No center-cropping needed (unlike Gemini). The image comes at the exact requested dimensions.

### Batch Generation Script

**Location**: `scripts/generate-assets.ts`

```bash
# Env: FAL_KEY in .env at project root (auto-loaded)
# Requires: Node 22, @fal-ai/client, sharp, p-limit

npx tsx scripts/generate-assets.ts --scope per-theme     # all per-theme assets
npx tsx scripts/generate-assets.ts --scope global         # all global assets
npx tsx scripts/generate-assets.ts --theme theme-3        # specific theme
npx tsx scripts/generate-assets.ts --asset blocks         # specific category
npx tsx scripts/generate-assets.ts --dry-run              # plan only
npx tsx scripts/generate-assets.ts --no-ref               # skip reference images
```

### Target Dimensions

| Asset | Pixel Dimensions | Aspect Ratio | Notes |
|-------|-----------------|--------------|-------|
| Block-1 | 544×544 | 1:1 | Single cell |
| Block-2 | 1088×544 | 2:1 | 2 cells wide |
| Block-3 | 1632×544 | 3:1 | 3 cells wide |
| Block-4 | 2176×544 | 4:1 | 4 cells wide |
| Background | 2048×2048 | 1:1 | Square — CSS `object-cover` crops per viewport |
| Loading BG | 2048×2048 | 1:1 | Square — CSS `background-size: cover` |
| Logo | 512×512 | 1:1 | Rendered at 128-340px |
| Grid BG | 512×640 | 4:5 | Subtle texture behind blocks |
| Grid Frame | 576×720 | 4:5 | Ornamental border |
| Map | 1080×1920 | 9:16 | Portrait, scrollable |
| Theme Icon | 128×128 | 1:1 | Settings selector |

### Why Square Backgrounds (2048×2048)

Mobile (portrait ~9:16) and desktop (landscape ~16:9). A square image works for both via CSS `object-cover`:
- **Mobile 390×844**: scales to 844×844, crops ~227px per side → center stays visible
- **Desktop 1920×1080**: scales to 1920×1920, crops ~420px top/bottom → center stays visible
- **Composition rule**: Important content in center 60%. Edges = atmospheric filler.

---

## Theme Reference

Source of truth: `client-budokan/src/config/themes.ts`

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
| theme-10 | Arctic | Frozen steampunk tundra | Brass gears, leather straps, ice crystals, clockwork |

### Color Palettes

| Theme | BG | Accent | Block 1 | Block 2 | Block 3 | Block 4 |
|-------|----|--------|---------|---------|---------|---------|
| Tiki | `#87CEEB` | `#FF8C00` | `#4ADE80` | `#4AA8DE` | `#9F7AEA` | `#FBBF24` |
| Cosmic | `#0B0D21` | `#A29BFE` | `#00D2D3` | `#6C5CE7` | `#FD79A8` | `#FDCB6E` |
| Easter Island | `#0A0A1A` | `#00FFFF` | `#4A8A5B` | `#3A7A8A` | `#8A4A6A` | `#B89A4A` |
| Maya | `#0A2540` | `#00CED1` | `#00E5A0` | `#00B4D8` | `#FF6F91` | `#FFC947` |
| Cyberpunk | `#1A3A1A` | `#DAA520` | `#66BB6A` | `#42A5F5` | `#AB47BC` | `#FFCA28` |
| Medieval | `#C2956B` | `#E07B39` | `#E07B39` | `#D4463B` | `#3D9970` | `#E8C547` |
| Ancient Egypt | `#D0E8F0` | `#40E0D0` | `#40E0D0` | `#5B9BD5` | `#B070D0` | `#F0C060` |
| Volcano | `#1A0A0A` | `#FF6600` | `#FF6600` | `#FF2222` | `#FFAA00` | `#FF4488` |
| Tribal | `#FFF0F5` | `#FF69B4` | `#7DCEA0` | `#85C1E9` | `#D7BDE2` | `#F9E154` |
| Arctic | `#2A1F14` | `#D4A017` | `#B87333` | `#C5A050` | `#6B8E23` | `#CC5544` |

---

## Per-Theme Assets

### 1. Blocks — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Block-1 | `block-1.png` | 544×544 | ✅ theme-1, ✅ theme-3 (Flux), ⚠️ others |
| Block-2 | `block-2.png` | 1088×544 | ✅ theme-1, ✅ theme-3 (Flux), ⚠️ others |
| Block-3 | `block-3.png` | 1632×544 | ✅ theme-1, ✅ theme-3 (Flux), ⚠️ others |
| Block-4 | `block-4.png` | 2176×544 | ✅ theme-1, ✅ theme-3 (Flux), ⚠️ others |

**Reference**: Theme-1 (Tiki) blocks at 544px/cell are the quality target.

**Generation**: 4 blocks × 9 themes (2, 4-10) = **36 images** to regenerate.

#### Block Design Philosophy

Each block type has a **unique focal element** (not just a color swap). This creates visual variety and makes blocks distinguishable at small sizes. The focal element takes ~60% of the block, with surrounding theme decoration filling the rest.

Style: Hand-painted game art. Flat cel-shaded with subtle bevel (lighter top-left, darker bottom-right). Think Clash Royale card art — bold, clean, readable at small sizes. Thin black outlines (2-3px) to separate shapes.

#### Block Prompt — Single Cell (Block-1)

```
Generate a game block texture for a puzzle game. The block is a 1×1 square.

Focal element: {BLOCK_DESIGN} — centered on the block, taking up ~60% of the space.
Surrounding decoration: {BLOCK_MOTIFS} — subtle carved relief filling the remaining area.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}

COLOR: The DOMINANT color MUST be {BLOCK_COLOR}. Use {BLOCK_COLOR} for at least 70% of the surface.
Add darker and lighter shades of {BLOCK_COLOR} for depth (2-3 tonal steps). Muted, earthy tones — NOT neon.
Use thin black outlines (2-3px) to separate shapes.

Style: Hand-painted game art. Flat cel-shaded with subtle bevel (lighter top-left, darker bottom-right).
Think Clash Royale card art — bold, clean, readable at small sizes.

CRITICAL: The texture MUST fill EVERY PIXEL of the canvas. Hard square edges — NO rounded corners, NO border radius, NO margins, NO padding, NO background showing. The block content goes right to the pixel boundary on all 4 sides.
Opaque fill everywhere. No transparency. No text. No people. No logos.
```

#### Block Prompt — Multi-Cell (Block-2/3/4)

```
Generate a seamless game block texture for a puzzle game. The block spans {WIDTH}×1 cells.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}

The design must read as one cohesive horizontal block with a strong central motif and decorative extensions to both sides.
The dominant color MUST remain {BLOCK_COLOR}. Keep muted, earthy tones — NOT neon.
Focal element: {BLOCK_DESIGN} — centered, taking up ~60% of the space.
Surrounding decoration: {BLOCK_MOTIFS} — subtle carved relief flowing continuously edge-to-edge.

Style: Hand-painted game art. Flat cel-shaded with subtle bevel (lighter top-left, darker bottom-right).
Use thin black outlines (2-3px) to separate shapes.
CRITICAL: Fill every pixel of the canvas with opaque content. Hard rectangular edges — NO rounded corners, NO margins, NO transparency.
```

#### Per-Theme Block Designs

Each theme needs 4 unique `blockDesigns` — one per block color. These define the focal element that makes each block visually distinct.

**Theme 1 — Tiki:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#4ADE80` | A fierce tiki mask with angry brow and flared nostrils, weathered tropical wood with green moss patches |
| 2 | `#4AA8DE` | A serene tiki mask with closed eyes and wide smile, ocean-smoothed driftwood with blue-green patina |
| 3 | `#9F7AEA` | A mystical tiki mask with spiral eyes and protruding tongue, dark ironwood with purple orchid accents |
| 4 | `#FBBF24` | A royal tiki mask with elaborate headdress and sun rays, golden bamboo with amber resin highlights |

**Theme 2 — Cosmic:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#00D2D3` | A faceted alien crystal formation with inner glow, prismatic teal surfaces reflecting starlight |
| 2 | `#6C5CE7` | A swirling nebula vortex captured in a glass sphere, deep violet plasma with electric arc veins |
| 3 | `#FD79A8` | A blooming cosmic flower with crystalline petals, iridescent pink surfaces with stardust particles |
| 4 | `#FDCB6E` | A ringed planet miniature with asteroid belt, golden metallic surface with cosmic dust rings |

**Theme 3 — Easter Island:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#4A8A5B` | A stoic forward-facing moai head with closed eyes, weathered mossy stone texture |
| 2 | `#3A7A8A` | A stern moai head with deep eye sockets looking slightly left, ocean-worn stone with teal lichen |
| 3 | `#8A4A6A` | A fierce moai head with open mouth and bared teeth, dark volcanic basalt with magenta mineral veins |
| 4 | `#B89A4A` | A wise elder moai head with elongated features and a pukao (topknot hat), sandy weathered stone with ochre patina |

**Theme 4 — Maya:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#00E5A0` | A coiled jade serpent with emerald scales and ruby eyes, polished green jade with gold leaf accents |
| 2 | `#00B4D8` | A Mayan rain god mask (Chaac) with fanged mouth and water drops, turquoise stone with coral inlays |
| 3 | `#FF6F91` | A feathered quetzal bird in flight with spread wings, rose quartz with iridescent feather detail |
| 4 | `#FFC947` | A stepped pyramid with central sun disc, hammered gold with amber jewel center |

**Theme 5 — Cyberpunk (Enchanted Forest):**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#66BB6A` | A glowing tree spirit face formed in gnarled bark, mossy green wood with bioluminescent rune veins |
| 2 | `#42A5F5` | An enchanted owl perched on a crystal branch, sapphire-tinted bark with starlight feathers |
| 3 | `#AB47BC` | A flowering mushroom cluster with visible spore glow, amethyst caps with violet luminescence |
| 4 | `#FFCA28` | A golden acorn with visible life energy spirals, amber resin surface with golden root tendrils |

**Theme 6 — Medieval:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#E07B39` | A heraldic lion shield boss with iron rivets, burnished orange copper with flame patina |
| 2 | `#D4463B` | Crossed battle axes over a crimson banner, dark red steel with rust accents and blood drops |
| 3 | `#3D9970` | A Celtic knot dragon eating its own tail, verdigris copper with emerald scale texture |
| 4 | `#E8C547` | A royal crown with fleur-de-lis points, hammered gold with topaz gem settings |

**Theme 7 — Ancient Egypt:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#40E0D0` | A scarab beetle with spread ceremonial wings, turquoise faience with gold wing edges |
| 2 | `#5B9BD5` | The Eye of Horus with radiating tear marks, lapis lazuli with cobalt and gold inlay |
| 3 | `#B070D0` | A lotus flower in full bloom with papyrus stems, amethyst petals with gold pollen center |
| 4 | `#F0C060` | An ankh symbol with Ra sun disc crown, burnished gold with amber crystal core |

**Theme 8 — Volcano:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#FF6600` | A volcanic vent spewing lava fountains, obsidian base with bright orange magma cracks |
| 2 | `#FF2222` | A magma golem fist punching upward, black basalt with deep crimson lava veins |
| 3 | `#FFAA00` | A phoenix egg in a nest of glowing embers, amber crystal shell with internal fire glow |
| 4 | `#FF4488` | A demon skull with lava dripping from eye sockets, dark obsidian with magenta heat stress lines |

**Theme 9 — Tribal:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#7DCEA0` | A painted ritual mask with geometric dot patterns, fired clay surface with sage green ceremonial paint |
| 2 | `#85C1E9` | A ceremonial talking drum with taut animal hide and rope binding, sky blue pigment with white bead trim |
| 3 | `#D7BDE2` | A dream catcher with feathers and woven threads, lavender-dyed leather with amethyst crystal beads |
| 4 | `#F9E154` | A sun medallion with radiating tribal rays, golden clay disc with sunburst ochre paint patterns |

**Theme 10 — Arctic:**
| Block | Color | Focal Design |
|-------|-------|-------------|
| 1 | `#B87333` | A steampunk compass rose with exposed gear teeth, burnished copper body with frost-etched glass face |
| 2 | `#C5A050` | A frozen clockwork escapement mechanism, brass frame with amber lubricant frozen mid-drip |
| 3 | `#6B8E23` | An aurora crystal trapped in a riveted brass cage, olive-green glacial ice with brass bolt accents |
| 4 | `#CC5544` | A steampunk pressure gauge with cracked glass dial, dark copper housing with crimson warning marks |

---

### 2. Background — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Background | `background.png` | 2048×2048 | ⚠️ themes 3-10 (wrong size or quality), ❌ theme-1&2 |

**Generation**: 10 images.

**Composition rule**: Center-weighted. Important scene elements in center 60%. Edges = atmospheric filler.

**Background Prompt:**
```
Generate a full-bleed environment scene for a mobile puzzle game. SQUARE format (1:1).
This is NOT a framed picture. The scene fills the ENTIRE canvas edge to edge — the viewer is INSIDE the world looking around.

Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Scene: {SCENE_DESCRIPTION}

Style: Rich digital painting. Atmospheric, immersive, painterly. Deep saturated colors and dramatic lighting.
Composition: Layered depth — foreground silhouettes at edges, main scene in the middle, distant background fading into atmosphere.
Important content stays in the center 60%. Edges are atmospheric filler (sky, ground, foliage) that can be safely cropped.

Mood: {MOOD}. Dominant colors: {BG_COLOR} to {ACCENT_COLOR}.

The image must be a seamless full-bleed scene with NO borders, NO frames, NO vignettes, NO picture-in-picture effect.
Opaque fill. No text, no UI, no people, no logos.
```

### 3. Loading Background — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Loading BG | `loading-bg.png` | 2048×2048 | ⚠️ all themes (wrong size or quality) |

**Generation**: 10 images. Must be visually distinct from the main background.

**Loading BG Prompt:**
```
Generate a full-bleed loading screen image for a mobile puzzle game. SQUARE format (1:1).
This is NOT a framed picture. The scene fills the ENTIRE canvas edge to edge.

Theme: {THEME_NAME} — {THEME_DESCRIPTION}
Scene: {LOADING_SCENE}

Style: Rich digital painting. Atmospheric, moody, slightly darker and more mysterious than a typical game scene.
Composition: Close-up atmospheric detail — the viewer is right up against the subject. Main focal point centered. Edges fade into dark atmosphere.

Mood: {MOOD}. Dominant colors: {BG_COLOR} to {ACCENT_COLOR}.

The image must be a seamless full-bleed scene with NO borders, NO frames, NO vignettes, NO picture-in-picture effect.
Opaque fill. No text, no UI, no people, no logos.
```

### Scene Variables (Background + Loading)

| Theme | SCENE_DESCRIPTION | LOADING_SCENE |
|-------|-------------------|---------------|
| Tiki | Tropical night seascape, tiki totems on a moonlit beach, palm silhouettes against a starry sky, gentle bioluminescent waves | Close-up of a carved tiki mask with glowing ember eyes, surrounded by tropical flowers and firefly lights |
| Cosmic | Synthwave alien landscape, cratered purple-pink planets, neon rim-lighting on crystalline spires, starfield background | A swirling nebula with crystal formations floating in deep space, electric blue and violet light |
| Easter Island | Volcanic island at twilight, row of moai silhouettes against a bioluminescent ocean, volcanic mist rising | A single moai statue face emerging from volcanic mist, cracks glowing with bioluminescent blue-green light |
| Maya | Deep jungle canopy, a stepped jade temple half-swallowed by vines, misty waterfalls cascading into turquoise pools | Jade serpent carving on a moss-covered temple wall, golden light filtering through canopy gaps |
| Cyberpunk | Forest clearing at golden hour, towering ancient trees draped in moss, golden light rays through canopy, mystical fog | Ancient tree trunk close-up with glowing golden runes carved into dark bark, moss and mushrooms |
| Medieval | Castle courtyard at sunset, stone towers with torches, iron portcullis, heraldic banners fluttering in warm wind | Torchlit stone wall with a shield and crossed swords, warm firelight and shadow play |
| Ancient Egypt | Desert at golden hour, great pyramids and obelisks, the Nile reflecting gold, sandstone temples | Hieroglyph-covered temple wall with glowing Eye of Horus, golden torchlight on carved stone |
| Volcano | Volcanic forge interior, rivers of molten lava between obsidian platforms, ember-filled red sky, basalt columns | Obsidian rock face with molten lava cracks glowing intense orange-red, heat shimmer |
| Tribal | Savanna at dawn, ritual stone circle with painted monoliths, wildflowers, distant acacia trees | Painted ritual drum surrounded by feathers and wildflowers, warm earth tones and dawn light |
| Arctic | Frozen tundra at night, aurora borealis ribbons, ice crystal formations, brass steampunk structures half-buried in snow | Ice crystal formation with aurora light refracting through prismatic facets, brass gears frozen in ice |

---

### 4. Logo — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Logo | `logo.png` | 512×512 | ✅ all themes |

**Generation**: Only if quality needs improvement.

**Logo Prompt:**
```
Game logo for a puzzle game called "zKube".
Theme: {THEME_NAME}

LAYOUT: The text "zKube" LARGE and DOMINANT — filling at least 70% of the canvas width.
The text is the hero element. Theme decorations are subtle accents AROUND and BEHIND the text.

TYPOGRAPHY: Ultra-bold display font. THICK black outline (4-6px). Strong white inner glow for maximum contrast.
Each letter clearly separated and readable at 48px.

DECORATION: Small {THEME_NAME} motifs ({MOTIFS}) as subtle accents flanking the text.
A small isometric cube below the text with theme patterns. Keep decorations MINIMAL.

COLOR: Primary fill {ACCENT_COLOR} with a darker shade for depth. Strong white specular highlights.
Thick dark outline for readability on any background.

Square format. Centered. Dark background blending with {BG_COLOR}.
```

---

### 5. Grid & Frame — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Grid BG | `grid-bg.png` | 512×640 | ✅ all themes |
| Grid Frame | `grid-frame.png` | 576×720 | ✅ all themes |

**Grid BG Prompt:**
```
Subtle background surface texture for a game grid area.
Theme: {THEME_NAME}. Material: {GRID_MATERIAL}.
Muted, low-contrast surface. Dark base with subtle tonal variation.
Must not compete with colorful blocks placed on top.
No grid lines (drawn in code). No patterns that interfere with gameplay.
Portrait rectangle (4:5). Filled completely, no transparency.
```

**Grid Frame Prompt:**
```
Ornamental frame/border for a game grid area.
Theme: {THEME_NAME}. Material: {GRID_MATERIAL}.
Decorative motifs: {MOTIFS}. Accent color: {ACCENT_COLOR}.
Border width ~10% of image on each side. Interior is dark flat fill.
Portrait rectangle (4:5). Frame fills entire canvas.
```

| Theme | GRID_MATERIAL |
|-------|---------------|
| Tiki | Weathered bamboo planks with rope lashing |
| Cosmic | Dark crystalline surface with faint nebula glow |
| Easter Island | Dark volcanic basalt with faint glow veins |
| Maya | Deep ocean-floor stone with turquoise tint |
| Cyberpunk | Dark mossy wood bark |
| Medieval | Weathered sandstone with grain |
| Ancient Egypt | Cool blue-grey slate with gold hieroglyph inlays |
| Volcano | Cracked obsidian with faint ember glow |
| Tribal | Rose-tinted clay with faint texture |
| Arctic | Dark worn leather with brass patina |

---

### 6. Map — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Map | `map.png` | 1080×1920 | ✅ all themes |

**Map Prompt:**
```
Full-screen illustrated progression map for a mobile puzzle game zone.
Theme: {THEME_NAME} — {THEME_DESCRIPTION}

PORTRAIT (9:16). A scenic winding S-curve path from bottom to top.
The path has 11 small circular platform areas (lighter clearings) where game UI nodes will be overlaid:
- Platforms 1-9: small stone clearings along the path
- Platform 10 (near top): slightly larger, with a market stall or treasure chest (SHOP)
- Platform 11 (very top): LARGE dramatic boss arena with {THEME_NAME} architecture

The path connects all 11 platforms bottom-to-top.
Background: {SCENE_DESCRIPTION} — lush, atmospheric.
Mood: {MOOD}. Adventurous. Accent: {ACCENT_COLOR}.
No text, no numbers, no UI elements, no people.
```

---

### 7. Theme Icon — 🎨 Per-Theme

| Asset | Filename | Dimensions | Status |
|-------|----------|------------|--------|
| Theme Icon | `theme-icon.png` | 128×128 | ✅ all themes |

**Theme Icon Prompt:**
```
Small square icon representing "{THEME_NAME}" for a game settings menu.
A single iconic symbol: {ICON_SYMBOL}.
Bold silhouette, white fill. Thick strokes. Clean at 48×48.
Centered. Square. Dark background.
```

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

## Global Assets

### 8. Boss Portraits — 🌐 Global

10 unique boss portraits for boss intro screens.

| Filename | Dimensions | Status |
|----------|------------|--------|
| `common/bosses/combo-master.png` | 512×512 | ❌ |
| `common/bosses/demolisher.png` | 512×512 | ❌ |
| `common/bosses/daredevil.png` | 512×512 | ❌ |
| `common/bosses/purist.png` | 512×512 | ❌ |
| `common/bosses/harvester.png` | 512×512 | ❌ |
| `common/bosses/tidal.png` | 512×512 | ❌ |
| `common/bosses/stacker.png` | 512×512 | ❌ |
| `common/bosses/surgeon.png` | 512×512 | ❌ |
| `common/bosses/ascetic.png` | 512×512 | ❌ |
| `common/bosses/perfectionist.png` | 512×512 | ❌ |

| Boss | Portrait Concept | Accent |
|------|-----------------|--------|
| Combo Master | Figure wreathed in chain lightning, electric arcs | `#4AA8DE` |
| Demolisher | Armored brute with wrecking ball, rubble | `#D4463B` |
| Daredevil | Acrobat on flaming tightrope, fire trails | `#FF6600` |
| Purist | Zen monk with empty hands, serene aura | `#C0C0C0` |
| Harvester | Cloaked figure with giant scythe, grain field | `#3D9970` |
| Tidal | Water elemental with crashing waves | `#00B4D8` |
| Stacker | Golem made of stacked blocks, stone texture | `#9E7E5A` |
| Surgeon | Masked figure with precise instruments | `#40E0D0` |
| Ascetic | Floating meditator, no possessions, golden light | `#DAA520` |
| Perfectionist | Crowned figure atop a flawless grid | `#9F7AEA` |

**Boss Portrait Prompt:**
```
A boss character portrait for a puzzle game.
Character: {BOSS_NAME} — {BOSS_CONCEPT}.
Style: Bold outlines, cel-shaded illustration, 2-3 tonal steps.
Accent color: {ACCENT_COLOR}. Dramatic lighting from below.
Upper body/bust composition. Imposing and memorable. Stylized, not photorealistic.
Square format. Dark atmospheric background. No text, no logos.
```

---

### 9. Constraint Icons — 🌐 Global

| Filename | Dimensions | Status |
|----------|------------|--------|
| `common/constraints/clear-lines.png` | 128×128 | ❌ |
| `common/constraints/break-blocks.png` | 128×128 | ❌ |
| `common/constraints/achieve-combo.png` | 128×128 | ❌ |
| `common/constraints/fill-and-clear.png` | 128×128 | ❌ |
| `common/constraints/no-bonus-used.png` | 128×128 | ❌ |
| `common/constraints/constraint-keep-grid-below.png` | 128×128 | ✅ |

**Constraint Icon Prompt:**
```
A constraint icon for a puzzle game HUD badge.
Design: {CONSTRAINT_DESCRIPTION}.
Bold white silhouette with clean edges. Readable at 32×32.
Iconic and instantly recognizable. Simple shapes, no fine detail.
Centered. Square. Dark background.
```

| Constraint | Description |
|------------|------------|
| ComboLines | Three horizontal lines stacked, top line has sparkle burst |
| BreakBlocks | A block with visible crack lines splitting it |
| ComboStreak | Chain links with lightning spark at junction |
| FillAndClear | Upward arrow reaching a horizontal target line |
| NoBonusUsed | A star with diagonal line through it (prohibition) |
| KeepGridBelow | Grid with a visible cap line and a warning marker above it |

---

### 10. Consumable Icons — 🌐 Global

| Filename | Dimensions | Status |
|----------|------------|--------|
| `common/consumables/bonus-charge.png` | 128×128 | ❌ |
| `common/consumables/level-up.png` | 128×128 | ❌ |
| `common/consumables/swap-bonus.png` | 128×128 | ❌ |

**Consumable Icon Prompt:**
```
A shop item icon for a puzzle game.
Design: {CONSUMABLE_DESCRIPTION}.
Bold colorful illustration with black outlines, cel-shaded.
Gold and accent tones for premium feel.
Recognizable at 64×64. Centered. Square. Dark background.
```

| Consumable | Description |
|------------|------------|
| BonusCharge | Lightning bolt inside a battery/charge cell |
| LevelUp | Upward arrow with star at tip, radiating lines |
| SwapBonus | Two curved arrows forming a swap circle |

---

### 11. Icons — 🌐 Global

48×48 target. White fill on transparent. Tinted in code.

#### Existing ✅

icon-moves, icon-score, icon-cube, icon-level, icon-surrender, icon-star-filled, icon-star-empty, icon-crown, icon-fire, icon-scroll, icon-shop, icon-trophy, icon-menu, icon-close, icon-settings, icon-lock, icon-music, icon-sound

#### Needed ❌

icon-home, icon-map, icon-profile, icon-arrow-left, icon-arrow-right, icon-info, icon-heart, icon-gamepad, icon-chart, icon-lightning, icon-medal-gold, icon-medal-silver, icon-medal-bronze, icon-check, icon-play, icon-skull, icon-refresh, icon-gesture, icon-bridge, icon-package, icon-wheat

**Total new**: 21 icons.

**Icon Prompt:**
```
Simple game UI icon: {ICON_DESCRIPTION}.
Clean bold white silhouette on dark background. Thick strokes.
Recognizable at 48×48. Centered. Square.
```

---

### 12. Panels, Particles, Tutorial — 🌐 Global

| Category | Count | Status |
|----------|-------|--------|
| 9-Slice Panels (wood, dark, leaf, glass) | 4 | ❌ |
| Particles (spark, leaf, flower, star) | 4 | ❌ |
| Additional Particles (coin, confetti, ember, ring) | 4 | ❌ |
| Tutorial Hand | 1 | ❌ |
| Boss Defeat Shards (spritesheet) | 1 | ❌ |

See `docs/ASSETS.md` (legacy) for detailed prompts. These are low priority — the game works without them.

---

## Client Rendering Reference

How the client renders each asset type. Important for choosing generation dimensions.

### Blocks

- **CSS**: `background-image: var(--theme-block-N-image)` + `background-size: cover`
- **Sizing**: Dynamic — `width: ${blockWidth * gridSize}px; height: ${gridSize}px`
- **Grid size range**: 28-56px (responsive via ResizeObserver on container)
- **Actual rendered block widths**: 28-224px (block-4 at max gridSize)
- **Source**: `grid.css` (block classes) + `index.css` (theme CSS vars) + `Block.tsx` (inline styles)

### Background

- **HTML**: `<img class="w-full h-full object-cover">` in `fixed inset-0 -z-20`
- **Overlay**: `fixed inset-0 -z-10 bg-black/30`
- **Covers**: 100vw × 100vh (all viewports)
- **Source**: `ThemeBackground.tsx`

### Loading Background

- **CSS**: `background-image` with `bg-cover bg-center animate-zoom-in-out`
- **Covers**: Full viewport with zoom animation
- **Source**: `Loading.tsx`

### Logo

- **HTML**: `<motion.img>` with responsive Tailwind sizing
- **Sizes**: `w-48 md:w-64 lg:w-80 max-w-[340px]` (192-340px)
- **Loading**: `h-32 md:h-40` (128-160px)
- **Source**: `HomePage.tsx`, `Loading.tsx`

### Theme Icon

- **Container**: `h-10 w-10` (40×40px) in settings grid
- **Image**: `object-cover` inside container
- **Source**: `SettingsDialog.tsx`

### Grid Assets

- `grid-bg.png` and `grid-frame.png` — defined in CSS vars but not actively rendered in current components
- Low priority for regeneration

---

## Status & Priority

### Regeneration Priority

| Priority | Category | Count | Notes |
|----------|----------|-------|-------|
| 🔴 HIGH | Blocks (themes 2, 4-10) | 36 | Need blockDesigns and Flux regen at correct dimensions |
| 🔴 HIGH | Backgrounds (all 10) | 10 | Theme 1&2 missing, 3-10 wrong size/quality |
| 🔴 HIGH | Loading BGs (all 10) | 10 | All wrong size/quality |
| 🟡 MED | Boss Portraits | 10 | New — not in game yet |
| 🟡 MED | Constraint Icons | 6 | New — using emoji fallback |
| 🟡 MED | Consumable Icons | 3 | New — using emoji fallback |
| 🟡 MED | New Icons | 21 | New — using emoji fallback |
| 🟢 LOW | Panels | 4 | Not used in current UI |
| 🟢 LOW | Particles | 8 | Not used in current UI |
| 🟢 LOW | Tutorial/Boss Shards | 2 | Not used yet |

**Total images to generate: ~110**

### What's Done

| Asset | Theme 1 | Theme 2 | Theme 3 | Themes 4-10 |
|-------|---------|---------|---------|-------------|
| Blocks | ✅ 544px | ⚠️ wrong size | ✅ Flux | ⚠️ wrong size |
| Background | ❌ missing | ❌ missing | ⚠️ quality | ⚠️ quality |
| Loading BG | ⚠️ quality | ⚠️ quality | ⚠️ quality | ⚠️ quality |
| Logo | ✅ | ✅ | ✅ | ✅ |
| Grid BG/Frame | ✅ | ✅ | ✅ | ✅ |
| Map | ✅ | ✅ | ✅ | ✅ |
| Theme Icon | ✅ | ✅ | ✅ | ✅ |
| Music (4 tracks) | ✅ | ✅ | ✅ | ✅ |

---

## Quality Checklist

For every generated asset:

- [ ] **Correct dimensions** (exact match to spec table)
- [ ] **PNG format** (converted if needed)
- [ ] **Content fills canvas** (no empty margins, no solid-color padding, no rounded corners on blocks)
- [ ] **Colors match palette** from theme definition
- [ ] **No text** (except logo "zKube"), no people, no logos
- [ ] **No picture-in-picture** effect on backgrounds (common Flux failure mode)
- [ ] **File size** < 500KB textures, < 50KB icons (backgrounds up to 5MB OK)
- [ ] **Loads correctly** in game (no console errors)
- [ ] **Scales correctly** on mobile and desktop

### Automated Verification

```bash
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
  const ok = w === ew && h === eh ? 'OK' : 'WRONG';
  console.log('  ' + ok + ' ' + name + ': ' + w + 'x' + h + ' (expected ' + ew + 'x' + eh + ')');
}
" -- theme-3
```
