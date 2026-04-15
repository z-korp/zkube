# zKube Smart Contracts

Cairo smart contracts for the zKube puzzle game built with Dojo framework.

For detailed documentation, see [CLAUDE.md](../CLAUDE.md).

## Quick Start

```bash
# Build (from workspace root)
scarb build

# Run tests
scarb test

# Deploy to slot
sozo migrate -P slot
```

## Key Files

- `src/systems/` - Game logic (game, shop, quest, achievement)
- `src/models/` - Data models (Game, PlayerMeta, GameSettings)
- `src/helpers/` - Utilities (controller, packing, level generation)
- `src/elements/` - Game elements (bonuses, quests, achievements)
