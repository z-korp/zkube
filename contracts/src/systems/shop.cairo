use zkube::types::consumable::ConsumableType;

#[starknet::interface]
pub trait IShopSystem<T> {
    // ==========================================
    // Permanent Upgrades (burn cubes from wallet)
    // ==========================================
    
    /// Upgrade starting bonus for a specific type (0=Hammer, 1=Wave, 2=Totem)
    /// Costs: Level 1 = 50, Level 2 = 200, Level 3 = 500
    fn upgrade_starting_bonus(ref self: T, bonus_type: u8);

    /// Upgrade bag size for a specific bonus type (0=Hammer, 1=Wave, 2=Totem)
    /// Costs: Level 1 = 10, Level 2 = 20, Level 3 = 40
    fn upgrade_bag_size(ref self: T, bonus_type: u8);

    /// Upgrade cube bridging rank (max 3 levels)
    /// Costs: Rank 1 = 100, Rank 2 = 200, Rank 3 = 400
    fn upgrade_bridging_rank(ref self: T);

    // ==========================================
    // In-Game Shop (spend cubes from run budget)
    // ==========================================
    
    /// Purchase a consumable from the in-game shop using brought cubes
    /// Only available after completing levels 5, 10, 15, 20, etc.
    fn purchase_consumable(ref self: T, game_id: u64, consumable: ConsumableType);

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

/// Helper: compute 2^n as u64
fn pow2_u64(n: u8) -> u64 {
    let mut result: u64 = 1;
    let mut i: u8 = 0;
    loop {
        if i >= n {
            break result;
        }
        result = result * 2;
        i += 1;
    }
}

/// Get cost for starting bonus upgrade
/// Level 0 -> 1 = 50, Level 1 -> 2 = 200, Level 2 -> 3 = 500
fn get_starting_bonus_cost(current_level: u8) -> u64 {
    match current_level {
        0 => 50,
        1 => 200,
        2 => 500,
        _ => 0, // Already maxed
    }
}

/// Get cost for bag size upgrade: 10 * 2^level
fn get_bag_upgrade_cost_impl(current_level: u8) -> u64 {
    // 10 * 2^level: 10, 20, 40, 80, 160, 320...
    10_u64 * pow2_u64(current_level)
}

/// Get cost for bridging rank upgrade: 100 * 2^rank
fn get_bridging_upgrade_cost_impl(current_rank: u8) -> u64 {
    // 100 * 2^rank: 100, 200, 400, 800, 1600...
    100_u64 * pow2_u64(current_rank)
}

#[dojo::contract]
mod shop_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert, GameSeed};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::types::consumable::{ConsumableType, ConsumableTrait, EXTRA_MOVES_AMOUNT};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::level::{LevelGenerator, LevelGeneratorTrait};
    use zkube::events::ConsumablePurchased;

    use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
    use super::{get_starting_bonus_cost, get_bag_upgrade_cost_impl, get_bridging_upgrade_cost_impl};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_caller_address, get_block_timestamp, ContractAddress};

    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
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
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }

            let mut meta = player_meta.get_meta_data();

            // Get current level for this bonus type
            let current_level = match bonus_type {
                0 => meta.starting_hammer,
                1 => meta.starting_wave,
                2 => meta.starting_totem,
                _ => panic!("Invalid bonus type"),
            };

            assert!(current_level < MAX_STARTING_BONUS, "Already at max starting bonus level");

            // Get cost for next level
            let cost = get_starting_bonus_cost(current_level);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let cube_token = self.get_cube_token_dispatcher();
            cube_token.burn(player, cost.into());

            // Upgrade the bonus
            match bonus_type {
                0 => meta.starting_hammer = current_level + 1,
                1 => meta.starting_wave = current_level + 1,
                2 => meta.starting_totem = current_level + 1,
                _ => {},
            }

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
        }

        fn upgrade_bag_size(ref self: ContractState, bonus_type: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Read player meta
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }

            let mut meta = player_meta.get_meta_data();

            // Get current level for this bonus type
            let current_level = match bonus_type {
                0 => meta.bag_hammer_level,
                1 => meta.bag_wave_level,
                2 => meta.bag_totem_level,
                _ => panic!("Invalid bonus type"),
            };

            assert!(current_level < MAX_BAG_LEVEL, "Already at max bag level");

            // Cost = 10 * 2^level
            let cost = get_bag_upgrade_cost_impl(current_level);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let cube_token = self.get_cube_token_dispatcher();
            cube_token.burn(player, cost.into());

            // Upgrade the bag
            match bonus_type {
                0 => meta.bag_hammer_level = current_level + 1,
                1 => meta.bag_wave_level = current_level + 1,
                2 => meta.bag_totem_level = current_level + 1,
                _ => {},
            }

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
        }

        fn upgrade_bridging_rank(ref self: ContractState) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            // Read player meta
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }

            let mut meta = player_meta.get_meta_data();
            let current_rank = meta.bridging_rank;

            assert!(current_rank < MAX_BRIDGING_RANK, "Already at max bridging rank");

            // Cost = 100 * 2^rank
            let cost = get_bridging_upgrade_cost_impl(current_rank);

            // Burn cubes from ERC1155 wallet (will revert if insufficient)
            let cube_token = self.get_cube_token_dispatcher();
            cube_token.burn(player, cost.into());

            // Upgrade the rank
            meta.bridging_rank = current_rank + 1;

            player_meta.set_meta_data(meta);
            world.write_model(@player_meta);
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
        
        fn purchase_consumable(ref self: ContractState, game_id: u64, consumable: ConsumableType) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Get token_address from game_system via IMinigame interface
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

            // Get cost of consumable from settings
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let cost = consumable.get_cost_from_settings(settings);

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
            match consumable {
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
                    // We cap the effective max to 255 to avoid exceeding the u8 move counter.
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
                    let mut new_extra: u16 = current_extra + EXTRA_MOVES_AMOUNT.into();
                    if new_extra > max_extra {
                        new_extra = max_extra;
                    }
                    assert!(new_extra > current_extra, "Move limit already maxed");
                    run_data.extra_moves = new_extra.try_into().unwrap();
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
        /// Get the CubeToken contract dispatcher via world DNS
        fn get_cube_token_dispatcher(self: @ContractState) -> ICubeTokenDispatcher {
            let world = self.world(@DEFAULT_NS());
            let cube_token_address = world.dns_address(@"cube_token")
                .expect('CubeToken not found in DNS');
            ICubeTokenDispatcher { contract_address: cube_token_address }
        }
        
        /// Get the token address from game_system via IMinigame interface
        fn get_token_address(self: @ContractState) -> ContractAddress {
            let world = self.world(@DEFAULT_NS());
            let game_system_address = world.dns_address(@"game_system")
                .expect('game_system not found in DNS');
            
            // Call game_system's token_address() via IMinigame interface
            let game_system = IMinigameDispatcher { contract_address: game_system_address };
            game_system.token_address()
        }
    }
}
