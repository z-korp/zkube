# zkube Workspace Structure

This document describes the unified Scarb workspace structure for zkube contracts.

> **Version:** 1.2.0  
> **Last Updated:** January 2026

## Overview

zkube uses a Scarb workspace to bundle all contracts together for easier development and deployment.

```
zkube/
├── Scarb.toml                    # Workspace root (dependencies, versions)
├── Scarb.lock                    # Locked dependencies
├── dojo_slot.toml                # Root Dojo config (sozo reads from here!)
├── contracts/                    # Main Dojo game contracts
│   ├── Scarb.toml                # Package: zkube
│   ├── dojo_slot.toml            # Contracts Dojo config (keep in sync with root!)
│   ├── dojo_sepolia.toml         # Dojo config for sepolia
│   ├── dojo_mainnet.toml         # Dojo config for mainnet
│   ├── torii_slot.toml           # Torii config for slot
│   └── src/
│       ├── systems/              # Dojo systems
│       │   ├── game.cairo        # Main game logic
│       │   ├── shop.cairo        # Permanent shop
│       │   ├── cube_token.cairo  # Soulbound ERC1155
│       │   ├── quest.cairo       # Daily quest system
│       │   ├── config.cairo      # Settings management
│       │   ├── game_token.cairo  # Token integration
│       │   └── renderer.cairo    # SVG/metadata generation
│       ├── models/               # Dojo models
│       │   ├── game.cairo        # Game state
│       │   ├── player.cairo      # PlayerMeta
│       │   └── config.cairo      # GameSettings
│       ├── helpers/              # Logic helpers
│       │   ├── controller.cairo  # Grid manipulation
│       │   ├── level.cairo       # Level generation
│       │   ├── packing.cairo     # Bit packing
│       │   ├── gravity.cairo     # Block physics
│       │   ├── random.cairo      # VRF/pseudo-random
│       │   └── config.cairo      # Settings utilities
│       ├── types/                # Type definitions
│       │   ├── bonus.cairo
│       │   ├── difficulty.cairo
│       │   ├── constraint.cairo
│       │   ├── consumable.cairo
│       │   └── level.cairo
│       └── elements/             # Game elements
│           ├── bonuses/          # Bonus implementations
│           ├── difficulties/     # Difficulty configs
│           ├── tasks/            # Quest tasks
│           └── quests/           # Quest definitions
├── packages/
│   ├── game_erc721/              # Legacy ERC721 game token (NOT USED)
│   │   ├── Scarb.toml            # Uses workspace dependencies
│   │   └── src/lib.cairo
│   └── token/                    # ERC20 test token (Fake LORD)
│       ├── Scarb.toml
│       └── src/lib.cairo
├── mobile-app/                   # PixiJS mobile frontend (ACTIVE)
│   ├── src/
│   │   ├── pixi/                 # PixiJS game rendering
│   │   ├── dojo/                 # Dojo integration
│   │   └── ui/                   # React UI screens
│   ├── .env.slot                 # Slot environment
│   └── package.json
├── client-budokan/               # React frontend (BEING DROPPED)
│   ├── src/
│   │   ├── dojo/                 # Dojo integration
│   │   ├── ui/                   # React components
│   │   ├── hooks/                # Custom hooks
│   │   ├── contexts/             # React contexts
│   │   └── stores/               # Zustand stores
│   ├── .env.slot                 # Slot environment
│   └── package.json
├── scripts/                      # Deployment scripts
│   └── deploy_slot.sh            # Automated slot deployment
└── docs/                         # Documentation
```

## Packages

### zkube (contracts/)
Main Dojo game system with:
- **Game System**: create, move, apply_bonus, surrender, purchase_consumable
- **Shop System**: Permanent upgrades (starting bonuses, bag size, bridging)
- **CubeToken System**: Soulbound ERC1155 currency
- **Quest System**: Daily quests with CUBE rewards
- **Config System**: Custom game settings
- **Models**: Game, GameSeed, PlayerMeta, GameSettings
- **Level Generator**: Seed-based level configs with constraints
- Integration with game-components framework

### game_erc721 (packages/game_erc721/)
**LEGACY - NOT CURRENTLY USED:**
- Replaced by game-components FullTokenContract
- Kept for reference only
- Do not deploy for new games

### token (packages/token/)
Simple ERC20 "Fake LORD" for testing:
- Faucet (1000 tokens, 24h cooldown)
- Used for development/testing only
- Production uses real LORD or STRK

## Workspace Benefits

1. **Single build command**: `scarb build` builds all packages
2. **Centralized dependencies**: All versions in root `Scarb.toml`
3. **Consistent versioning**: All packages share version 1.2.0
4. **Shared lock file**: `Scarb.lock` ensures reproducible builds

## Commands

### Build all packages
```bash
# From workspace root
scarb build
```

### Build for specific network
```bash
# From workspace root
sozo build -P slot
sozo build -P sepolia
sozo build -P mainnet
```

### Run tests
```bash
# Dojo tests (contracts)
cd contracts && scarb test

# Foundry tests (game_erc721 - legacy)
cd packages/game_erc721 && snforge test
```

### Deploy

**IMPORTANT:** Always run sozo commands from the workspace root, not from contracts/!

```bash
# Slot (local development)
./scripts/deploy_slot.sh  # Automated
# or manually:
sozo migrate -P slot

# Sepolia
sozo migrate -P sepolia

# Mainnet
sozo migrate -P mainnet
```

## Adding Dependencies

Add new dependencies to the workspace root `Scarb.toml`:

```toml
[workspace.dependencies]
new_dep = { git = "...", tag = "..." }
```

Then use in package `Scarb.toml`:

```toml
[dependencies]
new_dep.workspace = true
```

## Deployment Flow

1. **Build**: `scarb build` or `sozo build -P <profile>`
2. **Deploy external contracts**: MinigameRegistry, FullTokenContract (via sozo declare/deploy)
3. **Update configs**: Set denshokan_address in BOTH dojo_*.toml files
4. **Deploy Dojo world**: `sozo migrate -P <profile>` (from workspace root!)
5. **Update client**: Set addresses in client-budokan/.env.*
6. **Start Torii**: `torii --config contracts/torii_slot.toml`
7. **Start client**: `cd client-budokan && pnpm slot`

## Shared Dependencies

All packages share these from the workspace:

| Dependency | Version/Tag | Usage |
|------------|-------------|-------|
| starknet | 2.13.1 | Core Starknet types |
| dojo | 1.8.0 | Dojo framework (contracts only) |
| openzeppelin_token | v3.0.0-alpha.3 | Token standards |
| openzeppelin_access | v3.0.0-alpha.3 | Access control |
| game_components_minigame | v2.13.1 | Provable Games framework |
| game_components_token | v2.13.1 | Token utilities |
| alexandria_math | v0.7.0 | Math utilities |
| origami_random | v1.7.0 | VRF randomness |
| graffiti | (rev) | SVG rendering |
| quest | (arcade) | Quest system |
| achievement | (arcade) | Achievement system |

## Critical: Two dojo_slot.toml Files

There are TWO `dojo_slot.toml` files that **MUST be kept in sync**:

1. `./dojo_slot.toml` (workspace root) - **sozo reads from here**
2. `./contracts/dojo_slot.toml` (contracts directory)

If `denshokan_address` differs between them, deployment will fail with "contract address 0x0 not deployed".

The automated deploy script (`./scripts/deploy_slot.sh`) updates both files.

## Migration from Separate Projects

Previously, zkube had three separate Scarb projects. They are now unified under one workspace. If you have old checkouts:

```bash
# Remove old directories (now in packages/)
rm -rf game_erc721/ token/

# Pull latest
git pull

# Rebuild
scarb build
```

## External Contracts

The following contracts are deployed separately (not via sozo migrate):

1. **MinigameRegistryContract** - Game registry for FullTokenContract
2. **FullTokenContract** - ERC721 game NFTs with minigame features

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment instructions.
