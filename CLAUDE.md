# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle game built with the Dojo framework on Starknet. Players manipulate blocks on an 8x10 grid to form solid horizontal lines and earn points. The game features VRF-powered randomness, strategic bonuses, multiple difficulty levels, and an achievement system.

## Architecture

```
zkube/
├── client-budokan/     # React/TypeScript frontend application
├── contracts/          # Dojo smart contracts (Cairo 2.13.1)
├── token/              # ERC20 token contract (Fake LORD)
├── game_erc721/        # ERC721 NFT contract for game tokens
├── assets/             # Game graphics, sounds, and media
├── scripts/            # Python utility scripts
└── docs/               # Documentation
```

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
│  ┌────────────────┐    ┌────────────────┐    ┌─────────────────┐   │
│  │  Game System   │    │ Config System  │    │Achievement System│   │
│  │  - create()    │    │ - settings     │    │ - trophies      │   │
│  │  - move()      │    │ - difficulty   │    │ - progress      │   │
│  │  - surrender() │    └────────────────┘    └─────────────────┘   │
│  │  - apply_bonus │                                                 │
│  └────────────────┘                                                 │
│           │                                                         │
│           ▼                                                         │
│  ┌────────────────┐    ┌────────────────┐                          │
│  │   Game Model   │    │  GameSeed      │                          │
│  │  - blocks      │    │  - VRF seed    │                          │
│  │  - score       │    └────────────────┘                          │
│  │  - bonuses     │                                                 │
│  └────────────────┘                                                 │
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
   - Calls `create()` on game_system with the token ID
   - VRF generates random seed for the game
   - Initial grid is created and stored on-chain

2. **Gameplay:**
   - Frontend displays grid from `Game.blocks` (packed felt252 = 240 bits)
   - User swipes blocks horizontally via drag handlers
   - `move()` transaction updates blocks, applies gravity, checks lines
   - Completed lines are removed, score increases, combos tracked
   - New line added after each move
   - Bonuses earned based on score/combo thresholds

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
- `contracts/src/systems/game.cairo` - Main game logic
- `contracts/src/models/game.cairo` - Game state model
- `contracts/src/helpers/controller.cairo` - Grid manipulation logic
- `contracts/src/constants.cairo` - Game constants

### External Contracts
- `token/` - ERC20 "Fake LORD" token with faucet
- `game_erc721/` - Game NFT tokens (each game = 1 NFT)

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

### Contracts
```bash
cd contracts
scarb slot       # Deploy to slot
scarb sepolia    # Deploy to sepolia
scarb mainnet    # Deploy to mainnet
scarb build      # Build contracts
scarb test       # Run Cairo tests
```

## Namespace

Current namespace: `zkube_budo_v1_1_3`

Models are prefixed with this namespace in Torii queries:
- `zkube_budo_v1_1_3-Game`
- `zkube_budo_v1_1_3-GameSettingsMetadata`

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
| Slot | api.cartridge.gg/x/budokan-matth/katana | api.cartridge.gg/x/budokan-matth/torii |
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
