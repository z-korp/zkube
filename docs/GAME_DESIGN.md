# zKube — Game Design Document

> **Status:** Decisions locked — ready for implementation
> **Version:** v1.3
> **Last updated:** 2026-03-29

---

## Core Concept

**Fast, fair, skill-first puzzle game with two distinct modes.**

Players manipulate blocks on an 8×10 grid to form complete horizontal lines. Two game modes — Map (10-level structured progression) and Endless (pure survival) — are available on all 3 maps. No economy, no upgrades, no consumables. Stars and score are the only progression signals.

### Design Pillars
1. **Skill-first** — No pay-to-win, no upgrades. Every player starts equal.
2. **Two modes, one game** — Map for structured challenge, Endless for pure survival. Both replayable.
3. **Replayability** — VRF seeds, mutators, and difficulty scaling create unique runs.
4. **Competitive** — Per-mode leaderboards + daily challenges with shared seeds.

---

## Game Modes

### ENDLESS MODE
- Starts at **VeryEasy** difficulty
- Difficulty scales up to **Master** based on **total score thresholds**
- **Score multiplier increases** at each difficulty tier → harder = more rewarding, prevents scoring plateau
- **No constraints** — pure survival
- **No move limits** — play until the grid fills up
- **No levels** — single continuous game with dynamic difficulty
- **One mutator** rolled at game start, applies for the entire run
- **Endless can access the full mutator pool** (not gated to map)
- **Ranking:** Pure `total_score`

### MAP MODE
- **10 levels** with progressive difficulty (VeryEasy → Expert)
- **Constraints** appear from level 3+ (ComboLines, BreakBlocks, ComboStreak)
- **Boss at level 10** — dual constraints, themed boss identity, KeepGridBelow
- **Clearing level 10 = game ends** (clean exit with final score + stars)
- **Star ratings** per level (0-3 stars based on moves efficiency)
- **One mutator** rolled at game start, applies for the entire run
- **Map mode uses map-gated mutators** (3 per map)
- **Ranking:** `total_stars × 65536 + total_score` (stars dominate, score tiebreaks)

### Both modes on all maps
- Polynesian, Feudal Japan, Ancient Persia each support both Endless and Map
- Each map × mode combination tracks its own personal best
- Same `GameSettings` preset per map — mode controls game rules, not settings

---

## Game Flow

```
ENDLESS:  Home → Select Map → Select Mode → Free Mint → Play → Grid fills → Game Over
MAP:      Home → Select Map → Select Mode → Free Mint → Play L1-L10 → Boss → Map Cleared → Game Over
```

### Creation Flow
1. Player picks a **map** (Polynesian / Feudal Japan / Ancient Persia)
2. Player picks a **mode** (Endless / Map)
3. `free_mint(settings_id)` → NFT with map's settings_id
4. `create(game_id, mode)` → VRF seed, initial grid, mode stored in RunData
5. **Endless:** Single perpetual level initialized (VeryEasy, no constraints, mutator rolled from full pool)
6. **Map:** Level 1 initialized (with settings, constraints, mutator rolled from map's gated pool)

### Auto-Advance (Map mode only)
Level completion happens within the same transaction as the final move. No "next level" button — the grid resets and the next level begins automatically.

---

## Grid Mechanics

### Grid
- 8 columns × 10 rows
- Stored as `felt252` (240 bits): each block = 3 bits (0-4), 0 = empty
- Gravity: blocks fall after any line clear

### Blocks
- 4 sizes: 1, 2, 3, 4 (stored as 3-bit values)
- Blocks of size N occupy N consecutive cells
- Only horizontal movement (swipe left/right within a row)

### Line Clears
- Complete horizontal line (all 8 cells filled) → cleared
- Multiple simultaneous clears + gravity cascades → combo
- After clears + gravity, a new line is added from below

### Game Over
- After adding a new line, if blocks would exceed row 10 → game ends

---

## Maps (Zones)

### Alpha Maps (3)

| Map | Theme ID | Visual Identity | Settings ID | Gated Mutators |
|-----|----------|-----------------|-------------|----------------|
| Polynesian | `theme-1` | Teal ocean, moonlit coast | 0 | Mutators 1, 2, 3 |
| Feudal Japan | `theme-5` | Red/black lacquer, cherry blossoms | 1 | Mutators 4, 5, 6 |
| Ancient Persia | `theme-7` | Deep blue geometric, golden | 2 | Mutators 7, 8, 9 |

- All maps free and unlocked at alpha
- Each map has its own `GameSettings` preset (difficulty curve, move counts, etc.)
- `settings_id` is baked into the NFT token at mint time (embeddable game standard)
- Mode is passed as a runtime parameter to `create()`, NOT stored in the token

---

## Endless Mode — Difficulty Scaling

### Score-Based Progression with Multiplier

Difficulty tier changes as `total_score` crosses configurable thresholds. Each tier also applies a **score multiplier** so harder play is more rewarding.

| Tier | Difficulty | Score Threshold | Score Multiplier | Notes |
|------|-----------|----------------|-----------------|-------|
| 0 | VeryEasy | 0 | 100 (1.0×) | Brief warm-up (~8-12 moves) |
| 1 | Easy | 15 | 115 (1.15×) | Short (~10-15 moves) |
| 2 | Medium | 40 | 135 (1.35×) | Ramp begins |
| 3 | MediumHard | 80 | 165 (1.65×) | Getting serious |
| 4 | Hard | 150 | 200 (2.0×) | Steep jump |
| 5 | VeryHard | 280 | 250 (2.5×) | Expert territory |
| 6 | Expert | 500 | 325 (3.25×) | Elite players only |
| 7 | Master | 900 | 400 (4.0×) | Terminal — survive or die |

**Scoring context:** 1 line clear ≈ 1-2 base points. Combos add `combo_counter × lines_cleared` bonus. With multiplier, a 3-line combo at Master (3.0×) earns ~27 points vs ~9 at VeryEasy (1.0×).

**Storage:** Thresholds packed as 8 × u16 in `GameSettings.endless_difficulty_thresholds` (felt252). Multipliers packed as 8 × u8 (×100 format, so 150 = 1.5×) in a second felt252 field or in the same packing.

*All values are configurable per map via GameSettings — different maps can scale differently.*
*Multiplier stored as integer ×100 (e.g., 150 = 1.5×). Applied in scoring: `final_points = base_points × multiplier / 100`.*

**Key property:** Difficulty only goes **up**, never down (monotonic). Once you cross a threshold, you stay at that tier. The multiplier ensures that even though blocks get harder, your score accelerates — preventing the "plateau" feeling.

### Endless Game Loop
1. Player moves a block
2. Lines clear (if any) → score updated with current multiplier
3. Gravity + cascades
4. Check: did total_score cross a difficulty threshold? → update difficulty tier
5. New row spawned (using current difficulty's block distribution)
6. Grid full → game over

---

## Map Mode — Level System

### Levels 1-10

| Level | Difficulty | Constraints | Notes |
|-------|-----------|-------------|-------|
| 1-2 | VeryEasy | None | Tutorial-like |
| 3-4 | Easy | 0-1 | Constraints introduced |
| 5-6 | Medium | 0-1 | Mid-game challenge |
| 7-8 | MediumHard-Hard | 1 | Serious challenge |
| 9 | Hard-VeryHard | 1 | Pre-boss tension |
| 10 | VeryHard-Expert | 1-2 | **Boss** — themed identity, KeepGridBelow |

### Level Parameters
- **Moves:** ~20 (L1) scaling to ~40 (L10), from `GameSettings`
- **Points target:** Ratio 0.80 (L1) to 1.80 (L10)
- **Constraints:** Budget-based selection from 4 types
- **Boss (L10):** 10 themed boss identities, dual constraints

### Map Cleared
Clearing L10 boss → `zone_cleared = true` → game ends → score + stars recorded. No transition to endless. Endless is a separate game mode.

---

## Constraint System (Map mode only)

| Type | Mechanic | Regular | Boss |
|------|----------|:-------:|:----:|
| **ComboLines** | Clear X lines in one move, Y times | ✅ | ✅ |
| **BreakBlocks** | Destroy X blocks of size S | ✅ | ✅ |
| **ComboStreak** | Reach combo counter of X | ✅ | ✅ |
| **KeepGridBelow** | Keep grid below X filled rows | ❌ | ✅ |

Endless mode has **no constraints** — pure survival.

---

## Mutator System

### Overview
Mutators modify level generation and/or scoring. One mutator per run, rolled deterministically from seed at game start.

### Mutator Pool & Gating
- **Total pool:** Up to 32 mutators (stored as `u32` bitmask)
- **Map gating:** Each map allows 3 specific mutators (via `GameSettings.allowed_mutators`)
- **Endless mode:** Accesses the **full pool** (not gated to map)
- **Daily challenge:** Accesses the **full pool** (not gated to map)
- **Mode eligibility tags:** Each mutator is tagged `map_only`, `endless_only`, or `universal`

### Mutator Rolling
```
mutator_id = roll_mutator(seed, allowed_pool)
```
- Deterministic from seed → same seed always produces same mutator
- Stored in `RunData.active_mutator_id` and `GameLevel.mutator_id`

### Mutator Hooks (specifics TBD — interfaces designed)
- `modify_level_config()` — alter moves, ratio, difficulty at level generation
- `modify_score()` — alter scoring on line clears
- `modify_block_weights()` — alter block distribution for new rows

### Status
Hooks and interfaces will be implemented with no-op defaults. Actual mutator effects defined later.

---

## Star System (Map mode only)

- Each level awards 0-3 stars based on moves efficiency
- 2 bits per level × 10 levels = 20 bits in `level_stars`
- Total stars (0-30) is the primary ranking signal for Map mode leaderboard
- Endless mode has no stars — pure score ranking

---

## Combo System

- Clearing 2+ lines in one move = combo
- Gravity cascades can extend combos
- `combo_counter` resets per level (Map) or runs continuously (Endless)
- `max_combo_run` tracks best combo across the entire run
- Higher combos = more points per line
- In Endless, combo scoring is further multiplied by the difficulty tier multiplier

---

## Leaderboard

### Per Map × Mode Leaderboards

| Combination | Ranking Formula |
|-------------|----------------|
| Map (per map) | `total_stars × 65536 + total_score` |
| Endless (per map) | `total_score` |
| Daily (single) | Mode-specific formula (derived from daily's mode) |

Total: up to 6 leaderboards (3 maps × 2 modes) + 1 daily.

### Personal Bests
New `PlayerBestRun` model tracks per player × map × mode:
- `best_score` (u32)
- `best_stars` (u8, Map only)
- `best_level` (u8, Map only)
- `map_cleared` (bool, Map only)

---

## Daily Challenge

### How It Works
1. **Admin creates** a daily challenge: picks mode (Endless or Map), picks map, shared seed generated
2. All players play the **exact same** level/grid sequence (deterministic)
3. **Unlimited attempts** — best run counts
4. **All maps unlocked** for daily (no gating)
5. **Full mutator pool** available (no map gating)
6. Ranked by **mode-specific formula** (score for Endless, stars+score for Map)

### Daily Models
- `DailyChallenge` gains `mode` and `map_settings_id` fields
- No more special settings_id range (100-109). Daily uses real map settings + mode override.
- `create_challenge_game(game_id, challenge_id)` bypasses entitlement checks

---

## Data Model

### RunData (102 bits packed in felt252)

```
Bits 0-7:     current_level (u8)          — Map: 1-10, Endless: always 1
Bits 8-15:    level_score (u8)            — Map: per-level score, Endless: unused
Bits 16-23:   level_moves (u8)           — Map: moves this level, Endless: unused
Bits 24-31:   constraint_progress (u8)    — Map: primary constraint, Endless: unused
Bits 32-39:   constraint_2_progress (u8)  — Map: secondary constraint, Endless: unused
Bits 40-47:   max_combo_run (u8)          — Both: best combo this run
Bits 48-79:   total_score (u32)           — Both: cumulative score
Bit 80:       zone_cleared (bool)         — Map: cleared L10, Endless: false
Bits 81-88:   current_difficulty (u8)     — Both: active difficulty tier (0-7)
Bits 89-92:   zone_id (u4)               — Reserved
Bits 93-100:  active_mutator_id (u8)      — Both: active mutator (0=none)
Bit 101:      mode (u1)                  — 0=Map, 1=Endless
```

**Changes from current:**
- `endless_depth` → `current_difficulty` (repurposed, same position)
- `mutator_mask` → `active_mutator_id` (renamed, same position)
- Added `mode` bit at position 101
- Total: 102 bits (was 101)

### New Model: PlayerBestRun

```cairo
#[dojo::model]
pub struct PlayerBestRun {
    #[key] pub player: ContractAddress,
    #[key] pub settings_id: u32,     // map identity
    #[key] pub mode: u8,             // 0=Map, 1=Endless
    pub best_score: u32,
    pub best_stars: u8,              // Map only
    pub best_level: u8,              // Map only
    pub map_cleared: bool,           // Map only
    pub best_game_id: felt252,
}
```

### Modified: GameLevel

```cairo
pub struct GameLevel {
    // ... existing fields ...
    pub mutator_id: u8,  // NEW: mutator active for this level
}
```

### Modified: DailyChallenge

```cairo
pub struct DailyChallenge {
    // ... existing fields ...
    pub mode: u8,              // 0=Map, 1=Endless
    pub map_settings_id: u32,  // actual map (0, 1, 2)
}
```

### Modified: GameSettings

```cairo
pub struct GameSettings {
    // ... existing fields ...
    pub allowed_mutators: u32,                  // bitmask of allowed mutator IDs
    pub endless_difficulty_thresholds: felt252,  // packed score thresholds for 8 tiers
}
```

---

## EGC Integration (Embeddable Game Component)

The game uses Provable Games' `game_components_minigame` framework:

### Token → Game Flow
1. `FullTokenContract.free_mint(settings_id)` → Creates NFT with `settings_id` in TokenMetadata
2. `settings_id` represents the **map** (0=Polynesian, 1=Japan, 2=Persia) — NOT the mode
3. `game_system.create(game_id, mode)` reads `settings_id` from token metadata via `ConfigUtilsTrait::get_game_settings()`
4. `GameSettings` loaded from Dojo world storage by `settings_id`
5. **Mode** (Map=0, Endless=1) is a runtime parameter — not stored in the token

### GameSettings (40+ configurable fields per map)
- **Level scaling:** base_moves (20), max_moves (60), base_ratio_x100 (80), max_ratio_x100 (180)
- **Difficulty progression:** 8 tier thresholds (VeryEasy→Master)
- **Constraints:** budgets, chances, start_level — all configurable per map
- **Block distribution:** size weights per difficulty tier (10 weights: 5 VeryEasy + 5 Master)
- **Mutator gating:** `allowed_mutators` u32 bitmask (3 per map for Map mode)
- **Endless scaling:** `endless_difficulty_thresholds` + `endless_score_multipliers`
- **Legacy fields (unused):** draft_*, cube_*, starting_charges — v1.2 artifacts, not removed yet

### Map Access Control
- `GameSettingsMetadata.is_free` determines if a map requires purchase
- settings_id 0 (Polynesian): free for all
- settings_id 1, 2 (Japan, Persia): require `MapEntitlement` (purchased)
- Daily challenge games bypass entitlement checks

## Implementation Status

| Feature | Contract | Frontend |
|---------|:--------:|:--------:|
| Grid mechanics | ✅ | ✅ |
| Map mode (10 levels + boss) | ✅ | ✅ |
| Endless mode (separate) | ✅ | ❌ Build |
| GameMode enum + RunData | ✅ | ❌ Build |
| Mutator hooks (no-op) | ✅ | ❌ Build |
| Mutator effects (actual) | ❌ Later | ❌ Later |
| PlayerBestRun model | ✅ | ❌ Build |
| Mode-aware leaderboards | ✅ | ❌ Build |
| Mode-aware game creation | ✅ | ❌ Build |
| Mode-aware moves | ✅ | ❌ Build |
| Mode-aware game over | ✅ | ❌ Build |
| Daily challenge (mode-aware) | ✅ | ❌ Build |
| Score multiplier (endless) | ❌ Hook only | ❌ Build |
| Star system (map) | ✅ | ✅ |
| Constraint system (map) | ✅ | ✅ |
| Auto-advance (map) | ✅ | ✅ |

### Stale v1.2 Artifacts (cosmetic debt, not functional issues)
- `GameSettings` still has `draft_picks`, `draft_pool_mask`, `draft_fixed_level`, `boss_upgrades_enabled`, `reroll_base_cost`, `starting_charges`, `cube_3_percent`, `cube_2_percent` — all unused
- Events: `LevelCompleted.cubes`, `LevelCompleted.bonuses_earned`, `RunCompleted.total_cubes` — always 0
- `MetaData.total_cubes_earned` — never incremented
- `DailyEntry.best_cubes` — never updated
- `constants.cairo`: `VERSION = 'v1.2.0'` — should be v1.3
- Constraint generation still includes FillAndClear type in the enum (not generated for levels ≤10)

---

## Locked Decisions

| Decision | Answer |
|----------|--------|
| Endless difficulty driver | Total score with multiplier per tier |
| Map L10 clear | Game ends (clean exit). No transition to endless. |
| Map ranking formula | `total_stars × 65536 + total_score` |
| Endless ranking formula | Pure `total_score` |
| Mutator mode eligibility | Tagged: map_only / endless_only / universal |
| Mutator frequency | One per run (both modes). Rolled at game start. |
| Map mutator pool | Gated to 3 per map |
| Endless mutator pool | Full pool (not gated) |
| Daily mutator pool | Full pool (not gated) |
| Mode storage | RunData bit 101 (not in token settings_id) |
| Stars in Endless | No stars. Pure score. |
| Cubes / economy | Removed. Stars + score only. |
| Bonuses / skills | Removed. |
