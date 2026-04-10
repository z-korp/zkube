# zKube

<p align="center">
  <img src="assets/zkube.png" height="256">
</p>

A fully on-chain puzzle roguelike built with [Dojo](https://dojoengine.org/) on [Starknet](https://starknet.io/).

## Overview

zKube challenges players to manipulate blocks on an 8x10 grid to form solid horizontal lines. Progress through 10 themed zones, earn zStar tokens, unlock bonuses, and complete daily quests. Every action is verified on-chain with VRF-powered randomness.

<p align="center">
  <img src="assets/overview.png" height="256">
</p>

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

See [CLAUDE.md](./CLAUDE.md) for developer/agent reference and [docs/](./docs/) for game design documents.

## Technology Stack

- **Contracts**: Cairo / Dojo
- **Frontend**: React 19 / TypeScript / Vite
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
