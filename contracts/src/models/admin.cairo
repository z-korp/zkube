use starknet::ContractAddress;
use core::traits::TryInto;
use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

use zkube::models::index::Admin;

mod errors {
    const ADMIN_NOT_EXIST: felt252 = 'Admin: Does not exist';
    const ADMIN_ALREADY_EXIST: felt252 = 'Admin: Already exist';
    const NOT_ADMIN: felt252 = 'Not an admin';
}

#[generate_trait]
impl AdminImpl of AdminTrait {
    fn new(id: felt252) -> Admin {
        Admin { id, is_admin: true }
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
        assert(self.is_admin, errors::NOT_ADMIN);
    }
}

impl ZeroableAdmin of Zeroable<Admin> {
    fn zero() -> Admin {
        Admin { id: 0, is_admin: false }
    }

    fn is_zero(self: Admin) -> bool {
        self.id == 0 && !self.is_admin
    }

    fn is_non_zero(self: Admin) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    use super::{Admin, AdminImpl, ZeroableAdmin};
    use core::Zeroable;

    #[test]
    fn test_admin_new() {
        let admin = AdminImpl::new(1);
        assert(admin.id == 1, 'Admin id should be 1');
        assert(admin.is_admin, 'Should be an admin');
    }

    #[test]
    fn test_admin_set_admin() {
        let mut admin = AdminImpl::new(1);
        assert(admin.is_admin, 'Should be an admin');
        admin.set_admin(false);
        assert(!admin.is_admin, 'Should not be an admin');
    }

    #[test]
    fn test_admin_zeroable() {
        let zero_admin = ZeroableAdmin::zero();
        assert(zero_admin.is_zero(), 'Should be zero');
        let admin = AdminImpl::new(1);
        assert(admin.is_non_zero(), 'Should be non-zero');
    }
}
