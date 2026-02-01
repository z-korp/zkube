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

---

## Overview

zKube is a **Puzzle Roguelike** where players manipulate blocks on an 8x10 grid to form solid horizontal lines. The game features:

- **50 Levels** of progressive difficulty (survival mode after level 50)
- **CUBE Currency** - ERC-1155 soulbound tokens earned through gameplay
- **Permanent Shop** - Upgrades that persist across runs
- **In-Game Shop** - Consumables purchasable every 5 levels
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
| `MAX_RATIO_X100` | 250 | 2.50 points/move at level 50 |

**Formula:** `points_required = base_moves * ratio / 100`

### Variance by Level Tier

| Level Range | Variance | Description |
|-------------|----------|-------------|
| 1-5 | ±5% | Early game stability |
| 6-25 | ±10% | Mid game variety |
| 26-50 | ±15% | Late game challenge |

### Sample Level Configs

| Level | Moves | Ratio | Points | Difficulty |
|-------|-------|-------|--------|------------|
| 1 | ~20 | 0.80 | ~16 | VeryEasy |
| 10 | ~28 | 1.15 | ~32 | Medium |
| 25 | ~40 | 1.65 | ~66 | VeryHard |
| 50 | ~60 | 2.50 | ~150 | Master |

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

> **Note:** A major overhaul is planned for v2.0. See [BONUS_SYSTEM_V2.md](./BONUS_SYSTEM_V2.md) for the design document featuring 5 bonus types, 3 levels each, and bonus selection mechanics.

### Bonus Types (Current v1.2)

| Bonus | Effect | Earning Threshold |
|-------|--------|-------------------|
| **Hammer** | Clears target block + connected same-size | Score-based |
| **Wave** | Clears entire horizontal row | Combo count-based |
| **Totem** | Clears all blocks of same size on grid | Max combo-based |

### Earning Thresholds

**Hammer** (based on level score):
| Score | Hammers |
|-------|---------|
| >= 120 | 3 |
| >= 80 | 2 |
| >= 40 | 1 |

**Wave** (based on combo count):
| Combos | Waves |
|--------|-------|
| >= 64 | 3 |
| >= 32 | 2 |
| >= 16 | 1 |

**Totem** (based on max combo):
| Max Combo | Totems |
|-----------|--------|
| >= 6 | 3 |
| >= 4 | 2 |
| >= 2 | 1 |

---

## Constraint System

**Location:** `contracts/src/types/constraint.cairo`

### Constraint Types

| Type | Description |
|------|-------------|
| **None** | No constraint - just reach point goal |
| **ClearLines** | Clear X lines in one move, Y times |
| **NoBonusUsed** | Complete level without using any bonus |

### When Constraints Apply

- **Levels 1-2:** No constraints (warm-up)
- **Level 3+:** Constraint generated from seed + difficulty
- **Dual constraints:** Higher difficulties can have two constraints

### Constraint Parameters (Difficulty-Based)

Constraints scale with difficulty using a budget system:
- `min_lines` / `max_lines`: Range of lines to clear
- `budget`: Determines how many times
- `dual_chance`: Probability of secondary constraint (0% at VeryEasy, 100% at Master)

---

## Cube Economy

**Token:** ERC-1155 Soulbound (`cube_token` system, CUBE_TOKEN_ID=1)

### Earning Cubes (During Run)

| Source | Amount | Condition |
|--------|--------|-----------|
| Level complete (3-star) | 3 | Moves <= 40% of max |
| Level complete (2-star) | 2 | Moves <= 70% of max |
| Level complete (1-star) | 1 | Level completed |
| Clear 4 lines | +1 | Combo bonus |
| Clear 5 lines | +2 | Combo bonus |
| Clear 6+ lines | +3 | Combo bonus |
| First 5-line combo | +3 | One-time per run |
| First 10-line combo | +5 | One-time per run |
| Milestone (L10, L20...) | level/2 | Every 10 levels (capped at 50) |

### Cube Thresholds

Calculated from `max_moves` for each level:
- `cube_3_threshold = max_moves * 40%`
- `cube_2_threshold = max_moves * 70%`

### Cube Flow

```
WALLET (ERC-1155)
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
                      - In-game shop every 5 levels
                            |
                            v
                      GAME END --> Earned cubes minted to wallet
```

---

## Two-Shop System

### 1. Permanent Shop (Outside Game)

**Location:** `contracts/src/systems/shop.cairo`

#### Starting Bonus Upgrades

| Level | Cost | Effect |
|-------|------|--------|
| 0 -> 1 | 50 | Start with 1 bonus |
| 1 -> 2 | 200 | Start with 2 bonuses |
| 2 -> 3 | 500 | Start with 3 bonuses |

*Applies to each bonus type (Hammer, Wave, Totem)*

#### Bag Size Upgrades

**Formula:** `cost = 10 * 2^level`

| Level | Cost | Max Capacity |
|-------|------|--------------|
| 0 | - | 1 |
| 1 | 10 | 2 |
| 2 | 20 | 3 |
| 3 | 40 | 4 |

#### Bridging Rank Upgrades

**Formula:** `cost = 100 * 2^rank`, `max_cubes = 5 * 2^(rank-1)`

| Rank | Cost | Max Cubes to Bring |
|------|------|-------------------|
| 0 | - | 0 (can't bring) |
| 1 | 100 | 5 |
| 2 | 200 | 10 |
| 3 | 400 | 20 |
| 4 | 800 | 40 |

### 2. In-Game Shop (Every 5 Levels)

**Location:** `contracts/src/systems/game.cairo` (`purchase_consumable`)

| Item | Cost | Effect | Status |
|------|------|--------|--------|
| Hammer | 5 | +1 Hammer | Implemented |
| Wave | 5 | +1 Wave | Implemented |
| Totem | 5 | +1 Totem | Implemented |
| Extra Moves | 10 | +5 moves | Not Implemented |

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
    pub started_at: u64,      // Run start timestamp
    pub over: bool,
}
```

### run_data Bit Layout (88 bits used)

| Bits | Field | Size | Range |
|------|-------|------|-------|
| 0-6 | current_level | 7 | 1-127 |
| 7-14 | level_score | 8 | 0-255 |
| 15-21 | level_moves | 7 | 0-127 |
| 22-25 | constraint_progress | 4 | 0-15 |
| 26 | bonus_used_this_level | 1 | 0-1 |
| 27-35 | total_cubes | 9 | 0-511 |
| 36-39 | hammer_count | 4 | 0-15 |
| 40-43 | wave_count | 4 | 0-15 |
| 44-47 | totem_count | 4 | 0-15 |
| 48-51 | max_combo_run | 4 | 0-15 |
| 52-67 | total_score | 16 | 0-65535 |
| 68 | combo_5_achieved | 1 | 0-1 |
| 69 | combo_10_achieved | 1 | 0-1 |
| 70-78 | cubes_brought | 9 | 0-511 |
| 79-87 | cubes_spent | 9 | 0-511 |

### PlayerMeta Model

```cairo
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed upgrades/stats
    pub best_level: u8,     // Highest level reached
}
```

### PlayerMeta.data Bit Layout

| Bits | Field | Size |
|------|-------|------|
| 0-1 | starting_hammer | 2 |
| 2-3 | starting_wave | 2 |
| 4-5 | starting_totem | 2 |
| 6-9 | bag_hammer_level | 4 |
| 10-13 | bag_wave_level | 4 |
| 14-17 | bag_totem_level | 4 |
| 18-21 | bridging_rank | 4 |
| 22-37 | total_runs | 16 |
| 38-53 | total_cubes_earned | 16 |

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
│   └── cube_token.cairo      # ERC-1155 CUBE token
├── types/
│   ├── difficulty.cairo      # Difficulty enum
│   ├── constraint.cairo      # Constraint types
│   ├── level.cairo           # LevelConfig struct
│   ├── bonus.cairo           # Bonus enum
│   └── consumable.cairo      # ConsumableType enum
├── helpers/
│   ├── level.cairo           # Level generation
│   ├── packing.cairo         # Bit-pack/unpack utilities
│   ├── controller.cairo      # Grid manipulation
│   └── gravity.cairo         # Block falling logic
└── elements/
    ├── bonuses/              # Bonus implementations
    └── difficulties/         # Difficulty configurations
```

### Client Files

```
client-budokan/src/
├── dojo/
│   ├── game/
│   │   ├── models/game.ts    # Game model
│   │   ├── types/level.ts    # LevelConfig, settings
│   │   └── helpers/
│   │       └── runDataPacking.ts
│   └── systems.ts            # Contract calls
├── hooks/
│   ├── useGame.tsx           # Game state hook
│   ├── usePlayerMeta.tsx     # Meta progression hook
│   └── useCubeBalance.tsx    # ERC-1155 balance
└── ui/
    ├── screens/Play.tsx      # Main game screen
    └── components/
        ├── LevelHeader.tsx   # Level progress display
        ├── LevelCompleteDialog.tsx
        └── Shop/
            ├── ShopDialog.tsx        # Permanent shop
            ├── InGameShopDialog.tsx  # In-game shop
            └── BringCubesDialog.tsx  # Cube bridging
```

---

## Related Documentation

- [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) - GameSettings customization
- [QUEST_SYSTEM.md](./QUEST_SYSTEM.md) - Daily quest system
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Network deployment
- [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) - Planned features
