use starknet::ContractAddress;
use core::traits::TryInto;
use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

use zkube::models::index::Admin;

mod errors {
    const ADMIN_NOT_EXIST: felt252 = 'Admin: Does not exist';
    const ADMIN_ALREADY_EXIST: felt252 = 'Admin: Already exist';
    const NOT_ADMIN: felt252 = 'Admin: Not an admin';
}

#[generate_trait]
impl AdminImpl of AdminTrait {
    fn new(id: felt252) -> Admin {
        Admin { id, is_set: true }
    }
}

#[generate_trait]
impl AdminAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Admin) {
        assert(self.is_non_zero(), errors::ADMIN_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: Admin) {
        assert(self.is_zero(), errors::ADMIN_ALREADY_EXIST);
    }

    #[inline(always)]
    fn assert_is_admin(self: Admin) {
        assert(self.is_non_zero(), errors::NOT_ADMIN);
    }
}

impl ZeroableAdmin of Zeroable<Admin> {
    fn zero() -> Admin {
        Admin { id: 0, is_set: false }
    }

    fn is_zero(self: Admin) -> bool {
        !self.is_set
    }

    fn is_non_zero(self: Admin) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    use super::{Admin, AdminTrait, ZeroableAdmin};
    use core::Zeroable;

    #[test]
    fn test_admin_new() {
        let admin = AdminTrait::new(1);
        assert(admin.id == 1, 'Admin id should be 1');
        assert(admin.is_set, 'Should be set');
    }

    #[test]
    fn test_admin_zeroable() {
        let zero_admin = ZeroableAdmin::zero();
        assert(zero_admin.is_zero(), 'Should be zero');
        let admin = AdminTrait::new(1);
        assert(admin.is_non_zero(), 'Should be non-zero');
    }
}
