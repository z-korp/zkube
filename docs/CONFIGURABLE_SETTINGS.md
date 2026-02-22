# Configurable GameSettings Implementation

> **Status:** Implemented  
> **Created:** January 2026  
> **Completed:** January 2026  
> **Pattern:** Based on Death Mountain's GameSettings architecture

## Overview

This document describes the implementation of extended, configurable GameSettings for zKube. Following the Death Mountain pattern, all game balance parameters will be stored in the `GameSettings` model, allowing custom game modes, tournaments, and balance experiments without code changes.

## Goals

1. **Tournament Support** - Custom difficulty curves, different cube rewards
2. **Challenge Modes** - Stricter move limits, harder thresholds
3. **Balance Testing** - A/B test different configurations easily
4. **Community Modes** - Allow creation of custom game variants

## Current State

### Existing GameSettings (`models/config.cairo`)
```cairo
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub difficulty: u8,  // Only stores difficulty mode
}
```

### Hardcoded Parameters

| Category | Location | Constants |
|----------|----------|-----------|
| Level Scaling | `helpers/level.cairo` | BASE_MOVES=20, MAX_MOVES=60, BASE_RATIO=80, MAX_RATIO=180 |
| Cube Thresholds | `helpers/level.cairo` | CUBE_3_PERCENT=40, CUBE_2_PERCENT=70 |
| Consumable Costs | `types/consumable.cairo` | BONUS_CHARGE_BASE=5 (scaling), LEVEL_UP=50, SWAP_BONUS=50 |
| Variance | `helpers/level.cairo` | EARLY=5%, MID=5%, LATE=5% |

## Design

### Extended GameSettings Model

```cairo
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    
    // === Difficulty ===
    pub difficulty: u8,                 // Difficulty mode (enum value)
    
    // === Level Scaling ===
    pub base_moves: u16,                // Moves at level 1 (default: 20)
    pub max_moves: u16,                 // Moves at level cap (default: 60)
    pub base_ratio_x100: u16,           // Points/move ratio at level 1 × 100 (default: 80 = 0.80)
    pub max_ratio_x100: u16,            // Points/move ratio at level cap × 100 (default: 180 = 1.80)
    
    // === Cube Thresholds ===
    pub cube_3_percent: u8,             // 3 cubes if moves <= X% of max (default: 40)
    pub cube_2_percent: u8,             // 2 cubes if moves <= X% of max (default: 70)
    
    // === Consumable Costs ===
    pub combo_cost: u8,                 // Cost in cubes (default: 5)
    pub score_cost: u8,                 // Cost in cubes (default: 5)
    pub harvest_cost: u8,               // Cost in cubes (default: 5)
    pub extra_moves_cost: u8,           // Cost in cubes (default: 10)
    
    // === Reward Multiplier ===
    pub cube_multiplier_x100: u16,      // Cube reward multiplier × 100 (default: 100 = 1.0x)
}
```

### Bit Budget Analysis

Total bits needed for new fields:
- `difficulty`: 8 bits (existing)
- `base_moves`: 16 bits
- `max_moves`: 16 bits
- `base_ratio_x100`: 16 bits
- `max_ratio_x100`: 16 bits
- `cube_3_percent`: 8 bits
- `cube_2_percent`: 8 bits
- `combo_cost`: 8 bits
- `score_cost`: 8 bits
- `harvest_cost`: 8 bits
- `extra_moves_cost`: 8 bits
- `cube_multiplier_x100`: 16 bits

**Total: 136 bits** (well within felt252's 252-bit limit)

### Default Settings

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `difficulty` | 1 (Increasing) | Progressive difficulty |
| `base_moves` | 20 | Starting moves at level 1 |
| `max_moves` | 60 | Max moves at level cap (50) |
| `base_ratio_x100` | 80 | 0.80 points/move at level 1 |
| `max_ratio_x100` | 180 | 1.80 points/move at level cap (50) |
| `cube_3_percent` | 40 | 3 cubes if <= 40% moves used |
| `cube_2_percent` | 70 | 2 cubes if <= 70% moves used |
| `combo_cost` | 5 | BonusCharge base cost (scales with purchases) |
| `score_cost` | 5 | Score consumable cost |
| `harvest_cost` | 5 | Harvest consumable cost |
| `extra_moves_cost` | 10 | Extra moves consumable cost |
| `cube_multiplier_x100` | 100 | 1.0x cube rewards |

## Implementation Plan

### Phase 1: Contract Changes

#### 1.1 Update `models/config.cairo`
- Extend `GameSettings` struct with new fields
- Add `GameSettingsTrait` with helper methods
- Add default values constant

#### 1.2 Update `systems/config.cairo`
- Update `add_game_settings()` to accept new parameters
- Update `dojo_init()` to create default settings with all fields
- Add validation for new parameters
- Update `generate_settings_array()` for UI display

#### 1.3 Update `helpers/level.cairo`
- Change `LevelGeneratorTrait::generate()` to accept `GameSettings`
- Replace hardcoded constants with settings values
- Update all callers to pass settings

#### 1.4 Update `types/consumable.cairo`
- Change `ConsumableTrait::get_cost()` to accept settings or cost value
- Or create new method that takes settings

#### 1.5 Update `systems/game.cairo`
- Load settings in `create()`, `move()`, `apply_bonus()`, `purchase_consumable()`
- Pass settings to `LevelGenerator`
- Use settings for consumable costs
- Apply `cube_multiplier_x100` to cube rewards

#### 1.6 Update `models/game.cairo`
- Update `GameTrait` methods to accept settings where needed
- `complete_level()` should use cube multiplier

### Phase 2: Client Changes

#### 2.1 Update TypeScript types
- Add new fields to GameSettings type
- Update SDK bindings if needed

#### 2.2 Update Settings Display
- Show new parameters in settings details
- Format multipliers and percentages correctly

### Phase 3: Testing

- Unit tests for new settings validation
- Integration tests for settings affecting gameplay
- Test default settings produce same behavior as current hardcoded values

## Example Game Modes

### Tournament Mode (Double Rewards)
```cairo
GameSettings {
    cube_multiplier_x100: 200,  // 2x cubes
    cube_3_percent: 30,         // Harder 3-star threshold
    cube_2_percent: 60,         // Harder 2-star threshold
    ...
}
```

### Challenge Mode (Hard)
```cairo
GameSettings {
    base_moves: 15,             // Fewer starting moves
    max_moves: 45,              // Fewer max moves
    base_ratio_x100: 100,       // Higher points required per move
    max_ratio_x100: 300,
    ...
}
```

### Casual Mode (Easy)
```cairo
GameSettings {
    base_moves: 30,             // More moves
    max_moves: 80,
    cube_3_percent: 50,         // Easier thresholds
    cube_2_percent: 80,
    combo_cost: 3,              // Cheaper consumables
    score_cost: 3,
    harvest_cost: 3,
    ...
}
```

## Migration Notes

- Existing settings (IDs 0, 1, 2) will need to be updated with default values for new fields
- Games created before migration will use settings_id which now has extended fields
- No data migration needed if we update `dojo_init()` to populate defaults

## Files to Modify

| File | Changes |
|------|---------|
| `contracts/src/models/config.cairo` | Extend GameSettings struct |
| `contracts/src/systems/config.cairo` | Update add_game_settings, dojo_init, validation |
| `contracts/src/helpers/level.cairo` | Accept settings, use settings values |
| `contracts/src/helpers/config.cairo` | Update get_game_settings if needed |
| `contracts/src/types/consumable.cairo` | Use settings for costs |
| `contracts/src/systems/game.cairo` | Pass settings throughout, apply multiplier |
| `contracts/src/models/game.cairo` | Update methods to use settings |
| `contracts/src/constants.cairo` | Update default settings constants |
| `client-budokan/src/dojo/models.gen.ts` | Update TypeScript types |

## References

- [Death Mountain GameSettings](../references/death-mountain/contracts/src/models/game.cairo)
- [Death Mountain Settings System](../references/death-mountain/contracts/src/systems/settings/contracts.cairo)
 [Game Design Document](./GAME_DESIGN.md)

---

## Implementation Summary (January 2026)

### Completed Changes

| File | Status | Changes Made |
|------|--------|--------------|
| `models/config.cairo` | Done | Extended GameSettings with 21 total fields (10 new level settings), added `GameSettingsDefaults` module, added helper methods (`get_difficulty_for_level()`, `get_variance_percent()`, `are_constraints_enabled()`) |
| `systems/config.cairo` | Done | Added `add_custom_game_settings()` with all 21 parameters, updated `generate_settings_array()` to show all fields, added comprehensive validation |
| `helpers/level.cairo` | Done | Added `generate_with_settings()`, `generate_constraint_with_settings()`, uses all settings for level generation |
| `types/consumable.cairo` | Done | Added `get_cost_from_settings()` method |
| `systems/game.cairo` | Done | Loads settings via `ConfigUtilsTrait`, uses settings for level gen and consumable costs, applies cube multiplier |
| `models/game.cairo` | Done | Added `is_level_complete_with_settings()`, `is_level_failed_with_settings()`, `complete_level_with_settings()` |
| `constants.cairo` | Done | Updated default settings to use `new_with_defaults()` |

### New GameSettings Fields

```cairo
pub struct GameSettings {
    // Key
    pub settings_id: u32,
    
    // === Difficulty Mode ===
    pub difficulty: u8,            // Difficulty enum value
    
    // === Level Scaling ===
    pub base_moves: u16,           // 20 - Moves at level 1
    pub max_moves: u16,            // 60 - Moves at level cap
    pub base_ratio_x100: u16,      // 80 - Points/move ratio × 100 at level 1
    pub max_ratio_x100: u16,       // 180 - Points/move ratio × 100 at level cap
    
    // === Cube Thresholds ===
    pub cube_3_percent: u8,        // 40 - 3 cubes if moves <= X% of max
    pub cube_2_percent: u8,        // 70 - 2 cubes if moves <= X% of max
    
    // === Consumable Costs ===
    pub combo_cost: u8,            // 5
    pub score_cost: u8,            // 5
    pub harvest_cost: u8,          // 5
    pub extra_moves_cost: u8,      // 10
    
    // === Reward Multiplier ===
    pub cube_multiplier_x100: u16, // 100 - Cube reward multiplier × 100
    
    // === Difficulty Progression (NEW) ===
    pub starting_difficulty: u8,     // 0 (Easy) - Which difficulty to start with
    pub difficulty_step_levels: u8,  // 15 - Levels between difficulty increases
    
    // === Constraint Settings (NEW) ===
    pub constraints_enabled: u8,     // 1 - 0=disabled, 1=enabled
    pub constraint_start_level: u8,  // 3 - Level when constraints begin
    
    // === Variance Settings (NEW) ===
    pub early_variance_percent: u8,  // 5 - Random variance for early levels
    pub mid_variance_percent: u8,    // 5 - Random variance for mid levels
    pub late_variance_percent: u8,   // 5 - Random variance for late levels
    
    // === Level Tier Thresholds (NEW) ===
    pub early_level_threshold: u8,   // 10 - End of "early" levels
    pub mid_level_threshold: u8,     // 50 - End of "mid" levels
    
    // === Level Cap (NEW) ===
    pub level_cap: u8,               // 100 - Max level for scaling calculations
}
```

### API Changes

**New Interface Method:**
```cairo
fn add_custom_game_settings(
    ref self: T,
    name: felt252,
    description: ByteArray,
    difficulty: Difficulty,
    // Level Scaling
    base_moves: u16,
    max_moves: u16,
    base_ratio_x100: u16,
    max_ratio_x100: u16,
    // Cube Thresholds
    cube_3_percent: u8,
    cube_2_percent: u8,
    // Consumable Costs
    combo_cost: u8,
    score_cost: u8,
    harvest_cost: u8,
    extra_moves_cost: u8,
    // Reward Multiplier
    cube_multiplier_x100: u16,
    // Difficulty Progression (NEW)
    starting_difficulty: u8,
    difficulty_step_levels: u8,
    // Constraint Settings (NEW)
    constraints_enabled: u8,
    constraint_start_level: u8,
    // Variance Settings (NEW)
    early_variance_percent: u8,
    mid_variance_percent: u8,
    late_variance_percent: u8,
    // Level Tier Thresholds (NEW)
    early_level_threshold: u8,
    mid_level_threshold: u8,
    // Level Cap (NEW)
    level_cap: u8,
) -> u32;
```

### Backward Compatibility

- Existing `add_game_settings()` uses defaults for all new fields
- Existing `generate()` functions still work with hardcoded defaults
- New `_with_settings()` variants use custom settings
- Games using settings ID 0, 1, or 2 will use defaults

### Constraint Distribution System (NEW - January 2026)
The constraint system uses a **unified budget system** with type selection weights per difficulty tier. See `docs/CONSTRAINT_CONFIG.md` for the full configuration.

Key features:
 Budget scales from VeryEasy (1-3) to Master (32-40)
 Type selection via difficulty-weighted probabilities (ComboLines, BreakBlocks, FillAndClear, ComboStreak)
 Cost functions per type convert budget → constraint values with skew-high rolls
 Deterministic constraint count per tier (0 at VeryEasy → 3 at Master)
 Boss levels use boss identity for types and budget_max for values
 NoBonusUsed and KeepGridBelow are boss-only (binary, no budget)
```

**How Interpolation Works:**

The `get_constraint_params_for_difficulty()` method interpolates each parameter linearly:
- Easy (difficulty 0) → uses `easy_*` values
- Master (difficulty 7) → uses `master_*` values
- Intermediate difficulties get interpolated values

For example, at Hard (difficulty 3):
- `none_chance`: 30 → 0 at position 3/7 ≈ 17%
- `dual_chance`: 0 → 50 at position 3/7 ≈ 21%

**Example Custom Constraint Modes:**

```cairo
// No constraints mode
GameSettings {
    constraints_enabled: 0,  // Disable entirely
    // OR keep enabled but:
    easy_none_chance: 100,   // Always no constraint
    master_none_chance: 100,
    ...
}

// Hardcore constraints mode
GameSettings {
    easy_none_chance: 0,           // Always have constraint
    master_none_chance: 0,
    easy_no_bonus_chance: 20,      // Higher NoBonusUsed chance
    master_no_bonus_chance: 50,
    easy_min_lines: 3,             // Harder line requirements
    master_min_lines: 6,
    easy_dual_chance: 20,          // More dual constraints
    master_dual_chance: 80,
    ...
}
```

### Remaining Work

1. **Client TypeScript types** - Update `models.gen.ts` after deployment
2. **Test mocks** - Pre-existing issues in `tests/mocks/erc721.cairo` need fixing (unrelated)
3. **Unit tests** - New tests added for settings functions
