//! Shared level completion logic.
//! Used by both move_system and bonus_system to handle level completion.

use starknet::{get_block_timestamp, get_caller_address, ContractAddress};
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use dojo::event::EventStorage;

use zkube::models::game::{Game, GameTrait, GameLevelTrait};
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
use zkube::models::config::GameSettings;
use zkube::helpers::level::LevelGeneratorTrait;
use zkube::helpers::dispatchers;
use zkube::types::constraint::ConstraintType;
use zkube::events::{LevelStarted, LevelCompleted, RunCompleted};
use zkube::systems::cube_token::ICubeTokenDispatcherTrait;

/// Award random bonuses after completing a level.
/// Returns the number of bonuses actually awarded (capped by bag size).
pub fn award_level_bonuses(
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

        // Use random to pick one of the 3 selected bonuses (0, 1, or 2)
        let idx_u16: u16 = current_level.into() + i.into();
        let idx: u8 = if idx_u16 > 255 { 255 } else { idx_u16.try_into().unwrap() };
        let random_slot = LevelGeneratorTrait::get_random_bonus_type(seed, idx) % 3;
        
        // Get the actual bonus type from selected slot
        let bonus_type = *selected.at(random_slot.into());
        
        // Get bag index and size using helper
        let bag_idx = zkube::helpers::packing::RunDataHelpersTrait::bonus_type_to_bag_idx(bonus_type);
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

/// Check if level is complete and handle completion logic.
/// Returns true if level was completed (and possibly the entire run).
pub fn check_and_complete_level(
    ref world: WorldStorage,
    ref game: Game,
    game_id: u64,
    base_seed: felt252,
    settings: GameSettings,
) -> bool {
    if !game.is_level_complete(base_seed, settings) {
        return false;
    }

    // Capture stats BEFORE completing level
    let pre_complete_data = game.get_run_data();
    let completed_level = pre_complete_data.current_level;
    let final_score = pre_complete_data.level_score;
    let final_moves = pre_complete_data.level_moves;
    let pre_total_score = pre_complete_data.total_score;

    let player = get_caller_address();

    let (cubes, bonuses, is_victory) = game.complete_level(base_seed, settings);
    let bonuses_earned = award_level_bonuses(ref world, ref game, base_seed, player, bonuses);

    // Check if this was a boss level (10, 20, 30, 40) - set pending_level_up
    // Level 50 is victory, so no level-up there
    if !is_victory && (completed_level == 10 || completed_level == 20 || completed_level == 30 || completed_level == 40) {
        let mut run_data = game.get_run_data();
        run_data.pending_level_up = true;
        game.set_run_data(run_data);
    }

    // Emit level completed
    world
        .emit_event(
            @LevelCompleted {
                game_id,
                player,
                level: completed_level,
                cubes,
                moves_used: final_moves.into(),
                score: final_score.into(),
                total_score: pre_total_score,
                bonuses_earned,
            },
        );

    if is_victory {
        game.over = true;
        
        let final_run_data = game.get_run_data();
        
        world
            .emit_event(
                @RunCompleted {
                    game_id,
                    player,
                    final_score: final_run_data.total_score,
                    total_cubes: final_run_data.total_cubes,
                    started_at: game.started_at,
                    completed_at: get_block_timestamp(),
                },
            );
        
        let cubes_to_mint: u256 = final_run_data.total_cubes.into();
        if cubes_to_mint > 0 {
            let cube_token = dispatchers::get_cube_token_dispatcher(world);
            cube_token.mint(player, cubes_to_mint);
        }
        
        return true;
    }

    // Generate next level config
    let mut updated_run_data = game.get_run_data();
    let next_level_config = LevelGeneratorTrait::generate(
        base_seed, updated_run_data.current_level, settings,
    );
    
    // Set no_bonus_constraint flag for the next level
    let has_no_bonus = next_level_config.constraint.constraint_type == ConstraintType::NoBonusUsed
        || next_level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed;
    updated_run_data.no_bonus_constraint = has_no_bonus;
    game.set_run_data(updated_run_data);
    
    let game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
    world.write_model(@game_level);

    world
        .emit_event(
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

    true
}
