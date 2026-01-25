# zkube vs Death Mountain: Architecture Comparison

This document compares zkube's current implementation with Death Mountain's patterns to identify improvement opportunities.

## Architecture Overview

| Aspect | zkube | Death Mountain |
|--------|-------|----------------|
| Systems | 3 (game, config, achievement) | 8 (game, adventurer, beast, loot, renderer, settings, objectives, game_token) |
| Libs (pure logic) | None (logic in systems) | Yes (libs/game.cairo, libs/settings.cairo) |
| Models | 3 (Game, GameSeed, GameSettings) | 15+ (Adventurer, Beast, Item, Bag, Market, etc.) |
| Events | 2 (StartGame, UseBonus) | 12+ (via GameEventDetails enum) |
| Renderer | None (external) | Full on-chain SVG |
| VRF | Hardcoded provider | Abstracted with toggle |

## Detailed Comparison

### 1. System Organization

**zkube (current):**
```
systems/
├── game.cairo         # All game logic in one file
├── config.cairo       # Settings management
└── achievement.cairo  # Removed/stubbed
```

**Death Mountain:**
```
systems/
├── game/contracts.cairo       # Main loop (thin orchestration)
├── adventurer/contracts.cairo # Character management
├── beast/contracts.cairo      # Enemy system
├── loot/contracts.cairo       # Item database
├── renderer/contracts.cairo   # NFT metadata
├── settings/contracts.cairo   # Configuration
├── objectives/contracts.cairo # Achievements
└── game_token/contracts.cairo # Token integration
```

**Gap:** zkube has all game logic in one file (game.cairo). Death Mountain separates concerns into focused systems.

### 2. Logic Separation

**zkube:**
```cairo
// Game logic directly in system
fn move(ref self: ContractState, game_id: u64, ...) {
    // Token validation
    // Game logic
    // State update
    // All in one place
}
```

**Death Mountain:**
```cairo
// System is thin orchestration
fn explore(ref self: ContractState, adventurer_id: u64, ...) {
    let game_libs = _init_game_context(world);
    let (mut adventurer, mut bag) = game_libs.adventurer.load_assets(adventurer_id);

    // Delegate to pure function
    _explore(ref world, ref adventurer, ref bag, ...);

    _save_adventurer(ref world, ref adventurer, ...);
}
```

**Gap:** zkube lacks a `libs/` layer for pure business logic. This makes testing harder and logic less reusable.

### 3. Event Structure

**zkube:**
```cairo
#[dojo::event]
pub struct StartGame {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
}

#[dojo::event]
pub struct UseBonus {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
    pub bonus: Bonus,
}
```

**Death Mountain:**
```cairo
#[derive(Copy, Drop, Serde)]
pub enum GameEventDetails {
    adventurer: Adventurer,
    beast: BeastEvent,
    attack: AttackEvent,
    discovery: DiscoveryEvent,
    obstacle: ObstacleEvent,
    level_up: LevelUpEvent,
    // ... 12 event types
}

#[dojo::event]
pub struct GameEvent {
    #[key]
    pub adventurer_id: u64,
    #[key]
    pub action_count: u16,
    pub details: GameEventDetails,
}
```

**Gap:** zkube has basic events. Death Mountain uses a typed enum for all game events, enabling rich event-driven UI.

### 4. VRF Integration

**zkube:**
```cairo
// Hardcoded in constants.cairo
pub const VRF_PROVIDER_ADDRESS: ContractAddress = ...;

// Hardcoded in frontend
export const VRF_PROVIDER_ADDRESS = "0x051fea...";
```

**Death Mountain:**
```cairo
// Toggle for testing
const VRF_ENABLED: bool = true;

// VRF address in settings
pub struct GameSettings {
    pub vrf_address: ContractAddress,
}

// Abstracted usage
impl VRFImpl of VRFTrait {
    fn get_random(vrf_address, seed, offset) -> felt252 {
        if VRF_ENABLED {
            // Real VRF
        } else {
            // Test fallback
        }
    }
}
```

**Gap:** zkube hardcodes VRF. Death Mountain abstracts it, making testing and network switching easier.

### 5. Model Structure

**zkube:**
```cairo
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    pub blocks: felt252,      // 240 bits packed
    pub next_row: u32,
    pub score: u16,
    pub moves: u16,
    pub combo_counter: u16,
    pub max_combo: u8,
    pub hammer_bonus: u8,
    pub wave_bonus: u8,
    pub totem_bonus: u8,
    pub hammer_used: u8,
    pub wave_used: u8,
    pub totem_used: u8,
    pub over: bool,
}
```

**Death Mountain:**
```cairo
// Split into focused models
#[dojo::model]
pub struct AdventurerPacked {
    #[key]
    pub adventurer_id: u64,
    pub packed: felt252,  // 222 bits packed
}

// Separate models for different concerns
pub struct Adventurer { health, xp, gold, stats, equipment, ... }
pub struct Bag { item1, item2, ..., mutated }
pub struct AdventurerEntropy { beast_seed, market_seed }
```

**Gap:** zkube's Game model is flat. Death Mountain splits concerns (character, inventory, entropy).

### 6. Token Integration

**zkube:**
```cairo
// Direct token dispatcher calls in game system
let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
```

**Death Mountain:**
```cairo
// Dedicated game_token system
// Token address retrieved via helper
fn _get_token_address(world: WorldStorage) -> ContractAddress {
    let (token_address, _) = world.dns(@"game_token_systems").unwrap();
    token_address
}
```

**Gap:** zkube mixes token calls in game system. Death Mountain has a dedicated token system.

### 7. Settings Management

**zkube:**
```cairo
// Settings fetched per-action
let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);
let difficulty: Difficulty = game_settings.get_difficulty();
```

**Death Mountain:**
```cairo
// Settings stored per-token with full context
pub struct GameSettings {
    pub adventurer: Adventurer,
    pub bag: Bag,
    pub game_seed: u64,
    pub game_seed_until_xp: u32,
    pub in_battle: bool,
    pub market_size: u8,
    pub vrf_address: ContractAddress,
}
```

**Gap:** zkube settings are minimal. Death Mountain settings include full game configuration.

### 8. Achievement System

**zkube:**
```cairo
fn handle_game_over(ref self: ContractState, _game: Game) {
    // Achievement system removed - no-op for now
}
```

**Death Mountain:**
```cairo
// Dedicated objectives system
mod objectives_systems {
    fn track_objective(adventurer_id, objective_type, value);
    fn complete_objective(adventurer_id, objective_id);
    fn get_objectives(adventurer_id) -> Array<Objective>;
}
```

**Gap:** zkube achievement system is stubbed. Death Mountain has full objectives tracking.

### 9. On-Chain Rendering

**zkube:**
- No on-chain renderer
- NFT metadata presumably external

**Death Mountain:**
```cairo
// Full SVG rendering system
mod renderer_systems {
    fn token_uri(token_id) -> ByteArray;
    fn render_adventurer(adventurer_id) -> ByteArray;
}

// Component library
utils/renderer/
├── components/  # Headers, icons, UI elements
├── equipment/   # Equipment visualization
├── pages/       # Full page layouts
└── core/        # SVG primitives
```

**Gap:** zkube has no on-chain rendering. Death Mountain generates full SVG NFT metadata on-chain.

## Summary of Gaps

### High Priority

| Gap | Impact | Effort |
|-----|--------|--------|
| No libs layer | Testing difficulty, code reuse | Medium |
| Hardcoded VRF | Testing difficulty, network flexibility | Low |
| Basic events | Limited UI feedback | Medium |
| Stubbed achievements | Missing feature | High |

### Medium Priority

| Gap | Impact | Effort |
|-----|--------|--------|
| Flat model structure | Maintainability | Medium |
| No token system | Separation of concerns | Medium |
| Minimal settings | Configurability | Low |

### Nice to Have

| Gap | Impact | Effort |
|-----|--------|--------|
| No on-chain renderer | NFT metadata independence | High |
| Single game system | File size, maintainability | Medium |

## Recommendations

1. **Extract libs layer** - Move controller logic to pure functions in `libs/game.cairo`

2. **Abstract VRF** - Create VRF trait with test fallback, store address in settings

3. **Enhance events** - Create `GameEventDetails` enum for typed game events

4. **Reactivate achievements** - Implement via IMinigameObjectives interface

5. **Split systems** - Consider separate bonus_system, renderer_system

6. **Improve settings** - Add more configurable parameters per-token

7. **Add GameLibs** - Aggregate dispatchers for cleaner cross-system calls
