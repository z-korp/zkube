# zKube Documentation

> **Version:** 1.2.0  
> **Namespace:** `zkube_budo_v1_2_0`  
> **Last Updated:** January 2026

## Overview

This directory contains documentation for the zKube project - a fully on-chain puzzle roguelike built with Dojo on Starknet.

## Documentation Index

### Core Game Documentation

| File | Description | Status |
|------|-------------|--------|
| [GAME_DESIGN.md](./GAME_DESIGN.md) | **Complete game design** - levels, economy, bonuses, shops, constraints | Implemented |
| [QUEST_SYSTEM.md](./QUEST_SYSTEM.md) | Daily quest system - 10 quests, 102 CUBE daily rewards | Implemented |
| [CONFIGURABLE_SETTINGS.md](./CONFIGURABLE_SETTINGS.md) | GameSettings customization for custom game modes | Implemented |

### Operations & Development

| File | Description | Status |
|------|-------------|--------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Network deployment (slot/sepolia/mainnet) with FullTokenContract | Current |
| [WORKSPACE_STRUCTURE.md](./WORKSPACE_STRUCTURE.md) | Scarb workspace organization and build commands | Current |
| [AGENT_QUICKSTART.md](./AGENT_QUICKSTART.md) | Quick reference for Claude agents working on the codebase | Current |

### Tracking & Planning

| File | Description | Status |
|------|-------------|--------|
| [MILESTONES.md](./MILESTONES.md) | Project milestones and completed features | Current |
| [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) | Roadmap, unimplemented features, architecture plans | Planning |

### External References

| File | Description |
|------|-------------|
| [references/GAME_COMPONENTS.md](./references/GAME_COMPONENTS.md) | game-components framework patterns and IMinigameTokenData |
| [references/DEATH_MOUNTAIN_PATTERNS.md](./references/DEATH_MOUNTAIN_PATTERNS.md) | Death Mountain architecture (GameLibs, Store pattern) |
| [references/DARK_SHUFFLE_PATTERNS.md](./references/DARK_SHUFFLE_PATTERNS.md) | Dark Shuffle patterns (batch actions, weighted pools) |

## CLAUDE.md Files

Technical documentation in each project directory:

| File | Description |
|------|-------------|
| `/CLAUDE.md` | **Main project overview** (start here) |
| `/contracts/CLAUDE.md` | Smart contract documentation (systems, models, helpers) |
| `/client-budokan/CLAUDE.md` | Frontend documentation (hooks, components, state) |
| `/packages/token/CLAUDE.md` | ERC20 test token (Fake LORD) |
| `/packages/game_erc721/CLAUDE.md` | Legacy ERC721 (replaced by FullTokenContract) |
| `/scripts/CLAUDE.md` | Deployment scripts and utilities |
| `/assets/CLAUDE.md` | Assets documentation |

## Quick Start Guide

### For New Developers

1. **Read first**: `/CLAUDE.md` - Complete project overview
2. **Game design**: [GAME_DESIGN.md](./GAME_DESIGN.md) - Understand the game mechanics
3. **Code overview**: 
   - `/contracts/CLAUDE.md` for Cairo contracts
   - `/client-budokan/CLAUDE.md` for React frontend
4. **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) if you need to deploy

### For Quick Reference

- [AGENT_QUICKSTART.md](./AGENT_QUICKSTART.md) - Key concepts and file locations

## Feature Status

### Fully Implemented (v1.2.0)

- Level system (50 levels with progressive difficulty)
- Constraint system (ClearLines, NoBonusUsed, dual constraints)
- Bonus system (Hammer, Wave, Totem)
- Cube economy (earning, spending, two shops)
- Quest system (10 daily quests, 102 CUBE/day)
- Achievement system (Cartridge arcade integration)
- Configurable GameSettings (custom game modes)
- Permanent shop (starting bonuses, bag size, bridging rank)
- In-game shop (consumables every 5 levels)

### Not Yet Implemented

- ExtraMoves consumable (type exists but panics)
- Revival Token
- Skip Constraint
- Daily Challenge Mode
- New bonus types (Freeze, Bomb)

See [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) for the complete roadmap.

## Project Architecture Quick Reference

```
FRONTEND (React)          CONTRACTS (Cairo/Dojo)        TOKEN
─────────────────         ────────────────────          ─────
Home.tsx                  game_system                   FullTokenContract
  ↓                         ↓                             ↓
Play.tsx ─────────────► move() ──────────────────► NFT ownership
  ↓                         ↓                             
GameBoard.tsx             Game model                    
  ↓                         ↓                           
Grid.tsx ◄──────────────► blocks (felt252)            ERC1155 (CUBE)
                            ↓                             ↓
                          cube_token ◄──────────────► CUBE balance
                            ↓
                          quest_system
                            ↓
                          shop_system
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Game ID = Token ID** | Each game is an ERC721 NFT |
| **Soulbound CUBE** | ERC1155 currency that can't be transferred |
| **VRF Seed** | Each game has a deterministic random seed |
| **Packed Storage** | Grid stored as 240 bits in single felt252 |
| **Level Config** | Generated from seed at level start |
| **Constraints** | Per-level challenges for bonus rewards |
| **Run Data** | Bit-packed progress tracked in Game model |
