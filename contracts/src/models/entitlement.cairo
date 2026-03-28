use starknet::ContractAddress;

/// Records that a player has purchased access to a specific map (settings_id)
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct MapEntitlement {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub settings_id: u32,
    /// Timestamp of purchase (non-zero = owns the map)
    pub purchased_at: u64,
}

#[generate_trait]
pub impl MapEntitlementImpl of MapEntitlementTrait {
    /// Check if this entitlement exists (player has purchased the map)
    #[inline(always)]
    fn exists(self: @MapEntitlement) -> bool {
        *self.purchased_at != 0
    }
}
