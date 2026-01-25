# zkube Refactoring Plan

Based on analysis of death-mountain, dark-shuffle, game-components, and the current zkube implementation, this plan outlines improvements to make the architecture cleaner, more testable, and better aligned with Provable Games patterns.

## Goals

1. **Cleaner separation of concerns** - Split monolithic systems into focused modules
2. **Better testability** - Extract pure functions into libs
3. **Improved configurability** - Abstract hardcoded values
4. **Enhanced events** - Rich typed events for frontend
5. **Reactivate features** - Achievement system, renderer
6. **Performance** - Batch actions, overflow-safe arithmetic (from dark-shuffle)

## Phase 1: Foundation (Low Risk, High Impact)

### 1.1 Extract Game Logic to Libs

**Current:** All game logic in `systems/game.cairo`

**Target:** Pure functions in `libs/game.cairo`

```
contracts/src/
├── libs/                      # NEW
│   ├── game.cairo             # Pure game logic
│   └── bonus.cairo            # Pure bonus calculations
├── systems/
│   └── game.cairo             # Thin orchestration (uses libs)
```

**Changes:**
- Create `libs/game.cairo` with pure functions:
  ```cairo
  pub fn calculate_bonuses(score: u16, combo: u16, max_combo: u8) -> (u8, u8, u8);
  pub fn validate_move(blocks: felt252, row: u8, start: u8, final_index: u8) -> bool;
  pub fn is_game_over(blocks: felt252) -> bool;
  ```
- Move controller logic from helpers to libs
- Keep systems thin - only storage, events, and lib calls

**Benefits:**
- Pure functions are easily unit testable
- Logic reusable across systems
- Clearer separation of concerns

### 1.2 Abstract VRF Integration

**Current:** Hardcoded VRF address in constants and frontend

**Target:** Configurable VRF with test fallback

```cairo
// libs/vrf.cairo
const VRF_ENABLED: bool = true;

#[generate_trait]
pub impl VRFImpl of VRFTrait {
    fn get_random(vrf_address: ContractAddress, seed: felt252, offset: u64) -> felt252 {
        if VRF_ENABLED {
            let vrf = IVRFDispatcher { contract_address: vrf_address };
            vrf.consume_random(seed, offset)
        } else {
            poseidon_hash_span(array![seed, offset.into()].span())
        }
    }
}
```

**Changes:**
- Create `libs/vrf.cairo` with VRFTrait
- Store VRF address in GameSettings model
- Add VRF toggle for testing
- Update frontend to read VRF address from manifest or env

**Benefits:**
- Tests can run without VRF mock
- Easy network switching
- Single source of truth

### 1.3 Create GameLibs Aggregator

**Current:** Scattered dispatcher creation in systems

**Target:** Single aggregator for cross-system calls

```cairo
// libs/context.cairo
#[derive(Copy, Drop)]
pub struct GameContext {
    pub game_address: ContractAddress,
    pub token_address: ContractAddress,
    pub settings_address: ContractAddress,
    pub vrf_address: ContractAddress,
}

pub fn init_context(world: WorldStorage) -> GameContext {
    let (game_address, _) = world.dns(@"game_system").unwrap();
    let (token_address, _) = world.dns(@"token").unwrap();
    // ...
    GameContext { game_address, token_address, settings_address, vrf_address }
}
```

**Benefits:**
- Single initialization point
- Easy to mock for testing
- Reduces boilerplate

### 1.4 Nested Configuration Structs (from dark-shuffle)

**Current:** Flat GameSettings model

**Target:** Nested configuration for better organization

```cairo
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub grid: GridSettings,
    pub scoring: ScoringSettings,
    pub bonus: BonusSettings,
    pub difficulty: DifficultySettings,
}

pub struct GridSettings {
    pub width: u8,
    pub height: u8,
    pub colors_count: u8,
}

pub struct ScoringSettings {
    pub points_per_line: u16,
    pub combo_multiplier: u8,
}

pub struct BonusSettings {
    pub enabled: bool,
    pub hammer_unlock_score: u16,
    pub wave_unlock_score: u16,
    pub totem_unlock_combo: u8,
}

pub struct DifficultySettings {
    pub mode: DifficultyMode,      // Fixed or Increasing
    pub starting_difficulty: Difficulty,
    pub increase_threshold: u16,   // Moves before difficulty bump
}
```

**Benefits:**
- Related settings grouped logically
- Easier to extend specific areas
- Cleaner API for tournaments

### 1.5 Overflow-Safe Arithmetic (from dark-shuffle)

**Pattern:** Use Cairo's OverflowingAdd/Sub for bounded game values.

```cairo
use core::num::traits::{OverflowingAdd, OverflowingSub};

fn add_score(ref game: Game, points: u16) {
    let (result, overflow) = OverflowingAdd::overflowing_add(game.score, points);
    game.score = if overflow { U16_MAX } else { result };
}

fn add_combo(ref game: Game) {
    let (result, overflow) = OverflowingAdd::overflowing_add(game.combo_counter, 1);
    game.combo_counter = if overflow { U16_MAX } else { result };
}
```

**Applies to:**
- Score calculation
- Combo counter
- Bonus counts

## Phase 2: Events & UI (Medium Risk, High Impact)

### 2.1 Typed Game Events

**Current:** Basic StartGame and UseBonus events

**Target:** Comprehensive event enum

```cairo
// events.cairo
#[derive(Copy, Drop, Serde)]
pub enum GameEventDetails {
    game_started: GameStartedEvent,
    move_made: MoveMadeEvent,
    lines_cleared: LinesClearedEvent,
    bonus_used: BonusUsedEvent,
    bonus_earned: BonusEarnedEvent,
    game_over: GameOverEvent,
    combo_achieved: ComboAchievedEvent,
}

#[derive(Copy, Drop, Serde)]
pub struct MoveMadeEvent {
    pub row_index: u8,
    pub start_index: u8,
    pub final_index: u8,
    pub blocks_before: felt252,
    pub blocks_after: felt252,
}

#[derive(Copy, Drop, Serde)]
pub struct LinesClearedEvent {
    pub count: u8,
    pub combo: u8,
    pub points: u16,
}

#[dojo::event]
pub struct GameEvent {
    #[key]
    pub game_id: u64,
    #[key]
    pub move_count: u16,
    pub details: GameEventDetails,
}
```

**Benefits:**
- Frontend can show detailed feedback
- Game replay possible from events
- Better analytics

### 2.2 Enhance Settings Model

**Current:** Minimal GameSettings

**Target:** Comprehensive per-token settings

```cairo
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    // Difficulty
    pub difficulty: Difficulty,
    pub difficulty_mode: DifficultyMode,  // Fixed or Increasing
    // Grid
    pub grid_width: u8,
    pub grid_height: u8,
    // Bonuses
    pub bonuses_enabled: bool,
    pub hammer_unlock_score: u16,
    pub wave_unlock_score: u16,
    pub totem_unlock_combo: u8,
    // VRF
    pub vrf_address: ContractAddress,
    // Time limits
    pub move_timeout: u64,  // 0 = no timeout
}
```

**Benefits:**
- Tournament customization
- A/B testing
- Feature toggles

## Phase 3: Achievement System (Medium Risk, High Value)

### 3.1 Implement IMinigameObjectives

**Current:** Achievement system stubbed

**Target:** Full objectives tracking via game-components

```cairo
// systems/objectives.cairo
use game_components_minigame::extensions::objectives::IMinigameObjectives;

#[abi(embed_v0)]
impl ObjectivesImpl of IMinigameObjectives<ContractState> {
    fn get_objectives(self: @ContractState, token_id: u64) -> Array<Objective> {
        // Load from world
    }

    fn complete_objective(ref self: ContractState, token_id: u64, objective_id: u32) {
        // Mark complete, emit event
    }
}
```

**Objectives to track:**
- Mastering: Total combos (10, 50, 100)
- Chaining: Max combo in game (3, 6, 9)
- Playing: Total moves (100, 500, 1000)
- Scoring: High score (100, 500, 1000)
- Cumulative: Total score across games

### 3.2 Reactivate Achievement Processing

```cairo
// systems/game.cairo
fn handle_game_over(ref self: ContractState, game: Game) {
    let objectives_address = self.objectives_address();
    if objectives_address != starknet::contract_address_const::<0>() {
        let objectives = IMinigameObjectivesDispatcher { contract_address: objectives_address };

        // Check combo achievements
        if game.combo_counter >= 100 {
            objectives.complete_objective(game.game_id, OBJECTIVE_COMBO_MASTER);
        }

        // Check score achievements
        if game.score >= 1000 {
            objectives.complete_objective(game.game_id, OBJECTIVE_SCORE_MASTER);
        }

        // ... more checks
    }
}
```

## Phase 4: System Split (Lower Priority)

### 4.1 Separate Bonus System

**Current:** Bonus logic in game.cairo

**Target:** Dedicated bonus_system.cairo

```cairo
// systems/bonus.cairo
#[starknet::interface]
trait IBonusSystem<T> {
    fn apply_hammer(ref self: T, game_id: u64, row: u8, col: u8);
    fn apply_wave(ref self: T, game_id: u64, row: u8);
    fn apply_totem(ref self: T, game_id: u64, col: u8);
    fn get_available_bonuses(self: @T, game_id: u64) -> (u8, u8, u8);
}
```

### 4.2 Renderer System (Optional)

**If on-chain NFT metadata desired:**

```cairo
// systems/renderer.cairo
#[starknet::interface]
trait IRendererSystem<T> {
    fn token_uri(self: @T, token_id: u256) -> ByteArray;
    fn render_game(self: @T, game_id: u64) -> ByteArray;
}
```

Would generate SVG showing:
- Current grid state
- Score and stats
- Bonuses available
- Game history

## Phase 5: Frontend Alignment

### 5.1 Event Subscription

Update frontend to subscribe to new event types:

```typescript
// New event handling
const handleGameEvent = (event: GameEvent) => {
  switch (event.details.type) {
    case 'lines_cleared':
      showComboAnimation(event.details.count, event.details.combo);
      break;
    case 'bonus_earned':
      showBonusNotification(event.details.bonus_type);
      break;
    // ...
  }
};
```

### 5.2 Settings UI

Add settings selection before game start:
- Difficulty selector (including Increasing mode)
- Bonus toggle
- Tournament context (if any)

### 5.3 Achievement Display

Show objective progress:
- In-game progress bars
- Game-over summary
- Profile achievements page

## Migration Strategy

### Step 1: Non-Breaking Additions
- Add libs/ layer (no system changes)
- Add new events alongside existing
- Add settings fields with defaults

### Step 2: Gradual Refactor
- Systems call libs instead of inline logic
- New events replace old (keep both temporarily)
- Tests migrate to use libs directly

### Step 3: Deprecation
- Remove inline logic from systems
- Remove old events
- Update frontend to use new patterns

### Step 4: Feature Activation
- Enable objectives system
- Enable renderer (if implemented)
- Enable new settings

## File Changes Summary

### New Files
```
contracts/src/libs/
├── game.cairo           # Pure game logic
├── bonus.cairo          # Pure bonus calculations
├── vrf.cairo            # VRF abstraction
└── context.cairo        # GameContext aggregator

contracts/src/systems/
└── objectives.cairo     # Achievement system

contracts/src/events/
└── game_events.cairo    # Typed event enum
```

### Modified Files
```
contracts/src/systems/game.cairo      # Thin orchestration
contracts/src/models/config.cairo     # Enhanced settings
contracts/src/constants.cairo         # Remove hardcoded VRF
```

### Frontend Changes
```
client-budokan/src/dojo/systems.ts    # Event handling
client-budokan/src/dojo/setup.ts      # Event subscriptions
client-budokan/src/hooks/             # Achievement hooks
```

## Testing Strategy

### Unit Tests (libs/)
```cairo
#[test]
fn test_calculate_bonuses() {
    let (hammer, wave, totem) = calculate_bonuses(score: 100, combo: 10, max_combo: 5);
    assert!(hammer == 1, "hammer calculation wrong");
}
```

### Integration Tests (systems/)
```cairo
#[test]
fn test_move_emits_events() {
    // Setup
    // Move
    // Assert events emitted
}
```

### E2E Tests (frontend)
- Game creation flow
- Move with combo
- Bonus application
- Achievement unlock

## Success Criteria

- [ ] All game logic in libs/ with 90%+ test coverage
- [ ] VRF abstracted and configurable per network
- [ ] All game actions emit typed events
- [ ] Objectives system functional
- [ ] Frontend displays real-time feedback from events
- [ ] Settings configurable per tournament
- [ ] No breaking changes to existing games

## References

### Documentation
- `/home/djizus/zkube/docs/GAME_COMPONENTS_REFERENCE.md` - game-components interfaces
- `/home/djizus/zkube/docs/DEATH_MOUNTAIN_PATTERNS.md` - death-mountain patterns (RPG, rendering)
- `/home/djizus/zkube/docs/DARK_SHUFFLE_PATTERNS.md` - dark-shuffle patterns (cards, batching)
- `/home/djizus/zkube/docs/ZKUBE_VS_DEATH_MOUNTAIN.md` - gap analysis
- `/home/djizus/zkube/docs/AGENT_QUICKSTART.md` - quick reference for Claude agents

### Reference Implementations
- `/home/djizus/zkube/references/death-mountain/` - RPG game (rendering, VRF, complex systems)
- `/home/djizus/zkube/references/dark-shuffle/` - Card game (batching, effects, state machine)
- `/home/djizus/zkube/references/game-components/` - Framework source
- `/home/djizus/zkube/references/budokan/` - Tournament system
- `/home/djizus/zkube/references/graffiti/` - SVG rendering library
