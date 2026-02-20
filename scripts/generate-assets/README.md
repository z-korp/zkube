# zKube Asset Generation

Generate all visual and audio assets for zKube via fal.ai APIs.

## Quick Start

```bash
# Requires FAL_KEY in .env at project root

# Images — all themes + global assets
npx tsx scripts/generate-assets/generate-images.ts --dry-run
npx tsx scripts/generate-assets/generate-images.ts

# Images — specific theme or category
npx tsx scripts/generate-assets/generate-images.ts --theme theme-4
npx tsx scripts/generate-assets/generate-images.ts --theme theme-3 --asset blocks
npx tsx scripts/generate-assets/generate-images.ts --scope global --asset bonus-icons

# SFX — all 20 effects
npx tsx scripts/generate-assets/generate-sfx.ts --dry-run
npx tsx scripts/generate-assets/generate-sfx.ts

# SFX — specific effects
npx tsx scripts/generate-assets/generate-sfx.ts --only click,coin,victory
```

## Folder Structure

```
scripts/generate-assets/
├── data/
│   ├── themes.json          # 10 theme definitions (palette, motifs, scenes, music)
│   ├── sfx.json             # 20 SFX definitions (id, filename, duration, prompt)
│   ├── global-assets.json   # Buttons, icons, panels, particles, ui-chrome, dimensions
│   └── templates/
│       └── grid-bg.json     # Grid background prompt template with substitution vars
├── lib/
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── env.ts               # Constants, .env loading, rate limiting, retry logic
│   ├── fal-client.ts        # fal.ai API calls (image + audio), save helpers
│   └── prompts.ts           # All prompt builder functions
├── generate-images.ts       # Image generation entry point
├── generate-sfx.ts          # SFX generation entry point
└── README.md
```

## Models

| Asset Type | Model | Via | Output |
|------------|-------|-----|--------|
| Images | [Flux 2 Pro](https://fal.ai/models/fal-ai/flux-2-pro) | fal.ai | PNG at exact pixel dimensions |
| SFX | [ElevenLabs Sound Effects V2](https://fal.ai/models/fal-ai/elevenlabs/sound-effects/v2) | fal.ai | MP3 44.1kHz 192kbps |
| Music | [Suno v5](https://suno.com) | Manual | MP3 (see [Music](#music) below) |

## Flux 2 Pro Prompting Guide

Reference: [BFL Prompting Guide](https://docs.bfl.ml/guides/prompting_guide_flux2) | [fal.ai API](https://fal.ai/models/fal-ai/flux-2-pro/api)

### Core Principles

1. **Subject first** — Word order matters. Put the most important element at the start of the prompt. Flux 2 Pro pays more attention to what comes first.
2. **Descriptive, not instructional** — Describe the image as if it already exists. Say "A scarab beetle centered on blue stone" not "Generate a scarab beetle on blue stone."
3. **No negative prompts** — Flux 2 Pro does not support negative prompts. Focus on what you WANT. Instead of "no blur" say "sharp focus." Instead of "no background" say "dark background."
4. **Medium length is ideal** — 30-80 words hits the sweet spot. Short (10-30) for quick concepts, long (80+) for complex scenes.
5. **Priority order** — Main subject -> Key action/arrangement -> Critical style -> Essential context -> Secondary details.

### Hex Color Control

Associate hex codes directly with specific objects for precise color matching:

```
The vase has color #02eb3c         <- good: tied to object
Use #FF0000 somewhere in the image <- bad: too vague
```

Gradient syntax: "a gradient starting with color #02eb3c and finishing with color #edfa3c"

### Prompt Structure: Subject + Action + Style + Context

| Component | Description | Example |
|-----------|-------------|---------|
| **Subject** | Main focus of the image | "A winged scarab beetle emblem" |
| **Action** | Arrangement, pose, or state | "centered on lapis lazuli stone, wings spread wide" |
| **Style** | Artistic approach | "Hand-painted cel-shaded game art, bold black outlines" |
| **Context** | Setting, lighting, mood | "Dark vignette edges for seamless grid blending" |

### Edge Treatment (Vignette)

Flux 2 Pro generates opaque images — no transparency support. Blocks blend onto the dark game grid via a **dark vignette**:

- Center 80% of the block at full color intensity
- Outermost 8-10% on all four sides smoothly fades to near-black
- No hard border lines, no rounded corners — just a smooth darkness gradient at the perimeter
- This creates seamless visual blending when blocks sit on the dark grid background

### What NOT to Include in Prompts

- Text, logos, UI elements, or watermarks
- People, characters, or faces (except stylized carved reliefs)
- Transparency instructions (Flux always outputs opaque)
- Negative language ("no X", "avoid Y", "don't include Z")
- Multiple unrelated concepts in one prompt

### Iterating on Results

- If the model ignores the vignette: make it the LAST sentence, stated clearly
- If colors are wrong: use hex codes tied to the specific object
- If the design is too busy: reduce the decorative description, emphasize "clean, readable at 48px"
- If the focal element is too small: put it FIRST in the prompt, say "bold" and "occupying 60%"
- If multi-cell blocks look like repeated tiles: emphasize "one cohesive horizontal piece" and "centered motif with extensions"

## Images

### Per-Theme Assets (10 themes x 6 categories = ~90 images)

| Category | Files per theme | Dimensions | Notes |
|----------|----------------|------------|-------|
| blocks | 4 (block-1 to block-4) | 256x256 to 1024x256 | Cropped from 1024x256 master, tinted per palette color |
| background | 1 | 2048x2048 | Square — CSS `object-cover` crops per viewport |
| loading-bg | 1 | 2048x2048 | Distinct scene from background |
| logo | 1 | 1024x1024 | "zKube" text, tinted per theme accent color, bg removed |
| grid | 1 (grid-bg) | 768x1024 | 3:4 portrait grid background |
| theme-icon | 1 | 512x512 | Settings selector icon |

### Block Pipeline

Each theme's blocks are generated from a single neutral master image:

1. `blockPrompt` from themes.json -> `generateImage(1024x256)` — neutral grey master
2. For each block size (block-4=1024, block-3=768, block-2=512, block-1=256): `cropCenter` from master
3. `tintImage` with the corresponding `palette.blocks[i]` color
4. `featherEdges` for soft edge blending
5. Save to `{themeId}/block-{1-4}.png`

### Logo Pipeline

Logos share a common master and are tinted per theme:

1. `buildCommonLogoPrompt()` -> `generateImage(1024x1024)` — neutral grey "zKube" text on black
2. For each theme: `tintImage` with `palette.accent` color
3. `removeBackground` via fal.ai API
4. Save to `{themeId}/logo.png`

The master is cached at `common/logo-master.png` and reused across runs.

### Global Assets (~30 images)

| Category | Count | Output path |
|----------|-------|-------------|
| buttons | 5 | `common/buttons/btn-{color}.png` |
| shared-icons | 5 | `common/icons/icon-{name}.png` |
| catalog-icons | 14 | `common/icons/icon-{name}.png` |
| bonus-icons | 5 | `common/bonus/{name}.png` |
| ui-chrome | 3 | `common/ui/{name}.png` |
| panels | 4 | `common/panels/panel-{type}.png` |
| particles | 4 | `common/particles/particle-{type}.png` |

### CLI Flags

| Flag | Description |
|------|-------------|
| `--theme <id>` | Generate for one theme (e.g. `theme-4`) |
| `--scope <s>` | `per-theme` (default), `global`, or `all` |
| `--asset <cat>` | Filter to one per-theme category (`blocks`, `background`, `loading-bg`, `logo`, `grid`, `theme-icon`) or global category (`buttons`, `shared-icons`, `catalog-icons`, `bonus-icons`, `ui-chrome`, `panels`, `particles`) |
| `--only <names>` | Comma-separated filenames without extension (e.g. `block-1,grid-bg`) |
| `--dry-run` | Print plan without calling API |
| `--ref` / `--no-ref` | Use block-1 as reference for multi-cell blocks (default: on) |

### Data

Theme definitions live in `data/themes.json`. Each theme has: name, icon, description, mood, palette, motifs, blockData (inspirations, themeKeywords, blockPrompt), scene, loadingScene, gridMaterial, music.

Global asset configs (buttons, icons, panels, etc.) live in `data/global-assets.json`.

Prompt builder functions live in `lib/prompts.ts`:
- `buildBlockMasterPrompt` — returns `blockPrompt` from theme's blockData
- `buildGridBackgroundPrompt` — template-based, substitutes theme values into `templates/grid-bg.json`
- `buildBackgroundPrompt` — JSON scene prompt from theme's scene and palette
- `buildLoadingBackgroundPrompt` — JSON scene prompt from theme's loadingScene
- `buildThemeIconPrompt` — flat vector icon from theme motifs
- `buildCommonLogoPrompt` — neutral grey "zKube" logo text
- `buildButtonPrompt`, `buildWhiteIconPrompt`, `buildBonusIconPrompt`, `buildUiChromePrompt`, `buildPanelPrompt`, `buildParticlePrompt` — global asset prompts

## SFX

20 sound effects, all global. Output to `client-budokan/public/assets/common/sounds/effects/`.

### CLI Flags

| Flag | Description |
|------|-------------|
| `--only <ids>` | Comma-separated SFX IDs (e.g. `click,coin,victory`) |
| `--dry-run` | Print plan without calling API |

### ElevenLabs API Parameters

```typescript
{
  text: "...",              // Prompt describing the sound
  duration_seconds: 1,      // 0.5-22s (optional, auto if omitted)
  prompt_influence: 0.3,    // 0-1, how closely to follow prompt
  output_format: "mp3_44100_192"
}
```

### Data

SFX definitions live in `data/sfx.json` — array of `{ id, filename, duration, prompt }`.

### Current Inventory

| Duration | IDs |
|----------|-----|
| 1s | move, swipe, break, new, click, coin, star, bonus-activate, shop-purchase, equip, unequip, constraint-complete |
| 2s | explode, start, over, claim, levelup, boss-defeat |
| 3s | boss-intro |
| 5s | victory |

## Music

Music is generated manually via **Suno v5** (not automated). 4 tracks x 10 themes = 40 files.

Output: `client-budokan/public/assets/{themeId}/sounds/musics/{track}.mp3`

### Workflow

1. Go to [suno.com](https://suno.com), toggle **Custom** mode ON
2. Paste style prompt into "Style of Music" field
3. Put `[Instrumental]` in "Lyrics" field
4. Generate — pick best of 2 outputs
5. Post-produce: trim silence, crossfade for looping, normalize to -14 LUFS
6. Export MP3 192kbps, save to theme folder

### Track Assignment

- **Menu prompt** -> `main.mp3` (home screen) + `map.mp3` (level select)
- **Gameplay prompt** -> `level.mp3` (regular levels) + `boss.mp3` (boss levels)

### Specs

| Track | Context | Tempo |
|-------|---------|-------|
| main.mp3 | Home, menus | 75-95 BPM |
| map.mp3 | Level select | 75-95 BPM |
| level.mp3 | Regular gameplay | 110-125 BPM |
| boss.mp3 | Boss levels | 110-125 BPM |

### Per-Theme Music Prompts

<details>
<summary>Theme 1: Polynesian</summary>

**Menu:** A warm Polynesian lo-fi instrumental with soft ukulele fingerpicking over gentle log drum rhythms and ocean wave ambience. Nose flute melody floats through warm island breeze. Around 90 BPM, rhythmic and inviting.

**Gameplay:** An energetic Polynesian war dance instrumental driven by powerful log drum polyrhythms and fast ukulele strumming. Conch shell accents punctuate the rhythm. Around 120 BPM, volcanic and driving.
</details>

<details>
<summary>Theme 2: Ancient Egypt</summary>

**Menu:** An elegant Egyptian instrumental with a soft oud melody and gentle darbuka hand drum pattern. Arabic maqam Hijaz scale. Around 85 BPM, regal and serene.

**Gameplay:** A rhythmic Egyptian fusion instrumental with driving darbuka and riq tambourine groove over punchy bass oud riffs. 115 BPM, monumental and exotic.
</details>

<details>
<summary>Theme 3: Norse</summary>

**Menu:** A haunting Norse ambient instrumental with deep bowed string drone and sparse nyckelharpa melody. Distant war horn echoes through frozen valleys. Around 80 BPM, vast and mythic.

**Gameplay:** A powerful Viking folk metal instrumental with driving war drum percussion and fierce fiddle melody over heavy bass drone. 118 BPM, relentless and cold.
</details>

<details>
<summary>Theme 4: Ancient Greece</summary>

**Menu:** An elegant Ancient Greek instrumental with gentle lyre arpeggios and soft aulos flute melody over a light frame drum rhythm. Mediterranean breeze ambience. Around 85 BPM, contemplative and noble.

**Gameplay:** A rhythmic Mediterranean instrumental with driving frame drum and tambourine over bright lyre patterns and bold aulos melody. 115 BPM, spirited and architectural.
</details>

<details>
<summary>Theme 5: Feudal Japan</summary>

**Menu:** A refined Japanese instrumental with gentle koto plucking and soft shakuhachi bamboo flute melody over wind chime accents. Around 80 BPM, meditative and disciplined.

**Gameplay:** A dramatic taiko drum instrumental with powerful rhythmic patterns and piercing shinobue flute melody. Shamisen strikes punctuate the beat. 120 BPM, intense and dramatic.
</details>

<details>
<summary>Theme 6: Ancient China</summary>

**Menu:** A mystical Chinese instrumental with gentle guzheng zither arpeggios and soft dizi bamboo flute melody floating over a resonant gong drone. Around 85 BPM, flowing and imperial.

**Gameplay:** A dynamic Chinese orchestral instrumental with soaring erhu melody and powerful war drum patterns. Pipa lute runs cascade over thundering timpani. 118 BPM, mystical and commanding.
</details>

<details>
<summary>Theme 7: Ancient Persia</summary>

**Menu:** An elegant Persian instrumental with soft santur hammered dulcimer arpeggios and gentle ney flute melody. Zarb hand drum keeps a subtle pulse. Around 85 BPM, regal and luminous.

**Gameplay:** A rhythmic Persian fusion instrumental with driving tombak drum patterns and bright tar lute melody. Santur cascades over tight daf frame drum groove. 115 BPM, symmetrical and flowing.
</details>

<details>
<summary>Theme 8: Mayan</summary>

**Menu:** An atmospheric Mesoamerican instrumental with a wooden pan flute melody over gentle rain stick textures and soft clay drum rhythm. Jungle bird calls in the distance. Around 85 BPM, mysterious and ancient.

**Gameplay:** An energetic Aztec ritual instrumental driven by powerful wooden slit drum patterns and rattling seed shakers over fierce clay ocarina melody. 120 BPM, dense and powerful.
</details>

<details>
<summary>Theme 9: Chokwe</summary>

**Menu:** A warm Central African instrumental with soft thumb piano (likembe) melody over gentle wooden slit drum rhythm. Distant forest ambience with bird calls. Around 80 BPM, ancestral and meditative.

**Gameplay:** A rhythmic Central African instrumental with driving wooden slit drum patterns and bright thumb piano runs over steady shaker and bell accents. 115 BPM, ceremonial and powerful.
</details>

<details>
<summary>Theme 10: Inca</summary>

**Menu:** A majestic Andean instrumental with gentle charango melody and soft pan flute harmonies over a steady bombo drum pulse. Mountain wind ambience. Around 85 BPM, monumental and serene.

**Gameplay:** A powerful Andean instrumental driven by rapid charango strumming and soaring quena flute over thundering bombo leguero war drums. 120 BPM, precise and mountainous.
</details>

## Output Paths

All assets output to `client-budokan/public/assets/`:

```
client-budokan/public/assets/
├── common/
│   ├── sounds/effects/    # SFX (20 mp3 files)
│   ├── bonus/             # Bonus icons
│   ├── buttons/           # Button textures
│   ├── icons/             # UI icons
│   ├── panels/            # 9-slice panels
│   ├── particles/         # Particle sprites
│   ├── ui/                # HUD chrome
│   └── logo-master.png    # Shared neutral logo master (cached)
├── theme-1/               # Per-theme assets
│   ├── block-{1-4}.png
│   ├── background.png
│   ├── loading-bg.png
│   ├── logo.png
│   ├── grid-bg.png
│   ├── theme-icon.png
│   └── sounds/musics/     # Music (4 mp3 files)
├── theme-2/
│   └── ...
└── theme-10/
    └── ...
```
