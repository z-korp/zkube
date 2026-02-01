use zkube::types::consumable::ConsumableType;

#[starknet::interface]
pub trait IShopSystem<T> {
    // ==========================================
    // Permanent Upgrades (burn cubes from wallet)
    // ==========================================
    
    /// Upgrade starting bonus for a specific type (0=Hammer, 1=Wave, 2=Totem, 3=Shrink, 4=Shuffle)
    /// Costs: Level 1 = 100, Level 2 = 250, Level 3 = 500
    /// Note: Shrink (3) and Shuffle (4) require unlock first
    fn upgrade_starting_bonus(ref self: T, bonus_type: u8);

    /// Upgrade bag size for a specific bonus type (0=Hammer, 1=Wave, 2=Totem, 3=Shrink, 4=Shuffle)
    /// Costs: Level 1 = 100, Level 2 = 250, Level 3 = 500
    /// Note: Shrink (3) and Shuffle (4) require unlock first
    fn upgrade_bag_size(ref self: T, bonus_type: u8);

    /// Upgrade cube bridging rank (max 3 levels)
    /// Costs: Rank 1 = 200, Rank 2 = 500, Rank 3 = 1000
    fn upgrade_bridging_rank(ref self: T);

    /// Unlock a new bonus type (Shrink or Shuffle)
    /// @param bonus_type: 4 = Shrink, 5 = Shuffle (using Bonus enum values)
    /// Cost: 200 CUBE each
    fn unlock_bonus(ref self: T, bonus_type: u8);

    /// Level up a bonus after boss clear (called after completing level 10, 20, 30, 40)
    /// @param game_id: The game ID
    /// @param bonus_slot: 0, 1, or 2 (which of the 3 selected bonuses to level up)
    fn level_up_bonus(ref self: T, game_id: u64, bonus_slot: u8);

    // ==========================================
    // In-Game Shop (spend cubes from run budget)
    // ==========================================
    
    /// Purchase a consumable from the in-game shop using brought cubes
    /// Only available after completing levels 5, 10, 15, 20, etc.
    /// @param game_id: The game ID
    /// @param consumable: The consumable type to purchase
    /// @param bonus_slot: Required for LevelUp (0, 1, or 2), ignored for other consumables
    fn purchase_consumable(ref self: T, game_id: u64, consumable: ConsumableType, bonus_slot: u8);

    // ==========================================
    // View Functions
    // ==========================================
    
    /// View: Get cost for next starting bonus upgrade
    fn get_starting_bonus_upgrade_cost(self: @T, current_level: u8) -> u64;

    /// View: Get cost for next bag size upgrade
    fn get_bag_upgrade_cost(self: @T, current_level: u8) -> u64;

    /// View: Get cost for next bridging rank upgrade
    fn get_bridging_upgrade_cost(self: @T, current_rank: u8) -> u64;
    
    /// View: Get in-game shop data for UI
    /// Returns: (cubes_brought, cubes_spent, cubes_available)
    fn get_shop_data(self: @T, game_id: u64) -> (u16, u16, u16);
}

/// Get cost for starting bonus upgrade
/// Level 0 -> 1 = 100, Level 1 -> 2 = 250, Level 2 -> 3 = 500
fn get_starting_bonus_cost(current_level: u8) -> u64 {
    match current_level {
        0 => 100,
        1 => 250,
        2 => 500,
        _ => 0, // Already maxed
    }
}

/// Get cost for bag size upgrade
/// Level 0 -> 1 = 100, Level 1 -> 2 = 250, Level 2 -> 3 = 500
fn get_bag_upgrade_cost_impl(current_level: u8) -> u64 {
    match current_level {
        0 => 100,
        1 => 250,
        2 => 500,
        _ => 0, // Already maxed
    }
}

/// Get cost for bridging rank upgrade
/// Rank 0 -> 1 = 200, Rank 1 -> 2 = 500, Rank 2 -> 3 = 1000
fn get_bridging_upgrade_cost_impl(current_rank: u8) -> u64 {
    match current_rank {
        0 => 200,
        1 => 500,
        2 => 1000,
        _ => 0, // Already maxed
    }
}

#[dojo::contract]
mod shop_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::types::consumable::{ConsumableType, ConsumableTrait};
    use zkube::helpers::packing::{RunData, RunDataHelpersTrait};
    use zkube::helpers::token;
    use zkube::events::{ConsumablePurchased, BonusUnlocked, BonusLevelUp};
    use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
    use zkube::helpers::dispatchers;
    use super::{get_starting_bonus_cost, get_bag_upgrade_cost_impl, get_bridging_upgrade_cost_impl};

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use dojo::event::EventStorage;

    use starknet::{get_caller_address, get_block_timestamp};
    use game_components_minigame::libs::{assert_token_ownership, post_action, pre_action};
    use game_components_token::core::interface::{IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait};
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;

    // Max levels (game design constraints, not storage limits)
    const MAX_STARTING_BONUS: u8 = 3;
    const MAX_BAG_LEVEL: u8 = 3;
    const MAX_BRIDGING_RANK: u8 = 3;

    #[abi(embed_v0)]
    impl ShopSystemImpl of super::IShopSystem<ContractState> {
        fn upgrade_starting_bonus(ref self: ContractState, bonus_type: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Read player meta
            let mut player_meta = dispatchers::get_or_create_player_meta(world, player);

            let mut meta = player_meta.get_meta_data();

            // Get current level for this bonus type
            let current_level = match bonus_type {
                0 => meta.starting_hammer,
                1 => meta.starting_wave,
                2 => meta.starting_totem,
                3 => {
                    assert!(meta.shrink_unlocked, "Shrink not unlocked");
                    meta.starting_shrink
                },
                4 => {
                    assert!(meta.shuffle_unlocked, "Shuffle not unlocked");
                    meta.starting_shuffle
                },
                _ => panic!("Invalid bonus type"),
            };

            assert!(current_level < MAX_STARTING_BONUS, "Already at max starting bonus level");

            // Get cost for next level
            let cost = get_starting_bonus_cost(current_level);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(player, cost.into());

            // Upgrade the bonus
            match bonus_type {
                0 => meta.starting_hammer = current_level + 1,
                1 => meta.starting_wave = current_level + 1,
                2 => meta.starting_totem = current_level + 1,
                3 => meta.starting_shrink = current_level + 1,
                4 => meta.starting_shuffle = current_level + 1,
                _ => {},
            }

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
        }

        fn upgrade_bag_size(ref self: ContractState, bonus_type: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Read player meta
            let mut player_meta = dispatchers::get_or_create_player_meta(world, player);

            let mut meta = player_meta.get_meta_data();

            // Get current level for this bonus type
            let current_level = match bonus_type {
                0 => meta.bag_hammer_level,
                1 => meta.bag_wave_level,
                2 => meta.bag_totem_level,
                3 => {
                    assert!(meta.shrink_unlocked, "Shrink not unlocked");
                    meta.bag_shrink_level
                },
                4 => {
                    assert!(meta.shuffle_unlocked, "Shuffle not unlocked");
                    meta.bag_shuffle_level
                },
                _ => panic!("Invalid bonus type"),
            };

            assert!(current_level < MAX_BAG_LEVEL, "Already at max bag level");

            // Cost = 10 * 2^level
            let cost = get_bag_upgrade_cost_impl(current_level);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(player, cost.into());

            // Upgrade the bag
            match bonus_type {
                0 => meta.bag_hammer_level = current_level + 1,
                1 => meta.bag_wave_level = current_level + 1,
                2 => meta.bag_totem_level = current_level + 1,
                3 => meta.bag_shrink_level = current_level + 1,
                4 => meta.bag_shuffle_level = current_level + 1,
                _ => {},
            }

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
        }

        fn upgrade_bridging_rank(ref self: ContractState) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Read player meta
            let mut player_meta = dispatchers::get_or_create_player_meta(world, player);

            let mut meta = player_meta.get_meta_data();
            let current_rank = meta.bridging_rank;

            assert!(current_rank < MAX_BRIDGING_RANK, "Already at max bridging rank");

            // Cost = 100 * 2^rank
            let cost = get_bridging_upgrade_cost_impl(current_rank);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(player, cost.into());

            // Upgrade the rank
            meta.bridging_rank = current_rank + 1;

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
        }

        fn unlock_bonus(ref self: ContractState, bonus_type: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Only Shrink (4) and Shuffle (5) can be unlocked
            // Note: We use Bonus enum values (4=Shrink, 5=Shuffle)
            assert!(bonus_type == 4 || bonus_type == 5, "Only Shrink (4) or Shuffle (5) can be unlocked");

            // Read player meta
            let mut player_meta = dispatchers::get_or_create_player_meta(world, player);

            let mut meta = player_meta.get_meta_data();

            // Check not already unlocked
            let already_unlocked = if bonus_type == 4 {
                meta.shrink_unlocked
            } else {
                meta.shuffle_unlocked
            };
            assert!(!already_unlocked, "Bonus already unlocked");

            // Cost is 200 CUBE for each unlock
            let cost: u64 = 200;

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(player, cost.into());

            // Unlock the bonus
            if bonus_type == 4 {
                meta.shrink_unlocked = true;
            } else {
                meta.shuffle_unlocked = true;
            }

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);

            // Emit event
            world.emit_event(@BonusUnlocked {
                player,
                bonus_type,
                cost: cost.try_into().unwrap(),
            });
        }

        fn level_up_bonus(ref self: ContractState, game_id: u64, bonus_slot: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = token::get_token_address(world);
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

            // Validate there's a pending level-up
            assert!(run_data.pending_level_up, "No level-up pending");

            // Validate bonus_slot is 0, 1, or 2
            assert!(bonus_slot <= 2, "Invalid bonus slot");

            // Get the current level and bonus type for the selected slot
            let (current_level, bonus_type) = if bonus_slot == 0 {
                (run_data.bonus_1_level, run_data.selected_bonus_1)
            } else if bonus_slot == 1 {
                (run_data.bonus_2_level, run_data.selected_bonus_2)
            } else {
                (run_data.bonus_3_level, run_data.selected_bonus_3)
            };

            // Validate not already at max level (L3 = level 2 in 0-indexed)
            assert!(current_level < 2, "Bonus already at max level");

            // Level up the bonus
            let new_level = current_level + 1;
            if bonus_slot == 0 { run_data.bonus_1_level = new_level; }
            else if bonus_slot == 1 { run_data.bonus_2_level = new_level; }
            else { run_data.bonus_3_level = new_level; }

            // Clear the pending flag
            run_data.pending_level_up = false;

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);

            // Emit event (new_level is 1-indexed for display: 0->1, 1->2, 2->3)
            world.emit_event(@BonusLevelUp {
                game_id,
                player,
                bonus_slot,
                bonus_type,
                new_level: new_level + 1,
            });
        }

        fn get_starting_bonus_upgrade_cost(self: @ContractState, current_level: u8) -> u64 {
            get_starting_bonus_cost(current_level)
        }

        fn get_bag_upgrade_cost(self: @ContractState, current_level: u8) -> u64 {
            get_bag_upgrade_cost_impl(current_level)
        }

        fn get_bridging_upgrade_cost(self: @ContractState, current_rank: u8) -> u64 {
            get_bridging_upgrade_cost_impl(current_rank)
        }

        // ==========================================
        // In-Game Shop Functions
        // ==========================================
        
        fn purchase_consumable(ref self: ContractState, game_id: u64, consumable: ConsumableType, bonus_slot: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Get token_address from game_system via shared helper
            let token_address = token::get_token_address(world);
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

            // Reset shop state if this is a new shop level
            if run_data.last_shop_level != run_data.current_level {
                run_data.last_shop_level = run_data.current_level;
                run_data.shop_bonus_1_bought = false;
                run_data.shop_bonus_2_bought = false;
                run_data.shop_bonus_3_bought = false;
                run_data.shop_refills = 0;
            }

            // Get player meta
            let mut player_meta = dispatchers::get_or_create_player_meta(world, player);

            // Calculate cost based on consumable type
            let cost: u16 = match consumable {
                ConsumableType::Bonus1 => consumable.get_cost(),
                ConsumableType::Bonus2 => consumable.get_cost(),
                ConsumableType::Bonus3 => consumable.get_cost(),
                ConsumableType::Refill => ConsumableTrait::get_refill_cost(run_data.shop_refills),
                ConsumableType::LevelUp => consumable.get_cost(),
            };

            // Check player has enough cubes (brought + earned - spent)
            let total_budget: u32 = run_data.cubes_brought.into() + run_data.total_cubes.into();
            let spent: u32 = run_data.cubes_spent.into();
            let cubes_available: u32 = if total_budget >= spent { total_budget - spent } else { 0 };
            assert!(cubes_available >= cost.into(), "Insufficient cubes");

            // Spend the cubes
            let new_spent: u32 = spent + cost.into();
            assert!(new_spent <= 65535, "Cubes spent overflow");
            run_data.cubes_spent = new_spent.try_into().unwrap();

            // Apply consumable effect
            match consumable {
                ConsumableType::Bonus1 => {
                    // Check if already bought this shop (requires refill)
                    assert!(!run_data.shop_bonus_1_bought, "Already bought, need refill");
                    run_data.shop_bonus_1_bought = true;
                    // Add the selected bonus type to inventory
                    self.add_bonus_to_inventory(ref run_data, run_data.selected_bonus_1, @player_meta);
                },
                ConsumableType::Bonus2 => {
                    assert!(!run_data.shop_bonus_2_bought, "Already bought, need refill");
                    run_data.shop_bonus_2_bought = true;
                    self.add_bonus_to_inventory(ref run_data, run_data.selected_bonus_2, @player_meta);
                },
                ConsumableType::Bonus3 => {
                    assert!(!run_data.shop_bonus_3_bought, "Already bought, need refill");
                    run_data.shop_bonus_3_bought = true;
                    self.add_bonus_to_inventory(ref run_data, run_data.selected_bonus_3, @player_meta);
                },
                ConsumableType::Refill => {
                    // Refill allows buying again - reset bought flags
                    run_data.shop_bonus_1_bought = false;
                    run_data.shop_bonus_2_bought = false;
                    run_data.shop_bonus_3_bought = false;
                    run_data.shop_refills += 1;
                },
                ConsumableType::LevelUp => {
                    // Level up a bonus (paid option, 50 CUBE)
                    assert!(bonus_slot <= 2, "Invalid bonus slot");
                    
                    let current_level = if bonus_slot == 0 { run_data.bonus_1_level }
                        else if bonus_slot == 1 { run_data.bonus_2_level }
                        else { run_data.bonus_3_level };
                    
                    assert!(current_level < 2, "Bonus already at max level");
                    
                    let new_level = current_level + 1;
                    if bonus_slot == 0 { run_data.bonus_1_level = new_level; }
                    else if bonus_slot == 1 { run_data.bonus_2_level = new_level; }
                    else { run_data.bonus_3_level = new_level; }
                },
            }

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);

            // Emit event
            let cubes_remaining_u32: u32 = if total_budget >= new_spent {
                total_budget - new_spent
            } else {
                0
            };
            let cubes_remaining: u16 = if cubes_remaining_u32 > 65535 {
                65535_u16
            } else {
                cubes_remaining_u32.try_into().unwrap()
            };
            world
                .emit_event(
                    @ConsumablePurchased {
                        game_id,
                        player,
                        consumable,
                        cost,
                        cubes_remaining,
                    },
                );
        }
        
        fn get_shop_data(self: @ContractState, game_id: u64) -> (u16, u16, u16) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            
            // Available = brought + earned - spent
            let total_budget: u32 = run_data.cubes_brought.into() + run_data.total_cubes.into();
            let spent: u32 = run_data.cubes_spent.into();
            let available: u32 = if total_budget >= spent { total_budget - spent } else { 0 };
            let cubes_available: u16 = if available > 65535 {
                65535_u16
            } else {
                available.try_into().unwrap()
            };

            (run_data.cubes_brought, run_data.cubes_spent, cubes_available)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Add a bonus to inventory based on bonus type
        /// @param bonus_type: 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
        fn add_bonus_to_inventory(
            self: @ContractState,
            ref run_data: RunData,
            bonus_type: u8,
            player_meta: @PlayerMeta,
        ) {
            // Convert bonus type to bag index using helper
            let bag_idx: u8 = zkube::helpers::packing::RunDataHelpersTrait::bonus_type_to_bag_idx(bonus_type);
            let bag_size = player_meta.get_bag_size(bag_idx);

            // Use RunData helper to add bonus (has bag size check built in)
            let success = run_data.add_bonus(bonus_type, bag_size);
            if success {
                return;
            }

            // If add_bonus returned false, bag is full - panic with appropriate message
            if bonus_type == 1 { assert!(false, "Hammer bag is full"); }
            else if bonus_type == 2 { assert!(false, "Totem bag is full"); }
            else if bonus_type == 3 { assert!(false, "Wave bag is full"); }
            else if bonus_type == 4 { assert!(false, "Shrink bag is full"); }
            else { assert!(false, "Shuffle bag is full"); }
        }
    }
}
