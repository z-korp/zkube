# Contract Patterns Analysis: zkube vs nums vs death-mountain

## Executive Summary

This document provides a deep analysis of contract architecture patterns used in three Dojo-based games and proposes optimizations for zkube.

**Key Finding:** All three projects have substantial logic in their models, but the critical difference is **what** they import. zkube's main issue is that the `Game` model imports heavy external modules (`Controller`, `LevelGeneratorTrait`) that bloat every contract using `Game`.

---

## 1. Codebase Metrics

### Model Sizes (Lines of Code)

| Project | Main Game Model | Heavy Logic Location | External Imports |
|---------|-----------------|---------------------|------------------|
| **zkube** | 462 lines | In model (GameTrait) | Controller (2000+), LevelGeneratorTrait (949) |
| **nums** | 726 lines | In model (GameImpl) | Minimal (Packer, Random) |
| **death-mountain** | 4,462 lines (Adventurer) | In model (ImplAdventurer) | Combat utils, ItemUtils |
| **dark-shuffle** | 97 lines | In utils/ | ConfigUtils, MapUtils, etc. |

### System Organization

| Project | # of Systems | Dispatcher Pattern | Component Pattern |
|---------|--------------|-------------------|-------------------|
| **zkube** | 10 | Centralized helpers | No |
| **nums** | 3 | Store struct | Yes (PlayableComponent) |
| **death-mountain** | 8 | GameLibs struct | No |
| **dark-shuffle** | 4 | Direct DNS in utils | MinigameComponent only |

---

## 2. Pattern Deep Dive

### 2.1 nums: Component + Store Pattern

**Architecture:**
```
┌────────────────────────────────────────────────────┐
│                    Play System                      │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ Achievable   │ │ Playable     │ │ Starterpack│  │
│  │ Component    │ │ Component    │ │ Component  │  │
│  └──────────────┘ └──────────────┘ └────────────┘  │
│                         │                           │
│                   Store Struct                      │
│           (centralized model access)                │
└────────────────────────────────────────────────────┘
```

**Store Pattern:**
```cairo
pub struct Store { pub world: WorldStorage }

impl StoreTrait {
    fn new(world: WorldStorage) -> Store { Store { world } }
    
    // Model access
    fn game(self: @Store, game_id: u64) -> Game { self.world.read_model(game_id) }
    fn set_game(mut self: Store, game: @Game) { self.world.write_model(game) }
    
    // Dispatcher access
    fn nums_disp(self: @Store) -> INumsTokenDispatcher { ... }
    fn vrf_disp(ref self: Store) -> IVrfProviderDispatcher { ... }
}
```

**Pros:**
- Reusable logic via Starknet components
- Type-safe centralized access via Store
- Clear separation of concerns

**Cons:**
- Component embedding increases contract size
- More boilerplate setup
- Components not easily shared across projects

**Model Pattern:**
- Heavy game logic in `GameImpl` trait (726 lines)
- Only imports lightweight helpers (Packer, Random, Bitmap)
- NO external system imports in the model

---

### 2.2 death-mountain: GameLibs Pattern

**Architecture:**
```
┌────────────────────────────────────────────────────┐
│                  game_systems                       │
│                       │                             │
│              GameLibs::new(world)                   │
│       ┌───────────────┼───────────────┐            │
│       ▼               ▼               ▼            │
│  ┌─────────┐    ┌──────────┐    ┌─────────┐       │
│  │ loot    │    │adventurer│    │  beast  │       │
│  │ _systems│    │ _systems │    │_systems │       │
│  └─────────┘    └──────────┘    └─────────┘       │
└────────────────────────────────────────────────────┘
```

**GameLibs Pattern:**
```cairo
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub loot: ILootSystemsDispatcher,
    pub renderer: IRendererSystemsDispatcher,
    pub adventurer: IAdventurerSystemsDispatcher,
    pub beast: IBeastSystemsDispatcher,
}

impl ImplGameLibs {
    fn new(world: WorldStorage) -> GameLibs {
        let (loot_addr, _) = world.dns(@"loot_systems").unwrap();
        let (adventurer_addr, _) = world.dns(@"adventurer_systems").unwrap();
        // ... more DNS lookups
        
        GameLibs {
            loot: ILootSystemsDispatcher { contract_address: loot_addr },
            adventurer: IAdventurerSystemsDispatcher { contract_address: adventurer_addr },
            // ...
        }
    }
}
```

**Usage in Systems:**
```cairo
fn start_game(ref self: T, adventurer_id: u64) {
    let game_libs = ImplGameLibs::new(world);
    
    // Use dispatchers from the bundle
    let beast = game_libs.beast.get_starter_beast(...);
    let adventurer = game_libs.adventurer.load_assets(adventurer_id);
}
```

**Pros:**
- Single initialization for all dispatchers
- Very modular - each domain is its own system
- Easy to add new systems
- Clean interface for cross-system calls

**Cons:**
- DNS lookup cost on every GameLibs::new()
- More cross-contract calls = more gas
- Requires all systems to be deployed

**Model Pattern:**
- VERY heavy logic in Adventurer model (4,462 lines!)
- Contains combat calculations, item management, stat calculations
- BUT: Only imports other model utilities, not external systems

---

### 2.3 dark-shuffle: Utility Modules Pattern

**Architecture:**
```
┌────────────────────────────────────────────────────┐
│                  game_systems                       │
│                       │                             │
│         Uses utility modules directly               │
│    ┌──────────┬───────────┬───────────┐           │
│    ▼          ▼           ▼           ▼           │
│ CardUtils  DraftUtils  MapUtils  ConfigUtils      │
│   (pure functions, no state)                       │
└────────────────────────────────────────────────────┘
```

**Utility Pattern:**
```cairo
// In utils/config.cairo
#[generate_trait]
pub impl ConfigUtilsImpl of ConfigUtilsTrait {
    fn get_game_settings(world: WorldStorage, game_id: u64) -> GameSettings {
        let (config_addr, _) = world.dns(@"config_systems").unwrap();
        let config_systems = IConfigSystemsDispatcher { contract_address: config_addr };
        config_systems.game_settings(game_id)
    }
}

// Used directly in systems
fn start_game(ref self: T, game_id: u64) {
    let game_settings = ConfigUtilsImpl::get_game_settings(world, game_id);
    // ...
}
```

**Pros:**
- Simplest architecture
- No dispatcher management overhead
- Easy to understand

**Cons:**
- Utility imports can bloat contracts
- Less modular for very large games
- DNS lookups scattered throughout code

**Model Pattern:**
- Minimal model (97 lines!)
- Only contains data structures and simple assertions
- ALL logic lives in utils/ or systems/

---

### 2.4 zkube: Current Dispatcher Pattern

**Current Architecture:**
```
┌────────────────────────────────────────────────────┐
│              Entry Systems (thin)                   │
│    game_system  move_system  bonus_system          │
│         │            │            │                 │
│         └────────────┼────────────┘                 │
│                      ▼                              │
│           dispatchers::get_*_dispatcher()           │
│         ┌────────────┼────────────┐                │
│         ▼            ▼            ▼                │
│   level_system  grid_system  quest_system          │
└────────────────────────────────────────────────────┘
```

**Current Dispatcher Helpers:**
```cairo
pub fn get_level_system_dispatcher(world: WorldStorage) -> ILevelSystemDispatcher {
    let addr = world.dns_address(@"level_system").expect('...');
    ILevelSystemDispatcher { contract_address: addr }
}

pub fn get_grid_system_dispatcher(world: WorldStorage) -> IGridSystemDispatcher {
    let addr = world.dns_address(@"grid_system").expect('...');
    IGridSystemDispatcher { contract_address: addr }
}
```

**The Problem - Model Imports:**
```cairo
// In models/game.cairo
use zkube::helpers::controller::Controller;        // 2000+ lines!
use zkube::helpers::level::LevelGeneratorTrait;   // 949 lines!

impl GameTrait {
    fn new(...) -> Game {
        let level_config = LevelGeneratorTrait::generate(...);  // Heavy!
        let row = Controller::create_line(...);                  // Heavy!
        // ...
    }
    
    fn complete_level(...) {
        let level_config = LevelGeneratorTrait::generate(...);  // Again!
        // ...
    }
}
```

**Impact:**
- Every contract that uses `Game` model imports Controller + LevelGeneratorTrait
- This is why game_system is 28,598 felts even after our optimizations
- The model itself pulls in ~3000 lines of heavy dependencies

---

## 3. Root Cause Analysis

### Why zkube Contracts Are Larger

| Contract | Size | Uses Game Model | Imports Heavy Logic |
|----------|------|-----------------|---------------------|
| game_system | 28,598 | Yes | Via Game model |
| grid_system | 59,916 | Yes | Direct (owns logic) |
| level_system | 24,976 | Yes | Direct (owns logic) |
| move_system | 13,539 | Yes | Via dispatcher (good!) |
| bonus_system | 12,654 | Yes | Via dispatcher (good!) |

**The Pattern:**
- `move_system` and `bonus_system` are small because they use dispatchers
- `game_system` is large because `GameTrait::new()` is called during `create()`
- `grid_system` is largest because it owns Controller + all bonuses

### Comparison: What Others Do Differently

**nums:**
- `GameImpl::new()` only uses `Packer` (lightweight)
- No external system imports in model

**death-mountain:**
- `ImplAdventurer::new()` uses only model-level utilities
- Combat logic is in the model but doesn't import external systems
- Systems import models, not the other way around

**dark-shuffle:**
- Model has no `new()` logic at all
- Systems create Game structs inline
- All logic in utils/ modules

---

## 4. Optimization Plan for zkube

### Phase 1: Extract Heavy Logic from Game Model (High Impact)

**Goal:** Remove `Controller` and `LevelGeneratorTrait` imports from `models/game.cairo`

**Current (Problem):**
```cairo
// models/game.cairo
use zkube::helpers::controller::Controller;
use zkube::helpers::level::LevelGeneratorTrait;

impl GameTrait {
    fn new(game_id, seed, timestamp, settings) -> Game {
        let level_config = LevelGeneratorTrait::generate(seed, 1, settings);
        let row = Controller::create_line(level_seed, level_config.difficulty, settings);
        // ...
    }
}
```

**Proposed (Solution):**
```cairo
// models/game.cairo - NO heavy imports
impl GameTrait {
    fn new_empty(game_id, timestamp) -> Game {
        Game {
            game_id,
            blocks: 0,
            next_row: 0,
            // ... minimal initialization
        }
    }
}

// systems/grid.cairo - owns Controller
impl IGridSystem {
    fn initialize_grid(ref self, game_id: u64, difficulty: Difficulty, seed: felt252) {
        let mut game: Game = world.read_model(game_id);
        game.next_row = Controller::create_line(...);
        game.blocks = Controller::add_line(0, game.next_row);
        // ... fill grid
        world.write_model(@game);
    }
}

// systems/game.cairo - now lightweight
fn create(ref self, game_id, ...) {
    let game = GameTrait::new_empty(game_id, timestamp);
    world.write_model(@game);
    
    // Delegate to specialized systems
    let level_system = dispatchers::get_level_system_dispatcher(world);
    level_system.initialize_level(game_id);
    
    let grid_system = dispatchers::get_grid_system_dispatcher(world);
    grid_system.initialize_grid(game_id, difficulty, seed);
}
```

**Methods to Move:**
| Method | Current Location | New Location | Reason |
|--------|-----------------|--------------|--------|
| `Game::new()` | GameTrait | Split: game_system + grid_system | Uses Controller, LevelGen |
| `Game::start()` | GameTrait | grid_system | Uses Controller |
| `Game::insert_new_line()` | GameTrait | grid_system | Uses Controller |
| `Game::complete_level()` | GameTrait | level_system (done!) | Uses LevelGen |
| `Game::is_level_complete()` | GameTrait | level_check helper | Uses LevelGen |
| `Game::is_level_failed()` | GameTrait | level_check helper | Uses LevelGen |

**Expected Impact:**
- game_system: 28,598 → ~15,000 felts (-47%)
- Model becomes pure data + simple accessors

---

### Phase 2: Implement GameLibs Pattern (Medium Impact)

**Goal:** Bundle all dispatchers like death-mountain for cleaner code

**Proposed:**
```cairo
// helpers/game_libs.cairo
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub level: ILevelSystemDispatcher,
    pub grid: IGridSystemDispatcher,
    pub quest: IQuestSystemDispatcher,
    pub cube: ICubeTokenDispatcher,
}

#[generate_trait]
pub impl GameLibsImpl of GameLibsTrait {
    fn new(world: WorldStorage) -> GameLibs {
        GameLibs {
            level: ILevelSystemDispatcher { 
                contract_address: world.dns_address(@"level_system").unwrap() 
            },
            grid: IGridSystemDispatcher { 
                contract_address: world.dns_address(@"grid_system").unwrap() 
            },
            quest: IQuestSystemDispatcher { 
                contract_address: world.dns_address(@"quest_system").unwrap() 
            },
            cube: ICubeTokenDispatcher { 
                contract_address: world.dns_address(@"cube_token").unwrap() 
            },
        }
    }
}

// Usage in systems
fn create(ref self, game_id, ...) {
    let libs = GameLibsImpl::new(world);
    libs.level.initialize_level(game_id);
    libs.grid.initialize_grid(game_id, ...);
    libs.quest.progress(player, task_id, 1);
}
```

**Benefits:**
- Single initialization point
- Type-safe access to all systems
- Cleaner code in entry systems
- Easy to add new systems

---

### Phase 3: Store Pattern for Model Access (Optional)

**Goal:** Centralize model read/write like nums

**Proposed:**
```cairo
// helpers/store.cairo
#[derive(Copy, Drop)]
pub struct Store {
    world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    fn new(world: WorldStorage) -> Store { Store { world } }
    
    // Model access
    fn game(self: @Store, game_id: u64) -> Game { 
        self.world.read_model(game_id) 
    }
    fn set_game(ref self: Store, game: @Game) { 
        self.world.write_model(game) 
    }
    fn player_meta(self: @Store, player: ContractAddress) -> PlayerMeta { 
        self.world.read_model(player) 
    }
    fn set_player_meta(ref self: Store, meta: @PlayerMeta) { 
        self.world.write_model(meta) 
    }
    fn game_level(self: @Store, game_id: u64) -> GameLevel { 
        self.world.read_model(game_id) 
    }
    fn set_game_level(ref self: Store, level: @GameLevel) { 
        self.world.write_model(level) 
    }
    
    // Dispatcher access (combines with GameLibs)
    fn libs(self: @Store) -> GameLibs {
        GameLibsImpl::new(*self.world)
    }
}

// Usage
fn create(ref self, game_id, ...) {
    let mut store = StoreImpl::new(world);
    
    let game = GameTrait::new_empty(game_id, timestamp);
    store.set_game(@game);
    
    store.libs().level.initialize_level(game_id);
}
```

---

## 5. Implementation Priority

### High Priority (Do First)
1. **Extract `Game::new()` logic to systems** - Biggest impact on contract sizes
2. **Move `insert_new_line()` to grid_system** - Removes Controller from model
3. **Move `is_level_complete/failed()` to level_check** - Removes LevelGen from model

### Medium Priority
4. **Implement GameLibs struct** - Cleaner dispatcher management
5. **Update all entry systems to use GameLibs** - Consistency

### Low Priority (Nice to Have)
6. **Implement Store pattern** - Further code organization
7. **Consider component pattern** - Only if we need cross-project reuse

---

## 6. Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Move Game::new() | High - Core creation flow | Extensive testing, staged rollout |
| GameLibs pattern | Low - Additive change | Can coexist with current helpers |
| Store pattern | Low - Additive change | Optional adoption |
| Remove model imports | Medium - Refactor scope | Move one method at a time |

---

## 7. Expected Results

### Contract Size Projections

| Contract | Current | After Phase 1 | After Phase 2 |
|----------|---------|---------------|---------------|
| game_system | 28,598 | ~15,000 | ~15,000 |
| grid_system | 59,916 | ~60,000 | ~60,000 |
| level_system | 24,976 | ~25,000 | ~25,000 |
| move_system | 13,539 | ~10,000 | ~10,000 |
| bonus_system | 12,654 | ~10,000 | ~10,000 |

### Code Quality Improvements
- Clear separation: models = data, systems = logic
- Consistent dispatcher access pattern
- Reduced coupling between components
- Easier to test individual systems

---

## 8. Conclusion

The zkube codebase already uses a solid dispatcher pattern, but the main issue is that heavy logic (`Controller`, `LevelGeneratorTrait`) is imported into the `Game` model. This causes every contract using `Game` to include ~3000 lines of unnecessary code.

The recommended approach:
1. **Phase 1:** Extract heavy methods from `GameTrait` to specialized systems
2. **Phase 2:** Implement `GameLibs` for cleaner dispatcher management
3. **Phase 3:** Optionally add `Store` pattern for model access

This aligns zkube with the best practices seen in death-mountain (modular systems) while avoiding the complexity of nums' component pattern.
