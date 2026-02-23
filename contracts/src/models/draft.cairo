use alexandria_math::BitShift;

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct DraftState {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub active: bool,
    pub event_slot: u8,
    pub event_type: u8,
    pub trigger_level: u8,
    pub zone: u8,
    pub choice_1: u16,
    pub choice_2: u16,
    pub choice_3: u16,
    pub reroll_1: u8,
    pub reroll_2: u8,
    pub reroll_3: u8,
    pub spent_cubes: u16,
    pub completed_mask: u16,
    pub selected_picks: felt252,
    pub selected_slot: u8,
    pub selected_choice: u16,
}

#[generate_trait]
pub impl DraftStateImpl of DraftStateTrait {
    fn new(game_id: u64, seed: felt252) -> DraftState {
        DraftState {
            game_id,
            seed,
            active: false,
            event_slot: 0,
            event_type: 0,
            trigger_level: 0,
            zone: 0,
            choice_1: 0,
            choice_2: 0,
            choice_3: 0,
            reroll_1: 0,
            reroll_2: 0,
            reroll_3: 0,
            spent_cubes: 0,
            completed_mask: 0,
            selected_picks: 0,
            selected_slot: 0,
            selected_choice: 0,
        }
    }

    fn is_slot_completed(self: @DraftState, slot: u8) -> bool {
        assert!(slot < 16, "Invalid slot");
        let bit: u16 = (BitShift::shl(1_u256, slot.into()) & 0xFFFF_u256).try_into().unwrap();
        ((*self.completed_mask) & bit) != 0
    }

    fn mark_slot_completed(ref self: DraftState, slot: u8) {
        assert!(slot < 16, "Invalid slot");
        let bit: u16 = (BitShift::shl(1_u256, slot.into()) & 0xFFFF_u256).try_into().unwrap();
        self.completed_mask = self.completed_mask | bit;
    }

    fn get_pick_for_slot(self: @DraftState, slot: u8) -> u16 {
        assert!(slot < 10, "Invalid draft slot");
        let packed: u256 = (*self.selected_picks).into();
        let shifted = BitShift::shr(packed, (slot * 16).into());
        (shifted & 0xFFFF_u256).try_into().unwrap()
    }

    fn set_pick_for_slot(ref self: DraftState, slot: u8, value: u16) {
        assert!(slot < 10, "Invalid draft slot");
        let mut packed: u256 = self.selected_picks.into();
        let shift: u8 = slot * 16;
        let mask: u256 = BitShift::shl(0xFFFF_u256, shift.into());
        packed = packed & (~mask);
        packed = packed | BitShift::shl(value.into(), shift.into());
        self.selected_picks = packed.try_into().unwrap();
    }
}
