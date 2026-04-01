# zKube Game Design Reference

This document captures all locked design decisions for zKube, a fully on-chain puzzle game built with Dojo/Starknet.

## Product Thesis
Fast, fair, skill-first puzzle score-survival game. Short runs, strong replayability, competitive daily loop. Stars are the only progression signal. No economy, no skills, no draft.

## Core Pillars
1. **Fast**: 5-10 minute zone clear.
2. **Fair**: Player-owned losses; no hidden mechanics or pay-to-win.
3. **Readable**: Players should immediately understand why they won or lost.
4. **Replayable**: Seeds, bonuses, mutators, endless mode, and daily challenges ensure variety.
5. **Low Friction**: Optimized for both mobile and desktop play.

## Run Structure
- **1 Run = 1 Themed Zone**
- **Map Mode**: 10 levels, boss at L10, star ratings based on move efficiency.
- **Endless Mode**: Survival mode unlocked after L10 (or played directly via settings). Difficulty scales with total score, no level cap.
- **Success Criteria**: Zone cleared (Map) or personal best depth/score (Endless).

## Difficulty System
- **8 Tiers**: VeryEasy through Master.
- **Map Mode**: Tiers progress across 10 levels via `GameSettings` thresholds.
- **Endless Mode**: Tier determined by `total_score` via thresholds.
- **Score Multipliers**: Each difficulty tier applies a multiplier to points earned.

### Difficulty Tiers
| ID | Name |
|----|------|
| 2 | VeryEasy |
| 3 | Easy |
| 4 | Medium |
| 5 | MediumHard |
| 6 | Hard |
| 7 | VeryHard |
| 8 | Expert |
| 9 | Master |

## Constraint System
Constraints are level-specific objectives that must be met to complete a level.
- **Regular Levels (L1-9)**: 0-1 constraint.
- **Boss (L10)**: 1-2 constraints (dual constraints from boss identity).

### Constraint Types
| ID | Name | Description |
|----|------|-------------|
| 0 | None | No constraint, reach point goal only. |
| 1 | ComboLines | Clear X lines in a single move, Y times. |
| 2 | BreakBlocks | Destroy X blocks of a specific size (1-4). |
| 3 | ComboStreak | Reach a combo of X lines in a single move. |
| 4 | KeepGridBelow | Keep grid below X filled rows (Boss-only). |

### Boss Identities (L10)
Boss selection is deterministic (derived from seed). Each boss has a fixed constraint combination:
1. **Combo Master**: ComboLines + ComboStreak + KeepGridBelow
2. **Demolisher**: BreakBlocks + ComboLines + KeepGridBelow
3. **Daredevil**: ComboStreak + ComboLines + BreakBlocks
4. **Purist**: KeepGridBelow + ComboLines + ComboStreak
5. **Harvester**: BreakBlocks + ComboStreak + ComboLines
6. **Tidal**: KeepGridBelow + ComboLines + BreakBlocks
7. **Stacker**: ComboStreak + ComboLines + BreakBlocks
8. **Surgeon**: BreakBlocks + ComboStreak + KeepGridBelow
9. **Ascetic**: KeepGridBelow + ComboStreak + BreakBlocks
10. **Perfectionist**: ComboLines + BreakBlocks + ComboStreak

## Star Ratings
Stars are awarded based on move efficiency relative to the level's `max_moves`:
- **3 Stars**: Complete level in ≤ 40% of max moves.
- **2 Stars**: Complete level in ≤ 70% of max moves.
- **1 Star**: Complete the level.

## Bonus System
Three grid-manipulation bonuses are available per run, configured via `GameSettings`:
- **Hammer**: Destroy a single block at a target position.
- **Totem**: Destroy all blocks of the same size across the entire grid.
- **Wave**: Destroy an entire target row.

### Earning Charges
Charges are earned during a level and persist across levels. Counters reset each level.
- **Trigger Type 1 (Combo Streak)**: Earn 1 charge every N combos.
- **Trigger Type 2 (Lines Cleared)**: Earn 1 charge every N lines cleared.
- **Trigger Type 3 (Score)**: Earn 1 charge every N points scored.

**Limits**: Max 15 charges per bonus. Applying a bonus is free (no move cost).

### Default Polynesian Config
- **Slot 1**: Hammer (Type 1), Trigger: Combo Streak (1) every 5, Start: 1 charge.
- **Slot 2**: Wave (Type 3), Trigger: Score (3) every 30 pts, Start: 1 charge.
- **Slot 3**: Totem (Type 2), Trigger: Lines Cleared (2) every 10, Start: 1 charge.

*Note: Endless mode typically disables all bonus slots (Type 0).*

## Mutator System
Theme mutators modify scoring and pressure. They are fixed per map/zone.
- **Moves Modifier**: Bias-encoded (128 = neutral).
- **Ratio Modifier**: Bias-encoded.
- **Difficulty Offset**: Bias-encoded (+1 = 129).
- **Combo Score Mult**: x100 (100 = 1.0x).
- **Star Threshold Modifier**: Bias-encoded.
- **Endless Ramp Mult**: x100 (100 = normal).
- **Line Clear Bonus**: Flat points per line cleared.
- **Perfect Clear Bonus**: Points for clearing the entire grid.
- **Starting Rows**: Number of rows pre-filled (default 4).

### Alpha Mutators
- **Tidecaller (Map)**: +2 pts per line cleared. "The ocean rewards clean play."
- **Riptide (Endless)**: 1.5x combo score, +1 difficulty tier, 130% ramp. "The current accelerates."

## Leaderboard
- **Ranking**: Depth (level) first, then total score.
- **Composite Encoding**: `(endless_depth << 16) | total_score`.
- **Daily Challenge**: Shared seed, fixed zone, and fixed mutator.

## Daily Challenge
- One fixed theme, seed, and mutator per day.
- Unlimited attempts; only the best score is recorded.
- Free entry during Alpha.
- Stars awarded for participation and placement.

## Themes
| ID | Theme | Alpha Zone? |
|----|-------|:-----------:|
| 1 | Polynesian | Yes |
| 2 | Ancient Egypt | No |
| 3 | Norse | No |
| 4 | Ancient Greece | No |
| 5 | Feudal Japan | Planned |
| 6 | Ancient China | No |
| 7 | Ancient Persia | Planned |
| 8 | Mayan | No |
| 9 | Tribal (Pueblo) | No |
| 10 | Inca | No |

## Alpha Launch Config
- **Zone**: Polynesian (Theme 1).
- **Settings ID 0**: Map Mode (10 levels, bonuses enabled, Tidecaller mutator).
- **Settings ID 1**: Endless Mode (bonuses disabled, Riptide mutator).
- **Mutator ID 1**: Tidecaller.
- **Mutator ID 2**: Riptide.
- **Access**: All content unlocked (no gating).

## Adding New Maps (No Redeploy)
New maps can be added by registering new `GameSettings` and `MutatorDef` records:
1. Call `config_system.add_custom_game_settings()` for Map mode.
2. Call `config_system.add_custom_game_settings()` for Endless mode.
3. Call `mutator_system.register_mutator()` for Map theme mutator.
4. Call `mutator_system.register_mutator()` for Endless theme mutator.
5. Update Frontend with theme assets and `settings_id` mapping.

Example: Adding Feudal Japan
```
// Map mode (settings_id auto-assigned)
config_system.add_custom_game_settings(
    name: 'Feudal Japan',
    theme_id: 5,
    level_cap: 10,
    allowed_mutators: 4,  // bitmask: bit 2 = mutator ID 3
    bonus_1_type: 1, bonus_1_trigger_type: 1, bonus_1_trigger_threshold: 4, bonus_1_starting_charges: 0,
    bonus_2_type: 3, bonus_2_trigger_type: 3, bonus_2_trigger_threshold: 25, bonus_2_starting_charges: 0,
    bonus_3_type: 2, bonus_3_trigger_type: 2, bonus_3_trigger_threshold: 8, bonus_3_starting_charges: 0,
    ...other fields with defaults...
)

// Endless mode
config_system.add_custom_game_settings(
    name: 'Japan Endless',
    theme_id: 5,
    level_cap: 255,
    allowed_mutators: 8,  // bitmask: bit 3 = mutator ID 4
    bonus_1_type: 0, bonus_2_type: 0, bonus_3_type: 0,  // no bonuses
    ...
)

// Mutators
mutator_system.register_mutator(3, 'Moonrise', zone_id: 2, combo_score_mult: 150, moves_modifier: 126, ...)
mutator_system.register_mutator(4, 'Maelstrom', zone_id: 2, combo_score_mult: 200, difficulty_offset: 129, endless_ramp: 150, ...)
```

## Progression Model
- **Stars**: The ONLY progression signal.
- **No Economy**: No currency, no spending, no pay-to-win.
- **Permanent Progression**: Zone clears, star collection, personal bests, and leaderboard rank.
- **Success**: Clearing L10 boss (Map) or reaching new depths (Endless).

## Monetization (Post-Alpha)
- **Free-to-Start**: Zone 1 + Daily Challenges are free.
- **One-Time Unlock**: Zones 2-10 and all themes unlocked via a single purchase (target: 8.99 EUR).
- **Fairness**: Never monetize retries, competitive advantage, or fairness.

## What Does NOT Exist
- No skill system, draft, or skill tree.
- No cube token or in-game economy.
- No quest system or achievements (removed in redesign).
- No in-game shop or consumables.
- No permanent power progression.

## One-Sentence Rule
> Does this make the next run more fun, fair, and replayable within the first 10 minutes?

## Technical Reference: RunData Layout
`RunData` is packed into a `felt252` (118 bits used):
- **Bits 0-7**: `current_level` (u8)
- **Bits 8-15**: `level_score` (u8)
- **Bits 16-23**: `level_moves` (u8)
- **Bits 24-31**: `constraint_progress` (u8)
- **Bits 32-39**: `constraint_2_progress` (u8)
- **Bits 40-47**: `max_combo_run` (u8)
- **Bits 48-79**: `total_score` (u32)
- **Bit 80**: `zone_cleared` (bool)
- **Bits 81-88**: `current_difficulty` (u8)
- **Bits 89-92**: `zone_id` (u4)
- **Bits 93-100**: `active_mutator_id` (u8)
- **Bit 101**: `mode` (u1) — 0=Map, 1=Endless
- **Bits 102-103**: `bonus_type` (u2) — 0=None, 1=Hammer, 2=Totem, 3=Wave
- **Bits 104-107**: `bonus_charges` (u4) — Max 15
- **Bits 108-115**: `level_lines_cleared` (u8)
- **Bits 116-117**: `bonus_slot` (u2) — 0-2

## Technical Reference: GameSettings Defaults
| Parameter | Default Value |
|-----------|---------------|
| `base_moves` | 20 |
| `max_moves` | 60 |
| `base_ratio_x100` | 80 (0.80) |
| `max_ratio_x100` | 180 (1.80) |
| `tier_1_threshold` | 4 (Easy) |
| `tier_2_threshold` | 8 (Medium) |
| `tier_3_threshold` | 12 (MediumHard) |
| `tier_4_threshold` | 18 (Hard) |
| `tier_5_threshold` | 25 (VeryHard) |
| `tier_6_threshold` | 35 (Expert) |
| `tier_7_threshold` | 45 (Master) |
| `constraints_enabled` | 1 (True) |
| `constraint_start_level` | 3 |
| `veryeasy_budget_max` | 0 |
| `master_budget_max` | 80 |
| `level_cap` | 50 |
| `endless_thresholds` | [0, 15, 40, 80, 150, 280, 500, 900] |
| `endless_multipliers` | [1.0x, 1.2x, 1.4x, 1.7x, 2.0x, 2.5x, 3.3x, 4.0x] |
