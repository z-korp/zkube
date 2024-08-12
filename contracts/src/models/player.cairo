// External imports

use alexandria_math::bitmap::Bitmap;

// Inernal imports

use zkube::constants;
use zkube::models::index::Player;
use zkube::helpers::math::Math;

mod errors {
    const PLAYER_NOT_EXIST: felt252 = 'Player: Does not exist';
    const PLAYER_ALREADY_EXIST: felt252 = 'Player: Already exist';
    const INVALID_NAME: felt252 = 'Player: Invalid name';
    const INVALID_MASTER: felt252 = 'Player: Invalid master';
}

#[generate_trait]
impl PlayerImpl of PlayerTrait {
    #[inline(always)]
    fn new(id: felt252, name: felt252) -> Player {
        // [Check] Name is valid
        assert(name != 0, errors::INVALID_NAME);
        // [Return] Player
        Player { id, game_id: 0, hammer_bonus: 0, wave_bonus: 0, totem_bonus: 0, name, }
    }

    #[inline(always)]
    fn rename(ref self: Player, name: felt252) {
        // [Check] Name is valid
        assert(name != 0, errors::INVALID_NAME);
        // [Effect] Change the name
        self.name = name;
    }

    #[inline(always)]
    fn update(ref self: Player, hammer: u8, totem: u8, wave: u8) {
        self.hammer_bonus = Math::max(self.hammer_bonus, hammer);
        self.totem_bonus = Math::max(self.totem_bonus, totem);
        self.wave_bonus = Math::max(self.wave_bonus, wave);
    }
}

#[generate_trait]
impl PlayerAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Player) {
        assert(self.is_non_zero(), errors::PLAYER_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: Player) {
        assert(self.is_zero(), errors::PLAYER_ALREADY_EXIST);
    }
}

impl ZeroablePlayerImpl of core::Zeroable<Player> {
    #[inline(always)]
    fn zero() -> Player {
        Player { id: 0, game_id: 0, hammer_bonus: 0, wave_bonus: 0, totem_bonus: 0, name: 0 }
    }

    #[inline(always)]
    fn is_zero(self: Player) -> bool {
        0 == self.name
    }

    #[inline(always)]
    fn is_non_zero(self: Player) -> bool {
        !self.is_zero()
    }
}
