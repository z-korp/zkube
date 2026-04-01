/// Data-driven mutator definition.
///
/// Values use neutral defaults when omitted:
/// - bias-encoded fields: 128 = no change
/// - multipliers: 100 = 1.0×
/// - bonus_type: 0 = none
/// - trigger_type: 0 = disabled
/// - trigger_threshold: 0 = disabled
/// - line_clear_bonus: 0 = disabled
/// - perfect_clear_bonus: 0 = disabled
/// - starting_rows: 0 = default (4)
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct MutatorDef {
    #[key]
    pub mutator_id: u8,
    pub name: felt252,
    pub zone_id: u8,
    pub moves_modifier: u8,
    pub ratio_modifier: u8,
    pub difficulty_offset: u8,
    pub combo_score_mult_x100: u16,
    pub star_threshold_modifier: u8,
    pub endless_ramp_mult_x100: u16,
    pub bonus_type: u8,
    pub trigger_type: u8,
    pub trigger_threshold: u8,
    pub line_clear_bonus: u8,
    pub perfect_clear_bonus: u8,
    pub starting_rows: u8,
}

#[generate_trait]
pub impl MutatorDefImpl of MutatorDefTrait {
    #[inline(always)]
    fn exists(self: @MutatorDef) -> bool {
        *self.name != 0 || *self.zone_id != 0 || *self.moves_modifier != 0
            || *self.ratio_modifier != 0 || *self.difficulty_offset != 0
            || *self.combo_score_mult_x100 != 0 || *self.star_threshold_modifier != 0
            || *self.endless_ramp_mult_x100 != 0 || *self.bonus_type != 0
            || *self.trigger_type != 0 || *self.trigger_threshold != 0
            || *self.line_clear_bonus != 0 || *self.perfect_clear_bonus != 0
            || *self.starting_rows != 0
    }
}
