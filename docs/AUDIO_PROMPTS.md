# zKube Audio Prompts

> **Music**: Suno — 2 prompts per theme × 2 outputs each = 4 instrumental tracks per theme = 40 tracks
> **SFX**: TBD — 7 effects per theme = 70 effects

## File Structure

```
mobile-app/public/assets/{themeId}/sounds/
  musics/
    main.mp3       # Main theme (home, title)
    map.mp3        # Progression map
    level.mp3      # Regular gameplay
    boss.mp3       # Boss levels
  effects/
    break.mp3      # Single line clear
    explode.mp3    # Multi-line combo
    move.mp3       # Block slide
    new.mp3        # New row spawns
    start.mp3      # Level start
    swipe.mp3      # Block swipe gesture
    over.mp3       # Game over
```

---

## How to Use in Suno

1. Toggle **Custom** mode ON
2. Paste the prompt into the "Style of Music" field
3. Put `[Instrumental]` in the "Lyrics" field
4. Suno generates 2 songs per prompt — assign each to its role (see below)
5. Repeat for each theme (2 prompts × 10 themes = 20 generations = 40 tracks)

---

# MUSIC PROMPTS

All tracks: put `[Instrumental]` in the Lyrics field.

Each theme has 2 prompts. Suno generates 2 songs per prompt, giving you 4 tracks total:
- **Menu prompt** → `main.mp3` (home/title) + `map.mp3` (progression map)
- **Gameplay prompt** → `level.mp3` (regular levels) + `boss.mp3` (boss levels)

---

## Theme 1: Tiki 🌴

### Menu Prompt (→ main.mp3 + map.mp3)

```
A laid-back tropical lo-fi instrumental with soft ukulele fingerpicking over warm steel drum chords and gentle bongo percussion. Light marimba accents shimmer through a haze of ocean breeze ambience. The tempo sits easy around 95 BPM, evoking wooden beach huts, swaying palms, and golden hour light filtering through bamboo. Calming and inviting, like a puzzle waiting on a sunlit porch.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
An upbeat island funk instrumental driven by a playful ukulele riff and tight djembe percussion. Kalimba runs sparkle over a steel drum melody that's catchy without being distracting, while shakers keep a steady groove underneath. Around 115 BPM, the energy stays focused and rhythmic — Polynesian puzzle-solving music that makes you nod along as you think, balancing tropical warmth with forward momentum.
```

---

## Theme 2: Cosmic 🌌

### Menu Prompt (→ main.mp3 + map.mp3)

```
A dreamy space ambient instrumental with lush analog synth pads drifting like nebula clouds. A gentle arpeggiator twinkles like distant stars over soft sub-bass warmth, while reverb-soaked bell tones float weightlessly. Around 80 BPM, retro-futuristic and serene — the feeling of drifting through a purple-pink star field, vast and quiet, with nothing but the hum of the cosmos and a sense of infinite possibility.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A mid-tempo synthwave instrumental with a pulsing bassline driving forward under shimmering arpeggiated synths and crisp electronic drums. A melodic lead synth glides and soars through the mix, propulsive and luminous, like navigating through an asteroid field at speed. Sidechained pads breathe in and out around 110 BPM, keeping the energy focused and determined without ever getting heavy.
```

---

## Theme 3: Easter Island 🗿

### Menu Prompt (→ main.mp3 + map.mp3)

```
A mysterious retro-futuristic instrumental blending ancient atmosphere with neon synthwave. A haunting stone flute melody floats over warm analog synth pads and a slow, ritualistic drum pattern. Deep reverb creates vast open space, like standing among giant moai statues at dusk while neon arpeggios glimmer faintly in the distance. Around 85 BPM, otherworldly and contemplative — ancient mystery refracted through an 80s synth lens.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A driving retro synthwave instrumental with punchy bass synth over tight electronic drums and bright neon arpeggios in a minor key. Quick percussive hits click like volcanic rocks while a low drone rumbles underneath like distant volcanic activity. 118 BPM and relentless, the mood is neon noir — solving puzzles under the watchful gaze of stone giants, electric and mysterious, with tension built into every measure.
```

---

## Theme 4: Maya 🏛️

### Menu Prompt (→ main.mp3 + map.mp3)

```
An atmospheric Mesoamerican instrumental with a wooden pan flute melody floating over gentle rain stick textures and soft clay drum rhythm. Lush jungle ambience fills the space — distant bird calls, rustling canopy, warm humid air. Bass notes settle like stepping into a jade-walled temple deep in the overgrown ruins. Reverb-soaked and meditative around 85 BPM, mysterious but inviting, sacred and ancient.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
An energetic Latin world music instrumental driven by quick wooden marimba patterns and rattling seed shakers over tight hand drum rhythms. A pan flute melody weaves through in a pentatonic scale, punctuated by deep, growling bass notes. The percussion is layered and propulsive — 120 BPM of focused jungle energy, ritualistic yet playful, like a temple ceremony where every move counts.
```

---

## Theme 5: Cyberpunk 💜

### Menu Prompt (→ main.mp3 + map.mp3)

```
A moody cyberpunk instrumental with warm, detuned analog synth chords and slow jazzy electric piano licks drifting over a laid-back hip-hop beat. Deep 808 sub-bass hums beneath lo-fi vinyl crackle while neon signs buzz faintly in the background and rain patters on city streets. Around 80 BPM, noir and nocturnal — a late-night puzzle session in a rain-soaked cyber cafe, all purple shadows and amber streetlight.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A slick cyberpunk electronic instrumental with a driving bassline, crisp trap hi-hats, and snappy snare. Glitchy arpeggiated synths cascade like digital rain while pitch-bent lead stabs cut through filtered pads that rise and fall. 120 BPM, focused and calculated — hacking through the matrix one block at a time, every beat precise, every synth line purposeful, electric and forward-moving.
```

---

## Theme 6: Medieval ⚔️

### Menu Prompt (→ main.mp3 + map.mp3)

```
A warm medieval tavern instrumental with gentle lute fingerpicking and a soft hurdy-gurdy drone underneath. A quiet bodhran keeps gentle time while Celtic harp arpeggios add touches of magic. The atmosphere is all crackling fireplaces and candlelit stone walls — nostalgic and comforting around 90 BPM, like resting at a roadside inn between adventures, a mug of mead in hand.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
An upbeat medieval folk rock instrumental with lively lute strumming driving the rhythm alongside a bodhran beat and bright tin whistle melody. Quick pizzicato strings add bounce while an occasional trumpet fanfare accents the peaks. 125 BPM, spirited and adventurous — a knight's training montage in the castle armory, determined and gallant, every move building toward something greater.
```

---

## Theme 7: Ancient Egypt 🏺

### Menu Prompt (→ main.mp3 + map.mp3)

```
An elegant Egyptian instrumental with a soft oud melody and gentle darbuka hand drum pattern. Shimmering golden harp arpeggios cascade while a ney flute floats delicately over warm desert wind ambience. The scale is Arabic maqam Hijaz — regal and serene, around 85 BPM, like watching the sun set golden over the Nile from the steps of a sandstone temple, timeless and unhurried.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A rhythmic Egyptian fusion instrumental with driving darbuka and riq tambourine groove over punchy bass oud. Quick kanun zither runs sparkle like desert sand in sunlight while a ney flute melody in Hijaz scale keeps the energy focused and exotic. Tight and groovy at 115 BPM — deciphering ancient hieroglyphs under the pharaoh's watchful gaze, confident and precise.
```

---

## Theme 8: Volcano 🌋

### Menu Prompt (→ main.mp3 + map.mp3)

```
A dark volcanic ambient instrumental with deep rumbling sub-bass like magma flowing underground. Slow metallic percussion — anvil strikes and chain rattles — rings out over warm distorted drones with ember-like high-frequency crackle. Ominous but hypnotic around 75 BPM, like standing at the edge of a volcanic caldera at night, watching the glow pulse beneath black rock, primordial and smoldering.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A driving industrial metal instrumental with heavy bass pulse and metallic percussion hammering on beat like a forge at full capacity. A distorted guitar-like synth chugs in rhythmic lockstep with quick hi-hats and snappy rimshots while an ember-bright lead melody cuts through the heat. 125 BPM of relentless forward momentum — forging blocks in the heart of the mountain, fiery and powerful.
```

---

## Theme 9: Tribal 🪘

### Menu Prompt (→ main.mp3 + map.mp3)

```
A warm organic tribal instrumental with soft djembe hand drumming and a gentle kalimba melody that rings clear and bright. Shaker and rain stick textures layer underneath warm acoustic bass plucks while a breathy wooden flute adds softness. Earthy and grounding around 90 BPM — like sitting around a campfire as twilight settles, the air still warm, the rhythm of the earth steady beneath you.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A groovy Afrobeat instrumental with tight djembe and dunun in polyrhythmic lockstep. Funky kalimba riffs dance over the top while quick shaker patterns and hand clapping weave through talking drum accents. Bouncy and energetic with deep pocket at 120 BPM — a village celebration in full swing, joyful and rhythmic, every hit landing exactly where it should.
```

---

## Theme 10: Arctic ❄️

### Menu Prompt (→ main.mp3 + map.mp3)

```
A serene arctic ambient instrumental with crystalline bell tones shimmering like northern lights overhead. A soft bowed string drone hums underneath a gentle, sparse piano melody — contemplative and unhurried. Wind ambience whispers through with ice crystal tinkling at the edges. Around 75 BPM, vast and frozen, like standing alone on an endless tundra watching the aurora ripple in silence.
```

### Gameplay Prompt (→ level.mp3 + boss.mp3)

```
A crisp Nordic folk electronic instrumental with staccato strings and a tight electronic drum beat driving forward. A bright folk fiddle melody sings over pulsing bass while quick plucked kantele accents add sparkle. Snappy and precise at 115 BPM, like cracking ice — cool-toned but warm at its core, determined and brisk, racing across frozen blocks before they shift beneath you.
```

---

# SOUND EFFECT PROMPTS (70 effects)

> Tool TBD. Prompts written for text-to-audio models (ElevenLabs SFX, AudioGen, etc.)

---

## Theme 1: Tiki 🌴

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Short wooden bamboo snap with hollow coconut shell pop. Bright tropical percussion hit. Clean attack, fast decay. |
| explode | 0.5-0.8s | Rapid cascade of bamboo and wooden hits building to a burst. Multiple coconut shells cracking. Short steel drum flourish at peak. |
| move | 0.15-0.25s | Soft wooden block sliding on bamboo surface. Subtle wood-on-wood friction. Light tropical click. |
| new | 0.3-0.4s | Upward bamboo wind chime cascade. Three ascending wooden tones. Bamboo sticks falling into place. |
| start | 0.5-0.8s | Bright conch shell horn blast. Burst of tropical bongo percussion and shakers. Ceremonial game start. |
| swipe | 0.15-0.2s | Quick whoosh through bamboo reeds. Short breathy swipe with wooden texture. |
| over | 0.8-1.2s | Deep hollow log drum hit. Slow descending wooden marimba notes. Fading bamboo wind chime. |

## Theme 2: Cosmic 🌌

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Short bright laser zap with crystalline shimmer tail. Digital energy burst with high-frequency sparkle. |
| explode | 0.5-0.8s | Rapid cascade of laser zaps building into cosmic energy explosion. Starburst with sweeping synth whoosh. Deep sub-bass thump. |
| move | 0.15-0.25s | Quick digital slide tone. Short smooth synthesized glide. Gentle beep at rest position. |
| new | 0.3-0.4s | Digital particles assembling with ascending sparkle tones. Gentle sci-fi shimmer. Matter teleporting into existence. |
| start | 0.5-0.8s | Sci-fi power-up sequence. Rising synth sweep into bright starburst. Electronic fanfare with pulsing energy. |
| swipe | 0.15-0.2s | Quick electronic whoosh. Short digital air displacement. Subtle laser trail. |
| over | 0.8-1.2s | Synthesized power-down sequence. Descending pitch with fading electronic hum. Digital dissolve into silence. |

## Theme 3: Easter Island 🗿

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Heavy stone cracking combined with bright neon synth zap. Quick rock crumble with electric shimmer. |
| explode | 0.5-0.8s | Multiple stone blocks shattering with cascading neon synth bursts. Rock crumbling mixed with retro arcade explosion. Deep bass impact. |
| move | 0.15-0.25s | Quick stone grinding slide. Heavy block on volcanic rock. Gritty texture with faint electronic undertone. |
| new | 0.3-0.4s | Deep stone rising from earth with ascending retro synth tone. Rock grinding upward with digital shimmer. |
| start | 0.5-0.8s | Deep volcanic rumble building to bright neon synth stab. Heavy ceremonial impact into electric energy burst. |
| swipe | 0.15-0.2s | Quick stone scraping whoosh with faint neon trail. Heavy air displacement with digital sparkle. |
| over | 0.8-1.2s | Heavy stone collapsing with deep thud. Descending retro synth drone. Neon lights flickering and dying. |

## Theme 4: Maya 🏛️

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Quick jade stone chime with wooden crack. Bright crystalline mineral impact with wooden percussion snap. |
| explode | 0.5-0.8s | Cascade of jade chimes and wooden cracks. Stone temple blocks crumbling with mineral tones. Short ceremonial horn blast. |
| move | 0.15-0.25s | Stone block sliding across smooth temple floor. Subtle mineral grinding. Clean stone-on-stone friction. |
| new | 0.3-0.4s | Ascending wooden pan flute trill with stone placement. Jade pieces clicking together. Soft jungle rustle. |
| start | 0.5-0.8s | Mesoamerican clay ocarina call. Burst of wooden drum and seed rattle. Temple door opening. |
| swipe | 0.15-0.2s | Breathy whoosh through ancient stone corridor. Faint vine rustle with wooden texture. |
| over | 0.8-1.2s | Heavy stone temple door slamming shut. Deep reverberating impact. Descending clay flute fading into jungle. |

## Theme 5: Cyberpunk 💜

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Sharp digital glitch burst with quick bass drop. Electric crackle with neon buzz. Tight and punchy. |
| explode | 0.5-0.8s | Rapid glitch cascade building to heavy bass drop explosion. Multiple data streams breaking. Electric surge with digital distortion. |
| move | 0.15-0.25s | Quick digital data transfer blip. Short electronic slide with bit-crush texture. Mechanical servo. |
| new | 0.3-0.4s | Digital materialization. Data assembling with ascending bit tones. Holographic projection powering on. |
| start | 0.5-0.8s | System boot-up. Ascending digital tones with electric power surge. Neon flickering on. Bass drop confirmation. |
| swipe | 0.15-0.2s | Electric whoosh with digital interference. Neon trail sound. Fast and glitchy. |
| over | 0.8-1.2s | System crash. Descending digital error tones with power failure. Screen glitching and shutting down. Static dissolve. |

## Theme 6: Medieval ⚔️

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Sword strike on shield with bright metallic ring. Short iron clang with harmonic overtone. |
| explode | 0.5-0.8s | Rapid clash of swords and shields. Triumphant brass chord. Metallic impacts cascading. Stone crumbling. Trumpet accent. |
| move | 0.15-0.25s | Stone block sliding across castle floor. Subtle chain link jingle. Heavy medieval block movement. |
| new | 0.3-0.4s | Ascending harp glissando with soft stone placement. Medieval chime bell ring. Warm magical arrival. |
| start | 0.5-0.8s | Trumpet fanfare. Medieval herald call. Snare drum roll into brass hit. Castle gates opening. |
| swipe | 0.15-0.2s | Quick sword drawing whoosh. Blade through air with metallic ring. Short and sharp. |
| over | 0.8-1.2s | Heavy castle gate slamming. Deep iron impact and chain rattle. Descending somber horn note. |

## Theme 7: Ancient Egypt 🏺

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Golden chime hit with bright metallic shimmer. Finger cymbal zing with ceramic crack. Desert echo. |
| explode | 0.5-0.8s | Cascade of golden chimes and ceramic breaks. Treasure chest bursting. Finger cymbals ringing. Ney flute accent. |
| move | 0.15-0.25s | Sandstone block sliding. Soft gritty sand texture with golden chime. Desert-smooth and elegant. |
| new | 0.3-0.4s | Ascending golden harp tones with sand falling. Desert wind whisper. Finger cymbal shimmer. |
| start | 0.5-0.8s | Egyptian horn call with darbuka drum flourish. Golden scepter activation. Regal and commanding. |
| swipe | 0.15-0.2s | Desert wind whoosh with sand grain texture. Faint golden shimmer trail. Light and exotic. |
| over | 0.8-1.2s | Stone sarcophagus lid closing. Heavy reverberant thud. Descending ney flute lament. Sand settling. |

## Theme 8: Volcano 🌋

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Obsidian rock cracking with bright ember burst. Sharp mineral snap with fire crackle. Molten pop. |
| explode | 0.5-0.8s | Volcanic eruption burst. Rapid lava explosions with cascading rock impacts. Deep bass boom. Showering embers. |
| move | 0.15-0.25s | Heavy rock grinding across volcanic stone. Deep gritty friction with magma bubble. Short and weighty. |
| new | 0.3-0.4s | Magma bubbling up with ascending lava hiss. Rock cooling and solidifying with mineral chime. |
| start | 0.5-0.8s | Volcanic vent blast with deep bass surge. Forge hammer striking anvil. Fire roaring to life. |
| swipe | 0.15-0.2s | Fire whoosh. Hot air displacement. Ember trail. Fast and aggressive with thermal texture. |
| over | 0.8-1.2s | Volcanic rock collapsing. Deep ground-shaking impact. Lava hissing and cooling. Ember crackle dying. |

## Theme 9: Tribal 🪘

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Tight djembe slap with bright kalimba chime. Short hand drum pop with wooden overtone. Organic and warm. |
| explode | 0.5-0.8s | Rapid polyrhythmic drum burst. Multiple hand drums firing. Ascending kalimba flourish. Seed shaker shower. |
| move | 0.15-0.25s | Wooden block sliding on woven surface. Soft organic friction with reed texture. Short and warm. |
| new | 0.3-0.4s | Ascending kalimba notes with soft shaker rustle. Wooden pieces clicking into place. Warm organic arrival. |
| start | 0.5-0.8s | Talking drum call with djembe flourish. Seed rattle burst. Tribal gathering signal. Energetic. |
| swipe | 0.15-0.2s | Breathy whoosh through grass reeds. Natural air movement with wooden texture. Organic and gentle. |
| over | 0.8-1.2s | Deep dunun bass drum fading into slow kalimba descent. Shaker trailing off. Rain stick fade. Peaceful. |

## Theme 10: Arctic ❄️

| Effect | Duration | Prompt |
|--------|----------|--------|
| break | 0.3-0.5s | Ice cracking with bright crystalline chime. Sharp frozen snap with glass-like harmonic ring. Clean and cold. |
| explode | 0.5-0.8s | Rapid ice shattering cascade. Multiple crystals breaking. Glacier burst with deep bass crack. Shimmering ice particles. |
| move | 0.15-0.25s | Ice block sliding on frozen surface. Smooth crystalline friction. Subtle chime at rest. Precise. |
| new | 0.3-0.4s | Ascending crystalline bell tones. Ice forming and growing. Frost crackling. Cold sparkle with wind. |
| start | 0.5-0.8s | Nordic horn call with crystalline chime burst. Ice cracking open. Cold wind rush into crisp bell tone. |
| swipe | 0.15-0.2s | Cold wind whoosh with ice crystal trail. Frozen air displacement. Short, sharp, clean. |
| over | 0.8-1.2s | Ice sheet cracking with reverberant boom. Descending frozen bell tones. Wind fading to silence. |

---

# POST-PRODUCTION

## Music

- Download MP3 from Suno (2 outputs per prompt)
- Trim silence from start/end
- For looping: crossfade the last 2-3s into the first 2-3s in Audacity
- Normalize to **-14 LUFS**
- Rename to `main.mp3` / `map.mp3` (from Menu prompt) and `level.mp3` / `boss.mp3` (from Gameplay prompt)

## SFX

- Trim tight — no leading/trailing silence
- Normalize to **-12 LUFS**
- MP3 192kbps
- Rename to `break.mp3`, `explode.mp3`, `move.mp3`, `new.mp3`, `start.mp3`, `swipe.mp3`, `over.mp3`
