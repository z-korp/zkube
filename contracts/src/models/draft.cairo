#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub phase: u8,
    pub picks_made: u8,
    pub choice_1: u8,
    pub choice_2: u8,
    pub choice_3: u8,
    pub reroll_count: u8,
    pub spent_cubes: u16,
}

#[generate_trait]
pub impl DraftStateImpl of DraftStateTrait {
    fn new(game_id: u64, seed: felt252) -> DraftState {
        DraftState {
            game_id,
            seed,
            active: false,
            phase: 0,
            picks_made: 0,
            choice_1: 0,
            choice_2: 0,
            choice_3: 0,
            reroll_count: 0,
            spent_cubes: 0,
        }
    }
}
