#!/usr/bin/env python3
"""
zKube Audio Batch Generator
Generates all 100 audio files (30 music + 70 SFX) using ACE-Step.

Usage:
    python generate_audio.py                    # Generate everything
    python generate_audio.py --only music       # Music tracks only
    python generate_audio.py --only sfx         # Sound effects only
    python generate_audio.py --theme theme-1    # Single theme only
    python generate_audio.py --dry-run          # Print what would be generated
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

# ---------------------------------------------------------------------------
# Output root — all files land under mobile-app/public/assets/{themeId}/sounds/
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_ROOT = PROJECT_ROOT / "mobile-app" / "public" / "assets"

# ---------------------------------------------------------------------------
# ACE-Step default generation parameters
# ---------------------------------------------------------------------------
MUSIC_DEFAULTS = {
    "infer_step": 27,           # 27 steps = fast, good quality
    "guidance_scale": 15.0,
    "scheduler_type": "euler",
    "cfg_type": "apg",
    "omega_scale": 10.0,
    "guidance_interval": 0.5,
    "guidance_interval_decay": 0.0,
    "min_guidance_scale": 3.0,
    "use_erg_tag": True,
    "use_erg_lyric": False,     # No lyrics for instrumental
    "use_erg_diffusion": True,
    "guidance_scale_text": 0.0,
    "guidance_scale_lyric": 0.0,
}

SFX_DEFAULTS = {
    "infer_step": 27,
    "guidance_scale": 15.0,
    "scheduler_type": "euler",
    "cfg_type": "apg",
    "omega_scale": 10.0,
    "guidance_interval": 0.5,
    "guidance_interval_decay": 0.0,
    "min_guidance_scale": 3.0,
    "use_erg_tag": True,
    "use_erg_lyric": False,
    "use_erg_diffusion": True,
    "guidance_scale_text": 0.0,
    "guidance_scale_lyric": 0.0,
}

# ---------------------------------------------------------------------------
# MUSIC TRACKS — 3 per theme (main theme, regular level, boss level)
# ---------------------------------------------------------------------------
MUSIC_TRACKS = {
    "theme-1": {
        "track-1": {
            "prompt": "tropical lo-fi, island pop instrumental, ukulele, steel drum, bongo, marimba, ocean ambience, relaxed, warm, puzzle game menu theme, 95 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "tropical pop instrumental, island funk, upbeat ukulele riff, djembe, kalimba, steel drum melody, shaker groove, energetic, playful, puzzle game level music, 115 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "tribal battle drums, dark Polynesian instrumental, heavy taiko drums, tiki war percussion, log drums, aggressive ukulele minor key, conch shell horn, intense, powerful, menacing, boss battle theme, 140 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-2": {
        "track-1": {
            "prompt": "ambient synthwave, space synth, cosmic chill, analog synth pads, gentle arpeggiator, reverb bells, dreamy, floating, retro-futuristic, puzzle game menu theme, 80 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "synthwave, retro electronic, cosmic pop instrumental, pulsing bassline, shimmering arpeggiated synths, electronic drums, melodic lead synth, focused, propulsive, puzzle game level music, 110 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "dark synthwave, cyberpunk boss battle, darksynth, heavy distorted synth bass, aggressive sawtooth leads, pounding electronic kick, glitching hi-hats, cinematic strings, dark synth pads, menacing, urgent, epic, 135 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-3": {
        "track-1": {
            "prompt": "dark ambient synthwave, ancient futurism, mystery electronic, haunting stone flute, warm analog synth pads, slow ritualistic drum, deep reverb, neon arpeggios, mysterious, ancient, otherworldly, 85 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "retro synthwave, neon noir, puzzle game electronic, punchy bass synth, tight electronic drums, bright neon arpeggios minor key, percussive rock hits, low volcanic drone, mysterious, driven, 118 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "darksynth, ritual industrial, volcanic synthwave, massive tribal war drums, screaming distorted synth leads, volcanic bass drops, ritual rhythmic pattern, dissonant chords, apocalyptic, furious, monumental, boss battle, 140 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-4": {
        "track-1": {
            "prompt": "world ambient, Mesoamerican folk instrumental, jungle atmosphere, wooden pan flute, rain stick, clay drum, jungle bird calls, warm bass, reverb, meditative, mysterious, ancient temple, 85 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "Latin world music instrumental, tribal percussion, Mesoamerican fusion, quick wooden marimba, seed shakers, hand drum, pan flute pentatonic, upbeat, rhythmic, energetic, puzzle game level music, 120 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "dark tribal orchestral, Mesoamerican war drums, ritual battle music, thundering ceremonial drums, polyrhythmic, bone whistles, war horns, heavy bass, rapid wooden percussion, dark minor key flute, ferocious, terrifying, boss battle, 145 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-5": {
        "track-1": {
            "prompt": "lo-fi cyberpunk, synthwave noir, chill electronic, detuned analog synth chords, jazzy electric piano, lo-fi vinyl crackle, hip-hop drum beat, deep 808 sub-bass, moody, nocturnal, puzzle game menu, 80 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "cyberpunk electronic, future bass, digital trap instrumental, driving bassline, crisp trap hi-hats, snappy snare, glitchy arpeggiated synths, filtered pads, slick, focused, electric, puzzle game level music, 120 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "aggressive cyberpunk, industrial bass, darksynth breakbeat, filthy distorted bass drops, pounding industrial kicks, glitched breakbeat drums, screaming saw synths, alarm sirens, chaotic, aggressive, boss battle, 150 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-6": {
        "track-1": {
            "prompt": "medieval folk instrumental, Celtic tavern music, fantasy ambient, gentle lute fingerpicking, hurdy-gurdy drone, bodhr\u00e1n drum, Celtic harp arpeggios, warm, nostalgic, cozy, puzzle game menu, 90 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "medieval folk rock instrumental, Celtic adventure, fantasy game music, lively lute strumming, bodhr\u00e1n rhythm, tin whistle melody, pizzicato strings, trumpet fanfare accent, adventurous, spirited, puzzle game level, 125 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "epic orchestral battle, dark medieval, cinematic boss music, full orchestral strings dramatic minor key, thundering war drums, brass fanfares, French horn, rapid string tremolo, timpani, dark choir pad swells, epic, dramatic, 140 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-7": {
        "track-1": {
            "prompt": "Middle Eastern ambient, Egyptian instrumental, desert world music, soft oud melody, darbuka hand drum, golden harp arpeggios, ney flute, desert wind ambience, Arabic maqam Hijaz, regal, serene, 85 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "modern Egyptian fusion instrumental, desert groove, Middle Eastern electronic, driving darbuka, riq tambourine, bass oud, kanun zither, ney flute Hijaz scale, groovy, focused, exotic, puzzle game level, 115 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "epic Middle Eastern orchestral, Egyptian battle music, cinematic desert, thundering frame drums, taiko hits, urgent darbuka rolls, aggressive distorted oud, dark dramatic strings harmonic minor, ney flute, wrathful, grandiose, boss battle, 140 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-8": {
        "track-1": {
            "prompt": "dark ambient industrial, volcanic drone, cinematic atmosphere, deep rumbling sub-bass, slow metallic percussion, anvil strikes, chain rattles, warm distorted drones, ember crackle, ominous, hypnotic, 75 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "industrial metal instrumental, volcanic rock, forge rhythm, heavy industrial bass pulse, metallic percussion, forge hammer hits, distorted guitar-like synth, quick hi-hat, ember bright lead melody, relentless, fiery, powerful, puzzle game level, 125 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "industrial metal, volcanic cinematic, extreme boss battle, eruption intensity, double bass drum assault, massive distorted bass riffs, screaming lead guitar synths, explosive orchestral hits, lava crescendos, cataclysmic, maximum aggression, 155 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-9": {
        "track-1": {
            "prompt": "world music ambient, African folk instrumental, organic chill, soft djembe hand drumming, kalimba melody, shaker, rain stick, warm acoustic bass, breathy wooden flute, earthy, warm, gentle, puzzle game menu, 90 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "Afrobeat instrumental, tribal funk, world percussion groove, tight djembe, dunun polyrhythmic, funky kalimba riffs, shaker patterns, clapping rhythms, talking drum, bouncy, energetic, groovy, joyful, puzzle game level, 120 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "intense African percussion, primal battle drums, tribal war music, massive polyrhythmic drum ensemble, djembe, dunun, talking drums, aggressive balafon runs, stomping bass hits, call-and-response percussion, primal, fierce, relentless, boss battle, 145 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
    "theme-10": {
        "track-1": {
            "prompt": "arctic ambient, Nordic cinematic, frozen landscape soundtrack, crystalline bell tones, soft bowed string drone, gentle sparse piano melody, wind ambience, ice crystal tinkling, vast, serene, contemplative, 75 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
        "track-2": {
            "prompt": "Nordic folk electronic, arctic adventure, Scandinavian game music, crisp staccato strings, tight electronic drum beat, Nordic folk fiddle, pulsing bass, plucked kantele zither, snappy, crisp, determined, puzzle game level, 115 BPM, loopable, no vocals, clean mix",
            "duration": 150.0,
        },
        "track-3": {
            "prompt": "epic Nordic orchestral, Viking battle music, arctic cinematic, thundering war drums, aggressive low brass, screaming fiddle minor key, pounding double-time beat, dark choir-like synth pads, ice cracking percussion, howling wind synth, titanic, freezing fury, boss battle, 145 BPM, loopable, no vocals, clean mix",
            "duration": 120.0,
        },
    },
}

# ---------------------------------------------------------------------------
# SOUND EFFECTS — 7 per theme
# For SFX we use short durations and style tags optimized for sound design
# ---------------------------------------------------------------------------
SFX_TRACKS = {
    "theme-1": {
        "break":   {"prompt": "wooden bamboo snap, hollow coconut shell pop, bright tropical percussion hit, short satisfying impact, puzzle game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid cascade bamboo and wooden hits, multiple coconut shells cracking, short steel drum flourish, explosive tropical percussion cluster, game combo reward", "duration": 5.0},
        "move":    {"prompt": "soft wooden block sliding on bamboo surface, subtle wood friction, very short gentle tropical click, game UI sound", "duration": 3.0},
        "new":     {"prompt": "upward bamboo wind chime cascade, three ascending wooden tones, soft pleasant bamboo sticks falling into place, gentle arrival sound", "duration": 3.0},
        "start":   {"prompt": "bright conch shell horn blast, short ceremonial, burst of tropical bongo percussion and shakers, energizing Polynesian game start fanfare", "duration": 5.0},
        "swipe":   {"prompt": "quick whoosh of air through bamboo reeds, very short breathy swipe with light wooden texture, minimal clean game sound", "duration": 3.0},
        "over":    {"prompt": "deep hollow log drum hit, slow descending wooden marimba notes, fading bamboo wind chime, melancholic tropical game over sound", "duration": 5.0},
    },
    "theme-2": {
        "break":   {"prompt": "short bright laser zap, crystalline shimmer tail, digital energy burst, high frequency sparkle, clean sci-fi game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid cascade of laser zaps, cosmic energy explosion, bright starburst, sweeping synth whoosh, shimmering particles, deep sub-bass thump, sci-fi combo burst", "duration": 5.0},
        "move":    {"prompt": "quick digital slide tone, short smooth synthesized glide, subtle electronic friction, gentle beep, futuristic game UI sound", "duration": 3.0},
        "new":     {"prompt": "digital materialization sound, particles assembling, ascending sparkle tones, gentle sci-fi shimmer, matter teleporting, warm synthesized arrival", "duration": 3.0},
        "start":   {"prompt": "energizing sci-fi power-up sequence, rising synth sweep, bright starburst, quick electronic fanfare, warp drive engaging, game start sound", "duration": 5.0},
        "swipe":   {"prompt": "quick electronic whoosh, short digital air displacement, subtle laser trail, fast clean satisfying futuristic swipe sound", "duration": 3.0},
        "over":    {"prompt": "deep synthesized power-down sequence, descending pitch, fading electronic hum, dying energy core, digital dissolve, somber game over", "duration": 5.0},
    },
    "theme-3": {
        "break":   {"prompt": "heavy stone cracking impact, bright neon synth zap, ancient meets digital, quick rock crumble with electric shimmer, game sound effect", "duration": 3.0},
        "explode": {"prompt": "multiple stone blocks shattering, cascading neon synth bursts, rapid rock crumbling, retro arcade explosion, deep bass impact, digital scatter, ancient volcanic power", "duration": 5.0},
        "move":    {"prompt": "quick stone grinding slide, heavy block dragging across volcanic rock, gritty texture, faint electronic undertone, short game sound", "duration": 3.0},
        "new":     {"prompt": "deep stone rising from earth, ascending retro synth tone, rock grinding upward, digital materialization shimmer, ancient stones assembling", "duration": 3.0},
        "start":   {"prompt": "deep volcanic rumble building to bright neon synth stab, stone moai awakening, heavy ceremonial impact, electric energy burst, game start", "duration": 5.0},
        "swipe":   {"prompt": "quick stone scraping whoosh, faint neon trail, heavy air displacement, short gritty with subtle digital sparkle, game sound", "duration": 3.0},
        "over":    {"prompt": "heavy stone block collapsing, deep thud, descending retro synth drone fading, neon lights flickering dying, ancient silence, game over", "duration": 5.0},
    },
    "theme-4": {
        "break":   {"prompt": "quick jade stone chime hit, wooden crack, bright crystalline mineral impact, short wooden percussion snap, ancient Mesoamerican puzzle sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid cascade jade chimes and wooden cracks, stone temple blocks crumbling, ringing mineral tones, short ceremonial horn blast, jungle birds scattering, game combo", "duration": 5.0},
        "move":    {"prompt": "quick stone block sliding across smooth temple floor, subtle mineral grinding, very short clean stone-on-stone friction, ancient game sound", "duration": 3.0},
        "new":     {"prompt": "ascending wooden pan flute trill, gentle stone placement, jade pieces clicking together, soft jungle rustle, temple blocks assembling", "duration": 3.0},
        "start":   {"prompt": "ceremonial Mesoamerican clay ocarina call, short bright, burst of wooden drum and seed rattle, ancient temple door opening, game start", "duration": 5.0},
        "swipe":   {"prompt": "quick breathy whoosh through ancient stone corridor, faint vine rustle, short atmospheric with subtle wooden texture, game sound", "duration": 3.0},
        "over":    {"prompt": "heavy stone temple door slamming shut, deep reverberating impact, slow descending clay flute notes fading into jungle, game over", "duration": 5.0},
    },
    "theme-5": {
        "break":   {"prompt": "sharp digital glitch burst, quick bass drop hit, data packet destroyed, electric crackle, neon buzz, clean cyberpunk game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid glitch cascade, heavy bass drop explosion, multiple data streams breaking, electric surge, digital distortion burst, neon overload, cyberpunk combo", "duration": 5.0},
        "move":    {"prompt": "quick digital data transfer blip, short clean electronic slide, subtle bit-crush texture, mechanical servo movement, precise game sound", "duration": 3.0},
        "new":     {"prompt": "digital materialization, data assembling, quick ascending bit tones, holographic projection powering on, crisp electronic construction, neon grid activating", "duration": 3.0},
        "start":   {"prompt": "system boot-up sequence, quick ascending digital tones, electric power surge, neon signs flickering on, bass drop confirmation, cyberpunk game start", "duration": 5.0},
        "swipe":   {"prompt": "quick electric whoosh, subtle digital interference, neon trail sound, fast glitchy satisfying cybernetic swipe, game sound", "duration": 3.0},
        "over":    {"prompt": "system crash sequence, descending digital error tones, electric power failure, screen glitching shutting down, static dissolve, game over", "duration": 5.0},
    },
    "theme-6": {
        "break":   {"prompt": "quick sword strike on shield, bright metallic ring, short satisfying iron clang, high harmonic overtone, medieval weapon impact, game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid clash of swords and shields, triumphant brass chord hit, multiple metallic impacts cascading, stone wall crumbling, short trumpet accent, castle siege, game combo", "duration": 5.0},
        "move":    {"prompt": "quick stone block sliding across castle floor, subtle chain link jingle, short solid heavy medieval block movement, gentle metallic undertone, game sound", "duration": 3.0},
        "new":     {"prompt": "gentle ascending harp glissando, soft stone placement, medieval chime bell ring, castle bricks materializing, warm magical arrival sound", "duration": 3.0},
        "start":   {"prompt": "bright trumpet fanfare, short medieval herald call, quick snare drum roll into brass hit, castle gates opening, noble energizing game start", "duration": 5.0},
        "swipe":   {"prompt": "quick sword drawing whoosh, fast blade through air, subtle metallic ring at end, short sharp knightly game sound", "duration": 3.0},
        "over":    {"prompt": "heavy castle gate slamming shut, deep iron impact, chain rattle, slow descending somber horn note, torch extinguishing, medieval game over", "duration": 5.0},
    },
    "theme-7": {
        "break":   {"prompt": "quick golden chime hit, bright metallic shimmer, short finger cymbal zing, ceramic crack, Egyptian jewelry jingling, desert echo, game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid cascade golden chimes and ceramic breaks, treasure chest bursting, multiple finger cymbals ringing, bright metallic shower, short ney flute accent, pharaoh treasure, game combo", "duration": 5.0},
        "move":    {"prompt": "quick sandstone block sliding, soft gritty sand texture, subtle golden chime, very short desert-smooth, ancient elegant game sound", "duration": 3.0},
        "new":     {"prompt": "ascending golden harp tones, gentle sand falling, desert wind whisper, soft finger cymbal shimmer, ancient magic summoning stone from sand", "duration": 3.0},
        "start":   {"prompt": "bright Egyptian horn call, quick darbuka drum flourish, golden scepter activating, crystalline power tone, regal commanding exotic scale, game start", "duration": 5.0},
        "swipe":   {"prompt": "quick desert wind whoosh, sand grain texture, fast smooth with faint golden shimmer trail, light exotic game sound", "duration": 3.0},
        "over":    {"prompt": "deep stone sarcophagus lid closing, heavy reverberant thud, slow descending ney flute lament, sand falling settling, haunting echo fading, game over", "duration": 5.0},
    },
    "theme-8": {
        "break":   {"prompt": "quick obsidian rock cracking, bright ember burst, sharp mineral snap, fire crackle tail, molten pop, hot aggressive satisfying impact, game sound effect", "duration": 3.0},
        "explode": {"prompt": "volcanic eruption burst, rapid lava explosions, cascading rock impacts, deep bass boom, showering ember crackle, multiple obsidian shattering, massive thermal explosion, game combo", "duration": 5.0},
        "move":    {"prompt": "quick heavy rock grinding across volcanic stone, deep gritty friction, subtle magma bubble, very short weighty volcanic game sound", "duration": 3.0},
        "new":     {"prompt": "deep magma bubbling up, ascending lava hiss, rock cooling solidifying, mineral chime, new volcanic blocks forming from molten rock, fiery controlled", "duration": 3.0},
        "start":   {"prompt": "volcanic vent blast, deep bass surge, forge hammer striking anvil, fire roaring to life, aggressive powerful eruption energy, game start", "duration": 5.0},
        "swipe":   {"prompt": "quick fire whoosh, hot air displacement, ember trail sound, fast aggressive thermal texture volcanic game sound", "duration": 3.0},
        "over":    {"prompt": "heavy volcanic rock collapsing, deep ground-shaking impact, lava hissing cooling, slow ember crackle dying, fire extinguishing smoke, game over", "duration": 5.0},
    },
    "theme-9": {
        "break":   {"prompt": "quick tight djembe slap, bright kalimba chime, short satisfying hand drum pop, wooden overtone, organic warm earthy percussion impact, game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid polyrhythmic drum burst, multiple hand drums firing, quick ascending kalimba flourish, seed shaker shower, tribal celebration explosion, joyful powerful organic, game combo", "duration": 5.0},
        "move":    {"prompt": "quick wooden block sliding on woven surface, soft organic friction, subtle reed texture, very short warm natural grounded game sound", "duration": 3.0},
        "new":     {"prompt": "gentle ascending kalimba notes, soft shaker rustle, wooden pieces clicking into place, warm inviting organic arrival, earth providing game sound", "duration": 3.0},
        "start":   {"prompt": "bright talking drum call, quick djembe flourish, seed rattle burst, tribal gathering signal, energetic communal game start", "duration": 5.0},
        "swipe":   {"prompt": "quick breathy whoosh through grass reeds, soft natural air movement, subtle wooden texture, organic gentle earth wind game sound", "duration": 3.0},
        "over":    {"prompt": "deep dunun bass drum hit fading, slow kalimba descent, soft shaker trailing off, gentle rain stick fade, peaceful game over", "duration": 5.0},
    },
    "theme-10": {
        "break":   {"prompt": "quick ice cracking, bright crystalline chime, sharp frozen snap, glass-like high harmonic ring, clean cold satisfying arctic game sound effect", "duration": 3.0},
        "explode": {"prompt": "rapid ice shattering cascade, multiple crystals breaking, glacier calving burst, deep bass crack, bright shimmering ice particle shower, aurora shimmer, frozen explosion, game combo", "duration": 5.0},
        "move":    {"prompt": "quick ice block sliding on frozen surface, smooth crystalline friction, very short clean cold, subtle chime at rest, precise smooth game sound", "duration": 3.0},
        "new":     {"prompt": "ascending crystalline bell tones, ice forming growing, gentle frost crackling, new ice blocks materializing, cold sparkle soft wind, game sound", "duration": 3.0},
        "start":   {"prompt": "bright Nordic horn call, quick crystalline chime burst, ice cracking open, cold wind rush, crisp bell tone, brisk invigorating arctic game start", "duration": 5.0},
        "swipe":   {"prompt": "quick cold wind whoosh, ice crystal trail, frozen air displacement, short sharp clean arctic blade slicing frost, game sound", "duration": 3.0},
        "over":    {"prompt": "deep ice sheet cracking, heavy reverberant boom, slow descending frozen bell tones, wind howling fading to silence, blizzard settling, game over", "duration": 5.0},
    },
}


def generate_all(pipeline, only=None, theme_filter=None, dry_run=False):
    """Generate all audio files."""
    total = 0
    skipped = 0
    errors = []

    themes = list(MUSIC_TRACKS.keys())
    if theme_filter:
        themes = [t for t in themes if t == theme_filter]
        if not themes:
            print(f"ERROR: Theme '{theme_filter}' not found. Available: {list(MUSIC_TRACKS.keys())}")
            return

    for theme_id in themes:
        theme_dir = OUTPUT_ROOT / theme_id / "sounds"

        # --- Music tracks ---
        if only in (None, "music"):
            music_dir = theme_dir / "musics"
            music_dir.mkdir(parents=True, exist_ok=True)

            for track_name, track_data in MUSIC_TRACKS[theme_id].items():
                out_path = music_dir / f"{track_name}.wav"
                total += 1

                if out_path.exists():
                    print(f"  SKIP (exists): {out_path.relative_to(PROJECT_ROOT)}")
                    skipped += 1
                    continue

                print(f"\n  [{total}] Generating: {out_path.relative_to(PROJECT_ROOT)}")
                print(f"       Prompt: {track_data['prompt'][:80]}...")
                print(f"       Duration: {track_data['duration']}s")

                if dry_run:
                    continue

                try:
                    result = pipeline(
                        audio_duration=track_data["duration"],
                        prompt=track_data["prompt"],
                        lyrics="",
                        save_path=str(out_path),
                        **MUSIC_DEFAULTS,
                    )
                    print(f"       Done!")
                except Exception as e:
                    print(f"       ERROR: {e}")
                    errors.append((str(out_path), str(e)))

        # --- Sound effects ---
        if only in (None, "sfx"):
            sfx_dir = theme_dir / "effects"
            sfx_dir.mkdir(parents=True, exist_ok=True)

            for sfx_name, sfx_data in SFX_TRACKS[theme_id].items():
                out_path = sfx_dir / f"{sfx_name}.wav"
                total += 1

                if out_path.exists():
                    print(f"  SKIP (exists): {out_path.relative_to(PROJECT_ROOT)}")
                    skipped += 1
                    continue

                print(f"\n  [{total}] Generating: {out_path.relative_to(PROJECT_ROOT)}")
                print(f"       Prompt: {sfx_data['prompt'][:80]}...")
                print(f"       Duration: {sfx_data['duration']}s")

                if dry_run:
                    continue

                try:
                    result = pipeline(
                        audio_duration=sfx_data["duration"],
                        prompt=sfx_data["prompt"],
                        lyrics="",
                        save_path=str(out_path),
                        **SFX_DEFAULTS,
                    )
                    print(f"       Done!")
                except Exception as e:
                    print(f"       ERROR: {e}")
                    errors.append((str(out_path), str(e)))

    print(f"\n{'='*60}")
    print(f"SUMMARY: {total} files total, {skipped} skipped (already exist)")
    if errors:
        print(f"ERRORS ({len(errors)}):")
        for path, err in errors:
            print(f"  {path}: {err}")
    if dry_run:
        print("(DRY RUN — nothing was generated)")


def main():
    parser = argparse.ArgumentParser(description="zKube Audio Batch Generator")
    parser.add_argument("--only", choices=["music", "sfx"], help="Generate only music or sfx")
    parser.add_argument("--theme", type=str, help="Generate only a specific theme (e.g. theme-1)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be generated without doing it")
    parser.add_argument("--checkpoint", type=str, default="", help="Path to ACE-Step checkpoint dir")
    args = parser.parse_args()

    if args.dry_run:
        print("DRY RUN — listing files that would be generated:\n")
        generate_all(None, only=args.only, theme_filter=args.theme, dry_run=True)
        return

    # Import and initialize ACE-Step
    print("Loading ACE-Step pipeline (cpu_offload=True for 8GB VRAM)...")
    print("First run will download ~7GB model to ~/.cache/ace-step/checkpoints\n")

    # Add ACE-Step to path
    ace_step_path = str(PROJECT_ROOT / "references" / "ACE-Step")
    if ace_step_path not in sys.path:
        sys.path.insert(0, ace_step_path)

    from acestep.pipeline_ace_step import ACEStepPipeline

    pipeline = ACEStepPipeline(
        checkpoint_dir=args.checkpoint or "",
        dtype="bfloat16",
        torch_compile=False,    # Skip on WSL — avoids Triton issues
        cpu_offload=True,       # Required for 8GB VRAM
        overlapped_decode=True, # Saves memory during decode
    )

    print("Pipeline ready. Starting generation...\n")
    start = time.time()
    generate_all(pipeline, only=args.only, theme_filter=args.theme)
    elapsed = time.time() - start
    print(f"\nTotal time: {elapsed:.1f}s ({elapsed/60:.1f} min)")


if __name__ == "__main__":
    main()
