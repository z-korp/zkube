# zKube Game Design Document

> **Version:** 1.2.0  
> **Last Updated:** January 2026  
> **Status:** Fully Implemented  
> **Namespace:** `zkube_budo_v1_2_0`

## Table of Contents

1. [Overview](#overview)
2. [Grid & Block System](#grid--block-system)
3. [Level System](#level-system)
4. [Difficulty System](#difficulty-system)
5. [Bonus System](#bonus-system)
6. [Constraint System](#constraint-system)
7. [Cube Economy](#cube-economy)
8. [Two-Shop System](#two-shop-system)
9. [Data Architecture](#data-architecture)
10. [Quest System](#quest-system)
11. [Achievement System](#achievement-system)

---

## Overview

zKube is a **Puzzle Roguelike** where players manipulate blocks on an 8x10 grid to form solid horizontal lines. The game features:

- **50 Levels** of progressive difficulty (survival mode after level 50)
- **CUBE Currency** - ERC-20 tokens earned through gameplay
- **Permanent Shop** - Upgrades that persist across runs
- **In-Game Shop** - Consumables purchasable every 10 levels
- **Constraint System** - Per-level challenges for bonus rewards
- **Meta-Progression** - PlayerMeta tracks upgrades and stats

---

## Grid & Block System

**Location:** `contracts/src/constants.cairo`

### Grid Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `DEFAULT_GRID_WIDTH` | 8 | Columns in game grid |
| `DEFAULT_GRID_HEIGHT` | 10 | Rows in game grid |
| `BLOCK_BIT_COUNT` | 3 | Bits per block |
| `ROW_BIT_COUNT` | 24 | Bits per row (8 blocks x 3 bits) |

### Block Types

| Value | Type | Width |
|-------|------|-------|
| 0 | Empty | 0 |
| 1 | Size 1 | 1 block |
| 2 | Size 2 | 2 blocks |
| 3 | Size 3 | 3 blocks |
| 4 | Size 4 | 4 blocks |

### Grid Storage

The grid is packed into a single `felt252` (240 bits):
- 10 rows x 8 columns x 3 bits = 240 bits
- Row 0 at bottom, Row 9 at top

---

## Level System

**Location:** `contracts/src/helpers/level.cairo`

### Design Summary

| Aspect | Implementation |
|--------|----------------|
| Total Levels | 50 (survival mode after) |
| Level Cap | Difficulty/scaling caps at level 50 |
| Seed Storage | Separate `GameSeed` model |
| Level Generation | Deterministic from seed |
| Game Over | All progress lost (true roguelike) |

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
| `MAX_RATIO_X100` | 180 | 1.80 points/move at level 50 |

**Formula:** `points_required = base_moves * ratio / 100`

### Variance

All levels use **±5% variance** for consistent gameplay experience.

The variance is applied to both moves and points calculations, ensuring levels feel slightly different on each playthrough while maintaining balanced difficulty progression.

### Sample Level Configs

| Level | Moves | Ratio | Points | Difficulty |
|-------|-------|-------|--------|------------|
| 1 | ~20 | 0.80 | ~16 | VeryEasy |
| 10 | ~28 | 1.00 | ~28 | Medium |
| 25 | ~40 | 1.30 | ~52 | VeryHard |
| 50 | ~60 | 1.80 | ~108 | Master |

---

## Difficulty System

**Location:** `contracts/src/types/difficulty.cairo`, `contracts/src/elements/difficulties/`

### Difficulty Tiers (50-Level Progression)

| Level Range | Difficulty |
|-------------|------------|
| 1-3 | VeryEasy |
| 4-7 | Easy |
| 8-11 | Medium |
| 12-17 | MediumHard |
| 18-24 | Hard |
| 25-34 | VeryHard |
| 35-44 | Expert |
| 45+ | Master |

### Block Distribution Examples

**VeryEasy/Easy:**
- Many gaps (empty blocks)
- Mostly small blocks (size 1-2)
- Easier to clear lines

**Master:**
- Few gaps
- Mostly large blocks (size 3-4)
- Requires strategic planning

---

## Bonus System

**Location:** `contracts/src/elements/bonuses/`

### Bonus Types (5 types, 3 levels each)

Players select **3 bonuses** before each run from the 5 available types:

| Bonus | Effect | L1 | L2 | L3 | Unlock |
|-------|--------|----|----|----| -------|
| **Combo** | Adds combo to next move | +1 combo | +2 combo | +3 combo | Default |
| **Score** | Instantly adds score | +10 score | +20 score | +30 score | Default |
| **Harvest** | Destroys all blocks of chosen size, earns CUBEs | +1 CUBE/block | +2 CUBE/block | +3 CUBE/block | Default |
| **Wave** | Clears entire horizontal rows | 1 row | 2 rows | 3 rows | Locked |
| **Supply** | Adds new lines at no move cost | 1 line | 2 lines | 3 lines | Locked |

### Acquiring Bonus Charges

- **Permanent shop:** Buy starting charges, upgrade bag size (max 5)
- **In-game shop (every 10 levels):** Buy charges during run with CUBEs
- **Boss clear (L10/20/30/40):** Awards Level Up Item to upgrade one bonus

### Bonus Selection (Run Start)

When creating a game, players select exactly 3 of the 5 bonus types:
- Wave and Supply require unlocking in permanent shop
- Default selection: Combo, Score, Harvest
- Selection stored in `run_data` bits 164-172

---

## Constraint System

**Location:** `contracts/src/types/constraint.cairo`, `contracts/src/helpers/boss.cairo`

### Constraint Types (7 total)

| # | Type | Value Meaning | Count Meaning | Regular | Boss |
|---|------|---------------|---------------|:---:|:---:|
| 0 | **None** | - | - | ✅ | ❌ |
| 1 | **ComboLines** | Lines to clear in one move | How many times | ✅ | ✅ |
| 2 | **BreakBlocks** | Block size to target (1-4) | Total blocks to destroy | ✅ | ✅ |
| 3 | **ComboStreak** | Combo target to reach | 1 (one-shot) | ✅ | ✅ |
| 4 | **FillAndClear** | Row height target (after resolve) | How many times | ✅ | ✅ |
| 5 | **NoBonusUsed** | 0 | 0 | ❌ | ✅ |
| 6 | **KeepGridBelow** | Keep grid below cap (6/7/8) | 1 (breach flag) | ❌ | ✅ |

### When Constraints Apply

- **Levels 1-2:** No constraints (warm-up)
- **Level 3+:** Constraints generated from seed + difficulty via unified budget system
- **Constraint count:** Deterministic per tier — `constraint_min` to `constraint_max` rolled randomly (0-3 constraints depending on difficulty)
- **NoBonusUsed:** Boss-only — never generated on regular levels
- **Boss levels (10/20/30/40/50):** Fixed constraint combos from boss identity system at budget_max, up to triple constraints at L40/50

### Unified Budget System

All constraint types (regular + boss) use the same budget-based generation engine:

1. **Budget** interpolates from VeryEasy (1-3) to Master (32-40)
2. **Type selection** uses difficulty-weighted probabilities (regular levels)
3. **Cost functions** per type convert budget → constraint values
4. **Skew-high rolls** favor harder values within budget range

**Type Selection Weights (regular levels):**

| Tier | ComboLines | BreakBlocks | FillAndClear | ComboStreak |
|------|:---:|:---:|:---:|:---:|
| 0 (VeryEasy) | 80% | 15% | 0% | 5% |
| 1 (Easy) | 55% | 15% | 15% | 15% |
| 2 (Medium) | 50% | 18% | 15% | 17% |
| 3 (MediumHard) | 45% | 20% | 17% | 18% |
| 4 (Hard) | 40% | 22% | 18% | 20% |
| 5 (VeryHard) | 35% | 23% | 20% | 22% |
| 6 (Expert) | 30% | 24% | 24% | 22% |
| 7 (Master) | 25% | 25% | 28% | 22% |
**Cost Functions:**
| Type | Cost → Values | Examples (budget=25) |
|------|--------------|---------------------|
| ComboLines | line_cost: 2→2, 3→4, 4→6, 5→10, 6→15, 7→20. min_lines: tier 0-1→2, 2-3→3, 4-6→4, 7→5 | 5 lines x2, or 4 lines x4 |
| BreakBlocks | break_cost(size): 1→3, 2→4, 3→5, 4→6. blocks=(budget×8)/cost | size-2: 50 blocks, size-4: 33 blocks |
| ComboStreak | combo_cost(c)=c×(c-1)/2: 3→3, 4→6, 5→10, 6→15, 7→21, 8→28. Max combo = 8 | combo 5 (cost 10) or combo 7 (cost 21) |
| FillAndClear | row_cost: 4→2, 5→5, 6→10, 7→17, 8→26. times_cap: 4→4, 5→3, 6→2, 7→2, 8→1 | row 6 x2, or row 7 x1 |

**Constraint count:** Deterministic per tier (0 at VeryEasy → 3 at Master). Each constraint rolls a different type from the weight table above.

### Boss Identity System

10 themed bosses with fixed constraint type combinations. Boss identity determines WHICH types, the unified budget system at `budget_max` determines the VALUES.

Selected by `derive_boss_id(level_seed) % 10 + 1`:

| # | Boss | Core Pair (L10-30) | Third Constraint (L40/50) |
|---|------|--------------------|---------------------------|
| 1 | Combo Master | ComboLines + ComboStreak | NoBonusUsed |
| 2 | Demolisher | BreakBlocks + ComboLines | KeepGridBelow |
| 3 | Daredevil | FillAndClear + ComboStreak | ComboLines |
| 4 | Purist | NoBonusUsed + ComboLines | ComboStreak |
| 5 | Harvester | BreakBlocks + ComboStreak | FillAndClear |
| 6 | Tidal | KeepGridBelow + ComboLines | BreakBlocks |
| 7 | Stacker | FillAndClear + ComboLines | BreakBlocks |
| 8 | Surgeon | BreakBlocks + FillAndClear | NoBonusUsed |
| 9 | Ascetic | NoBonusUsed + ComboStreak | FillAndClear |
| 10 | Perfectionist | ComboLines + FillAndClear | ComboStreak |

**Constraint progression:**
- L10/20/30: Dual constraints (core pair), generated at budget_max
- L40/50: Triple constraints (core pair + third), generated at budget_max
- NoBonusUsed and KeepGridBelow are binary (no budget needed)

---

## Cube Economy

**Token:** ERC-20 (`cube_token` system, name="zCubes", symbol="ZCUBE", 0 decimals)

### Earning Cubes (During Run)

| Source | Amount | Condition |
|--------|--------|-----------|
| Level complete (3-star) | 3 | Moves <= 40% of max |
| Level complete (2-star) | 2 | Moves <= 70% of max |
| Level complete (1-star) | 1 | Level completed |
| Clear 4 lines | +1 | Combo bonus |
| Clear 5 lines | +3 | Combo bonus |
| Clear 6 lines | +5 | Combo bonus |
| Clear 7 lines | +10 | Combo bonus |
| Clear 8 lines | +25 | Combo bonus |
| Clear 9+ lines | +50 | Combo bonus |
| First 5-line combo | +3 | One-time per run |
| First 10-line combo | +5 | One-time per run |
| Boss level (L10/20/30/40/50) | +10/20/30/40/50 | Boss level bonus |

### Boss Levels

Special levels every 10 levels with themed boss identities and bonus rewards:

| Level | Cube Bonus | Constraints | Boss Identity |
|-------|------------|-------------|---------------|
| 10 | +10 CUBE | Dual (core pair) | Seeded from run |
| 20 | +20 CUBE | Dual (core pair) | Seeded from run |
| 30 | +30 CUBE | Dual (core pair) | Seeded from run |
| 40 | +40 CUBE | Triple (core pair + third) | Seeded from run |
| 50 | +50 CUBE | Triple (core pair + third) | Seeded from run |

Boss identity is determined by `derive_boss_id(level_seed) % 10 + 1`, giving one of 10 themed bosses (see Constraint System for details). Completing level 50 triggers the victory state and mints all earned cubes.

### Cube Thresholds

Calculated from `max_moves` for each level:
- `cube_3_threshold = max_moves * 40%`
- `cube_2_threshold = max_moves * 70%`

### Cube Flow

```
WALLET (ERC-20)
       |
       +---> PERMANENT SHOP (burn cubes for upgrades)
       |
       +---> START RUN
                |
                +---> Fresh Start (0 cubes)
                |
                +---> Bring Cubes (requires bridging rank)
                            |
                            v
                      DURING RUN
                      - Brought cubes (LOST on death)
                      - Earned cubes (KEPT on death)
                      - In-game shop every 10 levels
                            |
                            v
                      GAME END --> Earned cubes minted to wallet
```

---

## Two-Shop System

### 1. Permanent Shop (Outside Game)

**Location:** `contracts/src/systems/shop.cairo`

#### Unlock Bonuses

| Bonus | Cost | Effect |
|-------|------|--------|
| Wave | 200 CUBE | Unlock Wave bonus for selection |
| Supply | 200 CUBE | Unlock Supply bonus for selection |

#### Starting Bonus Upgrades

| Level | Cost | Effect |
|-------|------|--------|
| 0 -> 1 | 100 CUBE | Start with 1 bonus |
| 1 -> 2 | 250 CUBE | Start with 2 bonuses |
| 2 -> 3 | 500 CUBE | Start with 3 bonuses |

*Applies to each of the 5 bonus types*

#### Bag Size Upgrades
| Level | Cost | Max Capacity |
|-------|------|--------------|
| 0 -> 1 | 100 CUBE | 2 |
| 1 -> 2 | 250 CUBE | 3 |
| 2 -> 3 | 500 CUBE | 4 |

#### Bridging Rank Upgrades
| Rank | Cost | Max Cubes to Bring |
|------|------|-------------------|
| 0 -> 1 | 200 CUBE | 5 |
| 1 -> 2 | 500 CUBE | 10 |
| 2 -> 3 | 1000 CUBE | 20 |

### 2. In-Game Shop (Every 10 Levels)

**Location:** `contracts/src/systems/shop.cairo` (`purchase_consumable`)

Shop appears after levels 9, 19, 29, 39, 49 (when `(current_level - 1) % 10 == 9`).
| Item | Cost | Effect |
|------|------|--------|
| BonusCharge | ceil(5 × 1.5^n) CUBE | +1 unallocated bonus charge (n = purchases this visit) |
| LevelUp | 50 CUBE | Upgrade one selected bonus (L1→L2→L3), limit 1 per shop |
| SwapBonus | 50 CUBE | Replace one selected bonus with an unselected one, limit 1 per shop |

**BonusCharge Cost Sequence:** 5, 8, 12, 18, 27, 41, ...
- BonusCharge cost scales with purchases per visit (resets at each new shop)
- LevelUp can only be bought once per shop visit
- SwapBonus uses a standalone `swap_bonus()` entrypoint
- State tracked in `run_data` bits 184-194
**Spending Order:** Brought cubes first, then earned cubes.

---

## Data Architecture

### Game Model

```cairo
pub struct Game {
    #[key]
    pub game_id: u64,
    pub blocks: felt252,      // 240 bits - the grid
    pub next_row: u32,        // 24 bits - queued row
    pub combo_counter: u8,    // Current combo streak
    pub max_combo: u8,        // Best combo this level
    pub run_data: felt252,    // Bit-packed level/run progress
    pub level_stars: felt252,  // 2 bits per level × 50 levels = 100 bits
    pub started_at: u64,      // Run start timestamp
    pub over: bool,
}
```

### run_data Bit Layout (195 bits used)
| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-7 | current_level | 8 | Current level (1-255) |
| 8-15 | level_score | 8 | Score this level |
| 16-23 | level_moves | 8 | Moves used this level |
| 24-31 | constraint_progress | 8 | Primary constraint progress |
| 32-39 | constraint_2_progress | 8 | Secondary constraint progress |
| 40 | bonus_used_this_level | 1 | For NoBonusUsed constraint |
| 41-48 | combo_count | 8 | Combo inventory |
| 49-56 | score_count | 8 | Score inventory |
| 57-64 | harvest_count | 8 | Harvest inventory |
| 65-72 | wave_count | 8 | Wave inventory |
| 73-80 | supply_count | 8 | Supply inventory |
| 81-88 | max_combo_run | 8 | Best combo this run |
| 89-104 | cubes_brought | 16 | Cubes brought into run |
| 105-120 | cubes_spent | 16 | Cubes spent this run |
| 121-136 | total_cubes | 16 | Cubes earned this run |
| 137-152 | total_score | 16 | Cumulative score |
| 153 | run_completed | 1 | Victory flag (level 50) |
| 154-156 | selected_bonus_1 | 3 | First bonus type (0-5) |
| 157-159 | selected_bonus_2 | 3 | Second bonus type (0-5) |
| 160-162 | selected_bonus_3 | 3 | Third bonus type (0-5) |
| 163-164 | bonus_1_level | 2 | L1/L2/L3 (0-2) |
| 165-166 | bonus_2_level | 2 | L1/L2/L3 (0-2) |
| 167-168 | bonus_3_level | 2 | L1/L2/L3 (0-2) |
| 169-171 | free_moves | 3 | Free moves remaining |
| 172-174 | last_shop_level | 3 | level / 10 (0-5) |
| 175 | no_bonus_constraint | 1 | NoBonusUsed active |
| 176-183 | constraint_3_progress | 8 | Tertiary constraint progress |
| 184-187 | shop_purchases | 4 | Shop buys count |
| 188-191 | unallocated_charges | 4 | Unassigned buys |
| 192 | shop_level_up_bought | 1 | Level-up bought |
| 193 | shop_swap_bought | 1 | Swap bought |
| 194 | boss_level_up_pending | 1 | Boss level-up |

### PlayerMeta Model

```cairo
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed upgrades/stats
    pub best_level: u8,     // Highest level reached
}
```

### PlayerMeta.data Bit Layout (86 bits used)

| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-1 | starting_combo | 2 | Starting combo charges (0-3) |
| 2-3 | starting_score | 2 | Starting score charges (0-3) |
| 4-5 | starting_harvest | 2 | Starting harvest charges (0-3) |
| 6-7 | starting_wave | 2 | Starting wave charges (0-3) |
| 8-9 | starting_supply | 2 | Starting supply charges (0-3) |
| 10-13 | bag_combo_level | 4 | Combo bag capacity |
| 14-17 | bag_score_level | 4 | Score bag capacity |
| 18-21 | bag_harvest_level | 4 | Harvest bag capacity |
| 22-25 | bag_wave_level | 4 | Wave bag capacity |
| 26-29 | bag_supply_level | 4 | Supply bag capacity |
| 30-33 | bridging_rank | 4 | Cube bridging rank (0-15) |
| 34 | wave_unlocked | 1 | Wave bonus unlocked |
| 35 | supply_unlocked | 1 | Supply bonus unlocked |
| 36-51 | total_runs | 16 | Lifetime run count |
| 52-83 | total_cubes_earned | 32 | Lifetime cubes earned |

### GameLevel Model

```cairo
pub struct GameLevel {
    #[key]
    pub game_id: u64,
    pub level: u8,
    pub points_required: u16,
    pub max_moves: u16,
    pub difficulty: u8,
    // Primary constraint
    pub constraint_type: u8,
    pub constraint_value: u8,
    pub constraint_count: u8,
    // Secondary constraint
    pub constraint2_type: u8,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    // Tertiary constraint (boss levels 40/50)
    pub constraint3_type: u8,
    pub constraint3_value: u8,
    pub constraint3_count: u8,
    // Cube thresholds
    pub cube_3_threshold: u16,
    pub cube_2_threshold: u16,
}
```

Synced to client via Torii. This is the single source of truth for level config, eliminating the need for client-side level generation.

---

## File Structure

### Contract Files

```
contracts/src/
├── constants.cairo           # Grid constants, namespace
├── models/
│   ├── game.cairo            # Game state model
│   ├── player.cairo          # PlayerMeta model
│   └── config.cairo          # GameSettings (configurable)
├── systems/
│   ├── game.cairo            # Main game logic
│   ├── shop.cairo            # Permanent shop
│   └── cube_token.cairo      # ERC-20 CUBE token
├── types/
│   ├── difficulty.cairo      # Difficulty enum
│   ├── constraint.cairo      # Constraint types
│   ├── level.cairo           # LevelConfig struct
│   ├── bonus.cairo           # Bonus enum
│   └── consumable.cairo      # ConsumableType enum
├── helpers/
│   ├── level.cairo           # Level generation
│   ├── boss.cairo            # Boss identity system (10 bosses)
│   ├── packing.cairo         # Bit-pack/unpack utilities
│   ├── controller.cairo      # Grid manipulation
│   └── gravity.cairo         # Block falling logic
└── elements/
    ├── bonuses/              # Bonus implementations
    └── difficulties/         # Difficulty configurations
```

### Client Files (client-budokan)

```
client-budokan/src/
├── dojo/
│   ├── game/
│   │   ├── models/game.ts         # Game model
│   │   ├── types/bonus.ts         # Bonus enum + display names
│   │   ├── types/level.ts         # LevelConfig, settings
│   │   └── helpers/
│   │       └── runDataPacking.ts  # Bit-pack/unpack
│   └── systems.ts                 # Contract calls
├── hooks/
│   ├── useGame.tsx                # Game state hook
│   ├── usePlayerMeta.tsx          # Meta progression hook
│   └── useCubeBalance.tsx         # ERC-20 balance
└── ui/
    ├── screens/
    │   └── Play.tsx               # Game play screen
    └── components/
        └── Shop/LoadoutDialog.tsx # Bonus selection
```

---

## Quest System

**Location:** `contracts/src/systems/quest.cairo`, `contracts/src/elements/quests/`

### Daily Quests (13 total, 92 CUBE/day)
| Category | Quest | Requirement | Reward |
|----------|-------|-------------|--------|
| Player | DailyPlayerOne | Play 1 game | 3 CUBE |
| Player | DailyPlayerTwo | Play 3 games | 5 CUBE |
| Player | DailyPlayerThree | Play 5 games | 10 CUBE |
| Clearer | DailyClearerOne | Clear 10 lines | 3 CUBE |
| Clearer | DailyClearerTwo | Clear 30 lines | 5 CUBE |
| Clearer | DailyClearerThree | Clear 50 lines | 10 CUBE |
| Combo | DailyComboOne | 3+ line combo | 3 CUBE |
| Combo | DailyComboTwo | 5+ line combo | 5 CUBE |
| Combo | DailyComboThree | 7+ line combo | 10 CUBE |
| ComboStreak | DailyComboStreakOne | 5+ combo streak | 3 CUBE |
| ComboStreak | DailyComboStreakTwo | 7+ combo streak | 5 CUBE |
| ComboStreak | DailyComboStreakThree | 9+ combo streak | 10 CUBE |
| Finisher | DailyFinisher | Complete all 12 | 20 CUBE |

### Quest Chains

Progress is cumulative within each category. Quests within a family are tiered — completing tier 1 unlocks tier 2, etc. The Finisher quest requires all 12 other quests.

### Integration Points

| Game Function | Quest Progress |
|---------------|---------------|
| `create_with_cubes()` | +1 Grinder (games played) |
| `move()` | +N LineClearer (lines cleared) |
| `move()` | +1 ComboThree/Five/Seven (if combo achieved) |

### Dependencies

Uses Cartridge's `quest` and `achievement` packages from the arcade repository. Quest system needs `MINTER_ROLE` on `cube_token` to distribute CUBE rewards.

### Known Limitation

The Cartridge Controller's built-in profile quest UI claim button does not work (ENTRYPOINT_NOT_FOUND). Use the in-game QuestsDialog instead, which calls `quest_system.claim()` correctly.

---

## Achievement System

28 trophies tracked via Cartridge's arcade achievement system:

| Category | Milestones |
|----------|------------|
| Grinder | 10/25/50/100/250 games played |
| Clearer | 100/500/1K/5K/10K lines cleared |
| Combo (3+) | 10/50/100 combos |
| Chain (5+) | 5/25/50 combos |
| SuperChain (7+) | 1/10/25 combos |
| Leveler | Level 10/20/30/40/50 reached |
| Scorer | 100/200/300 high score |
| Master | Complete all daily quests |

---

## Related Documentation

- [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) - GameSettings customization
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Network deployment
