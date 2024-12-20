// Starknet imports
use starknet::info::{get_caller_address};
use starknet::ContractAddress;

// Dojo imports
use dojo::world::WorldStorage;

// Internal imports
use zkube::models::settings::Settings;

#[starknet::interface]
trait ISettings<T> {
    fn update_zkorp_address(ref self: T, address: ContractAddress);
    fn update_erc721_address(ref self: T, address: ContractAddress);
    fn set_admin(ref self: T, address: ContractAddress);
    fn delete_admin(ref self: T, address: ContractAddress);
    fn update_are_game_paused(ref self: T, value: bool);
    fn update_are_chests_unlock(ref self: T, value: bool);
}

#[dojo::contract]
mod settings {
    // Component imports

    use arcade_trophy::components::achievable::AchievableComponent;

    // Internal imports

    use zkube::store::{Store, StoreTrait};
    use zkube::models::settings::SettingsTrait;
    use zkube::models::admin::{AdminTrait, AdminAssert};
    use zkube::types::trophy::{Trophy, TrophyTrait, TROPHY_COUNT};

    // Local imports

    use super::{ISettings, Settings, get_caller_address, ContractAddress, WorldStorage};

    // Components

    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    impl AchievableInternalImpl = AchievableComponent::InternalImpl<ContractState>;

    // Storage
    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    // Constructor
    fn dojo_init(
        ref self: ContractState, admin_address: ContractAddress, zkorp_address: ContractAddress,
    ) {
        // [Effect] Create the settings entity
        let mut world = self.world_default();
        let store: Store = StoreTrait::new(world);
        let settings: Settings = SettingsTrait::new(zkorp_address);
        store.set_settings(settings);

        // [Effect] Create the admin entity
        let caller = get_caller_address();
        let admin = AdminTrait::new(caller.into());
        store.set_admin(admin);

        // [Effect] Set admin if provided
        let admin_address_felt: felt252 = admin_address.into();
        if admin_address_felt != 0 {
            let admin = AdminTrait::new(admin_address_felt);
            store.set_admin(admin);
        }

        // [Event] Emit all Trophy events
        let mut trophy_id: u8 = TROPHY_COUNT;
        while trophy_id > 0 {
            let trophy: Trophy = trophy_id.into();
            self
                .achievable
                .create(
                    world,
                    id: trophy.identifier(),
                    hidden: trophy.hidden(),
                    index: trophy.index(),
                    points: trophy.points(),
                    start: trophy.start(),
                    end: trophy.end(),
                    group: trophy.group(),
                    icon: trophy.icon(),
                    title: trophy.title(),
                    description: trophy.description(),
                    tasks: trophy.tasks(),
                    data: trophy.data(),
                );
            trophy_id -= 1;
        }
    }

    // Implementations
    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn update_zkorp_address(ref self: ContractState, address: ContractAddress) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Update zkorp address
            let mut settings = store.settings();
            settings.set_zkorp_address(address.into());
            store.set_settings(settings);
        }

        fn update_erc721_address(ref self: ContractState, address: ContractAddress) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Update zkorp address
            let mut settings = store.settings();
            settings.set_erc721_address(address.into());
            store.set_settings(settings);
        }

        fn set_admin(ref self: ContractState, address: ContractAddress) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can set another admin
            let caller = get_caller_address();
            let admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Create and set admin
            let admin = store.admin(address);
            admin.assert_not_exists();

            // [Effect] Create and set admin
            let admin = AdminTrait::new(address.into());
            store.set_admin(admin);
        }

        fn delete_admin(ref self: ContractState, address: ContractAddress) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_exists();

            // [Effect] Remove admin
            store.delete_admin(address);
        }

        fn update_are_game_paused(ref self: ContractState, value: bool) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Update zkorp address
            let mut settings = store.settings();
            settings.set_are_games_paused(value);
            store.set_settings(settings);
        }

        fn update_are_chests_unlock(ref self: ContractState, value: bool) {
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Only admin can update settings
            let caller = get_caller_address();
            let mut admin = store.admin(caller.into());
            admin.assert_is_admin();

            // [Effect] Update zkorp address
            let mut settings = store.settings();
            settings.set_are_chests_unlock(value);
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
