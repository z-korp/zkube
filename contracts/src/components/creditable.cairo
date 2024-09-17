// Starknet imports
use starknet::ContractAddress;


// Component
#[starknet::component]
mod CreditableComponent {
    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_block_timestamp};

    // Dojo imports

    use dojo::world::IWorldDispatcher;

    // Internal imports

    use zkube::constants;
    use zkube::store::{Store, StoreImpl};
    use zkube::models::credits::{Credits, CreditsTrait, CreditsAssert};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};

    #[storage]
    struct Storage {}

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn _initialize(ref self: ComponentState<TContractState>,) {}

        fn _use_credit(
            ref self: ComponentState<TContractState>,
            world: IWorldDispatcher,
            caller: ContractAddress
        ) {
            // [Setup] Datastore
            let store: Store = StoreImpl::new(world);
            let player = store.player(caller.into());
            player.assert_exists();

            let mut credits = store.credits(caller.into());
            let time = get_block_timestamp();
            credits.assert_has_credits(time);
            credits.use_credit(time);

            store.set_credits(credits);
        }

        fn _has_credits(
            self: @ComponentState<TContractState>, world: IWorldDispatcher, caller: ContractAddress
        ) -> bool {
            // [Setup] Datastore
            let store: Store = StoreImpl::new(world);
            let player = store.player(caller.into());
            player.assert_exists();

            let credits = store.credits(caller.into());
            let time = get_block_timestamp();
            credits.has_credits(time)
        }
    }
}
