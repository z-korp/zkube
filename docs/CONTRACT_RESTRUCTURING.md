# zKube Contract Restructuring Plan

## Based on Reference Implementation Best Practices

**Created:** January 2026  
**Updated:** January 2026 - Added contract size management patterns  
**References:**
- `/references/nums/` - Cartridge's nums game (thin wrapper pattern)
- `/references/death-mountain/` - Provable's RPG (helper systems pattern)
- `/references/dark-shuffle/` - Card game (utils pattern)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Contract Size Management](#2-contract-size-management) ⭐ NEW
3. [Current State Analysis](#3-current-state-analysis)
4. [Reference Architecture Patterns](#4-reference-architecture-patterns)
5. [Store Pattern Implementation](#5-store-pattern-implementation)
6. [Components Pattern Adoption](#6-components-pattern-adoption)
7. [Achievement & Quest System Integration](#7-achievement--quest-system-integration)
8. [Model Organization](#8-model-organization)
9. [Events Organization](#9-events-organization)
10. [Types Organization](#10-types-organization)
11. [Elements Restructuring](#11-elements-restructuring)
12. [Helpers Review](#12-helpers-review)
13. [Interfaces Expansion](#13-interfaces-expansion)
14. [Mocks & Tests](#14-mocks--tests)
15. [lib.cairo Restructuring](#15-libcairo-restructuring)
16. [Code Cleanup: Unused/Obsolete Code](#16-code-cleanup-unusedobsolete-code)
17. [Dependencies Update](#17-dependencies-update)
18. [Migration Plan](#18-migration-plan)
19. [Implementation Priority](#19-implementation-priority)

---

## 1. Executive Summary

### Goal
Restructure zKube's Cairo contracts to align with modern Dojo best practices as demonstrated in the nums reference implementation. This includes adopting the Store pattern, Components architecture, and properly integrating the Cartridge Arcade achievement/quest system.

### Key Changes
| Area | Current State | Target State |
|------|--------------|--------------|
| **Storage Access** | Direct `world.read_model()`/`write_model()` calls scattered throughout | Centralized `Store` struct with typed methods |
| **Code Reuse** | Logic embedded directly in systems | Starknet components for reusable game logic |
| **Achievements** | Orphaned code not in lib.cairo | Fully integrated with `AchievableComponent` |
| **Quests** | Not implemented | Full quest system with daily challenges |
| **Module Structure** | Flat organization | Hierarchical with index files |

### Impact Assessment
- **Breaking Changes**: Yes - internal API changes, but external contract interfaces remain compatible
- **Estimated Effort**: Medium-High (2-3 weeks)
- **Risk Level**: Medium - well-defined target architecture from reference implementations

---

## 2. Contract Size Management ⭐ NEW

### 2.1 The Problem

Starknet has a **maximum contract size limit of 81,920 felts**. Our `game_system` contract currently exceeds this:
- Current size: ~83,000+ felts
- Limit: 81,920 felts
- Over by: ~1,000+ felts

**Important Insight:** Starknet components (`#[starknet::component]`) do NOT reduce contract size - they get compiled INTO the contract that uses them. The thin wrapper pattern with components is about code organization and reusability, not size reduction.

### 2.2 Patterns from Reference Codebases

| Pattern | Used By | Contract Size Impact | Code Organization |
|---------|---------|---------------------|-------------------|
| **Helper Systems (Dispatchers)** | death-mountain | ✅ **REDUCES** size | Multiple contracts |
| **Thin Wrapper + Component** | nums | ❌ No reduction | Single contract |
| **Utils with #[generate_trait]** | dark-shuffle | ❌ No reduction | Better organization |

### 2.3 Pattern 1: Helper Systems (death-mountain) ⭐ RECOMMENDED FOR SIZE

**Key Insight:** Split logic into **separate contracts** accessed via dispatchers.

```cairo
// /references/death-mountain/contracts/src/libs/game.cairo
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub loot: ILootSystemsDispatcher,
    pub adventurer: IAdventurerSystemsDispatcher,
    pub beast: IBeastSystemsDispatcher,
}

pub impl ImplGameLibs of IGameLib {
    fn new(world: WorldStorage) -> GameLibs {
        let (loot_address, _) = world.dns(@"loot_systems").unwrap();
        let (adventurer_address, _) = world.dns(@"adventurer_systems").unwrap();
        let (beast_address, _) = world.dns(@"beast_systems").unwrap();
        GameLibs {
            loot: ILootSystemsDispatcher { contract_address: loot_address },
            adventurer: IAdventurerSystemsDispatcher { contract_address: adventurer_address },
            beast: IBeastSystemsDispatcher { contract_address: beast_address },
        }
    }
}
```

**Usage in game_system:**
```cairo
fn explore(ref self: ContractState, adventurer_id: u64, ...) {
    let game_libs = ImplGameLibs::new(world);
    let (adventurer, bag) = game_libs.adventurer.load_assets(adventurer_id);
    let beast = game_libs.beast.get_beast(...);
    // Heavy logic delegated to helper contracts
}
```

**Benefits:**
- Each helper contract compiles separately
- Main contract only contains dispatcher calls (small)
- Logic distributed across multiple deployable contracts

### 2.4 Pattern 2: Thin Wrapper + Component (nums)

**Key Insight:** System is minimal, ALL logic in component. Good for organization but NOT for size.

```cairo
// System (~216 lines) - just delegates
#[dojo::contract]
pub mod Play {
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    
    fn set(ref self: ContractState, game_id: u64, index: u8) -> u16 {
        let world = self.world(@NAMESPACE());
        self.playable.set(world, game_id, index)  // Delegate
    }
}

// Component (~453 lines) - contains ALL logic
#[starknet::component]
pub mod PlayableComponent {
    fn set(ref self: ComponentState<...>, world: WorldStorage, game_id: u64, index: u8) -> u16 {
        // All the actual game logic here
    }
}
```

**Important:** The component code compiles INTO the system contract, so total size = system + component.

### 2.5 Pattern 3: Utils with #[generate_trait] (dark-shuffle)

**Key Insight:** Pure functions in utils modules for better organization.

```cairo
// /references/dark-shuffle/contracts/src/utils/battle.cairo
#[generate_trait]
pub impl BattleUtilsImpl of BattleUtilsTrait {
    fn heal_hero(ref battle: Battle, amount: u8) {
        battle.hero.health += amount;
    }
    fn damage_monster(ref battle: Battle, amount: u8) {
        battle.monster.health -= amount;
    }
}

// System uses utils
fn battle_actions(ref self: ContractState, ...) {
    let mut battle = world.read_model(battle_id);
    BattleUtilsImpl::heal_hero(ref battle, 20);
    world.write_model(@battle);
}
```

**Note:** Utils compile into the contract that uses them, so no size reduction.

### 2.6 Recommended Approach for zKube

**To reduce game_system size, we should use the death-mountain pattern:**

1. **Create helper systems:**
   - `game_helper_system` - Move `handle_game_over`, `award_level_bonuses`, etc.
   - `level_helper_system` - Move level completion logic
   - Keep `game_system` as the main entry point with dispatcher calls

2. **Define interfaces for helpers:**
   ```cairo
   // interfaces/game_helper.cairo
   #[starknet::interface]
   pub trait IGameHelper<T> {
       fn handle_game_over(ref self: T, game_id: u64);
       fn award_level_bonuses(ref self: T, game_id: u64, count: u8) -> u8;
       fn check_and_complete_level(ref self: T, game_id: u64) -> bool;
   }
   ```

3. **GameLibs pattern for zKube:**
   ```cairo
   #[derive(Copy, Drop)]
   pub struct GameLibs {
       pub helper: IGameHelperDispatcher,
       pub cube_token: ICubeTokenDispatcher,
   }
   
   impl GameLibsImpl of IGameLibs {
       fn new(world: WorldStorage) -> GameLibs {
           let (helper_addr, _) = world.dns(@"game_helper_system").unwrap();
           let cube_addr = world.dns_address(@"cube_token").unwrap();
           GameLibs {
               helper: IGameHelperDispatcher { contract_address: helper_addr },
               cube_token: ICubeTokenDispatcher { contract_address: cube_addr },
           }
       }
   }
   ```

### 2.7 Comparison Table

| Aspect | death-mountain | nums | dark-shuffle | zKube (current) |
|--------|----------------|------|--------------|-----------------|
| Main System Lines | 1269+ | 216 | 364 | ~720 |
| Total Systems | 8 | 3 | 4 | 4 |
| Components in Main | 2 | 5 | 2 | 6 |
| Logic Location | Helper Systems | Component | Utils | System + Component |
| Contract Size | Distributed | Single | Single | Single (too big) |

### 2.8 Key File Paths for Reference

**death-mountain (Helper Systems Pattern):**
- Main system: `/references/death-mountain/contracts/src/systems/game/contracts.cairo`
- GameLibs: `/references/death-mountain/contracts/src/libs/game.cairo`
- Helper system: `/references/death-mountain/contracts/src/systems/adventurer/contracts.cairo`

**nums (Thin Wrapper Pattern):**
- Main system: `/references/nums/contracts/src/systems/play.cairo`
- PlayableComponent: `/references/nums/contracts/src/components/playable.cairo`

**dark-shuffle (Utils Pattern):**
- Utils index: `/references/dark-shuffle/contracts/src/utils.cairo`
- Battle utils: `/references/dark-shuffle/contracts/src/utils/battle.cairo`

---

## 3. Current State Analysis

### 2.1 Current Directory Structure
```
contracts/src/
├── lib.cairo                    # Module declarations
├── constants.cairo              # Game constants
├── events.cairo                 # All events in single file
├── models/
│   ├── config.cairo             # GameSettings, GameSettingsMetadata
│   ├── game.cairo               # Game, GameSeed models
│   └── player.cairo             # PlayerMeta model
├── types/
│   ├── bonus.cairo              # Bonus enum
│   ├── block.cairo              # Block enum
│   ├── consumable.cairo         # ConsumableType enum
│   ├── constraint.cairo         # ConstraintType, LevelConstraint
│   ├── difficulty.cairo         # Difficulty enum + UNUSED IncreasingDifficultyUtils
│   ├── level.cairo              # LevelConfig struct
│   ├── width.cairo              # Width enum
│   ├── color.cairo              # ⚠️ NOT IN lib.cairo - orphaned
│   ├── task.cairo               # ⚠️ NOT IN lib.cairo - orphaned
│   └── trophy.cairo             # ⚠️ NOT IN lib.cairo - orphaned
├── elements/
│   ├── bonuses/                 # ✅ Properly structured
│   │   ├── interface.cairo
│   │   ├── hammer.cairo
│   │   ├── totem.cairo
│   │   └── wave.cairo
│   ├── difficulties/            # ✅ Properly structured
│   │   ├── interface.cairo
│   │   └── veryeasy..master.cairo
│   ├── tasks/                   # ⚠️ NOT IN lib.cairo - 6 orphaned files
│   └── trophies/                # ⚠️ NOT IN lib.cairo - 6 orphaned files
├── helpers/
│   ├── config.cairo             # ConfigUtils
│   ├── controller.cairo         # Grid manipulation (main logic)
│   ├── encoding.cairo           # Base64 encoding (keep for future NFT metadata)
│   ├── gravity.cairo            # Block falling logic
│   ├── level.cairo              # LevelGenerator + UNUSED generate_constraint()
│   ├── math.cairo               # min/max utilities
│   ├── packer.cairo             # Bit packing
│   ├── packing.cairo            # RunData, MetaData packing
│   ├── random.cairo             # VRF and pseudo-random
│   ├── renderer.cairo           # SVG rendering (keep for future on-chain NFT metadata)
│   └── token.cairo              # Token dispatcher helpers
├── interfaces/
│   └── vrf.cairo                # Only VRF interface
├── systems/
│   ├── game.cairo               # Main game system
│   ├── config.cairo             # Config system
│   ├── shop.cairo               # Shop system
│   └── cube_token.cairo         # ERC1155 CUBE token
└── mocks/
    └── mock_vrf.cairo           # ⚠️ NOT IN lib.cairo
```

### 2.2 Issues Identified

| Category | Issue | Severity |
|----------|-------|----------|
| **Orphaned Code** | 15+ files exist but not declared in lib.cairo | High |
| **No Store Pattern** | World access scattered, dispatchers recreated per-call | Medium |
| **No Components** | All logic in systems, no reusability | Medium |
| **Achievement System** | Code exists but not integrated | High |
| **Quest System** | Completely missing | Medium |
| **Unused Functions** | `generate_constraint()`, `IncreasingDifficultyUtils` | Low |
| **Unused Events** | `ConstraintProgress` defined but never emitted | Low |

---

## 3. Reference Architecture (nums)

### 3.1 nums Directory Structure
```
contracts/src/
├── lib.cairo                    # Comprehensive module declarations
├── constants.cairo              # Namespace, slot sizes
├── store.cairo                  # ⭐ Centralized Store pattern
├── systems/
│   ├── collection.cairo         # ERC721 game tokens
│   ├── play.cairo               # Main game actions
│   └── setup.cairo              # Configuration/initialization
├── components/                  # ⭐ Starknet components
│   ├── initializable.cairo      # Achievement/quest initialization
│   ├── playable.cairo           # Core game logic
│   └── starterpack.cairo        # Starterpack management
├── models/
│   ├── index.cairo              # ⭐ Model re-exports
│   ├── config.cairo
│   ├── game.cairo
│   └── starterpack.cairo
├── events/
│   ├── index.cairo              # Event definitions
│   └── reward.cairo             # Reward event helpers
├── types/
│   ├── metadata.cairo
│   ├── power.cairo
│   └── svg.cairo
├── elements/
│   ├── achievements/            # ⭐ Full achievement system
│   │   ├── index.cairo          # Central enum + traits
│   │   ├── interface.cairo
│   │   └── grinder..master.cairo
│   ├── tasks/                   # ⭐ Task definitions
│   │   ├── index.cairo
│   │   ├── interface.cairo
│   │   └── specific tasks...
│   ├── powers/                  # Game-specific powers
│   │   ├── interface.cairo
│   │   └── reroll..mirror.cairo
│   └── quests/                  # ⭐ Quest system
│       ├── index.cairo
│       ├── interface.cairo
│       └── contender..finisher.cairo
├── helpers/
│   ├── bitmap.cairo
│   ├── deck.cairo
│   ├── packer.cairo
│   ├── random.cairo
│   └── rewarder.cairo
├── interfaces/
│   ├── erc20.cairo
│   ├── erc721.cairo
│   ├── nums.cairo
│   ├── registry.cairo
│   ├── token.cairo
│   └── vrf.cairo
├── svg/                         # On-chain SVG generation
│   ├── index.cairo
│   ├── interface.cairo
│   └── complete..progress.cairo
├── assets/
│   ├── banner.cairo
│   └── icon.cairo
├── mocks/
│   ├── registry.cairo
│   ├── token.cairo
│   └── vrf.cairo
└── tests/                       # Under #[cfg(test)]
    ├── setup.cairo
    └── test_setup.cairo
```

### 3.2 Key Patterns to Adopt

1. **Store Pattern** - Centralized typed access to world storage
2. **Components Pattern** - Reusable logic via `#[starknet::component]`
3. **Index Files** - Central enum definitions with trait implementations
4. **Achievement Integration** - Using Cartridge's `AchievableComponent`
5. **Quest System** - Using Cartridge's `QuestableComponent`
6. **Proper Module Exports** - All code properly declared in lib.cairo

---

## 4. Store Pattern Implementation

### 4.1 What to Create

**New file: `contracts/src/store.cairo`**

```cairo
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::ContractAddress;
use zkube::constants::DEFAULT_NS;
use zkube::models::game::{Game, GameSeed};
use zkube::models::config::{GameSettings, GameSettingsMetadata};
use zkube::models::player::PlayerMeta;
use zkube::interfaces::vrf::IVrfProviderDispatcher;
use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};

#[derive(Copy, Drop)]
pub struct Store {
    pub world: WorldStorage,
}

#[generate_trait]
pub impl StoreImpl of StoreTrait {
    // Constructor
    fn new(world: WorldStorage) -> Store {
        Store { world }
    }

    // ===== Model Access =====
    
    fn game(self: @Store, game_id: u64) -> Game {
        self.world.read_model(game_id)
    }

    fn set_game(mut self: Store, game: @Game) {
        self.world.write_model(game)
    }

    fn game_seed(self: @Store, game_id: u64) -> GameSeed {
        self.world.read_model(game_id)
    }

    fn set_game_seed(mut self: Store, seed: @GameSeed) {
        self.world.write_model(seed)
    }

    fn game_settings(self: @Store, settings_id: u32) -> GameSettings {
        self.world.read_model(settings_id)
    }

    fn set_game_settings(mut self: Store, settings: @GameSettings) {
        self.world.write_model(settings)
    }

    fn player_meta(self: @Store, player: ContractAddress) -> PlayerMeta {
        self.world.read_model(player)
    }

    fn set_player_meta(mut self: Store, meta: @PlayerMeta) {
        self.world.write_model(meta)
    }

    // ===== Dispatchers =====
    
    fn cube_token_disp(self: @Store) -> ICubeTokenDispatcher {
        let address = self.world.dns_address(@"cube_token")
            .expect('CubeToken not found in DNS');
        ICubeTokenDispatcher { contract_address: address }
    }

    // ===== Events =====
    
    fn emit_start_game(mut self: Store, event: @StartGame) {
        self.world.emit_event(event)
    }

    fn emit_level_completed(mut self: Store, event: @LevelCompleted) {
        self.world.emit_event(event)
    }
    
    // ... other event helpers
}
```

### 4.2 Migration Steps

1. Create `store.cairo` with typed accessors
2. Update `lib.cairo` to export Store
3. Refactor systems to use `StoreImpl::new(world)` instead of direct world access
4. Replace `world.read_model()` calls with `store.game()`, `store.player_meta()`, etc.
5. Replace dispatcher creation with `store.cube_token_disp()`, etc.

### 4.3 Benefits

- **Type Safety**: Explicit model types, no inference errors
- **Code Clarity**: `store.game(id)` vs `world.read_model(id)`
- **Dispatcher Caching**: Create once, reuse
- **Event Helpers**: Typed event emission
- **Single Source**: All world interaction in one place

---

## 5. Components Pattern Adoption

### 5.1 Components to Create

| Component | Purpose | Contains |
|-----------|---------|----------|
| `PlayableComponent` | Core game logic | `make_move()`, `apply_bonus()`, `complete_level()` |
| `InitializableComponent` | Achievement/quest setup | Register all achievements and quests at deploy |
| `ShoppableComponent` | Shop logic | `upgrade_bonus()`, `upgrade_bag()`, `purchase_consumable()` |

### 5.2 PlayableComponent Structure

**New file: `contracts/src/components/playable.cairo`**

```cairo
#[starknet::component]
pub mod PlayableComponent {
    use achievement::components::achievable::AchievableComponent;
    use quest::components::questable::QuestableComponent;
    use dojo::world::WorldStorage;
    use zkube::{StoreImpl, StoreTrait};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::elements::tasks::index::{Task, TaskTrait};

    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[generate_trait]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Achievable: AchievableComponent::HasComponent<TContractState>,
        impl Quest: QuestableComponent::HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        
        fn make_move(
            ref self: ComponentState<TContractState>,
            world: WorldStorage,
            game_id: u64,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) -> u8 {
            let mut store = StoreImpl::new(world);
            let mut game = store.game(game_id);
            
            // ... game logic ...
            
            // Update achievement progress
            let achievable = get_dep_component!(@self, Achievable);
            let player: felt252 = get_caller_address().into();
            achievable.progress(world, player, Task::Playing.identifier(), 1, true);
            
            // Update quest progress
            let questable = get_dep_component!(@self, Quest);
            questable.progress(world, player, Task::Playing.identifier(), 1, true);
            
            store.set_game(@game);
            lines_cleared
        }
        
        fn complete_level(
            ref self: ComponentState<TContractState>,
            world: WorldStorage,
            game: @Game,
        ) -> (u8, u8) {
            // ... level completion logic with achievement triggers ...
        }
    }
}
```

### 5.3 InitializableComponent Structure

**New file: `contracts/src/components/initializable.cairo`**

```cairo
#[starknet::component]
pub mod InitializableComponent {
    use achievement::components::achievable::AchievableComponent;
    use quest::components::questable::QuestableComponent;
    use zkube::elements::achievements::index::{Achievement, AchievementTrait, ACHIEVEMENT_COUNT};
    use zkube::elements::quests::index::{QuestType, QUEST_COUNT};

    #[storage]
    pub struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {}

    #[generate_trait]
    pub impl InternalImpl<
        TContractState,
        +HasComponent<TContractState>,
        +Drop<TContractState>,
        impl Achievable: AchievableComponent::HasComponent<TContractState>,
        impl Quest: QuestableComponent::HasComponent<TContractState>,
    > of InternalTrait<TContractState> {
        fn initialize(ref self: ComponentState<TContractState>, world: WorldStorage) {
            let achievable = get_dep_component!(@self, Achievable);
            let questable = get_dep_component!(@self, Quest);
            
            // Register all achievements
            let mut id: u8 = ACHIEVEMENT_COUNT;
            while id > 0 {
                let achievement: Achievement = id.into();
                achievable.create(
                    world,
                    id: achievement.identifier(),
                    rewarder: 0.try_into().unwrap(),
                    start: 0,
                    end: 0,
                    tasks: achievement.tasks(),
                    metadata: achievement.metadata(),
                    to_store: true,
                );
                id -= 1;
            }
            
            // Register all quests
            let mut quest_id: u8 = QUEST_COUNT;
            while quest_id > 0 {
                let quest_type: QuestType = quest_id.into();
                let props = quest_type.props();
                questable.create(
                    world,
                    id: props.id,
                    // ... quest properties
                );
                quest_id -= 1;
            }
        }
    }
}
```

### 5.4 System Integration

**Updated `systems/game.cairo`:**

```cairo
#[dojo::contract]
pub mod game_system {
    // Import components
    use achievement::components::achievable::AchievableComponent;
    use quest::components::questable::QuestableComponent;
    use zkube::components::playable::PlayableComponent;
    use zkube::components::initializable::InitializableComponent;
    
    // Declare components
    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    component!(path: QuestableComponent, storage: questable, event: QuestableEvent);
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);
    
    // Component impls
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;
    impl InitializableInternalImpl = InitializableComponent::InternalImpl<ContractState>;
    
    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
        #[substorage(v0)]
        questable: QuestableComponent::Storage,
        #[substorage(v0)]
        playable: PlayableComponent::Storage,
        #[substorage(v0)]
        initializable: InitializableComponent::Storage,
        // ... existing storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
        #[flat]
        QuestableEvent: QuestableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
        // ... existing events
    }

    fn dojo_init(ref self: ContractState, /* params */) {
        // ... existing init ...
        
        // Initialize achievements and quests
        let world = self.world(@DEFAULT_NS());
        self.initializable.initialize(world);
    }

    #[abi(embed_v0)]
    impl GameSystemImpl of super::IGameSystem<ContractState> {
        fn move(ref self: ContractState, game_id: u64, row: u8, start: u8, end: u8) {
            let world = self.world(@DEFAULT_NS());
            self.playable.make_move(world, game_id, row, start, end);
        }
    }
}
```

---

## 6. Achievement & Quest System Integration

### 6.1 Achievement System Design (Level-Based)

**Achievements adapted to use the new level system:**

| Achievement | Task | Threshold | Description |
|-------------|------|-----------|-------------|
| **ComboInitiator** | Mastering | 10 total combos | First combo milestone |
| **ComboExpert** | Mastering | 50 total combos | Combo proficiency |
| **ComboMaster** | Mastering | 200 total combos | Combo mastery |
| **TripleThreat** | Chaining | 3-line combo | Clear 3+ lines at once |
| **QuadStrike** | Chaining | 4-line combo | Clear 4+ lines at once |
| **PentaClear** | Chaining | 5-line combo | Clear 5+ lines at once |
| **LevelBeginner** | LevelClearing | 5 levels | First steps |
| **LevelExplorer** | LevelClearing | 25 levels | Getting comfortable |
| **LevelVeteran** | LevelClearing | 100 levels | Veteran player |
| **LevelMaster** | LevelClearing | 250 levels | Level master |
| **CubeCollector** | CubeEarning | 100 cubes | Cube milestone |
| **CubeHoarder** | CubeEarning | 1000 cubes | Dedicated collector |
| **CubeLegend** | CubeEarning | 10000 cubes | Legend status |

### 6.2 New Files to Create

**`elements/achievements/index.cairo`:**
```cairo
pub const ACHIEVEMENT_COUNT: u8 = 13;

#[derive(Copy, Drop, PartialEq)]
pub enum Achievement {
    None,
    // Combo achievements
    ComboInitiator,
    ComboExpert,
    ComboMaster,
    // Chaining achievements  
    TripleThreat,
    QuadStrike,
    PentaClear,
    // Level achievements
    LevelBeginner,
    LevelExplorer,
    LevelVeteran,
    LevelMaster,
    // Cube achievements
    CubeCollector,
    CubeHoarder,
    CubeLegend,
}

#[generate_trait]
pub impl AchievementImpl of AchievementTrait {
    fn identifier(self: Achievement) -> felt252 { ... }
    fn hidden(self: Achievement) -> bool { ... }
    fn index(self: Achievement) -> u8 { ... }
    fn points(self: Achievement) -> u16 { ... }
    fn group(self: Achievement) -> felt252 { ... }
    fn icon(self: Achievement) -> felt252 { ... }
    fn title(self: Achievement) -> felt252 { ... }
    fn description(self: Achievement) -> ByteArray { ... }
    fn tasks(self: Achievement) -> Span<AchievementTask> { ... }
    fn metadata(self: Achievement) -> AchievementMetadata { ... }
}
```

**`elements/tasks/index.cairo`:**
```cairo
pub const TASK_COUNT: u8 = 5;

#[derive(Copy, Drop, PartialEq)]
pub enum Task {
    None,
    Mastering,      // Total combo count
    Chaining,       // Max combo (lines cleared at once)
    LevelClearing,  // Levels completed
    CubeEarning,    // Cubes earned (lifetime)
    Playing,        // Games played
}

#[generate_trait]
pub impl TaskImpl of TaskTrait {
    fn identifier(self: Task) -> felt252 {
        match self {
            Task::None => 0,
            Task::Mastering => 'MASTERING',
            Task::Chaining => 'CHAINING',
            Task::LevelClearing => 'LEVEL_CLEARING',
            Task::CubeEarning => 'CUBE_EARNING',
            Task::Playing => 'PLAYING',
        }
    }
}
```

### 6.3 Quest System Design

**Daily Quests for zKube:**

| Quest | Task | Target | Reward (Cubes) |
|-------|------|--------|----------------|
| **DailyPlayer** | Play games | 3 games | 10 |
| **DailyLevelUp** | Complete levels | 5 levels | 15 |
| **DailyCombo** | Get combos | 5 combos | 20 |
| **DailyCubes** | Earn cubes | 25 cubes | 25 |
| **DailyMaster** | Complete all dailies | 4/4 | 50 + achievement |

**`elements/quests/index.cairo`:**
```cairo
pub const QUEST_COUNT: u8 = 5;
pub const ONE_DAY: u64 = 86400;

#[derive(Copy, Drop, PartialEq)]
pub enum QuestType {
    None,
    DailyPlayer,
    DailyLevelUp,
    DailyCombo,
    DailyCubes,
    DailyMaster,
}

pub struct QuestProps {
    pub id: felt252,
    pub start: u64,
    pub end: u64,
    pub duration: u64,
    pub interval: u64,
    pub tasks: Array<QuestTask>,
    pub conditions: Array<felt252>,
    pub metadata: QuestMetadata,
}

#[generate_trait]
pub impl QuestImpl of QuestTrait {
    fn props(self: QuestType) -> QuestProps { ... }
    fn reward(self: QuestType) -> (u64, Task) {
        match self {
            QuestType::DailyPlayer => (10, Task::None),
            QuestType::DailyLevelUp => (15, Task::None),
            QuestType::DailyCombo => (20, Task::None),
            QuestType::DailyCubes => (25, Task::None),
            QuestType::DailyMaster => (50, Task::Playing), // Also triggers achievement
            _ => (0, Task::None),
        }
    }
}
```

### 6.4 Integration Points

**In `components/playable.cairo`:**
```cairo
// After a move is made
fn make_move(...) {
    // ... game logic ...
    
    // Progress achievements
    let achievable = get_dep_component!(@self, Achievable);
    
    if lines_cleared >= 2 {
        achievable.progress(world, player, Task::Mastering.identifier(), 1, true);
        // Track max combo for chaining achievements
        if lines_cleared >= 3 {
            achievable.progress(world, player, Task::Chaining.identifier(), lines_cleared.into(), true);
        }
    }
    
    // Progress quests
    let questable = get_dep_component!(@self, Quest);
    if lines_cleared >= 2 {
        questable.progress(world, player, Task::Mastering.identifier(), 1, true);
    }
}

// After level completion
fn complete_level(...) {
    let achievable = get_dep_component!(@self, Achievable);
    achievable.progress(world, player, Task::LevelClearing.identifier(), 1, true);
    achievable.progress(world, player, Task::CubeEarning.identifier(), cubes_earned.into(), true);
    
    let questable = get_dep_component!(@self, Quest);
    questable.progress(world, player, Task::LevelClearing.identifier(), 1, true);
    questable.progress(world, player, Task::CubeEarning.identifier(), cubes_earned.into(), true);
}

// On game start
fn start_game(...) {
    let questable = get_dep_component!(@self, Quest);
    questable.progress(world, player, Task::Playing.identifier(), 1, true);
}
```

---

## 7. Model Organization

### 7.1 Changes Required

**Create `models/index.cairo`:**
```cairo
// Re-export all models for cleaner imports
pub use crate::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
pub use crate::models::game::{Game, GameSeed, GameTrait, GameAssert};
pub use crate::models::player::{PlayerMeta, PlayerMetaTrait};
```

**Update imports throughout codebase:**
```cairo
// Before
use zkube::models::game::{Game, GameTrait};
use zkube::models::config::GameSettings;

// After
use zkube::models::index::{Game, GameTrait, GameSettings};
// Or simply
use zkube::models::{Game, GameTrait, GameSettings};
```

### 7.2 Model Trait Consistency

Ensure all models follow the pattern:
- `ModelTrait` for business logic
- `ModelAssert` for validation
- `Zero` trait if applicable

---

## 8. Events Organization

### 8.1 New Structure

```
events/
├── index.cairo          # Event definitions
```

**`events/index.cairo`:**
```cairo
use starknet::ContractAddress;
use zkube::types::bonus::Bonus;
use zkube::types::constraint::ConstraintType;
use zkube::types::consumable::ConsumableType;

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct StartGame {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct UseBonus {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
    pub bonus: Bonus,
}

// ... other events ...
```

### 8.2 Events to Keep

| Event | Status |
|-------|--------|
| `StartGame` | ✅ Keep |
| `UseBonus` | ✅ Keep |
| `LevelStarted` | ✅ Keep |
| `LevelCompleted` | ✅ Keep |
| `RunEnded` | ✅ Keep |
| `ConsumablePurchased` | ✅ Keep |
| `ConstraintProgress` | ❌ **Remove** - never emitted |

---

## 9. Types Organization

### 9.1 Current Issues

| File | Status | Action |
|------|--------|--------|
| `bonus.cairo` | ✅ Used | Keep |
| `block.cairo` | ✅ Used | Keep |
| `consumable.cairo` | ✅ Used | Keep |
| `constraint.cairo` | ✅ Used | Keep |
| `difficulty.cairo` | ⚠️ Has unused code | Remove `IncreasingDifficultyUtils` |
| `level.cairo` | ✅ Used | Keep |
| `width.cairo` | ✅ Used | Keep |
| `color.cairo` | ❌ Orphaned | Delete |
| `task.cairo` | ❌ Orphaned | Move to `elements/tasks/index.cairo` |
| `trophy.cairo` | ❌ Orphaned | Move to `elements/achievements/index.cairo` |

### 9.2 Recommended Actions

1. **Remove `IncreasingDifficultyUtils`** from `difficulty.cairo` (lines 91-109)
2. **Delete `types/color.cairo`** - unused, block colors handled differently
3. **Delete `types/task.cairo`** - replace with `elements/tasks/index.cairo`
4. **Delete `types/trophy.cairo`** - replace with `elements/achievements/index.cairo`

---

## 10. Elements Restructuring

### 10.1 Current Structure Issues

```
elements/
├── bonuses/          # ✅ Properly structured with interface + implementations
├── difficulties/     # ✅ Properly structured with interface + implementations
├── tasks/            # ⚠️ Files exist but NOT in lib.cairo
└── trophies/         # ⚠️ Files exist but NOT in lib.cairo
```

### 10.2 Target Structure

```
elements/
├── bonuses/                    # Keep as-is
│   ├── interface.cairo
│   ├── hammer.cairo
│   ├── totem.cairo
│   └── wave.cairo
├── difficulties/               # Keep as-is
│   ├── interface.cairo
│   └── veryeasy..master.cairo
├── achievements/               # ⭐ Restructure from trophies
│   ├── index.cairo             # NEW - Achievement enum + AchievementTrait
│   ├── interface.cairo         # Keep - AchievementTrait definition
│   ├── combo.cairo             # Combo-related achievements
│   ├── chaining.cairo          # Chain-related achievements
│   ├── leveling.cairo          # Level-related achievements
│   └── collector.cairo         # Cube-related achievements
├── tasks/                      # ⭐ Restructure
│   ├── index.cairo             # NEW - Task enum + TaskTrait
│   ├── interface.cairo         # Keep
│   ├── mastering.cairo
│   ├── chaining.cairo
│   ├── leveling.cairo
│   ├── earning.cairo
│   └── playing.cairo
└── quests/                     # ⭐ NEW
    ├── index.cairo             # QuestType enum + QuestTrait
    ├── interface.cairo         # QuestTrait definition
    ├── daily_player.cairo
    ├── daily_levelup.cairo
    ├── daily_combo.cairo
    ├── daily_cubes.cairo
    └── daily_master.cairo
```

### 10.3 Migration Steps

1. Rename `elements/trophies/` → `elements/achievements/`
2. Create `elements/achievements/index.cairo` with Achievement enum
3. Create `elements/tasks/index.cairo` with Task enum
4. Create `elements/quests/` directory with quest implementations
5. Update all files to use Cartridge arcade interfaces
6. Add all modules to lib.cairo

---

## 11. Helpers Review

### 11.1 Helper Analysis

| Helper | Status | Notes |
|--------|--------|-------|
| `config.cairo` | ✅ Keep | ConfigUtils for settings retrieval |
| `controller.cairo` | ✅ Keep | Core grid manipulation - 77KB of logic |
| `encoding.cairo` | ✅ Keep | For future on-chain NFT metadata |
| `gravity.cairo` | ✅ Keep | Block falling logic |
| `level.cairo` | ⚠️ Cleanup | Remove `generate_constraint()` (lines 356-495) |
| `math.cairo` | ✅ Keep | min/max utilities |
| `packer.cairo` | ✅ Keep | Bit packing |
| `packing.cairo` | ✅ Keep | RunData, MetaData |
| `random.cairo` | ✅ Keep | VRF/pseudo-random |
| `renderer.cairo` | ✅ Keep | For future on-chain NFT metadata |
| `token.cairo` | ✅ Keep | Token dispatchers |

### 11.2 Recommended Actions

1. **Remove `generate_constraint()` from `level.cairo`** - 140 lines of dead code

---

## 12. Interfaces Expansion

### 12.1 Current State

```
interfaces/
└── vrf.cairo    # Only VRF interface
```

### 12.2 Target State

```
interfaces/
├── vrf.cairo           # VRF provider interface
├── erc20.cairo         # ERC20 standard interface
├── erc721.cairo        # ERC721 standard interface (for game tokens)
├── cube_token.cairo    # ICubeToken interface (extracted from system)
```

### 12.3 Benefits

- Cleaner system files (interfaces extracted)
- Easier cross-contract calls
- Better documentation of contract APIs

---

## 13. Mocks & Tests

### 13.1 Mocks to Add to lib.cairo

**Update `lib.cairo`:**
```cairo
pub mod mocks {
    pub mod mock_vrf;
}
```

### 13.2 Tests Structure

```cairo
#[cfg(test)]
pub mod tests {
    pub mod setup;        // Test utilities
    pub mod test_game;    // Game system tests
}
```

---

## 14. lib.cairo Restructuring

### 14.1 Target lib.cairo

```cairo
// ===== Core =====
pub mod constants;
pub mod store;

pub use store::{Store, StoreImpl, StoreTrait};

// ===== Systems =====
pub mod systems {
    pub mod game;
    pub mod config;
    pub mod shop;
    pub mod cube_token;
}

// ===== Components =====
pub mod components {
    pub mod playable;
    pub mod initializable;
}

// ===== Models =====
pub mod models {
    pub mod index;
    pub mod config;
    pub mod game;
    pub mod player;
}

// ===== Events =====
pub mod events {
    pub mod index;
}

// ===== Types =====
pub mod types {
    pub mod bonus;
    pub mod block;
    pub mod consumable;
    pub mod constraint;
    pub mod difficulty;
    pub mod level;
    pub mod width;
}

// ===== Elements =====
pub mod elements {
    pub mod bonuses {
        pub mod interface;
        pub mod hammer;
        pub mod totem;
        pub mod wave;
    }
    pub mod difficulties {
        pub mod interface;
        pub mod veryeasy;
        pub mod easy;
        pub mod medium;
        pub mod mediumhard;
        pub mod hard;
        pub mod veryhard;
        pub mod expert;
        pub mod master;
    }
    pub mod achievements {
        pub mod index;
        pub mod interface;
        pub mod combo;
        pub mod chaining;
        pub mod leveling;
        pub mod collector;
    }
    pub mod tasks {
        pub mod index;
        pub mod interface;
        pub mod mastering;
        pub mod chaining;
        pub mod leveling;
        pub mod earning;
        pub mod playing;
    }
    pub mod quests {
        pub mod index;
        pub mod interface;
        pub mod daily_player;
        pub mod daily_levelup;
        pub mod daily_combo;
        pub mod daily_cubes;
        pub mod daily_master;
    }
}

// ===== Helpers =====
pub mod helpers {
    pub mod config;
    pub mod controller;
    pub mod encoding;
    pub mod gravity;
    pub mod level;
    pub mod math;
    pub mod packer;
    pub mod packing;
    pub mod random;
    pub mod renderer;
    pub mod token;
}

// ===== Interfaces =====
pub mod interfaces {
    pub mod vrf;
}

// ===== Mocks =====
pub mod mocks {
    pub mod mock_vrf;
}

// ===== Tests =====
#[cfg(test)]
pub mod tests {
    pub mod setup;
}
```

---

## 15. Code Cleanup: Unused/Obsolete Code

### 15.1 Code to DELETE

| File/Code | Location | Reason |
|-----------|----------|--------|
| `IncreasingDifficultyUtils` impl | `types/difficulty.cairo:91-109` | Superseded by settings-based difficulty |
| `generate_constraint()` function | `helpers/level.cairo:356-495` | Superseded by `generate_constraints_with_settings()` |
| `ConstraintProgress` event | `events.cairo:71-80` | Never emitted |
| `types/color.cairo` | Entire file | Orphaned, never used |
| `types/task.cairo` | Entire file | Replace with `elements/tasks/index.cairo` |
| `types/trophy.cairo` | Entire file | Replace with `elements/achievements/index.cairo` |

### 15.2 Code to RESTRUCTURE (not delete)

| Code | Current Location | New Location |
|------|-----------------|--------------|
| Trophy definitions | `elements/trophies/` | `elements/achievements/` |
| Task definitions | `elements/tasks/` | Keep, add `index.cairo` |
| Mock VRF | `mocks/mock_vrf.cairo` | Keep, add to lib.cairo |

---

## 16. Dependencies Update

### 16.1 Current Dependencies (Scarb.toml)

```toml
[dependencies]
dojo.workspace = true
starknet.workspace = true
openzeppelin_token.workspace = true
openzeppelin_introspection.workspace = true
openzeppelin_access.workspace = true
alexandria_math.workspace = true
alexandria_encoding.workspace = true
origami_random.workspace = true
game_components_minigame.workspace = true
game_components_token.workspace = true
game_components_metagame.workspace = true
game_components_utils.workspace = true
graffiti.workspace = true
```

### 16.2 Dependencies to ADD

```toml
# Add to workspace Scarb.toml
[workspace.dependencies]
achievement = { git = "https://github.com/cartridge-gg/arcade", rev = "1c66ba7" }
quest = { git = "https://github.com/cartridge-gg/arcade", rev = "1c66ba7" }
leaderboard = { git = "https://github.com/cartridge-gg/arcade", rev = "1c66ba7" }
```

### 16.3 Build External Contracts

```toml
[[target.starknet-contract]]
build-external-contracts = [
    "dojo::world::world_contract::world",
    "game_components_token::examples::full_token_contract::FullTokenContract",
    "game_components_token::examples::minigame_registry_contract::MinigameRegistryContract",
    # ADD: Achievement models/events
    "achievement::models::index::m_AchievementDefinition",
    "achievement::models::index::m_AchievementCompletion",
    "achievement::models::index::m_AchievementAdvancement",
    "achievement::models::index::m_AchievementAssociation",
    "achievement::events::index::e_TrophyCreation",
    "achievement::events::index::e_TrophyProgression",
    "achievement::events::index::e_AchievementCompleted",
    "achievement::events::index::e_AchievementClaimed",
    # ADD: Quest models/events
    "quest::models::index::m_QuestDefinition",
    "quest::models::index::m_QuestCompletion",
    "quest::models::index::m_QuestAdvancement",
    "quest::models::index::m_QuestAssociation",
    "quest::models::index::m_QuestCondition",
    "quest::events::index::e_QuestCreation",
    "quest::events::index::e_QuestProgression",
    "quest::events::index::e_QuestUnlocked",
    "quest::events::index::e_QuestCompleted",
    "quest::events::index::e_QuestClaimed",
]
```

---

## 17. Migration Plan

### Phase 1: Foundation (Week 1)
**Goal:** Establish new patterns without breaking existing functionality

1. **Day 1-2: Store Pattern**
   - Create `store.cairo`
   - Update `lib.cairo` to export Store
   - Write Store tests

2. **Day 3-4: Model Organization**
   - Create `models/index.cairo`
   - Create `events/index.cairo`
   - Update imports where easy

3. **Day 5: Code Cleanup**
   - Remove `IncreasingDifficultyUtils`
   - Remove `generate_constraint()` dead code
   - Remove `ConstraintProgress` event
   - Delete orphaned type files

### Phase 2: Components (Week 2)
**Goal:** Introduce component architecture

1. **Day 1-2: Add Dependencies**
   - Add `achievement`, `quest` packages to Scarb.toml
   - Verify builds work

2. **Day 3-4: Create Components**
   - Create `components/` directory
   - Implement `PlayableComponent` (extract from game system)
   - Implement `InitializableComponent`

3. **Day 5: System Integration**
   - Update `game_system` to use components
   - Update `dojo_init` to initialize achievements/quests

### Phase 3: Achievement System (Week 2-3)
**Goal:** Full achievement integration

1. **Day 1-2: Restructure Elements**
   - Rename `trophies/` → `achievements/`
   - Create `achievements/index.cairo`
   - Create `tasks/index.cairo`

2. **Day 3-4: Update Achievement Logic**
   - Update achievement files to use Cartridge interfaces
   - Add progress calls to `PlayableComponent`

3. **Day 5: Quest System**
   - Create `quests/` directory
   - Implement daily quests
   - Add quest reward handling

### Phase 4: Testing & Refinement (Week 3)
**Goal:** Ensure everything works correctly

1. Test all achievement triggers
2. Test quest completion flow
3. Test component interactions
4. Performance testing
5. Documentation updates

---

## 18. Implementation Priority

### Critical (Must Do)
| Item | Effort | Impact |
|------|--------|--------|
| Store pattern | Medium | High - cleaner code |
| Fix lib.cairo (add orphaned modules) | Low | High - code actually compiles |
| Remove dead code | Low | Medium - cleaner codebase |
| Add achievement/quest dependencies | Low | High - enables features |

### High Priority
| Item | Effort | Impact |
|------|--------|--------|
| Components architecture | High | High - reusability |
| Achievement system integration | High | High - player engagement |
| Index files for models/events | Low | Medium - better organization |

### Medium Priority
| Item | Effort | Impact |
|------|--------|--------|
| Quest system | Medium | Medium - daily engagement |
| Interface extraction | Low | Low - cleaner systems |

### Low Priority (Nice to Have)
| Item | Effort | Impact |
|------|--------|--------|
| Additional mocks | Low | Low - testing |
| Expanded tests | Medium | Medium - reliability |

---

## Summary

This restructuring aligns zKube's contracts with modern Dojo best practices as demonstrated in the nums reference implementation. The key changes are:

1. **Store Pattern** - Centralized, typed world access
2. **Components** - Reusable logic separated from systems
3. **Achievement Integration** - Using Cartridge's arcade packages
4. **Quest System** - New daily engagement mechanics with cube rewards
5. **Code Organization** - Index files, proper module exports
6. **Cleanup** - Remove ~250 lines of dead code

The migration can be done incrementally over 3 weeks with minimal risk to existing functionality.
