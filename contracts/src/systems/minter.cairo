// Starknet imports
use starknet::ContractAddress;

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
    fn mint(ref world: IWorldDispatcher, number: u32);
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
    use super::{IZKubeCreditsMintableDispatcher, IZKubeCreditsMintableDispatcherTrait};
    use super::{IMinter, Store, StoreTrait};
    use zkube::models::chest::{ChestTrait, ChestAssert};

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
    impl ChestSystemImpl of IChest<ContractState> {
        fn mint(ref world: IWorldDispatcher, number: u32) {
            let caller = get_caller_address();

            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.get_mint(caller.into());

            mint.mint(number);

            let erc721 = IZKubeCreditsMintableDispatcher {
                contract_address: settings.erc721_address
            };
            erc721.public_mint_from(caller.into(), caller.into());
        }

        fn claim_free_mint(ref world: IWorldDispatcher) {
            let caller = get_caller_address();

            let store = StoreTrait::new(world);
            let settings = store.settings();
            let mut mint = store.get_mint(caller.into());
            mint.assert_has_mint();
            mint.mint(mint.number);

            // [Effect] Mint
            let erc721 = IZKubeCreditsMintableDispatcher {
                contract_address: settings.erc721_address
            };
            erc721.minter_mint(caller.into());

            // [Effect] Reset mint
            store.set_mint(mint);
        }

        fn add_free_mint(ref world: IWorldDispatcher, to: ContractAddress, number: u32) {
            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Update] Mint
            let mut mint = store.get_mint(to.into());
            mint.number += number;
            store.set_mint(mint);
        }
    }
}
