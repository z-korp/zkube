// External imports
use starknet::ContractAddress;

// Internal imports
use zkube::models::index::Settings;
use zkube::types::mode::Mode;
use zkube::constants;

mod errors {
    const INVALID_DAILY_MODE_PRICE: felt252 = 'Invalid daily mode price';
    const INVALID_NORMAL_MODE_PRICE: felt252 = 'Invalid normal mode prize';
}

#[generate_trait]
impl SettingsImpl of SettingsTrait {
    #[inline(always)]
    fn new(zkorp_address: ContractAddress) -> Settings {
        // - for now erc721_address is null because we have to deploy the systems first
        // pass them to the erc721 constructor and then pass the erc721 address here
        // by using the set_erc721_address function
        // - same for mint price
        Settings {
            id: 1,
            zkorp_address: zkorp_address.into(),
            erc721_address: 0,
            is_set: true,
            game_price: 0,
            are_games_paused: false,
            are_chests_unlock: false,
        }
    }

    #[inline(always)]
    fn set_game_price(ref self: Settings, value: u256) {
        self.game_price = value.try_into().unwrap();
    }

    #[inline(always)]
    fn set_zkorp_address(ref self: Settings, value: felt252) {
        self.zkorp_address = value;
    }

    #[inline(always)]
    fn set_erc721_address(ref self: Settings, value: felt252) {
        self.erc721_address = value;
    }

    #[inline(always)]
    fn set_are_games_paused(ref self: Settings, value: bool) {
        self.are_games_paused = value;
    }

    #[inline(always)]
    fn set_are_chests_unlock(ref self: Settings, value: bool) {
        self.are_chests_unlock = value;
    }
}

#[generate_trait]
impl SettingsAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Settings) {
        assert(self.is_non_zero(), 'Settings: Does not exist');
    }

    #[inline(always)]
    fn assert_not_exists(self: Settings) {
        assert(self.is_zero(), 'Settings: Already exists');
    }

    #[inline(always)]
    fn assert_are_games_unpaused(self: Settings) {
        assert(!self.are_games_paused, 'Games are paused');
    }

    #[inline(always)]
    fn assert_are_chests_locked(self: Settings) {
        assert(!self.are_chests_unlock, 'Chests are unlocked');
    }
}

impl ZeroableSettingsImpl of core::Zeroable<Settings> {
    #[inline(always)]
    fn zero() -> Settings {
        Settings {
            id: 0,
            zkorp_address: 0,
            erc721_address: 0,
            is_set: false,
            game_price: 0,
            are_games_paused: false,
            are_chests_unlock: false
        }
    }

    #[inline(always)]
    fn is_zero(self: Settings) -> bool {
        !self.is_set
    }

    #[inline(always)]
    fn is_non_zero(self: Settings) -> bool {
        !self.is_zero()
    }
}
