# zKube Smart Contracts Reference

## Overview
Cairo 2.13.1 contracts using Dojo 1.8.0. zKube is a fully on-chain puzzle game where players manipulate blocks on an 8x10 grid. The game features themed zones (10 levels + boss), an endless survival mode, and daily challenges. zStar (soul-bound ERC20) and XP are the dual progression signals. Quest and achievement systems powered by cartridge-gg/arcade.

## Directory Structure
- **src/models/** (9 files): Data structures for game state, players, configuration, weekly leaderboard, cosmetics.
- **src/systems/** (7 files): Logic for gameplay, moves, grid manipulation, admin config, daily challenges.
- **src/helpers/** (21 files): Utilities for bit-packing, level generation, scoring, randomness, weekly leaderboard.
- **src/types/** (9 files): Enums and structs for constraints, difficulties, and game modes.
- **src/elements/** (4 subdirs): Block weights, bonus implementations, task/quest/achievement definitions.
- **src/external/** (3 files): FullTokenContract, MinigameRegistryContract, ZStarToken.
- **src/components/** (1 file): ProgressionComponent (arcade quest/achievement integration).

## Models

### Game
Key: `game_id: felt252` (Packed ERC721 token_id)
- `blocks: felt252`: 240 bits (10 rows × 8 columns × 3 bits per block).
- `next_row: u32`: 24 bits pre-generated for the next insertion.
- `combo_counter: u8`: Current combo streak in the level.
- `max_combo: u8`: Best combo achieved in the level.
- `run_data: felt252`: 118 bits packed metadata (see RunData layout).
- `level_stars: felt252`: 20 bits (2 bits × 10 levels, values 0-3).
- `started_at: u64`: Unix timestamp of run start.
- `over: bool`: True if the game has ended.

### GameSeed
Key: `game_id: felt252`
- `seed: felt252`: Original VRF/pseudo seed (immutable).
- `level_seed: felt252`: Current level's derived seed.
- `vrf_enabled: bool`: True if using Cartridge VRF.

### GameLevel
Key: `game_id: felt252`
- `level: u8`: Current level number.
- `points_required: u16`: Score target.
- `max_moves: u16`: Move limit.
- `difficulty: u8`: Difficulty tier (0-9).
- `constraint_type: u8`, `constraint_value: u8`, `constraint_count: u8`: Primary objective.
- `constraint2_type: u8`, `constraint2_value: u8`, `constraint2_count: u8`: Secondary objective.
- `constraint3_type: u8`, `constraint3_value: u8`, `constraint3_count: u8`: Tertiary objective.
- `mutator_id: u8`: Active mutator for this level.

### PlayerMeta
Key: `player: ContractAddress`
- `data: felt252`: 64 bits packed (see MetaData layout: `total_runs`, `daily_stars`, `lifetime_xp`).
- `best_level: u8`: Highest level reached across all runs.
- `last_active: u64`: Timestamp of last game creation (for Welcome Back bonus).

### PlayerBestRun
Keys: `player: ContractAddress`, `settings_id: u32`, `mode: u8`
- `best_score: u32`, `best_stars: u8`, `best_level: u8`: High scores.
- `map_cleared: bool`: True if L10 boss was beaten.
- `best_level_stars: felt252`: Per-level best stars (2 bits x 10 levels), for delta minting.
- `best_game_id: felt252`: ID of the record-breaking run.

### GameSettings
Key: `settings_id: u32`
- `mode: u8`: Difficulty mode (Increasing=1).
- `base_moves: u16`, `max_moves: u16`: Move scaling bounds.
- `base_ratio_x100: u16`, `max_ratio_x100: u16`: Points-per-move scaling.
- `tier_1_threshold` to `tier_7_threshold: u8`: Level thresholds for difficulty tiers.
- `constraints_enabled: u8`, `constraint_start_level: u8`: Constraint logic gates.
- `constraint_lines_budgets: u64`: Packed min/max lines and budgets.
- `constraint_chances: u32`: Packed dual/secondary chances.
- `veryeasy_size1_weight` to `veryeasy_size5_weight: u8`: Block weights at tier 0.
- `master_size1_weight` to `master_size5_weight: u8`: Block weights at tier 7.
- `early_variance_percent`, `mid_variance_percent`, `late_variance_percent: u8`: RNG variance.
- `early_level_threshold`, `mid_level_threshold: u8`: Variance tier bounds.
- `level_cap: u8`: Max level for scaling (default 50).
- `allowed_mutators: u32`: Bitmask of 32 possible mutators.
- `endless_difficulty_thresholds: felt252`: 8 × u16 packed score thresholds.
- `endless_score_multipliers: u64`: 8 × u8 packed multipliers (x100).
- `bonus_1_type`, `bonus_1_trigger_type`, `bonus_1_trigger_threshold`, `bonus_1_starting_charges: u8`: Slot 1 config.
- `bonus_2_type`, `bonus_2_trigger_type`, `bonus_2_trigger_threshold`, `bonus_2_starting_charges: u8`: Slot 2 config.
- `bonus_3_type`, `bonus_3_trigger_type`, `bonus_3_trigger_threshold`, `bonus_3_starting_charges: u8`: Slot 3 config.

### MutatorDef
Key: `mutator_id: u8`
- `name: felt252`, `zone_id: u8`: Metadata.
- `moves_modifier: u8`, `ratio_modifier: u8`, `difficulty_offset: u8`: Bias-encoded (128=neutral).
- `combo_score_mult_x100: u16`: Score multiplier.
- `star_threshold_modifier: u8`: Bias-encoded.
- `endless_ramp_mult_x100: u16`: Difficulty escalation multiplier.
- `line_clear_bonus: u8`, `perfect_clear_bonus: u8`: Flat score bonuses.
- `starting_rows: u8`: Grid fill override (default 4).

### Daily Models
- **DailyChallenge**: `challenge_id (u32)`, `settings_id (u32)`, `seed (felt252)`, `start_time (u64)`, `end_time (u64)`, `prize_pool (u256)`, `game_mode (u8)`.
- **DailyEntry**: `challenge_id`, `player`, `attempts (u32)`, `best_score (u16)`, `best_level (u8)`, `prize_amount (u256)`, `claimed (bool)`.
- **DailyLeaderboard**: `challenge_id`, `rank (u32)`, `player`, `value (u32)`.
- **GameChallenge**: `game_id`, `challenge_id`.

### Weekly Models
- **WeeklyEndless**: `week_id (u32)`, `total_participants (u32)`, `settled (bool)`.
- **WeeklyEndlessLeaderboard**: `week_id`, `rank (u32)`, `player`, `score (u32)`.
- **WeeklyEndlessEntry**: `week_id`, `player`, `best_score (u32)`, `submitted (bool)`.

### Progression Models
- **CosmeticUnlock**: `player`, `cosmetic_id (u32)`, `purchased_at (u64)`.
- **CosmeticDef**: `cosmetic_id (u32)`, `name`, `star_cost (u256)`, `category (u8)`, `enabled (bool)`.

## Bit Layouts

### RunData (118 bits)
- `0-7`: `current_level` (u8)
- `8-15`: `level_score` (u8)
- `16-23`: `level_moves` (u8)
- `24-31`: `constraint_progress` (u8)
- `32-39`: `constraint_2_progress` (u8)
- `40-47`: `max_combo_run` (u8)
- `48-79`: `total_score` (u32)
- `80`: `zone_cleared` (bool)
- `81-88`: `current_difficulty` (u8)
- `89-92`: `zone_id` (u4)
- `93-100`: `active_mutator_id` (u8)
- `101`: `mode` (0=Map, 1=Endless)
- `102-103`: `bonus_type` (0=None, 1=Hammer, 2=Totem, 3=Wave)
- `104-107`: `bonus_charges` (u4, max 15)
- `108-115`: `level_lines_cleared` (u8)
- `116-117`: `bonus_slot` (u2, 0-2)

### MetaData (64 bits)
- `0-15`: `total_runs` (u16)
- `16-31`: `daily_stars` (u16)
- `32-63`: `lifetime_xp` (u32) -- never decremented, saturates at u32 max

## Systems

### game_system
- `create(game_id, mode)`: Initializes a new game. Reads `settings_id` from token metadata. Checks Welcome Back bonus (7+ days inactive = +5 zStar + 500 XP). Emits GameStart + DailyPlay progress.
- `create_run(game_id, mode)`: Internal logic for starting a run.
- `surrender(game_id)`: Ends the current run.
- `emit_progress(player, task_id, count, settings_id)`: Emit quest + achievement progress (gated by star-eligibility).
- `apply_bonus(game_id, row, block)`: Uses active bonus charge.
- `dojo_init`: Registers with MinigameRegistry; sets `vrf_address`.

### move_system
- `move(game_id, row, start, final)`: Executes a block swipe.
- Handles auto-advance: if level is complete, calls `level_system.finalize_level`.
- Handles game over: if grid is full or moves exhausted, calls `game_over` helper.

### grid_system
- `initialize_grid(game_id)`: Fills grid to `starting_rows`.
- `execute_move(game_id, row, start, final)`: Core Controller logic. Returns `(lines_cleared, is_grid_full)`.
- `assess_grid(game_id)`: Applies gravity and clears lines.

### level_system
- `initialize_level(game_id)`: Generates L1 config and emits `LevelStarted`.
- `finalize_level(game_id)`: Calculates stars, emits `LevelCompleted`, and advances to next level in the same transaction.

### config_system
- `add_custom_game_settings(...)`: Permissionless map creation (EGC standard).
- `purchase_map(settings_id)`: USDC payment with star discount (90% cap). Sends to treasury.
- `unlock_with_stars(settings_id)`: Burns zStar to unlock a zone.
- `set_star_eligible(settings_id, eligible)`: Admin whitelist for star-earning settings.
- `is_star_eligible(settings_id)`: Check if settings earn progression rewards.
- `set_zstar_address(address)`: Set the zStar token contract address.
- `set_treasury(address)`: Set the USDC payment treasury wallet.
- `dojo_init`: Registers Polynesian Map (ID 0), Polynesian Endless (ID 1), Mutators, and star-eligible whitelist.

### daily_challenge_system
- `create_daily_challenge(...)`: Admin only. Shared seed for all players.
- `register_entry(challenge_id)`: Burns 1 zTicket.
- `submit_result(challenge_id, game_id)`: Updates leaderboard. Mints 3 zStar on first submission.
- `settle_challenge(challenge_id)`: Permissionless. Finalizes LORDS prizes + percentile-based zStar payouts.
- `settle_weekly_endless(week_id)`: Permissionless. Weekly endless leaderboard settlement with percentile-based zStar payouts.

## Types

### Difficulty (Enum)
- `0: None`, `1: Increasing`, `2: VeryEasy`, `3: Easy`, `4: Medium`, `5: MediumHard`, `6: Hard`, `7: VeryHard`, `8: Expert`, `9: Master`.

### ConstraintType (Enum)
- `0: None`: Point goal only.
- `1: ComboLines`: Clear X lines in one move, Y times.
- `2: BreakBlocks`: Destroy X blocks of size Y.
- `3: ComboStreak`: Reach combo of X.
- `4: KeepGridBelow`: Boss-only. Fail if grid height >= X.

### Bonus (Enum)
- `1: Hammer`: Destroy single block.
- `2: Totem`: Destroy all blocks of same size.
- `3: Wave`: Destroy entire row.

## Events
- `StartGame`: `player`, `timestamp`, `game_id`.
- `LevelStarted`: `game_id`, `player`, `level`, `points_required`, `max_moves`, `constraint_type`, `constraint_value`, `constraint_required`.
- `LevelCompleted`: `game_id`, `player`, `level`, `moves_used`, `score`, `total_score`.
- `RunEnded`: `game_id`, `player`, `final_level`, `final_score`, `current_difficulty`, `started_at`, `ended_at`.
- `ConstraintProgress`: `game_id`, `constraint_type`, `current`, `required`.

## Key Patterns
- **Auto-Advance**: Level completion triggers next level initialization in the same transaction to minimize player friction.
- **Mode-Awareness**: Logic branches between Map mode (10 levels, constraints) and Endless mode (survival, score-based difficulty).
- **Bonus System**: Maps have 3 bonus slots in `GameSettings`. One is rolled at game creation based on `seed % 3`. Charges are awarded via `trigger_type` (Combo/Lines/Score) during moves.
- **VRF/Pseudo**: `RandomImpl` uses Cartridge VRF on Sepolia/Mainnet and Poseidon-based pseudo-randomness on Slot/Katana.

## Progression Components
- **ZStarToken**: Soul-bound ERC20 (`external/zstar_token.cairo`). DECIMALS: 0. Mint/burn only, transfers blocked via `before_update` hook. AccessControl with MINTER_ROLE and BURNER_ROLE.
- **AchievementComponent + QuestComponent**: Embedded in `game_system` via arcade library. 12 quest definitions, 24 achievement definitions, 12 task IDs.
- **ProgressionComponent**: Starknet component in `components/progression.cairo` bridging arcade components.
- **Star Eligibility**: `config_system.star_eligible` map. Only whitelisted settings earn progression rewards.
- **Delta Star Minting**: `level_system.finalize_level` compares this run's stars against `PlayerBestRun.best_level_stars` and mints only the improvement.
- **Zone Clear Bonus**: +100 zStar + 10,000 XP on first boss defeat per zone (in `game_over.cairo`).
- **Welcome Back**: +5 zStar + 500 XP after 7+ days inactive (in `game_system.create_game`).

## Build & Deploy
```bash
# Build
sozo build -P slot

# Test
scarb test

# Deploy
sozo migrate -P slot
```
