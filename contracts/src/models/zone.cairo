#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct ZoneConfig {
    #[key]
    pub zone_id: u8,
    pub settings_id: u32,
    pub theme_id: u8,
    pub name: felt252,
    pub mutator_count: u8,
    pub enabled: bool,
}

#[generate_trait]
pub impl ZoneConfigImpl of ZoneConfigTrait {
    fn exists(self: @ZoneConfig) -> bool {
        *self.settings_id != 0
    }
}
