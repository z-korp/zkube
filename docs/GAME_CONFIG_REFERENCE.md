# zKube Game Configuration Reference

> **Version:** 1.2.0  
> **Last Updated:** January 2026  
> **Purpose:** Centralized reference for all game balance parameters
>
> **Goal:** Eventually make all these parameters configurable via GameSettings (like death-mountain) to allow spinning up custom game modes, tournaments, and balance experiments.

---

## Table of Contents

1. [Grid Configuration](#grid-configuration)
2. [Level Generation](#level-generation)
3. [Difficulty Settings](#difficulty-settings)
4. [Bonus System](#bonus-system)
5. [Cube Economy](#cube-economy)
6. [Permanent Shop](#permanent-shop)
7. [In-Game Shop](#in-game-shop)
8. [Constraint System](#constraint-system)
9. [Data Limits](#data-limits)

---

## Grid Configuration

**Location:** `contracts/src/constants.cairo`

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DEFAULT_GRID_WIDTH` | 8 | Columns in game grid |
| `DEFAULT_GRID_HEIGHT` | 10 | Rows in game grid |
| `BLOCK_SIZE` | 8 | Max block value (2^3) |
| `BLOCK_BIT_COUNT` | 3 | Bits per block |
| `ROW_SIZE` | 16777216 | 2^24 (bits per row) |
| `ROW_BIT_COUNT` | 24 | Bits per row (8 blocks * 3 bits) |

### Block Types

| Value | Block Type | Width |
|-------|------------|-------|
| 0 | Empty | 0 |
| 1 | Size 1 | 1 block wide |
| 2 | Size 2 | 2 blocks wide |
| 3 | Size 3 | 3 blocks wide |
| 4 | Size 4 | 4 blocks wide |

---

## Level Generation

**Location:** `contracts/src/helpers/level.cairo`

### Moves Scaling (Linear)

| Parameter | Value | Description |
|-----------|-------|-------------|
| `BASE_MOVES` | 20 | Moves at level 1 |
| `MAX_MOVES` | 60 | Moves at level 50 |

**Formula:** `base_moves = 20 + (level - 1) * 40 / 49`

### Points Ratio Scaling

| Parameter | Value | Description |
|-----------|-------|-------------|
| `BASE_RATIO_X100` | 80 | 0.80 points/move at level 1 |
| `MAX_RATIO_X100` | 250 | 2.50 points/move at level 50 |

**Formula:** `points_required = base_moves * ratio / 100`

### Variance by Level Tier

| Level Range | Variance | Description |
|-------------|----------|-------------|
| 1-10 | ±5% | Early game stability |
| 11-50 | ±10% | Mid game variety |
| 51-100 | ±15% | Late game challenge |

### Cube Thresholds

| Parameter | Value | Description |
|-----------|-------|-------------|
| `CUBE_3_PERCENT` | 40 | 3 cubes if moves <= 40% of max |
| `CUBE_2_PERCENT` | 70 | 2 cubes if moves <= 70% of max |

**Thresholds:**
- **3 Cubes:** Complete level using <= 40% of max_moves
- **2 Cubes:** Complete level using <= 70% of max_moves  
- **1 Cube:** Complete level

### Level Cap

| Parameter | Value | Description |
|-----------|-------|-------------|
| `LEVEL_CAP` | 50 | Difficulty stops scaling after this (survival mode after) |
| `CONSTRAINT_NONE_THRESHOLD` | 4 | Constraints start from level 5 |

### Sample Level Configs

| Level | Base Moves | Ratio | Base Points | Difficulty |
|-------|------------|-------|-------------|------------|
| 1 | 20 | 0.80 | 16 | Easy |
| 10 | 24 | 0.97 | 23 | Easy |
| 25 | 30 | 1.21 | 36 | Medium |
| 50 | 40 | 1.65 | 66 | Hard |
| 75 | 50 | 2.08 | 104 | VeryHard |
| 100 | 60 | 2.50 | 150 | Master |

---

## Difficulty Settings

**Location:** `contracts/src/types/difficulty.cairo`, `contracts/src/elements/difficulties/`

### Difficulty Levels

| Difficulty | Level Range | Description |
|------------|-------------|-------------|
| Easy | 1-10 | Simple blocks, many gaps |
| Medium | 11-25 | Mixed complexity |
| MediumHard | 26-45 | Complex blocks, fewer gaps |
| Hard | 46-65 | Complex blocks |
| VeryHard | 66-85 | Very complex blocks |
| Expert | 86-95 | Expert-level complexity |
| Master | 96+ | Maximum difficulty |

### Increasing Mode Thresholds

**Location:** `types/difficulty.cairo` - `get_difficulty_from_moves()`

| Moves | Difficulty |
|-------|------------|
| 0-19 | MediumHard |
| 20-39 | Hard |
| 40-79 | VeryHard |
| 80-139 | Expert |
| 140+ | Master |

### Block Distribution (Easy vs Master)

**Easy** (`elements/difficulties/easy.cairo`):
```
ID:     0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
Block:  -  0  0  0  1  1  1  1  1  2  2  2  2  3  3  4
```
- None: 1/16 (6%)
- Size 1: 3/16 (19%)
- Size 2: 5/16 (31%)
- Size 3: 4/16 (25%)
- Size 4: 2/16 (13%)
- Size 5: 1/16 (6%)

**Master** (`elements/difficulties/master.cairo`):
```
ID:     0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
Block:  -  0  1  1  2  2  2  3  3  3  3  4  4  4  4  4
```
- None: 1/16 (6%)
- Size 1: 1/16 (6%)
- Size 2: 2/16 (13%)
- Size 3: 3/16 (19%)
- Size 4: 4/16 (25%)
- Size 5: 5/16 (31%)

---

## Bonus System

**Location:** `contracts/src/elements/bonuses/`

### Bonus Types

| Bonus | Effect | File |
|-------|--------|------|
| Hammer | Clears target block and connected same-size blocks | `hammer.cairo` |
| Wave | Clears entire horizontal row | `wave.cairo` |
| Totem | Clears all blocks of same size on entire grid | `totem.cairo` |

### Bonus Earning Thresholds

**Hammer** (`elements/bonuses/hammer.cairo`):

| Score Threshold | Hammers Earned |
|-----------------|----------------|
| >= 120 | 3 |
| >= 80 | 2 |
| >= 40 | 1 |
| < 40 | 0 |

**Wave** (`elements/bonuses/wave.cairo`):

| Combo Count Threshold | Waves Earned |
|-----------------------|--------------|
| >= 64 | 3 |
| >= 32 | 2 |
| >= 16 | 1 |
| < 16 | 0 |

**Totem** (`elements/bonuses/totem.cairo`):

| Max Combo Threshold | Totems Earned |
|---------------------|---------------|
| >= 6 | 3 |
| >= 4 | 2 |
| >= 2 | 1 |
| < 2 | 0 |

---

## Cube Economy

**Location:** `contracts/src/systems/game.cairo`, `contracts/src/helpers/packing.cairo`

### Cube Earning (During Run)

| Source | Amount | Condition |
|--------|--------|-----------|
| Level Complete (3 cubes) | 3 | moves <= cube_3_threshold (40% of max) |
| Level Complete (2 cubes) | 2 | moves <= cube_2_threshold (70% of max) |
| Level Complete (1 cube) | 1 | Level completed |
| Clear 4 lines in one move | +1 | Combo bonus |
| Clear 5 lines in one move | +2 | Combo bonus |
| Clear 6+ lines in one move | +3 | Combo bonus |
| First 5-line combo in run | +3 | One-time achievement (combo_5_achieved) |
| First 10-line combo in run | +5 | One-time achievement (combo_10_achieved) |

### Milestone Bonus (NOT YET IMPLEMENTED)

| Level | Bonus | Formula |
|-------|-------|---------|
| 10 | +5 | level / 2 |
| 20 | +10 | level / 2 |
| 30 | +15 | level / 2 |
| ... | ... | ... |
| 100+ | +50 | Capped at 50 |

---

## Permanent Shop

**Location:** `contracts/src/systems/shop.cairo`

### Starting Bonus Upgrades

| Level | Cost (Cubes) | Effect |
|-------|--------------|--------|
| 0 -> 1 | 50 | Start runs with 1 of this bonus |
| 1 -> 2 | 200 | Start runs with 2 of this bonus |
| 2 -> 3 | 500 | Start runs with 3 of this bonus |

**Total to max one type:** 750 cubes  
**Total to max all three:** 2,250 cubes

### Bag Size Upgrades

**Formula:** `cost = 10 * 2^(current_level)` cubes

| Level | Cost | Max Capacity |
|-------|------|--------------|
| 0 (default) | - | 1 |
| 0 -> 1 | 10 | 2 |
| 1 -> 2 | 20 | 3 |
| 2 -> 3 | 40 | 4 |
| 3 -> 4 | 80 | 5 |
| 4 -> 5 | 160 | 6 |
| 5 -> 6 | 320 | 7 |
| ... | 2x | +1 |

**Max Level:** 15 (4 bits)

### Bridging Rank Upgrades

**Formula:** `cost = 100 * 2^(current_rank)` cubes  
**Max Cubes to Bring:** `5 * 2^(rank - 1)` for rank > 0

| Rank | Cost | Max Cubes to Bring |
|------|------|-------------------|
| 0 (default) | - | 0 (can't bring) |
| 0 -> 1 | 100 | 5 |
| 1 -> 2 | 200 | 10 |
| 2 -> 3 | 400 | 20 |
| 3 -> 4 | 800 | 40 |
| 4 -> 5 | 1,600 | 80 |
| 5 -> 6 | 3,200 | 160 |
| ... | 2x | 2x |

**Max Rank:** 15 (4 bits)

---

## In-Game Shop

**Location:** `contracts/src/types/consumable.cairo`

### Consumable Costs

| Consumable | Cost (Cubes) | Effect |
|------------|--------------|--------|
| Hammer | 5 | +1 Hammer to inventory |
| Wave | 5 | +1 Wave to inventory |
| Totem | 5 | +1 Totem to inventory |
| ExtraMoves | 10 | +5 moves (NOT IMPLEMENTED) |

### Shop Availability

- Appears after completing levels 5, 10, 15, 20, ...
- Also accessible via shop button on levels 6, 11, 16, ...
- Spending order: cubes_brought first, then cubes_earned

### Extra Moves (NOT IMPLEMENTED)

| Parameter | Value |
|-----------|-------|
| `EXTRA_MOVES_COST` | 10 cubes |
| `EXTRA_MOVES_AMOUNT` | 5 moves |

---

## Constraint System

**Location:** `contracts/src/types/constraint.cairo`, `contracts/src/helpers/level.cairo`

### Constraint Types

| Type | Description |
|------|-------------|
| None | No constraint - just reach point goal |
| ClearLines | Clear X lines in one move, Y times |
| NoBonusUsed | Complete level without using any bonus |

### Constraint Probability by Level

**Levels 5-20:**
| Roll (0-99) | Probability | Constraint |
|-------------|-------------|------------|
| 0-4 | 5% | NoBonusUsed |
| 5-14 | 10% | None |
| 15-64 | 50% | ClearLines(2, 1-4) |
| 65-94 | 30% | ClearLines(3, 1-2) |
| 95-99 | 5% | ClearLines(4, 1) |

**Levels 21-40:**
| Roll | Probability | Constraint |
|------|-------------|------------|
| 0-2 | 3% | NoBonusUsed |
| 3-4 | 2% | None |
| 5-54 | 50% | ClearLines(2, 2-6) |
| 55-84 | 30% | ClearLines(3, 2-4) |
| 85-94 | 10% | ClearLines(4, 1-2) |
| 95-99 | 5% | ClearLines(5, 1) |

**Levels 41-60:**
| Roll | Probability | Constraint |
|------|-------------|------------|
| 0-2 | 3% | NoBonusUsed |
| 3-4 | 2% | None |
| 5-44 | 40% | ClearLines(2, 3-8) |
| 45-74 | 30% | ClearLines(3, 3-6) |
| 75-94 | 20% | ClearLines(4, 2-4) |
| 95-99 | 5% | ClearLines(5, 1-2) |

**Levels 61-80:**
| Roll | Probability | Constraint |
|------|-------------|------------|
| 0-2 | 3% | NoBonusUsed |
| 3-4 | 2% | None |
| 5-34 | 30% | ClearLines(2, 4-10) |
| 35-69 | 35% | ClearLines(3, 4-8) |
| 70-89 | 20% | ClearLines(4, 3-6) |
| 90-94 | 5% | ClearLines(5, 2-4) |
| 95-99 | 5% | ClearLines(6, 1) |

**Levels 81+:**
| Roll | Probability | Constraint |
|------|-------------|------------|
| 0-2 | 3% | NoBonusUsed |
| 3-4 | 2% | None |
| 5-34 | 30% | ClearLines(2, 5-12) |
| 35-64 | 30% | ClearLines(3, 5-10) |
| 65-84 | 20% | ClearLines(4, 4-8) |
| 85-89 | 5% | ClearLines(5, 3-6) |
| 90-94 | 5% | ClearLines(6, 1-2) |
| 95-99 | 5% | ClearLines(7, 1) |

---

## Data Limits

**Location:** `contracts/src/helpers/packing.cairo`, `contracts/src/systems/shop.cairo`

### Run Data Limits (Bit-Packed)

| Field | Bits | Max Value | Description |
|-------|------|-----------|-------------|
| current_level | 7 | 127 | Current level |
| level_score | 8 | 255 | Score this level |
| level_moves | 7 | 127 | Moves this level |
| constraint_progress | 4 | 15 | Times constraint achieved |
| bonus_used_this_level | 1 | 1 | Flag |
| total_cubes | 9 | 511 | Cubes earned this run |
| hammer_count | 4 | 15 | Inventory |
| wave_count | 4 | 15 | Inventory |
| totem_count | 4 | 15 | Inventory |
| max_combo_run | 4 | 15 | Best combo this run |
| total_score | 16 | 65,535 | Cumulative score |
| combo_5_achieved | 1 | 1 | Flag |
| combo_10_achieved | 1 | 1 | Flag |
| cubes_brought | 9 | 511 | Cubes brought into run |
| cubes_spent | 9 | 511 | Cubes spent during run |

**Total Used:** 88 bits / 252 available

### PlayerMeta Limits

| Field | Bits | Max Value | Description |
|-------|------|-----------|-------------|
| starting_hammer | 2 | 3 | Starting bonus level |
| starting_wave | 2 | 3 | Starting bonus level |
| starting_totem | 2 | 3 | Starting bonus level |
| bag_hammer_level | 4 | 15 | Bag upgrade level |
| bag_wave_level | 4 | 15 | Bag upgrade level |
| bag_totem_level | 4 | 15 | Bag upgrade level |
| bridging_rank | 4 | 15 | Bridging rank |
| total_runs | 16 | 65,535 | Lifetime runs |
| total_cubes_earned | 32 | 4,294,967,295 | Lifetime cubes |

**Total Used:** 82 bits / 252 available

### Contract Limits

| Parameter | Value | Location |
|-----------|-------|----------|
| MAX_STARTING_BONUS | 3 | shop.cairo |
| MAX_BAG_LEVEL | 15 | shop.cairo |
| MAX_BRIDGING_RANK | 15 | shop.cairo |

---

## Future: Configurable Settings

To make these parameters fully configurable (like death-mountain), we would need to:

1. **Create extended GameSettings model:**
```cairo
pub struct GameSettings {
    pub settings_id: u32,
    pub difficulty: Difficulty,
    // Grid
    pub grid_width: u8,
    pub grid_height: u8,
    // Level generation
    pub base_moves: u16,
    pub max_moves: u16,
    pub base_ratio_x100: u16,
    pub max_ratio_x100: u16,
    // Bonus thresholds
    pub hammer_thresholds: (u16, u16, u16), // 1, 2, 3 earned
    pub wave_thresholds: (u16, u16, u16),
    pub totem_thresholds: (u8, u8, u8),
    // Cube economy
    pub cube_3_percent: u16,
    pub cube_2_percent: u16,
    pub consumable_costs: (u16, u16, u16, u16),
    // ... more settings
}
```

2. **Pass settings_id to create():**
```cairo
fn create(ref self: T, game_id: u64, settings_id: u32);
```

3. **Read settings in level generator:**
```cairo
fn generate(seed: felt252, level: u8, settings: GameSettings) -> LevelConfig
```

This would enable:
- Tournament modes with custom difficulty curves
- Challenge modes (e.g., "no bonus run" with 2x cubes)
- A/B testing different balance configurations
- Community-created game modes
