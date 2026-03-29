# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle game built with the Dojo framework on Starknet. Players manipulate blocks on an 8×10 grid to form complete horizontal lines. Two game modes — **Map** (10-level structured progression with boss) and **Endless** (pure survival with score-based difficulty scaling) — are available on all 3 maps. The game features VRF-powered randomness, a constraint system (Map mode), mutator hooks, daily challenges, and an achievement system. No economy (no cubes, no shops) — stars and score are the only progression signals.

## Architecture

```
zkube/
├── Scarb.toml              # Workspace root (shared dependencies)
├── contracts/              # Dojo smart contracts (Cairo 2.13.1)
│   ├── src/
│   │   ├── systems/        # game, grid, moves, level, config, renderer, daily_challenge
│   │   ├── models/         # Game, GameSeed, PlayerMeta, GameSettings, MapEntitlement, Daily
│   │   ├── helpers/        # controller, level, packing, gravity, random, boss, scoring, game_over
│   │   ├── types/          # bonus, difficulty, constraint, block, width, level, daily, mode, mutator
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
│  ┌──────────┐    ┌──────────┐    ┌────────────┐    ┌──────────┐    │
│  │  Home    │───>│ FreeMint │───>│  Create    │───>│   Play   │    │
│  │(Map+Mode)│    │  (NFT)   │    │(game,mode) │    │  Screen  │    │
│  └──────────┘    └──────────┘    └────────────┘    └──────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Transactions via Cartridge Controller
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DOJO WORLD (Starknet)                            │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │  Game System   │  │ Moves System │  │ Level System    │        │
│  │- create(id,mode)│ │ - move()     │  │- initialize_lvl │        │
│  │- create_run()  │  │   (mode-aware)│  │- init_endless   │        │
│  │- surrender()   │  └──────────────┘  │- finalize_lvl   │        │
│  └────────────────┘                    └─────────────────┘        │
│           │          ┌──────────────┐  ┌─────────────────┐        │
│           ▼          │Daily Challenge│  │  PlayerBestRun  │        │
│  ┌────────────────┐  │ - create     │  │(player,map,mode)│        │
│  │   Game Model   │  │ - register   │  │  - best_score   │        │
│  │  - blocks      │  │ - settle     │  │  - best_stars   │        │
│  │  - run_data    │  │ - game_mode  │  └─────────────────┘        │
│  │  - combo/over  │  └──────────────┘                              │
│  └────────────────┘  ┌──────────────┐  ┌─────────────────┐        │
│                      │  GameSeed    │  │  PlayerMeta     │        │
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
   - Selects a map (Polynesian, Feudal Japan, Ancient Persia)
   - Selects a mode (Map or Endless)
   - Calls `free_mint(settings_id)` on FullTokenContract (gets NFT with map's settings_id baked in)
   - Calls `create(game_id, mode)` on game_system
   - settings_id read from token → GameSettings loaded from world
   - VRF generates random seed (or pseudo-random on slot)
   - Mutator rolled: Map mode from map's gated pool, Endless from full pool
   - Map mode: Level 1 initialized with constraints
   - Endless mode: Perpetual level initialized (VeryEasy, unlimited moves, no constraints)
   - Grid initialized with blocks

2. **Gameplay — Map Mode (mode=0):**
   - 10 levels with progressive difficulty, constraints from L3+
   - `move()` checks level completion (score threshold + constraints met)
   - Level completes → auto-advance to next level (same transaction)
   - Boss at level 10 (dual constraints, themed boss identity)
   - Clearing L10 boss → `zone_cleared = true` → game ends (clean exit)
   - Star ratings (0-3) per level based on moves efficiency
   - Ranking: `total_stars × 65536 + total_score`

3. **Gameplay — Endless Mode (mode=1):**
   - Starts at VeryEasy, scales to Master via score thresholds
   - Score multiplier increases per difficulty tier (1.0× → 4.0×)
   - No constraints, no move limits, no levels
   - `move()` only checks: grid full → game over
   - Difficulty updates when total_score crosses thresholds
   - Ranking: pure `total_score`

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

**Map Mode:** 10-level zones with progressive difficulty:
- **Moves:** 20 at level 1, scales up with level (LEVEL_CAP=50 for scaling)
- **Points ratio:** 0.80 at level 1, scales to 1.80 at cap
- **Difficulty:** VeryEasy → Easy → Medium → MediumHard → Hard → VeryHard → Expert → Master
- **Constraints:** ComboLines, BreakBlocks, ComboStreak, KeepGridBelow (from L3+)
- **Boss at level 10:** Dual/triple constraints, themed boss identity
- **Level 10 clear:** `zone_cleared = true`, game ends with final score + stars

**Endless Mode:** Score-based difficulty scaling, no levels:
- Starts at VeryEasy, single perpetual "level" (unlimited moves, no constraints)
- Difficulty thresholds: [0, 15, 40, 80, 150, 280, 500, 900]
- Score multipliers: [1.0×, 1.2×, 1.4×, 1.7×, 2.0×, 2.5×, 3.3×, 4.0×]
- Difficulty only goes up (monotonic), never down
- Game over only when grid fills up

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

### run_data Layout (102 bits)

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
Bits 89-92:   zone_id (u4, reserved)
Bits 93-100:  active_mutator_id (u8)
Bit 101:      mode (u1)               — 0=Map, 1=Endless
## EGC Integration (Embeddable Game Component)

The game uses Provable Games' `game_components_minigame` framework:

### Token → Game Flow
1. `FullTokenContract.free_mint(settings_id)` → Creates NFT with `settings_id` in TokenMetadata
2. `settings_id` represents the **map** (0=Polynesian, 1=Japan, 2=Persia) — NOT the mode
3. `game_system.create(game_id, mode)` reads `settings_id` from token metadata via `ConfigUtilsTrait::get_game_settings()`
4. `GameSettings` loaded from Dojo world storage by `settings_id`
5. **Mode** (Map=0, Endless=1) is a runtime parameter — not stored in the token

### Map Access Control
- `GameSettingsMetadata.is_free` determines if a map requires purchase
- settings_id 0 (Polynesian): free for all
- settings_id 1, 2 (Japan, Persia): require `MapEntitlement` (purchased)
- Daily challenge games bypass entitlement checks

### Mutator System
- Pool of up to 32 mutators (gated per map via `GameSettings.allowed_mutators` bitmask)
- Map mode: rolls from map's gated pool at game start
- Endless mode: rolls from full pool
- Mutator hooks exist (no-op): `modify_level_config()`, `modify_score()`, `modify_block_weights()`
- Actual mutator effects to be defined later

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
- `contracts/src/systems/game.cairo` - create(game_id, mode), create_run, surrender
- `contracts/src/systems/moves.cairo` - move() (mode-aware: Map checks completion, Endless checks difficulty)
- `contracts/src/systems/grid.cairo` - Grid operations (execute_move, initialize_grid)
- `contracts/src/systems/level.cairo` - initialize_level, initialize_endless_level, finalize_level
- `contracts/src/systems/config.cairo` - Game settings management, map pricing, entitlements
- `contracts/src/systems/renderer.cairo` - NFT metadata + SVG
- `contracts/src/systems/daily_challenge.cairo` - Daily challenge system (mode-aware)

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
