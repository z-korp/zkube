# Difficulty Rebalance v1.3

> **Status:** Complete (Contracts)  
> **Started:** January 2026  
> **Branch:** djizus-bump-version

## Overview

This document tracks the implementation of difficulty rebalancing, boss levels, and victory state for zKube v1.3.

---

## Phase 1: Fix Line Cost Bug

**Status:** Complete

### Problem
The `line_cost()` function had incorrect costs, making constraints impossible:
- 2 lines cost only 1 (should be 2)
- This led to "Clear 2 lines 8 times" at Easy difficulty

### Solution

**File:** `contracts/src/helpers/level.cairo`

| Lines | Old Cost | New Cost |
|-------|----------|----------|
| 0-1 | 1 | 1 |
| 2 | 1 | **2** |
| 3 | 2 | **4** |
| 4 | 4 | **6** |
| 5 | 7 | **10** |
| 6 | 11 | **15** |
| 7+ | 16-20 | **20** |

### Expected Constraint Outcomes

| Difficulty | Moves | Worst Case Constraint |
|------------|-------|----------------------|
| VeryEasy | 20 | Clear 2+ lines, 1 time |
| Easy | 22 | Clear 2+ lines, 4 times |
| Medium | 25 | Clear 2+ lines, 7 times |
| MediumHard | 30 | Clear 3+ lines, 4 times |
| Hard | 35 | Clear 3+ lines, 6 times |
| VeryHard | 42 | Clear 3+ lines, 7 times |
| Expert | 50 | Clear 4+ lines, 5 times |
| Master | 60 | Clear 4+ lines, 6 times |

---

## Phase 2: Update Combo Cube Rewards

**Status:** Complete

### Changes

**File:** `contracts/src/models/game.cairo` (both `make_move` and `apply_bonus` functions)

| Lines Cleared | Old Reward | New Reward |
|---------------|------------|------------|
| 4 | +1 | +1 |
| 5 | +2 | **+3** |
| 6 | +3 | **+5** |
| 7 | (none) | **+10** |
| 8 | (none) | **+25** |
| 9+ | (none) | **+50** |

---

## Phase 3: Boss Level System

**Status:** Complete

### Design

Boss levels occur at L10, L20, L30, L40, L50 with:
- **Always dual constraints** (fixed, not RNG-based)
- **Bonus cubes** on completion (replaces old milestone rewards)
- **Difficulty** follows normal scaling (not forced to Master)

### Implementation

**File:** `contracts/src/helpers/level.cairo`

Added `BossLevel` module with:
- `is_boss_level(level: u8) -> bool` - checks if L10/20/30/40/50
- `get_boss_tier(level: u8) -> u8` - returns 1-5 for boss tiers
- `get_boss_cube_bonus(level: u8) -> u8` - returns 10/20/30/40/50
- `generate_boss_constraints(level: u8) -> (LevelConstraint, LevelConstraint)` - returns fixed dual constraints

### Boss Constraints

| Boss | Level | Difficulty | Constraint 1 | Constraint 2 |
|------|-------|------------|--------------|--------------|
| I | 10 | Medium | Clear 2+ lines, 3 times | Clear 3+ lines, 1 time |
| II | 20 | Hard | Clear 3+ lines, 2 times | NoBonusUsed |
| III | 30 | VeryHard | Clear 3+ lines, 3 times | Clear 4+ lines, 1 time |
| IV | 40 | Expert | Clear 4+ lines, 2 times | NoBonusUsed |
| V | 50 | Master | Clear 4+ lines, 3 times | NoBonusUsed |

### Boss Cube Bonuses

| Level | Bonus Cubes | On Top Of |
|-------|-------------|-----------|
| 10 | +10 | 3/2/1 star cubes |
| 20 | +20 | 3/2/1 star cubes |
| 30 | +30 | 3/2/1 star cubes |
| 40 | +40 | 3/2/1 star cubes |
| 50 | +50 | 3/2/1 star cubes |

---

## Phase 4: Victory State

**Status:** Complete (Contracts)

### Design

When player clears level 50:
- Run ends immediately with **Victory** state (distinct from Game Over)
- All earned cubes minted to player
- `RunCompleted` event emitted
- Victory screen with distinct copy/visuals (client pending)

### Contract Changes

**File:** `contracts/src/helpers/packing.cairo`
- Added `run_completed: bool` field to `RunData` struct (bit 147)
- Updated `pack()`, `unpack()`, and `new()` functions
- Fixed all 3 test functions with new field

**File:** `contracts/src/events.cairo`
- Added `RunCompleted` event with `game_id`, `player`, `level`, `total_cubes`

**File:** `contracts/src/models/game.cairo`
- Updated `complete_level()` to return `(u8, u8, bool)` - added `is_victory` return value
- When level 50 is completed, sets `run_completed = true` and returns early

**File:** `contracts/src/systems/game.cairo`
- Added `RunCompleted` event import
- Updated `check_and_complete_level()` to handle victory:
  - Emits `RunCompleted` event
  - Mints final cubes to player
  - Sets `game.over = true`

### run_data Bit Layout (Updated)

```
Bits 0-7:     current_level (u8)
Bits 8-15:    level_score (u8)
Bits 16-23:   level_moves (u8)
Bits 24-31:   constraint_progress (u8)
Bits 32-39:   constraint_2_progress (u8)
Bit 40:       bonus_used_this_level (bool)
Bit 41:       combo_5_achieved (bool)
Bit 42:       combo_10_achieved (bool)
Bits 43-50:   hammer_count (u8)
Bits 51-58:   wave_count (u8)
Bits 59-66:   totem_count (u8)
Bits 67-74:   max_combo_run (u8)
Bits 75-82:   extra_moves (u8)
Bits 83-98:   cubes_brought (u16)
Bits 99-114:  cubes_spent (u16)
Bits 115-130: total_cubes (u16)
Bits 131-146: total_score (u16)
Bit 147:      run_completed (bool)  <-- NEW
```

---

## Phase 5: Client Updates

**Status:** Pending

### Required Changes

**File:** `client-budokan/src/ui/components/VictoryDialog.tsx` (new)
- Celebration visuals
- "RUN COMPLETE!" messaging
- Show total cubes earned

**File:** `client-budokan/src/ui/screens/Play.tsx`
- Check for `run_completed` flag from `run_data` and show VictoryDialog

---

## Progress Log

| Date | Phase | Status | Notes |
|------|-------|--------|-------|
| 2026-01-30 | Planning | Complete | Design finalized |
| 2026-01-30 | Phase 1 | Complete | Fixed line_cost() |
| 2026-01-30 | Phase 2 | Complete | Updated combo cube rewards |
| 2026-01-30 | Phase 3 | Complete | Implemented boss level system |
| 2026-01-30 | Phase 4 | Complete | Implemented victory state (contracts) |
| 2026-01-31 | Testing | Complete | All 173 tests passing |

---

## Testing Checklist

- [x] Line cost fix doesn't break existing tests
- [x] Combo cube rewards scale correctly (implemented in both make_move and apply_bonus)
- [x] Boss levels generate correct constraints
- [x] Boss cube bonuses awarded correctly
- [x] Victory state triggers at level 50
- [x] RunCompleted event emitted
- [x] run_completed tracked in RunData
- [x] All 173 tests pass
- [ ] Client shows VictoryDialog correctly (Phase 5)

---

## Files Modified

| File | Changes |
|------|---------|
| `contracts/src/helpers/level.cairo` | Fixed `line_cost()`, added `BossLevel` module |
| `contracts/src/helpers/packing.cairo` | Added `run_completed` field to RunData |
| `contracts/src/models/game.cairo` | Updated combo rewards, `complete_level()` returns victory flag |
| `contracts/src/systems/game.cairo` | Victory handling with `RunCompleted` event |
| `contracts/src/events.cairo` | Added `RunCompleted` event |
| `docs/DIFFICULTY_REBALANCE_V1_3.md` | This tracking document |
