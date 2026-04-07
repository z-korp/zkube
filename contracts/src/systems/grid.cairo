//! Grid System - non-hot-path grid operations.
//!
//! Owns grid initialization and reset logic.
//! Hot-path move execution lives in helpers::grid_ops (called inline by moves_system).

#[starknet::interface]
pub trait IGridSystem<T> {
    /// Initialize a new game's grid with starting blocks.
    /// This fills the grid until it reaches configured starting rows (default: 4).
    fn initialize_grid(ref self: T, game_id: felt252);

    /// Reset the grid for a new level.
    /// Called after level completion to reinitialize with the new difficulty.
    fn reset_grid_for_level(ref self: T, game_id: felt252);

    /// Insert a new line if the grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: felt252);
}

#[dojo::contract]
mod grid_system {
    use alexandria_math::BitShift;
    use core::hash::HashStateTrait;
    use core::poseidon::{HashState, PoseidonTrait};
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use zkube::constants::{self, DEFAULT_NS};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::models::config::GameSettings;
    use zkube::models::game::{Game, GameLevel, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::types::difficulty::Difficulty;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl GridSystemImpl of super::IGridSystem<ContractState> {
        fn initialize_grid(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let run_data = game.get_run_data();
            let mutator_def = InternalImpl::read_mutator_def(world, run_data.active_mutator_id);
            let mut starting_rows = MutatorEffectsTrait::get_starting_rows(@mutator_def);
            if starting_rows > constants::DEFAULT_GRID_HEIGHT {
                starting_rows = constants::DEFAULT_GRID_HEIGHT;
            }

            let difficulty: Difficulty = game_level.difficulty.into();
            let level_seed = GameTrait::generate_level_seed(base_seed.level_seed, 1);

            // Create initial next_row
            game.next_row = Controller::create_line(level_seed, difficulty, settings);

            // Fill grid until it has at least the configured starting rows.
            let div: u256 = BitShift::shl(
                1_u256, starting_rows.into() * constants::ROW_BIT_COUNT.into(),
            )
                - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                let new_seed = InternalImpl::generate_seed(game.blocks, base_seed.level_seed, 1);
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                let mut counter: u8 = 0;
                let mut _cascade: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter, ref _cascade);
            }

            world.write_model(@game);
        }

        fn reset_grid_for_level(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let run_data = game.get_run_data();
            let current_level = run_data.current_level;
            let mutator_def = InternalImpl::read_mutator_def(world, run_data.active_mutator_id);
            let mut starting_rows = MutatorEffectsTrait::get_starting_rows(@mutator_def);
            if starting_rows > constants::DEFAULT_GRID_HEIGHT {
                starting_rows = constants::DEFAULT_GRID_HEIGHT;
            }
            let difficulty: Difficulty = game_level.difficulty.into();
            let level_seed = GameTrait::generate_level_seed(base_seed.level_seed, current_level);

            // Reset grid
            game.blocks = 0;
            game.next_row = Controller::create_line(level_seed, difficulty, settings);

            // Fill grid until it has at least the configured starting rows.
            let div: u256 = BitShift::shl(
                1_u256, starting_rows.into() * constants::ROW_BIT_COUNT.into(),
            )
                - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                let new_seed = InternalImpl::generate_seed(
                    game.blocks, base_seed.level_seed, current_level,
                );
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                let mut counter: u8 = 0;
                let mut _cascade: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter, ref _cascade);
            }

            world.write_model(@game);
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);

            if game.blocks != 0 {
                return;
            }

            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let run_data = game.get_run_data();

            let difficulty: Difficulty = game_level.difficulty.into();
            let (new_blocks, new_next_row) = InternalImpl::insert_new_line(
                game.blocks,
                game.next_row,
                difficulty,
                base_seed.seed,
                run_data.current_level,
                settings,
            );

            game.blocks = new_blocks;
            game.next_row = new_next_row;
            world.write_model(@game);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
            if mutator_id == 0 {
                return MutatorEffectsTrait::neutral(0);
            }

            let stored: MutatorDef = world.read_model(mutator_id);
            MutatorEffectsTrait::normalize(mutator_id, stored)
        }

        /// Apply gravity and assess lines until stable, tracking cascade depth.
        fn assess_game(ref blocks: felt252, ref counter: u8, ref cascade_depth: u8) -> u16 {
            let mut points = 0;
            let mut upper_blocks = 0;
            loop {
                let mut inner_blocks = 0;
                loop {
                    if inner_blocks == blocks {
                        break;
                    }
                    inner_blocks = blocks;
                    blocks = Controller::apply_gravity(blocks);
                }
                blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
                if upper_blocks == blocks {
                    break points;
                }
                upper_blocks = blocks;
                cascade_depth += 1;
            }
        }

        /// Insert a new line at the bottom.
        fn insert_new_line(
            blocks: felt252,
            current_next_row: u32,
            difficulty: Difficulty,
            seed: felt252,
            current_level: u8,
            settings: GameSettings,
        ) -> (felt252, u32) {
            let new_seed = Self::generate_seed(blocks, seed, current_level);
            let new_next_row = Controller::create_line(new_seed, difficulty, settings);
            let new_blocks = Controller::add_line(blocks, current_next_row);
            (new_blocks, new_next_row)
        }

        /// Generate deterministic seed from state.
        #[inline(always)]
        fn generate_seed(blocks: felt252, base_seed: felt252, current_level: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(base_seed);
            let state = state.update(blocks.into());
            let state = state.update(current_level.into());
            state.finalize()
        }
    }
}
