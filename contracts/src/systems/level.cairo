//! Level System - level initialization and in-tx auto-advance.

#[starknet::interface]
pub trait ILevelSystem<T> {
    /// Initialize level 1 for a new game.
    fn initialize_level(ref self: T, game_id: u64, skill_data: felt252) -> bool;

    /// Finalize the current level and immediately advance in the same transaction.
    /// Returns reserved legacy tuple: (0, 0, false).
    fn finalize_level(ref self: T, game_id: u64, skill_data: felt252) -> (u8, u8, bool);

    /// Legacy compatibility entrypoint. Transitioning is now automatic.
    fn start_next_level(ref self: T, game_id: u64);

    /// Insert a new line when grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: u64);
}

#[dojo::contract]
mod level_system {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use starknet::{ContractAddress, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{LevelCompleted, LevelStarted};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{GameLibsImpl, IGridSystemDispatcherTrait};
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::game::{Game, GameLevel, GameLevelTrait, GameSeed, GameTrait};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl LevelSystemImpl of super::ILevelSystem<ContractState> {
        fn initialize_level(ref self: ContractState, game_id: u64, skill_data: felt252) -> bool {
            let _ = skill_data;
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();

            let level_config = LevelGeneratorTrait::generate(base_seed.level_seed, 1, settings);
            let game_level = GameLevelTrait::from_level_config(game_id, level_config);
            world.write_model(@game_level);

            // Defensive reset of per-level/runtime fields for a fresh run.
            let mut run_data = game.get_run_data();
            run_data.current_level = 1;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.zone_cleared = false;
            run_data.endless_depth = 0;
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

        fn finalize_level(
            ref self: ContractState, game_id: u64, skill_data: felt252,
        ) -> (u8, u8, bool) {
            let _ = skill_data;
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
                        cubes: 0,
                        moves_used: final_moves.into(),
                        score: final_score.into(),
                        total_score,
                        bonuses_earned: 0,
                    },
                );

            InternalImpl::advance_level(ref world, game_id, player);

            (0, 0, false)
        }

        fn start_next_level(ref self: ContractState, game_id: u64) {
            let _ = game_id;
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: u64) {
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
        fn calculate_stars_for_level(game_level: GameLevel, moves_used: u16) -> u8 {
            if moves_used <= game_level.cube_3_threshold {
                3
            } else if moves_used <= game_level.cube_2_threshold {
                2
            } else {
                1
            }
        }

        fn advance_level(ref world: WorldStorage, game_id: u64, player: ContractAddress) {
            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let mut run_data = game.get_run_data();
            let current_level = run_data.current_level;

            let next_level = if current_level < 10 {
                current_level + 1
            } else if current_level == 10 {
                run_data.zone_cleared = true;
                run_data.endless_depth = 1;
                11
            } else {
                if run_data.endless_depth < 255 {
                    run_data.endless_depth += 1;
                }
                current_level + 1
            };

            run_data.current_level = next_level;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;

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

            let next_level_config = LevelGeneratorTrait::generate(next_level_seed, next_level, settings);
            let game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
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
