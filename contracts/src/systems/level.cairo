//! Level System - handles level transitions and heavy level operations.
//! 
//! This system is called via dispatcher from other systems (bonus_system, move_system)
//! to avoid importing heavy dependencies like LevelGeneratorTrait directly.
//! 
//! Pattern inspired by dark-shuffle's dispatcher architecture.

#[starknet::interface]
pub trait ILevelSystem<T> {
    /// Initialize level 1 for a new game.
    /// Generates the level config and writes to GameLevel model.
    /// Returns true if level has NoBonusUsed constraint.
    fn initialize_level(ref self: T, game_id: u64) -> bool;
    
    /// Complete the current level and transition to the next.
    /// Returns (cubes_earned, bonuses_awarded, is_victory)
    /// 
    /// This handles:
    /// - Awarding cubes based on moves used
    /// - Awarding random bonuses based on performance
    /// - Generating next level configuration
    /// - Emitting level completion events
    /// - Minting cubes on victory (level 50)
    fn complete_level(ref self: T, game_id: u64) -> (u8, u8, bool);
    
    /// Insert a new line when grid is empty (but level not complete).
    /// This is needed when a bonus clears the entire grid.
    fn insert_line_if_empty(ref self: T, game_id: u64);
}

#[dojo::contract]
mod level_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameLevelTrait};
    use zkube::models::game::GameSeed;
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::level::{LevelGeneratorTrait, BossLevel};
    use zkube::helpers::dispatchers;
    use zkube::systems::grid::IGridSystemDispatcherTrait;
    use zkube::types::level::LevelConfigTrait;
    use zkube::helpers::packing::RunDataHelpersTrait;
    use zkube::types::constraint::ConstraintType;
    use zkube::events::{LevelStarted, LevelCompleted, RunCompleted};
    use zkube::systems::cube_token::ICubeTokenDispatcherTrait;

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl LevelSystemImpl of super::ILevelSystem<ContractState> {
        fn initialize_level(ref self: ContractState, game_id: u64) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();
            
            // Generate level 1 config
            let level_config = LevelGeneratorTrait::generate(base_seed.seed, 1, settings);
            
            // Check for NoBonusUsed constraint
            let has_no_bonus = level_config.constraint.constraint_type == ConstraintType::NoBonusUsed
                || level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed;
            
            // Write level config to GameLevel model
            let game_level = GameLevelTrait::from_level_config(game_id, level_config);
            world.write_model(@game_level);
            
            // Emit level 1 started event
            world.emit_event(
                @LevelStarted {
                    game_id,
                    player,
                    level: 1,
                    points_required: level_config.points_required,
                    max_moves: level_config.max_moves,
                    constraint_type: level_config.constraint.constraint_type,
                    constraint_value: level_config.constraint.value,
                    constraint_required: level_config.constraint.required_count,
                },
            );
            
            has_no_bonus
        }
        
        fn complete_level(ref self: ContractState, game_id: u64) -> (u8, u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            
            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            
            // Capture stats BEFORE completing level
            let pre_complete_data = game.get_run_data();
            let completed_level = pre_complete_data.current_level;
            let final_score = pre_complete_data.level_score;
            let final_moves = pre_complete_data.level_moves;
            let pre_total_score = pre_complete_data.total_score;
            
            let player = get_caller_address();
            
            // Calculate level rewards using LevelGeneratorTrait
            let level_config = LevelGeneratorTrait::generate(base_seed.seed, completed_level, settings);
            let cubes = level_config.calculate_cubes(pre_complete_data.level_moves.into());
            let bonuses = LevelConfigTrait::get_bonus_reward(cubes);
            let boss_bonus = BossLevel::get_boss_cube_bonus(completed_level);
            let is_victory = completed_level >= 50;
            
            // Update run_data (no grid changes - that's done via grid_system)
            let (cubes_final, bonuses_final, is_victory_final) = game.complete_level_data(cubes, bonuses, boss_bonus, is_victory);
            
            // Award bonuses
            let bonuses_earned = InternalImpl::award_level_bonuses(
                ref world, ref game, base_seed.seed, player, bonuses_final
            );
            
            // Check if this was a boss level (10, 20, 30, 40) - set pending_level_up
            if !is_victory_final && (completed_level == 10 || completed_level == 20 || completed_level == 30 || completed_level == 40) {
                let mut run_data = game.get_run_data();
                run_data.pending_level_up = true;
                game.set_run_data(run_data);
            }
            
            // Emit level completed
            world.emit_event(
                @LevelCompleted {
                    game_id,
                    player,
                    level: completed_level,
                    cubes: cubes_final,
                    moves_used: final_moves.into(),
                    score: final_score.into(),
                    total_score: pre_total_score,
                    bonuses_earned,
                },
            );
            
            if is_victory_final {
                game.over = true;
                
                let final_run_data = game.get_run_data();
                
                world.emit_event(
                    @RunCompleted {
                        game_id,
                        player,
                        final_score: final_run_data.total_score,
                        total_cubes: final_run_data.total_cubes,
                        started_at: game.started_at,
                        completed_at: get_block_timestamp(),
                    },
                );
                
                // Mint cubes on victory
                let cubes_to_mint: u256 = final_run_data.total_cubes.into();
                if cubes_to_mint > 0 {
                    let cube_token = dispatchers::get_cube_token_dispatcher(world);
                    cube_token.mint(player, cubes_to_mint);
                }
            } else {
                // Generate next level config
                let updated_run_data = game.get_run_data();
                let next_level_config = LevelGeneratorTrait::generate(
                    base_seed.seed, updated_run_data.current_level, settings,
                );
                
                // Set no_bonus_constraint flag for the next level
                let has_no_bonus = next_level_config.constraint.constraint_type == ConstraintType::NoBonusUsed
                    || next_level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed;
                let mut run_data_updated = game.get_run_data();
                run_data_updated.no_bonus_constraint = has_no_bonus;
                game.set_run_data(run_data_updated);
                
                let game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
                world.write_model(@game_level);
                
                world.emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: updated_run_data.current_level,
                        points_required: next_level_config.points_required,
                        max_moves: next_level_config.max_moves,
                        constraint_type: next_level_config.constraint.constraint_type,
                        constraint_value: next_level_config.constraint.value,
                        constraint_required: next_level_config.constraint.required_count,
                    },
                );
                
                // Write game before resetting grid (grid_system will read the updated run_data)
                world.write_model(@game);
                
                // Reset grid for the new level via grid_system dispatcher
                let grid_system = dispatchers::get_grid_system_dispatcher(world);
                grid_system.reset_grid_for_level(game_id);
                
                return (cubes_final, bonuses_earned, is_victory_final);
            }
            
            world.write_model(@game);
            
            (cubes_final, bonuses_earned, is_victory_final)
        }
        
        fn insert_line_if_empty(ref self: ContractState, game_id: u64) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            
            let game: Game = world.read_model(game_id);
            
            // Only insert if grid is actually empty
            if game.blocks != 0 {
                return;
            }
            
            // Delegate to grid_system which owns Controller
            let grid_system = dispatchers::get_grid_system_dispatcher(world);
            grid_system.insert_line_if_empty(game_id);
        }
    }
    
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Award random bonuses after completing a level.
        fn award_level_bonuses(
            ref world: WorldStorage,
            ref game: Game,
            seed: felt252,
            player: ContractAddress,
            bonuses_to_award: u8,
        ) -> u8 {
            if bonuses_to_award == 0 {
                return 0;
            }
            
            // Read player meta for bag sizes
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            
            let mut run_data = game.get_run_data();
            let current_level = run_data.current_level;
            
            // Get the 3 selected bonus types
            let selected = array![
                run_data.selected_bonus_1,
                run_data.selected_bonus_2,
                run_data.selected_bonus_3
            ];
            
            let mut awarded: u8 = 0;
            let mut i: u8 = 0;
            loop {
                if i >= bonuses_to_award {
                    break;
                }
                
                // Use random to pick one of the 3 selected bonuses
                let idx_u16: u16 = current_level.into() + i.into();
                let idx: u8 = if idx_u16 > 255 { 255 } else { idx_u16.try_into().unwrap() };
                let random_slot = LevelGeneratorTrait::get_random_bonus_type(seed, idx) % 3;
                
                // Get the actual bonus type from selected slot
                let bonus_type = *selected.at(random_slot.into());
                
                // Get bag index and size
                let bag_idx = RunDataHelpersTrait::bonus_type_to_bag_idx(bonus_type);
                let bag_size = player_meta.get_bag_size(bag_idx);
                
                // Get current count and try to award
                let (current, can_award) = if bonus_type == 1 { (run_data.hammer_count, run_data.hammer_count < bag_size) }
                    else if bonus_type == 2 { (run_data.totem_count, run_data.totem_count < bag_size) }
                    else if bonus_type == 3 { (run_data.wave_count, run_data.wave_count < bag_size) }
                    else if bonus_type == 4 { (run_data.shrink_count, run_data.shrink_count < bag_size) }
                    else { (run_data.shuffle_count, run_data.shuffle_count < bag_size) };
                
                if can_award {
                    // Increment the appropriate counter
                    if bonus_type == 1 { run_data.hammer_count = current + 1; }
                    else if bonus_type == 2 { run_data.totem_count = current + 1; }
                    else if bonus_type == 3 { run_data.wave_count = current + 1; }
                    else if bonus_type == 4 { run_data.shrink_count = current + 1; }
                    else { run_data.shuffle_count = current + 1; }
                    awarded += 1;
                }
                
                i += 1;
            };
            
            game.set_run_data(run_data);
            awarded
        }
    }
}
