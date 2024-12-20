// Starknet imports
use starknet::{ContractAddress, Felt252TryIntoContractAddress};

// Dojo imports
use dojo::world::WorldStorage;

#[starknet::interface]
trait IMinter<T> {
    fn claim_free_mint(ref self: T);
    fn add_free_mint(ref self: T, to: ContractAddress, number: u32, expiration_timestamp: u32);
    fn update_game_price(ref self: T, price: u256);
}

#[dojo::contract]
mod minter {
    // Starknet imports

    use starknet::{ContractAddress, ClassHash};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports
    use zkube::components::payable::PayableComponent;

    // Local imports
    use zkube::store::{Store, StoreTrait};
    use super::{IMinter, WorldStorage};
    use zkube::interfaces::ierc721_game_credits::{
        ierc721_game_credits, IERC721GameCreditsDispatcherTrait
    };
    use zkube::models::mint::{MintTrait, MintAssert};
    use zkube::models::admin::{AdminTrait, AdminAssert};
    use zkube::models::settings::SettingsTrait;

    // Implementations

    #[abi(embed_v0)]
    impl MinterSystemImpl of IMinter<ContractState> {
        /// Claim free mint that an admin has added to a user
        fn claim_free_mint(ref self: ContractState) {
            let caller = get_caller_address();

            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.mint(caller.into());

            let current_timestamp: u32 = get_block_timestamp().try_into().unwrap();
            let total_mints = mint.number;
            let mut i = 0;
            loop {
                // [Effect] Mint
                mint.mint(current_timestamp);

                // [Effect] Mint
                let erc721 = ierc721_game_credits(settings.erc721_address.try_into().unwrap());
                erc721.minter_mint(caller.into());

                i += 1;
                if (i >= total_mints) {
                    break;
                }
            };

            // [Effect] Reset mint
            store.set_mint(mint);
        }

        /// Add free mint to a user
        /// Only admin can free mint
        fn add_free_mint(
            ref self: ContractState, to: ContractAddress, number: u32, expiration_timestamp: u32
        ) {
            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Update] Mint
            let mut mint = store.mint(to.into());
            let current_timestamp: u32 = get_block_timestamp().try_into().unwrap();
            mint.add_mint(number, expiration_timestamp, current_timestamp);
            store.set_mint(mint);
        }

        /// Update the game price in the ERC721 contract and settings
        fn update_game_price(ref self: ContractState, price: u256) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Update game price
            let mut settings = store.settings();
            settings.set_game_price(price);
            let erc721_address: ContractAddress = settings.erc721_address.try_into().unwrap();
            let erc721 = ierc721_game_credits(erc721_address);
            // only settings_system can update the mint price
            erc721.update_mint_price(price);

            store.set_settings(settings);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(crate::default_namespace())
        }
    }
}
