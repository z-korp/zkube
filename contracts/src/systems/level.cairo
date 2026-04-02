//! Level System - level initialization and in-tx auto-advance.

#[starknet::interface]
pub trait ILevelSystem<T> {
    /// Initialize level 1 for a new game.
    fn initialize_level(ref self: T, game_id: felt252) -> bool;

    /// Initialize dedicated endless mode level config for a new game.
    fn initialize_endless_level(ref self: T, game_id: felt252);

    /// Finalize the current level and immediately advance in the same transaction.
    /// Returns reserved legacy tuple: (0, 0, false).
    fn finalize_level(ref self: T, game_id: felt252) -> (u8, u8, bool);

    /// Legacy compatibility entrypoint. Transitioning is now automatic.
    fn start_next_level(ref self: T, game_id: felt252);

    /// Insert a new line when grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: felt252);
}

#[dojo::contract]
mod level_system {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use starknet::{ContractAddress, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{LevelCompleted, LevelStarted};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{GameLibsImpl, IGridSystemDispatcherTrait};
    use zkube::helpers::game_over;
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::game::{Game, GameLevel, GameLevelTrait, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::systems::game::{IGameSystemDispatcher, IGameSystemDispatcherTrait};
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl LevelSystemImpl of super::ILevelSystem<ContractState> {
        fn initialize_level(ref self: ContractState, game_id: felt252) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();
            let active_mutator_id = game.get_run_data().active_mutator_id;
            let mutator_def = InternalImpl::read_mutator_def(world, active_mutator_id);

            let level_config = LevelGeneratorTrait::generate(
                base_seed.level_seed, 1, settings, @mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);
            game_level.mutator_id = active_mutator_id;
            world.write_model(@game_level);

            // Defensive reset of per-level/runtime fields for a fresh run.
            let mut run_data = game.get_run_data();
            run_data.current_level = 1;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;
            run_data.zone_cleared = false;
            run_data.current_difficulty = 0;
            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);
            world.write_model(@game);

            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: 1,
                        points_required: level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: level_config.constraint.constraint_type,
                        constraint_value: level_config.constraint.value,
                        constraint_required: level_config.constraint.required_count,
                    },
                );

            false
        }

        fn initialize_endless_level(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let level_config = LevelGeneratorTrait::generate_endless_level(
                base_seed.seed, settings,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);

            let mut run_data = game.get_run_data();
            run_data.current_level = 1;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;
            run_data.zone_cleared = false;
            run_data.current_difficulty = 0;

            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);

            game_level.mutator_id = run_data.active_mutator_id;

            world.write_model(@game_level);
            world.write_model(@game);
        }

        fn finalize_level(ref self: ContractState, game_id: felt252) -> (u8, u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let run_data = game.get_run_data();

            let completed_level = run_data.current_level;
            let final_score = run_data.level_score;
            let final_moves = run_data.level_moves;
            let total_score = run_data.total_score;
            let player = get_caller_address();

            let stars = InternalImpl::calculate_stars_for_level(game_level, final_moves.into());
            if completed_level <= 10 {
                game.set_level_stars(completed_level, stars);
            }
            world.write_model(@game);

            world
                .emit_event(
                    @LevelCompleted {
                        game_id,
                        player,
                        level: completed_level,
                        moves_used: final_moves.into(),
                        score: final_score.into(),
                        total_score,
                    },
                );

            let game_address = world.dns_address(@"game_system").expect('GameSystem not found in DNS');
            let game_dispatcher = IGameSystemDispatcher { contract_address: game_address };
            game_dispatcher.emit_progress(player, Task::LevelComplete.identifier(), 1);

            InternalImpl::advance_level(ref world, game_id, player);

            (0, 0, false)
        }

        fn start_next_level(ref self: ContractState, game_id: felt252) {
            let _ = game_id;
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: felt252) {
            let world: WorldStorage = self.world(@DEFAULT_NS());

            let game: Game = world.read_model(game_id);
            if game.blocks != 0 {
                return;
            }

            let libs = GameLibsImpl::new(world);
            libs.grid.insert_line_if_empty(game_id);
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

        fn calculate_stars_for_level(game_level: GameLevel, moves_used: u16) -> u8 {
            let cube_3_threshold = game_level.max_moves * 40 / 100;
            let cube_2_threshold = game_level.max_moves * 70 / 100;
            if moves_used <= cube_3_threshold {
                3
            } else if moves_used <= cube_2_threshold {
                2
            } else {
                1
            }
        }

        fn advance_level(ref world: WorldStorage, game_id: felt252, player: ContractAddress) {
            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let mut run_data = game.get_run_data();
            let current_level = run_data.current_level;

            // Dedicated endless mode does not use level progression.
            if run_data.mode == 1 {
                return;
            }

            // Map mode victory at level cap: finish run (no transition to endless).
            if current_level >= 10 {
                run_data.zone_cleared = true;
                game.over = true;
                game.set_run_data(run_data);
                world.write_model(@game);
                game_over::handle_game_over(ref world, game, player);
                return;
            }

            let next_level = current_level + 1;

            run_data.current_level = next_level;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;

            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);

            // Write game before grid reset; grid system reads current_level from run_data.
            world.write_model(@game);

            // Reseed per level for deterministic level variability.
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), next_level.into()].span(),
            );
            let next_seed_random = RandomImpl::from_vrf_enabled(base_seed.vrf_enabled, vrf_salt);
            let next_level_seed = next_seed_random.seed;

            let next_game_seed = GameSeed {
                game_id,
                seed: base_seed.seed,
                level_seed: next_level_seed,
                vrf_enabled: base_seed.vrf_enabled,
            };
            world.write_model(@next_game_seed);

            let mutator_def = Self::read_mutator_def(world, run_data.active_mutator_id);
            let next_level_config = LevelGeneratorTrait::generate(
                next_level_seed, next_level, settings, @mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
            game_level.mutator_id = run_data.active_mutator_id;
            world.write_model(@game_level);

            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: next_level,
                        points_required: next_level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: next_level_config.constraint.constraint_type,
                        constraint_value: next_level_config.constraint.value,
                        constraint_required: next_level_config.constraint.required_count,
                    },
                );

            let libs = GameLibsImpl::new(world);
            libs.grid.reset_grid_for_level(game_id);
        }
    }
}
