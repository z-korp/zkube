#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct MutatorDef {
    #[key]
    pub mutator_id: u8,
    pub name: felt252,
    pub zone_id: u8,
    // Signed fields encoded with bias: 128 = 0, 129 = +1, 127 = -1
    pub moves_modifier_encoded: u8,
    pub ratio_modifier_encoded: u8,
    pub difficulty_offset_encoded: u8,
    pub combo_score_mult_x100: u16,
    pub star_threshold_modifier_encoded: u8,
    pub endless_ramp_mult_x100: u16,
}

#[generate_trait]
pub impl MutatorDefImpl of MutatorDefTrait {
    fn exists(self: @MutatorDef) -> bool {
        *self.zone_id != 0
    }

    fn get_moves_modifier(self: @MutatorDef) -> (bool, u8) {
        Self::decode_signed_u8(*self.moves_modifier_encoded)
    }

    fn decode_signed_u8(value: u8) -> (bool, u8) {
        if value >= 128 {
            (false, value - 128)
        } else {
            (true, 128 - value)
        }
    }
}
