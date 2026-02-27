/// vNext DraftState model — simplified for 3 sequential picks + boss upgrades.

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub draft_type: u8,        // 1=initial, 2=boss_upgrade
    pub picks_made: u8,        // 0, 1, 2, 3 (how many skills picked so far in initial draft)
    pub choice_1: u8,          // skill_id option 1
    pub choice_2: u8,          // skill_id option 2
    pub choice_3: u8,          // skill_id option 3
    pub reroll_count: u8,
    pub spent_cubes: u16,
    pub selected_slot: u8,     // which choice slot was selected (0, 1, or 2)
    pub selected_choice: u8,   // the skill_id that was selected
}

#[generate_trait]
pub impl DraftStateImpl of DraftStateTrait {
    fn new(game_id: u64, seed: felt252) -> DraftState {
        DraftState {
            game_id,
            seed,
            active: false,
            draft_type: 0,
            picks_made: 0,
            choice_1: 0,
            choice_2: 0,
            choice_3: 0,
            reroll_count: 0,
            spent_cubes: 0,
            selected_slot: 0,
            selected_choice: 0,
        }
    }
}
