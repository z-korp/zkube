use core::traits::TryInto;
use starknet::info::get_block_timestamp;
use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

use zkube::models::index::Chest;

mod errors {
    const CHEST_NOT_EXIST: felt252 = 'Chest: Does not exist';
    const CHEST_ALREADY_EXIST: felt252 = 'Chest: Already exist';
    const CHEST_IS_NOT_COMPLETE: felt252 = 'Chest: Is not complete';
}


#[generate_trait]
impl ChestImpl of ChestTrait {
    fn new(id: u32, point_target: u32, prize: felt252) -> Chest {
        Chest { id, point_target, points: 0, prize }
    }

    fn add_points(ref self: Chest, points: u32) {
        self.points += points;
    }

    fn add_prize(ref self: Chest, prize: felt252) {
        self.prize += prize;
    }

    fn is_complete(self: Chest) -> bool {
        self.points >= self.point_target
    }

    fn remaining_points(self: Chest) -> u32 {
        if self.is_complete() {
            0
        } else {
            self.point_target - self.points
        }
    }
}

#[generate_trait]
impl ChestAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Chest) {
        assert(self.is_non_zero(), errors::CHEST_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: Chest) {
        assert(self.is_zero(), errors::CHEST_ALREADY_EXIST);
    }

    #[inline(always)]
    fn assert_complete(self: Chest) {
        assert(self.is_complete(), errors::CHEST_IS_NOT_COMPLETE);
    }

    #[inline(always)]
    fn assert_not_complete(self: Chest) {
        assert(!self.is_complete(), errors::CHEST_IS_NOT_COMPLETE);
    }
}

impl ZeroableChest of Zeroable<Chest> {
    fn zero() -> Chest {
        Chest { id: 0, point_target: 0, points: 0, prize: 0 }
    }

    fn is_zero(self: Chest) -> bool {
        self.id == 0 && self.point_target == 0 && self.points == 0 && self.prize == 0
    }

    fn is_non_zero(self: Chest) -> bool {
        !self.is_zero()
    }
}


#[cfg(test)]
mod tests {
    use super::{
        Chest, ChestImpl, Participation, ParticipationImpl, ZeroableChest, ZeroableParticipation
    };
    use core::Zeroable;

    #[test]
    fn test_chest_new() {
        let chest = ChestImpl::new(1, 100, 1000);
        assert(chest.id == 1, 'Chest id should be 1');
        assert(chest.point_target == 100, 'Point target should be 100');
        assert(chest.points == 0, 'Initial points should be 0');
        assert(chest.prize == 1000, 'Prize should be 1000');
    }

    #[test]
    fn test_chest_add_points() {
        let mut chest = ChestImpl::new(1, 100, 1000);
        chest.add_points(50);
        assert(chest.points == 50, 'Points should be 50');
        chest.add_points(60);
        assert(chest.points == 110, 'Points should be 110');
    }

    #[test]
    fn test_chest_is_complete() {
        let mut chest = ChestImpl::new(1, 100, 1000);
        assert(!chest.is_complete(), 'Chest should not be complete');
        chest.add_points(100);
        assert(chest.is_complete(), 'Chest should be complete');
    }

    #[test]
    fn test_chest_remaining_points() {
        let mut chest = ChestImpl::new(1, 100, 1000);
        assert(chest.remaining_points() == 100, 'Remaining should be 100');
        chest.add_points(60);
        assert(chest.remaining_points() == 40, 'Remaining should be 40');
        chest.add_points(50);
        assert(chest.remaining_points() == 0, 'Remaining should be 0');
    }
}
