use zkube::types::bonus::Bonus;

#[starknet::interface]
pub trait IPlaySystem<T> {
    /// Make a move - also handles level completion automatically
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
    /// Apply a bonus from inventory
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8);
    /// Purchase a consumable from the in-game shop (every 5 levels)
    fn purchase_consumable(ref self: T, game_id: u64, consumable: u8);
}

#[dojo::contract]
mod play_system {
    use zkube::constants::{DEFAULT_NS, DEFAULT_SETTINGS::is_default_settings};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::game::{GameSeed, GameLevelTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::models::config::GameSettings;
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::types::bonus::Bonus;
    use zkube::types::consumable::{ConsumableType, ConsumableTrait};
    use zkube::events::{UseBonus, LevelStarted, LevelCompleted, RunEnded, RunCompleted};
    use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
    use zkube::systems::quest::{IQuestSystemDispatcher, IQuestSystemDispatcherTrait};
    use zkube::elements::tasks::{clearer, combo};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};

    use game_components_minigame::libs::{assert_token_ownership, pre_action, post_action};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl PlaySystemImpl of super::IPlaySystem<ContractState> {
        fn move(
            ref self: ContractState, game_id: u64, row_index: u8, start_index: u8, final_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.get_token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            let base_seed: GameSeed = world.read_model(game_id);
            
            // Get game settings for level generation
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Make the move using the selected game settings
            let lines_cleared = game.make_move(
                base_seed.seed, row_index, start_index, final_index, settings,
            );

            // Track quest progress for lines cleared and combos
            // Only counts for default settings games
            let player = get_caller_address();
            if lines_cleared > 0 {
                // Track lines cleared (LineClearer task)
                self.track_quest_progress(player, clearer::LineClearer::identifier(), lines_cleared.into(), settings.settings_id);
                
                // Track combo achievements based on lines cleared in one move
                if lines_cleared >= 3 {
                    self.track_quest_progress(player, combo::ComboThree::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 5 {
                    self.track_quest_progress(player, combo::ComboFive::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 8 {
                    self.track_quest_progress(player, combo::ComboEight::identifier(), 1, settings.settings_id);
                }
            }

            // Check for level completion
            let level_completed = self.check_and_complete_level(
                ref world, ref game, game_id, base_seed.seed, settings,
            );

            if !level_completed && (game.is_level_failed(base_seed.seed, settings) || game.over) {
                // Level failed (move limit exceeded) or grid full
                game.over = true;
                self.handle_game_over(ref world, game);
            }

            world.write_model(@game);

            post_action(token_address, game_id);
        }

        fn apply_bonus(
            ref self: ContractState, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.get_token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();
            game.assert_bonus_available(bonus);

            let base_seed: GameSeed = world.read_model(game_id);
            
            // Get game settings
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            
            game.apply_bonus(base_seed.seed, bonus, row_index, line_index, settings);

            // Check for level completion after bonus
            self.check_and_complete_level(ref world, ref game, game_id, base_seed.seed, settings);

            world.write_model(@game);
            post_action(token_address, game_id);

            world
                .emit_event(
                    @UseBonus {
                        player: starknet::get_caller_address(),
                        timestamp: get_block_timestamp(),
                        game_id,
                        bonus,
                    },
                );
        }

        fn purchase_consumable(ref self: ContractState, game_id: u64, consumable: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.get_token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();

            let mut run_data = game.get_run_data();
            let player = get_caller_address();

            // In-game shop is only available after completing levels 5, 10, 15, ...
            // (i.e. when current_level is 6, 11, 16, ...).
            assert!(run_data.current_level > 1, "Shop not available");
            assert!((run_data.current_level - 1) % 5 == 0, "Shop not available");

            // Get game settings for consumable costs
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Convert u8 to ConsumableType
            let consumable_type: ConsumableType = consumable.into();
            let cost = consumable_type.get_cost_from_settings(settings);

            // Check player has enough cubes (brought + earned - spent)
            let total_budget: u32 = run_data.cubes_brought.into() + run_data.total_cubes.into();
            let spent: u32 = run_data.cubes_spent.into();
            let cubes_available: u32 = if total_budget >= spent { total_budget - spent } else { 0 };
            assert!(cubes_available >= cost.into(), "Insufficient cubes");

            // Spend the cubes
            let new_spent: u32 = spent + cost.into();
            assert!(new_spent <= 65535, "Cubes spent overflow");
            run_data.cubes_spent = new_spent.try_into().unwrap();

            // Read player meta for bag sizes
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }

            // Apply consumable effect
            match consumable_type {
                ConsumableType::Hammer => {
                    let max_bag = player_meta.get_bag_size(0);
                    assert!(run_data.hammer_count < max_bag, "Hammer bag is full");
                    run_data.hammer_count = run_data.hammer_count + 1;
                },
                ConsumableType::Wave => {
                    let max_bag = player_meta.get_bag_size(1);
                    assert!(run_data.wave_count < max_bag, "Wave bag is full");
                    run_data.wave_count = run_data.wave_count + 1;
                },
                ConsumableType::Totem => {
                    let max_bag = player_meta.get_bag_size(2);
                    assert!(run_data.totem_count < max_bag, "Totem bag is full");
                    run_data.totem_count = run_data.totem_count + 1;
                },
                ConsumableType::ExtraMoves => {
                    // ExtraMoves extends the current level's move limit.
                    let base_seed: GameSeed = world.read_model(game_id);
                    let level_config = LevelGeneratorTrait::generate(
                        base_seed.seed, run_data.current_level, settings,
                    );

                    let max_extra: u16 = if level_config.max_moves >= 255 {
                        0
                    } else {
                        255 - level_config.max_moves
                    };
                    assert!(max_extra > 0, "Move limit already maxed");
                    
                    let current_extra: u16 = run_data.extra_moves.into();
                    assert!(current_extra < max_extra, "Extra moves maxed");
                    
                    // Add 5 extra moves (or whatever fits)
                    let add_moves: u8 = 5;
                    let new_extra: u16 = current_extra + add_moves.into();
                    run_data.extra_moves = if new_extra > max_extra {
                        max_extra.try_into().unwrap()
                    } else {
                        new_extra.try_into().unwrap()
                    };
                },
            }

            game.set_run_data(run_data);
            world.write_model(@game);
            post_action(token_address, game_id);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Get token address from game_system via DNS
        fn get_token_address(self: @ContractState) -> ContractAddress {
            let world = self.world(@DEFAULT_NS());
            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            
            // Use the IMinigame interface to get token_address from game_system
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
            minigame_dispatcher.token_address()
        }

        /// Award random bonuses after completing a level.
        fn award_level_bonuses(
            ref self: ContractState,
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
                
                // Get bag index and size: 1=Hammer->0, 2=Totem->2, 3=Wave->1, 4=Shrink->3, 5=Shuffle->4
                let bag_idx = if bonus_type == 1 { 0_u8 } 
                    else if bonus_type == 2 { 2_u8 }
                    else if bonus_type == 3 { 1_u8 }
                    else if bonus_type == 4 { 3_u8 }
                    else { 4_u8 };
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

        fn handle_game_over(ref self: ContractState, ref world: WorldStorage, game: Game) {
            let player = get_caller_address();
            let run_data = game.get_run_data();

            // Update player meta with best level
            let mut player_meta: PlayerMeta = world.read_model(player);
            player_meta.update_best_level(run_data.current_level);
            
            // Get game settings for cube multiplier
            let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);
            
            // Calculate cubes to mint
            let cubes_spent_from_earned: u16 = if run_data.cubes_spent > run_data.cubes_brought {
                run_data.cubes_spent - run_data.cubes_brought
            } else {
                0
            };
            let base_cubes: u16 = if run_data.total_cubes > cubes_spent_from_earned {
                run_data.total_cubes - cubes_spent_from_earned
            } else {
                0
            };
            
            // Only mint cubes and update stats for games using default settings
            if is_default_settings(settings.settings_id) && base_cubes > 0 {
                let cube_token = self.get_cube_token_dispatcher();
                cube_token.mint(player, base_cubes.into());
                
                player_meta.add_cubes_earned(base_cubes.into());
            }
            world.write_model(@player_meta);

            // Emit run ended event
            world
                .emit_event(
                    @RunEnded {
                        game_id: game.game_id,
                        player,
                        final_level: run_data.current_level,
                        final_score: run_data.total_score,
                        total_cubes: run_data.total_cubes,
                        started_at: game.started_at,
                        ended_at: get_block_timestamp(),
                    },
                );
        }

        fn get_cube_token_dispatcher(self: @ContractState) -> ICubeTokenDispatcher {
            let world = self.world(@DEFAULT_NS());
            let cube_token_address = world.dns_address(@"cube_token")
                .expect('CubeToken not found in DNS');
            ICubeTokenDispatcher { contract_address: cube_token_address }
        }

        fn get_quest_system_dispatcher(self: @ContractState) -> Option<IQuestSystemDispatcher> {
            let world = self.world(@DEFAULT_NS());
            match world.dns_address(@"quest_system") {
                Option::Some(address) => Option::Some(
                    IQuestSystemDispatcher { contract_address: address },
                ),
                Option::None => Option::None,
            }
        }

        fn track_quest_progress(
            self: @ContractState, player: ContractAddress, task_id: felt252, count: u32, settings_id: u32,
        ) {
            if !is_default_settings(settings_id) {
                return;
            }
            if let Option::Some(quest_system) = self.get_quest_system_dispatcher() {
                quest_system.progress(player, task_id, count);
            }
        }

        fn check_and_complete_level(
            ref self: ContractState,
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
            let bonuses_earned = self.award_level_bonuses(ref world, ref game, base_seed, player, bonuses);

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
                    let cube_token = self.get_cube_token_dispatcher();
                    cube_token.mint(player, cubes_to_mint);
                }
                
                return true;
            }

            // Generate next level config
            let updated_run_data = game.get_run_data();
            let next_level_config = LevelGeneratorTrait::generate(
                base_seed, updated_run_data.current_level, settings,
            );
            
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
    }
}
