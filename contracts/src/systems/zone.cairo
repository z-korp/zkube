use zkube::models::zone::ZoneConfig;

#[starknet::interface]
pub trait IZoneSystem<T> {
    fn register_zone(
        ref self: T,
        zone_id: u8,
        settings_id: u32,
        theme_id: u8,
        name: felt252,
        mutator_count: u8,
    );
    fn get_zone(self: @T, zone_id: u8) -> ZoneConfig;
    fn set_zone_enabled(ref self: T, zone_id: u8, enabled: bool);
}

#[dojo::contract]
mod zone_system {
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use zkube::constants::DEFAULT_NS;
    use zkube::models::zone::ZoneConfig;
    use super::IZoneSystem;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl ZoneSystemImpl of IZoneSystem<ContractState> {
        fn register_zone(
            ref self: ContractState,
            zone_id: u8,
            settings_id: u32,
            theme_id: u8,
            name: felt252,
            mutator_count: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            world
                .write_model(
                    @ZoneConfig {
                        zone_id,
                        settings_id,
                        theme_id,
                        name,
                        mutator_count,
                        enabled: true,
                    },
                );
        }

        fn get_zone(self: @ContractState, zone_id: u8) -> ZoneConfig {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(zone_id)
        }

        fn set_zone_enabled(ref self: ContractState, zone_id: u8, enabled: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let mut zone: ZoneConfig = world.read_model(zone_id);
            zone.enabled = enabled;
            world.write_model(@zone);
        }
    }
}
