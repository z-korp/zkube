use alexandria_math::BitShift;
use core::num::traits::Zero;
use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryZoneProgress {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub zone_id: u8,
    pub level_stars: u32,
    pub highest_cleared: u8,
    pub boss_cleared: bool,
    pub perfection_claimed: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct StoryAttempt {
    #[key]
    pub game_id: felt252,
    pub player: ContractAddress,
    pub zone_id: u8,
    pub level: u8,
    pub is_replay: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct ActiveStoryAttempt {
    #[key]
    pub player: ContractAddress,
    pub game_id: felt252,
    pub zone_id: u8,
    pub level: u8,
    pub is_replay: bool,
}

#[generate_trait]
pub impl StoryZoneProgressImpl of StoryZoneProgressTrait {
    fn new(player: ContractAddress, zone_id: u8) -> StoryZoneProgress {
        StoryZoneProgress {
            player,
            zone_id,
            level_stars: 0,
            highest_cleared: 0,
            boss_cleared: false,
            perfection_claimed: false,
        }
    }

    fn exists(self: @StoryZoneProgress) -> bool {
        *self.player != Zero::zero()
            || *self.level_stars != 0
            || *self.highest_cleared > 0
            || *self.boss_cleared
            || *self.perfection_claimed
    }

    fn get_level_stars(self: @StoryZoneProgress, level: u8) -> u8 {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u32 = ((level - 1) * 2).into();
        ((BitShift::shr(*self.level_stars, shift) & 0x3_u32)).try_into().unwrap()
    }

    fn set_level_stars(ref self: StoryZoneProgress, level: u8, stars: u8) {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u32 = ((level - 1) * 2).into();
        let current: u32 = BitShift::shr(self.level_stars, shift) & 0x3_u32;
        let star_val: u32 = (stars & 0x3).into();
        self.level_stars = self.level_stars
            - BitShift::shl(current, shift)
            + BitShift::shl(star_val, shift);
    }
}

#[generate_trait]
pub impl StoryAttemptImpl of StoryAttemptTrait {
    fn exists(self: @StoryAttempt) -> bool {
        *self.game_id != 0 && !(*self.player).is_zero()
    }
}

#[generate_trait]
pub impl ActiveStoryAttemptImpl of ActiveStoryAttemptTrait {
    fn new(
        player: ContractAddress, game_id: felt252, zone_id: u8, level: u8, is_replay: bool,
    ) -> ActiveStoryAttempt {
        ActiveStoryAttempt { player, game_id, zone_id, level, is_replay }
    }

    fn empty(player: ContractAddress) -> ActiveStoryAttempt {
        ActiveStoryAttempt { player, game_id: 0, zone_id: 0, level: 0, is_replay: false }
    }

    fn exists(self: @ActiveStoryAttempt) -> bool {
        *self.game_id != 0
    }
}

#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use super::{ActiveStoryAttemptTrait, StoryZoneProgressTrait};

    #[test]
    fn test_story_progress_level_stars_roundtrip() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let mut progress = StoryZoneProgressTrait::new(player, 1);

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
        let active = ActiveStoryAttemptTrait::empty(player);
        assert!(!active.exists(), "empty active story game should not exist");
    }
}
