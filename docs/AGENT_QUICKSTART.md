# Claude Agent Quick Reference for zkube

This document provides essential context for Claude agents working on zkube.

> **Version:** 1.2.0  
> **Namespace:** `zkube_budo_v1_2_0`  
> **Last Updated:** January 2026

## Project Summary

zkube is an on-chain puzzle roguelike game built with:
- **Contracts**: Cairo 2.13.1 + Dojo 1.8.0
- **Frontend**: React 18 + TypeScript + Vite + Dojo SDK
- **Token**: ERC721 game NFTs via game-components FullTokenContract
- **Currency**: Soulbound ERC1155 CUBE token
- **Quests**: Daily quest system (102 CUBE/day)

## Key Directories

```
zkube/
├── contracts/          # Cairo smart contracts (main game logic)
├── packages/
│   ├── game_erc721/    # Legacy ERC721 (NOT USED - reference only)
│   └── token/          # ERC20 test token (Fake LORD)
├── client-budokan/     # React frontend
├── docs/               # Documentation (you are here)
├── scripts/            # Deployment scripts
└── references/         # Reference implementations
```

## Before You Start

### Read These Files First
1. `/CLAUDE.md` - Project overview (comprehensive)
2. `/contracts/CLAUDE.md` - Contract details
3. `/client-budokan/CLAUDE.md` - Frontend details

### Reference Implementations
- `/references/death-mountain/` - RPG game patterns
- `/references/dark-shuffle/` - Card game patterns
- `/references/game-components/` - Framework source

## Core Concepts

### Game ID = Token ID = NFT
Each game is an NFT. The game_id in contracts matches the token_id in the ERC721.

### Grid Representation
- 8 columns x 10 rows
- Each block = 3 bits (0-4 for sizes, 0 = empty)
- Entire grid packed into one felt252 (240 bits)

### Level System
- 50 levels with scaling difficulty
- Seed-based level generation (same seed = same levels)
- Constraints (ClearLines, NoBonusUsed)
- Cube rating (1-3 cubes based on move efficiency)

### Quest System
- 10 daily quests
- 102 CUBE total daily rewards
- Progress tracked automatically via game_system
- Rewards claimed via quest_system

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
- **Earning**: Level completion (1-3), combos (+1/+2/+3), achievements, quests
- **Spending**: Permanent Shop (upgrades), In-Game Shop (consumables)
- **Bridging**: Bring cubes from wallet into runs

## Important Patterns

### Reading Game State (Cairo)
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

### Entity ID Normalization (TypeScript)
```typescript
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};
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

### Quest System
- `contracts/src/systems/quest.cairo` - Quest system
- `contracts/src/elements/tasks/` - Task definitions
- `contracts/src/elements/quests/` - Quest implementations
- `client-budokan/src/contexts/quests.tsx` - Quest provider
- `client-budokan/src/ui/components/Quest/` - Quest UI

### Configuration
- `contracts/src/constants.cairo` - Constants and namespace
- `contracts/src/models/config.cairo` - GameSettings model
- `contracts/src/systems/config.cairo` - Config system

### Frontend
- `client-budokan/src/dojo/setup.ts` - Dojo initialization
- `client-budokan/src/dojo/systems.ts` - Contract calls
- `client-budokan/src/hooks/useGame.tsx` - Game state hook
- `client-budokan/src/ui/screens/Play.tsx` - Main game screen
- `client-budokan/src/ui/components/Shop/` - Shop components
- `client-budokan/src/ui/components/Quest/` - Quest components

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

# Start Torii after deployment
torii --config contracts/torii_slot.toml

# Start client
cd client-budokan && pnpm slot
```

## Common Tasks

### Adding a New Event
1. Define in `contracts/src/events.cairo`
2. Emit in system: `world.emit_event(@MyEvent { ... })`
3. Add writer permission in `dojo_*.toml`

### Adding a New Consumable
1. Add variant to `types/consumable.cairo`
2. Add cost handling in `get_cost_from_settings()`
3. Handle in `purchase_consumable()` in game system
4. Add UI in `InGameShopDialog.tsx`

### Adding a New Quest
1. Add task in `elements/tasks/`
2. Add quest in `elements/quests/`
3. Register in quest system initialization
4. Track progress in game_system (call `quest_system.progress()`)
5. Add UI in `QuestsDialog.tsx`

### Modifying Level Generation
1. Update `helpers/level.cairo`
2. Adjust scaling in GameSettings or LevelGenerator
3. Update constraint generation if needed

## Don't Forget

- Always use `pre_action`/`post_action` hooks
- Check token ownership before mutations
- Emit events for frontend sync
- Use sensei MCP tool for Dojo/Cairo help
- Update BOTH dojo_slot.toml files for slot deployment
- Normalize entity IDs before RECS lookups

## Related Documentation

- [GAME_DESIGN.md](./GAME_DESIGN.md) - Complete game design
- [QUEST_SYSTEM.md](./QUEST_SYSTEM.md) - Quest system details
- [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) - GameSettings
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Network deployment
- [WORKSPACE_STRUCTURE.md](./WORKSPACE_STRUCTURE.md) - Project structure
- [MILESTONES.md](./MILESTONES.md) - Completed features
- [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) - Roadmap
