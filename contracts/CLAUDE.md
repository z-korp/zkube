# zKube Smart Contracts

## Overview

Cairo 2.13.1 smart contracts using the Dojo 1.8.0 framework. These contracts implement the core game logic, state management, quest system, and achievement system for the zKube puzzle game.

## Directory Structure

```
contracts/
├── src/
│   ├── lib.cairo              # Module definitions
│   ├── constants.cairo        # Game constants and namespace
│   ├── events.cairo           # Event definitions
│   ├── models/                # Dojo data models
│   │   ├── game.cairo         # Game state model
│   │   ├── player.cairo       # PlayerMeta model
│   │   └── config.cairo       # GameSettings model
│   ├── systems/               # Dojo systems (logic)
│   │   ├── game.cairo         # Main game system + MinigameComponent
│   │   ├── shop.cairo         # Permanent shop (cube economy)
│   │   ├── cube_token.cairo   # Soulbound ERC1155 CUBE token
│   │   ├── quest.cairo        # Daily quest system
│   │   ├── config.cairo       # Configuration + IMinigameSettings
│   │   └── renderer.cairo     # NFT metadata & SVG (IMinigameDetails)
│   ├── types/                 # Type definitions
│   │   ├── bonus.cairo        # Bonus enum (Hammer, Wave, Totem)
│   │   ├── difficulty.cairo   # Difficulty levels
│   │   ├── block.cairo        # Block types
│   │   ├── width.cairo        # Width types
│   │   ├── constraint.cairo   # ConstraintType, LevelConstraint
│   │   ├── level.cairo        # LevelConfig
│   │   └── consumable.cairo   # ConsumableType enum
│   ├── elements/              # Game element implementations
│   │   ├── bonuses/           # Bonus mechanics (hammer, wave, totem)
│   │   ├── difficulties/      # Difficulty configurations
│   │   ├── tasks/             # Quest task definitions
│   │   └── quests/            # Quest implementations
│   ├── helpers/               # Utility functions
│   │   ├── controller.cairo   # Grid manipulation (main logic)
│   │   ├── packer.cairo       # Bit packing utilities
│   │   ├── gravity.cairo      # Block falling logic
│   │   ├── random.cairo       # VRF random generation
│   │   ├── level.cairo        # Level generation
│   │   └── config.cairo       # Settings utilities
│   ├── interfaces/            # Trait definitions
│   │   └── vrf.cairo          # VRF interface
│   └── tests/                 # Unit tests
├── Scarb.toml                 # Package configuration
├── dojo_*.toml                # Network-specific Dojo configs
└── manifest_*.json            # Deployment manifests
```

## Core Models

### Game Model (`models/game.cairo`)

```cairo
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    // Grid state (changes every move)
    pub blocks: felt252,      // 240 bits: 10 rows x 8 cols x 3 bits
    pub next_row: u32,        // Pre-generated next row (24 bits)
    // Per-level combo tracking (resets each level)
    pub combo_counter: u8,    // Current combo streak this level
    pub max_combo: u8,        // Best combo this level
    // Level system (bit-packed run progress)
    pub run_data: felt252,    // Bit-packed: level, score, moves, bonuses, cubes, etc.
    // Timestamps
    pub started_at: u64,      // Run start timestamp
    // Game state
    pub over: bool,
}
```

### GameSeed Model

```cairo
#[dojo::model]
pub struct GameSeed {
    #[key]
    pub game_id: u64,
    pub seed: felt252,  // VRF seed for randomness
}
```

### PlayerMeta Model (`models/player.cairo`)

Persistent player data for meta-progression:

```cairo
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    pub data: felt252,      // Bit-packed MetaData (upgrades, stats)
    pub best_level: u8,     // Highest level reached
}
```

**Note:** Cube balance is tracked via the ERC1155 CubeToken contract, not in PlayerMeta.

**MetaData bit-packing** (in `helpers/packing.cairo`):
- `starting_hammer/wave/totem` (2 bits each, 0-3)
- `bag_hammer/wave/totem_level` (4 bits each)
- `bridging_rank` (4 bits)
- `total_runs`, `total_cubes_earned` (stats)

### GameSettings Model (`models/config.cairo`)

Extended settings for custom game modes:

```cairo
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub difficulty: u8,
    // Level Scaling
    pub base_moves: u16,           // Default: 20
    pub max_moves: u16,            // Default: 60
    pub base_ratio_x100: u16,      // Default: 80 (0.80)
    pub max_ratio_x100: u16,       // Default: 250 (2.50)
    // Cube Thresholds
    pub cube_3_percent: u8,        // Default: 40%
    pub cube_2_percent: u8,        // Default: 70%
    // Consumable Costs
    pub hammer_cost: u8,           // Default: 5
    pub wave_cost: u8,             // Default: 5
    pub totem_cost: u8,            // Default: 5
    pub extra_moves_cost: u8,      // Default: 10
    // Difficulty Progression
    pub starting_difficulty: u8,
    pub difficulty_step_levels: u8,
    // Constraint Settings
    pub constraints_enabled: u8,
    pub constraint_start_level: u8,
    // Variance Settings
    pub early_variance_percent: u8,
    pub mid_variance_percent: u8,
    pub late_variance_percent: u8,
    // Level Tier Thresholds
    pub early_level_threshold: u8,
    pub mid_level_threshold: u8,
    pub level_cap: u8,
    // Constraint Distribution (Easy to Master scaling)
    // ... additional constraint parameters
}
```

## Systems

### Game System (`systems/game.cairo`)

Main game logic with the following functions:

```cairo
trait IGameSystem {
    fn create(ref self: T, game_id: u64);
    fn create_with_cubes(ref self: T, game_id: u64, cubes_amount: u16);
    fn surrender(ref self: T, game_id: u64);
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8);
    fn purchase_consumable(ref self: T, game_id: u64, consumable: ConsumableType);
    fn get_player_name(self: @T, game_id: u64) -> felt252;
    fn get_score(self: @T, game_id: u64) -> u16;
    fn get_game_data(self: @T, game_id: u64) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool);
    fn get_shop_data(self: @T, game_id: u64) -> (u16, u16, u16);
}
```

**`get_game_data` returns:** (level, level_score, level_moves, combo, max_combo, hammer, wave, totem, total_cubes, over)

**`get_shop_data` returns:** (cubes_brought, cubes_spent, cubes_available)

**Quest Integration:**
The game system tracks quest progress by calling `quest_system.progress()`:
- On `create()`/`create_with_cubes()`: +1 to Grinder task (games played)
- On `move()` with line clears: +N to LineClearer task
- On `move()` with combos: +1 to ComboThree/ComboFive/ComboEight tasks

### Shop System (`systems/shop.cairo`)

Permanent shop for spending cubes on upgrades:

```cairo
trait IShopSystem {
    fn upgrade_starting_bonus(ref self: T, bonus_type: u8);  // 0=Hammer, 1=Wave, 2=Totem
    fn upgrade_bag_size(ref self: T, bonus_type: u8);
    fn upgrade_bridging_rank(ref self: T);
    fn get_starting_bonus_upgrade_cost(self: @T, current_level: u8) -> u64;
    fn get_bag_upgrade_cost(self: @T, current_level: u8) -> u64;
    fn get_bridging_upgrade_cost(self: @T, current_rank: u8) -> u64;
}
```

**Upgrade Costs:**
- Starting Bonus: 50 / 200 / 500 cubes for levels 1/2/3
- Bag Size: 10 * 2^level cubes (10, 20, 40, 80...)
- Bridging Rank: 100 * 2^rank cubes (100, 200, 400, 800...)

All upgrades burn cubes via the ERC1155 `CubeToken` contract.

### CubeToken System (`systems/cube_token.cairo`)

Soulbound ERC1155 token for the CUBE currency (token ID = 1):

```cairo
trait ICubeToken {
    fn mint(ref self: T, recipient: ContractAddress, amount: u256);
    fn burn(ref self: T, account: ContractAddress, amount: u256);
    fn balance_of_cubes(self: @T, account: ContractAddress) -> u256;
    fn grant_minter_roles(ref self: T);
    fn mint_dev(ref self: T, amount: u256);
}
```

- **Soulbound:** Transfers blocked (only mint from=0 and burn to=0 allowed)
- **Access Control:** MINTER_ROLE required for mint; burn allowed by owner or MINTER_ROLE
- **dojo_init:** Grants MINTER_ROLE to game_system, shop_system, and quest_system
- **Torii Integration:** `register_external_contract()` registers with Torii for ERC1155 balance indexing

### Quest System (`systems/quest.cairo`)

Daily quest system using Cartridge's arcade quest component:

```cairo
trait IQuestSystem {
    fn claim(ref self: T, quest_id: u32, interval_id: u64);
    fn progress(ref self: T, player: ContractAddress, task_id: u8, count: u32);
}
```

**Quests (10 total, 102 CUBE/day):**

| Quest | Task | Threshold | Reward |
|-------|------|-----------|--------|
| DailyPlayerOne | Games played | 1 | 3 CUBE |
| DailyPlayerTwo | Games played | 3 | 6 CUBE |
| DailyPlayerThree | Games played | 5 | 12 CUBE |
| DailyClearerOne | Lines cleared | 10 | 3 CUBE |
| DailyClearerTwo | Lines cleared | 30 | 6 CUBE |
| DailyClearerThree | Lines cleared | 50 | 12 CUBE |
| DailyComboOne | 3+ combos | 1 | 5 CUBE |
| DailyComboTwo | 5+ combos | 1 | 10 CUBE |
| DailyComboThree | 8+ combos | 1 | 20 CUBE |
| DailyFinisher | All 9 quests | 9 | 25 CUBE |

### Config System (`systems/config.cairo`)

Game settings management:

```cairo
trait IConfigSystem {
    fn add_game_settings(ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty) -> u32;
    fn add_custom_game_settings(ref self: T, /* 21+ parameters */) -> u32;
    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}
```

**Default Settings Created on Init:**
- ID 0: "Fixed Difficulty - Expert"
- ID 1: "Progressive Difficulty" (Increasing)
- ID 2: "Fixed Difficulty - Very Hard"

### Renderer System (`systems/renderer.cairo`)

NFT metadata and SVG generation for game tokens:

```cairo
trait IRendererSystems {
    fn create_metadata(self: @T, game_id: u64) -> ByteArray;   // Full JSON metadata
    fn generate_svg(self: @T, game_id: u64) -> ByteArray;      // SVG image
    fn generate_details(self: @T, game_id: u64) -> Span<GameDetail>;  // NFT attributes
}
```

Implements Budokan/game-components interfaces:
- `IMinigameDetails`: `game_details()`, `token_name()`, `token_description()`
- `IMinigameDetailsSVG`: `game_details_svg()`

The renderer is automatically resolved via `world.dns(@"renderer_systems")` if not provided during game initialization.

## Grid Manipulation (`helpers/controller.cairo`)

Core game logic handling grid operations:

### Key Functions

```cairo
impl Controller {
    fn apply_gravity(blocks: felt252) -> felt252;     // Drop blocks down
    fn assess_lines(bitmap: felt252, ...) -> felt252; // Clear full lines
    fn add_line(bitmap: felt252, line: u32) -> felt252; // Add new row
    fn create_line(seed: felt252, difficulty: Difficulty, settings: @GameSettings) -> u32;
    fn swipe(blocks: felt252, row: u8, start: u8, dir: bool, count: u8) -> felt252;
}
```

### Bit Packing

Grid stored as felt252 (240 bits):
```
Row 9 (top):    [b7][b6][b5][b4][b3][b2][b1][b0]  <- 24 bits
Row 8:          [b7][b6][b5][b4][b3][b2][b1][b0]
...
Row 0 (bottom): [b7][b6][b5][b4][b3][b2][b1][b0]
```

Each block = 3 bits (0-4), 0 = empty

### run_data Bit Layout

```
Bits 0-7:     current_level (u8)
Bits 8-15:    level_score (u8)
Bits 16-23:   level_moves (u8)
Bits 24-31:   constraint_progress (u8)
Bits 32-39:   constraint_2_progress (u8)
Bit 40:       bonus_used_this_level (bool)
Bit 41:       combo_5_achieved (bool)
Bit 42:       combo_10_achieved (bool)
Bits 43-50:   hammer_count (u8)
Bits 51-58:   wave_count (u8)
Bits 59-66:   totem_count (u8)
Bits 67-74:   shrink_count (u8)
Bits 75-82:   shuffle_count (u8)
Bits 83-90:   max_combo_run (u8)
Bits 91-98:   extra_moves (u8)
Bits 99-114:  cubes_brought (u16)
Bits 115-130: cubes_spent (u16)
Bits 131-146: total_cubes (u16)
Bits 147-162: total_score (u16)
Bit 163:      run_completed (bool) - Victory flag (level 50 cleared)
Bits 164-166: selected_bonus_1 (3 bits, 0-5)
Bits 167-169: selected_bonus_2 (3 bits, 0-5)
Bits 170-172: selected_bonus_3 (3 bits, 0-5)
Bits 173-174: bonus_1_level (2 bits, 0-2)
Bits 175-176: bonus_2_level (2 bits, 0-2)
Bits 177-178: bonus_3_level (2 bits, 0-2)
Bits 179-181: free_moves (3 bits, 0-7)
Bit 182:      pending_level_up (bool)
Bits 183-188: last_shop_level (6 bits)
Bit 189:      shop_bonus_1_bought (bool)
Bit 190:      shop_bonus_2_bought (bool)
Bit 191:      shop_bonus_3_bought (bool)
Bits 192-195: shop_refills (4 bits)
Bit 196:      no_bonus_constraint (bool)
```

**Total: 197 bits used (55 reserved in felt252)**

## Bonuses

Five bonus types, each with 3 upgrade levels (L1/L2/L3):

### Hammer (`elements/bonuses/hammer.cairo`)
Clears the target block and connected same-size blocks.
- L2: +1 combo bonus
- L3: +2 combo bonus

### Wave (`elements/bonuses/wave.cairo`)
Clears an entire horizontal row.
- L2: +1 free move
- L3: +2 free moves

### Totem (`elements/bonuses/totem.cairo`)
Clears all blocks of the same size on the grid.
- L2: +3 bonus cubes
- L3: Clears entire grid

### Shrink (`elements/bonuses/shrink.cairo`)
Reduces block size by 1 (size 1 disappears). Unlockable for 200 CUBE.
- L2: Shrink all same-size blocks
- L3: Shrink by 2 sizes

### Shuffle (`elements/bonuses/shuffle.cairo`)
Randomizes block positions using Fisher-Yates algorithm. Unlockable for 200 CUBE.
- L2: Also shuffles next line
- L3: Shuffles entire grid

## ConsumableType (`types/consumable.cairo`)

In-game shop items purchasable during a run (every 5 levels):

```cairo
pub enum ConsumableType {
    Bonus1,   // 5 CUBE - Add 1 of selected_bonus_1
    Bonus2,   // 5 CUBE - Add 1 of selected_bonus_2
    Bonus3,   // 5 CUBE - Add 1 of selected_bonus_3
    Refill,   // 2*(n+1) CUBE - Reset shop availability
    LevelUp,  // 50 CUBE - Level up a bonus
}
```

**Shop availability resets** when entering a new shop level (every 5 levels).

## Difficulty Levels

Defined in `types/difficulty.cairo` and implemented in `elements/difficulties/`:

| Level | Block Distribution |
|-------|-------------------|
| VeryEasy | Mostly small blocks (size 1-2), many gaps |
| Easy | Simple blocks |
| Medium | Mixed blocks |
| MediumHard | Complex blocks, fewer gaps |
| Hard | Complex blocks |
| VeryHard | Very complex blocks |
| Expert | Expert-level complexity |
| Master | Maximum difficulty (size 3-4 dominant) |
| Increasing | Progressive based on level thresholds |

**Difficulty Tier Thresholds (default):**
- Levels 1-3: VeryEasy
- Levels 4-7: Easy
- Levels 8-11: Medium
- Levels 12-17: MediumHard
- Levels 18-24: Hard
- Levels 25-34: VeryHard
- Levels 35-44: Expert
- Levels 45+: Master

## Dependencies

```toml
[dependencies]
dojo = "1.8.0"
starknet = "2.13.1"
openzeppelin_token = { git = "OpenZeppelin/cairo-contracts", tag = "v3.0.0-alpha.3" }
openzeppelin_access = { git = "OpenZeppelin/cairo-contracts", tag = "v3.0.0-alpha.3" }
alexandria_math = { git = "keep-starknet-strange/alexandria", tag = "v0.7.0" }
achievement = { git = "cartridge-gg/arcade" }
quest = { git = "cartridge-gg/arcade" }
origami_random = { git = "dojoengine/origami", tag = "v1.7.0" }
game_components_minigame = { git = "Provable-Games/game-components", tag = "v2.13.1" }
game_components_token = { git = "Provable-Games/game-components", tag = "v2.13.1" }
graffiti = { git = "Keep-Starknet-Strange/graffiti" }
```

## Build & Deploy

```bash
# Build (from workspace root)
scarb build

# Build for specific network (from contracts/)
sozo build -P slot
sozo build -P sepolia
sozo build -P mainnet

# Run tests
scarb test

# Deploy (from workspace root)
sozo migrate -P slot
sozo migrate -P sepolia
sozo migrate -P mainnet
```

## Namespace

Current: `zkube_budo_v1_2_0`

Defined in `constants.cairo`:
```cairo
pub fn DEFAULT_NS() -> ByteArray {
    "zkube_budo_v1_2_0"
}
```

## External Contract Integration

### MinigameToken (FullTokenContract)
- Used for game NFT ownership verification
- Handles lifecycle (playable state)
- Manages player names
- `free_mint()` creates new game NFTs

### Achievement Contract
- Cartridge's arcade achievement system
- Trophies and task tracking
- Called on game over

### Quest Contract
- Cartridge's arcade quest component
- Daily quest tracking with intervals
- Quest progress and claiming

## Testing

Tests in `src/tests/`:
- `test_create.cairo` - Game creation
- `test_move.cairo` - Move mechanics
- `test_play.cairo` - Full gameplay
- `test_bonus_hammer.cairo` - Hammer bonus
- `test_bonus_wave.cairo` - Wave bonus
- `test_bonus_totem.cairo` - Totem bonus
- `test_admin.cairo` - Admin functions
- `test_pause.cairo` - Pause functionality

Mock contracts in `tests/mocks/`:
- `erc20.cairo` - Mock ERC20
- `erc721.cairo` - Mock ERC721

## Important Notes

1. **Game ID = Token ID**: Each game is tied to an NFT token
2. **VRF Randomness**: All randomness derived from VRF seed via Poseidon hashing
3. **Gas Optimization**: Blocks packed into single felt252 to minimize storage
4. **Deterministic**: Same seed + same moves = same game result
5. **Cube Economy**: Players earn cubes through gameplay:
   - Level completion: 1-3 cubes based on moves used
   - Boss level bonus: Levels 10/20/30/40/50 award +10/+20/+30/+40/+50 CUBE
   - Combo bonuses: 4→+1, 5→+3, 6→+5, 7→+10, 8→+25, 9+→+50 CUBE
   - First combo achievements: First 5-combo = +3, first 10-combo = +5 CUBE
6. **Starting Bonuses**: PlayerMeta upgrades apply on game creation
7. **Quest Integration**: game_system calls quest_system.progress() automatically

## VRF vs Pseudo-Random

### VRF (Mainnet/Sepolia)
The Cartridge VRF provider is only deployed on Sepolia and Mainnet:
- Address: `0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f`
- Use `RandomImpl::new_vrf()` in `systems/game.cairo`

### Pseudo-Random (Slot/Katana)
For local development on slot/katana where VRF doesn't exist:
- Use `RandomImpl::new_pseudo_random()` in `systems/game.cairo`
- Generates seed from: `poseidon_hash([tx_hash, caller, contract, timestamp, nonce])`

### Switching Between Modes
When deploying to different networks, update `systems/game.cairo`:
- Slot: `RandomImpl::new_pseudo_random()`
- Sepolia/Mainnet: `RandomImpl::new_vrf()`

## Event Permissions

Systems that emit events need explicit WRITER grants in the dojo config:

```toml
# In dojo_slot.toml (or dojo_sepolia.toml, dojo_mainnet.toml)
[writers]
"zkube_budo_v1_2_0-Game" = ["zkube_budo_v1_2_0-game_system"]
"zkube_budo_v1_2_0-GameSeed" = ["zkube_budo_v1_2_0-game_system"]
"zkube_budo_v1_2_0-PlayerMeta" = ["zkube_budo_v1_2_0-game_system", "zkube_budo_v1_2_0-shop_system"]
# Events also need writer permissions!
"zkube_budo_v1_2_0-StartGame" = ["zkube_budo_v1_2_0-game_system"]
"zkube_budo_v1_2_0-UseBonus" = ["zkube_budo_v1_2_0-game_system"]
```

## Slot Deployment

### Using the Deploy Script (Recommended)

```bash
./scripts/deploy_slot.sh
```

This script handles the full deployment including token contracts. See `scripts/CLAUDE.md` for details.

### Manual Deployment

1. **Update random source** in `systems/game.cairo`:
   ```cairo
   let random = RandomImpl::new_pseudo_random();
   ```

2. **Ensure event permissions** in `dojo_slot.toml`

3. **Deploy token contracts first** (MinigameRegistry, FullTokenContract)

4. **Update `denshokan_address`** in BOTH config files:
   - `./dojo_slot.toml`
   - `./contracts/dojo_slot.toml`

5. **Run migrate** (MUST run from workspace root):
   ```bash
   sozo migrate -P slot
   ```

### Common Issues

**"Invalid new schema to upgrade resource"**
- Restart katana for a fresh chain, or change the `seed` in dojo_slot.toml

**"Requested contract address 0x0 is not deployed"**
- The denshokan_address is wrong - check BOTH dojo_slot.toml files
