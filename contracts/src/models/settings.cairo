// External imports
use starknet::ContractAddress;

// Internal imports
use zkube::models::index::Settings;
use zkube::types::mode::Mode;
use zkube::constants;

mod errors {
    const INVALID_FREE_DAILY_CREDITS: felt252 = 'Invalid free daily credits';
    const INVALID_DAILY_MODE_PRICE: felt252 = 'Invalid daily mode price';
    const INVALID_NORMAL_MODE_PRICE: felt252 = 'Invalid normal mode prize';
}

#[generate_trait]
impl SettingsImpl of SettingsTrait {
    #[inline(always)]
    fn new() -> Settings {
        Settings {
            id: 1,
            is_set: true,
            zkorp_address: constants::ZKORP_ADDRESS,
            free_daily_credits: constants::DAILY_CREDITS,
            daily_mode_price: constants::DAILY_MODE_PRICE,
            normal_mode_price: constants::NORMAL_MODE_PRICE,
        }
    }

    #[inline(always)]
    fn set_zkorp_address(ref self: Settings, value: ContractAddress) {
        // [Effect] Update zkorp address
        self.zkorp_address = value.into();
    }

    #[inline(always)]
    fn set_free_daily_credits(ref self: Settings, value: u8) {
        // [Check] Value is valid (you might want to add more specific checks)
        assert(value >= 0, errors::INVALID_FREE_DAILY_CREDITS);
        // [Effect] Update free daily credits
        self.free_daily_credits = value;
    }

    #[inline(always)]
    fn set_daily_mode_price(ref self: Settings, value: felt252) {
        let value_u256: u256 = value.into();
        // [Check] Value is valid (you might want to add more specific checks)
        assert(value_u256 >= 0, errors::INVALID_DAILY_MODE_PRICE);
        // [Effect] Update daily mode price
        self.daily_mode_price = value;
    }

    #[inline(always)]
    fn set_normal_mode_price(ref self: Settings, value: felt252) {
        let value_u256: u256 = value.into();
        // [Check] Value is valid (you might want to add more specific checks)
        assert(value_u256 >= 0, errors::INVALID_NORMAL_MODE_PRICE);
        // [Effect] Update normal mode prize
        self.normal_mode_price = value;
    }

    #[inline(always)]
    fn get_mode_price(self: Settings, mode: Mode) -> felt252 {
        match mode {
            Mode::Normal => self.normal_mode_price,
            Mode::Daily => self.daily_mode_price,
            _ => 0,
        }
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
}

impl ZeroableSettingsImpl of core::Zeroable<Settings> {
    #[inline(always)]
    fn zero() -> Settings {
        Settings {
            id: 0,
            is_set: false,
            zkorp_address: 0,
            free_daily_credits: 0,
            daily_mode_price: 0,
            normal_mode_price: 0
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
