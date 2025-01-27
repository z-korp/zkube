//! Manageable component

#[starknet::component]
mod ManageableComponent {
    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    // Internal imports

    use zkube::store::{Store, StoreTrait};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};
    use zkube::models::player_info::{PlayerInfo, PlayerInfoTrait, PlayerInfoAssert};

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
            let player_info = store.player_info(caller.into());
            player_info.assert_not_exists();

            // [Effect] Create a new player
            let player_id: u32 = world.dispatcher.uuid() + 1;
            let player_info = PlayerInfoTrait::new(caller.into(), player_id, name);
            // player_info store matching between player_id and address
            // and the name of the player because it's a felt252
            // and we want to avoid felt252 in other models
            // will used the player_id key (u32) to get the player and store player date
            // in other models such as Game or Tournament
            store.set_player_info(player_info);

            let player = PlayerTrait::new(player_id, get_block_timestamp());
            // player store the player data such as points, streaks, etc.
            // only light data (u32, u8, etc.)
            store.set_player(player);
        }

        fn _rename(self: @ComponentState<TContractState>, mut world: WorldStorage, name: felt252,) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player_info = store.player_info(caller.into());
            player_info.assert_exists();

            // [Effect] Rename the player
            player_info.rename(name);
            store.set_player_info(player_info);
        }
    }
}
