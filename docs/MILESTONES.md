# zKube Project Milestones

> **Version:** 1.2.0  
> **Last Updated:** January 2026

This document tracks completed milestones and features for the zKube project.

---

## Version 1.2.0 (January-February 2026) - Current

### Major Features Completed

#### Progression Map (February 2026)
- **Super Mario World-style map** with 55 nodes (50 gameplay + 5 shops) across 5 themed zones
- **Seeded zone themes**: 5 of 10 themes selected per run via VRF-seeded Fisher-Yates shuffle
- **Node types**: Classic (9 per zone), Shop (1 per zone), Boss (1 per zone)
- **Map animations**: Pulse current node, ant-trail paths, staggered reveal, boss ring rotation
- **MyGames → Map flow**: Selecting a game shows progression map before play
- **Shop trigger change**: In-game shop appears after levels 9/19/29/39/49 (was every 5 levels)
- **Asset inventory**: Comprehensive asset list (`docs/ASSET_LIST.md`)

#### Boss Level System
- **Boss levels** every 10 levels (10, 20, 30, 40, 50)
- **Cube bonuses:** +10/+20/+30/+40/+50 CUBE
- **Dual constraints** mandatory on boss levels
- **Victory state:** Level 50 completion sets `run_completed` flag
- **Free level-up** available after boss clear (levels 10, 20, 30, 40)

#### Combo Cube Rewards (Rebalanced)
- Clear 4 lines: +1 CUBE
- Clear 5 lines: +3 CUBE
- Clear 6 lines: +5 CUBE
- Clear 7 lines: +10 CUBE
- Clear 8 lines: +25 CUBE
- Clear 9+ lines: +50 CUBE
- First 5-combo: +3 CUBE (one-time)
- First 10-combo: +5 CUBE (one-time)

#### 5-Bonus System
- **Shrink bonus:** Reduces block size by 1 (unlockable 200 CUBE)
- **Shuffle bonus:** Randomizes block positions (unlockable 200 CUBE)
- **Bonus selection:** Players select 3 of 5 bonuses per run
- **Bonus levels:** 3 upgrade levels (L1/L2/L3) per bonus type
- Frontend: LoadoutDialog for bonus selection

#### Quest System
- **10 Daily Quests** with tiered progression (Player, Clearer, Combo, Finisher)
- **102 CUBE/day** total rewards available
- Quest progress tracking via `quest_system`
- Integration with `game_system` for automatic progress updates
- Frontend: QuestsProvider, QuestsDialog, QuestCard components

#### Configurable GameSettings
- Extended `GameSettings` model with 21+ configurable parameters
- Level scaling (moves, points ratio, variance)
- Cube thresholds (3-star, 2-star percentages)
- Consumable costs (bonus1/2/3, refill, level-up)
- Constraint distribution (Easy to Master interpolation)
- Difficulty progression (starting difficulty, step levels)
- `add_custom_game_settings()` API for custom game modes

#### Constraint System Enhancements
- Dual constraint support (higher difficulties can have two constraints)
- NoBonusUsed constraint type
- Scalable parameters from Easy to Master difficulty
- Budget-based constraint generation

#### Cube Economy
- Soulbound ERC1155 CUBE token
- Permanent shop (starting bonuses, bag size, bridging rank, bonus unlocks)
- In-game shop (bonus consumables, refill, level-up every 5 levels)
- Cube bridging (bring cubes from wallet into runs)
- Spending order: brought cubes first, then earned

### Technical Improvements

- Workspace structure with unified Scarb build
- VRF/pseudo-random switching for slot vs mainnet
- Entity ID normalization for Torii compatibility
- CubeToken registered with Torii for balance indexing
- Quest system MINTER_ROLE for reward distribution

---

## Version 1.1.0 (December 2025)

### Level System Implementation

- **50 Levels** with progressive difficulty
- Move scaling: 20 (level 1) to 60 (level 50)
- Points ratio scaling: 0.80 to 1.80
- Consistent ±5% variance across all levels
- Seed-based deterministic level generation
- Level completion with star ratings (1-3 cubes)

### Bonus System

- **Hammer:** Clear block + connected same-size blocks
- **Wave:** Clear entire horizontal row
- **Totem:** Clear all blocks of same size on grid
- Bonus earning based on score, combos, max combo
- Bag size upgrades (max capacity per bonus type)
- Starting bonus upgrades (begin runs with bonuses)

### Shop System

- **Permanent Shop:** Meta-progression upgrades
  - Starting bonuses (50/200/500 cubes)
  - Bag size (10/20/40/80 cubes)
  - Bridging rank (100/200/400/800 cubes)
- **In-Game Shop:** Consumables every 5 levels
  - Hammer, Wave, Totem (5 cubes each)
  - ExtraMoves (10 cubes) - type exists but not yet implemented

### PlayerMeta Model

- Bit-packed upgrade data
- Lifetime statistics (total runs, cubes earned)
- Best level tracking
- Starting bonus counts
- Bag size levels
- Bridging rank

---

## Version 1.0.0 (November 2025)

### Core Game Mechanics

- **8x10 Grid** with blocks sized 1-4
- Block packing into felt252 (240 bits)
- Horizontal swiping/dragging
- Gravity system
- Line clearing
- Combo system (consecutive line clears)

### Difficulty System

- 8 difficulty levels: VeryEasy through Master
- Increasing mode (progressive difficulty)
- Block weight distributions per difficulty
- Harder difficulties = larger blocks, fewer gaps

### Game Flow

- NFT-based game tokens (FullTokenContract)
- Game creation with VRF seed
- Move processing with validation
- Game over detection (grid full)
- Achievement tracking (Cartridge arcade)

### Frontend Foundation

- React 18 + TypeScript + Vite
- Dojo SDK integration
- RECS for reactive game state
- Cartridge Controller wallet
- Grid rendering with animations
- Drag/drop block movement
- Audio system (music + effects)

### Contract Foundation

- Dojo 1.8.0 framework
- Game, GameSeed, PlayerMeta models
- game_system, shop_system contracts
- Controller helper (grid manipulation)
- Packing utilities
- Random generation (VRF + pseudo)

---

## Pre-1.0 Development

### Prototype Phase

- Initial grid concept and mechanics
- Block movement proof of concept
- Line clearing algorithm
- Basic scoring system
- First Cairo implementation

### Integration Phase

- Dojo framework adoption
- game-components integration
- Torii indexer setup
- Frontend-contract binding
- Wallet connection

---

## Completed Feature Checklist

### Game Mechanics
- [x] Grid representation (felt252 packing)
- [x] Block movement (horizontal swipe)
- [x] Gravity system
- [x] Line clearing
- [x] Combo system
- [x] Bonus effects (Hammer, Wave, Totem, Shrink, Shuffle)
- [x] Boss levels (L10/20/30/40/50)
- [x] Victory state (level 50 completion)

### Level System
- [x] 50-level progression
- [x] Difficulty scaling
- [x] Constraint system
- [x] Star rating (1-3 cubes)
- [x] Seed-based generation

### Economy
- [x] CUBE ERC1155 token
- [x] Soulbound (non-transferable)
- [x] Earning via gameplay
- [x] Permanent shop upgrades
- [x] In-game shop consumables
- [x] Cube bridging system

### Meta-Progression
- [x] PlayerMeta model
- [x] Starting bonus upgrades
- [x] Bag size upgrades
- [x] Bridging rank upgrades
- [x] Best level tracking
- [x] Lifetime statistics

### Quest System
- [x] Daily quests (10 total)
- [x] Quest progress tracking
- [x] Quest claiming
- [x] Quest rewards (CUBE)
- [x] Frontend quest UI

### Configurable Settings
- [x] Extended GameSettings model
- [x] Level scaling parameters
- [x] Constraint distribution
- [x] Custom game modes API
- [x] Default settings presets

### Infrastructure
- [x] Dojo 1.8.0 integration
- [x] game-components framework
- [x] VRF randomness (sepolia/mainnet)
- [x] Pseudo-random (slot)
- [x] Torii indexing
- [x] Achievement system

### Progression Map
- [x] Map layout utility (55 nodes, bidirectional mapping)
- [x] Zone theme derivation (seeded, deterministic)
- [x] Map screen (nodes, paths, zone backgrounds)
- [x] Level preview panel
- [x] Map animations (pulse, ant-trail, stagger, boss ring)
- [x] Flow integration (level complete → map → next level)
- [x] MyGames → Map wiring
- [x] Shop trigger change (every 10 levels)
- [x] Asset inventory document

### Frontend
- [x] React 18 + TypeScript
- [x] PixiJS mobile app (mobile-app/)
- [x] Grid rendering
- [x] Block animations
- [x] Drag/drop controls
- [x] Shop dialogs
- [x] Quest panel
- [x] Wallet integration
- [x] Audio system

---

## Pending Features

See [FUTURE_FEATURES.md](./FUTURE_FEATURES.md) for the complete roadmap of unimplemented features including:

- ExtraMoves consumable
- Revival Token
- Skip Constraint
- Daily Challenge Mode
- New bonus types (Freeze, Bomb)
- Special blocks
- Cosmetics

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.2.0 | Jan 2026 | Boss levels, 5-bonus system, Quest system, Victory state, Combo rebalance |
| 1.1.0 | Dec 2025 | Level system, Bonus system, Two-shop economy |
| 1.0.0 | Nov 2025 | Core mechanics, Difficulty system, Foundation |
