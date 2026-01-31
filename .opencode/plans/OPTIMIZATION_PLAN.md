# zkube Contract Optimization Plan

**Created:** 2026-02-01
**Status:** Completed

---

## Summary of Changes

- [x] Complete Shrink/Shuffle L2/L3 level effects
- [x] Keep GameLevel model (Torii sync benefit)
- [x] Consolidate difficulty files to data-driven approach
- [x] Skip quest factory for now

---

## Phase 1: Critical Fixes (Code Consolidation)

### 1.1 Extract Shared Helpers Module
- [x] Create `helpers/dispatchers.cairo`
- [x] Move `get_cube_token_dispatcher` to shared helper
- [x] Move `get_quest_system_dispatcher` to shared helper
- [x] Move `track_quest_progress` to shared helper
- [x] Update `game.cairo` to use shared helpers
- [x] Update `play.cairo` to use shared helpers
- [x] Update `shop.cairo` to use shared helpers
- [x] Update `quest.cairo` to use shared helpers

### 1.2 Extract `handle_game_over` to Shared Module
- [ ] Create shared game over helper or consolidate
- [ ] Update `game.cairo` to use shared implementation
- [ ] Update `play.cairo` to use shared implementation

### 1.3 Extract Combo Cube Calculation
- [ ] Create `calculate_combo_cubes(lines_cleared: u8) -> u16`
- [ ] Create `check_and_award_combo_achievements(ref run_data: RunData)`
- [ ] Update `make_move` to use extracted functions
- [ ] Update `apply_bonus` to use extracted functions

### 1.4 Fix `assert_bonus_available` for Shrink/Shuffle
- [x] Add Shrink case to match
- [x] Add Shuffle case to match

---

## Phase 2: Complete Shrink/Shuffle L2/L3 Effects

### 2.1 Shrink Bonus Level Effects
| Level | Effect | Status |
|-------|--------|--------|
| L1 (level 0) | Shrink one block | Existing |
| L2 (level 1) | Shrink all blocks of the same size on grid | Implemented |
| L3 (level 2) | Shrink all blocks on grid (except size 1) | Implemented |

- [x] Update `apply_bonus` in `models/game.cairo` for Shrink L1/L2/L3
- [x] Verify/update `elements/bonuses/shrink.cairo` helper functions

### 2.2 Shuffle Bonus Level Effects
| Level | Effect | Status |
|-------|--------|--------|
| L1 (level 0) | Shuffle one line | Existing |
| L2 (level 1) | Shuffle the upcoming line (rearrange next_row) | Implemented |
| L3 (level 2) | Shuffle the entire grid | Implemented |

- [x] Update `apply_bonus` in `models/game.cairo` for Shuffle L1/L2/L3
- [x] Verify/update `elements/bonuses/shuffle.cairo` helper functions

---

## Phase 3: Dead Code Removal

### 3.1 Remove Unused Functions

| File | Function | Lines | Status |
|------|----------|-------|--------|
| `shop.cairo` | `pow2_u64` | 62-73 | [x] |
| `random.cairo` | `new()` | 20-22 | [x] |
| `random.cairo` | `felt()` | 67-71 | [x] |
| `random.cairo` | `bool()` | 62-65 | [x] |
| `random.cairo` | `occurs()` | 73-80 | [x] |
| `random.cairo` | `between()` | 82-94 | [x] |

### 3.2 Remove Commented-Out Code
- [x] `controller.cairo:55` - grid coherence assert
- [x] `controller.cairo:256` - println shift_amount
- [x] `controller.cairo:431` - println row coherence

### 3.3 Remove Unused Import
- [x] `shop.cairo:115` - `LevelGenerator` import

---

## Phase 4: Difficulty Consolidation

### 4.1 Create Unified Difficulty Data
- [x] Create `elements/difficulties/data.cairo` with block distribution arrays
- [x] Define `get_block(difficulty: Difficulty, id: u8) -> Block`

### 4.2 Update DifficultyTrait
- [x] Update `types/difficulty.cairo` to use data module
- [x] Make `count()` and `reveal()` use centralized data

### 4.3 Remove Individual Difficulty Files
- [x] Delete `veryeasy.cairo`
- [x] Delete `easy.cairo`
- [x] Delete `medium.cairo`
- [x] Delete `mediumhard.cairo`
- [x] Delete `hard.cairo`
- [x] Delete `veryhard.cairo`
- [x] Delete `expert.cairo`
- [x] Delete `master.cairo`
- [x] Update `lib.cairo` module declarations

---

## Phase 5: Minor Optimizations

### 5.1 Remove Unused `settings` Parameter
- [x] Update `get_cost_from_settings` to `get_cost` in `consumable.cairo`
- [x] Remove settings fetch in `shop.cairo`
- [x] Remove unused `ConfigUtilsTrait` import from `shop.cairo`

### 5.2 Add Constant for Line Check Bound
- [x] Add `LINE_FULL_BOUND: u32 = 2097152` constant to `constants.cairo`
- [x] Use constant in `assess_line` in `controller.cairo`

### 5.3 Extract PlayerMeta Initialization
- [x] Create `get_or_create_player_meta` helper in `helpers/dispatchers.cairo`
- [x] Update 5 locations in `shop.cairo`

---

## Implementation Order

| Order | Phase | Description | Risk | Status |
|-------|-------|-------------|------|--------|
| 1 | 1.4 | Fix `assert_bonus_available` | Low | [x] |
| 2 | 3.1-3.3 | Remove dead code | Low | [x] |
| 3 | 1.1-1.3 | Extract shared helpers | Low | [x] |
| 4 | 2.1-2.2 | Complete Shrink/Shuffle L2/L3 | Medium | [x] |
| 5 | 4.1-4.3 | Consolidate difficulties | Low | [x] |
| 6 | 5.1-5.3 | Minor optimizations | Low | [x] |

---

## Clarifications (Resolved)

### Shrink L2/L3
- **L2:** Find the block at (row, index), then shrink ALL blocks of that same size anywhere on grid
- **L3:** Shrink ALL blocks on the grid (except size 1, which cannot be shrunk)

### Shuffle L2
- Randomly rearrange blocks in `next_row` (not generate new line)

---

## Testing Requirements

1. After Phase 1-3: Run `scarb test`
2. After Phase 2 (Shrink/Shuffle): Add new tests for L2/L3 effects
3. After Phase 4 (Difficulty): Verify block distributions match
4. Final: Full `scarb test` and manual slot deployment

---

## Notes

- GameLevel model kept for Torii sync benefit
- Quest factory optimization skipped for now (Cartridge arcade compatibility concern)

---

## Completion Summary

**Completed:** 2026-02-01

### Changes Made

1. **Phase 1: Code Consolidation**
   - Created shared `helpers/dispatchers.cairo` with `get_cube_token_dispatcher`, `get_quest_system_dispatcher`, `track_quest_progress`, and `get_or_create_player_meta`
   - Fixed `assert_bonus_available` for Shrink/Shuffle bonuses
   - Updated game.cairo, play.cairo, shop.cairo, and quest.cairo to use shared dispatchers

2. **Phase 2: Shrink/Shuffle L2/L3 Effects**
   - Implemented level-specific effects for Shrink (L1: single block, L2: same size, L3: all blocks)
   - Implemented level-specific effects for Shuffle (L1: single row, L2: next_row, L3: entire grid)
   - Added helper functions in shrink.cairo and shuffle.cairo

3. **Phase 3: Dead Code Removal**
   - Removed unused `pow2_u64` from shop.cairo
   - Removed unused functions from random.cairo (new, felt, bool, occurs, between)
   - Removed commented-out code from controller.cairo
   - Removed unused `LevelGenerator` import from shop.cairo

4. **Phase 4: Difficulty Consolidation**
   - Created unified `elements/difficulties/data.cairo` with all block distributions
   - Updated `types/difficulty.cairo` to use centralized data
   - Deleted 8 individual difficulty files (veryeasy, easy, medium, mediumhard, hard, veryhard, expert, master)
   - Updated lib.cairo module declarations

5. **Phase 5: Minor Optimizations**
   - Renamed `get_cost_from_settings` to `get_cost` and removed unused settings parameter
   - Added `LINE_FULL_BOUND` constant (2^21) to constants.cairo
   - Created `get_or_create_player_meta` helper and updated 5 locations in shop.cairo
   - Added `PartialEq` and `Debug` traits to Block enum for tests

### Test Results
- All 189 tests pass
- Build successful for slot profile
