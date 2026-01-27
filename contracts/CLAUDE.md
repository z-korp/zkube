# zKube Smart Contracts

## Overview

Cairo 2.13.1 smart contracts using the Dojo 1.8.0 framework. These contracts implement the core game logic, state management, and achievement system for the zKube puzzle game.

## Directory Structure

```
contracts/
├── src/
│   ├── lib.cairo              # Module definitions
│   ├── constants.cairo        # Game constants
│   ├── events.cairo           # Event definitions
│   ├── models/                # Dojo data models
│   │   ├── game.cairo         # Game state model
│   │   └── config.cairo       # Game settings model
│   ├── systems/               # Dojo systems (logic)
│   │   ├── game.cairo         # Main game system
│   │   ├── shop.cairo         # Permanent shop (cube economy)
│   │   ├── cube_token.cairo   # Soulbound ERC1155 CUBE token
│   │   └── config.cairo       # Configuration system
│   ├── types/                 # Type definitions
│   │   ├── bonus.cairo        # Bonus enum (Hammer, Wave, Totem)
│   │   ├── difficulty.cairo   # Difficulty levels
│   │   ├── block.cairo        # Block types
│   │   ├── width.cairo        # Width types
│   │   ├── constraint.cairo   # ConstraintType, LevelConstraint
│   │   ├── level.cairo        # LevelConfig
│   │   └── consumable.cairo   # ConsumableType enum (Hammer, Wave, Totem, ExtraMoves)
│   ├── elements/              # Game element implementations
│   │   ├── bonuses/           # Bonus mechanics
│   │   └── difficulties/      # Difficulty configurations
│   ├── helpers/               # Utility functions
│   │   ├── controller.cairo   # Grid manipulation (77KB, main logic)
│   │   ├── packer.cairo       # Bit packing utilities
│   │   ├── gravity.cairo      # Block falling logic
│   │   ├── random.cairo       # VRF random generation
│   │   └── math.cairo         # Math utilities
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
    pub blocks: felt252,      // 240 bits: 10 rows × 8 cols × 3 bits
    pub next_row: u32,        // Pre-generated next row (24 bits)
    // Per-level combo tracking (resets each level)
    pub combo_counter: u8,    // Current combo streak this level
    pub max_combo: u8,        // Best combo this level
    // Level system (bit-packed run progress)
    pub run_data: felt252,    // Bit-packed: level, score, moves, bonuses, stars, cubes, etc.
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

**Key flows:**
1. `create()` - Initializes game with VRF seed, generates initial grid
2. `move()` - Processes block movement, gravity, line clearing, bonus calculation
3. `apply_bonus()` - Applies Hammer/Wave/Totem bonus effects
4. `surrender()` - Ends game, triggers achievement updates

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

**Note:** Shop system needs WRITER permission on `PlayerMeta` model and MINTER_ROLE on CubeToken.

### CubeToken System (`systems/cube_token.cairo`)

Soulbound ERC1155 token for the CUBE currency (token ID = 1):

```cairo
trait ICubeToken {
    fn mint(ref self: T, recipient: ContractAddress, amount: u256);
    fn burn(ref self: T, account: ContractAddress, amount: u256);
    fn balance_of_cubes(self: @T, account: ContractAddress) -> u256;
}
```

- **Soulbound:** Transfers blocked (only mint from=0 and burn to=0 allowed)
- **Access Control:** MINTER_ROLE required for mint; burn allowed by owner or MINTER_ROLE
- **dojo_init:** Grants MINTER_ROLE to game_system and shop_system via world DNS
- **Torii Integration:** `register_external_contract()` registers with Torii for ERC1155 balance indexing

### ConsumableType (`types/consumable.cairo`)

In-game shop items purchasable during a run:

```cairo
pub enum ConsumableType {
    Hammer,      // 5 cubes
    Wave,        // 5 cubes
    Totem,       // 5 cubes
    ExtraMoves,  // 10 cubes (adds 5 moves) - NOT YET IMPLEMENTED (panics)
}
```

## Grid Manipulation (`helpers/controller.cairo`)

The core game logic handling:

### Key Functions

```cairo
impl Controller {
    fn apply_gravity(blocks: felt252) -> felt252;     // Drop blocks down
    fn assess_lines(bitmap: felt252, ...) -> felt252; // Clear full lines
    fn add_line(bitmap: felt252, line: u32) -> felt252; // Add new row
    fn create_line(seed: felt252, difficulty: Difficulty) -> u32; // Generate row
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

Each block = 3 bits (0-7), 0 = empty

## Bonuses

### Hammer (`elements/bonuses/hammer.cairo`)
Clears the target block and connected same-color blocks.

### Wave (`elements/bonuses/wave.cairo`)
Clears an entire horizontal row.

### Totem (`elements/bonuses/totem.cairo`)
Clears blocks in a vertical column at the specified position.

## Difficulty Levels

Defined in `types/difficulty.cairo` and implemented in `elements/difficulties/`:

| Level | Block Distribution |
|-------|-------------------|
| VeryEasy | Mostly simple blocks, many gaps |
| Easy | Simple blocks |
| Medium | Mixed blocks |
| MediumHard | Complex blocks, fewer gaps |
| Hard | Complex blocks |
| VeryHard | Very complex blocks |
| Expert | Expert-level complexity |
| Master | Maximum difficulty |
| Increasing | Progressive based on moves |

## Dependencies

```toml
[dependencies]
dojo = "1.8.0"
starknet = "2.13.1"
openzeppelin_token = { git = "OpenZeppelin/cairo-contracts", tag = "v3.0.0-alpha.3" }
alexandria_math = { git = "keep-starknet-strange/alexandria", tag = "v0.7.0" }
achievement = { git = "cartridge-gg/arcade" }
origami_random = { git = "dojoengine/origami", tag = "v1.7.0" }
game_components_minigame = { git = "Provable-Games/game-components", tag = "v2.13.1" }
```

## Build & Deploy

```bash
# Build
scarb build

# Deploy to slot (local)
scarb slot

# Deploy to sepolia
scarb sepolia

# Deploy to mainnet
scarb mainnet

# Run tests
scarb test
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

### MinigameToken
- Used for game NFT ownership verification
- Handles lifecycle (playable state)
- Manages player names

### Achievement Contract
- Cartridge's arcade achievement system
- Trophies and task tracking
- Called on game over

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
   - Milestone bonus: Every 10 levels awards level/2 cubes (capped at 50)
   - Combo bonuses: 4+ lines = +1, 5+ = +2, 6+ = +3 cubes
   - Combo achievements: First 5-line combo = +3, first 10-line = +5 cubes
6. **Starting Bonuses**: PlayerMeta upgrades apply on game creation

## VRF vs Pseudo-Random

### VRF (Mainnet/Sepolia)
The Cartridge VRF provider is only deployed on Sepolia and Mainnet:
- Address: `0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f`
- Use `RandomImpl::new_vrf()` in `systems/game.cairo`

### Pseudo-Random (Slot/Katana)
For local development on slot/katana where VRF doesn't exist:
- Use `RandomImpl::new_pseudo_random()` in `systems/game.cairo`
- Generates seed from: `poseidon_hash([tx_hash, caller, contract, timestamp, nonce])`

```cairo
// In systems/game.cairo create() function:

// For slot/katana (no VRF):
let random = RandomImpl::new_pseudo_random();

// For mainnet/sepolia (with VRF):
let random = RandomImpl::new_vrf();
```

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
# ... other models ...

# Events also need writer permissions!
"zkube_budo_v1_2_0-StartGame" = ["zkube_budo_v1_2_0-game_system"]
"zkube_budo_v1_2_0-UseBonus" = ["zkube_budo_v1_2_0-game_system"]
```

If you see errors like `game_system does NOT have WRITER role on event StartGame`, add the event to the writers section.

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

2. **Ensure event permissions** in `dojo_slot.toml`:
   ```toml
   [writers]
   "zkube_budo_v1_2_0-StartGame" = ["zkube_budo_v1_2_0-game_system"]
   "zkube_budo_v1_2_0-UseBonus" = ["zkube_budo_v1_2_0-game_system"]
   "zkube_budo_v1_2_0-PlayerMeta" = ["zkube_budo_v1_2_0-game_system", "zkube_budo_v1_2_0-shop_system"]
   ```

3. **Deploy token contracts first** (MinigameRegistry, FullTokenContract)
4. **Update `denshokan_address`** in BOTH config files:
   - `./dojo_slot.toml`
   - `./contracts/dojo_slot.toml`

5. **Run migrate** (MUST run from workspace root, NOT from contracts/):
   ```bash
   sozo migrate -P slot
   ```

### Common Issues

**"Invalid new schema to upgrade resource"**
- Restart katana for a fresh chain, or change the `seed` in dojo_slot.toml

**"Requested contract address 0x0 is not deployed"**
- The denshokan_address is wrong - check BOTH dojo_slot.toml files
