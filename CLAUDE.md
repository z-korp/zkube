# zKube - On-Chain Puzzle Game

## Project Overview

zKube is a fully on-chain puzzle game built with Dojo/Starknet. Players manipulate blocks on an 8x10 grid to form horizontal lines. Zone-based runs: 10-level themed zones with boss at L10, endless mode after clear. No economy — stars are the only progression signal.

## Architecture

```
zkube/
├── Scarb.toml                    # Workspace root
├── contracts/                    # Cairo 2.13.1 + Dojo 1.8.0
│   ├── src/
│   │   ├── systems/              # 9 systems: game, moves, grid, level, config, renderer, daily_challenge, zone, mutator
│   │   ├── models/               # 7 model files: game, player, config, entitlement, daily, zone, mutator
│   │   ├── helpers/              # 20 helpers: controller, packing, level, boss, scoring, game_over, etc.
│   │   ├── types/                # 9 type modules: difficulty, constraint, mode, mutator, level, block, width, daily, bonus
│   │   ├── elements/difficulties/ # Block weight tables
│   │   └── external/             # FullTokenContract, MinigameRegistryContract
│   ├── dojo_slot.toml
│   └── torii_slot.toml
├── packages/
│   └── token/                    # ERC20 Fake LORD (dev only)
├── client-budokan/               # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── dojo/                 # 17 files: setup, systems, contractSystems, contractModels, game models + helpers
│   │   ├── ui/pages/             # 6 pages: Home, Play, Map, Leaderboard, Daily, Settings
│   │   ├── ui/components/        # 34 components (grid, HUD, map, tutorial, shared)
│   │   ├── hooks/                # 21 hooks
│   │   ├── stores/               # 3 Zustand stores (navigation, moveTx, general)
│   │   ├── contexts/             # 6 contexts (controllers, gameEvents, music, sound, metagame)
│   │   └── config/themes.ts      # 10 visual themes
│   └── .env.slot
├── assets/                       # Graphics, sounds, media
├── scripts/                      # Deploy scripts
└── docs/                         # Additional docs
```

## Technology Stack

### Frontend (`client-budokan/`)
- React 19 + TypeScript 5.9 + Vite 7.3
- TailwindCSS 4.1, Motion 12.34, GSAP 3.14, Howler.js 2.2
- starknet 8.5, @starknet-react/core 5.0
- @dojoengine/sdk 1.9, @dojoengine/core 1.8, @dojoengine/recs
- Cartridge Controller 0.13.9

### Contracts (`contracts/`)
- Cairo 2.13.1, Dojo 1.8.0
- OpenZeppelin Cairo v3.0.0
- Alexandria v0.9.0
- game_components_embeddable_game_standard (branch:next)
- game_components_utilities, game_components_interfaces
- origami_random v1.7.0, graffiti

## Game Flow

```
Home -> FreeMint (NFT) -> Create (game_id) -> Map (10 levels) -> Play -> Level Complete (auto-advance same tx) -> Boss (L10) -> Endless -> Game Over -> Leaderboard
```

1. Player connects via Cartridge Controller
2. `mint_game()` on game_system (MinigameComponent) — mints ERC721 with felt252 token_id
3. `create(game_id)` — loads GameSettings, generates VRF/pseudo seed, rolls mutator, initializes L1 + grid
4. `move(game_id, row, start, final)` — swipe blocks, gravity, clear lines, check constraints
5. Level complete — auto-advance in same tx (no `start_next_level`)
6. L10 boss clear — `zone_cleared = true` — enters endless
7. Endless L11+ — difficulty escalates, game over when grid fills
8. Game over — PlayerMeta updated, RunEnded event, daily leaderboard submission

## Grid Representation

- 10 rows x 8 columns
- Each block = 3 bits (0-4, 0=empty)
- Row = 24 bits, total = 240 bits packed in felt252
- Constants: `BLOCK_SIZE=8`, `BLOCK_BIT_COUNT=3`, `ROW_BIT_COUNT=24`

## RunData Layout (102 bits in felt252)

```
Bits 0-7:     current_level (u8)
Bits 8-15:    level_score (u8)
Bits 16-23:   level_moves (u8)
Bits 24-31:   constraint_progress (u8)
Bits 32-39:   constraint_2_progress (u8)
Bits 40-47:   max_combo_run (u8)
Bits 48-79:   total_score (u32)
Bit 80:       zone_cleared (bool)
Bits 81-88:   current_difficulty (u8)
Bits 89-92:   zone_id (u4)
Bits 93-100:  active_mutator_id (u8)
Bit 101:      mode (u1) — 0=Map, 1=Endless
```

## Key Models

| Model | Key | Fields |
|-------|-----|--------|
| Game | felt252 | blocks, next_row, combo, run_data, level_stars, over |
| GameSeed | felt252 | seed, level_seed, vrf_enabled |
| GameLevel | felt252 | level config with 3 constraint slots + mutator_id |
| PlayerMeta | ContractAddress | packed MetaData (total_runs, daily_stars), best_level |
| PlayerBestRun | player + settings_id + mode | best_score, best_stars, map_cleared |
| ZoneConfig | u8 | settings_id, theme_id, mutator_count, enabled |
| MutatorDef | u8 | generation + scoring modifiers |

Daily models: `DailyChallenge`, `DailyEntry`, `DailyLeaderboard`, `GameChallenge`

## Level System

**Zone mode (L1-10):**
- Progressive difficulty VeryEasy -> Master
- Constraints from L3+: ComboLines, BreakBlocks, ComboStreak, KeepGridBelow
- Boss at L10 with dual constraints and themed identity (10 boss identities in `contracts/src/helpers/boss.cairo`)
- Boss ID derived from `level_seed % 10 + 1`
- Star ratings: 3-star (<=40% moves used), 2-star (<=70%), 1-star (complete)

**Endless (L11+):**
- Score-based difficulty scaling, no move limits, no constraints
- Difficulty thresholds: [0, 15, 40, 80, 150, 280, 500, 900]
- Score multipliers: [1.0x, 1.2x, 1.4x, 1.7x, 2.0x, 2.5x, 3.3x, 4.0x]
- Game over only when grid fills

## Themes (10 total)

| ID | Theme | Notes |
|----|-------|-------|
| 1 | Polynesian | Teal ocean, moonlit coast |
| 2 | Ancient Egypt | Golden sandstone |
| 3 | Norse | Frost/aurora |
| 4 | Ancient Greece | White marble |
| 5 | Feudal Japan | Red/black lacquer |
| 6 | Ancient China | Jade/emerald |
| 7 | Ancient Persia | Blue geometric |
| 8 | Mayan | Jungle green |
| 9 | Tribal | Earthy/teal |
| 10 | Inca | Mountain stone |

Alpha zones: Polynesian (1), Feudal Japan (5), Ancient Persia (7)

## EGC Integration (Embeddable Game Component)

Uses `game_components_embeddable_game_standard` (branch:next):

1. `mint_game()` on game_system (MinigameComponent) — mints ERC721, token_id is felt252
2. `settings_id` in token metadata represents the map (not the mode)
3. `game_system.create(game_id)` reads `settings_id` from token via `ConfigUtilsTrait::get_game_settings()`
4. `GameSettings` loaded from Dojo world by `settings_id`
5. Mode (Map=0, Endless=1) is a runtime parameter, not stored in token

### Map Access Control
- `GameSettingsMetadata.is_free` — free vs. gated maps
- settings_id 0 (Polynesian): free
- settings_id 1, 2 (Japan, Persia): require `MapEntitlement`
- Daily challenge games bypass entitlement checks

### Mutator System
- Pool of up to 32 mutators, gated per map via `GameSettings.allowed_mutators` bitmask
- Rolled at game start
- Hooks exist (`modify_level_config()`, `modify_score()`, `modify_block_weights()`) but are no-op — effects not yet wired

## Key Files Reference

### Frontend Pages
- `client-budokan/src/App.tsx` — AppShell, tab-based routing, BottomTabBar
- `client-budokan/src/ui/pages/HomePage.tsx` — Zone selector + NEW GAME button
- `client-budokan/src/ui/pages/PlayScreen.tsx` — Gameplay grid + HUD
- `client-budokan/src/ui/pages/MapPage.tsx` — 10-level zone map with winding path
- `client-budokan/src/ui/pages/LeaderboardPage.tsx` — Ranked leaderboard
- `client-budokan/src/ui/pages/DailyChallengePage.tsx` — Daily challenge + leaderboard
- `client-budokan/src/ui/pages/SettingsPage.tsx` — Audio, theme, account

### Frontend Navigation
- Tab-based: `home | map | ranks | settings` (persistent bottom tab bar)
- Overlay pages: `play | daily` (tab bar hidden)
- Navigation store: `client-budokan/src/stores/navigationStore.ts`

### Frontend Key Hooks
- `useGame(gameId)` — Game state from RECS
- `useGrid(gameId)` — 2D block array
- `useGameLevel(gameId)` — Level config
- `useSettings(settingsId)` — GameSettings
- `usePlayerMeta(player)` — Player progression
- `useGameTokensSlot(owner)` — Owned game NFTs (slot mode)
- `useLeaderboardSlot()` — Leaderboard (slot mode)

### Smart Contract Systems
- `contracts/src/systems/game.cairo` — `create(game_id)`, `surrender()`
- `contracts/src/systems/moves.cairo` — `move()` (mode-aware)
- `contracts/src/systems/grid.cairo` — `execute_move()`, `initialize_grid()`
- `contracts/src/systems/level.cairo` — `initialize_level()`, `initialize_endless_level()`, `finalize_level()`
- `contracts/src/systems/config.cairo` — GameSettings management, map pricing, entitlements
- `contracts/src/systems/renderer.cairo` — NFT metadata + SVG
- `contracts/src/systems/daily_challenge.cairo` — Daily challenge (create, register, settle)

### Smart Contract Helpers
- `contracts/src/helpers/controller.cairo` — Grid manipulation logic
- `contracts/src/helpers/level.cairo` — Level generation with settings
- `contracts/src/helpers/packing.cairo` — RunData bit-packing (102 bits)
- `contracts/src/helpers/boss.cairo` — Boss identity system (10 identities)
- `contracts/src/helpers/scoring.cairo` — Score calculations
- `contracts/src/helpers/game_over.cairo` — Game over handling

### Token Contracts
- `packages/token/` — ERC20 Fake LORD with faucet (dev only)
- `contracts/src/external/` — FullTokenContract, MinigameRegistryContract (copied, not built externally)

## State Management

- **On-chain:** RECS via Dojo (reactive, synced from Torii)
- **UI:** Zustand stores (`navigationStore.ts`, `moveTxStore.ts`, `generalStore.ts`)
- **Audio:** React contexts (`MusicPlayerProvider`, `SoundPlayerProvider`)

## Transaction Flow

- All transactions via `client-budokan/src/dojo/systems.ts`
- Wrapped with toast notifications + error handling
- VRF calls prepended on Sepolia/Mainnet, skipped on Slot
- `game_id` is `BigInt`/`BigNumberish` throughout (felt252 packed token_id)

## Entity ID

`game_id` = felt252 packed ERC721 token_id from embeddable game standard. Not a simple counter.

```typescript
// Extract from mint_game Transfer event:
const tokenIdLow = BigInt(transferEvent.keys[3]);
const tokenIdHigh = BigInt(transferEvent.keys[4]);
const game_id = uint256.uint256ToBN({ low: tokenIdLow, high: tokenIdHigh });
```

Torii stores entity IDs without leading zeros — normalize before RECS lookups:
```typescript
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};
```

## Namespace

Current: `zkube_jc_sepolia_v1`

Torii model prefix: `zkube_jc_sepolia_v1-Game`, `zkube_jc_sepolia_v1-PlayerMeta`, etc.

## Development Commands

### Frontend
```bash
cd client-budokan
pnpm slot        # Dev server (https://localhost:5125)
pnpm build       # Production build
pnpm test        # Vitest
```

### Contracts
```bash
export PATH="$HOME/.cargo/bin:$PATH"   # Required for cargo (ekubo dep)
sozo build -P slot
scarb test                             # 177 tests
DOJO_PRIVATE_KEY="..." sozo migrate -P slot   # From workspace root
```

## Slot Deployment

- Katana RPC: `https://api.cartridge.gg/x/zkube-djizus-slot/katana`
- Torii: `https://api.cartridge.gg/x/zkube-djizus-slot/torii`
- World: `0x02aa3cdc15efd58da24158a5c518e4dc3fd9dfeb3207908cd330fbee274698c9`
- FullTokenContract: `0x045edce17818992bb6885a3f9b85bf901179cbab2bee32deae4d1862f16c23bc`
- Account: `0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec`
- Seed: `zkube_jc_slot_v5`
- VRF: pseudo-random (no Cartridge VRF on slot)
- `game_system` dojo_init guards `minigame.initializer` behind non-zero denshokan check

### Redeployment Steps
1. Change seed in `dojo_slot.toml`
2. Declare + deploy MinigameRegistry + FullTokenContract (`sozo declare`/`sozo deploy`)
3. Update `denshokan_address` in `dojo_slot.toml` init_call_args
4. `sozo migrate -P slot`
5. Copy `manifest_slot.json` to `contracts/` and `client-budokan/`
6. Restart Torii with new world address

### Torii Config (`contracts/torii_slot.toml`)
Must include FullTokenContract for ERC721 token balance indexing:
```toml
contracts = ["erc721:0x045edce..."]
```

### Troubleshooting
- **"Invalid new schema to upgrade resource"** — Change seed in `dojo_slot.toml` or restart katana
- **"Requested contract address 0x0 is not deployed"** — `denshokan_address` in init_call_args is wrong or FullTokenContract not deployed

## Important Patterns

- `game_id` is felt252 everywhere (BigInt in TS, BigNumberish in starknet.js)
- RunData packed in felt252 — use pack/unpack helpers in `contracts/src/helpers/packing.cairo`
- Auto-advance between levels in same tx (no multi-tx level transitions)
- Mode-aware logic: Map (10 levels + boss) vs Endless (survival, L11+)
- Mutator system exists but effects are no-op (models created, not wired into generation)
- Boss only at L10
- Stars are the ONLY progression signal — no economy

## What Does NOT Exist (removed in redesign)

- No skill system (`skill_tree_system`, `draft_system`, `bonus_system`, `skill_effects_system`)
- No cube token / economy (`cube_token_system`)
- No quest system (`quest_system`)
- No achievement system (arcade dependency removed)
- No in-game shop
- No `game_erc721` package (legacy ERC721 removed)
- No `build-external-contracts` step (FullTokenContract copied to `contracts/src/external/`)

## Documentation

- `docs/CONFIGURABLE_SETTINGS.md` — GameSettings customization
- `docs/DEPLOYMENT_GUIDE.md` — Network deployment guide
