# zKube Dispatcher Architecture

This document outlines the optimized contract architecture for zKube, inspired by dark-shuffle's dispatcher pattern.

## Goals

1. **Keep contracts under 81,920 felts** (Starknet limit)
2. **Minimize code duplication** across systems
3. **Clean separation of concerns**
4. **Maintainable and testable code**

---

## Current State Analysis

### Contract Sizes (after initial optimization)

| Contract | Size (felts) | Status |
|----------|-------------|--------|
| bonus_system | 43,245 | OK |
| move_system | 33,235 | OK |
| game_system | 29,099 | OK |
| level_system | 24,368 | OK |
| shop_system | 17,746 | OK |

### Current Issues

1. **Game model is a monolith** - imports Controller (2000 lines), LevelGeneratorTrait (949 lines)
2. **Duplicated logic** - level completion check in multiple places
3. **Tight coupling** - systems import helpers that import other heavy helpers

---

## Proposed Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS (Thin)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  game    │  │  move    │  │  bonus   │  │  shop    │           │
│  │ _system  │  │ _system  │  │ _system  │  │ _system  │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │             │             │             │                  │
│       └─────────────┴──────┬──────┴─────────────┘                  │
│                            │ (dispatchers)                         │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                   SPECIALIZED SYSTEMS                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │  level   │  │   grid   │  │  quest   │  │  cube    │    │  │
│  │  │ _system  │  │ _system  │  │ _system  │  │ _token   │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            ▼ (pure functions)                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                      UTILS (Pure Logic)                      │  │
│  │  scoring │ packing │ constraint │ random │ config           │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## System Responsibilities

### 1. Entry Point Systems (Thin Layer)

These are called by users/frontend. They validate, coordinate, and delegate.

#### `game_system` - Game Lifecycle
```
Responsibilities:
- create() - Start a new game
- surrender() - End game early
- get_game_data() - Read game state

Calls via dispatcher:
- level_system.generate_initial_level()
- cube_token.burn() (for cubes brought)

Does NOT import:
- Controller
- LevelGeneratorTrait
- Bonus implementations
```

#### `move_system` - Player Moves
```
Responsibilities:
- move() - Execute a block swipe
- Validate move is legal
- Track quest progress

Calls via dispatcher:
- grid_system.execute_move()
- grid_system.assess_and_gravity()
- level_system.check_and_complete()
- quest_system.progress()

Does NOT import:
- Controller (use grid_system dispatcher)
- LevelGeneratorTrait (use level_system dispatcher)
```

#### `bonus_system` - Bonus Application
```
Responsibilities:
- apply_bonus() - Use a bonus from inventory
- Validate bonus available
- Check NoBonusUsed constraint

Calls via dispatcher:
- grid_system.apply_bonus_effect()
- grid_system.assess_and_gravity()
- level_system.check_and_complete()

Does NOT import:
- Controller
- Bonus implementations (use grid_system)
- LevelGeneratorTrait
```

#### `shop_system` - Meta Progression
```
Responsibilities:
- upgrade_starting_bonus()
- upgrade_bag_size()
- purchase_consumable() (in-game shop)

Calls via dispatcher:
- cube_token.burn()

Does NOT import:
- Controller
- LevelGeneratorTrait
```

---

### 2. Specialized Systems (Heavy Lifting)

These contain the heavy logic and are called via dispatcher.

#### `level_system` - Level Management
```
Responsibilities:
- generate_level() - Create level config from seed
- check_completion() - Is level complete?
- complete_level() - Advance to next level, award bonuses
- handle_victory() - Level 50 completion

Imports (heavy):
- LevelGeneratorTrait (949 lines)

Interface:
trait ILevelSystem {
    fn generate_initial_level(ref self, game_id: u64);
    fn is_complete(self, game_id: u64) -> bool;
    fn complete_level(ref self, game_id: u64) -> (u8, u8, bool);
    fn get_level_config(self, game_id: u64) -> LevelConfig;
}
```

#### `grid_system` - Grid Operations
```
Responsibilities:
- execute_move() - Swipe a block
- apply_bonus_effect() - Apply any bonus to grid
- assess_and_gravity() - Clear lines, apply gravity
- create_line() - Generate new row
- insert_line() - Add row to grid

Imports (heavy):
- Controller (2000 lines)
- All bonus implementations

Interface:
trait IGridSystem {
    fn execute_move(ref self, game_id: u64, row: u8, start: u8, end: u8);
    fn apply_bonus(ref self, game_id: u64, bonus: Bonus, row: u8, col: u8);
    fn assess_game(ref self, game_id: u64) -> u8;  // returns lines_cleared
    fn insert_line_if_empty(ref self, game_id: u64);
    fn is_grid_full(self, game_id: u64) -> bool;
}
```

#### `quest_system` - Quest Tracking
```
Responsibilities:
- progress() - Track task progress
- claim() - Claim quest rewards

Imports:
- Quest component (Cartridge arcade)
```

#### `cube_token` - Currency
```
Responsibilities:
- mint() - Create cubes (on victory)
- burn() - Spend cubes

Imports:
- ERC1155 component
```

---

### 3. Utils (Pure Functions)

No storage, no dispatchers - just calculations.

#### `scoring` - Score Calculations
```
- process_lines_cleared()
- update_score()
- calculate_cubes()
- saturating_add_*()
```

#### `packing` - Bit Packing
```
- RunData pack/unpack
- MetaData pack/unpack
```

#### `constraint` - Constraint Logic
```
- is_satisfied()
- update_progress()
```

#### `config` - Settings Utils
```
- get_game_settings()
- get_block_weights()
```

#### `random` - Randomness
```
- new_vrf() / new_pseudo_random()
- get_random_bonus_type()
```

---

## Gameplay Flow

### 1. Create Game

```
User calls: game_system.create(game_id, bonuses, cubes)

game_system:
  1. Validate token ownership
  2. pre_action(token_address, game_id)
  3. Generate seed (VRF or pseudo)
  4. Create Game model (empty grid)
  5. Call level_system.generate_initial_level(game_id) [DISPATCHER]
  6. If cubes > 0: cube_token.burn(player, cubes) [DISPATCHER]
  7. Write Game, GameSeed models
  8. Emit StartGame event
  9. post_action(token_address, game_id)
```

### 2. Make Move

```
User calls: move_system.move(game_id, row, start, end)

move_system:
  1. Validate token ownership, game not over
  2. pre_action(token_address, game_id)
  3. Call grid_system.execute_move(game_id, row, start, end) [DISPATCHER]
     - Returns: lines_cleared, is_grid_full
  4. Update run_data (moves, score, combos)
  5. Track quest progress [DISPATCHER]
  6. Call level_system.check_and_complete(game_id) [DISPATCHER]
     - If complete: advances level, returns cubes/bonuses
     - If failed: marks game over
  7. Write Game model
  8. post_action(token_address, game_id)
```

### 3. Apply Bonus

```
User calls: bonus_system.apply_bonus(game_id, bonus, row, col)

bonus_system:
  1. Validate token ownership, game not over
  2. Validate bonus available, no NoBonusUsed constraint
  3. pre_action(token_address, game_id)
  4. Call grid_system.apply_bonus(game_id, bonus, row, col) [DISPATCHER]
     - Returns: lines_cleared
  5. Update run_data (bonus count, constraint progress)
  6. Call level_system.check_and_complete(game_id) [DISPATCHER]
  7. If grid empty: grid_system.insert_line_if_empty(game_id) [DISPATCHER]
  8. Write Game model
  9. Emit UseBonus event
  10. post_action(token_address, game_id)
```

### 4. Level Completion (inside level_system)

```
level_system.complete_level(game_id):
  1. Read Game, GameLevel, GameSeed
  2. Calculate cubes earned (3/2/1 based on moves)
  3. Calculate bonuses to award (2/1/0 based on cubes)
  4. Award random bonuses to run_data
  5. If level == 50: 
     - Mark victory, mint cubes [DISPATCHER]
     - Return (cubes, bonuses, true)
  6. Else:
     - Generate next level config (LevelGeneratorTrait)
     - Write GameLevel model
     - Emit LevelCompleted, LevelStarted events
     - Return (cubes, bonuses, false)
```

---

## Dispatcher Implementation

### Interface Definition

```cairo
// In systems/grid.cairo
#[starknet::interface]
pub trait IGridSystem<T> {
    fn execute_move(ref self: T, game_id: u64, row: u8, start: u8, end: u8) -> (u8, bool);
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row: u8, col: u8) -> u8;
    fn insert_line_if_empty(ref self: T, game_id: u64);
}
```

### Dispatcher Helper

```cairo
// In helpers/dispatchers.cairo
pub fn get_grid_system_dispatcher(world: WorldStorage) -> IGridSystemDispatcher {
    let address = world.dns_address(@"grid_system")
        .expect('GridSystem not found');
    IGridSystemDispatcher { contract_address: address }
}
```

### Usage in Entry System

```cairo
// In move_system
fn move(ref self: ContractState, game_id: u64, row: u8, start: u8, end: u8) {
    let mut world = self.world(@DEFAULT_NS());
    
    // ... validation ...
    
    // Call grid_system via dispatcher (no Controller import!)
    let grid = dispatchers::get_grid_system_dispatcher(world);
    let (lines_cleared, is_full) = grid.execute_move(game_id, row, start, end);
    
    // ... rest of logic ...
}
```

---

## Expected Contract Sizes

After full refactor:

| Contract | Current | Target | Heavy Imports |
|----------|---------|--------|---------------|
| game_system | 29,099 | ~20,000 | None |
| move_system | 33,235 | ~15,000 | None |
| bonus_system | 43,245 | ~15,000 | None |
| shop_system | 17,746 | ~15,000 | None |
| **grid_system** | N/A | ~40,000 | Controller, Bonuses |
| **level_system** | 24,368 | ~30,000 | LevelGeneratorTrait |
| quest_system | 11,462 | ~12,000 | Quest component |
| cube_token | 8,285 | ~8,000 | ERC1155 |

---

## Migration Plan

### Phase 1: Create grid_system (Current PR)
- [x] Create level_system with dispatcher
- [x] Update bonus_system to use level_system dispatcher
- [x] Update move_system to use level_system dispatcher
- [ ] Create grid_system with Controller logic
- [ ] Update bonus_system to use grid_system dispatcher
- [ ] Update move_system to use grid_system dispatcher

### Phase 2: Slim down Game model
- [ ] Remove Controller import from Game model
- [ ] Remove LevelGeneratorTrait import from Game model
- [ ] Move `insert_new_line` to grid_system
- [ ] Move `assess_game` to grid_system
- [ ] Keep only: struct, getters/setters, run_data packing

### Phase 3: Optimize entry systems
- [ ] game_system uses only dispatchers for heavy ops
- [ ] move_system uses only dispatchers
- [ ] bonus_system uses only dispatchers

### Phase 4: Testing & Validation
- [ ] Integration tests with dispatcher calls
- [ ] Gas usage benchmarks
- [ ] Contract size verification

---

## Benefits

1. **Predictable sizes** - Heavy code isolated in specialized systems
2. **No duplication** - Single source of truth for each operation
3. **Easy testing** - Utils are pure, systems have clear interfaces
4. **Maintainable** - Clear separation of concerns
5. **Extensible** - Add new bonuses without touching entry systems
