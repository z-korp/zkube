// Starknet imports
use starknet::{ContractAddress, Felt252TryIntoContractAddress};

// Dojo imports
use dojo::world::IWorldDispatcher;

// Internal imports
use zkube::store::{Store, StoreTrait};

// Interfaces

#[starknet::interface]
pub trait IZKubeCreditsMintable<TContractState> {
    fn minter_mint(ref self: TContractState, recipient: ContractAddress);
    fn public_mint_from(
        ref self: TContractState, recipient: ContractAddress, caller: ContractAddress
    );
}

#[dojo::interface]
trait IMinter<TContractState> {
    fn mint(ref world: IWorldDispatcher);
    fn claim_free_mint(ref world: IWorldDispatcher);
    fn add_free_mint(ref world: IWorldDispatcher, to: ContractAddress, number: u32);
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
    use super::{IMinter, Store, StoreTrait};
    use zkube::interfaces::ierc721_game_credits::{
        ierc721_game_credits, IERC721GameCreditsDispatcherTrait
    };
    use zkube::models::mint::{MintTrait, MintAssert};
    use zkube::models::admin::{AdminTrait, AdminAssert};

    // Components
    component!(path: PayableComponent, storage: payable, event: PayableEvent);
    impl PayableInternalImpl = PayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        payable: PayableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        PayableEvent: PayableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher) {}

    // Implementations

    #[abi(embed_v0)]
    impl MinterSystemImpl of IMinter<ContractState> {
        fn mint(ref world: IWorldDispatcher) {
            let caller = get_caller_address();

            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.mint(caller.into());

            mint.mint();

            let erc721 = ierc721_game_credits(settings.erc721_address.try_into().unwrap());
            erc721.public_mint_from(caller.into(), caller.into());
        }

        fn claim_free_mint(ref world: IWorldDispatcher) {
            let caller = get_caller_address();

            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.mint(caller.into());
            mint.assert_has_mint();
            mint.mint();

            // [Effect] Mint
            let erc721 = ierc721_game_credits(settings.erc721_address.try_into().unwrap());
            erc721.minter_mint(caller.into());

            // [Effect] Reset mint
            store.set_mint(mint);
        }

        fn add_free_mint(ref world: IWorldDispatcher, to: ContractAddress, number: u32) {
            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let store = StoreTrait::new(world);
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Update] Mint
            let mut mint = store.mint(to.into());
            mint.number += number;
            store.set_mint(mint);
        }
    }
}
