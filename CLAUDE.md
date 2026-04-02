# zKube - On-Chain Puzzle Game

## Project Overview
zKube is a fully on-chain puzzle game built with Dojo/Starknet. Players manipulate blocks on an 8x10 grid to form horizontal lines, progressing through themed zones or surviving in endless mode.

## Architecture
```
zkube/
├── Scarb.toml                    # Workspace root
├── contracts/                    # Cairo 2.13.1 + Dojo 1.8.0
│   ├── src/
│   │   ├── systems/              # 7 systems: game, moves, grid, level, config, renderer, daily_challenge
│   │   ├── models/               # 9 model files: game, player, config, entitlement, daily, mutator, weekly, cosmetic
│   │   ├── helpers/              # 21 helpers: controller, packing, level, boss, scoring, game_over, weekly, etc.
│   │   ├── types/                # 9 type modules: difficulty, constraint, mode, mutator, level, block, width, daily, bonus
│   │   ├── elements/             # Block weights, tasks (12), quests (12), achievements (24)
│   │   ├── components/           # ProgressionComponent (arcade quest/achievement integration)
│   │   └── external/             # FullTokenContract, MinigameRegistryContract, ZStarToken
│   ├── dojo_slot.toml
│   └── torii_slot.toml
├── packages/
│   └── ticket/                   # zTicket ERC20
├── client-budokan/               # React 19.2.4 + TypeScript 5.7 + Vite 6.0
│   ├── src/
│   │   ├── dojo/                 # Dojo integration layer (setup, systems, models)
│   │   ├── ui/pages/             # 6 pages: Home, Play, Map, Leaderboard, Daily, Settings
│   │   ├── ui/components/        # 34 components (grid, HUD, map, tutorial, shared)
│   │   ├── hooks/                # 21 hooks
│   │   ├── stores/               # 4 Zustand stores (navigation, moveTx, general, cubeBalance)
│   │   └── contexts/             # 7 contexts (controllers, gameEvents, music, sound, metagame, quests)
│   └── .env.slot
├── assets/                       # Graphics, sounds, media
└── scripts/                      # Deploy scripts
```

## Technology Stack
- **Frontend**: React 19.2.4, TypeScript 5.7, Vite 6.0, TailwindCSS 3.4, Motion 11.11, GSAP 3.12, Howler.js 2.2
- **Blockchain**: Starknet 2.13.1, Dojo 1.8.0, Cartridge Controller 0.13.9
- **Libraries**: @dojoengine/sdk 1.9.0, @dojoengine/core 1.8.8, starknet.js 8.5.2, openzeppelin-contracts v3.0.0, alexandria v0.9.0, cartridge-gg/arcade (quest+achievement)

## Game Flow
Mint (NFT) → Create (game_id, mode) → Play (move) → Level Complete (auto-advance) → Boss (L10) → Endless (L11+) → Game Over → Leaderboard

## Grid Representation
- **Dimensions**: 8 columns x 10 rows
- **Encoding**: 240 bits packed in `felt252` (3 bits per block, 24 bits per row)
- **Block Values**: 0 = empty, 1-4 = block widths

## RunData Layout (118 bits in felt252)
- **0-7**: `current_level` (u8)
- **8-15**: `level_score` (u8)
- **16-23**: `level_moves` (u8)
- **24-31**: `constraint_progress` (u8)
- **32-39**: `constraint_2_progress` (u8)
- **40-47**: `max_combo_run` (u8)
- **48-79**: `total_score` (u32)
- **80**: `zone_cleared` (bool)
- **81-88**: `current_difficulty` (u8)
- **89-92**: `zone_id` (u4)
- **93-100**: `active_mutator_id` (u8)
- **101**: `mode` (u1: 0=Map, 1=Endless)
- **102-103**: `bonus_type` (u2: 0=None, 1=Hammer, 2=Totem, 3=Wave)
- **104-107**: `bonus_charges` (u4)
- **108-115**: `level_lines_cleared` (u8)
- **116-117**: `bonus_slot` (u2: 0-2)

## Key Models
| Model | Key | Important Fields |
|-------|-----|------------------|
| `Game` | `game_id: felt252` | `blocks: felt252`, `next_row: u32`, `run_data: felt252`, `level_stars: felt252`, `over: bool` |
| `GameSeed` | `game_id: felt252` | `seed: felt252`, `level_seed: felt252`, `vrf_enabled: bool` |
| `GameLevel` | `game_id: felt252` | `level: u8`, `points_required: u16`, `max_moves: u16`, `constraint_type: u8`, `mutator_id: u8` |
| `PlayerMeta` | `player: ContractAddress` | `data: felt252` (packed: `total_runs`, `daily_stars`, `lifetime_xp`), `best_level: u8`, `last_active: u64` |
| `PlayerBestRun` | `player, settings_id, mode` | `best_score: u32`, `best_stars: u8`, `map_cleared: bool`, `best_level_stars: felt252` |
| `GameSettings` | `settings_id: u32` | `mode: u8`, `base_moves: u16`, `allowed_mutators: u32`, `bonus_1_type: u8`, `level_cap: u8` |
| `GameSettingsMetadata` | `settings_id: u32` | `name, theme_id, is_free, price, payment_token, star_cost: u256` |
| `MutatorDef` | `mutator_id: u8` | `name: felt252`, `moves_modifier: u8`, `combo_score_mult_x100: u16`, `line_clear_bonus: u8` |
| `DailyChallenge` | `challenge_id: u32` | `settings_id: u32`, `seed: felt252`, `start_time: u64`, `game_mode: u8` |
| `WeeklyEndless` | `week_id: u32` | `total_participants: u32`, `settled: bool` |
| `WeeklyEndlessLeaderboard` | `week_id, rank` | `player: ContractAddress`, `score: u32` |
| `CosmeticUnlock` | `player, cosmetic_id` | `purchased_at: u64` |
| `CosmeticDef` | `cosmetic_id: u32` | `name, star_cost, category, enabled` |

## Level System
- **Map Mode**: 10 levels per zone. L1-9 progressive difficulty, L10 Boss with dual/triple constraints.
- **Endless Mode**: L11+ with score-based difficulty scaling and no move limits.
- **Constraints**: `ComboLines`, `BreakBlocks`, `ComboStreak`, `KeepGridBelow` (Boss only).
- **Stars**: 3-star (<=40% moves), 2-star (<=70%), 1-star (complete).

## Bonus System
- **Types**: `Hammer` (single block), `Totem` (all same size), `Wave` (entire row).
- **Slots**: 3 slots defined in `GameSettings`. 1 slot rolled per run based on seed.
- **Triggers**: Charges earned per level via `combo_streak`, `lines_cleared`, or `score` thresholds.

## Mutator System
- **Model**: `MutatorDef` defines scoring, moves, and difficulty modifiers.
- **Selection**: Rolled at game start from `allowed_mutators` bitmask in `GameSettings`.
- **Registered**: `Tidecaller` (ID 1, line clear bonus), `Riptide` (ID 2, combo/endless ramp bonus).

## Progression System

### zStar Token
- **Type**: Soul-bound ERC20 (non-transferable, DECIMALS: 0)
- **Contract**: `contracts/src/external/zstar_token.cairo` (#[starknet::contract])
- **Access**: MINTER_ROLE (game systems), BURNER_ROLE (config_system for zone unlock)
- **Mint sources**: Level completion (delta-minted), zone first-clear bonus (+100), quest rewards, daily challenge participation (+3), leaderboard payouts
- **Burn sinks**: Zone unlock via `unlock_with_stars()`, future cosmetic purchases

### XP System
- **Storage**: `lifetime_xp: u32` packed in `PlayerMeta.data` (bits 32-63)
- **Sources**: Every star minted (+100 XP/star), achievement completion (500-10,000 XP), zone first-clear (+10,000 XP), welcome back (+500 XP)
- **Properties**: Monotonically increasing, never decremented, saturates at u32 max
- **Purpose**: Determines player level and title (client-side derivation)

### Quest System (via arcade library)
- **Library**: `cartridge-gg/arcade` (achievement + quest packages, rev fc2e81c)
- **12 quests**: 9 daily rotating (3 slots x 3 variants, 3-day cycle) + 1 daily finisher + 2 weekly
- **Tasks**: 12 task IDs (LineClear, Combo3/4/5, BonusUsed, GameStart, LevelComplete, PerfectLevel, BossDefeat, ZoneComplete, DailyPlay, DailyQuestDone)
- **Rewards**: 1-5 zStar per quest
- **Progress**: Emitted via `game_system.emit_progress()`, gated by star-eligibility

### Achievement System (via arcade library)
- **24 achievements**: 6 categories x 4 tiers (Common/Rare/Epic/Legendary)
- **Categories**: Grinder (games played), Sweeper (lines cleared), Combo Master (combo skill), Boss Slayer (bosses defeated), Explorer (zones cleared), Challenger (daily challenges)
- **Rewards**: XP only (500-10,000 per achievement, NO stars)
- **Progress**: Cumulative lifetime, never resets

### Zone Unlock
- **Grind path**: `config_system.unlock_with_stars(settings_id)` -- burns zStar equal to `star_cost`
- **Pay path**: `config_system.purchase_map(settings_id)` -- USDC payment with star discount (90% cap)
- **Discount formula**: `effective_price = price x max(10%, 100% - balance/star_cost)`
- **Treasury**: Payments sent to `treasury_address` (configurable)

### Star Eligibility
- **Storage**: `star_eligible: Map<u32, bool>` in config_system
- **Purpose**: Only whitelisted settings earn zStar, quest progress, and achievement progress
- **Default**: Settings 0 (Polynesian Map) and 1 (Polynesian Endless) whitelisted in dojo_init
- **GameStart always emits** (even non-eligible settings)

### Weekly Endless Leaderboard
- **Models**: `WeeklyEndless`, `WeeklyEndlessLeaderboard`, `WeeklyEndlessEntry`
- **Submission**: Automatic on endless game_over (star-eligible only)
- **Settlement**: `settle_weekly_endless(week_id)` -- permissionless, percentile-based payouts

### Welcome Back Bonus
- **Trigger**: `last_active` > 7 days at game creation
- **Reward**: 5 zStar + 500 XP

## Themes
| ID | Name | Description |
|----|------|-------------|
| 1 | Polynesian | Moonlit coast, deep cobalt tones |
| 2 | Ancient Egypt | Golden pyramids, sun-drenched sandstone |
| 3 | Norse | Frost-covered viking realm, aurora skies |
| 4 | Ancient Greece | White marble temples, Aegean Sea |
| 5 | Feudal Japan | Black lacquer dojo, red trim |
| 6 | Ancient China | Imperial jade palace, golden calligraphy |
| 7 | Ancient Persia | Blue geometric mosaics, regal symmetry |
| 8 | Mayan | Jungle temple ruins, mossy masonry |
| 9 | Tribal | Earthy savanna, painted patterns |
| 10 | Inca | Mountainous stone citadel, gold highlights |

## Alpha Config (dojo_init)
- **Settings 0**: Polynesian Map (level_cap 10, mutators allowed: 1)
- **Settings 1**: Polynesian Endless (level_cap 255, mutators allowed: 2)
- **Mutator 1**: Tidecaller (Zone 1, line_clear_bonus 2)
- **Mutator 2**: Riptide (Zone 1, combo_score_mult_x100 150, endless_ramp_mult_x100 130)

## EGC Integration
- **Standard**: Uses `game_components_embeddable_game_standard` (branch: next).
- **Token**: `FullTokenContract` (ERC721) where `token_id` is the `game_id`.
- **Metadata**: `settings_id` baked into NFT metadata determines the map.

## Frontend Pages
- **Home**: Zone selection and game initialization.
- **Play**: Core gameplay grid and HUD.
- **Map**: 10-level progression path with star ratings.
- **Leaderboard**: Global rankings by score and stars.
- **Daily**: Shared-seed daily challenges with prize pools.
- **Settings**: Audio volumes, theme selection, and account management.

## Frontend Key Hooks
- `useGame(gameId)`: Reactive game state and seed from RECS.
- `useGrid(gameId)`: Unpacked 2D block array with gravity/clear logic.
- `useGameLevel(gameId)`: Current level configuration and constraints.
- `useSettings(settingsId)`: Map-specific scaling and bonus parameters.
- `usePlayerMeta()`: Persistent progression and lifetime stats.
- `useGameTokensSlot(owner)`: Owned game NFTs for slot-mode indexing.
- `useLeaderboardSlot()`: Ranked leaderboard data from Torii.

## State Management
- **On-Chain**: RECS (Reactive ECS) via Dojo SDK.
- **UI State**: Zustand stores for navigation, transactions, and balances.
- **Audio/Events**: React Contexts for music, sound, and game event subscriptions.

## Transaction Flow
- **Systems**: All calls via `dojo/systems.ts` wrappers.
- **Randomness**: Cartridge VRF on Sepolia/Mainnet; Pseudo-random on Slot/Katana.
- **Auto-Advance**: Level completion and next level initialization happen in a single `move` transaction.

## Entity ID
- **Format**: `game_id` is a `felt252` (packed ERC721 `token_id`).
- **TS Handling**: `BigInt` in TypeScript, normalized to remove leading zeros for RECS lookups.
- **Extraction**: `uint256.uint256ToBN({ low, high })` from `Transfer` event keys.

## Namespace
- **Current**: `zkube_v2_1_0`

## Development Commands
### Frontend
```bash
cd client-budokan
pnpm install
pnpm slot        # Dev server (https://localhost:5125)
pnpm build       # Production build
```
### Contracts
```bash
sozo build -P slot
scarb test                             # Run 173+ tests
DOJO_PRIVATE_KEY="..." sozo migrate -P slot
```

## Slot Deployment
- **World**: `0x04b615220ebc7d2abf241adc90ede0885739cead167a36f7e94916d4577b493f`
- **Token**: `0x054b2962dfc4363d2140827e12bd29f936973f1b52f07f8362ca26a87c6f9aec`
- **ZStarToken**: `0x06e5f1a7bf27f6075006ea9835d6614c7889779e9db19d5edf5c7e894c77868b`
- **MinigameRegistryContract**: `0x0253abbdfa5108a2f51defd8e5d2ed9f77359d78ab93be0ef1d8df4debf91b81`
- **game_system**: `0x05176e87f00366750f666bfec76ff2301b105bac8853052d1aacb44eba2bd0cb`
- **config_system**: `0x03dd7d60bd65a428be7329ea73bf2dc22d8ae4b3e83dfcca4c733e9e8ea62609`
- **Seed**: `zkube_v2_2`
- **Torii**: Must index `FullTokenContract` for ERC721 balance tracking.

### Deployment Learnings
- `dojo_dev.toml` must exist even when deploying with `-P slot`; a minimal base file is enough for `sozo`.
- `dojo_slot.toml` `init_call_args` for `game_system` are easy to break: `Option::None` serializes to a single felt `0x1`, while `Option::Some(x)` serializes to `0x0, x`. A stray extra felt causes `Input too long for arguments` during `dojo_init`.
- `game_system.dojo_init` now registers all quest and achievement definitions on init. The working pattern is: minigame initializer first, then `achievement.create(...)` / `quest.create(...)`, then write `vrf_address`.
- With `cartridge-gg/arcade`, adding quest/achievement creation is not enough. Their Dojo model/event resources must also be listed in `contracts/Scarb.toml` `build-external-contracts`, otherwise migration fails at init with `Resource ... is registered but not as event` when `world.emit_event(...)` runs inside arcade `create()`.
- The fix was to mirror the `nums` pattern and include these arcade external resources in `build-external-contracts`:
  - achievement models/events: `m_AchievementDefinition`, `m_AchievementCompletion`, `m_AchievementAdvancement`, `m_AchievementAssociation`, `e_TrophyCreation`, `e_TrophyProgression`, `e_AchievementCompleted`, `e_AchievementClaimed`
  - quest models/events: `m_QuestDefinition`, `m_QuestCompletion`, `m_QuestAdvancement`, `m_QuestAssociation`, `m_QuestCondition`, `e_QuestCreation`, `e_QuestProgression`, `e_QuestUnlocked`, `e_QuestCompleted`, `e_QuestClaimed`
- Current deploy path that succeeded: `./scripts/deploy_slot.sh` → declares/deploys registry/token/zstar → updates `dojo_slot.toml` → runs `sozo migrate` successfully → copies manifest to `contracts/manifest_slot.json` and updates client envs.
- `game_system` and `FullTokenContract` currently exceed Starknet mainnet CASM bytecode limits, but Slot/Katana accepted the deployment. This remains a Sepolia/Mainnet risk to solve separately.

## What Does NOT Exist
- No skill tree or permanent character upgrades.
- No tradeable game currency (zStar is soul-bound, non-transferable).
- No draft system or bonus selection during runs.
- No seasonal battle pass (future consideration).
