# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle roguelike built with the Dojo framework on Starknet. Players manipulate blocks on an 8x10 grid to form solid horizontal lines, progress through levels, earn cubes (ERC1155 currency), and spend them on upgrades. The game features VRF-powered randomness, strategic bonuses, a level system with constraints, a cube economy with two shops, a daily quest system, and an achievement system.

## Architecture

```
zkube/
├── Scarb.toml              # Workspace root (shared dependencies)
├── contracts/              # Dojo smart contracts (Cairo 2.13.1)
│   ├── src/
│   │   ├── systems/        # game, shop, cube_token, config, quest, renderer
│   │   ├── models/         # Game, GameSeed, PlayerMeta, GameSettings
│   │   ├── helpers/        # controller, level, packing, gravity, random
│   │   ├── types/          # bonus, difficulty, constraint, consumable, level
│   │   └── elements/       # bonuses/, difficulties/, tasks/, quests/
│   ├── dojo_*.toml         # Network-specific configs
│   └── manifest_*.json     # Deployment manifests
├── packages/
│   ├── game_erc721/        # Legacy ERC721 contract (replaced by FullTokenContract)
│   └── token/              # ERC20 test token (Fake LORD)
├── client-budokan/         # React/TypeScript frontend (BEING DROPPED)
├── mobile-app/             # PixiJS + Capacitor mobile app (ACTIVE FRONTEND)
│   ├── src/
│   │   ├── pixi/           # PixiJS game rendering (components, hooks, utils)
│   │   ├── dojo/           # Dojo client setup and game helpers
│   │   ├── ui/             # React UI screens (Home, Settings, etc.)
│   │   └── hooks/          # Shared React hooks
│   ├── ios/                # Capacitor iOS project
│   └── android/            # Capacitor Android project
├── assets/                 # Game graphics, sounds, and media
├── scripts/                # Deployment and utility scripts
├── docs/                   # Documentation
└── references/             # Reference implementations (death-mountain, dark-shuffle)
```

**Workspace**: All contracts are in a unified Scarb workspace. Run `scarb build` from root to build all packages.

## Technology Stack

### Mobile App (`mobile-app/`) — ACTIVE FRONTEND
- **Renderer:** PixiJS 8.16.0 + @pixi/react 8.0.5
- **Framework:** React 19.2.4 + TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **Native:** Capacitor 8.0.2 (iOS + Android)
- **Styling:** TailwindCSS 3.4.4
- **State Management:** Zustand 4.5.5, MobX 6.13.2, RECS (Reactive ECS)
- **Starknet:** starknet 8.5.2, @starknet-react/core 5.0.1
- **Dojo:** @dojoengine/sdk 1.8.1, @dojoengine/core 1.8.1
- **Wallet:** Cartridge Controller 0.10.7
- **Audio:** @pixi/sound 6.0.1

### Legacy Frontend (`client-budokan/`) — BEING DROPPED
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 6.3.5
- **Styling:** TailwindCSS 3.4.4
- **State Management:** Zustand 4.5.5, MobX 6.13.2, RECS (Reactive ECS)
- **Animation:** Framer Motion 11.2.10, GSAP 3.12.5
- **Audio:** use-sound (Howler.js)

### Smart Contracts (`contracts/`)
- **Language:** Cairo 2.13.1
- **Framework:** Dojo 1.8.0
- **Network:** Starknet 2.13.1
- **Standards:** OpenZeppelin Cairo v3.0.0-alpha.3
- **External:** game-components v2.13.1, achievement, quest (Cartridge arcade)

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
│  └────────────────┘  │Quest System  │  │Achievement      │        │
│           │          │ - progress   │  │ System          │        │
│           ▼          │ - claim      │  │ - trophies      │        │
│  ┌────────────────┐  └──────────────┘  └─────────────────┘        │
│  │   Game Model   │  ┌──────────────┐  ┌─────────────────┐        │
│  │  - blocks      │  │  GameSeed    │  │  PlayerMeta     │        │
│  │  - run_data    │  │  - VRF seed  │  │  - upgrades     │        │
│  │  - combo/over  │  └──────────────┘  │  - best_level   │        │
│  └────────────────┘                    └─────────────────┘        │
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
   - Calls `free_mint()` on the FullTokenContract (gets NFT game token)
   - Calls `create()` or `create_with_cubes()` on game_system with the token ID
   - VRF generates random seed for the game (or pseudo-random on slot)
   - Initial grid is created, level 1 config generated from seed

2. **Gameplay (Level System):**
   - Frontend displays grid from `Game.blocks` (packed felt252 = 240 bits)
   - User swipes blocks horizontally via drag handlers
   - `move()` transaction updates blocks, applies gravity, checks lines
   - Completed lines increase score, track combos and constraint progress
   - Quest progress tracked (games played, lines cleared, combos)
   - Level completes when score threshold + constraints met
   - Bonuses awarded based on star rating (3-star/2-star/1-star performance)
   - Every 10 levels, in-game shop appears to spend cubes on consumables
   - On game over, earned cubes are minted as ERC1155 tokens to player's wallet

3. **State Synchronization:**
   - Torii indexes all Game model changes
   - Frontend subscribes via `getSyncEntities()`
   - RECS (Reactive ECS) updates React components automatically
   - Animations triggered via `useGridAnimations` hook

### Grid Representation

The game grid is stored as a single `felt252` (240 bits):
- 10 rows x 8 columns
- Each block = 3 bits (values 0-4 for sizes, 0 = empty)
- Row = 24 bits (8 blocks x 3 bits)
- Total = 240 bits packed into felt252

```cairo
// Block packing constants
pub const BLOCK_SIZE: u8 = 8;       // 8 blocks per row
pub const BLOCK_BIT_COUNT: u8 = 3;  // 3 bits per block
pub const ROW_BIT_COUNT: u8 = 24;   // 24 bits per row
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;
```

### Bonus System

Five types of bonuses, each with 3 upgrade levels:
- **Hammer:** Clears a specific block and connected same-size blocks
- **Wave:** Clears an entire horizontal row
- **Totem:** Clears all blocks of the same size on the grid
- **Shrink:** Reduces block size by 1 (unlockable, 200 CUBE)
- **Shuffle:** Randomizes block positions (unlockable, 200 CUBE)

Players select 3 bonuses before each run. Bonuses are earned through:
- Level completion (random bonus from selected 3)
- Boss level rewards (every 10 levels)

### Level System

50 levels with progressive difficulty:
- **Moves:** 20 at level 1, scales to 60 at level 50
- **Points ratio:** 0.80 at level 1, scales to 1.80 at level 50
- **Difficulty:** VeryEasy -> Easy -> Medium -> MediumHard -> Hard -> VeryHard -> Expert -> Master
- **Constraints:** ClearLines (X lines in one move, Y times) or NoBonusUsed
- **Variance:** +/-5% consistent across all levels

### Boss Levels

Special levels every 10 levels with bonus rewards:
- **Level 10:** +10 CUBE bonus, dual constraints
- **Level 20:** +20 CUBE bonus, dual constraints
- **Level 30:** +30 CUBE bonus, dual constraints
- **Level 40:** +40 CUBE bonus, dual constraints
- **Level 50:** +50 CUBE bonus, victory state (run_completed)

### Combo Cube Rewards

Clearing multiple lines in one move awards bonus cubes:
| Lines Cleared | Bonus CUBE |
|---------------|------------|
| 4 | +1 |
| 5 | +3 |
| 6 | +5 |
| 7 | +10 |
| 8 | +25 |
| 9+ | +50 |

### Constraint System

Level constraints add challenge for bonus rewards:
- **ClearLines:** Clear X lines in a single move, Y times per level
- **NoBonusUsed:** Complete level without using any bonus
- **Dual constraints:** Higher difficulties can have two constraints

Parameters scale from Easy to Master difficulty:
- None chance: 30% -> 0%
- NoBonusUsed chance: 0% -> 25%
- Dual constraint chance: 0% -> 50%

### Quest System

Daily quests for earning CUBE tokens (102 CUBE/day total):

| Category | Quest | Requirement | Reward |
|----------|-------|-------------|--------|
| Player | Warm-Up | Play 1 game | 3 CUBE |
| Player | Getting Started | Play 3 games | 6 CUBE |
| Player | Dedicated | Play 5 games | 12 CUBE |
| Clearer | Line Breaker | Clear 10 lines | 3 CUBE |
| Clearer | Line Crusher | Clear 30 lines | 6 CUBE |
| Clearer | Line Master | Clear 50 lines | 12 CUBE |
| Combo | Combo Starter | 3+ line combo | 5 CUBE |
| Combo | Combo Builder | 5+ line combo | 10 CUBE |
| Combo | Combo Expert | 7+ line combo | 20 CUBE |
| Finisher | Daily Champion | Complete all 9 | 25 CUBE |

### Achievement System

28 trophies tracked via Cartridge's arcade achievement system:
- **Grinder:** Games played milestones (10/25/50/100/250 games)
- **Clearer:** Lines cleared milestones (100/500/1K/5K/10K lines)
- **Combo:** 3+ line combo milestones (10/50/100 combos)
- **Chain:** 5+ line combo milestones (5/25/50 combos)
- **SuperChain:** 7+ line combo milestones (1/10/25 combos)
- **Leveler:** Level reached milestones (10/20/30/40/50)
- **Scorer:** High score milestones (100/200/300 points)
- **Master:** Complete all daily quests

## Key Files Reference

### Mobile App Entry Points (Active)
- `mobile-app/src/main.tsx` - App initialization and providers
- `mobile-app/src/App.tsx` - Router setup
- `mobile-app/src/dojo/setup.ts` - Dojo client initialization
- `mobile-app/src/pixi/components/pages/MainScreen.tsx` - PixiJS page navigator
- `mobile-app/src/pixi/components/map/MapPage.tsx` - Progression map screen
- `mobile-app/src/pixi/components/pages/PlayScreen.tsx` - Game play screen
- `mobile-app/src/ui/screens/Home.tsx` - Home/MyGames screen

### Legacy Frontend Entry Points (Being Dropped)
- `client-budokan/src/main.tsx` - App initialization and providers
- `client-budokan/src/App.tsx` - Router setup
- `client-budokan/src/dojo/setup.ts` - Dojo client initialization
- `client-budokan/dojo.config.ts` - Network configuration

### Smart Contract Entry Points
- `contracts/src/systems/game.cairo` - Main game logic (create, move, apply_bonus, purchase_consumable)
- `contracts/src/systems/shop.cairo` - Permanent shop (upgrades, bag size, bridging rank)
- `contracts/src/systems/cube_token.cairo` - Soulbound ERC1155 CUBE token (mint/burn)
- `contracts/src/systems/quest.cairo` - Daily quest system (progress, claim)
- `contracts/src/systems/config.cairo` - Game settings management
- `contracts/src/models/game.cairo` - Game state model (blocks, run_data, combo, over)
- `contracts/src/models/player.cairo` - PlayerMeta model (upgrades, best_level)
- `contracts/src/models/config.cairo` - GameSettings model (configurable parameters)
- `contracts/src/helpers/controller.cairo` - Grid manipulation logic
- `contracts/src/helpers/level.cairo` - Level generation with settings
- `contracts/src/constants.cairo` - Game constants and namespace

### Token Contracts
- `packages/token/` - ERC20 "Fake LORD" token with faucet (development only)
- `packages/game_erc721/` - Legacy ERC721 (replaced by FullTokenContract)
- **FullTokenContract** - game-components ERC721 for game NFTs (deployed externally)

### Cube Token (ERC1155)
- `contracts/src/systems/cube_token.cairo` - Soulbound ERC1155 with CUBE_TOKEN_ID=1
- Mint/burn controlled by MINTER_ROLE (granted to game_system, shop_system, quest_system)
- Torii indexes balances via registered external contract

## Development Commands

### Mobile App (Active Frontend)
```bash
cd mobile-app
pnpm slot        # Local development (slot, port 5126)
pnpm sepolia     # Sepolia testnet
pnpm mainnet     # Mainnet
pnpm build       # Production build (tsc + vite)
pnpm test        # Run tests (vitest)
pnpm build:cap   # Build + Capacitor copy
pnpm cap:ios     # Open Xcode project
pnpm cap:android # Open Android Studio project
```

### Legacy Frontend (Being Dropped)
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
scarb build              # Build all packages

# From contracts directory
cd contracts
sozo build -P slot       # Build for slot
sozo build -P sepolia    # Build for sepolia
sozo build -P mainnet    # Build for mainnet
scarb test               # Run Cairo tests
```

### Deployment
```bash
# Automated slot deployment (recommended)
./scripts/deploy_slot.sh

# Manual deployment
cd contracts
sozo migrate -P slot     # Deploy to slot (from workspace root!)
sozo migrate -P sepolia  # Deploy to sepolia
sozo migrate -P mainnet  # Deploy to mainnet
```

## Namespace

Current namespace: `zkube_budo_v1_2_0`

Models are prefixed with this namespace in Torii queries:
- `zkube_budo_v1_2_0-Game`
- `zkube_budo_v1_2_0-GameSettingsMetadata`
- `zkube_budo_v1_2_0-PlayerMeta`

## Important Patterns

### Reuse Existing Components
- Check `mobile-app/src/pixi/components/` for PixiJS game components
- Check `mobile-app/src/ui/` for React UI screens
- Check `contracts/src/helpers/` for utility functions
- Use existing hooks in `mobile-app/src/hooks/` and `mobile-app/src/pixi/hooks/`

### State Management
- Game state: RECS via Dojo (reactive, synced from Torii)
- UI state: Zustand stores (`generalStore.ts`, `moveTxStore.ts`)
- Audio: React Context (`MusicPlayerProvider`, `SoundPlayerProvider`)
- Quests: React Context (`QuestsProvider`)

### Transaction Flow
- All game transactions go through `mobile-app/src/dojo/systems.ts`
- Transactions are wrapped with loading toasts and error handling
- Move transactions update `moveTxStore` for UI feedback

### Entity ID Normalization
Torii stores entity IDs without leading zeros:
```typescript
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};
```

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
- `quest` (Cairo) - Quest system

### Provable Games
- `game_components_minigame` - Minigame framework
- `game_components_token` - Token utilities (FullTokenContract)
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
- Location: `mobile-app/src/` (co-located test files)
- Run: `cd mobile-app && pnpm test`

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
# 1. Clean and build (from workspace root)
sozo clean -P slot && sozo build -P slot

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
3. Start client: `cd mobile-app && pnpm slot`

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

## Documentation

See `/docs/` for detailed documentation:
- **GAME_DESIGN.md** - Complete game design document
- **QUEST_SYSTEM.md** - Daily quest system implementation
- **CONFIGURABLE_SETTINGS.md** - GameSettings customization
- **DEPLOYMENT_GUIDE.md** - Network deployment guide
- **WORKSPACE_STRUCTURE.md** - Scarb workspace organization
- **AGENT_QUICKSTART.md** - Quick reference for Claude agents
- **MILESTONES.md** - Project milestones and completed features
- **FUTURE_FEATURES.md** - Roadmap and planned features
- **PROGRESSION_MAP.md** - Super Mario World-style level progression map
- **ASSET_LIST.md** - Comprehensive asset inventory for mobile client
