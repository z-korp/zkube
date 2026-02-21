# zKube — Audio Asset Reference & Generation Guide

Single source of truth for every sound effect and music track in the game.

---

## Table of Contents

1. [Audio Architecture](#audio-architecture)
2. [Sonic Identity](#sonic-identity)
3. [SFX Pipeline](#sfx-pipeline) (fal.ai — ElevenLabs Sound Effects V2)
4. [SFX Inventory](#sfx-inventory)
5. [Music Pipeline](#music-pipeline) (Suno v5)
6. [Per-Theme Music](#per-theme-music)
7. [Post-Production](#post-production)
8. [Status](#status)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔄 | Exists on disk — regenerate for consistency |
| ❌ | Not yet created |
| 🌐 | Global (shared across all themes) |
| 🎨 | Per-theme (unique per theme) |

---

## Audio Architecture

### File Locations

| Category | Path Pattern | Count |
|----------|-------------|-------|
| SFX (global) | `public/assets/common/sounds/effects/{name}.mp3` | 20 total (7 existing + 13 new) |
| Music (per-theme) | `public/assets/{themeId}/sounds/musics/{track}.mp3` | 4 tracks × 10 themes |

### Client Integration

| Component | Source | Purpose |
|-----------|--------|---------|
| `MusicPlayerProvider` | `contexts/music.tsx` | Background music management, track cycling |
| `SoundPlayerProvider` | `contexts/sound.tsx` | SFX playback via Howler.js |
| `SFX_PATHS` | `config/themes.ts` | SFX path constants |
| `THEME_MUSIC` | `config/themes.ts` | Per-theme music path map |

### Music Contexts

| Context | When Played | Source Key |
|---------|-------------|-----------|
| `main` | Home screen, menus | `main.mp3` |
| `level` | Regular gameplay (map screen) | `map.mp3` |
| `boss` | Boss levels | `boss.mp3` |
| `boss2` | Intense gameplay | `level.mp3` |

### Audio Settings

Stored in localStorage (`zkube-audio-settings`):
- `musicVolume`: 0-1 (default 0.3)
- `effectsVolume`: 0-1 (default 0.5)

---

## Sonic Identity

All zKube SFX share a unified **"crystalline mineral puzzle temple"** character:

### Core Textures
- **Impacts & clicks** — stone-on-stone, polished obsidian taps, quartz collisions
- **Chimes & tones** — crystal resonances, singing bowls, tuned mineral bars
- **Shatters & breaks** — cracking geodes, fracturing gemstone, volcanic glass splintering
- **Ambience** — subtle reverb tail as if inside a stone temple chamber

### Tonal Guidelines
- **Bright and clean** in mids/highs for mobile speaker clarity
- **Never muddy**, never harsh — every sound is satisfying and tactile
- **Mineral warmth** — not cold digital bleeps, but sounds that feel like they come from stone, crystal, and earth
- **Consistent reverb** — short stone-chamber reverb on everything (not cavernous, just a hint of space)

### Why This Works for zKube
The game is about manipulating blocks (cubes = minerals). The puzzle temple aesthetic ties the SFX to the game's identity regardless of which visual theme is active. Stone clicks for moves, crystal chimes for rewards, geode cracks for breaks — it all reinforces the core "cube manipulation" feel.

---

## SFX Pipeline

### Generator: fal.ai — ElevenLabs Sound Effects V2

SFX are generated using ElevenLabs' sound effects model via the fal.ai API. Same `@fal-ai/client` package as image generation. Outputs MP3 directly — no ffmpeg conversion needed.

**API:**
```typescript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/elevenlabs/sound-effects/v2", {
  input: {
    text: "Sharp glass crack with bright shimmer. Quick snap, fast decay, satisfying.",
    duration_seconds: 1,
    prompt_influence: 0.3,
    output_format: "mp3_44100_192",
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});

// result.data.audio.url → MP3 download URL
```

**Key Parameters:**
| Param | Type | Notes |
|-------|------|-------|
| `text` | string | Description of the sound effect |
| `duration_seconds` | float | Duration in seconds, 0.5-22 (optional, auto if omitted) |
| `prompt_influence` | float | How closely to follow prompt, 0-1 (default 0.3) |
| `output_format` | string | Codec/rate/bitrate e.g. `mp3_44100_192` (default `mp3_44100_128`) |
| `loop` | boolean | Create a smoothly looping sound (optional) |

**Output:** MP3 file at 44.1kHz stereo (signed URL at `result.data.audio.url`)

### Environment

Same `FAL_KEY` from `.env` at project root. Already configured for image generation.

### Generation Script

```bash
# Generate all SFX (20 total)
npx tsx scripts/generate-assets.ts --scope sfx

# Dry run (plan only)
npx tsx scripts/generate-assets.ts --scope sfx --dry-run

# Generate specific SFX by ID
npx tsx scripts/generate-assets.ts --scope sfx --only break,click,victory
```

---

## SFX Inventory

All SFX are **🌐 Global** — shared from `common/sounds/effects/`.

**Every SFX below will be (re)generated in one batch** for sonic consistency.

### Core Gameplay SFX

| ID | Filename | When Played | Duration | Status | Prompt |
|----|----------|-------------|----------|--------|--------|
| move | `move.mp3` | Block moved horizontally | 1 | 🔄 | Stone block sliding and clicking into place. Short, clean, satisfying click with light reverb. |
| swipe | `swipe.mp3` | Block swiped (drag gesture) | 1 | 🔄 | Quick soft whoosh with a light crystalline shimmer at the end. Fast and airy. |
| break | `break.mp3` | Line cleared | 1 | 🔄 | Sharp glass crack with bright shimmer. Quick snap, fast decay, satisfying. |
| explode | `explode.mp3` | Multi-line combo clear | 2 | 🔄 | Cascading crystal shatter building to a bright energy burst with deep bass hit at the peak. |
| new | `new.mp3` | New blocks spawned on grid | 1 | 🔄 | Three quick ascending chime tones. Bright and inviting with light reverb. |

### Game Flow SFX

| ID | Filename | When Played | Duration | Status | Prompt |
|----|----------|-------------|----------|--------|--------|
| start | `start.mp3` | Game run begins | 2 | 🔄 | Deep gong strike followed by ascending crystal chimes. Confident and ceremonial. |
| over | `over.mp3` | Game over (out of moves) | 2 | 🔄 | Heavy stone impact with slow descending tones and fading reverb. Somber, final. |
| levelup | `levelup.mp3` | Level completed successfully | 2 | 🔄 | Short triumphant ascending fanfare with a bright resonant bell at the end. Celebratory and warm. |
| victory | `victory.mp3` | Run complete (beat level 50) | 5 | 🔄 | Grand gong opening into cascading chimes and ascending fanfare. Singing bowls building to a bright majestic climax. |

### Boss SFX

| ID | Filename | When Played | Duration | Status | Prompt |
|----|----------|-------------|----------|--------|--------|
| boss-intro | `boss-intro.mp3` | Boss level screen appears | 3 | 🔄 | Deep rumble building slowly with low drones growing in intensity. Ominous and tense, no resolution. |
| boss-defeat | `boss-defeat.mp3` | Boss level defeated | 2 | 🔄 | Explosive crystal shatter followed by triumphant ascending chord. Victorious and powerful. |

### UI Interaction SFX

| ID | Filename | When Played | Duration | Status | Prompt |
|----|----------|-------------|----------|--------|--------|
| click | `click.mp3` | UI button tap | 1 | 🔄 | Short crisp stone click. Minimal, clean, tactile. Subtle reverb. |
| coin | `coin.mp3` | Cube currency earned | 1 | 🔄 | Bright upward ting with metallic shimmer. Quick, rewarding, sparkly. |
| star | `star.mp3` | Star rating earned | 1 | 🔄 | Pure crystal bell strike. High, bright, ringing with harmonic overtones. |
| claim | `claim.mp3` | Quest reward claimed | 2 | 🔄 | Stone crack followed by ascending sparkle cascade. Brief celebratory shimmer with reverb. |

### Bonus & Shop SFX

| ID | Filename | When Played | Duration | Status | Prompt |
|----|----------|-------------|----------|--------|--------|
| bonus-activate | `bonus-activate.mp3` | Bonus power activated | 1 | 🔄 | Quick whoosh into a bright energy pulse. Empowering and snappy with brief ring-out. |
| shop-purchase | `shop-purchase.mp3` | Item purchased in shop | 1 | 🔄 | Multiple small coins clinking into a stone bowl. Brief and satisfying. |
| equip | `equip.mp3` | Bonus equipped to loadout | 1 | 🔄 | Solid click-snap of something locking into place. Precise and tactile. |
| unequip | `unequip.mp3` | Bonus removed from loadout | 1 | 🔄 | Soft reverse click of something releasing from a slot. Quick and gentle. |
| constraint-complete | `constraint-complete.mp3` | Level constraint fulfilled | 1 | 🔄 | Two quick ascending chime tones. Bright checkpoint signal with short reverb. |

### Duration Summary

| Duration (seconds) | SFX IDs |
|--------------------|---------|
| **1** | move, swipe, break, new, click, coin, star, bonus-activate, shop-purchase, equip, unequip, constraint-complete |
| **2** | explode, start, over, claim, levelup, boss-defeat |
| **3** | boss-intro |
| **5** | victory |

---

## Music Pipeline

### Generator: Suno v5

Music tracks are generated via Suno AI's Custom mode.

**Workflow:**
1. Toggle **Custom** mode ON
2. Paste style prompt into "Style of Music" field
3. Put `[Instrumental]` in "Lyrics" field
4. Generate — 2 outputs per prompt
5. Select the best output

**Track Assignment:**
- **Menu prompt** → `main.mp3` (home screen) + `map.mp3` (level select)
- **Gameplay prompt** → `level.mp3` (regular levels) + `boss.mp3` (boss levels)

### Music Specs

| Track | Filename | Context | Tempo | Duration |
|-------|----------|---------|-------|----------|
| Main | `main.mp3` | Home, menus | 75-95 BPM | 2-4 min (loops) |
| Map | `map.mp3` | Level select map | 75-95 BPM | 2-4 min (loops) |
| Level | `level.mp3` | Regular gameplay | 110-125 BPM | 2-4 min (loops) |
| Boss | `boss.mp3` | Boss levels | 110-125 BPM | 2-4 min (loops) |

---

## Per-Theme Music

4 tracks × 10 themes = **40 files**. Stored at `{themeId}/sounds/musics/`.

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

### Theme 5: Cyberpunk (Enchanted Forest)

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

## Post-Production

### Music

1. Download MP3 from Suno (pick best of 2 outputs)
2. Trim silence at start/end
3. Crossfade last 2-3s into first 2-3s for seamless looping
4. Normalize to **-14 LUFS**
5. Export MP3 192kbps
6. Save to `{themeId}/sounds/musics/{track}.mp3`

### SFX

1. Generated as MP3 192kbps directly from ElevenLabs (no conversion needed)
2. Save to `common/sounds/effects/{name}.mp3`

### Tools

- Normalization target (if needed): `-12 LUFS` (SFX), `-14 LUFS` (music)

---

## Status

### SFX — 🌐 Global

| Category | Count | Status |
|----------|-------|--------|
| Existing SFX (regenerate) | 7 | 🔄 Regenerate for consistency |
| New SFX | 13 | ❌ Not generated |
| **Total** | **20** | **All to be generated in one batch** |

### Music — 🎨 Per-Theme

| Theme | main.mp3 | map.mp3 | level.mp3 | boss.mp3 |
|-------|----------|---------|-----------|----------|
| theme-1 | ✅ | ✅ | ✅ | ✅ |
| theme-2 | ✅ | ✅ | ✅ | ✅ |
| theme-3 | ✅ | ✅ | ✅ | ✅ |
| theme-4 | ✅ | ✅ | ✅ | ✅ |
| theme-5 | ✅ | ✅ | ✅ | ✅ |
| theme-6 | ✅ | ✅ | ✅ | ✅ |
| theme-7 | ✅ | ✅ | ✅ | ✅ |
| theme-8 | ✅ | ✅ | ✅ | ✅ |
| theme-9 | ✅ | ✅ | ✅ | ✅ |
| theme-10 | ✅ | ✅ | ✅ | ✅ |

All 40 music tracks exist. Quality may vary — regenerate individual tracks as needed.

### Legacy Audio (can be cleaned up)

| Path | Notes |
|------|-------|
| `assets/sounds/effects/*.mp3` | Old location — duplicates of `common/sounds/effects/` |
| `assets/sounds/musics/*.mp3` | Old intro/jungle tracks — no longer used |
| `theme-1/sounds/effects/*.mp3` | Theme-1 specific SFX copy — `common/` is the source of truth |
| `theme-2/sounds/effects/*.mp3` | Theme-2 specific SFX copy — `common/` is the source of truth |

These legacy paths can be removed once confirmed unused by the client.
