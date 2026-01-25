# Claude Agent Quick Reference for zkube

This document provides essential context for Claude agents working on zkube.

## Project Summary

zkube is an on-chain puzzle game (like Tetris meets Match-3) built with:
- **Contracts**: Cairo 2.13.1 + Dojo 1.8.0
- **Frontend**: React 18 + TypeScript + Dojo SDK
- **Token**: ERC721 game NFTs via game-components framework

## Key Directories

```
zkube/
├── contracts/          # Cairo smart contracts (main game logic)
├── game_erc721/        # ERC721 token contract
├── token/              # ERC20 test token
├── client-budokan/     # React frontend
├── docs/               # Reference documentation (you are here)
└── references/         # Reference implementations (death-mountain, game-components)
```

## Before You Start

### Read These Files First
1. `/home/djizus/zkube/CLAUDE.md` - Project overview
2. `/home/djizus/zkube/contracts/CLAUDE.md` - Contract details
3. `/home/djizus/zkube/docs/GAME_COMPONENTS_REFERENCE.md` - Framework patterns

### Reference Implementations
- `/home/djizus/zkube/references/death-mountain/` - RPG game (rendering, VRF, complex systems)
- `/home/djizus/zkube/references/dark-shuffle/` - Card game (batching, effects, state machines)
- `/home/djizus/zkube/references/game-components/` - Framework source
- `/home/djizus/zkube/references/budokan/` - Tournament system
- `/home/djizus/zkube/references/graffiti/` - SVG rendering library

## Core Concepts

### Game ID = Token ID = NFT
Each game is an NFT. The game_id in contracts matches the token_id in the ERC721.

### Grid Representation
- 8 columns × 10 rows
- Each block = 3 bits (0-7 for colors, 0 = empty)
- Entire grid packed into one felt252 (240 bits)

### Game Flow
```
1. freeMint() → Creates NFT, returns game_id
2. create(game_id) → Initializes grid with VRF seed
3. move(game_id, row, start, end) → Player moves blocks
4. apply_bonus(game_id, bonus, row, col) → Use hammer/wave/totem
5. surrender(game_id) → End game manually
```

### Pre/Post Action Pattern
Every game action wraps with:
```cairo
pre_action(token_address, game_id);   // Validates lifecycle
// ... game logic ...
post_action(token_address, game_id);  // Syncs token state
```

## Important Patterns

### Reading Game State
```cairo
let world: WorldStorage = self.world(@DEFAULT_NS());
let game: Game = world.read_model(game_id);
```

### Token Ownership Check
```cairo
use game_components_minigame::libs::assert_token_ownership;
assert_token_ownership(token_address, game_id);
```

### VRF Randomness
```cairo
let base_seed: GameSeed = world.read_model(game_id);
let random = RandomImpl::new_vrf();
// Use random.seed for deterministic generation
```

## Current Pain Points

1. **All logic in systems** - Should be in libs/ as pure functions
2. **Hardcoded VRF** - Should be configurable
3. **Basic events** - Should use typed enum
4. **Stubbed achievements** - handle_game_over() is no-op

See `/home/djizus/zkube/docs/ZKUBE_VS_DEATH_MOUNTAIN.md` for full comparison.

## Refactoring Plan

See `/home/djizus/zkube/docs/REFACTORING_PLAN.md` for detailed phases:
1. Extract libs layer
2. Abstract VRF
3. Typed events
4. Achievement system
5. System split

## Key Files by Task

### Game Logic
- `contracts/src/systems/game.cairo` - Main game system
- `contracts/src/helpers/controller.cairo` - Grid manipulation (77KB)
- `contracts/src/models/game.cairo` - Game model

### Configuration
- `contracts/src/constants.cairo` - Constants and namespace
- `contracts/src/models/config.cairo` - Settings models
- `contracts/src/systems/config.cairo` - Settings system

### Token Integration
- `game_erc721/src/lib.cairo` - ERC721 contract
- `contracts/src/systems/game.cairo` - IMinigameTokenData impl

### Frontend
- `client-budokan/src/dojo/setup.ts` - Dojo initialization
- `client-budokan/src/dojo/systems.ts` - Contract calls
- `client-budokan/src/dojo/game/models/game.ts` - Game wrapper

## Namespace

Current: `zkube_budo_v1_1_3`

Used in:
- `contracts/src/constants.cairo`
- `client-budokan/src/dojo/setup.ts`
- All Torii queries

## Testing

```bash
cd contracts
scarb test              # Run all tests
scarb test test_move    # Run specific test
```

## Building & Deploying

```bash
cd contracts
scarb build       # Build
scarb slot        # Deploy to slot (local)
scarb sepolia     # Deploy to sepolia
```

## Common Tasks

### Adding a New Event
1. Define in `contracts/src/events.cairo`
2. Emit in system: `world.emit_event(@MyEvent { ... })`
3. Subscribe in frontend setup.ts

### Adding a New Setting
1. Add field to `GameSettings` model
2. Update `ConfigUtilsImpl::get_game_settings()`
3. Use in game system

### Adding a New Bonus
1. Add variant to `types/bonus.cairo`
2. Implement in `elements/bonuses/`
3. Update `apply_bonus()` in game system
4. Add frontend UI

## Don't Forget

- Always use `pre_action`/`post_action` hooks
- Check token ownership before mutations
- Use `assert_token_ownership()` from game_components
- Emit events for frontend sync
- Keep systems thin, logic in libs

## MCP Tool

Use the sensei MCP tool when dealing with Dojo contracts for Cairo-specific help.
