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
| Level Scaling | `helpers/level.cairo` | BASE_MOVES=20, MAX_MOVES=60, BASE_RATIO=80, MAX_RATIO=250 |
| Cube Thresholds | `helpers/level.cairo` | CUBE_3_PERCENT=40, CUBE_2_PERCENT=70 |
| Consumable Costs | `types/consumable.cairo` | HAMMER/WAVE/TOTEM=5, EXTRA_MOVES=10 |
| Variance | `helpers/level.cairo` | EARLY=5%, MID=10%, LATE=15% |

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
    pub max_moves: u16,                 // Moves at level 100 (default: 60)
    pub base_ratio_x100: u16,           // Points/move ratio at level 1 × 100 (default: 80 = 0.80)
    pub max_ratio_x100: u16,            // Points/move ratio at level 100 × 100 (default: 250 = 2.50)
    
    // === Cube Thresholds ===
    pub cube_3_percent: u8,             // 3 cubes if moves <= X% of max (default: 40)
    pub cube_2_percent: u8,             // 2 cubes if moves <= X% of max (default: 70)
    
    // === Consumable Costs ===
    pub hammer_cost: u8,                // Cost in cubes (default: 5)
    pub wave_cost: u8,                  // Cost in cubes (default: 5)
    pub totem_cost: u8,                 // Cost in cubes (default: 5)
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
- `hammer_cost`: 8 bits
- `wave_cost`: 8 bits
- `totem_cost`: 8 bits
- `extra_moves_cost`: 8 bits
- `cube_multiplier_x100`: 16 bits

**Total: 136 bits** (well within felt252's 252-bit limit)

### Default Settings

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `difficulty` | 1 (Increasing) | Progressive difficulty |
| `base_moves` | 20 | Starting moves at level 1 |
| `max_moves` | 60 | Max moves at level 100 |
| `base_ratio_x100` | 80 | 0.80 points/move at level 1 |
| `max_ratio_x100` | 250 | 2.50 points/move at level 100 |
| `cube_3_percent` | 40 | 3 cubes if <= 40% moves used |
| `cube_2_percent` | 70 | 2 cubes if <= 70% moves used |
| `hammer_cost` | 5 | Hammer consumable cost |
| `wave_cost` | 5 | Wave consumable cost |
| `totem_cost` | 5 | Totem consumable cost |
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
    hammer_cost: 3,             // Cheaper consumables
    wave_cost: 3,
    totem_cost: 3,
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
- [Current Game Config Reference](./GAME_CONFIG_REFERENCE.md)

---

## Implementation Summary (January 2026)

### Completed Changes

| File | Status | Changes Made |
|------|--------|--------------|
| `models/config.cairo` | Done | Extended GameSettings with 11 new fields, added `GameSettingsDefaults` module, added helper methods |
| `systems/config.cairo` | Done | Added `add_custom_game_settings()`, updated `generate_settings_array()` to show all fields, added validation |
| `helpers/level.cairo` | Done | Added `generate_with_settings()`, parameterized move/ratio calculations |
| `types/consumable.cairo` | Done | Added `get_cost_from_settings()` method |
| `systems/game.cairo` | Done | Loads settings via `ConfigUtilsTrait`, uses settings for level gen and consumable costs, applies cube multiplier |
| `models/game.cairo` | Done | Added `is_level_complete_with_settings()`, `is_level_failed_with_settings()`, `complete_level_with_settings()` |
| `constants.cairo` | Done | Updated default settings to use `new_with_defaults()` |

### New GameSettings Fields

```cairo
pub struct GameSettings {
    // Key
    pub settings_id: u32,
    
    // Existing
    pub difficulty: u8,
    
    // NEW: Level Scaling
    pub base_moves: u16,           // 20
    pub max_moves: u16,            // 60
    pub base_ratio_x100: u16,      // 80
    pub max_ratio_x100: u16,       // 250
    
    // NEW: Cube Thresholds
    pub cube_3_percent: u8,        // 40
    pub cube_2_percent: u8,        // 70
    
    // NEW: Consumable Costs
    pub hammer_cost: u8,           // 5
    pub wave_cost: u8,             // 5
    pub totem_cost: u8,            // 5
    pub extra_moves_cost: u8,      // 10
    
    // NEW: Reward Multiplier
    pub cube_multiplier_x100: u16, // 100
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
    base_moves: u16,
    max_moves: u16,
    base_ratio_x100: u16,
    max_ratio_x100: u16,
    cube_3_percent: u8,
    cube_2_percent: u8,
    hammer_cost: u8,
    wave_cost: u8,
    totem_cost: u8,
    extra_moves_cost: u8,
    cube_multiplier_x100: u16,
) -> u32;
```

### Backward Compatibility

- Existing `add_game_settings()` uses defaults for all new fields
- Existing `generate()` functions still work with hardcoded defaults
- New `_with_settings()` variants use custom settings
- Games using settings ID 0, 1, or 2 will use defaults

### Remaining Work

1. **Client TypeScript types** - Update `models.gen.ts` after deployment
2. **Test mocks** - Pre-existing issues in `tests/mocks/erc721.cairo` need fixing (unrelated)
3. **Unit tests** - New tests added for settings functions
