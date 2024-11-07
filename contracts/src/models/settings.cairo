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
        Settings { id: 1, is_set: true, zkorp_address: zkorp_address.into(), erc721_address: 0, }
    }

    #[inline(always)]
    fn set_zkorp_address(ref self: Settings, value: felt252) {
        // [Effect] Update zkorp address
        self.zkorp_address = value;
    }

    #[inline(always)]
    fn set_erc721_address(ref self: Settings, value: felt252) {
        // [Effect] Update erc721 address
        self.erc721_address = value;
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
        Settings { id: 0, is_set: false, zkorp_address: 0, erc721_address: 0, }
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
