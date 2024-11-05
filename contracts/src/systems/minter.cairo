// Starknet imports
use starknet::{ContractAddress, Felt252TryIntoContractAddress};

// Dojo imports
use dojo::world::WorldStorage;

#[dojo::interface]
trait IMinter<TContractState> {
    fn mint(ref self: ContractState);
    fn claim_free_mint(ref self: ContractState);
    fn add_free_mint(
        ref self: ContractState, to: ContractAddress, number: u32, expiration_timestamp: u64
    );
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
    //use zkube::interfaces::ierc721_game_credits::{
    //    ierc721_game_credits, IERC721GameCreditsDispatcherTrait
    //};
    use zkube::models::mint::{MintTrait, MintAssert};
    use zkube::models::admin::{AdminTrait, AdminAssert};

    // Implementations

    #[abi(embed_v0)]
    impl MinterSystemImpl of IMinter<ContractState> {
        /// Mint an ERC721 token as game credits
        fn mint(ref self: ContractState) {
            let caller = get_caller_address();

            let mut world = world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();
        //let erc721 = ierc721_game_credits(settings.erc721_address.try_into().unwrap());
        //erc721.public_mint_from(caller.into(), caller.into());
        }

        /// Claim free mint that an admin has added to a user
        fn claim_free_mint(ref self: ContractState) {
            let caller = get_caller_address();

            let mut world = world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.mint(caller.into());

            let current_timestamp = get_block_timestamp();
            let mut i = 0;
            loop {
                // [Effect] Mint
                mint.mint(current_timestamp);

                // [Effect] Mint
                //let erc721 = ierc721_game_credits(settings.erc721_address.try_into().unwrap());
                //erc721.minter_mint(caller.into());

                i += 1;
                if (i >= mint.number - 1) {
                    break;
                }
            };

            // [Effect] Reset mint
            store.set_mint(mint);
        }

        /// Add free mint to a user
        /// Only admin can free mint
        fn add_free_mint(
            ref self: ContractState, to: ContractAddress, number: u32, expiration_timestamp: u64
        ) {
            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut world = world_default();
            let store = StoreTrait::new(world);
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Update] Mint
            let mut mint = store.mint(to.into());
            mint.add_mint(number, expiration_timestamp, get_block_timestamp());
            store.set_mint(mint);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"zkube")
        }
    }
}
