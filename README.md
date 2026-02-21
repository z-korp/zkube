# zKube

<p align="center">
  <img src="assets/zkube.png" height="256">
</p>

A fully on-chain puzzle roguelike built with [Dojo](https://dojoengine.org/) on [Starknet](https://starknet.io/).

## Overview

zKube challenges players to manipulate blocks on an 8x10 grid to form solid horizontal lines. Progress through 50 levels, earn CUBE tokens, unlock bonuses, and complete daily quests. Every action is verified on-chain with VRF-powered randomness.

<p align="center">
  <img src="assets/overview.png" height="256">
</p>

## Key Features

- **50-Level Campaign** - Progressive difficulty from VeryEasy to Master
- **5 Bonus Types** - Combo, Score, Harvest, Wave, Supply (each with 3 upgrade levels)
- **CUBE Economy** - Earn tokens through gameplay, spend on permanent upgrades
- **Daily Quests** - 10 quests with 102 CUBE rewards per day
- **28 Achievements** - Track lifetime progress across multiple categories
- **Boss Levels** - Special challenges every 10 levels with bonus rewards

## Gameplay

Slide blocks horizontally to form complete lines. Each cleared line awards points and builds combos. Clear the level's point target within the move limit to advance. Use bonuses strategically to clear difficult situations.

<p align="center">
  <img src="assets/gameplay.png" height="256">
</p>

## Quick Start

### Play

Visit [app.zkube.xyz](https://app.zkube.xyz) to play on mainnet.

### Development

```bash
# Frontend
cd client-budokan
pnpm install
pnpm slot        # Local development
pnpm sepolia     # Sepolia testnet

# Contracts
scarb build                    # Build all packages
cd contracts && scarb test     # Run tests
```

See [CLAUDE.md](./CLAUDE.md) for detailed development documentation.

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | Project architecture and development guide |
| [docs/GAME_DESIGN.md](./docs/GAME_DESIGN.md) | Complete game design document |
| [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | Network deployment guide |
| [contracts/CLAUDE.md](./contracts/CLAUDE.md) | Smart contract documentation |
| [client-budokan/CLAUDE.md](./client-budokan/CLAUDE.md) | Frontend documentation |

## Technology Stack

- **Contracts**: Cairo 2.13.1 / Dojo 1.8.0
- **Frontend**: React 18 / TypeScript / Vite
- **Blockchain**: Starknet
- **Wallet**: Cartridge Controller

## Links

- [Website](https://app.zkube.xyz)
- [Twitter](https://x.com/zKube_game)
- [Discord](https://discord.gg/pzzRSDZY)
- [GitHub](https://github.com/z-korp/zkube)

## Team

zKube is developed by [zKorp](https://github.com/z-korp). We welcome contributions - feel free to open issues or pull requests.

## License

MIT
