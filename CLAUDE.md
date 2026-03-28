# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle game built with the Dojo framework on Starknet. Players manipulate blocks on an 8x10 grid to form solid horizontal lines, progress through 10-level zones, defeat bosses, and enter endless mode. The game features VRF-powered randomness, a constraint system, daily challenges, and an achievement system. No economy (no cubes, no shops) — stars are the only progression signal.

## Architecture

```
zkube/
├── Scarb.toml              # Workspace root (shared dependencies)
├── contracts/              # Dojo smart contracts (Cairo 2.13.1)
│   ├── src/
│   │   ├── systems/        # game, grid, moves, level, config, renderer, daily_challenge
│   │   ├── models/         # Game, GameSeed, PlayerMeta, GameSettings, MapEntitlement, Daily
│   │   ├── helpers/        # controller, level, packing, gravity, random, boss, scoring, game_over
│   │   ├── types/          # bonus, difficulty, constraint, block, width, level, daily
│   │   └── elements/       # difficulties/
│   ├── dojo_*.toml         # Network-specific configs
│   └── manifest_*.json     # Deployment manifests
├── packages/
│   ├── game_erc721/        # Legacy ERC721 contract (replaced by FullTokenContract)
│   └── token/              # ERC20 test token (Fake LORD)
├── client-budokan/         # React/TypeScript frontend (ACTIVE)
│   ├── src/
│   │   ├── dojo/           # Dojo client setup and game helpers
│   │   ├── ui/             # React UI (pages, components, elements)
│   │   ├── hooks/          # Shared React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── stores/         # Zustand state stores
│   │   └── contexts/       # React context providers
├── assets/                 # Game graphics, sounds, and media
├── scripts/                # Deployment and utility scripts
├── docs/                   # Documentation
└── references/             # Reference implementations
```

## Technology Stack

### Frontend (`client-budokan/`)
- **Framework:** React 19.2.4 + TypeScript ~5.9.3
- **Build Tool:** Vite 7.3.1
- **Styling:** TailwindCSS 4.1.18
- **State Management:** Zustand 5.0.11, MobX 6.13.2, RECS (Reactive ECS)
- **Animation:** Motion 12.34.1, GSAP 3.14.2
- **Audio:** Howler.js 2.2.4
- **Starknet:** starknet 8.5.2, @starknet-react/core 5.0.1
- **Dojo:** @dojoengine/sdk 1.9.0, @dojoengine/core 1.8.8
- **Wallet:** Cartridge Controller 0.13.9

### Smart Contracts (`contracts/`)
- **Language:** Cairo 2.13.1
- **Framework:** Dojo 1.8.0
- **Network:** Starknet 2.13.1
- **Standards:** OpenZeppelin Cairo v3.0.0-alpha.3
- **External:** game-components v2.13.1, achievement (Cartridge arcade)

## How Everything Works Together

### Game Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  Home    │───>│ FreeMint │───>│  Create  │───>│   Play   │      │
│  │  (Zone)  │    │  (NFT)   │    │  (Game)  │    │  Screen  │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Transactions via Cartridge Controller
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOJO WORLD (Starknet)                            │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │  Game System   │  │ Moves System │  │ Level System    │        │
│  │  - create()    │  │ - move()     │  │ - level gen     │        │
│  │  - create_run()│  └──────────────┘  │ - constraints   │        │
│  │  - surrender() │                    └─────────────────┘        │
│  └────────────────┘                                                │
│           │          ┌──────────────┐  ┌─────────────────┐        │
│           ▼          │Daily Challenge│  │Achievement      │        │
│  ┌────────────────┐  │ - create     │  │ System          │        │
│  │   Game Model   │  │ - register   │  │ - trophies      │        │
│  │  - blocks      │  │ - settle     │  └─────────────────┘        │
│  │  - run_data    │  └──────────────┘                              │
│  │  - combo/over  │  ┌──────────────┐  ┌─────────────────┐        │
│  └────────────────┘  │  GameSeed    │  │  PlayerMeta     │        │
│                      │  - VRF seed  │  │  - best_level   │        │
│                      └──────────────┘  └─────────────────┘        │
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
   - Selects a zone (Polynesian, Feudal Japan, Ancient Persia)
   - Calls `free_mint()` on FullTokenContract (gets NFT game token)
   - Calls `create()` on game_system with the token ID
   - VRF generates random seed (or pseudo-random on slot)
   - Initial grid created, level 1 config generated from seed

2. **Gameplay (Zone + Endless):**
   - Frontend displays grid from `Game.blocks` (packed felt252 = 240 bits)
   - User swipes blocks horizontally via drag handlers
   - `move()` transaction updates blocks, applies gravity, checks lines
   - Completed lines increase score, track combos and constraint progress
   - Level completes when score threshold + constraints met
   - 10 levels per zone, boss at level 10
   - After boss clear: `zone_cleared` flag set, endless mode begins
   - Endless mode: increasingly difficult levels, depth tracked in `endless_depth`
   - Game over when grid fills up (no valid moves)

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
pub const BLOCK_SIZE: u8 = 8;       // 8 blocks per row
pub const BLOCK_BIT_COUNT: u8 = 3;  // 3 bits per block
pub const ROW_BIT_COUNT: u8 = 24;   // 24 bits per row
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;
```

### Level System

10-level zones with progressive difficulty, followed by endless mode:
- **Moves:** 20 at level 1, scales up with level (LEVEL_CAP=50 for scaling)
- **Points ratio:** 0.80 at level 1, scales to 1.80 at cap
- **Difficulty:** VeryEasy → Easy → Medium → MediumHard → Hard → VeryHard → Expert → Master
- **Constraints:** ComboLines, BreakBlocks, ComboStreak, KeepGridBelow
- **Boss at level 10:** Dual/triple constraints, themed boss identity
- **Endless mode:** After boss clear, difficulty keeps scaling, `endless_depth` increments

### Boss System

Boss at level 10 with themed identity:
- 10 boss identities defined in `contracts/src/helpers/boss.cairo`
- Boss ID derived from `level_seed % 10 + 1`
- Boss levels have dual or triple constraints
- Boss-only constraint types: KeepGridBelow

### Constraint System

Constraint types (None, ComboLines, BreakBlocks, ComboStreak, KeepGridBelow):
- **Unified budget system:** Regular types generated from same budget engine
- **Regular levels (3+):** Type selected by difficulty-weighted probabilities
- **Boss level:** Boss identity determines types, budget_max determines values
- 10 boss identities in `contracts/src/helpers/boss.cairo`

### Daily Challenge System

- Created by admin via `daily_challenge` system
- Shared seed for all players (deterministic)
- Leaderboard ranked by depth-then-score
- Prize pool distribution on settlement

### run_data Layout (101 bits)

```
Bits 0-7:     current_level (u8)
Bits 8-15:    level_score (u8)
Bits 16-23:   level_moves (u8)
Bits 24-31:   constraint_progress (u8)
Bits 32-39:   constraint_2_progress (u8)
Bits 40-47:   max_combo_run (u8)
Bits 48-79:   total_score (u32)
Bit 80:       zone_cleared (bool)
Bits 81-88:   endless_depth (u8)
Bits 89-92:   zone_id (u4, reserved)
Bits 93-100:  mutator_mask (u8, reserved)
```

## Key Files Reference

### Frontend Pages
- `client-budokan/src/App.tsx` - AppShell with tab-based routing + BottomTabBar
- `client-budokan/src/ui/pages/HomePage.tsx` - Zone selector + play button
- `client-budokan/src/ui/pages/PlayScreen.tsx` - Gameplay (grid + HUD, no bonuses)
- `client-budokan/src/ui/pages/MapPage.tsx` - 10-level zone map with winding path
- `client-budokan/src/ui/pages/LeaderboardPage.tsx` - Single ranked leaderboard
- `client-budokan/src/ui/pages/DailyChallengePage.tsx` - Daily challenge
- `client-budokan/src/ui/pages/SettingsPage.tsx` - Audio + theme + account

### Frontend Navigation
- Tab-based: `home | map | ranks | settings` (persistent bottom tab bar)
- Overlay pages: `play | daily` (tab bar hidden)
- Navigation store: `client-budokan/src/stores/navigationStore.ts`

### Smart Contract Systems
- `contracts/src/systems/game.cairo` - create, create_run, surrender
- `contracts/src/systems/moves.cairo` - move()
- `contracts/src/systems/grid.cairo` - Grid operations
- `contracts/src/systems/level.cairo` - Level generation + constraints
- `contracts/src/systems/config.cairo` - Game settings management
- `contracts/src/systems/renderer.cairo` - NFT metadata + SVG
- `contracts/src/systems/daily_challenge.cairo` - Daily challenge system

### Smart Contract Models
- `contracts/src/models/game.cairo` - Game state (blocks, run_data, combo, over)
- `contracts/src/models/player.cairo` - PlayerMeta (best_level)
- `contracts/src/models/config.cairo` - GameSettings
- `contracts/src/models/entitlement.cairo` - MapEntitlement (zone access)
- `contracts/src/models/daily.cairo` - Daily challenge models

### Smart Contract Helpers
- `contracts/src/helpers/controller.cairo` - Grid manipulation logic
- `contracts/src/helpers/level.cairo` - Level generation with settings
- `contracts/src/helpers/packing.cairo` - RunData bit-packing (101 bits)
- `contracts/src/helpers/boss.cairo` - Boss identity system
- `contracts/src/helpers/scoring.cairo` - Score calculations
- `contracts/src/helpers/game_over.cairo` - Game over handling
- `contracts/src/helpers/daily.cairo` - Daily challenge helpers

### Token Contracts
- `packages/token/` - ERC20 "Fake LORD" token with faucet (development only)
- `packages/game_erc721/` - Legacy ERC721 (replaced by FullTokenContract)
- **FullTokenContract** - game-components ERC721 for game NFTs (deployed externally)

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
- Check `client-budokan/src/ui/components/` for React UI components
- Check `client-budokan/src/ui/pages/` for page components
- Check `contracts/src/helpers/` for utility functions
- Use existing hooks in `client-budokan/src/hooks/`

### State Management
- Game state: RECS via Dojo (reactive, synced from Torii)
- UI state: Zustand stores (`navigationStore.ts`, `moveTxStore.ts`)
- Audio: React Context (`MusicPlayerProvider`, `SoundPlayerProvider`)

### Transaction Flow
- All game transactions go through `client-budokan/src/dojo/systems.ts`
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
- Location: `client-budokan/src/` (co-located test files)
- Run: `cd client-budokan && pnpm test`

### Contract Tests
- Framework: dojo_cairo_test 1.8.0
- Location: `contracts/src/tests/`
- Tests: `test_run_data`
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

### Slot Deployment

Use the automated deploy script:
```bash
./scripts/deploy_slot.sh
```

This script handles building, declaring/deploying token contracts, updating configs, and running `sozo migrate`.

#### After Deployment

1. Copy manifest: `cp manifest_slot.json contracts/manifest_slot.json`
2. Start Torii: `torii --config contracts/torii_slot.toml`
3. Start client: `cd client-budokan && pnpm slot`

#### Troubleshooting

**"Invalid new schema to upgrade resource"**
- Restart katana for a fresh chain, or change the `seed` in `dojo_slot.toml`

**"Requested contract address 0x0 is not deployed"**
- The `denshokan_address` in init_call_args is wrong or the FullTokenContract wasn't deployed

## Documentation

See `/docs/` for detailed documentation:
- **CONFIGURABLE_SETTINGS.md** - GameSettings customization
- **DEPLOYMENT_GUIDE.md** - Network deployment guide
- **references/** - External reference material
