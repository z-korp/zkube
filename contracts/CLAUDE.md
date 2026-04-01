# zKube Smart Contracts Reference

## Overview
Cairo 2.13.1 contracts using Dojo 1.8.0. zKube is a fully on-chain puzzle game where players manipulate blocks on an 8x10 grid. The game features themed zones (10 levels + boss), an endless survival mode, and daily challenges. Stars are the primary progression signal; there is no in-game skill tree or economy.

## Directory Structure
- **src/models/** (6 files): Data structures for game state, players, and configuration.
- **src/systems/** (7 files): Logic for gameplay, moves, grid manipulation, and admin config.
- **src/helpers/** (20 files): Utilities for bit-packing, level generation, scoring, and randomness.
- **src/types/** (9 files): Enums and structs for constraints, difficulties, and game modes.
- **src/elements/** (2 subdirs): Data tables for block weights and bonus implementations.
- **src/external/** (2 files): Interfaces for the Minigame Standard and Token contracts.

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
- `data: felt252`: 32 bits packed (see MetaData layout).
- `best_level: u8`: Highest level reached across all runs.

### PlayerBestRun
Keys: `player: ContractAddress`, `settings_id: u32`, `mode: u8`
- `best_score: u32`, `best_stars: u8`, `best_level: u8`: High scores.
- `map_cleared: bool`: True if L10 boss was beaten.
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

### MetaData (32 bits)
- `0-15`: `total_runs` (u16)
- `16-31`: `daily_stars` (u16)

## Systems

### game_system
- `create(game_id, mode)`: Initializes a new game. Reads `settings_id` from token metadata.
- `create_run(game_id, mode)`: Internal logic for starting a run.
- `surrender(game_id)`: Ends the current run.
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
- `add_custom_game_settings(...)`: Admin tool for map creation.
- `purchase_map(settings_id)`: Transfers ERC20 to unlock gated maps.
- `dojo_init`: Registers Polynesian Map (ID 0), Polynesian Endless (ID 1), and Mutators: Tidecaller (ID 1), Riptide (ID 2).

### daily_challenge_system
- `create_daily_challenge(...)`: Admin only. Shared seed for all players.
- `register_entry(challenge_id)`: Burns 1 zTicket.
- `submit_result(challenge_id, game_id)`: Updates leaderboard.
- `settle_challenge(challenge_id)`: Finalizes prizes.

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

## Build & Deploy
```bash
# Build
sozo build -P slot

# Test
scarb test

# Deploy
sozo migrate -P slot
```
