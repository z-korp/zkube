use zkube::types::consumable::ConsumableType;

#[starknet::interface]
pub trait IShopSystem<T> {
    /// Level up a bonus after boss clear (called after completing level 10, 20, 30, 40)
    /// @param game_id: The game ID
    /// @param bonus_slot: 0, 1, or 2 (which of the 3 selected bonuses to level up)
    fn level_up_bonus(ref self: T, game_id: u64, bonus_slot: u8);

    // ==========================================
    // In-Game Shop (spend cubes from run budget)
    // ==========================================

    /// Purchase a consumable from the in-game shop using brought cubes
    /// Only available after completing levels 9, 19, 29, 39, 49.
    /// @param game_id: The game ID
    /// @param consumable: The consumable type to purchase
    /// @param bonus_slot: Required for LevelUp (0, 1, or 2), ignored for other consumables
    fn purchase_consumable(ref self: T, game_id: u64, consumable: ConsumableType, bonus_slot: u8);

    /// Allocate an unallocated charge to a specific bonus slot (0, 1, or 2)
    /// No cube cost — the charge was already paid for via purchase_consumable(BonusCharge)
    fn allocate_charge(ref self: T, game_id: u64, bonus_slot: u8);

    /// Swap one of the 3 selected bonuses for an unselected one
    /// Cost: 50 CUBE. Limit: 1 per shop visit.
    /// Old bonus charges are LOST. New bonus starts at Level 1 (level 0).
    /// @param game_id: The game ID
    /// @param bonus_slot: Which slot to replace (0, 1, or 2)
    /// @param new_bonus_type: The new bonus type (1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply)
    fn swap_bonus(ref self: T, game_id: u64, bonus_slot: u8, new_bonus_type: u8);

    /// View: Get in-game shop data for UI
    /// Returns: (cubes_brought, cubes_spent, cubes_available)
    fn get_shop_data(self: @T, game_id: u64) -> (u16, u16, u16);
}

#[dojo::contract]
mod shop_system {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use game_components_minigame::libs::{assert_token_ownership, post_action, pre_action};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;
    use starknet::{get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{BonusLevelUp, ConsumablePurchased};
    use zkube::helpers::packing::{RunData, RunDataHelpersTrait};
    use zkube::helpers::token;
    use zkube::models::game::{Game, GameAssert, GameTrait};
    use zkube::types::consumable::{ConsumableTrait, ConsumableType, LEVEL_UP_COST, SWAP_BONUS_COST};

    #[abi(embed_v0)]
    impl ShopSystemImpl of super::IShopSystem<ContractState> {
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
            assert!(run_data.boss_level_up_pending, "No level-up pending");

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
            if bonus_slot == 0 {
                run_data.bonus_1_level = new_level;
            } else if bonus_slot == 1 {
                run_data.bonus_2_level = new_level;
            } else {
                run_data.bonus_3_level = new_level;
            }

            // Clear the pending flag
            run_data.boss_level_up_pending = false;

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);

            // Emit event (new_level is 1-indexed for display: 0->1, 1->2, 2->3)
            world
                .emit_event(
                    @BonusLevelUp {
                        game_id, player, bonus_slot, bonus_type, new_level: new_level + 1,
                    },
                );
        }

        // ==========================================
        // In-Game Shop Functions
        // ==========================================

        fn purchase_consumable(
            ref self: ContractState, game_id: u64, consumable: ConsumableType, bonus_slot: u8,
        ) {
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

            // In-game shop is only available before boss levels (after completing levels 9, 19, 29,
            // 39, 49).
            // When current_level is 10, 20, 30, 40, 50, the player just completed the 9th zone
            // level.
            assert!(run_data.current_level > 1, "Shop not available");
            assert!((run_data.current_level - 1) % 10 == 9, "Shop not available");

            // Reset shop state if this is a new shop visit.
            // last_shop_level stores current_level / 10 (0-5).
            let shop_index = run_data.current_level / 10;
            if run_data.last_shop_level != shop_index {
                run_data.last_shop_level = shop_index;
                run_data.shop_purchases = 0;
                run_data.shop_level_up_bought = false;
                run_data.shop_swap_bought = false;
            }

            let cost: u16 = match consumable {
                ConsumableType::BonusCharge => {
                    let bonus_charge_cost = ConsumableTrait::get_bonus_charge_cost(
                        run_data.shop_purchases,
                    );
                    run_data.spend_cubes(bonus_charge_cost);
                    run_data.shop_purchases += 1;
                    run_data.unallocated_charges += 1;
                    bonus_charge_cost
                },
                ConsumableType::LevelUp => {
                    assert!(!run_data.shop_level_up_bought, "Already bought LevelUp this shop");
                    assert!(bonus_slot <= 2, "Invalid bonus slot");

                    let current_level = if bonus_slot == 0 {
                        run_data.bonus_1_level
                    } else if bonus_slot == 1 {
                        run_data.bonus_2_level
                    } else {
                        run_data.bonus_3_level
                    };
                    assert!(current_level < 2, "Already at max level");

                    run_data.spend_cubes(LEVEL_UP_COST);
                    run_data.shop_level_up_bought = true;

                    let new_level = current_level + 1;
                    if bonus_slot == 0 {
                        run_data.bonus_1_level = new_level;
                    } else if bonus_slot == 1 {
                        run_data.bonus_2_level = new_level;
                    } else {
                        run_data.bonus_3_level = new_level;
                    }

                    LEVEL_UP_COST
                },
                ConsumableType::SwapBonus => { panic!("Use swap_bonus() entrypoint for swaps"); },
            };

            let cubes_remaining = run_data.get_available_cubes();

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);

            // Emit event
            world
                .emit_event(
                    @ConsumablePurchased { game_id, player, consumable, cost, cubes_remaining },
                );
        }

        fn allocate_charge(ref self: ContractState, game_id: u64, bonus_slot: u8) {
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
            assert!(run_data.unallocated_charges > 0, "No unallocated charges");
            assert!(bonus_slot <= 2, "Invalid bonus slot");

            let bonus_type = if bonus_slot == 0 {
                run_data.selected_bonus_1
            } else if bonus_slot == 1 {
                run_data.selected_bonus_2
            } else {
                run_data.selected_bonus_3
            };

            self.add_bonus_to_inventory(ref run_data, bonus_type);
            run_data.unallocated_charges -= 1;

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);
        }

        fn swap_bonus(ref self: ContractState, game_id: u64, bonus_slot: u8, new_bonus_type: u8) {
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

            assert!(bonus_slot <= 2, "Invalid bonus slot");
            assert!(new_bonus_type >= 1 && new_bonus_type <= 5, "Invalid bonus type");

            // In-game shop is only available before boss levels (after completing levels 9, 19, 29,
            // 39, 49).
            // When current_level is 10, 20, 30, 40, 50, the player just completed the 9th zone
            // level.
            assert!(run_data.current_level > 1, "Shop not available");
            assert!((run_data.current_level - 1) % 10 == 9, "Shop not available");

            // Reset shop state if this is a new shop visit.
            // last_shop_level stores current_level / 10 (0-5).
            let shop_index = run_data.current_level / 10;
            if run_data.last_shop_level != shop_index {
                run_data.last_shop_level = shop_index;
                run_data.shop_purchases = 0;
                run_data.shop_level_up_bought = false;
                run_data.shop_swap_bought = false;
            }

            assert!(!run_data.shop_swap_bought, "Already bought swap this shop");

            // The new bonus must not already be selected.
            assert!(new_bonus_type != run_data.selected_bonus_1, "Already selected");
            assert!(new_bonus_type != run_data.selected_bonus_2, "Already selected");
            assert!(new_bonus_type != run_data.selected_bonus_3, "Already selected");

            run_data.spend_cubes(SWAP_BONUS_COST);
            run_data.shop_swap_bought = true;

            let old_bonus_type = if bonus_slot == 0 {
                run_data.selected_bonus_1
            } else if bonus_slot == 1 {
                run_data.selected_bonus_2
            } else {
                run_data.selected_bonus_3
            };

            // Old bonus charges are lost.
            if old_bonus_type == 1 {
                run_data.combo_count = 0;
            } else if old_bonus_type == 2 {
                run_data.score_count = 0;
            } else if old_bonus_type == 3 {
                run_data.harvest_count = 0;
            } else if old_bonus_type == 4 {
                run_data.wave_count = 0;
            } else if old_bonus_type == 5 {
                run_data.supply_count = 0;
            }

            // Replace selected bonus and reset its level to L1 (level 0).
            if bonus_slot == 0 {
                run_data.selected_bonus_1 = new_bonus_type;
                run_data.bonus_1_level = 0;
            } else if bonus_slot == 1 {
                run_data.selected_bonus_2 = new_bonus_type;
                run_data.bonus_2_level = 0;
            } else {
                run_data.selected_bonus_3 = new_bonus_type;
                run_data.bonus_3_level = 0;
            }

            let cubes_remaining = run_data.get_available_cubes();

            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, game_id);

            world
                .emit_event(
                    @ConsumablePurchased {
                        game_id,
                        player,
                        consumable: ConsumableType::SwapBonus,
                        cost: SWAP_BONUS_COST,
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
            let available: u32 = if total_budget >= spent {
                total_budget - spent
            } else {
                0
            };
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
        /// @param bonus_type: 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
        fn add_bonus_to_inventory(self: @ContractState, ref run_data: RunData, bonus_type: u8) {
            let _ = self;
            let bag_size: u8 = 3;

            // Use RunData helper to add bonus (has bag size check built in)
            let success = run_data.add_bonus(bonus_type, bag_size);
            if success {
                return;
            }

            // If add_bonus returned false, bag is full - panic with appropriate message
            if bonus_type == 1 {
                assert!(false, "Combo bag is full");
            } else if bonus_type == 2 {
                assert!(false, "Score bag is full");
            } else if bonus_type == 3 {
                assert!(false, "Harvest bag is full");
            } else if bonus_type == 4 {
                assert!(false, "Wave bag is full");
            } else {
                assert!(false, "Supply bag is full");
            }
        }
    }
}
