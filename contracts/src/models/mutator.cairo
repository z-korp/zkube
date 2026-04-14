/// Data-driven mutator definition.
///
/// Used for both active mutators (bonus profiles) and passive mutators (stat modifiers).
/// Active mutators: `bonus_type` and the trigger fields are populated; stat fields neutral.
/// Passive mutators: stat fields populated; `bonus_type = 0` and all trigger thresholds zero.
///
/// Stat field defaults when omitted:
/// - bias-encoded fields: 128 = no change
/// - multipliers: 100 = 1.0×
/// - line_clear_bonus: 0 = disabled
/// - perfect_clear_bonus: 0 = disabled
/// - starting_rows: 0 = default (4)
///
/// Bonus block:
/// - `bonus_type` identifies the tool the zone's active mutator grants (1=Hammer,
///   2=Totem, 3=Wave). Set to 0 on passive mutators and zones without an active.
/// - Each of `combo_trigger_threshold` / `lines_trigger_threshold` /
///   `score_trigger_threshold` is the "roll pool": at create_run we pick one
///   uniformly from the fields with a non-zero value. That one trigger drives
///   charging for the whole run. `starting_charges` is applied to whichever
///   trigger was rolled.
///
/// Two score multipliers (passive):
/// - `score_mult_x100`: flat multiplier applied to every move's earned points.
/// - `combo_bonus_mult_x100`: multiplier applied ONLY to the per-move combo bonus
///   (triggered when `lines_cleared > 1`). At 100 the base bonus is
///   `combo_counter * lines_cleared` points; at 200 it's twice that.
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct MutatorDef {
    #[key]
    pub mutator_id: u8,
    pub zone_id: u8,
    // === Stat Modifier Fields (passive mutator) ===
    pub moves_modifier: u8,
    pub ratio_modifier: u8,
    pub difficulty_offset: u8,
    pub score_mult_x100: u16,
    pub star_threshold_modifier: u8,
    pub endless_ramp_mult_x100: u16,
    pub line_clear_bonus: u8,
    pub perfect_clear_bonus: u8,
    pub starting_rows: u8,
    pub combo_bonus_mult_x100: u16,
    // === Active Mutator (single bonus, rolled trigger) ===
    pub bonus_type: u8,
    pub combo_trigger_threshold: u8,
    pub lines_trigger_threshold: u8,
    pub score_trigger_threshold: u8,
    pub starting_charges: u8,
}

#[generate_trait]
pub impl MutatorDefImpl of MutatorDefTrait {
    #[inline(always)]
    fn exists(self: @MutatorDef) -> bool {
        *self.zone_id != 0
            || *self.moves_modifier != 0
            || *self.ratio_modifier != 0
            || *self.difficulty_offset != 0
            || *self.score_mult_x100 != 0
            || *self.star_threshold_modifier != 0
            || *self.endless_ramp_mult_x100 != 0
            || *self.line_clear_bonus != 0
            || *self.perfect_clear_bonus != 0
            || *self.starting_rows != 0
            || *self.combo_bonus_mult_x100 != 0
            || *self.bonus_type != 0
    }
}
