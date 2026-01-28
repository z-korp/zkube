# Claude Agent Quick Reference for zkube

This document provides essential context for Claude agents working on zkube.

> **Version:** 1.2.0  
> **Namespace:** `zkube_budo_v1_2_0`

## Project Summary

zkube is an on-chain puzzle roguelike game built with:
- **Contracts**: Cairo 2.13.1 + Dojo 1.8.0
- **Frontend**: React 18 + TypeScript + Vite + Dojo SDK
- **Token**: ERC721 game NFTs via game-components FullTokenContract
- **Currency**: Soulbound ERC1155 CUBE token

## Key Directories

```
zkube/
├── contracts/          # Cairo smart contracts (main game logic)
├── packages/
│   ├── game_erc721/    # ERC721 token contract
│   └── token/          # ERC20 test token (Fake LORD)
├── client-budokan/     # React frontend
├── docs/               # Documentation (you are here)
├── scripts/            # Deployment scripts
└── references/         # Reference implementations
```

## Before You Start

### Read These Files First
1. `/home/djizus/zkube/CLAUDE.md` - Project overview (comprehensive)
2. `/home/djizus/zkube/contracts/CLAUDE.md` - Contract details
3. `/home/djizus/zkube/client-budokan/CLAUDE.md` - Frontend details

### Reference Implementations
- `/home/djizus/zkube/references/death-mountain/` - RPG game patterns
- `/home/djizus/zkube/references/dark-shuffle/` - Card game patterns
- `/home/djizus/zkube/references/game-components/` - Framework source

## Core Concepts

### Game ID = Token ID = NFT
Each game is an NFT. The game_id in contracts matches the token_id in the ERC721.

### Grid Representation
- 8 columns × 10 rows
- Each block = 3 bits (0-4 for sizes, 0 = empty)
- Entire grid packed into one felt252 (240 bits)

### Level System
- 100+ levels with scaling difficulty
- Seed-based level generation (same seed = same levels)
- Constraints (ClearLines, NoBonusUsed)
- Cube rating (1-3 cubes based on move efficiency)

### Game Flow
```
1. freeMint() → Creates NFT, returns game_id
2. create(game_id) → Initializes with VRF seed, level 1
3. move(game_id, row, start, end) → Player moves, auto-levels
4. apply_bonus(game_id, bonus, row, col) → Use hammer/wave/totem
5. purchase_consumable(game_id, type) → Buy bonus from in-game shop
6. surrender(game_id) → End game, mint earned cubes
```

### Cube Economy
- **Earning**: Level completion (1-3), combos (+1/+2/+3), achievements
- **Spending**: Permanent Shop (upgrades), In-Game Shop (consumables)
- **Bridging**: Bring cubes from wallet into runs

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

### Pre/Post Action Pattern
```cairo
pre_action(token_address, game_id);   // Validates lifecycle
// ... game logic ...
post_action(token_address, game_id);  // Syncs token state
```

## Key Files by Task

### Game Logic
- `contracts/src/systems/game.cairo` - Main game system
- `contracts/src/helpers/controller.cairo` - Grid manipulation
- `contracts/src/helpers/level.cairo` - Level generation
- `contracts/src/helpers/packing.cairo` - Bit packing utilities
- `contracts/src/models/game.cairo` - Game model

### Cube Economy
- `contracts/src/systems/shop.cairo` - Permanent shop system
- `contracts/src/systems/cube_token.cairo` - ERC1155 CUBE token
- `contracts/src/models/player.cairo` - PlayerMeta model
- `contracts/src/types/consumable.cairo` - Consumable types

### Configuration
- `contracts/src/constants.cairo` - Constants and namespace
- `contracts/src/models/config.cairo` - Settings models

### Frontend
- `client-budokan/src/dojo/setup.ts` - Dojo initialization
- `client-budokan/src/dojo/systems.ts` - Contract calls
- `client-budokan/src/hooks/useGame.tsx` - Game state hook
- `client-budokan/src/ui/screens/Play.tsx` - Main game screen
- `client-budokan/src/ui/components/Shop/` - Shop components

## Namespace

Current: `zkube_budo_v1_2_0`

Used in:
- `contracts/src/constants.cairo`
- `client-budokan/.env.*` files
- All Torii queries

## Testing & Deployment

```bash
# Build all packages
scarb build

# Run tests
cd contracts && scarb test

# Deploy to slot (local)
./scripts/deploy_slot.sh

# Deploy to sepolia/mainnet
cd contracts && scarb sepolia  # or scarb mainnet
```

## Common Tasks

### Adding a New Event
1. Define in `contracts/src/events.cairo`
2. Emit in system: `world.emit_event(@MyEvent { ... })`
3. Add writer permission in `dojo_*.toml`

### Adding a New Consumable
1. Add variant to `types/consumable.cairo`
2. Add cost in ConsumableCosts module
3. Handle in `purchase_consumable()` in game system
4. Add UI in `InGameShopDialog.tsx`

### Modifying Level Generation
1. Update `helpers/level.cairo`
2. Adjust scaling constants in LevelConstants module
3. Update constraint probabilities if needed

## Don't Forget

- Always use `pre_action`/`post_action` hooks
- Check token ownership before mutations
- Emit events for frontend sync
- Use sensei MCP tool for Dojo/Cairo help
- Update BOTH dojo_slot.toml files for slot deployment

## Related Documentation

- [Level System](./LEVEL_SYSTEM_IMPLEMENTATION.md)
- [Cube Economy](./CUBE_ECONOMY.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Workspace Structure](./WORKSPACE_STRUCTURE.md)
