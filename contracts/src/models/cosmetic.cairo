use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct CosmeticUnlock {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub cosmetic_id: u32,
    pub purchased_at: u64,
}

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct CosmeticDef {
    #[key]
    pub cosmetic_id: u32,
    pub name: felt252,
    pub star_cost: u128,
    pub category: u8,
    pub enabled: bool,
}
