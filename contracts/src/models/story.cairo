use alexandria_math::BitShift;
use core::num::traits::Zero;
use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryProgress {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub zone_id: u8,
    pub level_stars: felt252,
    pub highest_cleared: u8,
    pub boss_cleared: bool,
    pub perfection_claimed: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryGame {
    #[key]
    pub game_id: felt252,
    pub player: ContractAddress,
    pub zone_id: u8,
    pub level: u8,
    pub is_replay: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct ActiveStoryGame {
    #[key]
    pub player: ContractAddress,
    pub game_id: felt252,
    pub zone_id: u8,
    pub level: u8,
    pub is_replay: bool,
}

#[generate_trait]
pub impl StoryProgressImpl of StoryProgressTrait {
    fn new(player: ContractAddress, zone_id: u8) -> StoryProgress {
        StoryProgress {
            player, zone_id, level_stars: 0, highest_cleared: 0, boss_cleared: false,
            perfection_claimed: false,
        }
    }

    fn exists(self: @StoryProgress) -> bool {
        *self.player != Zero::zero() || *self.level_stars != 0 || *self.highest_cleared > 0
            || *self.boss_cleared || *self.perfection_claimed
    }

    fn get_level_stars(self: @StoryProgress, level: u8) -> u8 {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u8 = (level - 1) * 2;
        let packed: u256 = (*self.level_stars).into();
        (BitShift::shr(packed, shift.into()) & 0x3).try_into().unwrap()
    }

    fn set_level_stars(ref self: StoryProgress, level: u8, stars: u8) {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u8 = (level - 1) * 2;
        let mut packed: u256 = self.level_stars.into();
        let current: u256 = BitShift::shr(packed, shift.into()) & 0x3;
        packed = packed - BitShift::shl(current, shift.into());
        packed = packed | BitShift::shl((stars & 0x3).into(), shift.into());
        self.level_stars = packed.try_into().unwrap();
    }
}

#[generate_trait]
pub impl StoryGameImpl of StoryGameTrait {
    fn exists(self: @StoryGame) -> bool {
        *self.game_id != 0 && !(*self.player).is_zero()
    }
}

#[generate_trait]
pub impl ActiveStoryGameImpl of ActiveStoryGameTrait {
    fn new(player: ContractAddress, game_id: felt252, zone_id: u8, level: u8, is_replay: bool) -> ActiveStoryGame {
        ActiveStoryGame { player, game_id, zone_id, level, is_replay }
    }

    fn empty(player: ContractAddress) -> ActiveStoryGame {
        ActiveStoryGame { player, game_id: 0, zone_id: 0, level: 0, is_replay: false }
    }

    fn exists(self: @ActiveStoryGame) -> bool {
        *self.game_id != 0
    }
}

#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use super::{StoryProgressTrait, ActiveStoryGameTrait};

    #[test]
    fn test_story_progress_level_stars_roundtrip() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let mut progress = StoryProgressTrait::new(player, 1);

        progress.set_level_stars(1, 3);
        progress.set_level_stars(6, 2);
        progress.set_level_stars(10, 1);

        assert!(progress.get_level_stars(1) == 3, "level 1 stars");
        assert!(progress.get_level_stars(6) == 2, "level 6 stars");
        assert!(progress.get_level_stars(10) == 1, "level 10 stars");
        assert!(progress.get_level_stars(2) == 0, "unset levels should be zero");
    }

    #[test]
    fn test_active_story_game_empty_is_not_active() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let active = ActiveStoryGameTrait::empty(player);
        assert!(!active.exists(), "empty active story game should not exist");
    }
}
