# Zone Design Reference

## Architecture

### Per-Zone Components
Each zone has:
- **GameSettings** — structural difficulty curve (tier thresholds, moves, ratio, constraints, boss)
- **Active Mutator** — bonus earning profile (3 slots: type, trigger, threshold, starting charges)
- **Passive Mutator** — level feel (scoring flavor, star thresholds, endless ramp, line/perfect bonuses, starting rows)

### Mode Usage
| Mode | Active Mutator | Passive Mutator | Bonuses |
|------|---------------|-----------------|---------|
| Zone Story | Yes | Yes | Yes (1 of 3 slots per game) |
| Zone Endless | No | Yes | No |
| Daily Challenge | Rolled from pool | Rolled from pool | Yes |

### Design Principles
- GameSettings defines structural difficulty (Option A): tier thresholds, moves, ratio
- Passive mutator defines feel only: no difficulty_offset or moves_modifier overlap
- Passive mutator fields moves_modifier, ratio_modifier, difficulty_offset all stay at 128 (neutral)
- endless_ramp_mult_x100 on passive is neutral (100) — pacing comes from per-zone thresholds
- Zones have distinct identities, not just linear difficulty increases
- Active mutators move to MutatorDef (bonus slots removed from GameSettings) — pending refactor

### Endless Score Multipliers (NEW DEFAULTS)
Hardcoded fallback when `endless_score_multipliers == 0`:
```
VeryEasy:   10  (1.0x)
Easy:       15  (1.5x)
Medium:     20  (2.0x)
MediumHard: 30  (3.0x)
Hard:       40  (4.0x)
VeryHard:   60  (6.0x)
Expert:     80  (8.0x)
Master:     100 (10.0x)
```
Individual zones can override via packed `endless_score_multipliers` field.

### Endless Difficulty Thresholds (defaults)
```
VeryEasy:   0
Easy:       15
Medium:     40
MediumHard: 80
Hard:       150
VeryHard:   280
Expert:     500
Master:     900
```

### Zone Pricing
- Zones are **non-sequential** — players can unlock any zone in any order
- Client suggests the "Tool School" path but doesn't enforce it
- Unlock paths: 100% stars, 100% payment, or hybrid (stars cap at 50% discount)

| Tier | Zones | Price | Star Cost | 50% hybrid | Full star grind |
|------|-------|-------|-----------|------------|-----------------|
| Free | Z1 Polynesian | $0 | 0 | — | — |
| Tier 1 | Z2-Z4 (Egypt, Norse, Greece) | $2 | 40 | 20 stars + $1 | ~half zone perfection |
| Tier 2 | Z5-Z7 (China, Persia, Japan) | $5 | 100 | 50 stars + $2.50 | ~1 zone perfection |
| Tier 3 | Z8-Z10 (Mayan, Tribal, Inca) | $10 | 200 | 100 stars + $5 | ~2 zones perfection |

Total to unlock all: **$42 paying** or **840 stars grinding**.

### Boss Identities (from boss.cairo)
| ID | Name | Primary | Secondary | Tertiary |
|----|------|---------|-----------|----------|
| 1 | Combo Master | ComboLines | ComboStreak | KeepGridBelow |
| 2 | Demolisher | BreakBlocks | ComboLines | KeepGridBelow |
| 3 | Daredevil | ComboStreak | ComboLines | BreakBlocks |
| 4 | Purist | KeepGridBelow | ComboLines | ComboStreak |
| 5 | Harvester | BreakBlocks | ComboStreak | ComboLines |
| 6 | Tidal | KeepGridBelow | ComboLines | BreakBlocks |
| 7 | Stacker | ComboStreak | ComboLines | BreakBlocks |
| 8 | Surgeon | BreakBlocks | ComboStreak | KeepGridBelow |
| 9 | Ascetic | KeepGridBelow | ComboStreak | BreakBlocks |
| 10 | Perfectionist | ComboLines | BreakBlocks | ComboStreak |

Zone boss uses dual constraints only (primary + secondary). Tertiary reserved for daily challenge.

---

## Zone Order (Path A — "Tool School")

Learn each bonus type, then specialize, then master, then recombine.

| Position | Theme | Bonus Identity | Boss Tier | Boss ID | Active Mutator | Passive Mutator |
|----------|-------|---------------|-----------|---------|----------------|-----------------|
| 1 | Polynesian | All 3 (tutorial) | MH | 1 | Tidecaller | Calm Tides |
| 2 | Egypt | Wave (builder) | MH | 2 | Pharaoh's Command | Foundation Stone |
| 3 | Norse | Totem (shatter) | H | 3 | Ragnarök | Frozen Rage |
| 4 | Greece | Hammer (precision) | MH | 4 | Athena's Chisel | Marble Discipline |
| 5 | China | Wave mastery (dragon) | H | 6 | Dragon Breath | Imperial Scale |
| 6 | Persia | Totem mastery (mosaic) | H | 7 | Mosaic Eye | Geometric Flow |
| 7 | Japan | Hammer mastery (lethal) | H | 5 | Iai Strike | Bushido |
| 8 | Mayan | All 3 recombined (sacrifice) | H | 8 | Blood Ritual | Jungle Altar |
| 9 | Tribal | All 3 combo-only (drums) | VH | 9 | War Beat | Primal Pulse |
| 10 | Inca | Hammer only (trial) | Ex | 10 | Inti's Demand | Altitude |

### Mutator ID Assignment
| ID | Name | Type | Zone |
|----|------|------|------|
| 1 | Tidecaller | Active | Z1 Polynesian |
| 2 | Calm Tides | Passive | Z1 Polynesian |
| 3 | Pharaoh's Command | Active | Z2 Egypt |
| 4 | Foundation Stone | Passive | Z2 Egypt |
| 5 | Ragnarök | Active | Z3 Norse |
| 6 | Frozen Rage | Passive | Z3 Norse |
| 7 | Athena's Chisel | Active | Z4 Greece |
| 8 | Marble Discipline | Passive | Z4 Greece |
| 9 | Dragon Breath | Active | Z5 China |
| 10 | Imperial Scale | Passive | Z5 China |
| 11 | Mosaic Eye | Active | Z6 Persia |
| 12 | Geometric Flow | Passive | Z6 Persia |
| 13 | Iai Strike | Active | Z7 Japan |
| 14 | Bushido | Passive | Z7 Japan |
| 15 | Blood Ritual | Active | Z8 Mayan |
| 16 | Jungle Altar | Passive | Z8 Mayan |
| 17 | War Beat | Active | Z9 Tribal |
| 18 | Primal Pulse | Passive | Z9 Tribal |
| 19 | Inti's Demand | Active | Z10 Inca |
| 20 | Altitude | Passive | Z10 Inca |

### Settings ID Assignment
| ID | Name | Type |
|----|------|------|
| 0 | Polynesian Map | Zone Story |
| 1 | Polynesian Endless | Endless |
| 2 | Egypt Map | Zone Story |
| 3 | Egypt Endless | Endless |
| 4 | Norse Map | Zone Story |
| 5 | Norse Endless | Endless |
| 6 | Greece Map | Zone Story |
| 7 | Greece Endless | Endless |
| 8 | China Map | Zone Story |
| 9 | China Endless | Endless |
| 10 | Persia Map | Zone Story |
| 11 | Persia Endless | Endless |
| 12 | Japan Map | Zone Story |
| 13 | Japan Endless | Endless |
| 14 | Mayan Map | Zone Story |
| 15 | Mayan Endless | Endless |
| 16 | Tribal Map | Zone Story |
| 17 | Tribal Endless | Endless |
| 18 | Inca Map | Zone Story |
| 19 | Inca Endless | Endless |

---

## Zone 1 — Polynesian

**Theme**: Learn everything, nothing punishes you.

### GameSettings
| Field | Value | Notes |
|-------|-------|-------|
| base_moves | 16 | -20% from old default (20) |
| max_moves | 48 | -20% from old default (60) |
| base_ratio_x100 | 64 | -20% from old default (80) |
| max_ratio_x100 | 144 | -20% from old default (180) |
| tier_1_threshold | 5 | Easy starts L5 |
| tier_2_threshold | 8 | Medium starts L8 |
| tier_3_threshold | 10 | MediumHard starts L10 |
| tier_4_threshold | 11 | Hard — never reached |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 5 | |
| level_cap | 10 | |
| boss_id | 1 | Combo Master (ComboLines + ComboStreak) |
| endless_difficulty_thresholds | 0 | Use defaults |
| endless_score_multipliers | 0 | Use new defaults (1x→10x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-4), E(5-7), M(8-9), MH(10/boss)

### Active Mutator — "Tidecaller"
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 4 | 0 | combo 4, 8, 12... |
| 2 | Wave | score | 20 | 0 | score 20, 40, 60... |
| 3 | Totem | lines | 10 | 0 | lines 10, 20, 30... |

### Passive Mutator — "Calm Tides"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 100 | Neutral |
| star_threshold_modifier | 127 | Slightly easier stars |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 1 | +1 per line cleared |
| perfect_clear_bonus | 0 | — |
| starting_rows | 0 | Default (4) |

---

## Zone 2 — Ancient Egypt

**Theme**: Builders who reshape the board — clear big, chain fast, work with more material.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 20 | +4 — builders get more moves to sculpt |
| max_moves | 55 | +7 — generous budget |
| base_ratio_x100 | 80 | +16 — need more points per move |
| max_ratio_x100 | 165 | +21 — steeper scoring curve |
| tier_1_threshold | 4 | Easy starts L4 |
| tier_2_threshold | 7 | Medium starts L7 |
| tier_3_threshold | 9 | MediumHard starts L9 |
| tier_4_threshold | 11 | Hard — never reached |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | Early — builders work within rules |
| level_cap | 10 | |
| boss_id | 2 | Demolisher (BreakBlocks + ComboLines) |
| endless_difficulty_thresholds | packed [0, 20, 55, 105, 200, 370, 650, 1170] | +30% headroom for hot scoring |
| endless_score_multipliers | packed [10, 15, 20, 35, 50, 70, 100, 130] | Steeper late-game (up to 13x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-3), E(4-6), M(7-8), MH(9-10/boss)

### Active Mutator — "Pharaoh's Command" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Wave | combo | 3 | 1 | combo 3, 6, 9... |
| 2 | Hammer | lines | 6 | 0 | lines 6, 12, 18... |
| 3 | None | — | 0 | 0 | — |

50/50 Wave or Hammer. Wave starts with 1 charge (builder starts with a tool). Both combo/lines triggered — rewards active play.

### Passive Mutator — "Foundation Stone"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 150 | 1.5x combo scoring |
| star_threshold_modifier | 128 | Neutral |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 15 | Significant grid-clear reward |
| starting_rows | 5 | Start with 5 filled rows |

### Endless
Uses "Foundation Stone" passive only, no bonuses. 5 starting rows + 1.5x combo + 15pt perfect clear = high-scoring but volatile. Thresholds pushed +30% to give headroom. Score multipliers steeper (up to 13x at Master) to reward survival.

---

## Zone 3 — Norse

**Theme**: Shatter everything — raw aggression, brute force, momentum-based play.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 18 | +2 — decent budget |
| max_moves | 50 | +2 — solid |
| base_ratio_x100 | 70 | +6 — moderate scoring |
| max_ratio_x100 | 155 | +11 — slightly steeper |
| tier_1_threshold | 3 | Easy starts L3 |
| tier_2_threshold | 6 | Medium starts L6 |
| tier_3_threshold | 8 | MediumHard starts L8 |
| tier_4_threshold | 10 | Hard starts L10 |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 4 | |
| level_cap | 10 | |
| boss_id | 3 | Daredevil (ComboStreak + ComboLines) |
| endless_difficulty_thresholds | packed [0, 15, 35, 70, 130, 240, 420, 750] | Faster ramp — berserker pace |
| endless_score_multipliers | packed [10, 15, 20, 30, 45, 65, 90, 120] | Strong rewards (up to 12x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-2), E(3-5), M(6-7), MH(8-9), **H(10/boss)**

First zone to reach Hard at boss. Daredevil boss = sustain combo streaks + combo lines. Totem feeds cascades perfectly.

### Active Mutator — "Ragnarök" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Totem | combo | 3 | 1 | combo 3, 6, 9... |
| 2 | Totem | lines | 8 | 0 | lines 8, 16, 24... |
| 3 | None | — | 0 | 0 | — |

Totem guaranteed (both slots). Two earning paths: combo chain or grind lines. Starts with 1 charge — viking strikes first.

### Passive Mutator — "Frozen Rage"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 150 | 1.5x combo — berserker chains pay off |
| star_threshold_modifier | 128 | Neutral |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 2 | +2 per line — brute clearing rewarded |
| perfect_clear_bonus | 0 | Vikings don't clean up |
| starting_rows | 4 | Default |

### Endless
Totem + 1.5x combo + line_clear_bonus 2 = aggressive endless rewarding size cluster recognition. Faster ramp (Master at 750 vs Z1's 900) but strong multipliers (12x). Gets intense sooner than Z1/Z2.

---

## Zone 4 — Ancient Greece

**Theme**: Surgical precision — wisdom, strategy, elegance. Do more with less, leave it pristine.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 14 | -2 — tighter budget, every move counts |
| max_moves | 44 | -4 — less room for waste |
| base_ratio_x100 | 60 | -4 — slightly easier scoring per move |
| max_ratio_x100 | 140 | -4 — balanced |
| tier_1_threshold | 4 | Easy starts L4 |
| tier_2_threshold | 7 | Medium starts L7 |
| tier_3_threshold | 9 | MediumHard starts L9 |
| tier_4_threshold | 11 | Hard — never reached |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | Early — strategists plan around constraints |
| level_cap | 10 | |
| boss_id | 4 | Purist (KeepGridBelow + ComboLines) |
| endless_difficulty_thresholds | packed [0, 12, 30, 60, 120, 220, 400, 700] | Compressed — scoring is slower without combo mult |
| endless_score_multipliers | packed [10, 15, 20, 30, 40, 60, 80, 100] | Matches Z1 defaults |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-3), E(4-6), M(7-8), **MH(9-10/boss)**

Same boss tier as Z1/Z2 but Purist boss is mechanically harder — keep grid below threshold while clearing combo lines. Demands discipline.

### Active Mutator — "Athena's Chisel" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 4 | 0 | combo 4, 8, 12... |
| 2 | Hammer | score | 15 | 0 | score 15, 30, 45... |
| 3 | None | — | 0 | 0 | — |

Hammer guaranteed. Two earning paths: combo burst or steady scoring. No starting charges — the sculptor earns every strike.

### Passive Mutator — "Marble Discipline"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 100 | Neutral — no flashy multipliers |
| star_threshold_modifier | 130 | +2 harder stars — demands excellence |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 10 | Clean grid = Greek ideal |
| starting_rows | 4 | Default |

### Endless
Methodical endless — no combo mult, no line bonus. Precision grinding. Compressed thresholds (Master at 700) since scoring is slower. Multipliers match Z1 defaults (1x→10x).

---

## Zone 5 — Ancient China

**Theme**: Dragon's Wrath — overwhelming force, mass clearing, the dragon incinerates the board.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 18 | +2 — need moves to handle the pressure |
| max_moves | 52 | +4 — generous, managing chaos |
| base_ratio_x100 | 75 | +11 — harder scoring per move |
| max_ratio_x100 | 160 | +16 — steep |
| tier_1_threshold | 3 | Easy starts L3 |
| tier_2_threshold | 5 | Medium starts L5 |
| tier_3_threshold | 7 | MediumHard starts L7 |
| tier_4_threshold | 9 | Hard starts L9 |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 4 | |
| level_cap | 10 | |
| boss_id | 6 | Tidal (KeepGridBelow + ComboLines) |
| endless_difficulty_thresholds | packed [0, 18, 45, 90, 170, 310, 550, 950] | High — line bonus inflates scores |
| endless_score_multipliers | packed [10, 15, 20, 30, 45, 65, 90, 120] | Strong rewards (up to 12x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-2), E(3-4), M(5-6), MH(7-8), **H(9-10/boss)**

Tidal boss: KeepGridBelow + ComboLines. Control the dragon's fire — keep grid from overflowing while clearing combo lines. Wave is survival, not just scoring.

### Active Mutator — "Dragon Breath" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Wave | lines | 6 | 1 | lines 6, 12, 18... |
| 2 | Wave | score | 18 | 0 | score 18, 36, 54... |
| 3 | None | — | 0 | 0 | — |

Wave guaranteed. Lines trigger (clearing fuels more clearing) vs score trigger (output fuels more fire). Starts with 1 — dragon opens with flame.

Contrast with Egypt: Egypt earns Wave through combos (chaining), China earns through raw output (lines + score).

### Passive Mutator — "Imperial Scale"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 100 | Neutral — power from Wave, not combos |
| star_threshold_modifier | 128 | Neutral |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 3 | +3 per line — highest so far, dragon rewards mass clearing |
| perfect_clear_bonus | 0 | Dragons don't clean, they burn |
| starting_rows | 5 | Dense board — more fuel for the dragon |

### Endless
Dense start (5 rows) + line_clear_bonus 3 + Wave = high-volume clearing machine. High thresholds (Master at 950) because line bonus inflates scores. Multipliers up to 12x. The dragon burns long.

---

## Zone 6 — Ancient Persia

**Theme**: Mosaic mastery — intricate patterns, geometry, symmetry. Steady, consistent excellence.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 16 | Same as Z1 |
| max_moves | 48 | Same as Z1 |
| base_ratio_x100 | 70 | +6 — slightly harder scoring |
| max_ratio_x100 | 150 | +6 — moderate |
| tier_1_threshold | 3 | Easy starts L3 |
| tier_2_threshold | 6 | Medium starts L6 |
| tier_3_threshold | 8 | MediumHard starts L8 |
| tier_4_threshold | 10 | Hard starts L10 |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | Early — patterns within rules |
| level_cap | 10 | |
| boss_id | 7 | Stacker (ComboStreak + ComboLines) |
| endless_difficulty_thresholds | packed [0, 13, 35, 70, 135, 250, 440, 780] | Moderate pacing |
| endless_score_multipliers | packed [10, 15, 20, 30, 45, 60, 85, 110] | Steady (up to 11x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-2), E(3-5), M(6-7), MH(8-9), **H(10/boss)**

Stacker boss: ComboStreak + ComboLines. Maintain flow and rhythm — Totem shatters feed gravity cascades that sustain streaks.

### Active Mutator — "Mosaic Eye" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Totem | score | 15 | 0 | score 15, 30, 45... |
| 2 | Totem | lines | 7 | 0 | lines 7, 14, 21... |
| 3 | None | — | 0 | 0 | — |

Totem guaranteed. Score trigger (patient observation) + lines trigger. No starting charges — artisan studies the board first.

Contrast with Norse: Norse earns Totem through combos (aggressive). Persia earns through score and lines (patient, consistent).

### Passive Mutator — "Geometric Flow"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 120 | 1.2x combo — moderate, rewards rhythm |
| star_threshold_modifier | 130 | +2 harder stars — demands consistency |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 1 | +1 per line — steady contribution |
| perfect_clear_bonus | 0 | — |
| starting_rows | 4 | Default |

### Endless
Totem + 1.2x combo + line bonus 1. Moderate scoring pace. Steady escalation (Master at 780, 11x). Not as compressed as Japan, not as generous as China.

---

## Zone 7 — Feudal Japan

**Theme**: Lethal efficiency — discipline, economy of motion, mastery through restraint. Every move counts.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 12 | -4 — tightest budget so far |
| max_moves | 38 | -10 — no wasted motion |
| base_ratio_x100 | 55 | -9 — easier scoring per move (blade hits hard) |
| max_ratio_x100 | 125 | -19 — each move delivers |
| tier_1_threshold | 3 | Easy starts L3 |
| tier_2_threshold | 5 | Medium starts L5 |
| tier_3_threshold | 7 | MediumHard starts L7 |
| tier_4_threshold | 9 | Hard starts L9 |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | |
| level_cap | 10 | |
| boss_id | 5 | Harvester (BreakBlocks + ComboStreak) |
| endless_difficulty_thresholds | packed [0, 10, 25, 50, 100, 180, 320, 550] | Most compressed — fast escalation |
| endless_score_multipliers | packed [10, 15, 25, 35, 50, 70, 90, 110] | Strong rewards (up to 11x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-2), E(3-4), M(5-6), MH(7-8), **H(9-10/boss)**

Faster ramp, reaches Hard at boss. Fewer moves than any zone — efficiency is everything.

### Active Mutator — "Iai Strike" (2 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 3 | 0 | combo 3, 6, 9... |
| 2 | Hammer | lines | 5 | 0 | lines 5, 10, 15... |
| 3 | None | — | 0 | 0 | — |

Hammer guaranteed. Low thresholds (few moves = can't afford high thresholds). No starting charges — the samurai draws when ready.

### Passive Mutator — "Bushido"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 130 | 1.3x combo — flow state rewarded |
| star_threshold_modifier | 128 | Neutral |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 5 | Small reward for clean finish |
| starting_rows | 4 | Default |

### Endless
Tight, fast-paced. Most compressed ramp (Master at 550). Escalates fast — fits lethal efficiency. High multipliers (11x) reward surviving the pressure.

---

## Zone 8 — Mayan

**Theme**: Blood Sacrifice — ritual, cosmic cycles, power has a cost. Start loaded, earn slowly, spend wisely.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 16 | Same as Z1 |
| max_moves | 46 | -2 — slightly tighter |
| base_ratio_x100 | 75 | +11 — harder scoring |
| max_ratio_x100 | 160 | +16 — steep |
| tier_1_threshold | 3 | Easy starts L3 |
| tier_2_threshold | 5 | Medium starts L5 |
| tier_3_threshold | 7 | MediumHard starts L7 |
| tier_4_threshold | 9 | Hard starts L9 |
| tier_5_threshold | 11 | VeryHard — never reached |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | |
| level_cap | 10 | |
| boss_id | 8 | Surgeon (BreakBlocks + ComboStreak) |
| endless_difficulty_thresholds | packed [0, 18, 45, 95, 180, 330, 580, 1000] | High — 1.75x combo inflates fast |
| endless_score_multipliers | packed [10, 15, 25, 35, 50, 70, 100, 130] | Highest ceiling (13x) tied with Z2 |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1-2), E(3-4), M(5-6), MH(7-8), **H(9-10/boss)**

Surgeon boss: BreakBlocks + ComboStreak. Destroy specific blocks while sustaining momentum. Having all 3 tools means you pick the right one — if you saved charges.

### Active Mutator — "Blood Ritual" (3 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 6 | 2 | combo 6, 12, 18... |
| 2 | Wave | lines | 12 | 2 | lines 12, 24, 36... |
| 3 | Totem | score | 30 | 2 | score 30, 60, 90... |

All 3 tools in pool. Start with 2 charges each — the offering is given upfront. Thresholds are highest of any zone. Earning more is a grind. Spend the sacrifice wisely.

### Passive Mutator — "Jungle Altar"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 175 | 1.75x combo — massive payoff for chains |
| star_threshold_modifier | 128 | Neutral |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 0 | — |
| starting_rows | 4 | Default |

### Endless
1.75x combo makes scoring explosive. High thresholds (Master at 1000) to compensate. 13x at Master — tied with Z2 for highest ceiling. The ritual rewards the faithful.

---

## Zone 9 — Tribal

**Theme**: War Drums — rhythm, endurance, relentless primal ritual. Everything earned through the beat.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 15 | -1 — tight |
| max_moves | 45 | -3 — lean |
| base_ratio_x100 | 70 | +6 — moderate |
| max_ratio_x100 | 155 | +11 — steep |
| tier_1_threshold | 2 | Easy starts L2 |
| tier_2_threshold | 4 | Medium starts L4 |
| tier_3_threshold | 6 | MediumHard starts L6 |
| tier_4_threshold | 8 | Hard starts L8 |
| tier_5_threshold | 10 | VeryHard starts L10 |
| tier_6_threshold | 11 | Expert — never reached |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 3 | |
| level_cap | 10 | |
| boss_id | 9 | Ascetic (KeepGridBelow + ComboStreak) |
| endless_difficulty_thresholds | packed [0, 14, 35, 75, 140, 260, 460, 800] | Compressed — fast escalation |
| endless_score_multipliers | packed [10, 15, 25, 35, 50, 70, 95, 120] | Strong (up to 12x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1), E(2-3), M(4-5), MH(6-7), H(8-9), **VH(10/boss)**

First zone to reach VeryHard at boss. Ascetic: KeepGridBelow + ComboStreak. Keep grid controlled while sustaining rhythm — the drums can't stop.

### Active Mutator — "War Beat" (3 slots)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 4 | 0 | combo 4, 8, 12... |
| 2 | Totem | combo | 5 | 0 | combo 5, 10, 15... |
| 3 | Wave | combo | 6 | 0 | combo 6, 12, 18... |

All 3 tools, ALL combo-triggered. Staggered thresholds: Hammer easiest (4), Totem mid (5), Wave hardest (6). Zero starting charges. The ONLY way to earn is combos — no lines, no score fallback.

### Passive Mutator — "Primal Pulse"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 160 | 1.6x combo — the beat pays off |
| star_threshold_modifier | 130 | +2 harder stars — relentless demands excellence |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 0 | — |
| starting_rows | 4 | Default |

### Endless
Pure combo zone. 1.6x combo inflates scores. Compressed ramp (Master at 800). Players who mastered VeryHard boss are ready for fast escalation. 12x at Master.

---

## Zone 10 — Inca

**Theme**: Sun God's Trial — absolute mastery, the pinnacle. One tool, maximum payoff.

### GameSettings
| Field | Value | Diff from Z1 |
|-------|-------|-------------|
| base_moves | 14 | -2 — tight |
| max_moves | 42 | -6 — demanding |
| base_ratio_x100 | 80 | +16 — steep scoring |
| max_ratio_x100 | 170 | +26 — hardest ratio |
| tier_1_threshold | 2 | Easy starts L2 |
| tier_2_threshold | 4 | Medium starts L4 |
| tier_3_threshold | 6 | MediumHard starts L6 |
| tier_4_threshold | 8 | Hard starts L8 |
| tier_5_threshold | 9 | VeryHard starts L9 |
| tier_6_threshold | 10 | Expert starts L10 |
| tier_7_threshold | 11 | Master — never reached |
| constraint_start_level | 2 | Earliest — constraints from L2 |
| level_cap | 10 | |
| boss_id | 10 | Perfectionist (ComboLines + BreakBlocks) |
| endless_difficulty_thresholds | packed [0, 20, 50, 110, 210, 380, 660, 1100] | Highest — 2x combo inflates hard |
| endless_score_multipliers | packed [10, 20, 30, 40, 60, 80, 110, 150] | Highest ceiling (15x) |
| block weights | defaults | |
| variance | 5/5/5 | |

**Difficulty per level**: VE(1), E(2-3), M(4-5), MH(6-7), H(8), VH(9), **Ex(10/boss)**

Only zone to reach Expert at boss. Perfectionist: ComboLines + BreakBlocks — demands every skill simultaneously.

### Active Mutator — "Inti's Demand" (1 slot)
| Slot | Bonus | Trigger | Threshold | Start Charges | Earns at... |
|------|-------|---------|-----------|---------------|-------------|
| 1 | Hammer | combo | 5 | 0 | combo 5, 10, 15... |
| 2 | None | — | 0 | 0 | — |
| 3 | None | — | 0 | 0 | — |

Single tool. Hammer only — precision stone chisel. One earning path, no variety, no safety net.

### Passive Mutator — "Altitude"
| Field | Value | Effect |
|-------|-------|--------|
| moves_modifier | 128 | Neutral |
| ratio_modifier | 128 | Neutral |
| difficulty_offset | 128 | Neutral |
| combo_score_mult_x100 | 200 | 2.0x combo — highest of all zones |
| star_threshold_modifier | 132 | +4 hardest stars — crown jewel |
| endless_ramp_mult_x100 | 100 | Neutral |
| line_clear_bonus | 0 | — |
| perfect_clear_bonus | 20 | Highest perfect clear — mastery rewarded |
| starting_rows | 5 | Dense board — the mountain is built |

### Endless
2x combo + 5 rows + 20pt perfect clear = explosive scoring. Highest thresholds (Master at 1100) and highest multiplier (15x). The summit.
