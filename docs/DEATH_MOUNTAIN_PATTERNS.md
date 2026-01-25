# Death Mountain Architecture Patterns

This document captures architectural patterns from the Death Mountain codebase that can be applied to zkube.

## Overview

Death Mountain is a token-agnostic, on-chain dungeon crawler RPG built with Dojo. It demonstrates best practices for complex game systems, state management, and NFT integration.

## Project Structure Pattern

```
contracts/src/
├── lib.cairo                     # Module exports
├── systems/                      # Dojo game logic (thin orchestration)
│   ├── game/contracts.cairo      # Main game loop
│   ├── adventurer/contracts.cairo
│   ├── beast/contracts.cairo
│   ├── loot/contracts.cairo
│   ├── renderer/contracts.cairo
│   ├── game_token/contracts.cairo
│   ├── settings/contracts.cairo
│   └── objectives/contracts.cairo
├── models/                       # Data structures (Dojo models)
│   ├── game.cairo
│   ├── adventurer/
│   │   ├── adventurer.cairo
│   │   ├── stats.cairo
│   │   ├── equipment.cairo
│   │   └── bag.cairo
│   ├── beast.cairo
│   └── market.cairo
├── libs/                         # Pure functions (reusable, testable)
│   ├── game.cairo
│   └── settings.cairo
├── utils/                        # Utilities
│   ├── vrf.cairo
│   └── renderer/
└── constants/                    # Game parameters
```

### Key Insight: Systems vs Libs

**Systems** (`systems/`): Thin orchestration layers that:
- Handle storage reads/writes
- Coordinate between components
- Emit events
- Call into libs for logic

**Libs** (`libs/`): Pure functions that:
- Contain all complex business logic
- Are easily unit-testable
- Have no storage dependencies
- Can be reused across systems

## Game System Pattern

### Interface Definition
```cairo
#[starknet::interface]
pub trait IGameSystems<T> {
    // Game Actions
    fn start_game(ref self: T, adventurer_id: u64, weapon: u8);
    fn explore(ref self: T, adventurer_id: u64, till_beast: bool);
    fn attack(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn flee(ref self: T, adventurer_id: u64, to_the_death: bool);
    fn equip(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn drop(ref self: T, adventurer_id: u64, items: Array<u8>);
    fn buy_items(ref self: T, adventurer_id: u64, potions: u8, items: Array<ItemPurchase>);
    fn select_stat_upgrades(ref self: T, adventurer_id: u64, stat_upgrades: Stats);

    // Game State
    fn get_game_state(self: @T, adventurer_id: u64) -> GameState;
}
```

### Action Flow Pattern

Every game action follows this structure:

```cairo
fn action(ref self: ContractState, game_id: u64) {
    let mut world: WorldStorage = self.world(@DEFAULT_NS());

    // 1. Token Verification
    let token_address = _get_token_address(world);
    assert_token_ownership(token_address, game_id);
    pre_action(token_address, game_id);

    // 2. Load State
    let game_libs = _init_game_context(world);
    let (mut adventurer, bag) = game_libs.adventurer.load_assets(game_id);

    // 3. Validate Preconditions
    _assert_not_dead(adventurer);
    _assert_not_in_battle(adventurer);

    // 4. Execute Logic (via libs)
    let result = game_libs.some_system.do_action(adventurer, ...);

    // 5. Update State
    world.write_model(@AdventurerPacked { ... });

    // 6. Emit Events
    _emit_game_event(ref world, game_id, action_count, GameEventDetails::...);

    // 7. Finalize
    post_action(token_address, game_id);
}
```

## GameLibs Pattern

A struct that aggregates system dispatchers for cross-system calls:

```cairo
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub adventurer: IAdventurerSystemsDispatcher,
    pub beast: IBeastSystemsDispatcher,
    pub loot: ILootSystemsDispatcher,
    pub settings: ISettingsSystemsDispatcher,
}

#[generate_trait]
impl ImplGameLibs of GameLibsTrait {
    fn new(world: WorldStorage) -> GameLibs {
        let (adventurer_address, _) = world.dns(@"adventurer_systems").unwrap();
        let (beast_address, _) = world.dns(@"beast_systems").unwrap();
        let (loot_address, _) = world.dns(@"loot_systems").unwrap();
        let (settings_address, _) = world.dns(@"settings_systems").unwrap();

        GameLibs {
            adventurer: IAdventurerSystemsDispatcher { contract_address: adventurer_address },
            beast: IBeastSystemsDispatcher { contract_address: beast_address },
            loot: ILootSystemsDispatcher { contract_address: loot_address },
            settings: ISettingsSystemsDispatcher { contract_address: settings_address },
        }
    }
}
```

**Benefits:**
- Single initialization point
- Easy to mock for testing
- Clear dependency graph
- Reduces boilerplate in action functions

## Data Packing Pattern

Death Mountain aggressively packs data into felt252 for gas efficiency:

### Adventurer (222 bits in 1 felt252)
```cairo
pub impl PackingAdventurer of PackingTrait<Adventurer> {
    fn pack(self: Adventurer) -> felt252 {
        let mut packed: u256 = 0;
        packed = packed | self.health.into();
        packed = packed | (self.xp.into() * TWO_POW_10);
        packed = packed | (self.gold.into() * TWO_POW_25);
        packed = packed | (self.beast_health.into() * TWO_POW_34);
        packed = packed | (self.stat_upgrades_available.into() * TWO_POW_44);
        packed = packed | (self.stats.pack().into() * TWO_POW_48);
        packed = packed | (self.equipment.pack().into() * TWO_POW_78);
        packed = packed | (self.item_specials_seed.into() * TWO_POW_206);
        packed.try_into().unwrap()
    }
}
```

### Field Bit Allocations
| Field | Bits | Range |
|-------|------|-------|
| health | 10 | 0-1023 |
| xp | 15 | 0-32767 |
| gold | 9 | 0-511 |
| beast_health | 10 | 0-1023 |
| stat_upgrades | 4 | 0-15 |
| stats | 30 | 7 stats × ~4 bits |
| equipment | 128 | 8 slots × 16 bits |
| item_specials_seed | 16 | 0-65535 |

**Trade-offs:**
- Pro: Massive gas savings (1 storage slot vs many)
- Con: Packing/unpacking logic complexity
- Con: Hard to debug packed values

## Event Pattern

Structured game events for frontend consumption:

```cairo
#[derive(Copy, Drop, Serde)]
pub enum GameEventDetails {
    adventurer: Adventurer,
    beast: BeastEvent,
    attack: AttackEvent,
    discovery: DiscoveryEvent,
    obstacle: ObstacleEvent,
    level_up: LevelUpEvent,
    market_items: MarketItemsEvent,
    stat_upgrade: StatUpgradeEvent,
    item: ItemEvent,
    defeated_beast: DefeatedBeastEvent,
    fled_beast: FledBeastEvent,
    buy_items: BuyItemsEvent,
}

#[dojo::event]
#[derive(Drop, Serde)]
pub struct GameEvent {
    #[key]
    pub adventurer_id: u64,
    #[key]
    pub action_count: u16,
    pub details: GameEventDetails,
}
```

**Pattern:**
- Events are strongly typed enums
- Each event has specific data structure
- Action count provides ordering
- Frontend can reconstruct game history from events

## Renderer Pattern

On-chain SVG generation for NFT metadata:

```
utils/renderer/
├── renderer.cairo        # Main orchestration
├── encoding.cairo        # Base64/SVG encoding
├── components/           # Reusable UI components
│   ├── headers.cairo
│   ├── icons.cairo
│   └── ui.cairo
├── equipment/            # Equipment visualization
├── pages/                # Full page renderers
└── core/                 # Math and text utilities
```

### Renderer Interface
```cairo
#[starknet::interface]
pub trait IRendererSystems<T> {
    fn token_uri(self: @T, token_id: u256) -> ByteArray;
    fn render_adventurer(self: @T, adventurer_id: u64) -> ByteArray;
}
```

**Benefits:**
- NFT metadata is fully on-chain
- No external dependencies for images
- Can render dynamic game state
- Uses graffiti library for SVG generation

## VRF Integration Pattern

```cairo
// constants.cairo
const VRF_ENABLED: bool = true;

// utils/vrf.cairo
pub impl VRFImpl of VRFTrait {
    fn get_random(vrf_address: ContractAddress, seed: felt252, offset: u64) -> felt252 {
        if VRF_ENABLED {
            let vrf = IVRFDispatcher { contract_address: vrf_address };
            vrf.consume_random(seed, offset)
        } else {
            // Fallback for testing
            poseidon_hash_span(array![seed, offset.into()].span())
        }
    }
}
```

**Key Pattern:**
- VRF can be disabled for testing via constant
- Seed stored separately from main game state
- Random numbers derived via Poseidon hashing with offsets

## Settings Pattern

Configurable game parameters per token:

```cairo
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub token_id: u64,
    pub adventurer: Adventurer,
    pub bag: Bag,
    pub game_seed: u64,
    pub game_seed_until_xp: u32,
    pub in_battle: bool,
    pub market_size: u8,
    pub vrf_address: ContractAddress,
}
```

**Allows:**
- Different difficulty per token
- Custom starting conditions
- A/B testing game parameters
- Tournament-specific rules

## Model Organization Pattern

Related models grouped in subdirectories:

```
models/
├── adventurer/
│   ├── adventurer.cairo   # Main model + traits
│   ├── stats.cairo        # Stats struct
│   ├── equipment.cairo    # Equipment slots
│   ├── item.cairo         # Item struct
│   └── bag.cairo          # Inventory
├── beast.cairo
├── combat.cairo
├── market.cairo
└── game.cairo
```

Each model file contains:
1. Struct definition
2. Packing/unpacking impl
3. Trait with behavior methods
4. Related constants

## Testing Pattern

```cairo
#[cfg(test)]
mod tests {
    use super::*;
    use dojo_cairo_test::{spawn_test_world, NamespaceDef, TestResource};

    fn setup() -> (WorldStorage, ContractAddress) {
        let namespace_def = NamespaceDef {
            namespace: DEFAULT_NS(),
            resources: array![
                TestResource::Model(m_Game::TEST_CLASS_HASH.try_into().unwrap()),
                TestResource::Contract(game_systems::TEST_CLASS_HASH.try_into().unwrap()),
            ].span(),
        };
        spawn_test_world([namespace_def].span())
    }

    #[test]
    fn test_start_game() {
        let (world, game_address) = setup();
        // ... test logic
    }
}
```

## Key Takeaways for zkube

### 1. Separate Systems from Logic
Move complex game logic into `libs/` as pure functions, keeping systems thin.

### 2. Use GameLibs Pattern
Aggregate system dispatchers in a single struct for cleaner code.

### 3. Structured Events
Use typed event enums for frontend consumption.

### 4. Renderer System
Consider on-chain SVG rendering for game NFT metadata.

### 5. Settings Flexibility
Allow per-token game settings for tournaments and testing.

### 6. VRF Abstraction
Abstract VRF behind a trait that can be disabled for testing.

### 7. Model Organization
Group related models in subdirectories with clear naming.
