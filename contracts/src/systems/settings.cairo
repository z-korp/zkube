// Starknet imports

use starknet::info::{get_caller_address};

// Dojo imports

use dojo::world::IWorldDispatcher;

// Internal imports

use zkube::models::settings::Settings;

#[dojo::interface]
trait ISettings<TContractState> {
    fn update_free_daily_credits(ref world: IWorldDispatcher, value: u8);
    fn update_daily_mode_price(ref world: IWorldDispatcher, value: felt252);
    fn update_normal_mode_price(ref world: IWorldDispatcher, value: felt252);
    fn set_admin(ref world: IWorldDispatcher, address: felt252);
    fn delete_admin(ref world: IWorldDispatcher, address: felt252);
}

#[dojo::contract]
mod settings {
    // Component imports

    // Local imports
    use super::{ISettings, Settings, get_caller_address};
    use zkube::store::{Store, StoreTrait};
    use zkube::models::settings::SettingsTrait;
    use zkube::models::admin::{AdminTrait, AdminAssert};

    // Components

    // Storage
    #[storage]
    struct Storage {}

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    // Constructor
    fn dojo_init(ref world: IWorldDispatcher) {
        // [Effect] Create the settings entity
        let store: Store = StoreTrait::new(world);
        let settings: Settings = SettingsTrait::new();
        store.set_settings(settings);
    }

    // Implementations
    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn update_free_daily_credits(ref world: IWorldDispatcher, value: u8) {
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Update free daily credits
            let mut settings = store.settings();
            settings.set_free_daily_credits(value);
            store.set_settings(settings);
        }

        fn update_daily_mode_price(ref world: IWorldDispatcher, value: felt252) {
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Update daily mode price
            let mut settings = store.settings();
            settings.set_daily_mode_price(value);
            store.set_settings(settings);
        }

        fn update_normal_mode_price(ref world: IWorldDispatcher, value: felt252) {
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Update normal mode price
            let mut settings = store.settings();
            settings.set_normal_mode_price(value);
            store.set_settings(settings);
        }

        fn set_admin(ref world: IWorldDispatcher, address: felt252) {
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can set another admin
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Create and set admin
            let admin = store.admin(address);
            admin.assert_not_exists();

            // [Effect] Create and set admin
            let admin = AdminTrait::new(address);
            store.set_admin(admin);
        }

        fn delete_admin(ref world: IWorldDispatcher, address: felt252) {
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Remove admin
            store.delete_admin(address);
        }
    }
}
