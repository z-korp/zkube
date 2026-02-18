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
│   ├── themes.json          # 10 theme definitions (palette, motifs, scenes)
│   ├── sfx.json             # 20 SFX definitions (id, filename, duration, prompt)
│   └── global-assets.json   # Buttons, icons, panels, particles, ui-chrome, dimensions
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

## Images

### Per-Theme Assets (10 themes × 7 categories = ~110 images)

| Category | Files per theme | Dimensions | Notes |
|----------|----------------|------------|-------|
| blocks | 4 (block-1 to block-4) | 192×192 to 768×192 | 1-4 cell widths, covers 3× retina of 56px max cell |
| background | 1 | 2048×2048 | Square — CSS `object-cover` crops per viewport |
| loading-bg | 1 | 2048×2048 | Distinct scene from background |
| logo | 1 | 1024×1024 | "zKube" text with theme motifs, covers 3× retina of 340px max display |
| grid | 2 (grid-bg + grid-frame) | 1024×1280 / 1152×1440 | 4:5 portrait, covers 2× retina of 500px grid container |
| map | 1 | 1080×1920 | 9:16 portrait, SMB-style world map with winding path |
| theme-icon | 1 | 128×128 | Settings selector icon (40×40 display, 3× retina) |

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
| `--asset <cat>` | Filter to one category (e.g. `blocks`, `bonus-icons`) |
| `--dry-run` | Print plan without calling API |
| `--ref` / `--no-ref` | Use block-1 as reference for multi-cell blocks (default: on) |

### Data

Theme definitions live in `data/themes.json`. Each theme has: name, icon, description, mood, palette, motifs, blockMotifs, blockDesigns, scene, loadingScene, gridMaterial, music (menu + gameplay prompts).

Global asset configs (buttons, icons, panels, etc.) live in `data/global-assets.json`.

Prompt builder functions live in `lib/prompts.ts` — they take theme/config data and produce the actual API prompts.

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

Music is generated manually via **Suno v5** (not automated). 4 tracks × 10 themes = 40 files.

Output: `client-budokan/public/assets/{themeId}/sounds/musics/{track}.mp3`

### Workflow

1. Go to [suno.com](https://suno.com), toggle **Custom** mode ON
2. Paste style prompt into "Style of Music" field
3. Put `[Instrumental]` in "Lyrics" field
4. Generate — pick best of 2 outputs
5. Post-produce: trim silence, crossfade for looping, normalize to -14 LUFS
6. Export MP3 192kbps, save to theme folder

### Track Assignment

- **Menu prompt** → `main.mp3` (home screen) + `map.mp3` (level select)
- **Gameplay prompt** → `level.mp3` (regular levels) + `boss.mp3` (boss levels)

### Specs

| Track | Context | Tempo |
|-------|---------|-------|
| main.mp3 | Home, menus | 75-95 BPM |
| map.mp3 | Level select | 75-95 BPM |
| level.mp3 | Regular gameplay | 110-125 BPM |
| boss.mp3 | Boss levels | 110-125 BPM |

### Per-Theme Music Prompts

<details>
<summary>Theme 1: Tiki</summary>

**Menu:** A laid-back tropical lo-fi instrumental with soft ukulele fingerpicking over warm steel drum chords and gentle bongo percussion. Light marimba accents shimmer through a haze of ocean breeze ambience. Around 95 BPM, calming and inviting.

**Gameplay:** An upbeat island funk instrumental driven by a playful ukulele riff and tight djembe percussion. Kalimba runs sparkle over a steel drum melody. Around 115 BPM, focused and rhythmic.
</details>

<details>
<summary>Theme 2: Cosmic</summary>

**Menu:** A dreamy space ambient instrumental with lush analog synth pads. A gentle arpeggiator twinkles over soft sub-bass warmth. Around 80 BPM, retro-futuristic and serene.

**Gameplay:** A mid-tempo synthwave instrumental with a pulsing bassline under shimmering arpeggiated synths and crisp electronic drums. Around 110 BPM, propulsive and luminous.
</details>

<details>
<summary>Theme 3: Easter Island</summary>

**Menu:** A mysterious retro-futuristic instrumental blending ancient atmosphere with neon synthwave. A haunting stone flute melody over warm analog synth pads. Around 85 BPM, otherworldly and contemplative.

**Gameplay:** A driving retro synthwave instrumental with punchy bass synth over tight electronic drums and bright neon arpeggios in a minor key. 118 BPM, neon noir tension.
</details>

<details>
<summary>Theme 4: Maya</summary>

**Menu:** An atmospheric Mesoamerican instrumental with a wooden pan flute melody over gentle rain stick textures and soft clay drum rhythm. Around 85 BPM, mysterious but inviting.

**Gameplay:** An energetic Latin world music instrumental driven by quick wooden marimba patterns and rattling seed shakers over tight hand drum rhythms. 120 BPM, ritualistic yet playful.
</details>

<details>
<summary>Theme 5: Cyberpunk (Enchanted Forest)</summary>

**Menu:** A moody cyberpunk instrumental with warm detuned analog synth chords and slow jazzy electric piano over a laid-back hip-hop beat. Around 80 BPM, noir and nocturnal.

**Gameplay:** A slick cyberpunk electronic instrumental with a driving bassline, crisp trap hi-hats, and glitchy arpeggiated synths. 120 BPM, focused and calculated.
</details>

<details>
<summary>Theme 6: Medieval</summary>

**Menu:** A warm medieval tavern instrumental with gentle lute fingerpicking and a soft hurdy-gurdy drone. Celtic harp arpeggios add magic. Around 90 BPM, nostalgic and comforting.

**Gameplay:** An upbeat medieval folk rock instrumental with lively lute strumming and bright tin whistle melody. 125 BPM, spirited and adventurous.
</details>

<details>
<summary>Theme 7: Ancient Egypt</summary>

**Menu:** An elegant Egyptian instrumental with a soft oud melody and gentle darbuka hand drum pattern. Arabic maqam Hijaz scale. Around 85 BPM, regal and serene.

**Gameplay:** A rhythmic Egyptian fusion instrumental with driving darbuka and riq tambourine groove over punchy bass oud. 115 BPM, focused and exotic.
</details>

<details>
<summary>Theme 8: Volcano</summary>

**Menu:** A dark volcanic ambient instrumental with deep rumbling sub-bass. Slow metallic percussion — anvil strikes and chain rattles. Around 75 BPM, ominous but hypnotic.

**Gameplay:** A driving industrial metal instrumental with heavy bass pulse and metallic percussion. 125 BPM, relentless forward momentum.
</details>

<details>
<summary>Theme 9: Tribal</summary>

**Menu:** A warm organic tribal instrumental with soft djembe hand drumming and gentle kalimba melody. Around 90 BPM, earthy and grounding.

**Gameplay:** A groovy Afrobeat instrumental with tight djembe and dunun in polyrhythmic lockstep. Funky kalimba riffs. 120 BPM, joyful and rhythmic.
</details>

<details>
<summary>Theme 10: Arctic</summary>

**Menu:** A serene arctic ambient instrumental with crystalline bell tones and a soft bowed string drone under sparse piano melody. Around 75 BPM, vast and frozen.

**Gameplay:** A crisp Nordic folk electronic instrumental with staccato strings and tight electronic drums. Bright folk fiddle melody. 115 BPM, determined and brisk.
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
│   └── ui/                # HUD chrome
├── theme-1/               # Per-theme assets
│   ├── block-{1-4}.png
│   ├── background.png
│   ├── loading-bg.png
│   ├── logo.png
│   ├── grid-bg.png
│   ├── grid-frame.png
│   ├── map.png
│   ├── theme-icon.png
│   └── sounds/musics/     # Music (4 mp3 files)
├── theme-2/
│   └── ...
└── theme-10/
    └── ...
```
