//! Manageable component

#[starknet::component]
mod ManageableComponent {
    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::WorldStorage;

    // Internal imports

    use zkube::store::{Store, StoreTrait};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};

    // Storage

    #[storage]
    struct Storage {}

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn _create(self: @ComponentState<TContractState>, mut world: WorldStorage, name: felt252,) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Player not already exists
            let caller = get_caller_address();
            let timestamp = get_block_timestamp();
            let player = store.player(caller.into());
            player.assert_not_exists();

            // [Effect] Create a new player
            let player = PlayerTrait::new(caller.into(), name, timestamp);
            store.set_player(player);
        }

        fn _rename(self: @ComponentState<TContractState>, mut world: WorldStorage, name: felt252,) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Effect] Create a new player
            player.rename(name);
            store.set_player(player);
        }
    }
}
