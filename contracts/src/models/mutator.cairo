/// Data-driven mutator definition.
///
/// Used for both active mutators (bonus profiles) and passive mutators (stat modifiers).
/// Active mutators: bonus fields populated, stat fields neutral (128/100/0).
/// Passive mutators: stat fields populated, bonus fields all 0.
///
/// Stat field defaults when omitted:
/// - bias-encoded fields: 128 = no change
/// - multipliers: 100 = 1.0×
/// - line_clear_bonus: 0 = disabled
/// - perfect_clear_bonus: 0 = disabled
/// - starting_rows: 0 = default (4)
///
/// Bonus field defaults: 0 = no bonus / disabled.
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct MutatorDef {
    #[key]
    pub mutator_id: u8,
    pub name: felt252,
    pub zone_id: u8,
    // === Stat Modifier Fields (passive mutator) ===
    pub moves_modifier: u8,
    pub ratio_modifier: u8,
    pub difficulty_offset: u8,
    pub combo_score_mult_x100: u16,
    pub star_threshold_modifier: u8,
    pub endless_ramp_mult_x100: u16,
    pub line_clear_bonus: u8,
    pub perfect_clear_bonus: u8,
    pub starting_rows: u8,
    // === Bonus Slot Fields (active mutator) ===
    // type: 0=None, 1=Hammer, 2=Totem, 3=Wave
    // trigger_type: 1=combo, 2=lines, 3=score
    pub bonus_1_type: u8,
    pub bonus_1_trigger_type: u8,
    pub bonus_1_trigger_threshold: u8,
    pub bonus_1_starting_charges: u8,
    pub bonus_2_type: u8,
    pub bonus_2_trigger_type: u8,
    pub bonus_2_trigger_threshold: u8,
    pub bonus_2_starting_charges: u8,
    pub bonus_3_type: u8,
    pub bonus_3_trigger_type: u8,
    pub bonus_3_trigger_threshold: u8,
    pub bonus_3_starting_charges: u8,
}

#[generate_trait]
pub impl MutatorDefImpl of MutatorDefTrait {
    #[inline(always)]
    fn exists(self: @MutatorDef) -> bool {
        *self.name != 0
            || *self.zone_id != 0
            || *self.moves_modifier != 0
            || *self.ratio_modifier != 0
            || *self.difficulty_offset != 0
            || *self.combo_score_mult_x100 != 0
            || *self.star_threshold_modifier != 0
            || *self.endless_ramp_mult_x100 != 0
            || *self.line_clear_bonus != 0
            || *self.perfect_clear_bonus != 0
            || *self.starting_rows != 0
    }
}
