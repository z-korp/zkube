# zKube Level System - Technical Specifications

> **Document Type:** Technical Reference + Future Planning  
> **Last Updated:** January 2026  
> **Status:** Partially Implemented
>
> **Note:** This document contains both implemented features (Endless mode) and future planning (Daily Challenge mode). Features marked as "FUTURE" are not yet implemented.

---

## Table of Contents

1. [Game Modes Architecture](#game-modes-architecture)
2. [Contract Types](#contract-types)
3. [Contract Models](#contract-models)
4. [Contract Systems](#contract-systems)
5. [Contract Helpers](#contract-helpers)
6. [Contract Events](#contract-events)
7. [Client Types](#client-types)
8. [Client State Management](#client-state-management)
9. [Client Hooks](#client-hooks)
10. [Bit-Packing Specifications](#bit-packing-specifications)
11. [Level Generation Algorithm](#level-generation-algorithm)
12. [Seed System](#seed-system)

---

## Game Modes Architecture

### Two Modes, Shared Progression

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME MODE SELECTION                      │
└─────────────────────────────────────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌───────────────┐           ┌───────────────┐
    │    DAILY      │           │    ENDLESS    │
    │   CHALLENGE   │           │     MODE      │
    └───────────────┘           └───────────────┘
    │ Same seed     │           │ Random seed   │
    │ Once per day  │           │ Unlimited     │
    │ Leaderboard   │           │ Personal best │
    └───────┬───────┘           └───────┬───────┘
            │                           │
            └───────────┬───────────────┘
                        ▼
            ┌───────────────────────┐
            │   SHARED PROGRESSION  │
            │   - 100 Levels        │
            │   - Star System       │
            │   - Bonus Inventory   │
            │   - Constraints       │
            │   - Revival (1x/run)  │
            └───────────────────────┘
```

### Mode Enum

```cairo
#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum GameMode {
    None,
    Daily,      // Same seed for all players, once per day
    Endless,    // Random seed, unlimited plays
}
```

### Seed Generation

```cairo
// Daily Challenge: Deterministic seed from day_id
fn get_daily_seed(day_id: u32) -> felt252 {
    // Hash the day_id to create consistent seed
    let seed_base: felt252 = day_id.into();
    poseidon_hash_span(array![seed_base, 'ZKUBE_DAILY'].span())
}

// Endless Mode: Random seed from VRF + player + timestamp
fn get_endless_seed(player: ContractAddress, timestamp: u64) -> felt252 {
    let vrf_seed = get_vrf_random();
    poseidon_hash_span(array![vrf_seed, player.into(), timestamp.into()].span())
}
```

---

## Contract Types

### ConstraintType Enum

```cairo
// contracts/src/types/constraint.cairo

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum ConstraintType {
    None,           // No constraint
    ClearLines,     // Must clear X lines in one move, Y times
    NoBonusUsed,    // Must not use any bonus
}
```

### LevelConstraint Struct

```cairo
// contracts/src/types/constraint.cairo

#[derive(Copy, Drop, Serde, Introspect)]
pub struct LevelConstraint {
    pub constraint_type: ConstraintType,
    pub value: u8,          // For ClearLines: number of lines to clear
    pub required_count: u8, // How many times to achieve it
}

impl LevelConstraintDefault of Default<LevelConstraint> {
    fn default() -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::None,
            value: 0,
            required_count: 0,
        }
    }
}
```

### LevelConfig Struct

```cairo
// contracts/src/types/level.cairo

#[derive(Copy, Drop, Serde, Introspect)]
pub struct LevelConfig {
    pub level: u8,                    // 1-100
    pub points_required: u16,         // Points needed to clear
    pub max_moves: u16,               // Move limit
    pub difficulty: Difficulty,       // Block generation difficulty
    pub constraint: LevelConstraint,  // Level constraint
    pub star_3_moves: u16,            // Max moves for 3 stars
    pub star_2_moves: u16,            // Max moves for 2 stars
}
```

---

## Contract Models

### GameRun Model (Shared for both modes)

```cairo
// contracts/src/models/game_run.cairo

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct GameRun {
    #[key]
    pub run_id: u64,              // Unique run identifier
    #[key]
    pub player: ContractAddress,
    pub mode: GameMode,           // Daily or Endless
    pub seed: felt252,            // Run seed (same for all in Daily)
    pub day_id: u32,              // For Daily: the day. For Endless: 0
    pub data: felt252,            // Bit-packed progress (see specs below)
    pub game_id: u64,             // Current active game
    pub started_at: u64,          // Timestamp
    pub ended_at: u64,            // 0 if still active
}
```

### DailyLeaderboard Model

```cairo
// contracts/src/models/daily.cairo

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct DailyLeaderboard {
    #[key]
    pub day_id: u32,
    pub player_count: u16,        // Incremented for timestamp_order
}
```

### PlayerStats Model (For Endless personal bests)

```cairo
// contracts/src/models/player_stats.cairo

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerStats {
    #[key]
    pub player: ContractAddress,
    pub endless_best_level: u8,       // Highest level reached in Endless
    pub endless_best_score: u32,      // Highest score in Endless
    pub daily_streak: u16,            // Consecutive days completed
    pub daily_last_completed: u32,    // Last day_id completed
    pub total_runs: u32,              // Total runs played
    pub total_stars: u32,             // Lifetime stars earned
}
```

### PlayerMeta Model (Persistent Unlocks - Meta-Progression)

```cairo
// contracts/src/models/player_meta.cairo

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub unlocks: felt252,             // Bit-packed unlock flags
    pub best_level_ever: u8,          // Highest level reached (any mode)
    pub total_3star_levels: u16,      // Count of 3-star completions
    pub selected_loadout: u8,         // Currently selected loadout ID
    pub selected_theme: u8,           // Currently selected cosmetic theme
}
```

#### PlayerMeta.unlocks Bit Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Bits    │ Field                │ Description                │
├─────────┼──────────────────────┼────────────────────────────┤
│ 0       │ loadout_apprentice   │ Start with 1 Hammer        │
│ 1       │ loadout_prepared     │ Start with 1 of each       │
│ 2       │ loadout_veteran      │ Start with 2H, 1W          │
│ 3       │ loadout_expert       │ Start with 2 of each       │
│ 4       │ loadout_master       │ Start with 3 of each       │
│ 5-9     │ reserved_loadouts    │ Future loadouts            │
│ 10      │ theme_streak_7       │ 7-day streak theme         │
│ 11      │ theme_streak_30      │ 30-day streak theme        │
│ 12-19   │ reserved_themes      │ Future cosmetics           │
│ 20      │ badge_centurion      │ 100 total levels cleared   │
│ 21      │ badge_perfectionist  │ 10 levels with 3★          │
│ 22-31   │ reserved_badges      │ Future badges              │
│ 32-251  │ reserved             │ Future use                 │
└─────────────────────────────────────────────────────────────┘
```

### Loadout Configuration

```cairo
// contracts/src/types/loadout.cairo

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum Loadout {
    FreshStart,      // 0: No starting bonuses
    Apprentice,      // 1: 1 Hammer
    Prepared,        // 2: 1 of each
    Veteran,         // 3: 2 Hammer, 1 Wave
    Expert,          // 4: 2 of each
    Master,          // 5: 3 of each
}

fn get_loadout_bonuses(loadout: Loadout) -> (u8, u8, u8) {
    // Returns (hammer, wave, totem)
    match loadout {
        Loadout::FreshStart => (0, 0, 0),
        Loadout::Apprentice => (1, 0, 0),
        Loadout::Prepared => (1, 1, 1),
        Loadout::Veteran => (2, 1, 0),
        Loadout::Expert => (2, 2, 2),
        Loadout::Master => (3, 3, 3),
    }
}

fn get_loadout_unlock_requirement(loadout: Loadout) -> u8 {
    // Returns minimum level ever reached to unlock
    match loadout {
        Loadout::FreshStart => 0,
        Loadout::Apprentice => 10,
        Loadout::Prepared => 25,
        Loadout::Veteran => 50,
        Loadout::Expert => 75,
        Loadout::Master => 100,
    }
}
```

### MilestoneChoice Types

```cairo
// contracts/src/types/choice.cairo

#[derive(Copy, Drop, Serde, PartialEq, Introspect)]
pub enum ChoiceType {
    BonusQuantity,       // +2 specific vs +1 each
    BonusVsStars,        // +1 random vs double stars next level
    HealVsReward,        // Reset moves vs +2 random
    RiskVsSafe,          // Skip constraint (1★ max) vs normal
    SpecialistVsGeneral, // +3 chosen vs +1 each + moves
}

#[derive(Copy, Drop, Serde, Introspect)]
pub struct MilestoneChoice {
    pub choice_type: ChoiceType,
    pub option_a_bonus: Bonus,        // For BonusQuantity: which bonus
    pub option_a_amount: u8,
    pub option_b_bonus: Bonus,
    pub option_b_amount: u8,
}

/// Milestone levels where choices appear
fn is_milestone_level(level: u8) -> bool {
    level > 0 && level % 10 == 0 && level <= 90
}

/// Generate deterministic choice for milestone
fn generate_milestone_choice(seed: felt252, level: u8) -> MilestoneChoice {
    assert(is_milestone_level(level), 'Not a milestone level');
    
    let choice_seed = poseidon_hash_span(array![seed, level.into(), 'CHOICE'].span());
    let choice_index = (choice_seed.into() % 5_u256).try_into().unwrap();
    
    // Determine bonus type for options
    let bonus_seed = poseidon_hash_span(array![choice_seed, 'BONUS'].span());
    let bonus_index: u8 = (bonus_seed.into() % 3_u256).try_into().unwrap();
    let primary_bonus = match bonus_index {
        0 => Bonus::Hammer,
        1 => Bonus::Wave,
        _ => Bonus::Totem,
    };
    
    match choice_index {
        0 => MilestoneChoice {
            choice_type: ChoiceType::BonusQuantity,
            option_a_bonus: primary_bonus,
            option_a_amount: 2,
            option_b_bonus: Bonus::None, // Indicates "1 of each"
            option_b_amount: 1,
        },
        1 => MilestoneChoice {
            choice_type: ChoiceType::BonusVsStars,
            option_a_bonus: Bonus::None, // Random
            option_a_amount: 1,
            option_b_bonus: Bonus::None,
            option_b_amount: 2, // Double stars multiplier
        },
        2 => MilestoneChoice {
            choice_type: ChoiceType::HealVsReward,
            option_a_bonus: Bonus::None,
            option_a_amount: 0, // Reset moves
            option_b_bonus: Bonus::None, // Random
            option_b_amount: 2,
        },
        3 => MilestoneChoice {
            choice_type: ChoiceType::RiskVsSafe,
            option_a_bonus: Bonus::None,
            option_a_amount: 0, // Skip constraint
            option_b_bonus: Bonus::None,
            option_b_amount: 0, // Normal
        },
        _ => MilestoneChoice {
            choice_type: ChoiceType::SpecialistVsGeneral,
            option_a_bonus: primary_bonus,
            option_a_amount: 3,
            option_b_bonus: Bonus::None, // 1 each + moves
            option_b_amount: 1,
        },
    }
}
```

### Run State with Choice Effects

```cairo
// Additional fields in GameRun.data for choice effects
// 
// Bit layout extension:
// bits 94-95: double_stars_next (0-3, levels remaining with 2x stars)
// bits 96-97: skip_constraint_next (0-3, levels remaining)
// bits 98-105: bonus_moves_next (0-255, extra moves for next level)
```

### Modified Game Model

```cairo
// contracts/src/models/game.cairo (additions)

pub struct Game {
    // ... existing fields ...
    
    // Level system additions
    pub current_level: u8,            // Current level (1-100)
    pub level_score: u16,             // Score for current level (resets per level)
    pub level_moves: u16,             // Moves for current level (resets per level)
    pub constraint_progress: u32,     // Bit-packed constraint tracking
    pub bonus_used_this_level: bool,  // For NoBonusUsed constraint
    pub day_id: u32,                  // Link to daily challenge (0 if not daily)
}
```

---

## Contract Systems

### IDailySystem Interface

```cairo
// contracts/src/systems/daily.cairo

#[dojo::interface]
trait IDailySystem<T> {
    /// Start a new daily challenge for the caller
    /// Returns the game_id of the created game
    fn start_daily(ref self: T) -> u64;
    
    /// Called internally when a level is completed
    /// Handles star calculation, bonus rewards, level transition
    fn complete_level(ref self: T, game_id: u64);
    
    /// Use the one-time revival (requires payment)
    /// Resets current level and allows continuation
    fn use_revival(ref self: T, game_id: u64);
    
    /// Get a player's daily progress
    fn get_daily_progress(
        self: @T, 
        player: ContractAddress, 
        day_id: u32
    ) -> DailyPlayer;
    
    /// Check if player has played today
    fn has_played_today(self: @T, player: ContractAddress) -> bool;
    
    /// Get current day_id
    fn get_current_day_id(self: @T) -> u32;
}
```

### Modified IGameSystem Interface

```cairo
// contracts/src/systems/game.cairo (additions)

#[dojo::interface]
trait IGameSystem<T> {
    // ... existing functions ...
    
    /// Get level configuration for a specific level
    fn get_level_config(self: @T, level: u8) -> LevelConfig;
    
    /// Check if current level is complete
    fn is_level_complete(self: @T, game_id: u64) -> bool;
    
    /// Get constraint progress for current level
    fn get_constraint_progress(self: @T, game_id: u64) -> (u8, u8); // (current, required)
}
```

---

## Contract Helpers

### Level Generator

```cairo
// contracts/src/helpers/level_generator.cairo

/// Generate level configuration for a given level number
fn generate_level_config(level: u8) -> LevelConfig {
    let points_required = calculate_points_required(level);
    let max_moves = calculate_max_moves(level);
    let difficulty = calculate_difficulty(level);
    let constraint = calculate_constraint(level);
    
    let star_3_moves = max_moves * 40 / 100;  // 40% of max
    let star_2_moves = max_moves * 70 / 100;  // 70% of max
    
    LevelConfig {
        level,
        points_required,
        max_moves,
        difficulty,
        constraint,
        star_3_moves,
        star_2_moves,
    }
}

fn calculate_points_required(level: u8) -> u16 {
    // Base points derived from moves × ratio (0.80 → 2.50)
    // Level 1: ~16 (20×0.80), Level 50: ~150 (60×2.50)
    // Actual formula: base_moves × ratio_x100 / 100
    // With variance applied for variety
}

fn calculate_max_moves(level: u8) -> u16 {
    // Base: 20 moves, increases to 60 at level 50 (level cap)
    // Level 1: 20, Level 25: 40, Level 50: 60
    20 + ((level.into() - 1) * 40 / 49)
}

fn calculate_difficulty(level: u8) -> Difficulty {
    if level <= 10 {
        Difficulty::Easy
    } else if level <= 25 {
        Difficulty::Medium
    } else if level <= 45 {
        Difficulty::MediumHard
    } else if level <= 65 {
        Difficulty::Hard
    } else if level <= 85 {
        Difficulty::VeryHard
    } else if level <= 95 {
        Difficulty::Expert
    } else {
        Difficulty::Master
    }
}

fn calculate_constraint(level: u8) -> LevelConstraint {
    if level <= 5 {
        // No constraint for first 5 levels
        LevelConstraint::default()
    } else if level <= 20 {
        // Clear 2 lines, 1 time
        LevelConstraint {
            constraint_type: ConstraintType::ClearLines,
            value: 2,
            required_count: 1,
        }
    } else if level <= 40 {
        // Clear 2-3 lines, 1-2 times
        let lines = 2 + ((level - 20) / 10);  // 2 or 3
        let count = 1 + ((level - 20) / 20);  // 1 or 2
        LevelConstraint {
            constraint_type: ConstraintType::ClearLines,
            value: lines,
            required_count: count,
        }
    } else if level <= 60 {
        // Clear 3-4 lines, 2-3 times, or NoBonusUsed
        if level % 5 == 0 {
            LevelConstraint {
                constraint_type: ConstraintType::NoBonusUsed,
                value: 0,
                required_count: 0,
            }
        } else {
            LevelConstraint {
                constraint_type: ConstraintType::ClearLines,
                value: 3 + ((level - 40) / 20),
                required_count: 2 + ((level - 40) / 20),
            }
        }
    } else if level <= 80 {
        // Clear 4 lines, 3-4 times
        LevelConstraint {
            constraint_type: ConstraintType::ClearLines,
            value: 4,
            required_count: 3 + ((level - 60) / 20),
        }
    } else {
        // Clear 4-5 lines, 4-5 times
        let lines = 4 + ((level - 80) / 10);
        let count = 4 + ((level - 80) / 10);
        LevelConstraint {
            constraint_type: ConstraintType::ClearLines,
            value: if lines > 5 { 5 } else { lines },
            required_count: if count > 6 { 6 } else { count },
        }
    }
}
```

### Daily Helpers

```cairo
// contracts/src/helpers/daily.cairo

use core::integer::u256;

/// Pack daily progress into a single felt252
fn pack_daily_progress(
    level: u8,
    score: u16,
    stars_total: u16,
    hammer: u8,
    wave: u8,
    totem: u8,
    revival_used: bool,
    timestamp_order: u16,
    constraint_progress: u32,
) -> felt252 {
    let mut result: u256 = 0;
    
    // Pack fields from LSB
    result = result | level.into();                           // bits 0-6
    result = result | ((score.into()) << 7);                  // bits 7-22
    result = result | ((stars_total.into()) << 23);           // bits 23-32
    result = result | ((hammer.into() & 0xF) << 33);          // bits 33-36
    result = result | ((wave.into() & 0xF) << 37);            // bits 37-40
    result = result | ((totem.into() & 0xF) << 41);           // bits 41-44
    result = result | ((if revival_used { 1_u256 } else { 0_u256 }) << 45); // bit 45
    result = result | ((timestamp_order.into()) << 46);       // bits 46-61
    result = result | ((constraint_progress.into()) << 62);   // bits 62-93
    
    result.try_into().unwrap()
}

/// Unpack daily progress from a felt252
fn unpack_daily_progress(data: felt252) -> (
    u8,    // level
    u16,   // score
    u16,   // stars_total
    u8,    // hammer
    u8,    // wave
    u8,    // totem
    bool,  // revival_used
    u16,   // timestamp_order
    u32,   // constraint_progress
) {
    let data_u256: u256 = data.into();
    
    let level = (data_u256 & 0x7F).try_into().unwrap();
    let score = ((data_u256 >> 7) & 0xFFFF).try_into().unwrap();
    let stars_total = ((data_u256 >> 23) & 0x3FF).try_into().unwrap();
    let hammer = ((data_u256 >> 33) & 0xF).try_into().unwrap();
    let wave = ((data_u256 >> 37) & 0xF).try_into().unwrap();
    let totem = ((data_u256 >> 41) & 0xF).try_into().unwrap();
    let revival_used = ((data_u256 >> 45) & 0x1) == 1;
    let timestamp_order = ((data_u256 >> 46) & 0xFFFF).try_into().unwrap();
    let constraint_progress = ((data_u256 >> 62) & 0xFFFFFFFF).try_into().unwrap();
    
    (level, score, stars_total, hammer, wave, totem, revival_used, timestamp_order, constraint_progress)
}

/// Calculate stars earned based on moves used
fn calculate_stars(moves: u16, level_config: LevelConfig) -> u8 {
    if moves <= level_config.star_3_moves {
        3
    } else if moves <= level_config.star_2_moves {
        2
    } else {
        1
    }
}

/// Get current day_id (UTC)
fn get_day_id(timestamp: u64) -> u32 {
    (timestamp / 86400).try_into().unwrap()
}

/// Check if level constraints are met
fn check_constraints_complete(
    constraint: LevelConstraint,
    constraint_progress: u32,
    bonus_used: bool,
) -> bool {
    match constraint.constraint_type {
        ConstraintType::None => true,
        ConstraintType::ClearLines => {
            let achieved_count = (constraint_progress & 0xFF).try_into().unwrap();
            achieved_count >= constraint.required_count
        },
        ConstraintType::NoBonusUsed => !bonus_used,
    }
}

/// Update constraint progress after a move
fn update_constraint_progress(
    constraint: LevelConstraint,
    current_progress: u32,
    lines_cleared: u8,
) -> u32 {
    match constraint.constraint_type {
        ConstraintType::None => current_progress,
        ConstraintType::ClearLines => {
            if lines_cleared >= constraint.value {
                // Increment the count
                let current_count = (current_progress & 0xFF);
                (current_progress & 0xFFFFFF00) | (current_count + 1)
            } else {
                current_progress
            }
        },
        ConstraintType::NoBonusUsed => current_progress,
    }
}
```

---

## Contract Events

```cairo
// contracts/src/events.cairo (additions)

#[derive(Copy, Drop, Serde, starknet::Event)]
pub struct LevelCompleted {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub level: u8,
    pub stars: u8,
    pub moves: u16,
    pub bonus_earned: Bonus,
}

#[derive(Copy, Drop, Serde, starknet::Event)]
pub struct DailyStarted {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub day_id: u32,
    pub game_id: u64,
    pub timestamp_order: u16,
}

#[derive(Copy, Drop, Serde, starknet::Event)]
pub struct DailyEnded {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub day_id: u32,
    pub final_level: u8,
    pub total_score: u16,
    pub total_stars: u16,
    pub timestamp_order: u16,
}

#[derive(Copy, Drop, Serde, starknet::Event)]
pub struct RevivalUsed {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub level: u8,
}

#[derive(Copy, Drop, Serde, starknet::Event)]
pub struct ConstraintProgress {
    #[key]
    pub game_id: u64,
    pub constraint_type: ConstraintType,
    pub current: u8,
    pub required: u8,
}
```

---

## Client Types

### TypeScript Constraint Types

```typescript
// client-budokan/src/dojo/game/types/constraint.ts

export enum ConstraintType {
  None = 0,
  ClearLines = 1,
  NoBonusUsed = 2,
}

export interface LevelConstraint {
  constraintType: ConstraintType;
  value: number;      // Lines to clear for ClearLines
  requiredCount: number;
}

export class Constraint {
  constructor(
    public type: ConstraintType,
    public value: number,
    public requiredCount: number
  ) {}

  static fromRaw(data: any): Constraint {
    return new Constraint(
      data.constraint_type,
      data.value,
      data.required_count
    );
  }

  getDescription(): string {
    switch (this.type) {
      case ConstraintType.None:
        return "No constraint";
      case ConstraintType.ClearLines:
        return `Clear ${this.value} lines at once (${this.requiredCount}x)`;
      case ConstraintType.NoBonusUsed:
        return "Complete without using bonuses";
      default:
        return "Unknown constraint";
    }
  }

  isComplete(progress: number, bonusUsed: boolean): boolean {
    switch (this.type) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ClearLines:
        return progress >= this.requiredCount;
      case ConstraintType.NoBonusUsed:
        return !bonusUsed;
      default:
        return false;
    }
  }
}
```

### TypeScript Level Types

```typescript
// client-budokan/src/dojo/game/types/level.ts

import { Difficulty } from "./difficulty";
import { Constraint, LevelConstraint } from "./constraint";

export interface LevelConfig {
  level: number;
  pointsRequired: number;
  maxMoves: number;
  difficulty: Difficulty;
  constraint: LevelConstraint;
  star3Moves: number;
  star2Moves: number;
}

export class Level {
  constructor(public config: LevelConfig) {}

  static generate(level: number): Level {
    const pointsRequired = 20 + Math.floor((level - 1) * 180 / 99);
    const maxMoves = 30 + Math.floor((level - 1) * 70 / 99);
    const star3Moves = Math.floor(maxMoves * 0.4);
    const star2Moves = Math.floor(maxMoves * 0.7);
    const difficulty = Level.calculateDifficulty(level);
    const constraint = Level.calculateConstraint(level);

    return new Level({
      level,
      pointsRequired,
      maxMoves,
      difficulty,
      constraint,
      star3Moves,
      star2Moves,
    });
  }

  private static calculateDifficulty(level: number): Difficulty {
    if (level <= 10) return Difficulty.Easy;
    if (level <= 25) return Difficulty.Medium;
    if (level <= 45) return Difficulty.MediumHard;
    if (level <= 65) return Difficulty.Hard;
    if (level <= 85) return Difficulty.VeryHard;
    if (level <= 95) return Difficulty.Expert;
    return Difficulty.Master;
  }

  private static calculateConstraint(level: number): LevelConstraint {
    // Mirror contract logic
    // ... (same as contract implementation)
  }

  calculateStars(movesUsed: number): number {
    if (movesUsed <= this.config.star3Moves) return 3;
    if (movesUsed <= this.config.star2Moves) return 2;
    return 1;
  }

  getStarPreview(currentMoves: number): { possible: number; current: number } {
    return {
      possible: this.calculateStars(currentMoves),
      current: currentMoves,
    };
  }
}
```

---

## Client State Management

### Daily Store

```typescript
// client-budokan/src/stores/dailyStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BonusType } from "@/dojo/game/types/bonus";
import { LevelConfig } from "@/dojo/game/types/level";

interface ConstraintProgress {
  current: number;
  required: number;
}

interface DailyState {
  // Session state
  isPlaying: boolean;
  dayId: number | null;
  gameId: number | null;
  
  // Level state
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  totalScore: number;
  totalStars: number;
  
  // Bonus inventory
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  
  // Constraint tracking
  constraintProgress: ConstraintProgress;
  bonusUsedThisLevel: boolean;
  
  // Revival
  revivalUsed: boolean;
  
  // Level config (current)
  levelConfig: LevelConfig | null;
  
  // Actions
  startDaily: (dayId: number, gameId: number) => void;
  setLevelConfig: (config: LevelConfig) => void;
  advanceLevel: (stars: number, bonusType: BonusType | null) => void;
  updateConstraintProgress: (linesClearedInMove: number) => void;
  useBonus: (type: BonusType) => void;
  addBonus: (type: BonusType) => void;
  useRevival: () => void;
  endDaily: () => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  dayId: null,
  gameId: null,
  currentLevel: 1,
  levelScore: 0,
  levelMoves: 0,
  totalScore: 0,
  totalStars: 0,
  hammerCount: 0,
  waveCount: 0,
  totemCount: 0,
  constraintProgress: { current: 0, required: 0 },
  bonusUsedThisLevel: false,
  revivalUsed: false,
  levelConfig: null,
};

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startDaily: (dayId, gameId) => set({
        isPlaying: true,
        dayId,
        gameId,
        currentLevel: 1,
        levelScore: 0,
        levelMoves: 0,
        totalScore: 0,
        totalStars: 0,
        hammerCount: 0,
        waveCount: 0,
        totemCount: 0,
        constraintProgress: { current: 0, required: 0 },
        bonusUsedThisLevel: false,
        revivalUsed: false,
      }),

      setLevelConfig: (config) => set({
        levelConfig: config,
        constraintProgress: { 
          current: 0, 
          required: config.constraint.requiredCount 
        },
      }),

      advanceLevel: (stars, bonusType) => {
        const state = get();
        const bonusUpdates: Partial<DailyState> = {};
        
        if (bonusType) {
          switch (bonusType) {
            case BonusType.Hammer:
              bonusUpdates.hammerCount = state.hammerCount + 1;
              break;
            case BonusType.Wave:
              bonusUpdates.waveCount = state.waveCount + 1;
              break;
            case BonusType.Totem:
              bonusUpdates.totemCount = state.totemCount + 1;
              break;
          }
        }

        set({
          currentLevel: state.currentLevel + 1,
          levelScore: 0,
          levelMoves: 0,
          totalScore: state.totalScore + state.levelScore,
          totalStars: state.totalStars + stars,
          constraintProgress: { current: 0, required: 0 },
          bonusUsedThisLevel: false,
          ...bonusUpdates,
        });
      },

      updateConstraintProgress: (linesClearedInMove) => {
        const state = get();
        if (!state.levelConfig) return;
        
        const { constraint } = state.levelConfig;
        if (constraint.constraintType === 1 && linesClearedInMove >= constraint.value) {
          set({
            constraintProgress: {
              ...state.constraintProgress,
              current: state.constraintProgress.current + 1,
            },
          });
        }
      },

      useBonus: (type) => {
        const state = get();
        const updates: Partial<DailyState> = { bonusUsedThisLevel: true };
        
        switch (type) {
          case BonusType.Hammer:
            if (state.hammerCount > 0) updates.hammerCount = state.hammerCount - 1;
            break;
          case BonusType.Wave:
            if (state.waveCount > 0) updates.waveCount = state.waveCount - 1;
            break;
          case BonusType.Totem:
            if (state.totemCount > 0) updates.totemCount = state.totemCount - 1;
            break;
        }
        
        set(updates);
      },

      addBonus: (type) => {
        const state = get();
        switch (type) {
          case BonusType.Hammer:
            set({ hammerCount: state.hammerCount + 1 });
            break;
          case BonusType.Wave:
            set({ waveCount: state.waveCount + 1 });
            break;
          case BonusType.Totem:
            set({ totemCount: state.totemCount + 1 });
            break;
        }
      },

      useRevival: () => set({ revivalUsed: true }),

      endDaily: () => set({ isPlaying: false }),

      reset: () => set(initialState),
    }),
    {
      name: "zkube-daily-store",
      partialize: (state) => ({
        dayId: state.dayId,
        isPlaying: state.isPlaying,
      }),
    }
  )
);
```

---

## Client Hooks

### useDailyChallenge Hook

```typescript
// client-budokan/src/hooks/useDailyChallenge.tsx

import { useMemo, useCallback } from "react";
import { useDojo } from "@/dojo/useDojo";
import { useDailyStore } from "@/stores/dailyStore";
import { Level } from "@/dojo/game/types/level";

export function useDailyChallenge() {
  const { setup, account } = useDojo();
  const { client } = setup;
  const store = useDailyStore();

  // Calculate current day_id
  const currentDayId = useMemo(() => {
    return Math.floor(Date.now() / 1000 / 86400);
  }, []);

  // Check if already played today
  const hasPlayedToday = useMemo(() => {
    return store.dayId === currentDayId && !store.isPlaying;
  }, [store.dayId, currentDayId, store.isPlaying]);

  // Start daily challenge
  const startDaily = useCallback(async () => {
    if (!account) return;
    
    try {
      const gameId = await client.daily.start_daily(account);
      store.startDaily(currentDayId, Number(gameId));
      
      // Set first level config
      const levelConfig = Level.generate(1);
      store.setLevelConfig(levelConfig.config);
      
      return gameId;
    } catch (error) {
      console.error("Failed to start daily:", error);
      throw error;
    }
  }, [account, client, currentDayId, store]);

  // Use revival
  const useRevival = useCallback(async () => {
    if (!account || !store.gameId || store.revivalUsed) return;
    
    try {
      await client.daily.use_revival(account, BigInt(store.gameId));
      store.useRevival();
    } catch (error) {
      console.error("Failed to use revival:", error);
      throw error;
    }
  }, [account, client, store]);

  // Get current level config
  const currentLevelConfig = useMemo(() => {
    return Level.generate(store.currentLevel);
  }, [store.currentLevel]);

  return {
    // State
    isPlaying: store.isPlaying,
    currentLevel: store.currentLevel,
    levelScore: store.levelScore,
    totalScore: store.totalScore,
    totalStars: store.totalStars,
    constraintProgress: store.constraintProgress,
    revivalAvailable: !store.revivalUsed,
    hasPlayedToday,
    currentDayId,
    
    // Level config
    levelConfig: currentLevelConfig,
    
    // Bonus inventory
    bonuses: {
      hammer: store.hammerCount,
      wave: store.waveCount,
      totem: store.totemCount,
    },
    
    // Actions
    startDaily,
    useRevival,
  };
}
```

### useLevelConfig Hook

```typescript
// client-budokan/src/hooks/useLevelConfig.tsx

import { useMemo } from "react";
import { Level, LevelConfig } from "@/dojo/game/types/level";

export function useLevelConfig(level: number): LevelConfig {
  return useMemo(() => {
    return Level.generate(level).config;
  }, [level]);
}

export function useLevelProgress(
  currentScore: number,
  currentMoves: number,
  levelConfig: LevelConfig
) {
  return useMemo(() => {
    const scoreProgress = Math.min(100, (currentScore / levelConfig.pointsRequired) * 100);
    const movesRemaining = levelConfig.maxMoves - currentMoves;
    const potentialStars = Level.prototype.calculateStars.call(
      { config: levelConfig },
      currentMoves
    );
    
    return {
      scoreProgress,
      movesRemaining,
      potentialStars,
      isComplete: currentScore >= levelConfig.pointsRequired,
      isOverMoveLimit: currentMoves >= levelConfig.maxMoves,
    };
  }, [currentScore, currentMoves, levelConfig]);
}
```

---

## Bit-Packing Specifications

### DailyPlayer.data Layout

| Bits | Field | Size | Max Value | Description |
|------|-------|------|-----------|-------------|
| 0-6 | level | 7 | 127 | Current level reached |
| 7-22 | score | 16 | 65,535 | Total accumulated score |
| 23-32 | stars_total | 10 | 1,023 | Total stars earned |
| 33-36 | hammer | 4 | 15 | Hammer bonus count |
| 37-40 | wave | 4 | 15 | Wave bonus count |
| 41-44 | totem | 4 | 15 | Totem bonus count |
| 45 | revival_used | 1 | 1 | Revival flag |
| 46-61 | timestamp_order | 16 | 65,535 | Registration order for tiebreak |
| 62-93 | constraint_progress | 32 | - | Level constraint state |
| 94-251 | reserved | 158 | - | Future use |

### Constraint Progress Layout (32 bits)

| Bits | Field | Size | Description |
|------|-------|------|-------------|
| 0-7 | count | 8 | Times constraint achieved |
| 8-31 | reserved | 24 | Future use |

---

## Level Generation Algorithm

### Formulas

```
Points Required:
  base = 20
  increment = (level - 1) * 180 / 99
  result = base + increment
  Range: 20 (L1) → 200 (L100)

Max Moves:
  base = 30
  increment = (level - 1) * 70 / 99
  result = base + increment
  Range: 30 (L1) → 100 (L100)

Star Thresholds:
  3 stars = max_moves * 0.40
  2 stars = max_moves * 0.70

Difficulty Mapping:
  L1-10:   Easy
  L11-25:  Medium
  L26-45:  MediumHard
  L46-65:  Hard
  L66-85:  VeryHard
  L86-95:  Expert
  L96-100: Master

Constraint Mapping:
  L1-5:    None
  L6-20:   ClearLines(2, 1)
  L21-40:  ClearLines(2-3, 1-2)
  L41-60:  ClearLines(3-4, 2-3) or NoBonusUsed
  L61-80:  ClearLines(4, 3-4)
  L81-100: ClearLines(4-5, 4-6)
```

### Sample Level Configs

| Level | Points | Max Moves | 3★ | 2★ | Difficulty | Constraint |
|-------|--------|-----------|----|----|------------|------------|
| 1 | 20 | 30 | 12 | 21 | Easy | None |
| 10 | 36 | 36 | 14 | 25 | Easy | Clear 2 lines (1x) |
| 25 | 64 | 47 | 19 | 33 | Medium | Clear 2 lines (1x) |
| 50 | 109 | 65 | 26 | 45 | Hard | Clear 3 lines (2x) |
| 75 | 155 | 82 | 33 | 57 | VeryHard | Clear 4 lines (3x) |
| 100 | 200 | 100 | 40 | 70 | Master | Clear 5 lines (5x) |

---

## Seed System

### Overview

The seed system ensures:
- **Daily Challenge**: Identical puzzles for all players (fair competition)
- **Endless Mode**: Unique puzzles per player (personal progression)

### Seed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SEED GENERATION                        │
└─────────────────────────────────────────────────────────────┘

DAILY CHALLENGE:
  seed = hash(day_id, "ZKUBE_DAILY")
  
  day_id = unix_timestamp / 86400
  
  Example:
    Jan 23, 2026 → day_id = 20477
    seed = poseidon("20477", "ZKUBE_DAILY") → 0x1a2b3c...

ENDLESS MODE:
  seed = hash(vrf_random, player_address, timestamp)
  
  Example:
    vrf = 0xabc123...
    player = 0xdef456...
    time = 1737628800
    seed = poseidon(vrf, player, time) → 0x7e8f9a...
```

### Seed Usage in Level Generation

```cairo
/// Generate a row of blocks deterministically from seed and level
fn generate_row(seed: felt252, level: u8, row_index: u32) -> u32 {
    // Combine seed with level and row to get unique but deterministic row
    let row_seed = poseidon_hash_span(
        array![seed, level.into(), row_index.into()].span()
    );
    
    // Convert to difficulty-appropriate block distribution
    let difficulty = get_difficulty_for_level(level);
    blocks_from_seed(row_seed, difficulty)
}
```

### Shareable Seed Codes (Endless Mode)

```typescript
// Client-side seed encoding for sharing
export function encodeSeed(seed: bigint): string {
  // Convert to base36 for shorter codes
  return seed.toString(36).toUpperCase().slice(0, 8);
}

export function decodeSeed(code: string): bigint {
  return BigInt("0x" + parseInt(code, 36).toString(16));
}

// Example: seed 0x1a2b3c4d5e6f → "ZKUB3ABC"
```

### Contract Implementation

```cairo
// contracts/src/helpers/seed.cairo

use core::poseidon::poseidon_hash_span;

const DAILY_SALT: felt252 = 'ZKUBE_DAILY_V1';
const ENDLESS_SALT: felt252 = 'ZKUBE_ENDLESS_V1';

/// Get deterministic seed for daily challenge
fn get_daily_seed(day_id: u32) -> felt252 {
    poseidon_hash_span(array![day_id.into(), DAILY_SALT].span())
}

/// Get random seed for endless mode
fn get_endless_seed(
    vrf_random: felt252,
    player: ContractAddress,
    timestamp: u64
) -> felt252 {
    poseidon_hash_span(
        array![vrf_random, player.into(), timestamp.into(), ENDLESS_SALT].span()
    )
}

/// Derive level-specific seed from run seed
fn get_level_seed(run_seed: felt252, level: u8) -> felt252 {
    poseidon_hash_span(array![run_seed, level.into()].span())
}

/// Derive row-specific seed from level seed
fn get_row_seed(level_seed: felt252, row_index: u32) -> felt252 {
    poseidon_hash_span(array![level_seed, row_index.into()].span())
}
```

### Verification

For Daily Challenge fairness, the seed can be verified:

```cairo
/// Anyone can verify the daily seed is correct
fn verify_daily_seed(day_id: u32, claimed_seed: felt252) -> bool {
    get_daily_seed(day_id) == claimed_seed
}
```

### Client-Side Seed Display

```typescript
// Show seed info in UI for transparency
interface SeedInfo {
  mode: "daily" | "endless";
  seed: string;        // Shortened display: "ZKUB...3ABC"
  fullSeed: bigint;    // For sharing/verification
  dayId?: number;      // For daily mode
}

export function formatSeedDisplay(seed: bigint, mode: GameMode): string {
  const short = seed.toString(16).slice(0, 8).toUpperCase();
  return `${mode === "daily" ? "D" : "E"}-${short}`;
}
```
