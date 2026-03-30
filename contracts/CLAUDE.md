# zKube Smart Contracts

## Overview

Cairo 2.13.1 contracts using Dojo 1.8.0. Zone-based puzzle game: 10-level zones with boss at L10, endless mode, theme-bound mutators, daily challenges. No skills, no cubes, no quests, no achievements — stars are the only progression signal.

## Directory Structure

```
contracts/
├── src/
│   ├── lib.cairo
│   ├── constants.cairo          # Namespace: zkube_jc_sepolia_v1
│   ├── events.cairo             # 5 events
│   ├── models/
│   │   ├── game.cairo           # Game, GameSeed, GameLevel
│   │   ├── player.cairo         # PlayerMeta, PlayerBestRun
│   │   ├── config.cairo         # GameSettings, GameSettingsMetadata
│   │   ├── entitlement.cairo    # MapEntitlement
│   │   ├── daily.cairo          # DailyChallenge, DailyEntry, DailyLeaderboard, GameChallenge
│   │   ├── zone.cairo           # ZoneConfig
│   │   └── mutator.cairo        # MutatorDef
│   ├── systems/
│   │   ├── game.cairo           # create, create_run, surrender + MinigameComponent
│   │   ├── moves.cairo          # move (auto-advance, mode-aware)
│   │   ├── grid.cairo           # initialize_grid, execute_move, assess_grid
│   │   ├── level.cairo          # initialize_level, finalize_level
│   │   ├── config.cairo         # GameSettings CRUD + IMinigameSettings
│   │   ├── renderer.cairo       # NFT metadata + SVG
│   │   ├── daily_challenge.cairo # create, register, submit, settle, claim
│   │   ├── zone.cairo           # register_zone, get_zone
│   │   └── mutator.cairo        # register_mutator, get_mutator
│   ├── helpers/                 # 20 helper modules
│   ├── types/                   # 9 type modules
│   ├── elements/difficulties/   # Block weight tables per difficulty
│   ├── external/                # FullTokenContract, MinigameRegistryContract
│   └── tests/
├── Scarb.toml
├── dojo_slot.toml
└── torii_slot.toml
```

## Models

### Game — key: `game_id (felt252)`

```cairo
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: felt252,       // Packed ERC721 token_id
    pub blocks: felt252,        // 240 bits: 10×8 grid, 3 bits per block
    pub next_row: u32,          // 24 bits pre-generated
    pub combo_counter: u8,
    pub max_combo: u8,
    pub run_data: felt252,      // 102 bits packed RunData
    pub level_stars: felt252,   // 20 bits (2 bits × 10 levels)
    pub started_at: u64,
    pub over: bool,
}
```

**RunData bit layout (102 bits):**

```
Bits 0-7:     current_level (u8)
Bits 8-15:    level_score (u8)
Bits 16-23:   level_moves (u8)
Bits 24-31:   constraint_progress (u8)
Bits 32-39:   constraint_2_progress (u8)
Bits 40-47:   max_combo_run (u8)
Bits 48-79:   total_score (u32)
Bit 80:       zone_cleared (bool)
Bits 81-88:   current_difficulty (u8)
Bits 89-92:   zone_id (u4)
Bits 93-100:  active_mutator_id (u8)
Bit 101:      mode (u1)  — 0=Map, 1=Endless
```

### GameSeed — key: `game_id (felt252)`

```cairo
pub struct GameSeed {
    pub game_id: felt252,
    pub seed: felt252,
    pub level_seed: felt252,
    pub vrf_enabled: bool,
}
```

### GameLevel — key: `game_id (felt252)`

```cairo
pub struct GameLevel {
    pub game_id: felt252,
    pub level: u8,
    pub points_required: u16,
    pub max_moves: u16,
    pub difficulty: u8,
    pub constraint_type: u8,
    pub constraint_value: u8,
    pub constraint_count: u8,
    pub constraint2_type: u8,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    pub constraint3_type: u8,
    pub constraint3_value: u8,
    pub constraint3_count: u8,
    pub mutator_id: u8,
}
```

### PlayerMeta — key: `player (ContractAddress)`

```cairo
pub struct PlayerMeta {
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed MetaData (32 bits)
    pub best_level: u8,
}
```

**MetaData bit layout (32 bits):**

```
Bits 0-15:    total_runs (u16)
Bits 16-31:   daily_stars (u16)
```

### PlayerBestRun — keys: `player (ContractAddress)`, `settings_id (u32)`, `mode (u8)`

```cairo
pub struct PlayerBestRun {
    pub player: ContractAddress,
    pub settings_id: u32,
    pub mode: u8,
    pub best_score: u32,
    pub best_stars: u8,
    pub best_level: u8,
    pub map_cleared: bool,
    pub best_game_id: felt252,
}
```

### GameSettings — key: `settings_id (u32)`

Full configurable settings including: `base_moves`, `max_moves`, `base_ratio_x100`, `max_ratio_x100`, `starting_difficulty`, `difficulty_step_levels`, `constraints_enabled`, `constraint_start_level`, `early_variance_percent`, `mid_variance_percent`, `late_variance_percent`, `early_level_threshold`, `mid_level_threshold`, `level_cap`, block weight parameters, endless difficulty thresholds and multipliers.

### GameSettingsMetadata — key: `settings_id (u32)`

```cairo
pub struct GameSettingsMetadata {
    pub settings_id: u32,
    pub name: felt252,
    pub description: ByteArray,
    pub theme_id: u8,
    pub is_free: bool,
    pub enabled: bool,
    pub price: u256,
    pub payment_token: ContractAddress,
}
```

### MapEntitlement — keys: `player (ContractAddress)`, `settings_id (u32)`

```cairo
pub struct MapEntitlement {
    pub player: ContractAddress,
    pub settings_id: u32,
    pub purchased_at: u64,
}
```

### ZoneConfig — key: `zone_id (u8)`

```cairo
pub struct ZoneConfig {
    pub zone_id: u8,
    pub settings_id: u32,
    pub theme_id: u8,
    pub name: felt252,
    pub mutator_count: u8,
    pub enabled: bool,
}
```

### MutatorDef — key: `mutator_id (u8)`

```cairo
pub struct MutatorDef {
    pub mutator_id: u8,
    pub name: felt252,
    pub zone_id: u8,
    pub moves_modifier: u8,              // Bias value
    pub ratio_modifier: u8,
    pub difficulty_offset: u8,
    pub combo_score_mult_x100: u8,
    pub star_threshold_modifier: u8,
    pub endless_ramp_mult_x100: u8,
}
```

### Daily models — `models/daily.cairo`

- **DailyChallenge** — key: `challenge_id (u64)`: seed, settings_id, mode, start_time, end_time, prize_pool, settled
- **DailyEntry** — keys: `challenge_id (u64)`, `player (ContractAddress)`: game_id, score, stars, submitted_at
- **DailyLeaderboard** — keys: `challenge_id (u64)`, `rank (u32)`: player, score, stars
- **GameChallenge** — key: `game_id (felt252)`: challenge_id

## Systems

### game_system (`systems/game.cairo`)

```cairo
trait IGameSystem<T> {
    fn create(ref self: T, game_id: felt252, mode: u8);
    fn create_run(ref self: T, game_id: felt252);
    fn surrender(ref self: T, game_id: felt252);
}
```

- Reads: token metadata (settings_id), GameSettings, MapEntitlement
- Writes: Game, GameSeed, GameLevel, PlayerMeta
- Implements MinigameComponent from embeddable game standard
- Calls VRF (mainnet/sepolia) or pseudo-random (slot/katana) for seed

### move_system (`systems/moves.cairo`)

```cairo
trait IMoveSystem<T> {
    fn move(ref self: T, game_id: felt252, row_index: u8, start_index: u8, final_index: u8);
}
```

- Reads: Game, GameLevel, GameSeed, GameSettings
- Writes: Game, GameLevel, PlayerMeta, PlayerBestRun
- Map mode: checks level completion (score threshold + constraints met), auto-advances to next level
- Endless mode: checks difficulty scaling via score thresholds, game over when grid fills

### grid_system (`systems/grid.cairo`)

```cairo
trait IGridSystem<T> {
    fn initialize_grid(ref self: T, game_id: felt252, seed: felt252, difficulty: u8, settings: @GameSettings);
    fn execute_move(ref self: T, game_id: felt252, row_index: u8, start_index: u8, final_index: u8) -> (felt252, u8, u8);
    fn assess_grid(ref self: T, game_id: felt252) -> bool;
}
```

- Internal system called by move_system and game_system
- Handles block placement, gravity, line clearing

### level_system (`systems/level.cairo`)

```cairo
trait ILevelSystem<T> {
    fn initialize_level(ref self: T, game_id: felt252, level: u8, seed: felt252, settings: @GameSettings);
    fn initialize_endless_level(ref self: T, game_id: felt252, settings: @GameSettings);
    fn finalize_level(ref self: T, game_id: felt252) -> u8;
}
```

- Writes: GameLevel
- Generates constraints, difficulty, points_required, max_moves for each level
- Boss at level 10: dual/triple constraints from boss identity system

### config_system (`systems/config.cairo`)

```cairo
trait IConfigSystem<T> {
    fn add_game_settings(ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty) -> u32;
    fn add_custom_game_settings(ref self: T, /* full parameter set */) -> u32;
    fn update_game_settings(ref self: T, settings_id: u32, /* parameters */);
    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
    fn set_map_price(ref self: T, settings_id: u32, price: u256, payment_token: ContractAddress);
    fn purchase_map(ref self: T, settings_id: u32);
}
```

- Implements `IMinigameSettings` from embeddable game standard
- dojo_init: creates default settings for each map (settings_id 0, 1, 2)

### renderer_system (`systems/renderer.cairo`)

```cairo
trait IRendererSystem<T> {
    fn create_metadata(self: @T, game_id: felt252) -> ByteArray;
    fn generate_svg(self: @T, game_id: felt252) -> ByteArray;
    fn generate_details(self: @T, game_id: felt252) -> Span<GameDetail>;
}
```

- Implements `IMinigameDetails` and `IMinigameDetailsSVG`
- Read-only; no model writes

### daily_challenge_system (`systems/daily_challenge.cairo`)

```cairo
trait IDailyChallengeSystem<T> {
    fn create(ref self: T, challenge_id: u64, settings_id: u32, mode: u8, seed: felt252, start_time: u64, end_time: u64, prize_pool: u256);
    fn register(ref self: T, challenge_id: u64) -> felt252;
    fn submit(ref self: T, game_id: felt252);
    fn settle(ref self: T, challenge_id: u64);
    fn claim(ref self: T, challenge_id: u64);
}
```

- Admin-only: `create`
- Writes: DailyChallenge, DailyEntry, DailyLeaderboard, GameChallenge
- Leaderboard ranked by depth-then-score

### zone_system (`systems/zone.cairo`)

```cairo
trait IZoneSystem<T> {
    fn register_zone(ref self: T, zone_id: u8, settings_id: u32, theme_id: u8, name: felt252, mutator_count: u8);
    fn get_zone(self: @T, zone_id: u8) -> ZoneConfig;
}
```

- Admin-only: `register_zone`
- Writes: ZoneConfig

### mutator_system (`systems/mutator.cairo`)

```cairo
trait IMutatorSystem<T> {
    fn register_mutator(ref self: T, mutator_id: u8, name: felt252, zone_id: u8, moves_modifier: u8, ratio_modifier: u8, difficulty_offset: u8, combo_score_mult_x100: u8, star_threshold_modifier: u8, endless_ramp_mult_x100: u8);
    fn get_mutator(self: @T, mutator_id: u8) -> MutatorDef;
}
```

- Admin-only: `register_mutator`
- Writes: MutatorDef
- Mutator hooks (`modify_level_config`, `modify_score`, `modify_block_weights`) are currently no-op

## Types

### Difficulty (`types/difficulty.cairo`)

| Value | Name |
|-------|------|
| 0 | None |
| 1 | VeryEasy |
| 2 | Easy |
| 3 | Medium |
| 4 | MediumHard |
| 5 | Hard |
| 6 | VeryHard |
| 7 | Expert |
| 8 | Master |
| 9 | Increasing |

### ConstraintType (`types/constraint.cairo`)

| Value | Name | Regular Levels | Boss Only |
|-------|------|:-:|:-:|
| 0 | None | yes | — |
| 1 | ComboLines | yes | yes |
| 2 | BreakBlocks | yes | yes |
| 3 | ComboStreak | yes | yes |
| 4 | KeepGridBelow | — | yes |

### GameMode (`types/mode.cairo`)

| Value | Name |
|-------|------|
| 0 | Map |
| 1 | Endless |

### LevelConfig (`types/level.cairo`)

```cairo
pub struct LevelConfig {
    pub points_required: u16,
    pub max_moves: u16,
    pub difficulty: Difficulty,
    pub constraint_type: ConstraintType,
    pub constraint_value: u8,
    pub constraint_count: u8,
    pub constraint2_type: ConstraintType,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    pub constraint3_type: ConstraintType,
    pub constraint3_value: u8,
    pub constraint3_count: u8,
    pub mutator_id: u8,
}
```

### Mutator system

- Pool of up to 32 mutators per zone (bitmask in GameSettings: `allowed_mutators`)
- Map mode: rolls from zone's gated pool at game start
- Endless mode: rolls from full pool
- Effects currently no-op; hooks defined for future implementation

## Events (`events.cairo`)

| Event | Fields |
|-------|--------|
| StartGame | game_id (felt252), player (ContractAddress), settings_id (u32), mode (u8), timestamp (u64) |
| LevelStarted | game_id (felt252), level (u8), difficulty (u8), points_required (u16), max_moves (u16) |
| LevelCompleted | game_id (felt252), level (u8), score (u32), stars (u8), moves_used (u16) |
| RunEnded | game_id (felt252), player (ContractAddress), total_score (u32), total_stars (u8), zone_cleared (bool) |
| ConstraintProgress | game_id (felt252), constraint_type (u8), progress (u8), target (u8) |

## Constants (`constants.cairo`)

```cairo
pub fn DEFAULT_NS() -> ByteArray { "zkube_jc_sepolia_v1" }

pub const BLOCK_SIZE: u8 = 8;        // blocks per row
pub const BLOCK_BIT_COUNT: u8 = 3;   // bits per block
pub const ROW_BIT_COUNT: u8 = 24;    // bits per row
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;
```

## Grid Encoding

Grid stored as `felt252` (240 bits):
- 10 rows × 8 columns × 3 bits per block
- Block values: 0 = empty, 1–4 = block sizes
- Row 0 = bottom, Row 9 = top
- Each row occupies 24 bits

## Dependencies (`Scarb.toml`)

```toml
dojo = "1.8.0"
starknet = "2.13.1"
openzeppelin_token = { git = "OpenZeppelin/cairo-contracts", tag = "v3.0.0" }
openzeppelin_access = { git = "OpenZeppelin/cairo-contracts", tag = "v3.0.0" }
alexandria_math = { git = "keep-starknet-strange/alexandria", tag = "v0.9.0" }
origami_random = { git = "dojoengine/origami" }
game_components_embeddable_game_standard = { git = "Provable-Games/game-components", branch = "next" }
game_components_utilities = { git = "Provable-Games/game-components", branch = "next" }
game_components_interfaces = { git = "Provable-Games/game-components", branch = "next" }
graffiti = { git = "Keep-Starknet-Strange/graffiti" }
```

## Build & Deploy

```bash
export PATH="$HOME/.cargo/bin:$PATH"

# Build
sozo build -P slot
sozo build -P sepolia
sozo build -P mainnet

# Test
scarb test

# Deploy (from workspace root)
DOJO_PRIVATE_KEY="..." sozo migrate -P slot
DOJO_PRIVATE_KEY="..." sozo migrate -P sepolia
DOJO_PRIVATE_KEY="..." sozo migrate -P mainnet
```

Automated slot deployment: `./scripts/deploy_slot.sh`

## VRF vs Pseudo-Random

- **Mainnet/Sepolia:** Cartridge VRF provider — use `RandomImpl::new_vrf()` in `systems/game.cairo`
- **Slot/Katana:** VRF not available — use `RandomImpl::new_pseudo_random()` (seed from `poseidon_hash([tx_hash, caller, timestamp, nonce])`)

Switch by editing the `RandomImpl::new_*()` call in `systems/game.cairo` before deployment.

## External Contracts (`external/`)

### FullTokenContract

ERC721 with game-components components: CoreToken, ERC2981, Minter, Settings, Context, Renderer, Skills.
- `free_mint(settings_id)` creates NFT with `settings_id` baked into TokenMetadata
- `settings_id` maps to a zone/map (0=Polynesian, 1=Japan, 2=Persia)
- `game_system.create(game_id, mode)` reads `settings_id` from token metadata

### MinigameRegistryContract

Game registry for the embeddable game standard. Tracks deployed game contracts.

## Key Patterns

- **Bit-packing:** RunData (102 bits in felt252), MetaData (32 bits in felt252), grid (240 bits in felt252)
- **Dispatcher pattern:** Systems call each other via world DNS resolution (`world.dns(@"system_name")`)
- **game_id = felt252:** Packed ERC721 token_id from embeddable game standard (not u64)
- **Mode-aware logic:** Map mode (10 levels, constraints, boss at L10) vs Endless (score-based difficulty scaling, no level cap)
- **Auto-advance:** Level completion in Map mode triggers next level initialization in the same transaction
- **Entitlement check:** `MapEntitlement` required for settings_id 1 and 2; settings_id 0 is free; daily challenge games bypass check

## Common Issues

**"Invalid new schema to upgrade resource"**
- Restart katana for a fresh chain, or change `seed` in `dojo_slot.toml`

**"Requested contract address 0x0 is not deployed"**
- `denshokan_address` in init_call_args is wrong or FullTokenContract was not deployed first
