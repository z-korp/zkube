# zKube Level System - Implementation Guide

> **Status:** Contract Implementation Complete - Ready for Client Implementation  
> **Phase:** 0.5 - Level Generator + Endless Mode MVP  
> **Last Updated:** January 2026  
> **Contract Build:** Passing (v1.2.0)

## Overview

This document tracks the implementation of the level system for zKube, transforming it from single-game mode into a Puzzle Roguelike with 100+ levels.

## Design Decisions (Finalized)

| Decision | Choice |
|----------|--------|
| Mode Support | Endless only (no legacy mode) |
| Seed Storage | Separate `GameSeed` model |
| Level Generation | Seed-based configs (same seed = same sequence) |
| Level 100+ | Caps at max difficulty, endless survival |
| Combo Stats | Reset per level, track `max_combo_run` |
| Leaderboard | level → level_score → started_at |
| Bonus Earning | 3★=2 random, 2★=1 random, 1★=none |
| Run State | Bit-packed in `run_data` (88 bits) |
| Level Transition | Animation + brief completing state |
| Constraint Display | Visible when level loads |
| Level 1 Start | Pre-placed rows (like current game) |
| Game Over | All progress lost (true roguelike) |
| Meta-progression | Flexible felt252 for future unlocks |

---

## Bit-Packing Specifications

### run_data Layout (88 bits used, ~164 reserved)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Bits    │ Field                 │ Size │ Range    │ Description     │
├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
│ 0-6     │ current_level         │ 7    │ 1-127    │ Current level   │
│ 7-14    │ level_score           │ 8    │ 0-255    │ Score this level│
│ 15-21   │ level_moves           │ 7    │ 0-127    │ Moves this level│
│ 22-25   │ constraint_progress   │ 4    │ 0-15     │ Times achieved  │
│ 26      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
│ 27-35   │ total_cubes           │ 9    │ 0-511    │ Cubes earned    │
│ 36-39   │ hammer_count          │ 4    │ 0-15     │ Inventory       │
│ 40-43   │ wave_count            │ 4    │ 0-15     │ Inventory       │
│ 44-47   │ totem_count           │ 4    │ 0-15     │ Inventory       │
│ 48-51   │ max_combo_run         │ 4    │ 0-15     │ Best combo      │
│ 52-67   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
│ 68      │ combo_5_achieved      │ 1    │ 0-1      │ First 5x combo  │
│ 69      │ combo_10_achieved     │ 1    │ 0-1      │ First 10x combo │
│ 70-78   │ cubes_brought         │ 9    │ 0-511    │ Cubes from wallet│
│ 79-87   │ cubes_spent           │ 9    │ 0-511    │ Cubes spent     │
│ 88-251  │ reserved              │ 164  │ -        │ Future features │
└─────────────────────────────────────────────────────────────────────┘
```

### PlayerMeta.data Layout (Meta-Progression)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Bits    │ Field                 │ Size │ Description                │
├─────────┼───────────────────────┼──────┼────────────────────────────┤
│ 0-1     │ starting_hammer       │ 2    │ Starting hammer level 0-3  │
│ 2-3     │ starting_wave         │ 2    │ Starting wave level 0-3    │
│ 4-5     │ starting_totem        │ 2    │ Starting totem level 0-3   │
│ 6-9     │ bag_hammer_level      │ 4    │ Hammer bag upgrade level   │
│ 10-13   │ bag_wave_level        │ 4    │ Wave bag upgrade level     │
│ 14-17   │ bag_totem_level       │ 4    │ Totem bag upgrade level    │
│ 18-21   │ bridging_rank         │ 4    │ Cube bridging rank         │
│ 22-37   │ total_runs            │ 16   │ Lifetime run count         │
│ 38-53   │ total_cubes_earned    │ 16   │ Lifetime cubes earned      │
│ 54-251  │ reserved              │ 198  │ Future unlocks/features    │
└─────────────────────────────────────────────────────────────────────┘
```

**Note:** Cube balance is NOT stored in PlayerMeta. It is tracked via the ERC1155 CubeToken contract.

---

## Level Generation Algorithm

### Config Generation (Seed-Based)

```
fn generate_level_config(seed: felt252, level: u8) -> LevelConfig:
    // Derive level-specific seed
    level_seed = poseidon_hash(seed, level)
    
    // Cap level for calculations (max scaling at 100)
    calc_level = min(level, 100)
    
    // Base values scale with level
    base_points = 20 + (calc_level - 1) * 180 / 99    // 20→200
    base_moves = 30 + (calc_level - 1) * 70 / 99      // 30→100
    
    // Seed-based variance (±15% of base)
    points_variance = (level_seed % 30) - 15
    moves_variance = (level_seed % 20) - 10
    
    // Apply variance
    points_required = clamp(base_points + points_variance, 15, 250)
    max_moves = clamp(base_moves + moves_variance, 20, 127)
    
    // Star thresholds
    star_3_moves = max_moves * 40 / 100
    star_2_moves = max_moves * 70 / 100
    
    // Difficulty from level (caps at Master for 100+)
    difficulty = get_difficulty_for_level(calc_level)
    
    // Constraint from seed + level
    constraint = select_constraint(level_seed, calc_level)
```

### Difficulty Mapping

| Level | Difficulty |
|-------|------------|
| 1-10 | Easy |
| 11-25 | Medium |
| 26-45 | MediumHard |
| 46-65 | Hard |
| 66-85 | VeryHard |
| 86-95 | Expert |
| 96+ | Master |

### Constraint Selection

| Level | Possible Constraints |
|-------|---------------------|
| 1-5 | None |
| 6-20 | ClearLines(2, 1) |
| 21-40 | ClearLines(2-3, 1-2) |
| 41-60 | ClearLines(3-4, 2-3) or NoBonusUsed |
| 61-80 | ClearLines(4, 3-4) |
| 81+ | ClearLines(4-5, 4-6) |

---

## Updated Game Model

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    
    // Grid state (unchanged)
    pub blocks: felt252,      // 240 bits - the grid
    pub next_row: u32,        // 24 bits - queued row
    
    // Per-level transient (reset each level)
    pub combo_counter: u8,    // Current combo streak
    pub max_combo: u8,        // Best combo this level
    
    // Level system (NEW)
    pub run_data: felt252,    // Bit-packed level/run progress
    
    // Timestamps
    pub started_at: u64,      // Run start timestamp
    
    // Game state
    pub over: bool,
}
```

---

## File Structure

### New Contract Files

```
contracts/src/
├── types/
│   ├── constraint.cairo     # ConstraintType, LevelConstraint
│   ├── level.cairo          # LevelConfig
│   └── mode.cairo           # GameMode enum (for future Daily)
├── models/
│   └── player.cairo         # PlayerMeta model
├── helpers/
│   ├── level.cairo          # Level generation functions
│   └── packing.cairo        # run_data & meta_data pack/unpack
└── tests/
    ├── test_packing.cairo   # Packing unit tests
    └── test_level.cairo     # Level generator tests
```

### Modified Contract Files

```
contracts/src/
├── constants.cairo          # Namespace v1_2_0
├── models/game.cairo        # Updated Game struct
├── systems/game.cairo       # Level-aware logic
├── events.cairo             # LevelStarted, LevelCompleted
└── lib.cairo                # Export new modules
```

---

## Task Checklist

### Phase 1: Contract Foundation - COMPLETE

- [x] C1: Create `types/constraint.cairo`
- [x] C2: Create `types/level.cairo`
- [x] C3: Create `helpers/packing.cairo` (run_data)
- [x] C4: Add meta_data packing to `helpers/packing.cairo`
- [x] C5: Create `helpers/level.cairo` (generator)
- [ ] C6: Create `tests/test_packing.cairo` (unit tests in files, mock issues blocking test runner)
- [ ] C7: Create `tests/test_level.cairo` (unit tests in files, mock issues blocking test runner)

### Phase 2: Contract Integration - COMPLETE

- [x] C8: Update namespace to v1_2_0
- [x] C9: Update Game model with run_data
- [x] C10: Create PlayerMeta model
- [x] C11: Add LevelStarted/LevelCompleted events
- [x] C12: Update `create()` for level system
- [x] C13: Update `move()` with constraint tracking
- [x] C14: Add level completion logic
- [x] C15: Update game over + best_level tracking
- [x] C16: Update lib.cairo exports

### Phase 3: Client Foundation

- [ ] F1: Create `types/constraint.ts`
- [ ] F2: Create `types/level.ts`
- [ ] F3: Create `types/player.ts` (PlayerMeta)
- [ ] F4: Create `helpers/levelGenerator.ts`
- [ ] F5: Create `helpers/packing.ts`
- [ ] F6: Update Game model class
- [ ] F7: Update namespace in setup

### Phase 4: Client Hooks & Store

- [ ] F8: Create `useLevelConfig` hook
- [ ] F9: Create `useLevelProgress` hook
- [ ] F10: Create/extend level store

### Phase 5: Client UI

- [ ] F11: Create LevelHeader component
- [ ] F12: Create LevelProgress component
- [ ] F13: Create StarPreview component
- [ ] F14: Create ConstraintTracker component
- [ ] F15: Create BonusInventory component
- [ ] F16: Create LevelCompleteModal
- [ ] F17: Integrate into Play screen
- [ ] F18: Level transition animations

---

## What's IN vs OUT (Phase 0.5)

| IN (MVP) | OUT (Later Phases) |
|----------|-------------------|
| Level generator (seed-based) | Daily Challenge mode |
| Endless mode | Leaderboard UI |
| Constraints (ClearLines, NoBonusUsed) | Meta-progression unlocks |
| Star system (3★/2★/1★ → bonuses) | Starting level selection |
| Bonus inventory persistence | Starting loadouts |
| Level 100+ survival mode | Revival system |
| PlayerMeta model (structure only) | Milestone choices |
| best_level tracking | Cosmetics |

---

## Sample Level Configs

| Level | Points | Max Moves | 3★ | 2★ | Difficulty | Constraint |
|-------|--------|-----------|----|----|------------|------------|
| 1 | 20±5 | 30±5 | 12 | 21 | Easy | None |
| 10 | 36±5 | 36±5 | 14 | 25 | Easy | ClearLines(2,1) |
| 25 | 64±8 | 47±5 | 19 | 33 | Medium | ClearLines(2,1) |
| 50 | 109±12 | 65±7 | 26 | 45 | Hard | ClearLines(3,2) |
| 75 | 155±15 | 82±8 | 33 | 57 | VeryHard | ClearLines(4,3) |
| 100 | 200±15 | 100±10 | 40 | 70 | Master | ClearLines(5,5) |
| 150 | 200±15 | 100±10 | 40 | 70 | Master | ClearLines(5,5) |

Note: Values vary based on seed (±variance shown)
