# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle roguelike built with the Dojo framework on Starknet. Players manipulate blocks on an 8x10 grid to form solid horizontal lines, progress through levels, earn cubes (ERC1155 currency), and spend them on upgrades. The game features VRF-powered randomness, strategic bonuses, a level system with constraints, a cube economy with two shops, and an achievement system.

## Architecture

```
zkube/
├── Scarb.toml          # Workspace root (shared dependencies)
├── contracts/          # Dojo smart contracts (Cairo 2.13.1)
├── packages/
│   ├── game_erc721/    # ERC721 NFT contract for game tokens
│   └── token/          # ERC20 token contract (Fake LORD)
├── client-budokan/     # React/TypeScript frontend application
├── assets/             # Game graphics, sounds, and media
├── scripts/            # Python utility scripts
├── docs/               # Documentation
└── references/         # Reference implementations (death-mountain, etc.)
```

**Workspace**: All contracts are in a unified Scarb workspace. Run `scarb build` from root to build all packages.

## Technology Stack

### Frontend (`client-budokan/`)
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **Styling:** TailwindCSS 3.4.4
- **State Management:** Zustand 4.5.5, MobX 6.13.2
- **Animation:** Framer Motion 11.2.10, GSAP 3.12.5
- **Starknet:** starknet 8.5.2, @starknet-react/core 5.0.1
- **Dojo:** @dojoengine/sdk 1.8.1, @dojoengine/core 1.8.1
- **Wallet:** Cartridge Controller 0.10.7

### Smart Contracts (`contracts/`)
- **Language:** Cairo 2.13.1
- **Framework:** Dojo 1.8.0
- **Network:** Starknet 2.13.1
- **Standards:** OpenZeppelin Cairo v3.0.0-alpha.3

## How Everything Works Together

### Game Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Home    │───>│ FreeMint │───>│  Create  │───>│   Play   │      │
│  │  Screen  │    │  (NFT)   │    │  (Game)  │    │  Screen  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Transactions via Cartridge Controller
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOJO WORLD (Starknet)                            │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │  Game System   │  │ Shop System  │  │  CubeToken      │        │
│  │  - create()    │  │ - upgrades   │  │  (ERC1155)      │        │
│  │  - move()      │  │ - bag size   │  │  - mint/burn    │        │
│  │  - surrender() │  │ - bridging   │  │  - soulbound    │        │
│  │  - apply_bonus │  └──────────────┘  └─────────────────┘        │
│  │  - purchase_   │                                                │
│  │    consumable  │  ┌──────────────┐  ┌─────────────────┐        │
│  └────────────────┘  │Config System │  │Achievement System│       │
│           │          │ - settings   │  │ - trophies      │        │
│           ▼          └──────────────┘  └─────────────────┘        │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │   Game Model   │  │  GameSeed    │  │  PlayerMeta     │        │
│  │  - blocks      │  │  - VRF seed  │  │  - upgrades     │        │
│  │  - run_data    │  └──────────────┘  │  - best_level   │        │
│  │  - combo/over  │                    └─────────────────┘        │
│  └────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Torii Indexer (GraphQL)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      TORII CLIENT                                   │
│  Real-time sync of Game state to frontend via getSyncEntities      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Game Creation:**
   - User connects wallet via Cartridge Controller
   - Calls `free_mint()` on the token contract (gets NFT game token)
   - Calls `create()` or `create_with_cubes()` on game_system with the token ID
   - VRF generates random seed for the game
   - Initial grid is created, level 1 config generated from seed

2. **Gameplay (Level System):**
   - Frontend displays grid from `Game.blocks` (packed felt252 = 240 bits)
   - User swipes blocks horizontally via drag handlers
   - `move()` transaction updates blocks, applies gravity, checks lines
   - Completed lines increase score, track combos and constraint progress
   - Level completes when score threshold is met; new level starts
   - Bonuses awarded based on star rating (3-star/2-star/1-star performance)
   - Every 5 levels, in-game shop appears to spend cubes on consumables
   - On game over, earned cubes are minted as ERC1155 tokens to player's wallet

3. **State Synchronization:**
   - Torii indexes all Game model changes
   - Frontend subscribes via `getSyncEntities()`
   - RECS (Reactive ECS) updates React components automatically
   - Animations triggered via `useGridAnimations` hook

### Grid Representation

The game grid is stored as a single `felt252` (240 bits):
- 10 rows × 8 columns
- Each block = 3 bits (values 0-7 for colors/types)
- Row = 24 bits (8 blocks × 3 bits)
- Total = 240 bits packed into felt252

```cairo
// Block packing
pub const BLOCK_SIZE: u8 = 8;       // 8 blocks per row
pub const BLOCK_BIT_COUNT: u8 = 3;  // 3 bits per block
pub const ROW_BIT_COUNT: u8 = 24;   // 24 bits per row
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;
```

### Bonus System

Three types of bonuses earned through gameplay:
- **Hammer:** Clears a specific block and its group
- **Wave:** Clears an entire row
- **Totem:** Clears a vertical column

Bonuses are calculated based on:
- Current score
- Combo counter (total lines cleared in combos)
- Max combo (highest single combo chain)

### Difficulty System

8 difficulty levels + Progressive mode:
- VeryEasy, Easy, Medium, MediumHard, Hard, VeryHard, Expert, Master
- **Increasing:** Starts at MediumHard, increases based on moves:
  - 0-19 moves: MediumHard
  - 20-39 moves: Hard
  - 40-79 moves: VeryHard
  - 80-139 moves: Expert
  - 140+ moves: Master

### Achievement System

Trophies tracked via Cartridge's arcade achievement system:
- **Mastering:** Combo count thresholds (ComboInitiator, ComboExpert, ComboMaster)
- **Chaining:** Max combo thresholds (TripleThreat, SixShooter, NineLives)
- **Playing:** Move count thresholds (GameBeginner, GameExperienced, GameVeteran)
- **Scoring:** Score thresholds (ScoreApprentice, ScoreExpert, ScoreMaster)
- **Cumulative:** Total score across games (ScoreCollector, ScoreAccumulator, ScoreLegend)

## Key Files Reference

### Frontend Entry Points
- `client-budokan/src/main.tsx` - App initialization and providers
- `client-budokan/src/App.tsx` - Router setup
- `client-budokan/src/dojo/setup.ts` - Dojo client initialization
- `client-budokan/dojo.config.ts` - Network configuration

### Smart Contract Entry Points
- `contracts/src/systems/game.cairo` - Main game logic (create, move, apply_bonus, purchase_consumable)
- `contracts/src/systems/shop.cairo` - Permanent shop (upgrades, bag size, bridging rank)
- `contracts/src/systems/cube_token.cairo` - Soulbound ERC1155 CUBE token (mint/burn)
- `contracts/src/models/game.cairo` - Game state model (blocks, run_data, combo, over)
- `contracts/src/models/player.cairo` - PlayerMeta model (upgrades, best_level)
- `contracts/src/helpers/controller.cairo` - Grid manipulation logic
- `contracts/src/constants.cairo` - Game constants

### Token Contracts (in packages/)
- `packages/token/` - ERC20 "Fake LORD" token with faucet
- `packages/game_erc721/` - Game NFT tokens (each game = 1 NFT)

### Cube Token (ERC1155)
- `contracts/src/systems/cube_token.cairo` - Soulbound ERC1155 with CUBE_TOKEN_ID=1
- Mint/burn controlled by MINTER_ROLE (granted to game_system and shop_system)
- Torii indexes balances via registered external contract

## Development Commands

### Frontend
```bash
cd client-budokan
pnpm slot        # Local development (slot)
pnpm sepolia     # Sepolia testnet
pnpm mainnet     # Mainnet
pnpm build       # Production build
pnpm test        # Run tests
```

### Contracts (Workspace)
```bash
# From project root
scarb build              # Build all packages (contracts, game_erc721, token)

# From contracts directory
cd contracts
scarb slot       # Deploy to slot
scarb sepolia    # Deploy to sepolia
scarb mainnet    # Deploy to mainnet
scarb test       # Run Cairo tests

# Token contract tests
cd packages/game_erc721
snforge test     # Run Foundry tests
```

## Namespace

Current namespace: `zkube_budo_v1_2_0`

Models are prefixed with this namespace in Torii queries:
- `zkube_budo_v1_2_0-Game`
- `zkube_budo_v1_2_0-GameSettingsMetadata`

## Important Patterns

### Reuse Existing Components
- Check `client-budokan/src/ui/components/` before creating new UI components
- Check `contracts/src/helpers/` for utility functions
- Use existing hooks in `client-budokan/src/hooks/`

### State Management
- Game state: RECS via Dojo
- UI state: Zustand stores (`generalStore.ts`, `moveTxStore.ts`)
- Audio: React Context (`MusicPlayerProvider`, `SoundPlayerProvider`)

### Transaction Flow
- All game transactions go through `client-budokan/src/dojo/systems.ts`
- Transactions are wrapped with loading toasts and error handling
- Move transactions update `moveTxStore` for UI feedback

## External Dependencies

### Dojo Ecosystem
- `@dojoengine/core` - Core client
- `@dojoengine/sdk` - SDK utilities
- `@dojoengine/torii-client` - Indexer client
- `@dojoengine/recs` - Reactive ECS
- `@dojoengine/state` - State sync

### Cartridge
- `@cartridge/controller` - Wallet controller
- `@cartridge/connector` - Starknet connector
- `achievement` (Cairo) - Achievement system

### Provable Games
- `game_components_minigame` - Minigame framework
- `game_components_token` - Token utilities
- `metagame-sdk` - Metagame integration

## Network Deployments

| Network | RPC | Torii |
|---------|-----|-------|
| Slot | api.cartridge.gg/x/zkube-djizus/katana | api.cartridge.gg/x/zkube-djizus/torii |
| Sepolia | Configured via env | Configured via env |
| Mainnet | Configured via env | Configured via env |

## Testing

### Frontend Tests
- Framework: Vitest 2.1.4
- Location: `client-budokan/src/test/`
- Run: `pnpm test`

### Contract Tests
- Framework: dojo_cairo_test 1.8.0
- Location: `contracts/src/tests/`
- Tests: `test_create`, `test_move`, `test_play`, `test_bonus_*`
- Run: `scarb test`

## Slot Development (Local Testing)

### Key Differences from Mainnet/Sepolia

1. **VRF Not Available**: Cartridge VRF provider only exists on Sepolia/Mainnet
   - Use `RandomImpl::new_pseudo_random()` instead of `RandomImpl::new_vrf()` in `contracts/src/systems/game.cairo`
   - Generates pseudo-random seed from tx_hash, caller, timestamp, nonce

2. **Metagame SDK Not Available**: The metagame-sdk queries infrastructure that doesn't exist on slot
   - Use `useGameTokensSlot` hook instead of `useGameTokens` from metagame-sdk
   - Queries games directly from local Torii/RECS

3. **Entity ID Format Mismatch**: Torii stores entity IDs without leading zeros
   - `getEntityIdFromKeys` returns: `0x004533cf...` (padded)
   - Torii stores: `0x4533cf...` (no leading zeros)
   - Must normalize entity IDs before RECS lookups (see `useGame.tsx`)

4. **Event Permissions**: Systems need explicit WRITER grants for events
   - Add to `dojo_slot.toml`:
   ```toml
   [writers]
   "zkube_budo_v1_2_0-StartGame" = ["zkube_budo_v1_2_0-game_system"]
   "zkube_budo_v1_2_0-UseBonus" = ["zkube_budo_v1_2_0-game_system"]
   ```

### Slot Deployment

#### Full Deployment (Fresh Katana)

Use the automated deploy script:
```bash
./scripts/deploy_slot.sh
```

This script handles:
1. Building contracts with `sozo build -P slot`
2. Declaring and deploying MinigameRegistryContract
3. Declaring and deploying FullTokenContract (with registry address)
4. Updating `dojo_slot.toml` with the denshokan_address
5. Running `sozo migrate -P slot`
6. Updating `torii_slot.toml` and `client-budokan/.env.slot`

#### CRITICAL: Two Config Files

There are TWO `dojo_slot.toml` files that MUST be kept in sync:
- `./dojo_slot.toml` (root) - **sozo reads from here**
- `./contracts/dojo_slot.toml` (contracts dir)

If deployment fails with "contract address 0x0 not deployed", check that BOTH files have the correct `denshokan_address` in `[init_call_args]`.

#### Manual Step-by-Step Deployment

If the script fails, deploy manually:

```bash
# 1. Clean and build
cd contracts && sozo clean -P slot && sozo build -P slot && cd ..

# 2. Declare classes
RPC="https://api.cartridge.gg/x/YOUR-SLOT/katana"
ACCOUNT="0x..."
PKEY="0x..."

sozo declare -P slot --account-address "$ACCOUNT" --private-key "$PKEY" --rpc-url "$RPC" \
    "./target/slot/zkube_MinigameRegistryContract.contract_class.json"
# Note the class hash

sozo declare -P slot --account-address "$ACCOUNT" --private-key "$PKEY" --rpc-url "$RPC" \
    "./target/slot/zkube_FullTokenContract.contract_class.json"
# Note the class hash

# 3. Deploy MinigameRegistry
sozo deploy -P slot --account-address "$ACCOUNT" --private-key "$PKEY" --rpc-url "$RPC" \
    "$REGISTRY_CLASS" --constructor-calldata str:'zKube Registry' str:'ZKUBEREG' str:'' 1
# Note the deployed address (REGISTRY_ADDR)

# 4. Deploy FullTokenContract
sozo deploy -P slot --account-address "$ACCOUNT" --private-key "$PKEY" --rpc-url "$RPC" \
    "$TOKEN_CLASS" --constructor-calldata str:'zKube' str:'ZK' str:'' "$ACCOUNT" 500 0 "$REGISTRY_ADDR" 1
# Note the deployed address (TOKEN_ADDR)

# 5. Update BOTH dojo_slot.toml files with TOKEN_ADDR as denshokan_address

# 6. Run migrate (MUST run from workspace root, NOT from contracts/)
sozo migrate -P slot
```

#### After Deployment

1. Copy manifest: `cp manifest_slot.json contracts/manifest_slot.json`
2. Start Torii: `torii --config contracts/torii_slot.toml`
3. Start client: `cd client-budokan && pnpm slot`

#### Troubleshooting

**"Invalid new schema to upgrade resource"**
- The world has incompatible state from a previous deployment
- Solution: Restart katana to get a fresh chain, or change the `seed` in `dojo_slot.toml`

**"Requested contract address 0x0 is not deployed"**
- The `denshokan_address` in init_call_args is wrong or the FullTokenContract wasn't deployed
- Check BOTH `dojo_slot.toml` files have the correct address

**"contract address 0x... is not deployed"**
- The FullTokenContract address doesn't match what's deployed
- Redeploy the token contract and update the config files
