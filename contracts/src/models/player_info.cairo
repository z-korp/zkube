// Core imports
use core::traits::Into;

// Inernal imports
use zkube::models::index::PlayerInfo;
use zkube::helpers::math::Math;

mod errors {
    const PLAYERINFO_NOT_EXIST: felt252 = 'PlayerInfo: Does not exist';
    const PLAYERINFO_ALREADY_EXIST: felt252 = 'PlayerInfo: Already exist';
    const INVALID_NAME: felt252 = 'PlayerInfo: Invalid name';
    const INVALID_MASTER: felt252 = 'PlayerInfo: Invalid master';
}

#[generate_trait]
impl PlayerInfoImpl of PlayerInfoTrait {
    #[inline(always)]
    fn new(address: felt252, id: u32, name: felt252) -> PlayerInfo {
        // [Retur] PlayerInfo
        PlayerInfo { address, name, player_id: id }
    }

    #[inline(always)]
    fn rename(ref self: PlayerInfo, name: felt252) {
        // [Check] Name is valid
        assert(name != 0, errors::INVALID_NAME);
        // [Effect] Change the name
        self.name = name;
    }
}

#[generate_trait]
impl PlayerInfoAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: PlayerInfo) {
        assert(self.is_non_zero(), errors::PLAYERINFO_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: PlayerInfo) {
        assert(self.is_zero(), errors::PLAYERINFO_ALREADY_EXIST);
    }
}

impl ZeroablePlayerInfoTrait of core::Zeroable<PlayerInfo> {
    #[inline(always)]
    fn zero() -> PlayerInfo {
        PlayerInfo { address: 0, name: 0, player_id: 0 }
    }

    #[inline(always)]
    fn is_zero(self: PlayerInfo) -> bool {
        self.name == 0
    }

    #[inline(always)]
    fn is_non_zero(self: PlayerInfo) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{PlayerInfo, PlayerInfoTrait, PlayerInfoAssert};

    #[test]
    fn test_player_initialization() {
        let player_address: felt252 = 12345; // Mock address
        let id: u32 = 1;
        let player_name: felt252 = 12345; // Mock name

        let player = PlayerInfoTrait::new(player_address, id, player_name);

        assert_eq!(player.address, player_address);
        assert_eq!(player.player_id, id);
        assert_eq!(player.name, player_name);
    }
}
