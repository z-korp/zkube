# zkube Workspace Structure

This document describes the unified Scarb workspace structure for zkube contracts.

## Overview

zkube uses a Scarb workspace to bundle all contracts together for easier development and deployment.

```
zkube/
├── Scarb.toml                    # Workspace root (dependencies, versions)
├── Scarb.lock                    # Locked dependencies
├── contracts/                    # Main Dojo game contracts
│   ├── Scarb.toml                # Package: zkube
│   ├── dojo_slot.toml            # Dojo config for slot
│   ├── dojo_sepolia.toml         # Dojo config for sepolia
│   ├── dojo_mainnet.toml         # Dojo config for mainnet
│   └── src/
├── packages/
│   ├── game_erc721/              # ERC721 game token contract
│   │   ├── Scarb.toml            # Package: game_erc721
│   │   └── src/
│   └── token/                    # ERC20 test token contract
│       ├── Scarb.toml            # Package: token
│       └── src/
└── client-budokan/               # React frontend (not in workspace)
```

## Packages

### zkube (contracts/)
Main Dojo game system with:
- Game logic (create, move, apply_bonus, surrender)
- Game models (Game, GameSeed, GameSettings)
- Integration with game-components framework

### game_erc721 (packages/game_erc721/)
ERC721 NFT contract for game tokens:
- Each NFT = one playable game
- Paid minting with ERC20 payment
- Prize pool distribution (tournament, chest, zkorp)
- Pausable, upgradeable, role-based access

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
scarb build
```

### Build specific package
```bash
scarb build -p zkube
scarb build -p game_erc721
scarb build -p token
```

### Run tests
```bash
# Dojo tests (contracts)
cd contracts && scarb test

# Foundry tests (game_erc721)
cd packages/game_erc721 && snforge test
```

### Deploy (Dojo)
```bash
cd contracts
scarb slot      # Deploy to slot
scarb sepolia   # Deploy to sepolia
scarb mainnet   # Deploy to mainnet
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

1. **Build all**: `scarb build`
2. **Deploy token** (if needed): Use starkli
3. **Deploy game_erc721**: Use starkli, pass token address
4. **Deploy Dojo world**: `cd contracts && scarb slot`
5. **Configure**: Pass game_erc721 address to Dojo init

## Shared Dependencies

All packages share these from the workspace:

| Dependency | Version/Tag | Usage |
|------------|-------------|-------|
| starknet | 2.13.1 | Core Starknet types |
| dojo | 1.8.0 | Dojo framework (contracts only) |
| openzeppelin_* | v3.0.0-alpha.3 | Token standards |
| game_components_* | v2.13.1 | Provable Games framework |
| alexandria_* | v0.7.0 | Math utilities |
| origami_random | v1.7.0 | VRF randomness |
| graffiti | (rev) | SVG rendering |

## Migration from Separate Projects

Previously, zkube had three separate Scarb projects:
- `contracts/` - standalone
- `game_erc721/` - standalone
- `token/` - standalone

They are now unified under one workspace. If you have old checkouts:

```bash
# Remove old directories (now in packages/)
rm -rf game_erc721/ token/

# Pull latest
git pull

# Rebuild
scarb build
```
