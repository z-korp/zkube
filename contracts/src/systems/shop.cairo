#[starknet::interface]
trait IShopSystem<T> {
    /// Upgrade starting bonus for a specific type (0=Hammer, 1=Wave, 2=Totem)
    /// Costs: Level 1 = 50, Level 2 = 200, Level 3 = 500
    fn upgrade_starting_bonus(ref self: T, bonus_type: u8);

    /// Upgrade bag size for a specific bonus type
    /// Cost = 10 * 2^(current_level) cubes
    fn upgrade_bag_size(ref self: T, bonus_type: u8);

    /// Upgrade cube bridging rank
    /// Cost = 100 * 2^(current_rank) cubes
    fn upgrade_bridging_rank(ref self: T);

    /// View: Get cost for next starting bonus upgrade
    fn get_starting_bonus_upgrade_cost(self: @T, current_level: u8) -> u64;

    /// View: Get cost for next bag size upgrade
    fn get_bag_upgrade_cost(self: @T, current_level: u8) -> u64;

    /// View: Get cost for next bridging rank upgrade
    fn get_bridging_upgrade_cost(self: @T, current_rank: u8) -> u64;
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
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::helpers::packing::{MetaData, MetaDataPackingTrait};
    use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
    use super::{get_starting_bonus_cost, get_bag_upgrade_cost_impl, get_bridging_upgrade_cost_impl};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_caller_address, ContractAddress};

    // Max levels
    const MAX_STARTING_BONUS: u8 = 3;
    const MAX_BAG_LEVEL: u8 = 15; // 4 bits max
    const MAX_BRIDGING_RANK: u8 = 15; // 4 bits max

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
                _ => {
                    panic!("Invalid bonus type");
                    0
                },
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
                _ => {
                    panic!("Invalid bonus type");
                    0
                },
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
    }
}
